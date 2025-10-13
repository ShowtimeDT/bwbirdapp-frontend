// BWBirdApp Main JavaScript File

// Global state
let selectedImage = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
});

// Initialize the application
function initializeApp() {
    // Set up navigation
    setupNavigation();
    
    // Set up image capture functionality
    setupImageCapture();
}

// Navigation functionality
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');
    
    // Handle navigation button clicks
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetPage = this.id.replace('nav-', '') + '-page';
            
            // Update active nav button
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show target page
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(targetPage).classList.add('active');
        });
    });
}

// Image capture functionality
function setupImageCapture() {
    const imageInput = document.getElementById('image-input');
    const identifyBtn = document.getElementById('identify-btn');
    const cameraBtn = document.getElementById('camera-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadSection = document.getElementById('upload-section');
    const cameraSection = document.getElementById('camera-section');
    const capturePhotoBtn = document.getElementById('capture-photo-btn');
    const retakeBtn = document.getElementById('retake-btn');
    
    // Handle camera/upload button clicks
    if (cameraBtn) {
        cameraBtn.addEventListener('click', function() {
            showCameraSection();
        });
    }
    
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
            showUploadSection();
        });
    }
    
    // Handle file input change
    if (imageInput) {
        imageInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                selectedImage = file;
                displayImagePreview(file);
                if (identifyBtn) identifyBtn.disabled = false;
            }
        });
    }
    
    // Handle identify button click
    if (identifyBtn) {
        identifyBtn.addEventListener('click', function() {
            if (selectedImage) {
                identifySpecies(selectedImage);
            }
        });
    }
    
    // Handle camera capture
    if (capturePhotoBtn) {
        capturePhotoBtn.addEventListener('click', function() {
            capturePhoto();
        });
    }
    
    // Handle retake button
    if (retakeBtn) {
        retakeBtn.addEventListener('click', function() {
            retakePhoto();
        });
    }
}

// Show camera section
function showCameraSection() {
    const uploadSection = document.getElementById('upload-section');
    const cameraSection = document.getElementById('camera-section');
    
    if (uploadSection) uploadSection.style.display = 'none';
    if (cameraSection) cameraSection.style.display = 'block';
    
    startCamera();
}

// Show upload section
function showUploadSection() {
    const uploadSection = document.getElementById('upload-section');
    const cameraSection = document.getElementById('camera-section');
    
    if (cameraSection) cameraSection.style.display = 'none';
    if (uploadSection) uploadSection.style.display = 'block';
    
    stopCamera();
}

// Start camera
async function startCamera() {
    try {
        const video = document.getElementById('camera-video');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        
        video.srcObject = stream;
        video.play();
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Unable to access camera. Please check permissions.');
    }
}

// Stop camera
function stopCamera() {
    const video = document.getElementById('camera-video');
    if (video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
    }
}

// Capture photo from camera
function capturePhoto() {
    const video = document.getElementById('camera-video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(function(blob) {
        const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
        selectedImage = file;
        displayImagePreview(file);
        
        // Stop camera
        stopCamera();
        
        // Automatically analyze the captured photo
        setTimeout(() => {
            identifySpecies(file);
        }, 1000); // Small delay to let UI update
    }, 'image/jpeg', 0.8);
}

// Retake photo
function retakePhoto() {
    const video = document.getElementById('camera-video');
    const captureBtn = document.getElementById('capture-photo-btn');
    const retakeBtn = document.getElementById('retake-btn');
    
    if (captureBtn) captureBtn.style.display = 'block';
    if (retakeBtn) retakeBtn.style.display = 'none';
    
    startCamera();
}

// Display image preview
function displayImagePreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('image-preview');
        if (preview) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; height: auto;">`;
        }
    };
    reader.readAsDataURL(file);
}

// Identify species using AI
async function identifySpecies(imageFile) {
    const identifyBtn = document.getElementById('identify-btn');
    const resultSection = document.getElementById('identification-result');
    const resultContent = document.getElementById('result-content');
    
    // Show loading state
    if (identifyBtn) {
        identifyBtn.disabled = true;
        identifyBtn.textContent = '🔍 Analyzing...';
    }
    if (resultSection) resultSection.style.display = 'block';
    if (resultContent) resultContent.innerHTML = '<p>🤖 AI is analyzing your wildlife photo...</p>';
    
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
        if (resultContent) {
            resultContent.innerHTML = `
                <p style="color: #e74c3c;">❌ Error identifying species: ${error.message}</p>
                <p>Please try again with a clearer image.</p>
            `;
        }
    } finally {
        // Reset button state
        if (identifyBtn) {
            identifyBtn.disabled = false;
            identifyBtn.textContent = '🔍 Identify Species';
        }
    }
}

// Display identification results
function displayIdentificationResult(result) {
    const resultContent = document.getElementById('result-content');
    
    if (result.success && result.identification) {
        const { commonName, scientificName, isBird, virginiaMonths, description, confidence } = result.identification;
        
        // Format Virginia months
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const virginiaMonthsText = virginiaMonths ? virginiaMonths.map(month => monthNames[month - 1]).join(', ') : 'Unknown';
        
        // Create seasonal indicator
        const currentMonth = new Date().getMonth() + 1;
        const isCurrentlyInVirginia = virginiaMonths && virginiaMonths.includes(currentMonth);
        const seasonalStatus = isCurrentlyInVirginia ? 
            `<span style="color: #27ae60; font-weight: bold;">✅ Currently in Virginia</span>` : 
            `<span style="color: #e74c3c; font-weight: bold;">❌ Not currently in Virginia</span>`;
        
        resultContent.innerHTML = `
            <div class="identification-result">
                <h4>🎯 Species Identified!</h4>
                <div class="species-info">
                    <p><strong>Common Name:</strong> ${commonName}</p>
                    <p><strong>Scientific Name:</strong> <em>${scientificName}</em></p>
                    <p><strong>Type:</strong> ${isBird ? '🐦 Bird' : '🐟 Fish'}</p>
                </div>
                <div class="virginia-info">
                    <h5>📍 Virginia Information</h5>
                    <p><strong>Active Months:</strong> ${virginiaMonthsText}</p>
                    <p><strong>Current Status:</strong> ${seasonalStatus}</p>
                    <p><strong>Description:</strong> ${description}</p>
                </div>
                <button class="add-to-pokedex-btn" onclick="addToPokedex('${commonName}', '${scientificName}', '${result.imageUrl}')">
                    📚 Add to my Pokédex
                </button>
            </div>
        `;
    } else {
        resultContent.innerHTML = `
            <p style="color: #e74c3c;">❌ Could not identify species</p>
            <p>Please try with a clearer image of a bird or fish.</p>
        `;
    }
}

// Add to Pokédex (placeholder function)
async function addToPokedex(commonName, scientificName, imageUrl) {
    alert(`Added ${commonName} to your Pokédex! (This feature requires authentication)`);
}