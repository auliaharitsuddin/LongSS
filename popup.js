// ---------- i18n ----------
const I18N = {
  id: {
    subtitle: 'Long Screenshot Tool',
    fullPageBtn: 'Full Page Screenshot',
    framedToggle: 'Framed Screenshot',
    frameStyleLabel: 'Gaya bingkai',
    frameStyleLight: 'Terang (putih)',
    frameStyleDark: 'Gelap',
    frameStyleGradient: 'Gradient ungu',
    framePaddingLabel: 'Padding',
    framePaddingSmall: 'Kecil (20px)',
    framePaddingMedium: 'Sedang (40px)',
    framePaddingLarge: 'Besar (70px)',
    frameRoundedLabel: 'Sudut membulat',
    framedBtn: '✂️ Pilih Area di Halaman (seperti Snipping Tool)',
    scrollBtnIdle: 'Mulai Rekam Scroll (Otomatis)',
    scrollBtnRecording: 'Stop Rekam Scroll',
    scrollHintIdle: 'Klik lagi untuk berhenti, otomatis berhenti setelah 10 detik',
    scrollHintStopped: 'Klik lagi atau tombol Stop di halaman untuk berhenti',
    scrollHintRecording: 'Sedang merekam... klik untuk berhenti',
    statusProcessing: 'Processing...',
    previewLabel: 'Preview',
    truncatedNotice: '⚠️ Halaman terlalu panjang, hasil dipotong sebagian',
    discardBtn: 'Discard',
    saveBtn: 'Save Screenshot',
    settingsToggle: '⚙️ Save location settings',
    askSaveLocationLabel: 'Ask where to save each time',
    downloadFolderLabel: 'Subfolder in Downloads',
    downloadFolderPlaceholder: 'e.g. LongSS Screenshots',
    tipText: '💡 Tip: Use scroll recording for dynamic content like social media feeds',
    statusFullPage: 'Mengambil screenshot full page...',
    statusAreaSelect: 'Pilih area di halaman (seret mouse)... popup akan tertutup',
    statusProcessingScroll: 'Memproses hasil scroll...',
    statusScrollRecording: 'Merekam scroll otomatis...',
    statusSaved: '✓ Screenshot disimpan!',
    scrollProgress: (screens, sec) => `${screens} bagian direkam (${sec}s)`,
    errorCapture: (msg) => `Error capturing screenshot: ${msg}`,
    errorArea: (msg) => `Error starting area selection: ${msg}`,
    errorScroll: (msg) => `Error starting scroll capture: ${msg}`
  },
  en: {
    subtitle: 'Long Screenshot Tool',
    fullPageBtn: 'Full Page Screenshot',
    framedToggle: 'Framed Screenshot',
    frameStyleLabel: 'Frame style',
    frameStyleLight: 'Light (white)',
    frameStyleDark: 'Dark',
    frameStyleGradient: 'Purple gradient',
    framePaddingLabel: 'Padding',
    framePaddingSmall: 'Small (20px)',
    framePaddingMedium: 'Medium (40px)',
    framePaddingLarge: 'Large (70px)',
    frameRoundedLabel: 'Rounded corners',
    framedBtn: '✂️ Select Area on Page (like Snipping Tool)',
    scrollBtnIdle: 'Start Scroll Recording (Automatic)',
    scrollBtnRecording: 'Stop Scroll Recording',
    scrollHintIdle: 'Click again to stop, stops automatically after 10 seconds',
    scrollHintStopped: 'Click again or the on-page Stop button to stop',
    scrollHintRecording: 'Recording... click to stop',
    statusProcessing: 'Processing...',
    previewLabel: 'Preview',
    truncatedNotice: '⚠️ Page too long, result was partially truncated',
    discardBtn: 'Discard',
    saveBtn: 'Save Screenshot',
    settingsToggle: '⚙️ Save location settings',
    askSaveLocationLabel: 'Ask where to save each time',
    downloadFolderLabel: 'Subfolder in Downloads',
    downloadFolderPlaceholder: 'e.g. LongSS Screenshots',
    tipText: '💡 Tip: Use scroll recording for dynamic content like social media feeds',
    statusFullPage: 'Capturing full page screenshot...',
    statusAreaSelect: 'Select an area on the page (drag mouse)... popup will close',
    statusProcessingScroll: 'Processing scroll recording result...',
    statusScrollRecording: 'Recording scroll automatically...',
    statusSaved: '✓ Screenshot saved!',
    scrollProgress: (screens, sec) => `${screens} parts recorded (${sec}s)`,
    errorCapture: (msg) => `Error capturing screenshot: ${msg}`,
    errorArea: (msg) => `Error starting area selection: ${msg}`,
    errorScroll: (msg) => `Error starting scroll capture: ${msg}`
  }
};

let currentLang = 'id';
function t(key, ...args) {
  const entry = I18N[currentLang][key];
  return typeof entry === 'function' ? entry(...args) : entry;
}

function applyLanguage() {
  document.getElementById('subtitleText').textContent = t('subtitle');
  fullPageBtn.querySelector('.text').textContent = t('fullPageBtn');
  framedToggle.querySelector('.text').textContent = t('framedToggle');
  document.getElementById('frameStyleLabel').textContent = t('frameStyleLabel');
  document.getElementById('frameStyleLight').textContent = t('frameStyleLight');
  document.getElementById('frameStyleDark').textContent = t('frameStyleDark');
  document.getElementById('frameStyleGradient').textContent = t('frameStyleGradient');
  document.getElementById('framePaddingLabel').textContent = t('framePaddingLabel');
  document.getElementById('framePaddingSmall').textContent = t('framePaddingSmall');
  document.getElementById('framePaddingMedium').textContent = t('framePaddingMedium');
  document.getElementById('framePaddingLarge').textContent = t('framePaddingLarge');
  document.getElementById('frameRoundedLabel').textContent = t('frameRoundedLabel');
  framedBtn.querySelector('.text').textContent = t('framedBtn');
  setScrollUiRecording(scrollCaptureActive);
  document.getElementById('previewLabel').textContent = t('previewLabel');
  truncatedNotice.textContent = t('truncatedNotice');
  discardBtn.querySelector('.text').textContent = t('discardBtn');
  saveBtn.querySelector('.text').textContent = t('saveBtn');
  settingsToggle.textContent = t('settingsToggle');
  document.getElementById('askSaveLocationLabel').textContent = t('askSaveLocationLabel');
  document.getElementById('downloadFolderLabel').textContent = t('downloadFolderLabel');
  downloadFolderInput.placeholder = t('downloadFolderPlaceholder');
  document.getElementById('tipText').textContent = t('tipText');
  document.getElementById('langIdBtn').setAttribute('aria-pressed', String(currentLang === 'id'));
  document.getElementById('langEnBtn').setAttribute('aria-pressed', String(currentLang === 'en'));
}

function setLanguage(lang) {
  currentLang = lang;
  chrome.storage.local.set({ lssLang: lang });
  applyLanguage();
}

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

// ---------- Language ----------
chrome.storage.local.get({ lssLang: 'id' }, ({ lssLang }) => {
  currentLang = lssLang === 'en' ? 'en' : 'id';
  applyLanguage();
});

document.getElementById('langIdBtn').addEventListener('click', () => setLanguage('id'));
document.getElementById('langEnBtn').addEventListener('click', () => setLanguage('en'));

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
    ? t('scrollBtnRecording')
    : t('scrollBtnIdle');
  scrollBtn.querySelector('.hint').textContent = recording
    ? t('scrollHintRecording')
    : t('scrollHintStopped');
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
    showStatus(t('statusScrollRecording'));
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
    showStatus(t('statusScrollRecording'));
  } else if (message.action === 'scrollCaptureProgress') {
    showProgress(0, t('scrollProgress', message.screens, Math.round(message.elapsed / 1000)));
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
  showStatus(t('statusSaved'));
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
    showStatus(t('statusFullPage'));

    const tab = await getActiveTab();
    chrome.runtime.sendMessage({ action: 'captureFullPage', tabId: tab.id });

  } catch (error) {
    console.error('Error:', error);
    hideStatus();
    enableButtons();
    alert(t('errorCapture', error.message));
  }
});

// ---------- Framed Screenshot (Snipping-Tool style area selection) ----------
framedBtn.addEventListener('click', async () => {
  try {
    hidePreview();
    const tab = await getActiveTab();
    showStatus(t('statusAreaSelect'));

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
    alert(t('errorArea', error.message));
  }
});

// ---------- Scroll Screenshot (auto, click to start/stop) ----------
scrollBtn.addEventListener('click', async () => {
  try {
    if (scrollCaptureActive) {
      chrome.runtime.sendMessage({ action: 'stopScrollCaptureRequest' });
      showStatus(t('statusProcessingScroll'));
      return;
    }

    hidePreview();
    const tab = await getActiveTab();
    disableButtons();
    chrome.runtime.sendMessage({ action: 'startScrollCapture', tabId: tab.id });

  } catch (error) {
    console.error('Error:', error);
    alert(t('errorScroll', error.message));
    enableButtons();
    setScrollUiRecording(false);
  }
});
