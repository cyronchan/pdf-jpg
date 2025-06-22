# PDF to Image Converter

A modern, accessible, and feature-rich web application that converts PDF files to high-quality PNG images directly in your browser. No server required - all processing happens locally for maximum privacy and security.

## ✨ Features

### Core Functionality
- **PDF to PNG Conversion**: Convert PDF pages to high-quality PNG images
- **Multiple Quality Settings**: Choose from 75, 150, or 300 DPI output
- **Batch Processing**: Convert all pages at once with progress tracking
- **Individual Downloads**: Download specific pages or all pages together

### User Experience
- **Drag & Drop Upload**: Intuitive file upload with visual feedback
- **Real-time Progress**: Live progress tracking during conversion
- **Preview Functionality**: Preview converted images in a modal window
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode Support**: Automatic dark/light theme switching

### Accessibility & Performance
- **WCAG Compliant**: Full keyboard navigation and screen reader support
- **Memory Management**: Efficient resource cleanup and memory optimization
- **Batch Processing**: Parallel page conversion for better performance
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Abort Operations**: Cancel ongoing conversions at any time

### Technical Features
- **Client-side Processing**: No data leaves your device
- **Modern JavaScript**: ES6+ features with proper error handling
- **PDF.js Integration**: Robust PDF parsing and rendering
- **Canvas Optimization**: High-quality image output with compression
- **Cross-browser Support**: Works in all modern browsers

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server setup required - runs entirely in the browser

### Installation
1. Download or clone this repository
2. Open `index.html` in your web browser
3. Start converting PDFs!

### Usage

1. **Upload a PDF**:
   - Drag and drop a PDF file onto the upload zone
   - Or click "Browse Files" to select a file
   - Maximum file size: 50MB

2. **Choose Quality**:
   - Select your preferred image quality (75, 150, or 300 DPI)
   - Higher DPI = better quality but larger file sizes

3. **Convert**:
   - The conversion starts automatically
   - Watch the progress bar for real-time updates
   - Pages are converted in parallel for faster processing

4. **Download Results**:
   - Preview individual pages by clicking "Preview"
   - Download individual pages with "Download"
   - Download all pages at once with "Download All"

## 🎯 Recent Improvements

### Performance Enhancements
- **Batch Processing**: Pages are now converted in parallel batches of 3
- **Memory Optimization**: Proper cleanup of object URLs and canvas elements
- **Abort Controller**: Ability to cancel ongoing conversions
- **Timeout Handling**: 30-second timeout for PDF loading operations

### User Experience
- **Modal Previews**: In-app image preview instead of opening new tabs
- **File Size Display**: Shows the size of each converted image
- **Loading States**: Visual feedback during download operations
- **Debounced Quality Changes**: Smooth quality setting updates

### Accessibility
- **ARIA Labels**: Comprehensive screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus handling in modals
- **High Contrast Support**: Enhanced visibility in high contrast mode
- **Reduced Motion**: Respects user's motion preferences

### Error Handling
- **Comprehensive Validation**: File type and size validation
- **Graceful Degradation**: Better error recovery
- **User-friendly Messages**: Clear, actionable error messages
- **Abort Error Handling**: Proper handling of cancelled operations

### Code Quality
- **Modular Architecture**: Better separation of concerns
- **Memory Leak Prevention**: Proper resource cleanup
- **Type Safety**: Better error handling and validation
- **Performance Monitoring**: Page visibility change handling

## 🛠️ Technical Details

### Architecture
- **Vanilla JavaScript**: No frameworks required
- **ES6 Classes**: Modern JavaScript patterns
- **Promise-based**: Async/await for clean asynchronous code
- **Event-driven**: Proper event handling and cleanup

### Dependencies
- **PDF.js**: For PDF parsing and rendering
- **pdf-lib**: For editing, rearranging, and combining PDFs
- **No build tools required**: Pure HTML, CSS, and JavaScript

### Browser Support
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full feature set with optimal layout
- **Tablet**: Touch-friendly interface with adapted spacing
- **Mobile**: Streamlined layout for smaller screens

## 🔧 Customization

### Quality Settings
Modify the quality options in `index.html`:
```html
<select class="form-control" id="qualitySelect">
    <option value="75">Low (75 DPI)</option>
    <option value="150">Standard (150 DPI)</option>
    <option value="300">High (300 DPI)</option>
    <option value="600">Ultra High (600 DPI)</option>
</select>
```

### File Size Limits
Adjust the maximum file size in `app.js`:
```javascript
const maxSize = 100 * 1024 * 1024; // 100MB
```

### Batch Processing
Modify batch size for performance tuning:
```javascript
const batchSize = 5; // Process 5 pages at once
```

## 🐛 Troubleshooting

### Common Issues

**"Failed to process PDF"**
- Ensure the file is a valid PDF
- Check file size (max 50MB)
- Try a different PDF file

**"PDF loading timeout"**
- Large PDFs may take longer to load
- Try with a smaller PDF first
- Check browser memory usage

**Slow conversion**
- Reduce quality setting
- Close other browser tabs
- Try on a device with more RAM

### Browser Compatibility
- Ensure JavaScript is enabled
- Update to the latest browser version
- Disable browser extensions that might interfere

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Search existing issues
3. Create a new issue with detailed information

---

**Note**: This application processes PDFs entirely in your browser. No data is sent to any server, ensuring complete privacy and security of your documents.

## Upcoming Features
- Rearranging PDF pages (drag-and-drop)
- Combining PDFs and images into a single PDF 