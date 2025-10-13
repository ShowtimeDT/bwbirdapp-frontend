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
    
    // Set up auth buttons
    setupAuthButtons();
    
    // Check authentication status
    checkAuthStatus();
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
    
    // Handle capture option buttons
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
    
    // Handle file selection
    if (imageInput) {
        imageInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                selectedImage = file;
                displayImagePreview(file);
                identifyBtn.disabled = false;
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
    
    // Handle retake
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
    
    // Start camera
    startCamera();
}

// Show upload section
function showUploadSection() {
    const uploadSection = document.getElementById('upload-section');
    const cameraSection = document.getElementById('camera-section');
    
    if (cameraSection) cameraSection.style.display = 'none';
    if (uploadSection) uploadSection.style.display = 'block';
    
    // Stop camera if running
    stopCamera();
}

// Start camera
async function startCamera() {
    try {
        const video = document.getElementById('camera-video');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment' // Use back camera on mobile
            } 
        });
        
        video.srcObject = stream;
        video.style.display = 'block';
        
        // Show capture button
        const captureBtn = document.getElementById('capture-photo-btn');
        const retakeBtn = document.getElementById('retake-btn');
        if (captureBtn) captureBtn.style.display = 'inline-block';
        if (retakeBtn) retakeBtn.style.display = 'none';
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Unable to access camera. Please check permissions and try again.');
        // Fallback to upload section
        showUploadSection();
    }
}

// Stop camera
function stopCamera() {
    const video = document.getElementById('camera-video');
    if (video && video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
        video.style.display = 'none';
    }
}

// Capture photo from camera
function capturePhoto() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const captureBtn = document.getElementById('capture-photo-btn');
    const retakeBtn = document.getElementById('retake-btn');
    
    if (video && canvas) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        canvas.toBlob(function(blob) {
            if (blob) {
                // Create a File object from the blob
                const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
                selectedImage = file;
                
                // Display preview
                displayImagePreview(file);
                
                // Enable identify button
                const identifyBtn = document.getElementById('identify-btn');
                if (identifyBtn) identifyBtn.disabled = false;
                
                // Update button states
                if (captureBtn) captureBtn.style.display = 'none';
                if (retakeBtn) retakeBtn.style.display = 'inline-block';
                
                // Stop camera
                stopCamera();
                
                // Automatically analyze the captured photo
                setTimeout(() => {
                    identifySpecies(file);
                }, 1000); // Small delay to let UI update
            }
        }, 'image/jpeg', 0.8);
    }
}

// Retake photo
function retakePhoto() {
    const video = document.getElementById('camera-video');
    const captureBtn = document.getElementById('capture-photo-btn');
    const retakeBtn = document.getElementById('retake-btn');
    const identifyBtn = document.getElementById('identify-btn');
    
    // Clear selected image
    selectedImage = null;
    
    // Reset preview
    const preview = document.getElementById('image-preview');
    if (preview) {
        preview.innerHTML = '<p>No image selected</p>';
    }
    
    // Disable identify button
    if (identifyBtn) identifyBtn.disabled = true;
    
    // Update button states
    if (captureBtn) captureBtn.style.display = 'inline-block';
    if (retakeBtn) retakeBtn.style.display = 'none';
    
    // Restart camera
    startCamera();
}

// Display image preview
function displayImagePreview(file) {
    const reader = new FileReader();
    const imagePreview = document.getElementById('image-preview');
    
    reader.onload = function(e) {
        imagePreview.innerHTML = `<img src="${e.target.result}" alt="Selected image">`;
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
        
        // Send to backend (using Railway backend)
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
                <p><strong>AI Confidence:</strong> ${Math.round(confidence * 100)}%</p>
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

// Add to Pokédex (new function)
async function addToPokedex(commonName, scientificName, imageUrl) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('❌ Please log in to add species to your Pokédex');
            return;
        }

            const backendUrl = 'https://bwbirdapp-backend-production.up.railway.app';
        const response = await fetch(`${backendUrl}/api/sightings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                scientific_name: scientificName,
                common_name: commonName,
                image_url: imageUrl
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            alert(`✅ ${commonName} added to your Pokédex!`);
            
            // Update the button to show it's been added
            const button = document.querySelector('.add-to-pokedex-btn');
            if (button) {
                button.innerHTML = '✅ Added to Pokédex';
                button.disabled = true;
                button.style.backgroundColor = '#27ae60';
            }
            
            // Refresh catalogue if on that page
            if (document.getElementById('catalogue-page').classList.contains('active')) {
                loadSightings();
            }
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add to Pokédex');
        }
    } catch (error) {
        alert(`❌ Failed to add to Pokédex: ${error.message}`);
    }
}

// Load sightings for catalogue
async function loadSightings() {
    try {
            const backendUrl = 'https://bwbirdapp-backend-production.up.railway.app';
        const response = await fetch(`${backendUrl}/api/sightings`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const sightings = await response.json();
            displaySightings(sightings);
        }
    } catch (error) {
        // Silently handle error - sightings will show empty state
    }
}

// Display sightings in catalogue
function displaySightings(sightings) {
    const sightingsList = document.getElementById('sightings-list');
    
    if (sightings.length === 0) {
        sightingsList.innerHTML = '<p class="empty-state">No sightings yet. Go capture some birds!</p>';
        return;
    }
    
    sightingsList.innerHTML = sightings.map(sighting => `
        <div class="sighting-card">
            <img src="${sighting.image_url}" alt="${sighting.common_name || sighting.scientific_name}" class="sighting-image">
            <div class="sighting-info">
                <h3>${sighting.common_name || sighting.scientific_name}</h3>
                <p><em>${sighting.scientific_name}</em></p>
                <p>Spotted on ${new Date(sighting.created_at).toLocaleDateString()}</p>
            </div>
        </div>
    `).join('');
}

// Auth buttons functionality
function setupAuthButtons() {
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    const closeLogin = document.getElementById('close-login');
    const closeSignup = document.getElementById('close-signup');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    
    // Open modals
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            loginModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (signupBtn) {
        signupBtn.addEventListener('click', function() {
            signupModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    }
    
    // Close modals
    if (closeLogin) {
        closeLogin.addEventListener('click', function() {
            loginModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
    
    if (closeSignup) {
        closeSignup.addEventListener('click', function() {
            signupModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
    
    // Switch between modals
    if (showSignup) {
        showSignup.addEventListener('click', function(e) {
            e.preventDefault();
            loginModal.style.display = 'none';
            signupModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (showLogin) {
        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            signupModal.style.display = 'none';
            loginModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        if (event.target === signupModal) {
            signupModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Setup form handlers
    setupLoginForm();
    setupSignupForm();
    setupPasswordValidation();
}

// Login form functionality
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const submitBtn = loginForm.querySelector('.submit-btn');
            
            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging in...';
            
            try {
                    const response = await fetch('https://bwbirdapp-backend-production.up.railway.app/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Store token and user info
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('user', JSON.stringify(result.user));
                    
                    // Update UI
                    updateAuthUI(true, result.user);
                    
                    // Close modal
                    document.getElementById('login-modal').style.display = 'none';
                    document.body.style.overflow = 'auto';
                    
                    // Clear form
                    loginForm.reset();
                    
                    alert('Login successful!');
                } else {
                    throw new Error(result.error || 'Login failed');
                }
            } catch (error) {
                alert('Login failed: ' + error.message);
            } finally {
                // Re-enable button
                submitBtn.disabled = false;
                submitBtn.textContent = 'Login';
            }
        });
    }
}

// Signup form functionality
function setupSignupForm() {
    const signupForm = document.getElementById('signup-form');
    
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('signup-username').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm').value;
            const submitBtn = signupForm.querySelector('.submit-btn');
            
            // Validate passwords match
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            
            // Validate password strength
            if (!validatePassword(password)) {
                alert('Password does not meet requirements!');
                return;
            }
            
            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';
            
            try {
                    const response = await fetch('https://bwbirdapp-backend-production.up.railway.app/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, email, password })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Store token and user info
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('user', JSON.stringify(result.user));
                    
                    // Update UI
                    updateAuthUI(true, result.user);
                    
                    // Close modal
                    document.getElementById('signup-modal').style.display = 'none';
                    document.body.style.overflow = 'auto';
                    
                    // Clear form
                    signupForm.reset();
                    
                    alert('Account created successfully!');
                } else {
                    throw new Error(result.error || 'Registration failed');
                }
            } catch (error) {
                alert('Registration failed: ' + error.message);
            } finally {
                // Re-enable button
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign Up';
            }
        });
    }
}

// Password validation
function setupPasswordValidation() {
    const passwordInput = document.getElementById('signup-password');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            updatePasswordRequirements(password);
        });
    }
}

// Update password requirements display
function updatePasswordRequirements(password) {
    const requirements = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        special: /[0-9!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    // Update visual indicators
    document.getElementById('req-length').className = requirements.length ? 'valid' : 'invalid';
    document.getElementById('req-lowercase').className = requirements.lowercase ? 'valid' : 'invalid';
    document.getElementById('req-uppercase').className = requirements.uppercase ? 'valid' : 'invalid';
    document.getElementById('req-special').className = requirements.special ? 'valid' : 'invalid';
}

// Validate password strength
function validatePassword(password) {
    return password.length >= 8 &&
           /[a-z]/.test(password) &&
           /[A-Z]/.test(password) &&
           /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);
}

// Update authentication UI
function updateAuthUI(isLoggedIn, user = null) {
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    
    if (isLoggedIn && user) {
        // User is logged in
        loginBtn.textContent = `Welcome, ${user.username}`;
        loginBtn.style.backgroundColor = '#27ae60';
        signupBtn.textContent = 'Logout';
        signupBtn.onclick = logout;
    } else {
        // User is not logged in
        loginBtn.textContent = 'Login';
        loginBtn.style.backgroundColor = '';
        loginBtn.onclick = () => document.getElementById('login-modal').style.display = 'block';
        signupBtn.textContent = 'Sign Up';
        signupBtn.onclick = () => document.getElementById('signup-modal').style.display = 'block';
    }
}

// Logout functionality
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthUI(false);
    alert('Logged out successfully!');
}

// Check if user is logged in on page load
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        try {
            const userData = JSON.parse(user);
            updateAuthUI(true, userData);
        } catch (error) {
            // Invalid user data, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            updateAuthUI(false);
        }
    } else {
        updateAuthUI(false);
    }
}
