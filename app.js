// PDF to Image Converter App
class PDFToImageConverter {
    constructor() {
        this.currentPDF = null;
        this.convertedImages = [];
        this.isConverting = false;
        this.abortController = null;
        
        // Configure PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        this.initializeElements();
        this.bindEvents();
        this.initializeDragAndDrop();
        this.setupAccessibility();
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
        
        // Theme toggle
        this.themeToggle = document.getElementById('themeToggle');
        this.themeToggleIcon = this.themeToggle.querySelector('.theme-toggle__icon');
    }
    
    bindEvents() {
        // File input events
        this.browseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.fileInput.click();
        });
        
        this.fileInput.addEventListener('change', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.target.files[0];
            if (file) {
                this.handleFileSelect(file);
            }
        });
        
        // Action buttons
        this.downloadAllBtn.addEventListener('click', () => this.downloadAllImages());
        this.convertAnotherBtn.addEventListener('click', () => this.resetApp());
        this.retryBtn.addEventListener('click', () => this.hideError());
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
        });
        
        // Quality change with debouncing
        let qualityChangeTimeout;
        this.qualitySelect.addEventListener('change', () => {
            clearTimeout(qualityChangeTimeout);
            qualityChangeTimeout = setTimeout(() => {
                if (this.currentPDF && !this.isConverting) {
                    this.convertPDFToImages(this.currentPDF);
                }
            }, 300);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        
        // Page visibility handling
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Initialize theme
        this.initializeTheme();
    }
    
    setupAccessibility() {
        // Add ARIA labels and roles
        this.uploadZone.setAttribute('role', 'button');
        this.uploadZone.setAttribute('tabindex', '0');
        this.uploadZone.setAttribute('aria-label', 'Upload PDF file');
        
        this.browseBtn.setAttribute('aria-label', 'Browse for PDF file');
        this.qualitySelect.setAttribute('aria-label', 'Select image quality');
        this.downloadAllBtn.setAttribute('aria-label', 'Download all converted images');
        this.convertAnotherBtn.setAttribute('aria-label', 'Convert another PDF file');
        
        // Add keyboard support for upload zone
        this.uploadZone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.fileInput.click();
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
            this.uploadZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.highlight();
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            this.uploadZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.unhighlight();
            }, false);
        });
        
        // Handle dropped files
        this.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDrop(e);
        }, false);
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    highlight() {
        this.uploadZone.classList.add('drag-over');
        this.uploadZone.setAttribute('aria-pressed', 'true');
    }
    
    unhighlight() {
        this.uploadZone.classList.remove('drag-over');
        this.uploadZone.setAttribute('aria-pressed', 'false');
    }
    
    handleDrop(e) {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            // Only process the first file to prevent multiple conversions
            const file = files[0];
            console.log('File dropped:', file.name, file.type, file.size);
            this.handleFileSelect(file);
        }
    }
    
    handleFileSelect(file) {
        if (!file) return;
        
        console.log('File selected:', file.name, file.type, file.size);
        
        // Prevent multiple conversions
        if (this.isConverting) {
            console.log('Conversion already in progress, ignoring new file');
            return;
        }
        
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
        console.log('Starting conversion for:', file.name);
        this.convertFileToImages(file);
    }
    
    async convertFileToImages(file) {
        console.log('convertFileToImages called for:', file.name);
        
        if (this.isConverting) {
            console.log('Already converting, aborting duplicate call');
            return;
        }
        
        // Abort any ongoing conversion
        if (this.abortController) {
            console.log('Aborting previous conversion');
            this.abortController.abort();
        }
        
        this.abortController = new AbortController();
        this.isConverting = true;
        this.showProgress();
        this.updateProgress(0, 'Loading PDF...');
        
        console.log('Starting PDF conversion process');
        
        try {
            // Read file as array buffer
            const arrayBuffer = await file.arrayBuffer();
            
            // Check if operation was aborted
            if (this.abortController.signal.aborted) {
                console.log('Conversion aborted after file read');
                return;
            }
            
            // Load PDF with timeout
            const loadingTask = pdfjsLib.getDocument(arrayBuffer);
            const pdf = await Promise.race([
                loadingTask.promise,
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('PDF loading timeout')), 30000)
                )
            ]);
            
            if (this.abortController.signal.aborted) {
                console.log('Conversion aborted after PDF load');
                return;
            }
            
            this.currentPDF = pdf;
            this.updateProgress(10, `Loading PDF... Found ${pdf.numPages} pages`);
            
            // Convert pages to images
            await this.convertPDFToImages(pdf);
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Conversion aborted');
                return;
            }
            console.error('Error converting PDF:', error);
            this.showError(`Failed to process PDF: ${error.message}`);
        } finally {
            console.log('Conversion process completed');
            this.isConverting = false;
            this.abortController = null;
            
            // Clear the file input to prevent reprocessing the same file
            this.fileInput.value = '';
        }
    }
    
    async convertPDFToImages(pdf) {
        this.cleanupImages();
        this.convertedImages = [];
        this.thumbnailGallery.innerHTML = '';
        
        const quality = parseInt(this.qualitySelect.value);
        const scale = quality / 72; // Convert DPI to scale factor
        
        const totalPages = pdf.numPages;
        
        // Process pages in batches for better performance
        const batchSize = 3;
        for (let batchStart = 1; batchStart <= totalPages; batchStart += batchSize) {
            const batchEnd = Math.min(batchStart + batchSize - 1, totalPages);
            
            // Process batch in parallel
            const batchPromises = [];
            for (let pageNum = batchStart; pageNum <= batchEnd; pageNum++) {
                batchPromises.push(this.convertPage(pdf, pageNum, scale, totalPages));
            }
            
            try {
                await Promise.all(batchPromises);
                
                // Check if operation was aborted
                if (this.abortController?.signal.aborted) return;
                
            } catch (error) {
                console.error('Error in batch conversion:', error);
                if (!this.abortController?.signal.aborted) {
                    this.showError(`Failed to convert pages ${batchStart}-${batchEnd}: ${error.message}`);
                }
                return;
            }
        }
        
        this.updateProgress(100, `Successfully converted ${totalPages} pages!`);
        
        // Show results after a brief delay
        setTimeout(() => {
            this.showResults();
        }, 500);
    }
    
    async convertPage(pdf, pageNum, scale, totalPages) {
        try {
            this.updateProgress(
                10 + (pageNum - 1) / totalPages * 80,
                `Converting page ${pageNum} of ${totalPages}...`
            );
            
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            
            // Create canvas with optimal settings
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d', { alpha: false });
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // Set canvas properties for better quality
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
            
            // Render page to canvas
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            // Convert canvas to blob with compression
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png', 0.95);
            });
            
            // Create image data object
            const imageData = {
                pageNumber: pageNum,
                blob: blob,
                url: URL.createObjectURL(blob),
                filename: `page-${pageNum.toString().padStart(2, '0')}.png`,
                canvas: canvas,
                size: blob.size
            };
            
            this.convertedImages.push(imageData);
            
            // Create thumbnail immediately
            this.createThumbnail(imageData);
            
        } catch (error) {
            console.error(`Error converting page ${pageNum}:`, error);
            throw new Error(`Page ${pageNum}: ${error.message}`);
        }
    }
    
    createThumbnail(imageData) {
        const thumbnailItem = document.createElement('div');
        thumbnailItem.className = 'thumbnail-item fade-in';
        thumbnailItem.setAttribute('role', 'article');
        thumbnailItem.setAttribute('aria-label', `Page ${imageData.pageNumber}`);
        
        // Create preview image
        const img = document.createElement('img');
        img.className = 'thumbnail-preview';
        img.src = imageData.url;
        img.alt = `Page ${imageData.pageNumber}`;
        img.loading = 'lazy';
        
        // Create info section
        const info = document.createElement('div');
        info.className = 'thumbnail-info';
        
        const title = document.createElement('div');
        title.className = 'thumbnail-title';
        title.textContent = `Page ${imageData.pageNumber}`;
        
        const sizeInfo = document.createElement('div');
        sizeInfo.className = 'thumbnail-size';
        sizeInfo.textContent = this.formatFileSize(imageData.size);
        
        const actions = document.createElement('div');
        actions.className = 'thumbnail-actions';
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn btn--primary';
        downloadBtn.textContent = 'Download';
        downloadBtn.setAttribute('aria-label', `Download page ${imageData.pageNumber}`);
        downloadBtn.addEventListener('click', () => this.downloadImage(imageData));
        
        const previewBtn = document.createElement('button');
        previewBtn.className = 'btn btn--outline';
        previewBtn.textContent = 'Preview';
        previewBtn.setAttribute('aria-label', `Preview page ${imageData.pageNumber}`);
        previewBtn.addEventListener('click', () => this.previewImage(imageData));
        
        actions.appendChild(downloadBtn);
        actions.appendChild(previewBtn);
        
        info.appendChild(title);
        info.appendChild(sizeInfo);
        info.appendChild(actions);
        
        thumbnailItem.appendChild(img);
        thumbnailItem.appendChild(info);
        
        this.thumbnailGallery.appendChild(thumbnailItem);
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    downloadImage(imageData) {
        const link = document.createElement('a');
        link.href = imageData.url;
        link.download = imageData.filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    previewImage(imageData) {
        // Create modal for preview
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Page ${imageData.pageNumber}</h3>
                    <button class="modal-close" aria-label="Close preview">&times;</button>
                </div>
                <div class="modal-body">
                    <img src="${imageData.url}" alt="Page ${imageData.pageNumber}" style="max-width: 100%; height: auto;">
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Trigger animation
        setTimeout(() => modal.classList.add('show'), 10);
        
        // Close modal functionality
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                if (modal.parentNode) {
                    document.body.removeChild(modal);
                }
                document.removeEventListener('keydown', handleKeydown);
            }, 300);
        };
        
        const handleKeydown = (e) => {
            if (e.key === 'Escape') closeModal();
        };
        
        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        document.addEventListener('keydown', handleKeydown);
        
        // Focus management
        modal.querySelector('.modal-close').focus();
    }
    
    async downloadAllImages() {
        if (this.convertedImages.length === 0) return;
        
        // Show loading state
        this.downloadAllBtn.disabled = true;
        this.downloadAllBtn.textContent = 'Downloading...';
        
        try {
            // For multiple downloads, we'll trigger each download with a small delay
            // to avoid browser blocking multiple simultaneous downloads
            for (let i = 0; i < this.convertedImages.length; i++) {
                await new Promise(resolve => {
                    setTimeout(() => {
                        this.downloadImage(this.convertedImages[i]);
                        resolve();
                    }, i * 200); // 200ms delay between downloads
                });
            }
            
            this.showSuccess(`Started download of ${this.convertedImages.length} images`);
        } finally {
            // Reset button state
            this.downloadAllBtn.disabled = false;
            this.downloadAllBtn.textContent = 'Download All';
        }
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
        successDiv.style.borderRadius = '8px';
        successDiv.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        successDiv.setAttribute('role', 'alert');
        
        document.body.appendChild(successDiv);
        
        // Animate in
        setTimeout(() => successDiv.style.opacity = '1', 10);
        
        setTimeout(() => {
            successDiv.style.opacity = '0';
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 300);
        }, 3000);
    }
    
    resetApp() {
        // Abort any ongoing conversion
        if (this.abortController) {
            this.abortController.abort();
        }
        
        // Clean up resources
        this.cleanupImages();
        this.convertedImages = [];
        this.currentPDF = null;
        this.isConverting = false;
        this.abortController = null;
        
        // Clear file input
        this.fileInput.value = '';
        
        // Reset UI
        this.hideAllSections();
        this.uploadSection.classList.remove('hidden');
        this.thumbnailGallery.innerHTML = '';
        
        // Reset button states
        this.downloadAllBtn.disabled = false;
        this.downloadAllBtn.textContent = 'Download All';
    }
    
    cleanupImages() {
        // Revoke object URLs to prevent memory leaks
        this.convertedImages.forEach(imageData => {
            if (imageData.url) {
                URL.revokeObjectURL(imageData.url);
            }
        });
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
    
    handleKeyboardShortcuts(e) {
        // ESC key to close any modals or reset
        if (e.key === 'Escape') {
            if (!this.isConverting) {
                this.hideError();
            }
        }
        
        // Ctrl/Cmd + O to open file dialog
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
            e.preventDefault();
            this.fileInput.click();
        }
        
        // Ctrl/Cmd + T to toggle theme
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            this.toggleTheme();
        }
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden, could pause any ongoing operations
            console.log('Page hidden - operations paused');
        } else {
            // Page is visible again
            console.log('Page visible - operations resumed');
        }
    }
    
    initializeTheme() {
        // Check for saved theme preference or default to system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-color-scheme', savedTheme);
            this.updateThemeIcon(savedTheme);
        } else {
            // Use system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const theme = prefersDark ? 'dark' : 'light';
            document.documentElement.setAttribute('data-color-scheme', theme);
            this.updateThemeIcon(theme);
        }
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-color-scheme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }
    
    updateThemeIcon(theme) {
        this.themeToggleIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    
    switchMode(mode) {
        // Update tab states
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });
        
        // Show/hide sections
        const convertSection = document.getElementById('convertSection');
        const editSection = document.getElementById('editSection');
        const combineSection = document.getElementById('combineSection');
        
        convertSection.classList.toggle('hidden', mode !== 'convert');
        if (editSection) editSection.classList.toggle('hidden', mode !== 'edit');
        if (combineSection) combineSection.classList.toggle('hidden', mode !== 'combine');
        
        // Update header description based on mode
        const headerDescription = document.querySelector('.header__description');
        switch (mode) {
            case 'convert':
                headerDescription.textContent = 'Convert your PDF files to high-quality PNG images. Simply upload your PDF and download individual pages or all at once.';
                break;
            case 'edit':
                headerDescription.textContent = 'Rearrange PDF pages with drag-and-drop. Upload a PDF, reorder the pages, and export the rearranged document.';
                break;
            case 'combine':
                headerDescription.textContent = 'Combine multiple PDFs and images into a single PDF. Upload files, arrange them in order, and export the combined document.';
                break;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Prevent multiple initializations
    if (window.pdfConverter) {
        console.log('PDF Converter already initialized');
        return;
    }
    
    console.log('Initializing PDF Converter');
    window.pdfConverter = new PDFToImageConverter();
    
    // Initialize PDF Editor and Combiner
    try { window.pdfEditor = new PDFEditor(); } catch (error) { console.error("PDFEditor failed:", error); }
    try { window.pdfCombiner = new PDFCombiner(); } catch (error) { console.error("PDFCombiner failed:", error); }
});

// Add: PDF Edit Mode UI and logic
class PDFEditor {
    constructor() {
        this.pdfDoc = null;
        this.pages = [];
        this.pageOrder = [];
        this.thumbnails = [];
        this.initUI();
    }

    initUI() {
        // Create edit section inside the main container
        const editSection = document.createElement('div');
        editSection.className = 'mode-section hidden';
        editSection.id = 'editSection';
        editSection.innerHTML = `
            <section class="edit-section">
                <h2>Edit PDF: Rearrange Pages</h2>
                <input type="file" id="editPdfInput" accept=".pdf,application/pdf">
                <div class="edit-thumbnails" id="editThumbnails"></div>
                <button class="btn btn--primary" id="exportEditedPdfBtn" disabled>Export Rearranged PDF</button>
            </section>
        `;
        
        // Insert after convert section
        const convertSection = document.getElementById('convertSection');
        convertSection.parentNode.insertBefore(editSection, convertSection.nextSibling);
        
        this.editPdfInput = editSection.querySelector('#editPdfInput');
        this.editThumbnails = editSection.querySelector('#editThumbnails');
        this.exportBtn = editSection.querySelector('#exportEditedPdfBtn');
        this.editPdfInput.addEventListener('change', (e) => this.handleFile(e.target.files[0]));
        this.exportBtn.addEventListener('click', () => this.exportPdf());
    }

    async handleFile(file) {
        if (!file) return;
        const arrayBuffer = await file.arrayBuffer();
        this.pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        this.pages = this.pdfDoc.getPages();
        this.pageOrder = this.pages.map((_, i) => i);
        this.renderThumbnails();
        this.exportBtn.disabled = false;
    }

    renderThumbnails() {
        this.editThumbnails.innerHTML = '';
        this.pageOrder.forEach((pageIdx, i) => {
            const thumb = document.createElement('div');
            thumb.className = 'edit-thumbnail';
            thumb.draggable = true;
            thumb.dataset.idx = i;
            thumb.textContent = `Page ${pageIdx + 1}`;
            thumb.addEventListener('dragstart', (e) => this.onDragStart(e, i));
            thumb.addEventListener('dragover', (e) => e.preventDefault());
            thumb.addEventListener('drop', (e) => this.onDrop(e, i));
            this.editThumbnails.appendChild(thumb);
        });
    }

    onDragStart(e, idx) {
        e.dataTransfer.setData('text/plain', idx);
    }

    onDrop(e, idx) {
        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (fromIdx === idx) return;
        // Rearrange pageOrder
        const moved = this.pageOrder.splice(fromIdx, 1)[0];
        this.pageOrder.splice(idx, 0, moved);
        this.renderThumbnails();
    }

    async exportPdf() {
        if (!this.pdfDoc || this.pageOrder.length === 0) return;
        
        try {
            this.exportBtn.disabled = true;
            this.exportBtn.textContent = 'Exporting...';
            
            const newPdfDoc = await PDFLib.PDFDocument.create();
            
            // Copy pages in the new order
            for (const pageIdx of this.pageOrder) {
                const [copiedPage] = await newPdfDoc.copyPages(this.pdfDoc, [pageIdx]);
                newPdfDoc.addPage(copiedPage);
            }
            
            const pdfBytes = await newPdfDoc.save();
            
            // Create download link
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'rearranged-pdf.pdf';
            link.click();
            URL.revokeObjectURL(url);
            
            this.exportBtn.textContent = 'Export Rearranged PDF';
            this.exportBtn.disabled = false;
            
        } catch (error) {
            console.error('Export failed:', error);
            this.exportBtn.textContent = 'Export Failed';
            setTimeout(() => {
                this.exportBtn.textContent = 'Export Rearranged PDF';
                this.exportBtn.disabled = false;
            }, 2000);
        }
    }
}

// Add: PDF Combiner for merging PDFs and images
class PDFCombiner {
    constructor() {
        this.files = [];
        this.thumbnails = [];
        this.initUI();
    }

    initUI() {
        // Create combine section inside the main container
        const combineSection = document.createElement('div');
        combineSection.className = 'mode-section hidden';
        combineSection.id = 'combineSection';
        combineSection.innerHTML = `
            <section class="combine-section">
                <h2>Combine PDFs & Images</h2>
                <input type="file" id="combineFilesInput" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*" multiple>
                <div class="combine-thumbnails" id="combineThumbnails"></div>
                <button class="btn btn--primary" id="exportCombinedPdfBtn" disabled>Export Combined PDF</button>
            </section>
        `;
        
        // Insert after edit section
        const editSection = document.getElementById('editSection');
        if (editSection) {
            editSection.parentNode.insertBefore(combineSection, editSection.nextSibling);
        } else {
            const convertSection = document.getElementById('convertSection');
            convertSection.parentNode.insertBefore(combineSection, convertSection.nextSibling);
        }
        
        this.combineFilesInput = combineSection.querySelector('#combineFilesInput');
        this.combineThumbnails = combineSection.querySelector('#combineThumbnails');
        this.exportBtn = combineSection.querySelector('#exportCombinedPdfBtn');
        this.combineFilesInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        this.exportBtn.addEventListener('click', () => this.exportCombinedPdf());
    }

    async handleFiles(fileList) {
        this.files = Array.from(fileList);
        this.renderThumbnails();
        this.exportBtn.disabled = this.files.length === 0;
    }

    renderThumbnails() {
        this.combineThumbnails.innerHTML = '';
        this.files.forEach((file, i) => {
            const thumb = document.createElement('div');
            thumb.className = 'combine-thumbnail';
            thumb.draggable = true;
            thumb.dataset.idx = i;
            
            if (file.type === 'application/pdf') {
                thumb.textContent = `PDF: ${file.name}`;
                thumb.style.backgroundColor = '#e3f2fd';
            } else {
                thumb.textContent = `Image: ${file.name}`;
                thumb.style.backgroundColor = '#f3e5f5';
            }
            
            thumb.addEventListener('dragstart', (e) => this.onDragStart(e, i));
            thumb.addEventListener('dragover', (e) => e.preventDefault());
            thumb.addEventListener('drop', (e) => this.onDrop(e, i));
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.className = 'remove-file-btn';
            removeBtn.onclick = () => this.removeFile(i);
            thumb.appendChild(removeBtn);
            
            this.combineThumbnails.appendChild(thumb);
        });
    }

    removeFile(idx) {
        this.files.splice(idx, 1);
        this.renderThumbnails();
        this.exportBtn.disabled = this.files.length === 0;
    }

    onDragStart(e, idx) {
        e.dataTransfer.setData('text/plain', idx);
    }

    onDrop(e, idx) {
        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (fromIdx === idx) return;
        
        const moved = this.files.splice(fromIdx, 1)[0];
        this.files.splice(idx, 0, moved);
        this.renderThumbnails();
    }

    async exportCombinedPdf() {
        if (this.files.length === 0) return;
        
        try {
            this.exportBtn.disabled = true;
            this.exportBtn.textContent = 'Combining...';
            
            const newPdfDoc = await PDFLib.PDFDocument.create();
            
            for (const file of this.files) {
                if (file.type === 'application/pdf') {
                    // Handle PDF files
                    const arrayBuffer = await file.arrayBuffer();
                    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
                    const pages = await newPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
                    pages.forEach(page => newPdfDoc.addPage(page));
                } else {
                    // Handle image files
                    const arrayBuffer = await file.arrayBuffer();
                    let image;
                    
                    if (file.type.startsWith('image/jpeg') || file.type.startsWith('image/jpg')) {
                        image = await newPdfDoc.embedJpg(arrayBuffer);
                    } else if (file.type.startsWith('image/png')) {
                        image = await newPdfDoc.embedPng(arrayBuffer);
                    } else {
                        console.warn('Unsupported image type:', file.type);
                        continue;
                    }
                    
                    const page = newPdfDoc.addPage([image.width, image.height]);
                    page.drawImage(image, { x: 0, y: 0 });
                }
            }
            
            const pdfBytes = await newPdfDoc.save();
            
            // Create download link
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'combined-pdf.pdf';
            link.click();
            URL.revokeObjectURL(url);
            
            this.exportBtn.textContent = 'Export Combined PDF';
            this.exportBtn.disabled = false;
            
        } catch (error) {
            console.error('Combine failed:', error);
            this.exportBtn.textContent = 'Combine Failed';
            setTimeout(() => {
                this.exportBtn.textContent = 'Export Combined PDF';
                this.exportBtn.disabled = false;
            }, 2000);
        }
    }
}