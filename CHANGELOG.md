# Changelog

All notable changes to the LongSS extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-23

### Added
- ✨ Full page screenshot capture with automatic scrolling and stitching
- 🖼️ Framed screenshot mode with professional styling and shadow effects
- 📜 Scrolled recording mode with hold-to-record button (max 10 seconds)
- 📊 Real-time progress indicators during capture
- 🎨 Modern gradient UI design with smooth animations
- 🔔 On-page recording indicator with pulsing animation
- 💾 Automatic download of captured screenshots
- 📱 Responsive popup interface
- 🌐 Cross-browser compatibility (Chrome, Edge, Brave, Opera)
- 🔒 Privacy-focused design with local processing only
- 📖 Comprehensive documentation (README, Installation Guide, Test Plan)
- 🧪 Test HTML page for validation
- 🎨 Custom icon set (16px, 32px, 48px, 128px)
- 📄 MIT License
- 🤝 Contributing guidelines
- 📝 Detailed changelog

### Technical Features
- Manifest V3 implementation
- Service Worker background script
- Content script injection for scroll capture
- Canvas-based image stitching
- OffscreenCanvas for performance
- Progress tracking and auto-stop at 10 seconds
- Error handling and validation
- Status message system

### Browser Support
- ✅ Google Chrome (tested)
- ✅ Microsoft Edge (tested)
- ✅ Brave Browser (tested)
- ✅ Opera Browser (tested)
- ⚠️ Firefox (requires minor manifest adjustments)

### Known Limitations
- Maximum scroll recording duration: 10 seconds
- Some sites with fixed elements may have capture artifacts
- Browser internal pages (chrome://, edge://) are not accessible
- Very large pages may take longer to process

## [Unreleased]

### Planned Features
- Custom frame color selection
- Export format options (JPG, WebP)
- Quality settings for compression
- Keyboard shortcuts for capture modes
- Area selection tool
- Annotation tools (arrows, text, shapes)
- Cloud storage integration (optional)
- Multi-language support
- Dark mode for popup UI
- Capture history within extension
- Batch capture mode

### Potential Improvements
- Optimize stitching algorithm for better performance
- Add support for capturing specific page elements
- Implement viewport-specific capture
- Add watermark option
- Include metadata in saved files
- Compression options for file size reduction

---

## Version History Summary

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2026-07-23 | Initial release with core features |

---

## Notes

### How to Contribute
See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

### Reporting Issues
Please report bugs and feature requests on GitHub Issues with:
- Browser and version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Console errors if applicable

### Versioning Scheme
- **Major**: Breaking changes or significant new features
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes and minor improvements

---

**Latest Version**: 1.0.0  
**Last Updated**: July 23, 2026
