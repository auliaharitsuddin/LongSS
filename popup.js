// UI Elements
const fullPageBtn = document.getElementById('fullPageBtn');
const framedToggle = document.getElementById('framedToggle');
const framedBtn = document.getElementById('framedBtn');
const frameOptions = document.getElementById('frameOptions');
const frameStyleInput = document.getElementById('frameStyle');
const framePaddingInput = document.getElementById('framePadding');
const frameRoundedInput = document.getElementById('frameRounded');

const scrollBtn = document.getElementById('scrollBtn');
const status = document.getElementById('status');
const statusText = document.getElementById('statusText');
const progress = document.getElementById('progress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

const preview = document.getElementById('preview');
const previewImg = document.getElementById('previewImg');
const truncatedNotice = document.getElementById('truncatedNotice');
const saveBtn = document.getElementById('saveBtn');
const discardBtn = document.getElementById('discardBtn');

const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
const askSaveLocationInput = document.getElementById('askSaveLocation');
const downloadFolderInput = document.getElementById('downloadFolder');

let pendingCapture = null; // { dataUrl, filename, type }
let scrollCaptureActive = false;

// ---------- Settings ----------
chrome.storage.sync.get({ askSaveLocation: false, downloadFolder: '' }, (settings) => {
  askSaveLocationInput.checked = settings.askSaveLocation;
  downloadFolderInput.value = settings.downloadFolder;
});

settingsToggle.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});

askSaveLocationInput.addEventListener('change', () => {
  chrome.storage.sync.set({ askSaveLocation: askSaveLocationInput.checked });
});

downloadFolderInput.addEventListener('change', () => {
  chrome.storage.sync.set({ downloadFolder: downloadFolderInput.value.trim() });
});

// ---------- Frame options toggle ----------
framedToggle.addEventListener('click', () => {
  frameOptions.classList.toggle('hidden');
});

// ---------- Helper functions ----------
function showStatus(message) {
  statusText.textContent = message;
  status.classList.remove('hidden');
  progress.classList.add('hidden');
}

function hideStatus() {
  status.classList.add('hidden');
}

function showProgress(percent, label) {
  progress.classList.remove('hidden');
  progressFill.style.width = `${percent}%`;
  progressText.textContent = label || `${Math.round(percent)}%`;
}

function hideProgress() {
  progress.classList.add('hidden');
}

function disableButtons() {
  fullPageBtn.disabled = true;
  framedToggle.disabled = true;
  framedBtn.disabled = true;
}

function enableButtons() {
  fullPageBtn.disabled = false;
  framedToggle.disabled = false;
  framedBtn.disabled = false;
}

function showPreview(dataUrl, filename, type, truncated) {
  pendingCapture = { dataUrl, filename, type };
  previewImg.src = dataUrl;
  truncatedNotice.classList.toggle('hidden', !truncated);
  preview.classList.remove('hidden');
}

function hidePreview() {
  pendingCapture = null;
  previewImg.src = '';
  preview.classList.add('hidden');
}

function setScrollUiRecording(recording) {
  scrollCaptureActive = recording;
  scrollBtn.classList.toggle('recording', recording);
  scrollBtn.querySelector('.text').textContent = recording
    ? 'Stop Rekam Scroll'
    : 'Mulai Rekam Scroll (Otomatis)';
  scrollBtn.querySelector('.hint').textContent = recording
    ? 'Sedang merekam... klik untuk berhenti'
    : 'Klik lagi atau tombol Stop di halaman untuk berhenti';
}

// Get active tab
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Re-sync UI in case the popup was reopened while an auto-scroll capture
// (which keeps running in the background) is already in progress.
chrome.runtime.sendMessage({ action: 'getScrollCaptureState' }, (response) => {
  if (response && response.active) {
    disableButtons();
    setScrollUiRecording(true);
    showStatus('Merekam scroll otomatis...');
  }
});

// Area-selection (framed) and scroll capture both require interacting with
// the page, which closes this popup. Recover any result that finished while
// the popup was closed.
chrome.runtime.sendMessage({ action: 'getPendingCapture' }, (response) => {
  if (response && response.dataUrl) {
    hideStatus();
    enableButtons();
    showPreview(response.dataUrl, response.filename, response.type, response.truncated);
  }
});

// ---------- Message listener (single, permanent) ----------
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'captureReady') {
    hideStatus();
    hideProgress();
    enableButtons();
    setScrollUiRecording(false);
    showPreview(message.dataUrl, message.filename, message.type, message.truncated);
  } else if (message.action === 'scrollCaptureStarted') {
    setScrollUiRecording(true);
    showStatus('Merekam scroll otomatis...');
  } else if (message.action === 'scrollCaptureProgress') {
    showProgress(0, `${message.screens} bagian direkam (${Math.round(message.elapsed / 1000)}s)`);
  } else if (
    message.action === 'fullPageComplete' ||
    message.action === 'framedComplete' ||
    message.action === 'scrollComplete'
  ) {
    hideStatus();
    hideProgress();
    enableButtons();
    setScrollUiRecording(false);
    if (message.error) {
      showStatus(`✗ ${message.error}`);
      setTimeout(hideStatus, 3500);
    }
  }
});

// ---------- Preview actions ----------
saveBtn.addEventListener('click', () => {
  if (!pendingCapture) return;
  chrome.runtime.sendMessage({
    action: 'downloadImage',
    dataUrl: pendingCapture.dataUrl,
    filename: pendingCapture.filename,
    saveAs: askSaveLocationInput.checked
  });
  hidePreview();
  showStatus('✓ Screenshot disimpan!');
  setTimeout(hideStatus, 2000);
});

discardBtn.addEventListener('click', () => {
  hidePreview();
});

// ---------- Full Page Screenshot ----------
fullPageBtn.addEventListener('click', async () => {
  try {
    hidePreview();
    disableButtons();
    showStatus('Mengambil screenshot full page...');

    const tab = await getActiveTab();
    chrome.runtime.sendMessage({ action: 'captureFullPage', tabId: tab.id });

  } catch (error) {
    console.error('Error:', error);
    hideStatus();
    enableButtons();
    alert('Error capturing screenshot: ' + error.message);
  }
});

// ---------- Framed Screenshot (Snipping-Tool style area selection) ----------
framedBtn.addEventListener('click', async () => {
  try {
    hidePreview();
    const tab = await getActiveTab();
    showStatus('Pilih area di halaman (seret mouse)... popup akan tertutup');

    chrome.runtime.sendMessage({
      action: 'startAreaSelection',
      tabId: tab.id,
      frameOptions: {
        style: frameStyleInput.value,
        padding: framePaddingInput.value,
        rounded: frameRoundedInput.checked
      }
    });

  } catch (error) {
    console.error('Error:', error);
    hideStatus();
    alert('Error starting area selection: ' + error.message);
  }
});

// ---------- Scroll Screenshot (auto, click to start/stop) ----------
scrollBtn.addEventListener('click', async () => {
  try {
    if (scrollCaptureActive) {
      chrome.runtime.sendMessage({ action: 'stopScrollCaptureRequest' });
      showStatus('Memproses hasil scroll...');
      return;
    }

    hidePreview();
    const tab = await getActiveTab();
    disableButtons();
    chrome.runtime.sendMessage({ action: 'startScrollCapture', tabId: tab.id });

  } catch (error) {
    console.error('Error:', error);
    alert('Error starting scroll capture: ' + error.message);
    enableButtons();
    setScrollUiRecording(false);
  }
});
