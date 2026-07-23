// Content script for scroll capture
let isRecording = false;
let capturedFrames = [];
let recordingInterval = null;
let recordingOverlay = null;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startScrollCapture') {
    startScrollCapture();
  } else if (message.action === 'stopScrollCapture') {
    stopScrollCapture();
  }
});

function startScrollCapture() {
  if (isRecording) return;
  
  isRecording = true;
  capturedFrames = [];
  
  // Show recording overlay
  showRecordingOverlay();
  
  // Capture frames periodically
  recordingInterval = setInterval(() => {
    captureCurrentFrame();
  }, 200); // Capture every 200ms
  
  // Auto-stop after 10 seconds
  setTimeout(() => {
    if (isRecording) {
      stopScrollCapture();
    }
  }, 10000);
}

function stopScrollCapture() {
  if (!isRecording) return;
  
  isRecording = false;
  
  // Stop interval
  if (recordingInterval) {
    clearInterval(recordingInterval);
    recordingInterval = null;
  }
  
  // Hide overlay
  hideRecordingOverlay();
  
  // Process captured frames
  processFrames();
}

function captureCurrentFrame() {
  const frameData = {
    scrollTop: window.pageYOffset || document.documentElement.scrollTop,
    scrollLeft: window.pageXOffset || document.documentElement.scrollLeft,
    timestamp: Date.now(),
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth
  };
  
  capturedFrames.push(frameData);
}

async function processFrames() {
  if (capturedFrames.length === 0) {
    chrome.runtime.sendMessage({ action: 'scrollComplete' });
    return;
  }
  
  // Find scroll range
  const scrollTops = capturedFrames.map(f => f.scrollTop);
  const minScroll = Math.min(...scrollTops);
  const maxScroll = Math.max(...scrollTops);
  const scrollRange = maxScroll - minScroll;
  
  // Capture screenshots for the scrolled area
  const screenshots = [];
  const viewportHeight = window.innerHeight;
  const numCaptures = Math.ceil(scrollRange / viewportHeight) + 1;
  
  for (let i = 0; i <= numCaptures; i++) {
    const targetScroll = minScroll + (i * viewportHeight);
    window.scrollTo(0, targetScroll);
    
    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Request capture from background
    const dataUrl = await captureVisibleTab();
    screenshots.push({
      dataUrl,
      scrollTop: targetScroll
    });
  }
  
  // Send data to background for stitching
  chrome.runtime.sendMessage({
    action: 'processScrollCapture',
    screenshots,
    minScroll,
    maxScroll,
    viewportHeight,
    viewportWidth: window.innerWidth
  });
  
  // Scroll back to original position
  window.scrollTo(0, minScroll);
  
  chrome.runtime.sendMessage({ action: 'scrollComplete' });
}

async function captureVisibleTab() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'captureVisible' }, (response) => {
      resolve(response.dataUrl);
    });
  });
}

// Background message handler for captures
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureVisible') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      sendResponse({ dataUrl });
    });
    return true; // Keep channel open for async response
  } else if (message.action === 'processScrollCapture') {
    processScrollImages(message);
  }
});

function processScrollImages(data) {
  // Create canvas and stitch images
  const canvas = document.createElement('canvas');
  const totalHeight = data.maxScroll - data.minScroll + data.viewportHeight;
  canvas.width = data.viewportWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');
  
  let loadedCount = 0;
  const images = [];
  
  data.screenshots.forEach((screenshot, index) => {
    const img = new Image();
    img.onload = () => {
      images[index] = img;
      loadedCount++;
      
      if (loadedCount === data.screenshots.length) {
        // Draw all images
        images.forEach((img, i) => {
          const offsetY = data.screenshots[i].scrollTop - data.minScroll;
          ctx.drawImage(img, 0, offsetY);
        });
        
        // Convert to data URL and download
        const dataUrl = canvas.toDataURL('image/png');
        chrome.runtime.sendMessage({
          action: 'downloadImage',
          dataUrl,
          filename: `longss-scroll-${Date.now()}.png`
        });
      }
    };
    img.src = screenshot.dataUrl;
  });
}

function showRecordingOverlay() {
  recordingOverlay = document.createElement('div');
  recordingOverlay.id = 'longss-recording-overlay';
  recordingOverlay.innerHTML = `
    <div class="longss-recording-indicator">
      <div class="longss-recording-dot"></div>
      <span>Recording Scroll...</span>
    </div>
  `;
  document.body.appendChild(recordingOverlay);
}

function hideRecordingOverlay() {
  if (recordingOverlay) {
    recordingOverlay.remove();
    recordingOverlay = null;
  }
}
