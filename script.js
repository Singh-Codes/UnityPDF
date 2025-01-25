// Initialize language support
const translations = {
    en: {
        dragDrop: 'Drag & Drop PDF Files Here',
        choose: 'Choose Files',
        merge: 'Merge PDFs',
        download: 'Download Merged PDF',
        merging: 'Merging your PDFs...'
    },
    es: {
        dragDrop: 'Arrastra y suelta archivos PDF aquí',
        choose: 'Elegir archivos',
        merge: 'Combinar PDFs',
        download: 'Descargar PDF combinado',
        merging: 'Combinando tus PDFs...'
    },
    fr: {
        dragDrop: 'Glissez et déposez des fichiers PDF ici',
        choose: 'Choisir des fichiers',
        merge: 'Fusionner les PDF',
        download: 'Télécharger le PDF fusionné',
        merging: 'Fusion de vos PDF...'
    }
};

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const pdfList = document.getElementById('pdfList');
const mergeBtn = document.getElementById('mergeBtn');
const downloadBtn = document.getElementById('downloadBtn');
const progressOverlay = document.querySelector('.progress-overlay');
const progressFill = document.querySelector('.progress-fill');
const themeToggle = document.getElementById('theme-toggle');
const languageSelector = document.getElementById('language-selector');

// State
let uploadedFiles = [];
let currentLanguage = 'en';

// Theme Toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = themeToggle.querySelector('i');
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.replace('fa-moon', 'fa-sun');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
    }
});

// Language Switch
languageSelector.addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    updateLanguage();
});

function updateLanguage() {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.dataset.translate;
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
}

// Drag and Drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
    handleFiles(files);
});

// File Input
dropZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
    handleFiles(files);
});

// Handle uploaded files
function handleFiles(files) {
    files.forEach(file => {
        if (!uploadedFiles.some(f => f.name === file.name)) {
            uploadedFiles.push(file);
            addPDFToList(file);
        }
    });
}

function addPDFToList(file) {
    const item = document.createElement('div');
    item.className = 'pdf-item';
    item.innerHTML = `
        <i class="fas fa-file-pdf"></i>
        <span>${file.name}</span>
        <button class="remove-btn" onclick="removeFile('${file.name}')">
            <i class="fas fa-times"></i>
        </button>
    `;
    pdfList.appendChild(item);
}

function removeFile(fileName) {
    uploadedFiles = uploadedFiles.filter(file => file.name !== fileName);
    updatePDFList();
}

function updatePDFList() {
    pdfList.innerHTML = '';
    uploadedFiles.forEach(file => addPDFToList(file));
}

// Initialize Sortable
new Sortable(pdfList, {
    animation: 150,
    ghostClass: 'sortable-ghost'
});

// Merge PDFs
mergeBtn.addEventListener('click', async () => {
    if (uploadedFiles.length === 0) {
        alert('Please upload at least one PDF file');
        return;
    }

    progressOverlay.style.display = 'flex';
    progressFill.style.width = '0%';
    let progress = 0;

    try {
        // Create a new PDF document
        const mergedPdf = await PDFLib.PDFDocument.create();
        
        for (let i = 0; i < uploadedFiles.length; i++) {
            try {
                const file = uploadedFiles[i];
                // Read the file as ArrayBuffer
                const fileArrayBuffer = await readFileAsArrayBuffer(file);
                
                // Load the PDF document
                const pdf = await PDFLib.PDFDocument.load(fileArrayBuffer, { 
                    ignoreEncryption: true 
                });
                
                // Copy all pages
                const pageIndices = pdf.getPageIndices();
                const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
                
                // Add each copied page to the new document
                copiedPages.forEach((page) => {
                    mergedPdf.addPage(page);
                });
                
                // Update progress
                progress = ((i + 1) / uploadedFiles.length) * 100;
                progressFill.style.width = `${progress}%`;
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                throw new Error(`Failed to process ${file.name}. Please make sure it's a valid PDF file.`);
            }
        }

        // Save the merged PDF
        const mergedPdfBytes = await mergedPdf.save();
        
        // Create a Blob from the PDF bytes
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

        // Set up download button
        downloadBtn.onclick = () => {
            download(blob, 'merged.pdf', 'application/pdf');
        };

        progressOverlay.style.display = 'none';
        document.querySelector('.download-section').hidden = false;

    } catch (error) {
        console.error('Error merging PDFs:', error);
        alert(error.message || 'An error occurred while merging PDFs. Please make sure all files are valid PDF documents.');
        progressOverlay.style.display = 'none';
    }
});

// Helper function to read file as ArrayBuffer
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const answer = question.nextElementSibling;
        const icon = question.querySelector('i');
        
        answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
        icon.classList.toggle('fa-chevron-down');
        icon.classList.toggle('fa-chevron-up');
    });
});

// Initialize
updateLanguage();
