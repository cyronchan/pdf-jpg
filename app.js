// PDF to Image Converter App
class PDFToImageConverter {
    constructor() {
        this.currentPDF = null;
        this.convertedImages = [];
        this.isConverting = false;
        
        // Configure PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        this.initializeElements();
        this.bindEvents();
        this.initializeDragAndDrop();
    }
    
    initializeElements() {
        // Main sections
        this.uploadSection = document.getElementById('uploadSection');
        this.progressSection = document.getElementById('progressSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.errorSection = document.getElementById('errorSection');
        
        // Upload elements
        this.uploadZone = document.getElementById('uploadZone');
        this.fileInput = document.getElementById('fileInput');
        this.browseBtn = document.getElementById('browseBtn');
        this.qualitySelect = document.getElementById('qualitySelect');
        
        // Progress elements
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        
        // Results elements
        this.thumbnailGallery = document.getElementById('thumbnailGallery');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.convertAnotherBtn = document.getElementById('convertAnotherBtn');
        
        // Error elements
        this.errorMessage = document.getElementById('errorMessage');
        this.retryBtn = document.getElementById('retryBtn');
    }
    
    bindEvents() {
        // File input events
        this.browseBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
        
        // Action buttons
        this.downloadAllBtn.addEventListener('click', () => this.downloadAllImages());
        this.convertAnotherBtn.addEventListener('click', () => this.resetApp());
        this.retryBtn.addEventListener('click', () => this.hideError());
        
        // Quality change
        this.qualitySelect.addEventListener('change', () => {
            if (this.currentPDF && !this.isConverting) {
                this.convertPDFToImages(this.currentPDF);
            }
        });
    }
    
    initializeDragAndDrop() {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.uploadZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });
        
        // Highlight drop zone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            this.uploadZone.addEventListener(eventName, () => this.highlight(), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            this.uploadZone.addEventListener(eventName, () => this.unhighlight(), false);
        });
        
        // Handle dropped files
        this.uploadZone.addEventListener('drop', (e) => this.handleDrop(e), false);
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    highlight() {
        this.uploadZone.classList.add('drag-over');
    }
    
    unhighlight() {
        this.uploadZone.classList.remove('drag-over');
    }
    
    handleDrop(e) {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFileSelect(files[0]);
        }
    }
    
    handleFileSelect(file) {
        if (!file) return;
        
        // Validate file type
        if (file.type !== 'application/pdf') {
            this.showError('Please select a valid PDF file.');
            return;
        }
        
        // Validate file size (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB in bytes
        if (file.size > maxSize) {
            this.showError('File size exceeds the 50MB limit. Please choose a smaller file.');
            return;
        }
        
        this.hideError();
        this.convertFileToImages(file);
    }
    
    async convertFileToImages(file) {
        if (this.isConverting) return;
        
        this.isConverting = true;
        this.showProgress();
        this.updateProgress(0, 'Loading PDF...');
        
        try {
            // Read file as array buffer
            const arrayBuffer = await file.arrayBuffer();
            
            // Load PDF
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            this.currentPDF = pdf;
            
            this.updateProgress(10, `Loading PDF... Found ${pdf.numPages} pages`);
            
            // Convert pages to images
            await this.convertPDFToImages(pdf);
            
        } catch (error) {
            console.error('Error converting PDF:', error);
            this.showError(`Failed to process PDF: ${error.message}`);
        } finally {
            this.isConverting = false;
        }
    }
    
    async convertPDFToImages(pdf) {
        this.convertedImages = [];
        this.thumbnailGallery.innerHTML = '';
        
        const quality = parseInt(this.qualitySelect.value);
        const scale = quality / 72; // Convert DPI to scale factor
        
        const totalPages = pdf.numPages;
        
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            try {
                this.updateProgress(
                    10 + (pageNum - 1) / totalPages * 80,
                    `Converting page ${pageNum} of ${totalPages}...`
                );
                
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale });
                
                // Create canvas
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                // Render page to canvas
                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;
                
                // Convert canvas to blob
                const blob = await new Promise(resolve => {
                    canvas.toBlob(resolve, 'image/png', 1.0);
                });
                
                // Create image data object
                const imageData = {
                    pageNumber: pageNum,
                    blob: blob,
                    url: URL.createObjectURL(blob),
                    filename: `page-${pageNum.toString().padStart(2, '0')}.png`,
                    canvas: canvas
                };
                
                this.convertedImages.push(imageData);
                
                // Create thumbnail immediately
                this.createThumbnail(imageData);
                
            } catch (error) {
                console.error(`Error converting page ${pageNum}:`, error);
                this.showError(`Failed to convert page ${pageNum}: ${error.message}`);
                return;
            }
        }
        
        this.updateProgress(100, `Successfully converted ${totalPages} pages!`);
        
        // Show results after a brief delay
        setTimeout(() => {
            this.showResults();
        }, 500);
    }
    
    createThumbnail(imageData) {
        const thumbnailItem = document.createElement('div');
        thumbnailItem.className = 'thumbnail-item fade-in';
        
        // Create preview image
        const img = document.createElement('img');
        img.className = 'thumbnail-preview';
        img.src = imageData.url;
        img.alt = `Page ${imageData.pageNumber}`;
        
        // Create info section
        const info = document.createElement('div');
        info.className = 'thumbnail-info';
        
        const title = document.createElement('div');
        title.className = 'thumbnail-title';
        title.textContent = `Page ${imageData.pageNumber}`;
        
        const actions = document.createElement('div');
        actions.className = 'thumbnail-actions';
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn btn--primary';
        downloadBtn.textContent = 'Download';
        downloadBtn.addEventListener('click', () => this.downloadImage(imageData));
        
        const previewBtn = document.createElement('button');
        previewBtn.className = 'btn btn--outline';
        previewBtn.textContent = 'Preview';
        previewBtn.addEventListener('click', () => this.previewImage(imageData));
        
        actions.appendChild(downloadBtn);
        actions.appendChild(previewBtn);
        
        info.appendChild(title);
        info.appendChild(actions);
        
        thumbnailItem.appendChild(img);
        thumbnailItem.appendChild(info);
        
        this.thumbnailGallery.appendChild(thumbnailItem);
    }
    
    downloadImage(imageData) {
        const link = document.createElement('a');
        link.href = imageData.url;
        link.download = imageData.filename;
        link.click();
    }
    
    previewImage(imageData) {
        // Open image in new tab for preview
        window.open(imageData.url, '_blank');
    }
    
    async downloadAllImages() {
        if (this.convertedImages.length === 0) return;
        
        // For multiple downloads, we'll trigger each download with a small delay
        // to avoid browser blocking multiple simultaneous downloads
        for (let i = 0; i < this.convertedImages.length; i++) {
            setTimeout(() => {
                this.downloadImage(this.convertedImages[i]);
            }, i * 100); // 100ms delay between downloads
        }
        
        // Show success message
        this.showSuccess(`Started download of ${this.convertedImages.length} images`);
    }
    
    showSuccess(message) {
        // Create and show a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'status status--success';
        successDiv.textContent = message;
        successDiv.style.position = 'fixed';
        successDiv.style.top = '20px';
        successDiv.style.right = '20px';
        successDiv.style.zIndex = '1000';
        successDiv.style.padding = '12px 20px';
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
    
    resetApp() {
        // Clear converted images and revoke object URLs
        this.convertedImages.forEach(imageData => {
            URL.revokeObjectURL(imageData.url);
        });
        this.convertedImages = [];
        this.currentPDF = null;
        this.isConverting = false;
        
        // Clear file input
        this.fileInput.value = '';
        
        // Reset UI
        this.hideAllSections();
        this.uploadSection.classList.remove('hidden');
        this.thumbnailGallery.innerHTML = '';
    }
    
    showProgress() {
        this.hideAllSections();
        this.progressSection.classList.remove('hidden');
    }
    
    showResults() {
        this.hideAllSections();
        this.resultsSection.classList.remove('hidden');
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
        this.hideAllSections();
        this.errorSection.classList.remove('hidden');
    }
    
    hideError() {
        this.hideAllSections();
        this.uploadSection.classList.remove('hidden');
    }
    
    hideAllSections() {
        [this.uploadSection, this.progressSection, this.resultsSection, this.errorSection]
            .forEach(section => section.classList.add('hidden'));
    }
    
    updateProgress(percentage, text) {
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = text;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PDFToImageConverter();
});

// Add some utility functions for better user experience
document.addEventListener('keydown', (e) => {
    // ESC key to close any modals or reset
    if (e.key === 'Escape') {
        const converter = window.pdfConverter;
        if (converter && !converter.isConverting) {
            converter.hideError();
        }
    }
});

// Handle page visibility change to clean up resources
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, could pause any ongoing operations
        console.log('Page hidden - operations paused');
    } else {
        // Page is visible again
        console.log('Page visible - operations resumed');
    }
});

// Store converter instance globally for debugging
window.addEventListener('load', () => {
    window.pdfConverter = new PDFToImageConverter();
});