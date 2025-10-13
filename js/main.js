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
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    
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
            
            // Close mobile menu if open
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    });
    
    // Handle hamburger menu toggle
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!hamburger.contains(event.target) && !navMenu.contains(event.target)) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    }
}

// Image capture functionality
function setupImageCapture() {
    const imageInput = document.getElementById('image-input');
    const identifyBtn = document.getElementById('identify-btn');
    
    // Handle file selection
    imageInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            selectedImage = file;
            displayImagePreview(file);
            identifyBtn.disabled = false;
        }
    });
    
    // Handle identify button click
    identifyBtn.addEventListener('click', function() {
        if (selectedImage) {
            identifySpecies(selectedImage);
        }
    });
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
    identifyBtn.disabled = true;
    identifyBtn.textContent = '🔍 Identifying...';
    resultSection.style.display = 'block';
    resultContent.innerHTML = '<p>Analyzing image...</p>';
    
    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('image', imageFile);
        
        // Send to backend (update this URL to your deployed backend)
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
        resultContent.innerHTML = `
            <p style="color: #e74c3c;">❌ Error identifying species: ${error.message}</p>
            <p>Please try again with a clearer image.</p>
        `;
    } finally {
        // Reset button state
        identifyBtn.disabled = false;
        identifyBtn.textContent = '🔍 Identify Species';
    }
}

// Display identification results
function displayIdentificationResult(result) {
    const resultContent = document.getElementById('result-content');
    
    if (result.success && result.identification) {
        const { species, confidence, description } = result.identification;
        
        // Parse the species to get common and scientific names
        const speciesMatch = species.match(/^(.+?)\s*\((.+?)\)$/);
        const commonName = speciesMatch ? speciesMatch[1].trim() : species;
        const scientificName = speciesMatch ? speciesMatch[2].trim() : species;
        
        resultContent.innerHTML = `
            <div class="identification-result">
                <h4>🎯 Species Identified!</h4>
                <div class="species-info">
                    <p><strong>Common Name:</strong> ${commonName}</p>
                    <p><strong>Scientific Name:</strong> <em>${scientificName}</em></p>
                </div>
                <p><strong>Confidence:</strong> ${Math.round(confidence * 100)}%</p>
                <p><strong>Description:</strong> ${description}</p>
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
