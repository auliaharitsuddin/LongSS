// Background service worker

// Max canvas area Chrome allows for a single 2D canvas (safely under the
// real ~268M px limit). Long/infinite pages get clamped to this instead of
// throwing "Failed to construct 'OffscreenCanvas'" or running out of memory.
const MAX_CANVAS_AREA = 60_000_000;

// In-memory state for the currently running auto-scroll capture (there can
// only be one at a time).
let scrollState = null; // { tabId, stopRequested, startTime, keepAlivePort }

// Frame options requested for an in-progress area selection, keyed by tabId.
const pendingFrameOptionsByTab = new Map();

// Last finished capture, so a popup that was closed while a capture was
// running (area-selection / auto-scroll both require the user to interact
// with the page, which closes the popup) can still show the preview when
// reopened.
let lastCaptureResult = null;

// A long-lived port from the content script keeps this service worker alive
// for the duration of the auto-scroll loop - without it Chrome can suspend
// the worker mid-capture since a plain onMessage handler doesn't count as
// "active work" once its own call stack returns.
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'longss-scroll-keepalive') {
    port.onDisconnect.addListener(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureFullPage') {
    handleFullPageCapture(message.tabId);
  } else if (message.action === 'startAreaSelection') {
    handleStartAreaSelection(message.tabId, message.frameOptions);
  } else if (message.action === 'areaSelected') {
    handleAreaSelected(sender.tab, message.rect, message.devicePixelRatio);
  } else if (message.action === 'areaSelectionCancelled') {
    if (sender.tab) pendingFrameOptionsByTab.delete(sender.tab.id);
  } else if (message.action === 'startScrollCapture') {
    handleStartScrollCapture(message.tabId);
  } else if (message.action === 'stopScrollCaptureRequest') {
    if (scrollState) scrollState.stopRequested = true;
  } else if (message.action === 'getScrollCaptureState') {
    sendResponse({ active: !!scrollState });
    return true;
  } else if (message.action === 'getPendingCapture') {
    sendResponse(lastCaptureResult);
    lastCaptureResult = null;
    return true;
  } else if (message.action === 'downloadImage') {
    downloadImage(message.dataUrl, message.filename, message.saveAs);
  }
});

// Send a message to the content script, self-healing if it's not there to
// receive it. This covers the common case of the extension having been
// reloaded (or just installed) after the tab was already open: the tab's
// manifest-declared content script instance, if any, is orphaned and can no
// longer talk to this (new) background context, so chrome.tabs.sendMessage
// fails with "Receiving end does not exist". Re-injecting content.js/.css
// on demand fixes that without requiring the user to manually refresh.
async function sendToContentWithRetry(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    await ensureContentScript(tabId);
    await new Promise(resolve => setTimeout(resolve, 150));
    return await chrome.tabs.sendMessage(tabId, message);
  }
}

async function ensureContentScript(tabId) {
  try {
    await chrome.scripting.insertCSS({ target: { tabId }, files: ['content.css'] });
  } catch (e) {
    // Already inserted, or the page doesn't allow it - either way, proceed.
  }
  await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
}

// Capture the visible tab, retrying if we hit Chrome's rate limit
// (chrome.tabs.captureVisibleTab allows ~2 calls/sec).
async function captureVisibleTabSafe(windowId) {
  const maxAttempts = 6;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await chrome.tabs.captureVisibleTab(windowId, { format: 'png' });
    } catch (error) {
      const msg = error && error.message ? error.message : '';
      const isRateLimited = /MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND/i.test(msg);
      if (isRateLimited && attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 550));
        continue;
      }
      throw error;
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// All page geometry is read in CSS pixels; the captured bitmaps are in device
// pixels (CSS * devicePixelRatio), so every conversion to canvas coordinates
// has to multiply by dpr. Getting this wrong is what used to crop the right
// edge off every stitched image.
//
// clientWidth/clientHeight (not innerWidth/innerHeight) are used as the tile
// size on purpose: they exclude the scrollbar gutters, which would otherwise
// get stitched into the middle of the output.
async function getPageMetrics(tabId) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const de = document.documentElement;
      const body = document.body;
      return {
        dpr: window.devicePixelRatio || 1,
        scrollWidth: Math.max(de.scrollWidth, body ? body.scrollWidth : 0, de.clientWidth),
        scrollHeight: Math.max(de.scrollHeight, body ? body.scrollHeight : 0, de.clientHeight),
        viewportWidth: de.clientWidth,
        viewportHeight: de.clientHeight,
        scrollTop: window.pageYOffset || de.scrollTop || 0,
        scrollLeft: window.pageXOffset || de.scrollLeft || 0
      };
    }
  });
  return result.result;
}

// Scroll and report where the page *actually* landed - a request can be
// clamped (end of page), snapped, or ignored by a scroll-jacking page, and
// stitching at the requested offset instead of the real one is what makes
// the seam between two screens jump.
async function scrollAndMeasure(tabId, left, top) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: async (l, t) => {
      window.scrollTo({ left: l, top: t, behavior: 'instant' });
      // Two frames: one for the scroll to apply, one for sticky/lazy layout
      // to settle at the new position.
      await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
      const de = document.documentElement;
      return {
        left: window.pageXOffset || de.scrollLeft || 0,
        top: window.pageYOffset || de.scrollTop || 0
      };
    },
    args: [left, top]
  });
  return result.result;
}

// Sticky/fixed headers and floating bottom bars stay glued to the viewport
// while we scroll, so they'd be baked into every single screen - repeated
// down the stitched image and hiding the content behind them. Measure their
// height once so each screen after the first can be cropped past them.
async function measureStickyBands(tabId) {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const de = document.documentElement;
        const vw = de.clientWidth;
        const vh = de.clientHeight;
        const maxBand = vh * 0.35; // anything bigger isn't a bar, it's content
        let top = 0;
        let bottom = 0;

        const isPinned = (el) => {
          const pos = getComputedStyle(el).position;
          return pos === 'fixed' || pos === 'sticky';
        };

        for (const x of [vw * 0.15, vw * 0.5, vw * 0.85]) {
          for (const el of document.elementsFromPoint(Math.round(x), 2)) {
            if (el.id && el.id.startsWith('longss-')) continue;
            if (!isPinned(el)) continue;
            const r = el.getBoundingClientRect();
            if (r.top <= 2 && r.bottom > top && r.bottom <= maxBand) top = r.bottom;
          }
          for (const el of document.elementsFromPoint(Math.round(x), vh - 2)) {
            if (el.id && el.id.startsWith('longss-')) continue;
            if (!isPinned(el)) continue;
            const r = el.getBoundingClientRect();
            const band = vh - r.top;
            if (r.bottom >= vh - 2 && band > bottom && band <= maxBand) bottom = band;
          }
        }
        return { top: Math.ceil(top), bottom: Math.ceil(bottom) };
      }
    });
    return result.result || { top: 0, bottom: 0 };
  } catch (e) {
    return { top: 0, bottom: 0 };
  }
}

// The recording overlay is a fixed element on the page, so captureVisibleTab
// sees it too. Hide it for the instant the shot is taken, then bring the Stop
// button back.
async function setOverlayVisible(tabId, visible) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (v) => {
        const el = document.getElementById('longss-recording-overlay');
        if (el) el.style.visibility = v ? 'visible' : 'hidden';
      },
      args: [visible]
    });
  } catch (e) {
    // Overlay not present (full-page capture) - nothing to hide.
  }
}

async function captureWithoutOverlay(tab) {
  await setOverlayVisible(tab.id, false);
  try {
    return await captureVisibleTabSafe(tab.windowId);
  } finally {
    await setOverlayVisible(tab.id, true);
  }
}

// Clamp a requested canvas size down to something Chrome can actually
// allocate. Returns the (possibly reduced) height and whether it was cut.
function capCanvasHeight(width, height) {
  if (width * height <= MAX_CANVAS_AREA) {
    return { height, truncated: false };
  }
  return { height: Math.max(Math.floor(MAX_CANVAS_AREA / width), 1), truncated: true };
}

// ---------------- Full page capture ----------------
async function handleFullPageCapture(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const metrics = await getPageMetrics(tabId);

    const result = await captureGrid(tab, {
      metrics,
      startTop: 0,
      startLeft: 0,
      limitHeight: metrics.scrollHeight,
      settleWait: 450
    });

    sendCaptureReady(
      result.dataUrl,
      `longss-fullpage-${Date.now()}.png`,
      'fullPage',
      result.truncated
    );
  } catch (error) {
    console.error('Full page capture error:', error);
    chrome.runtime.sendMessage({ action: 'fullPageComplete', error: describeError(error) });
  }
}

// ---------------- Framed screenshot (Snipping-Tool style area selection) ----------------
async function handleStartAreaSelection(tabId, frameOptions) {
  pendingFrameOptionsByTab.set(tabId, frameOptions || {});
  try {
    await sendToContentWithRetry(tabId, { action: 'beginAreaSelection' });
  } catch (error) {
    pendingFrameOptionsByTab.delete(tabId);
    console.error('startAreaSelection failed:', error);
    chrome.runtime.sendMessage({
      action: 'framedComplete',
      error: describeError(error)
    });
  }
}

async function handleAreaSelected(tab, rect, devicePixelRatio) {
  if (!tab) return;
  const frameOptions = pendingFrameOptionsByTab.get(tab.id) || {};
  pendingFrameOptionsByTab.delete(tab.id);

  try {
    const dataUrl = await captureVisibleTabSafe(tab.windowId);
    const croppedDataUrl = await cropImage(dataUrl, rect, devicePixelRatio || 1);
    const framedDataUrl = await addFrameToImage(croppedDataUrl, frameOptions);
    sendCaptureReady(framedDataUrl, `longss-framed-${Date.now()}.png`, 'framed', false);
  } catch (error) {
    console.error('Framed capture error:', error);
    chrome.runtime.sendMessage({ action: 'framedComplete', error: describeError(error) });
  }
}

// Service workers have no DOM, so `new Image()` doesn't exist here - decode
// via createImageBitmap instead (fetch() does support data: URLs).
async function dataUrlToImageBitmap(dataUrl) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return createImageBitmap(blob);
}

async function blobToDataUrl(blob) {
  const buffer = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return `data:image/png;base64,${btoa(binary)}`;
}

async function cropImage(dataUrl, rect, devicePixelRatio) {
  const bitmap = await dataUrlToImageBitmap(dataUrl);
  try {
    const sx = Math.max(Math.round(rect.x * devicePixelRatio), 0);
    const sy = Math.max(Math.round(rect.y * devicePixelRatio), 0);
    const sw = Math.max(Math.round(rect.width * devicePixelRatio), 1);
    const sh = Math.max(Math.round(rect.height * devicePixelRatio), 1);

    const canvas = new OffscreenCanvas(sw, sh);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);

    const blob = await canvas.convertToBlob({ type: 'image/png' });
    return blobToDataUrl(blob);
  } finally {
    bitmap.close();
  }
}

// ---------------- Auto scroll capture ----------------
// Runs entirely in the background: it drives the scrolling itself (so the
// popup doesn't need to stay open/focused), waits for lazy-loaded content
// (infinite-scroll feeds, YouTube, etc.), and auto-stops after
// SCROLL_MAX_DURATION if the user doesn't stop it manually first.
const SCROLL_MAX_DURATION = 10000;
const SCROLL_MAX_SCREENS = 30;
const SCROLL_SETTLE_WAIT = 450;

async function handleStartScrollCapture(tabId) {
  if (scrollState) return; // already running

  scrollState = { tabId, stopRequested: false, startTime: Date.now() };
  chrome.runtime.sendMessage({ action: 'scrollCaptureStarted' });

  try {
    // The content script opens its own keepalive port (see 'showScrollOverlay'
    // handling in content.js) to keep this service worker from being
    // suspended mid-loop, so this must actually reach a live listener -
    // self-heal by re-injecting the content script if the tab's copy is
    // orphaned (e.g. extension was reloaded while the tab was open).
    await sendToContentWithRetry(tabId, { action: 'showScrollOverlay' });
  } catch (error) {
    console.error('Could not show scroll overlay:', error);
    chrome.runtime.sendMessage({ action: 'scrollComplete', error: describeError(error) });
    scrollState = null;
    return;
  }

  try {
    await runScrollCaptureLoop(tabId);
  } catch (error) {
    console.error('Scroll capture error:', error);
    chrome.runtime.sendMessage({ action: 'scrollComplete', error: describeError(error) });
  } finally {
    chrome.tabs.sendMessage(tabId, { action: 'hideScrollOverlay' }).catch(() => {});
    scrollState = null;
  }
}

async function runScrollCaptureLoop(tabId) {
  const tab = await chrome.tabs.get(tabId);
  const metrics = await getPageMetrics(tabId);

  const result = await captureGrid(tab, {
    metrics,
    startTop: metrics.scrollTop,
    startLeft: metrics.scrollLeft,
    limitHeight: Infinity,
    maxRows: SCROLL_MAX_SCREENS,
    settleWait: SCROLL_SETTLE_WAIT,
    shouldStop: () => scrollState.stopRequested,
    hasTimedOut: () => Date.now() - scrollState.startTime > SCROLL_MAX_DURATION,
    onProgress: (rows) => {
      chrome.runtime.sendMessage({
        action: 'scrollCaptureProgress',
        elapsed: Date.now() - scrollState.startTime,
        screens: rows
      });
      chrome.tabs.sendMessage(tabId, { action: 'scrollOverlayProgress', screens: rows }).catch(() => {});
    }
  });

  if (!result) {
    chrome.runtime.sendMessage({ action: 'scrollComplete', error: 'Tidak ada konten yang berhasil direkam' });
    return;
  }

  sendCaptureReady(
    result.dataUrl,
    `longss-scroll-${Date.now()}.png`,
    'scroll',
    result.truncated
  );
}

// ---------------- Shared capture engine used by full-page + scroll capture ----------------
// Walks the page as a grid of viewport-sized tiles (columns as well as rows,
// so pages wider than the window aren't cut off at the right edge), then
// stitches every tile onto one canvas in device pixels.
async function captureGrid(tab, options) {
  const {
    metrics,
    startTop = 0,
    startLeft = 0,
    limitHeight = Infinity,
    maxRows = 200,
    maxColumns = 12,
    settleWait = 450,
    shouldStop = () => false,
    hasTimedOut = () => false,
    onProgress = null
  } = options;

  const tabId = tab.id;
  const dpr = metrics.dpr || 1;
  const tileWidth = metrics.viewportWidth;
  const tileHeight = metrics.viewportHeight;

  // Column offsets: one per viewport-width of horizontal content, the last
  // one clamped to the maximum scrollLeft so the right edge is flush.
  const contentWidth = Math.max(metrics.scrollWidth, tileWidth);
  const maxScrollLeft = Math.max(contentWidth - tileWidth, 0);
  const columns = [];
  for (let x = 0; columns.length < maxColumns; x += tileWidth) {
    const clamped = Math.min(x, maxScrollLeft);
    if (columns.length && columns[columns.length - 1] === clamped) break;
    columns.push(clamped);
    if (clamped >= maxScrollLeft) break;
  }

  const shots = [];
  let sticky = { top: 0, bottom: 0 };
  let targetTop = startTop;
  let rows = 0;
  let stableCount = 0;
  let truncated = false;
  let reachedBottom = false;

  while (rows < maxRows) {
    if (shouldStop()) break;
    if (hasTimedOut()) { truncated = true; break; }

    // Crop the pinned header off every screen except the very first, where
    // it's genuinely part of the content at that scroll position.
    const cropTop = rows === 0 ? 0 : sticky.top;
    let landedTop = targetTop;

    for (let c = 0; c < columns.length; c++) {
      const columnLeft = columns[c];
      const pos = await scrollAndMeasure(tabId, columnLeft, targetTop);
      // Only the first column of a row needs the full settle - that's the one
      // that changes vertical position and can trigger lazy loading.
      await sleep(c === 0 ? settleWait : 180);
      landedTop = pos.top;

      const dataUrl = await captureWithoutOverlay(tab);
      shots.push({
        dataUrl,
        row: rows,
        left: pos.left,
        top: pos.top,
        cropTop,
        cropBottom: sticky.bottom
      });
    }

    rows++;
    if (onProgress) onProgress(rows);

    // Bars can only be measured once we've scrolled at least once - at the
    // top of the page a sticky header is indistinguishable from normal content.
    if (rows === 1) {
      sticky = await measureStickyBands(tabId);
      const maxBand = Math.floor(tileHeight * 0.35);
      sticky.top = Math.min(Math.max(sticky.top, 0), maxBand);
      sticky.bottom = Math.min(Math.max(sticky.bottom, 0), maxBand);
    }

    if (landedTop + tileHeight >= startTop + limitHeight - 1) { reachedBottom = true; break; }

    // Advance by exactly the amount of *content* the next screen will show
    // once its pinned bars are cropped away, so consecutive screens abut
    // instead of overlapping or leaving a gap.
    const step = Math.max(tileHeight - sticky.top - sticky.bottom, Math.floor(tileHeight * 0.5));
    const nextTop = landedTop + step;

    if (Math.abs(nextTop - targetTop) < 2) break;
    targetTop = nextTop;

    // Detect the real bottom of the page: two consecutive rows that couldn't
    // move. One is not enough - the first can just be content still loading.
    const after = await getPageMetrics(tabId);
    if (after.scrollTop >= after.scrollHeight - after.viewportHeight - 1 &&
        landedTop >= after.scrollHeight - after.viewportHeight - 1) {
      stableCount++;
      if (stableCount >= 2) { reachedBottom = true; break; }
    } else {
      stableCount = 0;
    }
  }

  if (rows >= maxRows && !reachedBottom) truncated = true;

  // Restore the page to where the user left it.
  await scrollAndMeasure(tabId, startLeft, startTop).catch(() => {});

  if (shots.length === 0) return null;

  // The pinned bottom bar is cropped from every screen so it doesn't repeat
  // mid-image, but on the final screen that band is the actual end of the
  // page - keep it there.
  const lastRow = shots[shots.length - 1].row;
  shots.forEach(shot => { if (shot.row === lastRow) shot.cropBottom = 0; });

  const stitched = await stitchShots(shots, {
    dpr,
    tileWidth,
    tileHeight,
    startTop,
    contentWidth
  });

  return { dataUrl: stitched.dataUrl, truncated: truncated || stitched.truncated };
}

// Draw every captured tile onto one canvas. Everything here is device pixels:
// the bitmaps come back from captureVisibleTab at CSS size * devicePixelRatio,
// so the canvas and all offsets are scaled to match.
async function stitchShots(shots, layout) {
  const { dpr, tileWidth, tileHeight, startTop, contentWidth } = layout;

  let canvasWidth = Math.round(contentWidth * dpr);
  const contentBottom = shots.reduce(
    (max, s) => Math.max(max, s.top + tileHeight - s.cropBottom - startTop),
    0
  );
  const capped = capCanvasHeight(canvasWidth, Math.round(contentBottom * dpr));
  const canvasHeight = capped.height;

  const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Decode and draw one tile at a time: holding 30 full-viewport bitmaps at
  // once is what pushes long captures into an out-of-memory failure.
  for (const shot of shots) {
    let bitmap;
    try {
      bitmap = await dataUrlToImageBitmap(shot.dataUrl);
    } catch (error) {
      throw new Error('Gagal memuat salah satu hasil tangkapan layar');
    }

    try {
      const sx = 0;
      const sy = Math.round(shot.cropTop * dpr);
      const sw = Math.min(Math.round(tileWidth * dpr), bitmap.width);
      const sh = Math.min(
        Math.round((tileHeight - shot.cropTop - shot.cropBottom) * dpr),
        bitmap.height - sy
      );
      if (sw <= 0 || sh <= 0) continue;

      const dx = Math.round(shot.left * dpr);
      const dy = Math.round((shot.top - startTop + shot.cropTop) * dpr);
      if (dy >= canvasHeight) continue;

      ctx.drawImage(bitmap, sx, sy, sw, sh, dx, dy, sw, sh);
    } finally {
      bitmap.close();
    }
  }

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return { dataUrl: await blobToDataUrl(blob), truncated: capped.truncated };
}

// Add frame to image based on user-chosen options
async function addFrameToImage(dataUrl, options) {
  const style = options.style || 'light';
  const padding = Number(options.padding) || 40;
  const rounded = !!options.rounded;

  const bitmap = await dataUrlToImageBitmap(dataUrl);
  try {
    const shadowBlur = 20;
    const canvas = new OffscreenCanvas(
      bitmap.width + (padding * 2) + shadowBlur,
      bitmap.height + (padding * 2) + shadowBlur
    );
    const ctx = canvas.getContext('2d');

    const bgFill = getFrameBackground(ctx, canvas, style);
    ctx.fillStyle = bgFill;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;

    const frameColor = style === 'dark' ? '#2d2d2d' : 'white';
    drawRoundedRect(ctx, padding, padding, bitmap.width, bitmap.height, rounded ? 16 : 0);
    ctx.fillStyle = frameColor;
    ctx.fill();
    ctx.restore();

    ctx.save();
    drawRoundedRect(ctx, padding, padding, bitmap.width, bitmap.height, rounded ? 16 : 0);
    ctx.clip();
    ctx.drawImage(bitmap, padding, padding);
    ctx.restore();

    const blob = await canvas.convertToBlob({ type: 'image/png' });
    return blobToDataUrl(blob);
  } finally {
    bitmap.close();
  }
}

function getFrameBackground(ctx, canvas, style) {
  if (style === 'dark') return '#1a1a1a';
  if (style === 'gradient') {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    return gradient;
  }
  return '#f0f0f0'; // light (default)
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  if (!radius) {
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function describeError(error) {
  const msg = error && error.message ? error.message : String(error);
  if (/Cannot access/i.test(msg) || /chrome:\/\//i.test(msg)) {
    return 'Halaman ini tidak bisa di-screenshot (halaman internal browser/terproteksi)';
  }
  if (/MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND/i.test(msg)) {
    return 'Terlalu banyak permintaan capture, coba lagi sebentar';
  }
  if (/Could not establish connection|Receiving end does not exist/i.test(msg)) {
    return 'Ekstensi belum aktif di halaman ini. Refresh halaman lalu coba lagi.';
  }
  return msg;
}

// Instead of downloading immediately, hand the result back to the popup so
// the user can preview it and confirm before it's saved to disk. Also kept
// in memory so a popup that was closed during capture can still retrieve it.
function sendCaptureReady(dataUrl, filename, type, truncated) {
  lastCaptureResult = { dataUrl, filename, type, truncated: !!truncated };
  chrome.runtime.sendMessage({ action: 'captureReady', ...lastCaptureResult });
}

// Download image, honoring the user's save-location preference
async function downloadImage(dataUrl, filename, saveAsOverride) {
  const settings = await chrome.storage.sync.get({
    askSaveLocation: false,
    downloadFolder: ''
  });

  let finalFilename = filename;
  if (settings.downloadFolder) {
    const folder = settings.downloadFolder.replace(/[\\/]+$/, '').replace(/^[\\/]+/, '');
    if (folder) {
      finalFilename = `${folder}/${filename}`;
    }
  }

  const saveAs = typeof saveAsOverride === 'boolean' ? saveAsOverride : settings.askSaveLocation;

  chrome.downloads.download({
    url: dataUrl,
    filename: finalFilename,
    saveAs
  });
}
