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

async function getPageDims(tabId) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => ({
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      scrollTop: window.pageYOffset || document.documentElement.scrollTop
    })
  });
  return result.result;
}

async function scrollPageTo(tabId, top) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (t) => window.scrollTo(0, t),
    args: [top]
  });
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
    const dimensions = await getPageDims(tabId);

    if (dimensions.scrollHeight <= dimensions.viewportHeight) {
      const dataUrl = await captureVisibleTabSafe(tab.windowId);
      sendCaptureReady(dataUrl, `longss-fullpage-${Date.now()}.png`, 'fullPage', false);
      return;
    }

    await captureAndStitchRange(tab, {
      startOffset: 0,
      totalHeight: dimensions.scrollHeight,
      viewportHeight: dimensions.viewportHeight,
      viewportWidth: dimensions.viewportWidth,
      restoreScrollTop: dimensions.scrollTop
    }, 'fullpage', 'fullPage');

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
  const initialDims = await getPageDims(tabId);
  const viewportWidth = initialDims.viewportWidth;
  const viewportHeight = initialDims.viewportHeight;
  const startTop = initialDims.scrollTop;

  const screenshots = [];
  let currentTop = startTop;
  let stableCount = 0;
  let hitLimit = false;

  while (true) {
    if (scrollState.stopRequested) break;
    if (Date.now() - scrollState.startTime > SCROLL_MAX_DURATION) { hitLimit = true; break; }
    if (screenshots.length >= SCROLL_MAX_SCREENS) { hitLimit = true; break; }

    const dataUrl = await captureVisibleTabSafe(tab.windowId);
    screenshots.push({ dataUrl, offsetY: currentTop - startTop });

    chrome.runtime.sendMessage({
      action: 'scrollCaptureProgress',
      elapsed: Date.now() - scrollState.startTime,
      screens: screenshots.length
    });

    if (scrollState.stopRequested) break;
    if (Date.now() - scrollState.startTime > SCROLL_MAX_DURATION) { hitLimit = true; break; }

    const targetTop = currentTop + viewportHeight;
    await scrollPageTo(tabId, targetTop);
    // Give lazy-loaded content (images, infinite-scroll sections) time to render.
    await new Promise(resolve => setTimeout(resolve, SCROLL_SETTLE_WAIT));

    const dims = await getPageDims(tabId);
    const newTop = dims.scrollTop;

    if (Math.abs(newTop - currentTop) < 2) {
      stableCount++;
      // Require two stable reads in a row before concluding we've hit the
      // real bottom - the first "no movement" reading might just be page
      // content still loading.
      if (stableCount >= 2) break;
    } else {
      stableCount = 0;
    }
    currentTop = newTop;
  }

  // Restore original scroll position
  await scrollPageTo(tabId, startTop).catch(() => {});

  if (screenshots.length === 0) {
    chrome.runtime.sendMessage({ action: 'scrollComplete', error: 'Tidak ada konten yang berhasil direkam' });
    return;
  }

  const rawTotalHeight = screenshots[screenshots.length - 1].offsetY + viewportHeight;
  const capped = capCanvasHeight(viewportWidth, rawTotalHeight);
  const usableShots = screenshots.filter(s => s.offsetY < capped.height);

  const stitchedDataUrl = await stitchImages(usableShots, { viewportWidth, totalHeight: capped.height });
  sendCaptureReady(
    stitchedDataUrl,
    `longss-scroll-${Date.now()}.png`,
    'scroll',
    hitLimit || capped.truncated
  );
}

// ---------------- Shared stitching used by full-page + scroll capture ----------------
async function captureAndStitchRange(tab, params, filenamePrefix, completeAction) {
  const { startOffset, totalHeight: requestedHeight, viewportHeight, viewportWidth, restoreScrollTop } = params;
  const capped = capCanvasHeight(viewportWidth, requestedHeight);
  const totalHeight = capped.height;
  const maxScrollTop = Math.max(startOffset + totalHeight - viewportHeight, startOffset);
  const numScreens = Math.max(Math.ceil((totalHeight - viewportHeight) / viewportHeight), 1) + 1;

  const screenshots = [];
  let lastScrollTop = null;

  for (let i = 0; i < numScreens; i++) {
    const targetScrollTop = Math.min(startOffset + i * viewportHeight, maxScrollTop);

    if (targetScrollTop === lastScrollTop) break;
    lastScrollTop = targetScrollTop;

    await scrollPageTo(tab.id, targetScrollTop);
    await new Promise(resolve => setTimeout(resolve, 450));

    const dataUrl = await captureVisibleTabSafe(tab.windowId);
    screenshots.push({
      dataUrl,
      offsetY: targetScrollTop - startOffset
    });

    if (targetScrollTop >= maxScrollTop) break;
  }

  await scrollPageTo(tab.id, restoreScrollTop || 0).catch(() => {});

  const stitchedDataUrl = await stitchImages(screenshots, { viewportWidth, totalHeight });
  sendCaptureReady(stitchedDataUrl, `longss-${filenamePrefix}-${Date.now()}.png`, completeAction, capped.truncated);
}

// Stitch images together
async function stitchImages(screenshots, dimensions) {
  if (screenshots.length === 0) {
    throw new Error('No screenshots captured');
  }

  let bitmaps;
  try {
    bitmaps = await Promise.all(screenshots.map(s => dataUrlToImageBitmap(s.dataUrl)));
  } catch (error) {
    throw new Error('Gagal memuat salah satu hasil tangkapan layar');
  }

  try {
    const canvas = new OffscreenCanvas(dimensions.viewportWidth, dimensions.totalHeight);
    const ctx = canvas.getContext('2d');

    bitmaps.forEach((bitmap, i) => {
      ctx.drawImage(bitmap, 0, screenshots[i].offsetY);
    });

    const blob = await canvas.convertToBlob({ type: 'image/png' });
    return blobToDataUrl(blob);
  } finally {
    bitmaps.forEach(bitmap => bitmap.close());
  }
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
