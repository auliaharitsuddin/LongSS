// Content script: hosts the on-page overlays for LongSS.
// - Scroll-recording overlay + Stop button (background drives the actual
//   scrolling/capturing; the popup would close the instant the page is
//   interacted with, so it can't host the controls).
// - Snipping-Tool style drag-to-select overlay for the Framed screenshot.
//
// background.js may re-inject this file on demand (chrome.scripting) if the
// tab's normal manifest-declared copy has gone stale (e.g. the extension was
// reloaded while the tab was already open - the old copy's chrome.runtime
// connection to the new background is dead, but it's still sitting in the
// page). Wrapped in an IIFE so re-injection never throws "already declared"
// for the top-level state below, whether or not a dead copy is still around.
(function () {
  let recordingOverlay = null;
  let keepAlivePort = null;

  let selectionOverlay = null;
  let selectionBox = null;
  let selectionStart = null;
  let isSelecting = false;

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'showScrollOverlay') {
      showRecordingOverlay();
    } else if (message.action === 'hideScrollOverlay') {
      hideRecordingOverlay();
    } else if (message.action === 'scrollOverlayProgress') {
      updateRecordingOverlay(message.screens);
    } else if (message.action === 'beginAreaSelection') {
      startAreaSelection();
    }
  });

  // ---------------- Scroll recording overlay ----------------
  function showRecordingOverlay() {
    if (recordingOverlay) return;

    // Keeps the background service worker alive for the whole capture loop.
    try {
      keepAlivePort = chrome.runtime.connect({ name: 'longss-scroll-keepalive' });
    } catch (e) {
      keepAlivePort = null;
    }

    recordingOverlay = document.createElement('div');
    recordingOverlay.id = 'longss-recording-overlay';
    recordingOverlay.innerHTML = `
      <div class="longss-recording-indicator">
        <div class="longss-recording-dot"></div>
        <span id="longss-recording-text">Merekam scroll...</span>
        <button id="longss-stop-btn" type="button">Stop</button>
      </div>
    `;
    document.body.appendChild(recordingOverlay);

    document.getElementById('longss-stop-btn').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'stopScrollCaptureRequest' });
    });
  }

  function updateRecordingOverlay(screens) {
    if (!recordingOverlay) return;
    const textEl = document.getElementById('longss-recording-text');
    if (textEl) {
      textEl.textContent = `Merekam scroll... (${screens} bagian)`;
    }
  }

  function hideRecordingOverlay() {
    if (recordingOverlay) {
      recordingOverlay.remove();
      recordingOverlay = null;
    }
    if (keepAlivePort) {
      try { keepAlivePort.disconnect(); } catch (e) {}
      keepAlivePort = null;
    }
  }

  // ---------------- Snipping-Tool style area selection ----------------
  function startAreaSelection() {
    if (selectionOverlay) return;

    selectionOverlay = document.createElement('div');
    selectionOverlay.id = 'longss-selection-overlay';

    const hint = document.createElement('div');
    hint.id = 'longss-selection-hint';
    hint.textContent = 'Seret untuk memilih area screenshot • Esc untuk batal';
    selectionOverlay.appendChild(hint);

    selectionBox = document.createElement('div');
    selectionBox.id = 'longss-selection-box';
    selectionBox.style.display = 'none';
    selectionOverlay.appendChild(selectionBox);

    document.documentElement.appendChild(selectionOverlay);

    selectionOverlay.addEventListener('mousedown', onSelectionMouseDown);
    document.addEventListener('keydown', onSelectionKeyDown, true);
  }

  function onSelectionMouseDown(e) {
    e.preventDefault();
    isSelecting = true;
    selectionStart = { x: e.clientX, y: e.clientY };
    Object.assign(selectionBox.style, {
      display: 'block',
      left: `${e.clientX}px`,
      top: `${e.clientY}px`,
      width: '0px',
      height: '0px'
    });

    document.addEventListener('mousemove', onSelectionMouseMove);
    document.addEventListener('mouseup', onSelectionMouseUp);
  }

  function onSelectionMouseMove(e) {
    if (!isSelecting) return;
    const x = Math.min(e.clientX, selectionStart.x);
    const y = Math.min(e.clientY, selectionStart.y);
    const width = Math.abs(e.clientX - selectionStart.x);
    const height = Math.abs(e.clientY - selectionStart.y);
    Object.assign(selectionBox.style, {
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`
    });
  }

  function onSelectionMouseUp(e) {
    if (!isSelecting) return;
    isSelecting = false;
    document.removeEventListener('mousemove', onSelectionMouseMove);
    document.removeEventListener('mouseup', onSelectionMouseUp);

    const x = Math.min(e.clientX, selectionStart.x);
    const y = Math.min(e.clientY, selectionStart.y);
    const width = Math.abs(e.clientX - selectionStart.x);
    const height = Math.abs(e.clientY - selectionStart.y);

    cleanupSelectionOverlay();

    if (width < 8 || height < 8) {
      chrome.runtime.sendMessage({ action: 'areaSelectionCancelled' });
      return;
    }

    chrome.runtime.sendMessage({
      action: 'areaSelected',
      rect: { x, y, width, height },
      devicePixelRatio: window.devicePixelRatio || 1
    });
  }

  function onSelectionKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      isSelecting = false;
      document.removeEventListener('mousemove', onSelectionMouseMove);
      document.removeEventListener('mouseup', onSelectionMouseUp);
      cleanupSelectionOverlay();
      chrome.runtime.sendMessage({ action: 'areaSelectionCancelled' });
    }
  }

  function cleanupSelectionOverlay() {
    document.removeEventListener('keydown', onSelectionKeyDown, true);
    if (selectionOverlay) {
      selectionOverlay.remove();
      selectionOverlay = null;
    }
    selectionBox = null;
    selectionStart = null;
  }
})();
