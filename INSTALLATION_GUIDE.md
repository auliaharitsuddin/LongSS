# 📦 LongSS Installation Guide

Complete step-by-step instructions for installing the LongSS extension on different browsers.

## 📋 Table of Contents
- [Chrome Installation](#chrome-installation)
- [Microsoft Edge Installation](#microsoft-edge-installation)
- [Brave Browser Installation](#brave-browser-installation)
- [Opera Installation](#opera-installation)
- [Firefox Installation](#firefox-installation)
- [Icon Setup](#icon-setup)
- [Troubleshooting](#troubleshooting)

---

## 🌐 Chrome Installation

### Step 1: Download the Extension
1. Download or clone this repository
2. Extract the ZIP file if downloaded
3. Remember the location of the `LongSS` folder

### Step 2: Open Extensions Page
1. Open Google Chrome
2. Click the three-dot menu (⋮) in the top-right corner
3. Go to **More Tools** → **Extensions**
4. Or type `chrome://extensions/` in the address bar

### Step 3: Enable Developer Mode
1. Look for the **Developer mode** toggle in the top-right corner
2. Click to enable it
3. New buttons will appear: "Load unpacked", "Pack extension", "Update"

### Step 4: Load the Extension
1. Click the **Load unpacked** button
2. Navigate to and select the `LongSS` folder
3. Click **Select Folder**
4. The extension will now appear in your extensions list

### Step 5: Pin the Extension (Recommended)
1. Click the puzzle piece icon (🧩) in the Chrome toolbar
2. Find "LongSS - Long Screenshot Tool"
3. Click the pin icon (📌) next to it
4. The extension icon will now stay visible in your toolbar

### ✅ Verification
- Extension icon should appear in the toolbar
- Clicking it should open the popup interface
- All three buttons should be visible

---

## 🔷 Microsoft Edge Installation

### Step 1: Download the Extension
1. Download or clone this repository
2. Extract the ZIP file if downloaded
3. Note the location of the `LongSS` folder

### Step 2: Open Extensions Page
1. Open Microsoft Edge
2. Click the three-dot menu (⋯) in the top-right corner
3. Go to **Extensions**
4. Or type `edge://extensions/` in the address bar

### Step 3: Enable Developer Mode
1. Toggle **Developer mode** in the bottom-left corner
2. The switch should turn blue when enabled
3. Additional options will appear

### Step 4: Load the Extension
1. Click **Load unpacked**
2. Browse to the `LongSS` folder
3. Select the folder and click **Select Folder**
4. The extension loads immediately

### Step 5: Pin to Toolbar
1. Click the extensions icon in the toolbar
2. Find "LongSS - Long Screenshot Tool"
3. Click the eye icon (👁️) to show in toolbar
4. The extension is now easily accessible

### ✅ Verification
- Extension appears in the extensions list
- Icon visible in toolbar (if pinned)
- Popup opens when clicked

---

## 🦁 Brave Browser Installation

### Step 1: Download the Extension
1. Download or clone this repository
2. Extract if necessary
3. Locate the `LongSS` folder

### Step 2: Access Extensions
1. Open Brave Browser
2. Click the menu icon (≡) in the top-right
3. Go to **Settings** → **Extensions**
4. Or type `brave://extensions/` in the address bar

### Step 3: Enable Developer Mode
1. Find the **Developer mode** toggle in the top-right
2. Click to enable it
3. Additional buttons appear

### Step 4: Load the Extension
1. Click **Load unpacked**
2. Select the `LongSS` folder
3. Click **Select Folder**
4. Extension loads into Brave

### Step 5: Make Visible
1. Click the extensions button in the toolbar
2. Find LongSS
3. Pin it for quick access

### ✅ Verification
- Extension listed in brave://extensions/
- Icon accessible from toolbar
- All features functional

---

## 🎭 Opera Installation

### Step 1: Download the Extension
1. Download or clone this repository
2. Extract the files
3. Remember the `LongSS` folder location

### Step 2: Open Extensions Manager
1. Open Opera Browser
2. Click the Opera menu in the top-left
3. Go to **Extensions** → **Extensions**
4. Or type `opera://extensions/` in the address bar

### Step 3: Enable Developer Mode
1. Click **Developer mode** in the top-right corner
2. The switch should turn on
3. New options appear

### Step 4: Load the Extension
1. Click **Load unpacked**
2. Navigate to the `LongSS` folder
3. Select it and click **Select Folder**
4. The extension is now installed

### Step 5: Pin Extension
1. Click the extensions icon
2. Find LongSS
3. Pin to sidebar or toolbar

### ✅ Verification
- Extension appears in extensions list
- Icon available for quick access
- Popup interface works correctly

---

## 🦊 Firefox Installation

### Important Note
Firefox uses WebExtension format similar to Chrome, but our manifest is optimized for Chrome. For Firefox, you can install temporarily for testing.

### Temporary Installation (Development)

#### Step 1: Open Debugging Page
1. Open Firefox
2. Type `about:debugging#/runtime/this-firefox` in the address bar
3. Press Enter

#### Step 2: Load Temporary Add-on
1. Click **Load Temporary Add-on**
2. Navigate to the `LongSS` folder
3. Select the `manifest.json` file
4. Click **Open**

#### Step 3: Using the Extension
- Extension loads immediately
- Works until browser restart
- Reload needed after browser restart

### Permanent Installation (Production)

For permanent installation, the extension needs to be:
1. Packaged as .xpi file
2. Signed by Mozilla
3. Published on addons.mozilla.org

**Steps:**
1. Create account on [addons.mozilla.org](https://addons.mozilla.org/)
2. Submit extension for review
3. Wait for approval
4. Install from Mozilla Add-ons store

### ✅ Verification
- Extension appears in about:addons
- Icon visible in toolbar
- Features work as expected

---

## 🎨 Icon Setup

The extension requires icons in multiple sizes. We provide two methods to create them:

### Method 1: Generate Icons with Canvas (Easiest)

1. Open `create-icons-canvas.html` in your browser
2. Click "Generate Icons"
3. Download each icon by clicking on it
4. Save them in the `icons/` folder with these names:
   - `icon16.png`
   - `icon32.png`
   - `icon48.png`
   - `icon128.png`

### Method 2: Use Provided SVG

1. The `icons/icon.svg` file contains the design
2. Use an online converter like:
   - [CloudConvert](https://cloudconvert.com/svg-to-png)
   - [SVG2PNG](https://svg2png.com/)
3. Convert to PNG at sizes: 16px, 32px, 48px, 128px
4. Save in the `icons/` folder

### Method 3: Use Node.js (Advanced)

If you have Node.js installed:

```bash
npm install sharp
node create-icons.js
```

---

## 🔧 Troubleshooting

### Extension Not Loading

**Problem**: "Load unpacked" doesn't accept the folder

**Solutions**:
- Make sure you selected the `LongSS` folder, not its parent
- Verify `manifest.json` is in the root of the folder
- Check that all required files exist

### Icons Not Showing

**Problem**: Extension loads but no icon appears

**Solutions**:
- Generate the icon files using one of the methods above
- Ensure icons are in the `icons/` folder
- File names must match exactly: `icon16.png`, `icon32.png`, etc.
- Reload the extension after adding icons

### Popup Not Opening

**Problem**: Clicking the icon does nothing

**Solutions**:
- Check browser console for errors (F12)
- Verify `popup.html`, `popup.css`, and `popup.js` exist
- Reload the extension
- Try removing and re-loading the extension

### Screenshots Not Downloading

**Problem**: Capture completes but no download

**Solutions**:
- Check browser download settings
- Ensure downloads aren't blocked
- Verify download folder has write permissions
- Look in browser's download manager
- Check browser console for errors

### Extension Not Working on Some Sites

**Problem**: Extension grayed out or doesn't work

**Solutions**:
- Some sites like `chrome://` and `edge://` are restricted
- Browser prevents extensions on internal pages
- Works on regular websites only
- Check extension permissions in browser settings

### Scroll Recording Issues

**Problem**: Scroll capture not working properly

**Solutions**:
- Ensure you're holding the button while scrolling
- Try scrolling at a moderate, consistent speed
- Some dynamic sites may need special handling
- Check if site has custom scroll behavior
- Try on the provided test.html first

### Performance Issues

**Problem**: Slow capture or browser lag

**Solutions**:
- Close unnecessary tabs
- Disable other extensions temporarily
- Try on shorter pages first
- Check available system memory
- Clear browser cache

---

## 📞 Getting Help

If you continue to experience issues:

1. **Check the Console**: Press F12 and look for error messages
2. **Review the README**: See [README.md](README.md) for usage tips
3. **Read the Test Plan**: See [TEST_PLAN.md](TEST_PLAN.md) for known issues
4. **Report a Bug**: Open an issue on GitHub with:
   - Browser name and version
   - Operating system
   - Steps to reproduce
   - Console error messages
   - Screenshots if applicable

---

## ✅ Installation Checklist

- [ ] Extension folder downloaded/extracted
- [ ] Icons generated (all 4 sizes)
- [ ] Browser extensions page opened
- [ ] Developer mode enabled
- [ ] Extension loaded successfully
- [ ] Extension pinned to toolbar (optional)
- [ ] Popup opens when clicked
- [ ] All three capture buttons visible
- [ ] Test capture performed successfully

---

**Congratulations! LongSS is now installed and ready to use! 🎉**

For usage instructions, see the [README.md](README.md) file.
