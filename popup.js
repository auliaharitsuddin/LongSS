// UI Elements
const fullPageBtn = document.getElementById('fullPageBtn');
const framedBtn = document.getElementById('framedBtn');
const scrollBtn = document.getElementById('scrollBtn');
const status = document.getElementById('status');
const statusText = document.getElementById('statusText');
const progress = document.getElementById('progress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

let scrollPressTimer = null;
let scrollStartTime = null;
const MAX_RECORD_TIME = 10000; // 10 seconds

// Helper functions
function showStatus(message) {
  statusText.textContent = message;
  status.classList.remove('hidden');
  progress.classList.add('hidden');
}

function hideStatus() {
  status.classList.add('hidden');
}

function showProgress(percent) {
  progress.classList.remove('hidden');
  progressFill.style.width = `${percent}%`;
  progressText.textContent = `${Math.round(percent)}%`;
}

function hideProgress() {
  progress.classList.add('hidden');
}

function disableButtons() {
  fullPageBtn.disabled = true;
  framedBtn.disabled = true;
  scrollBtn.disabled = true;
}

function enableButtons() {
  fullPageBtn.disabled = false;
  framedBtn.disabled = false;
  scrollBtn.disabled = false;
}

// Get active tab
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Full Page Screenshot
fullPageBtn.addEventListener('click', async () => {
  try {
    disableButtons();
    showStatus('Capturing full page...');
    
    const tab = await getActiveTab();
    
    // Inject and execute capture script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: captureFullPage
    });
    
    // Listen for completion
    chrome.runtime.onMessage.addListener(function listener(message) {
      if (message.action === 'fullPageComplete') {
        chrome.runtime.onMessage.removeListener(listener);
        hideStatus();
        enableButtons();
        showStatus('✓ Screenshot saved!');
        setTimeout(hideStatus, 2000);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    hideStatus();
    enableButtons();
    alert('Error capturing screenshot: ' + error.message);
  }
});

// Framed Screenshot
framedBtn.addEventListener('click', async () => {
  try {
    disableButtons();
    showStatus('Capturing framed screenshot...');
    
    const tab = await getActiveTab();
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: captureFramed
    });
    
    chrome.runtime.onMessage.addListener(function listener(message) {
      if (message.action === 'framedComplete') {
        chrome.runtime.onMessage.removeListener(listener);
        hideStatus();
        enableButtons();
        showStatus('✓ Screenshot saved!');
        setTimeout(hideStatus, 2000);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    hideStatus();
    enableButtons();
    alert('Error capturing screenshot: ' + error.message);
  }
});

// Scroll Screenshot (Hold to record)
scrollBtn.addEventListener('mousedown', async () => {
  try {
    const tab = await getActiveTab();
    
    // Start recording
    scrollStartTime = Date.now();
    scrollBtn.classList.add('recording');
    scrollBtn.querySelector('.text').textContent = 'Recording... (Release to stop)';
    disableButtons();
    scrollBtn.disabled = false;
    
    // Send start message
    await chrome.tabs.sendMessage(tab.id, { action: 'startScrollCapture' });
    
    // Progress updater
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - scrollStartTime;
      const percent = Math.min((elapsed / MAX_RECORD_TIME) * 100, 100);
      showProgress(percent);
      
      if (elapsed >= MAX_RECORD_TIME) {
        clearInterval(progressInterval);
        scrollBtn.dispatchEvent(new Event('mouseup'));
      }
    }, 100);
    
    // Store interval ID for cleanup
    scrollBtn.dataset.intervalId = progressInterval;
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error starting scroll capture: ' + error.message);
    resetScrollButton();
  }
});

scrollBtn.addEventListener('mouseup', async () => {
  if (!scrollBtn.classList.contains('recording')) return;
  
  try {
    const tab = await getActiveTab();
    
    // Clear progress interval
    if (scrollBtn.dataset.intervalId) {
      clearInterval(parseInt(scrollBtn.dataset.intervalId));
      delete scrollBtn.dataset.intervalId;
    }
    
    hideProgress();
    showStatus('Processing scrolled screenshot...');
    
    // Send stop message
    await chrome.tabs.sendMessage(tab.id, { action: 'stopScrollCapture' });
    
    // Listen for completion
    chrome.runtime.onMessage.addListener(function listener(message) {
      if (message.action === 'scrollComplete') {
        chrome.runtime.onMessage.removeListener(listener);
        hideStatus();
        enableButtons();
        resetScrollButton();
        showStatus('✓ Screenshot saved!');
        setTimeout(hideStatus, 2000);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    hideStatus();
    enableButtons();
    resetScrollButton();
    alert('Error stopping capture: ' + error.message);
  }
});

// Also handle mouse leaving the button
scrollBtn.addEventListener('mouseleave', () => {
  if (scrollBtn.classList.contains('recording')) {
    scrollBtn.dispatchEvent(new Event('mouseup'));
  }
});

function resetScrollButton() {
  scrollBtn.classList.remove('recording');
  scrollBtn.querySelector('.text').textContent = 'Hold to Record Scroll';
}

// Injected functions (these run in the page context)
function captureFullPage() {
  chrome.runtime.sendMessage({ action: 'captureFullPage' });
}

function captureFramed() {
  chrome.runtime.sendMessage({ action: 'captureFramed' });
}
