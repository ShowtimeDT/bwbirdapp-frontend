// BWBirdApp Main JavaScript File - Two-Button Capture UX

// Global state
let processedBlob = null;

// DOM element cache
const elements = {};

// Mobile detection
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
});

// Initialize the application
function initializeApp() {
    // Cache DOM elements
    cacheElements();
    
    // Set up navigation
    setupNavigation();
    
    // Set up image capture functionality
    setupImageCapture();
    
    // Initialize native capture
    import('./native-capture.js').then(module => {
        module.initNativeCapture(handleImageSelection);
    });
    
    // Hide Take Photo button on desktop
    if (!isMobile) {
        const takeBtn = document.getElementById('btn-take-photo');
        if (takeBtn) takeBtn.style.display = 'none';
    }
}

// Cache frequently used DOM elements
function cacheElements() {
    elements.navButtons = document.querySelectorAll('.nav-btn');
    elements.pages = document.querySelectorAll('.page');
    elements.takePhotoBtn = document.getElementById('btn-take-photo');
    elements.uploadPhotoBtn = document.getElementById('btn-upload-photo');
    elements.identifyBtn = document.getElementById('identify-btn');
    elements.resultSection = document.getElementById('result-section');
    elements.resultContent = document.getElementById('result-content');
    elements.photoPreview = document.getElementById('photo-preview');
}

// Navigation functionality
function setupNavigation() {
    // Handle navigation button clicks
    elements.navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetPage = this.id.replace('nav-', '') + '-page';
            
            // Update active nav button
            elements.navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show target page
            elements.pages.forEach(page => page.classList.remove('active'));
            document.getElementById(targetPage).classList.add('active');
        });
    });
}

// Image capture functionality
function setupImageCapture() {
    // Handle "Take Photo" button
    if (elements.takePhotoBtn) {
        elements.takePhotoBtn.addEventListener('click', function() {
            if (isMobile) {
                import('./native-capture.js').then(module => {
                    module.openNativeCamera();
                });
            }
        });
    }
    
    // Handle "Upload Photo" button
    if (elements.uploadPhotoBtn) {
        elements.uploadPhotoBtn.addEventListener('click', function() {
            import('./native-capture.js').then(module => {
                module.openFilePicker();
            });
        });
    }
    
    // Handle identify button click
    if (elements.identifyBtn) {
        elements.identifyBtn.addEventListener('click', function() {
            if (processedBlob) {
                identifySpecies(processedBlob);
            }
        });
    }
}

// Handle image selection from native capture
function handleImageSelection(blob) {
    console.log('Image selected and processed');
    processedBlob = blob;
    
    // Show the processed image preview
    if (elements.photoPreview) {
        elements.photoPreview.src = URL.createObjectURL(blob);
        elements.photoPreview.style.display = 'block';
        elements.photoPreview.style.maxWidth = '100%';
        elements.photoPreview.style.borderRadius = '15px';
        elements.photoPreview.style.margin = '20px auto';
        elements.photoPreview.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
    }
    
    // Enable identify button
    if (elements.identifyBtn) elements.identifyBtn.disabled = false;
}

// Identify species using AI
async function identifySpecies(imageBlob) {
    // Show loading state
    if (elements.identifyBtn) {
        elements.identifyBtn.disabled = true;
        elements.identifyBtn.textContent = 'Analyzing...';
    }
    if (elements.resultSection) elements.resultSection.style.display = 'block';
    if (elements.resultContent) elements.resultContent.innerHTML = '<p>AI is analyzing your wildlife photo...</p>';
    
    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('image', imageBlob, 'processed-image.jpg');
        
        // Send to backend (using Railway production backend)
        const backendUrl = 'https://bwbirdapp-backend-production.up.railway.app';
        const response = await fetch(`${backendUrl}/api/identify`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        displayIdentificationResult(result);
        
    } catch (error) {
        if (elements.resultContent) {
            elements.resultContent.innerHTML = `
                <p style="color: #e74c3c;">Error identifying species: ${error.message}</p>
                <p>Please try again with a clearer image.</p>
            `;
        }
    } finally {
        // Reset button state
        if (elements.identifyBtn) {
            elements.identifyBtn.disabled = false;
            elements.identifyBtn.textContent = 'Identify Species';
        }
    }
}

// Display identification results
function displayIdentificationResult(result) {
    
    if (result.success && result.identification) {
        const { commonName, scientificName, isBird, virginiaMonths, description, confidence } = result.identification;
        
        // Format Virginia months
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const virginiaMonthsText = virginiaMonths ? virginiaMonths.map(month => monthNames[month - 1]).join(', ') : 'Unknown';
        
        // Create seasonal indicator
        const currentMonth = new Date().getMonth() + 1;
        const isCurrentlyInVirginia = virginiaMonths && virginiaMonths.includes(currentMonth);
        const seasonalStatus = isCurrentlyInVirginia ? 
            `<span style="color: #27ae60; font-weight: bold;">Currently in Virginia</span>` : 
            `<span style="color: #e74c3c; font-weight: bold;">Not currently in Virginia</span>`;
        
        // Get the current image source
        const imageSrc = elements.photoPreview ? elements.photoPreview.src : '';
        
        elements.resultContent.innerHTML = `
            <div class="identification-result">
                ${imageSrc ? `<img src="${imageSrc}" alt="Identified Species" style="width: 100%; max-width: 400px; height: auto; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);">` : ''}
                <h4>Species Identified!</h4>
                <div class="species-info">
                    <p><strong>Common Name:</strong> ${commonName}</p>
                    <p><strong>Scientific Name:</strong> <em>${scientificName}</em></p>
                    <p><strong>Type:</strong> ${isBird ? 'Bird' : 'Fish'}</p>
                </div>
                <div class="virginia-info">
                    <h5>Virginia Information</h5>
                    <p><strong>Active Months:</strong> ${virginiaMonthsText}</p>
                    <p><strong>Current Status:</strong> ${seasonalStatus}</p>
                    <p><strong>Description:</strong> ${description}</p>
                </div>
                <button class="add-to-pokedex-btn" onclick="addToPokedex('${commonName}', '${scientificName}', '${result.imageUrl}')">
                    Add to collection
                </button>
            </div>
        `;
        
        // Show the result section
        if (elements.resultSection) {
            elements.resultSection.style.display = 'block';
        }
        
        // Hide the original photo preview since it's now in the result
        if (elements.photoPreview) {
            elements.photoPreview.style.display = 'none';
        }
    } else {
        elements.resultContent.innerHTML = `
            <p style="color: #e74c3c;">Could not identify species</p>
            <p>Please try with a clearer image of a bird or fish.</p>
        `;
    }
}

// Add to Pokédex (placeholder function)
async function addToPokedex(commonName, scientificName, imageUrl) {
    alert(`Added ${commonName} to your collection! (This feature requires authentication)`);
}