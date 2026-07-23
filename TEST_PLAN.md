# LongSS Testing Plan

This document outlines comprehensive testing procedures for the LongSS extension.

## 🎯 Test Objectives

- Verify all three capture modes work correctly
- Ensure cross-browser compatibility
- Validate error handling
- Confirm UI responsiveness
- Test performance on various page types

## 🧪 Test Environment Setup

### Required Browsers
- [ ] Google Chrome (latest)
- [ ] Microsoft Edge (latest)
- [ ] Brave Browser (latest)
- [ ] Opera (latest)
- [ ] Firefox (latest) - with manifest adjustments

### Test Pages
1. **test.html** - Provided test page with multiple sections
2. **Short page** - Single viewport height
3. **Medium page** - 3-4 viewports
4. **Long page** - 10+ viewports
5. **Dynamic content** - Social media sites (Twitter, Instagram, etc.)
6. **Infinite scroll** - YouTube, Pinterest

## 📋 Test Cases

### 1. Full Page Screenshot

#### Test Case 1.1: Short Page
- **Objective**: Capture page shorter than viewport
- **Steps**:
  1. Navigate to a short webpage
  2. Click extension icon
  3. Click "Full Page Screenshot"
- **Expected**: Single screenshot downloads immediately
- **Status**: ⬜ Pass / ⬜ Fail

#### Test Case 1.2: Long Page
- **Objective**: Capture multi-viewport page
- **Steps**:
  1. Open test.html
  2. Click extension icon
  3. Click "Full Page Screenshot"
  4. Wait for processing
- **Expected**: 
  - Progress indicator shows
  - Full page captured and stitched
  - All content visible in output
  - No gaps or overlaps
- **Status**: ⬜ Pass / ⬜ Fail

#### Test Case 1.3: Wide Page
- **Objective**: Capture page with horizontal scroll
- **Steps**:
  1. Navigate to wide content page
  2. Capture full page
- **Expected**: Width captured correctly
- **Status**: ⬜ Pass / ⬜ Fail

#### Test Case 1.4: Complex Layout
- **Objective**: Test with fixed headers/footers
- **Steps**:
  1. Navigate to page with fixed elements
  2. Capture full page
- **Expected**: Fixed elements handled appropriately
- **Status**: ⬜ Pass / ⬜ Fail

---

### 2. Framed Screenshot

#### Test Case 2.1: Standard Viewport
- **Objective**: Capture with frame
- **Steps**:
  1. Navigate to any webpage
  2. Click "Framed Screenshot"
- **Expected**:
  - Screenshot has white frame
  - Shadow effect applied
  - Padding visible around image
  - Downloads immediately
- **Status**: ⬜ Pass / ⬜ Fail

#### Test Case 2.2: Different Screen Sizes
- **Objective**: Test frame on various viewport sizes
- **Steps**:
  1. Resize browser window
  2. Capture framed screenshot at each size
- **Expected**: Frame scales appropriately
- **Status**: ⬜ Pass / ⬜ Fail

---

### 3. Scrolled Recording

#### Test Case 3.1: Basic Scroll Recording
- **Objective**: Record while scrolling
- **Steps**:
  1. Open test.html
  2. Hold "Hold to Record Scroll" button
  3. Scroll down slowly
  4. Release button
- **Expected**:
  - Recording indicator appears
  - Scrolled content captured
  - Image stitched correctly
  - All scrolled sections visible
- **Status**: ⬜ Pass / ⬜ Fail

#### Test Case 3.2: Quick Scroll
- **Objective**: Record with rapid scrolling
- **Steps**:
  1. Hold button
  2. Scroll quickly through content
  3. Release button
- **Expected**: Content captured despite speed
- **Status**: ⬜ Pass / ⬜ Fail

#### Test Case 3.3: Auto-Stop at 10 Seconds
- **Objective**: Verify 10-second limit
- **Steps**:
  1. Hold button for >10 seconds
  2. Continue scrolling
- **Expected**:
  - Recording stops at 10s
  - Progress bar reaches 100%
  - Screenshot processed automatically
- **Status**: ⬜ Pass / ⬜ Fail

#### Test Case 3.4: Early Release
- **Objective**: Stop before 10 seconds
- **Steps**:
  1. Hold button
  2. Scroll briefly (2-3 seconds)
  3. Release button
- **Expected**: Captures only scrolled content
- **Status**: ⬜ Pass / ⬜ Fail

#### Test Case 3.5: No Scroll
- **Objective**: Hold without scrolling
- **Steps**:
  1. Hold button
  2. Don't scroll
  3. Release after a few seconds
- **Expected**: Captures single viewport or minimal range
- **Status**: ⬜ Pass / ⬜ Fail

#### Test Case 3.6: Dynamic Content
- **Objective**: Test on social media feeds
- **Steps**:
  1. Open Twitter/Instagram feed
  2. Record while scrolling
  3. Release button
- **Expected**: Feed content captured correctly
- **Status**: ⬜ Pass / ⬜ Fail

---

### 4. User Interface

#### Test Case 4.1: Extension Icon
- **Objective**: Verify icon displays
- **Expected**:
  - Icon visible in toolbar
  - Correct size (16x16, 32x32, 48x48)
  - Clear and recognizable
- **Status**: ⬜ Pass / ⬜ Fail

#### Test Case 4.2: Popup UI
- **Objective**: Check popup appearance
- **Expected**:
  - Popup opens on click
  - All buttons visible
  - Styling correct
  - Responsive layout
- **Status**: ⬜ Pass / ⬜ Fail

#### Test Case 4.3: Status Messages
- **Objective**: Verify status indicators
- **Expected**:
  - Messages display during capture
  - Success message shows after completion
  - Messages clear appropriately
- **Status**: ⬜ Pass / ⬜ Fail

#### Test Case 4.4: Progress Bar
- **Objective**: Check progress indication
- **Expected**:
  - Progress bar shows during scroll recording
  - Percentage updates smoothly
  - Bar fills from 0% to 100%
- **Status**: ⬜ Pass / ⬜ Fail

#### Test Case 4.5: Recording Indicator
- **Objective**: Verify on-page indicator
- **Expected**:
  - Red indicator appears at top during recording
  - Pulsing animation works
  - Indicator removes after recording
- **Status**: ⬜ Pass / ⬜ Fail

---

### 5. Error Handling

#### Test Case 5.1: Permission Denied
- **Objective**: Handle permission errors
- **Steps**:
  1. Navigate to restricted page (chrome://extensions)
  2. Try to capture
- **Expected**: Appropriate error message
- **Status**: ⬜ Pass / ⬜ Fail

#### Test Case 5.2: Network Error
- **Objective**: Handle offline scenarios
- **Steps**:
  1. Disable network
  2. Try to capture
- **Expected**: Extension still functions for loaded content
- **Status**: ⬜ Pass / ⬜ Fail

#### Test Case 5.3: Very Long Page
- **Objective**: Handle extreme page lengths
- **Steps**:
  1. Navigate to extremely long page (100+ viewports)
  2. Capture full page
- **Expected**:
  - Completes without crashing
  - File size reasonable
  - Quality maintained
- **Status**: ⬜ Pass / ⬜ Fail

---

### 6. Performance

#### Test Case 6.1: Capture Speed
- **Objective**: Measure capture time
- **Steps**: Capture various page sizes
- **Expected**:
  - Short page: <1 second
  - Medium page: <5 seconds
  - Long page: <15 seconds
- **Status**: ⬜ Pass / ⬜ Fail

#### Test Case 6.2: Memory Usage
- **Objective**: Check resource consumption
- **Steps**:
  1. Monitor browser memory
  2. Perform multiple captures
- **Expected**: No memory leaks or excessive usage
- **Status**: ⬜ Pass / ⬜ Fail

#### Test Case 6.3: Image Quality
- **Objective**: Verify output quality
- **Expected**:
  - Text readable
  - Images clear
  - Colors accurate
  - No artifacts
- **Status**: ⬜ Pass / ⬜ Fail

---

### 7. Cross-Browser Testing

#### Chrome
- [ ] Full page capture
- [ ] Framed capture
- [ ] Scroll recording
- [ ] UI display
- [ ] Downloads

#### Edge
- [ ] Full page capture
- [ ] Framed capture
- [ ] Scroll recording
- [ ] UI display
- [ ] Downloads

#### Brave
- [ ] Full page capture
- [ ] Framed capture
- [ ] Scroll recording
- [ ] UI display
- [ ] Downloads

#### Opera
- [ ] Full page capture
- [ ] Framed capture
- [ ] Scroll recording
- [ ] UI display
- [ ] Downloads

#### Firefox (if adapted)
- [ ] Full page capture
- [ ] Framed capture
- [ ] Scroll recording
- [ ] UI display
- [ ] Downloads

---

## 🔍 Regression Testing

After any code changes, verify:
- [ ] All three capture modes still work
- [ ] No new console errors
- [ ] UI remains functional
- [ ] Downloads still trigger
- [ ] Performance not degraded

## 📊 Test Results Summary

| Category | Total | Passed | Failed | Blocked |
|----------|-------|--------|--------|---------|
| Full Page | 4 | - | - | - |
| Framed | 2 | - | - | - |
| Scroll Recording | 6 | - | - | - |
| UI | 5 | - | - | - |
| Error Handling | 3 | - | - | - |
| Performance | 3 | - | - | - |
| Cross-Browser | 5 | - | - | - |
| **TOTAL** | **28** | **-** | **-** | **-** |

## 🐛 Bug Tracking

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| - | - | - | - |

## ✅ Sign-Off

- [ ] All critical tests passed
- [ ] No blocking issues
- [ ] Documentation updated
- [ ] Ready for release

**Tested by**: _______________  
**Date**: _______________  
**Version**: 1.0.0
