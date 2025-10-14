// BWBirdApp Main JavaScript File - Refactored with race-proof camera

// Global state
let selectedImage = null;

// DOM element cache
const elements = {};

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
}

// Cache frequently used DOM elements
function cacheElements() {
    elements.navButtons = document.querySelectorAll('.nav-btn');
    elements.pages = document.querySelectorAll('.page');
    elements.imageInput = document.getElementById('image-input');
    elements.identifyBtn = document.getElementById('identify-btn');
    elements.cameraBtn = document.getElementById('camera-btn');
    elements.uploadBtn = document.getElementById('upload-btn');
    elements.cameraSection = document.getElementById('camera-section');
    elements.capturePhotoBtn = document.getElementById('capture-photo-btn');
    elements.retakeBtn = document.getElementById('retake-btn');
    elements.video = document.getElementById('camera-video');
    elements.resultSection = document.getElementById('result-section');
    elements.resultContent = document.getElementById('result-content');
    elements.imagePreview = document.getElementById('image-preview');
}

// Navigation functionality
function setupNavigation() {
    // Handle navigation button clicks
    elements.navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetPage = this.id.replace('nav-', '') + '-page';
            
            // Stop camera if navigating away from capture page
            if (targetPage !== 'capture-page') {
                // Import and call stopCamera from camera.js
                import('./camera.js').then(module => {
                    module.stopCamera();
                });
            }
            
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
    // Handle camera/upload button clicks
    if (elements.cameraBtn) {
        elements.cameraBtn.addEventListener('click', showCameraSection);
    }
    
    if (elements.uploadBtn) {
        elements.uploadBtn.addEventListener('click', showUploadSection);
    }
    
    // Handle file input change
    if (elements.imageInput) {
        elements.imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                selectedImage = file;
                displayImagePreview(file);
                if (elements.identifyBtn) elements.identifyBtn.disabled = false;
            }
        });
    }
    
    // Handle identify button click
    if (elements.identifyBtn) {
        elements.identifyBtn.addEventListener('click', function() {
            if (selectedImage) {
                identifySpecies(selectedImage);
            }
        });
    }
    
    // Handle camera capture
    if (elements.capturePhotoBtn) {
        elements.capturePhotoBtn.addEventListener('click', capturePhoto);
    }
    
    // Handle retake button
    if (elements.retakeBtn) {
        elements.retakeBtn.addEventListener('click', retakePhoto);
    }
}

// Show camera section
function showCameraSection() {
    console.log('Switching to camera mode...');
    if (elements.cameraSection) elements.cameraSection.style.display = 'block';
    
    // Import and call startCamera from camera.js
    import('./camera.js').then(module => {
        module.startCamera();
    });
}

// Show upload section
function showUploadSection() {
    console.log('Switching to upload mode...');
    if (elements.cameraSection) elements.cameraSection.style.display = 'none';
    
    // Import and call stopCamera from camera.js
    import('./camera.js').then(module => {
        module.stopCamera();
    });
    
    // Directly trigger the file input dialog
    if (elements.imageInput) {
        elements.imageInput.click();
    }
}

// Display image preview
function displayImagePreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        if (elements.imagePreview) {
            elements.imagePreview.src = e.target.result;
            elements.imagePreview.style.display = 'block';
            elements.imagePreview.style.maxWidth = '500px';
            elements.imagePreview.style.maxHeight = '400px';
            elements.imagePreview.style.borderRadius = '15px';
            elements.imagePreview.style.margin = '20px auto';
            elements.imagePreview.style.display = 'block';
            elements.imagePreview.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        }
    };
    reader.readAsDataURL(file);
}

// Capture photo from camera
function capturePhoto() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = elements.video.videoWidth;
    canvas.height = elements.video.videoHeight;
    
    ctx.drawImage(elements.video, 0, 0);
    
    canvas.toBlob(function(blob) {
        const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
        selectedImage = file;
        displayImagePreview(file);
        
        // Stop camera after capture
        import('./camera.js').then(module => {
            module.stopCamera();
        });
        
        // Automatically analyze the captured photo
        setTimeout(() => {
            identifySpecies(file);
        }, 1000); // Small delay to let UI update
    }, 'image/jpeg', 0.8);
}

// Retake photo
function retakePhoto() {
    if (elements.capturePhotoBtn) elements.capturePhotoBtn.style.display = 'block';
    if (elements.retakeBtn) elements.retakeBtn.style.display = 'none';
    
    // Restart camera for retake
    import('./camera.js').then(module => {
        module.startCamera();
    });
}

// Identify species using AI
async function identifySpecies(imageFile) {
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
        formData.append('image', imageFile);
        
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
        const imageSrc = elements.imagePreview ? elements.imagePreview.src : '';
        
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
        if (elements.imagePreview) {
            elements.imagePreview.style.display = 'none';
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