// Background service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureFullPage') {
    handleFullPageCapture(sender.tab);
  } else if (message.action === 'captureFramed') {
    handleFramedCapture(sender.tab);
  } else if (message.action === 'downloadImage') {
    downloadImage(message.dataUrl, message.filename);
  }
});

// Full page capture
async function handleFullPageCapture(tab) {
  try {
    // Capture visible area first
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png'
    });
    
    // Get page dimensions
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getPageDimensions
    });
    
    const dimensions = result.result;
    
    if (dimensions.scrollHeight <= dimensions.viewportHeight) {
      // No scrolling needed, just download current view
      downloadImage(dataUrl, `longss-fullpage-${Date.now()}.png`);
      chrome.runtime.sendMessage({ action: 'fullPageComplete' });
      return;
    }
    
    // Capture multiple screens and stitch
    await captureAndStitchFullPage(tab, dimensions);
    
  } catch (error) {
    console.error('Full page capture error:', error);
    chrome.runtime.sendMessage({ action: 'fullPageComplete' });
  }
}

// Framed capture
async function handleFramedCapture(tab) {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png'
    });
    
    // Add frame to image
    const framedDataUrl = await addFrameToImage(dataUrl);
    downloadImage(framedDataUrl, `longss-framed-${Date.now()}.png`);
    
    chrome.runtime.sendMessage({ action: 'framedComplete' });
  } catch (error) {
    console.error('Framed capture error:', error);
    chrome.runtime.sendMessage({ action: 'framedComplete' });
  }
}

// Get page dimensions
function getPageDimensions() {
  return {
    scrollHeight: document.documentElement.scrollHeight,
    scrollWidth: document.documentElement.scrollWidth,
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth,
    scrollTop: window.pageYOffset || document.documentElement.scrollTop
  };
}

// Capture and stitch full page
async function captureAndStitchFullPage(tab, dimensions) {
  const screenshots = [];
  const viewportHeight = dimensions.viewportHeight;
  const totalHeight = dimensions.scrollHeight;
  const numScreens = Math.ceil(totalHeight / viewportHeight);
  
  // Capture each screen
  for (let i = 0; i < numScreens; i++) {
    const scrollTop = i * viewportHeight;
    
    // Scroll to position
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (top) => {
        window.scrollTo(0, top);
      },
      args: [scrollTop]
    });
    
    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Capture
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png'
    });
    
    screenshots.push({
      dataUrl,
      offsetY: scrollTop
    });
  }
  
  // Scroll back to top
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.scrollTo(0, 0)
  });
  
  // Stitch images
  const stitchedDataUrl = await stitchImages(screenshots, dimensions);
  downloadImage(stitchedDataUrl, `longss-fullpage-${Date.now()}.png`);
  
  chrome.runtime.sendMessage({ action: 'fullPageComplete' });
}

// Stitch images together
async function stitchImages(screenshots, dimensions) {
  return new Promise((resolve) => {
    const canvas = new OffscreenCanvas(dimensions.viewportWidth, dimensions.scrollHeight);
    const ctx = canvas.getContext('2d');
    
    let loadedCount = 0;
    const images = [];
    
    screenshots.forEach((screenshot, index) => {
      const img = new Image();
      img.onload = () => {
        images[index] = img;
        loadedCount++;
        
        if (loadedCount === screenshots.length) {
          // Draw all images
          images.forEach((img, i) => {
            const offsetY = screenshots[i].offsetY;
            ctx.drawImage(img, 0, offsetY);
          });
          
          canvas.convertToBlob({ type: 'image/png' }).then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        }
      };
      img.src = screenshot.dataUrl;
    });
  });
}

// Add frame to image
async function addFrameToImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const padding = 40;
      const shadowBlur = 20;
      const canvas = new OffscreenCanvas(
        img.width + (padding * 2) + shadowBlur,
        img.height + (padding * 2) + shadowBlur
      );
      const ctx = canvas.getContext('2d');
      
      // Background
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 10;
      
      // White frame
      ctx.fillStyle = 'white';
      ctx.fillRect(
        padding,
        padding,
        img.width,
        img.height
      );
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      
      // Draw image
      ctx.drawImage(img, padding, padding);
      
      canvas.convertToBlob({ type: 'image/png' }).then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    };
    img.src = dataUrl;
  });
}

// Download image
function downloadImage(dataUrl, filename) {
  chrome.downloads.download({
    url: dataUrl,
    filename: filename,
    saveAs: false
  });
}
