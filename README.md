# 📸 LongSS - Long Screenshot Extension

A powerful and easy-to-use browser extension for capturing long screenshots with three versatile modes: Full Page, Framed, and Scrolled Recording.

![LongSS Logo](icons/icon128.png)

## ✨ Features

### 🌐 Full Page Screenshot
Capture the entire webpage from top to bottom automatically, perfect for:
- Documentation and archiving
- Long articles and blog posts
- Full website mockups
- Complete web pages

### 🖼️ Framed Screenshot
Take a stylish screenshot with a professional frame and shadow effect, ideal for:
- Presentations and portfolios
- Social media sharing
- Professional documentation
- Marketing materials

### 📜 Scrolled Recording (Hold to Record)
Record screenshots while scrolling through dynamic content:
- **Hold** the button to start recording (max 10 seconds)
- **Release** to stop and process
- Perfect for social media feeds (Twitter, Facebook, Instagram)
- Infinite scroll websites (YouTube, Pinterest)
- Chat conversations
- Timeline content

## 🚀 Installation

### Chrome / Edge / Brave / Opera

1. **Download the Extension**
   - Clone or download this repository
   - Extract the ZIP file if downloaded

2. **Open Extensions Page**
   - Chrome: Navigate to `chrome://extensions/`
   - Edge: Navigate to `edge://extensions/`
   - Brave: Navigate to `brave://extensions/`
   - Opera: Navigate to `opera://extensions/`

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the `LongSS` folder
   - The extension icon will appear in your toolbar

5. **Pin the Extension** (Optional but recommended)
   - Click the puzzle icon in the toolbar
   - Find "LongSS - Long Screenshot Tool"
   - Click the pin icon to keep it visible

### Firefox

1. **Temporary Installation** (for testing)
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from the LongSS folder

2. **Permanent Installation** (requires signing)
   - Package the extension as a ZIP file
   - Submit to [Firefox Add-ons](https://addons.mozilla.org/)
   - Install from the add-ons store after approval

## 📖 How to Use

### Full Page Screenshot
1. Click the LongSS extension icon
2. Click the "Full Page Screenshot" button
3. Wait while the extension captures the entire page
4. The screenshot will automatically download

### Framed Screenshot
1. Click the LongSS extension icon
2. Click "Framed Screenshot" to expand the frame options (style, padding, rounded corners)
3. Click "Ambil Screenshot Berbingkai" to capture with your chosen frame
4. Preview the result, then Save or Discard

### Scrolled Recording (Automatic)
1. Click the LongSS extension icon
2. Click "Mulai Rekam Scroll (Otomatis)" — the extension scrolls the page for you,
   capturing as it goes and waiting for lazy-loaded content (e.g. infinite-scroll feeds)
3. Click the button again in the popup, or the floating "Stop" button on the page,
   to end early — otherwise it stops automatically once it reaches the bottom or ~25s
4. Preview the stitched result, then Save or Discard

**Tips for Scroll Recording:**
- You don't need to scroll manually — the popup would close if you tried, since it loses
  focus as soon as the page is interacted with. The extension drives the scrolling itself.
- Great for capturing social media feeds, chats, timelines, and infinite-scroll pages
- Very long/infinite pages are capped to a safe canvas size — the preview will flag if a
  result was truncated

## 🎯 Use Cases

- **Developers**: Document full pages, capture responsive designs
- **Designers**: Create portfolio pieces with framed screenshots
- **Researchers**: Archive web content and social media threads
- **Support Teams**: Capture error messages and full conversation threads
- **Content Creators**: Share engaging social media content
- **Students**: Save online articles and research materials

## 🛠️ Technical Details

### Permissions Required
- `activeTab`: To capture screenshots of the current tab
- `storage`: To save user preferences
- `downloads`: To save captured screenshots
- `scripting`: To inject capture scripts into pages
- `<all_urls>`: To work on any website

### Architecture
- **Manifest V3**: Uses the latest extension standard
- **Service Worker**: Efficient background processing
- **Content Scripts**: Page-level capture functionality
- **Canvas API**: High-quality image processing and stitching

### File Structure
```
LongSS/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── content.js            # Content script for scroll capture
├── content.css           # Recording indicator styles
├── popup.html            # Extension popup UI
├── popup.css             # Popup styles
├── popup.js              # Popup functionality
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## 🔒 Privacy & Security

- **No Data Collection**: LongSS does not collect or transmit any user data
- **Local Processing**: All screenshots are processed locally on your device
- **No External Servers**: No images are sent to external servers
- **Open Source**: Full source code is available for review
- **Minimal Permissions**: Only requests necessary permissions

## 🐛 Troubleshooting

### Screenshots not capturing
- Ensure the extension has permission for the current website
- Try refreshing the page and trying again
- Check browser console for error messages

### Scroll recording not working
- Make sure you're holding the button while scrolling
- Some websites with complex scroll behaviors may not work perfectly
- Try scrolling at a moderate, consistent speed

### Downloads not starting
- Check your browser's download settings
- Ensure you have write permissions to the download folder
- Check if pop-up blocker is interfering

## 🔄 Updates & Changelog

### Version 1.0.0 (Current)
- ✅ Full page screenshot capture
- ✅ Framed screenshot with styling
- ✅ Scrolled recording (hold to record, max 10s)
- ✅ Progress indicators and status updates
- ✅ Cross-browser compatibility
- ✅ Modern UI with gradients and animations

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs and issues
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 💬 Support

If you encounter any issues or have questions:
1. Check the Troubleshooting section above
2. Open an issue on GitHub
3. Include browser version and error details

## 🌟 Credits

Developed with ❤️ for the web community.

Special thanks to:
- Modern web APIs (Canvas, OffscreenCanvas)
- Chrome Extension Platform
- All contributors and testers

---

**Enjoy capturing long screenshots with LongSS! 📸**
