import { getDeviceId } from './device-id.js';
import { fetchCollection, fetchSightings } from './api-client.js';

const grid = document.getElementById('collection-grid');
const modal = document.getElementById('bird-modal');
const modalTitle = document.getElementById('modal-title');
const modalSightings = document.getElementById('modal-sightings');
const closeBtn = document.querySelector('.close');

let virginiaBirds = [];
let userCollection = [];

// Load Virginia birds data
async function loadVirginiaBirds() {
  try {
    const response = await fetch('/data/virginia_birds.json');
    virginiaBirds = await response.json();
  } catch (error) {
    console.error('Failed to load Virginia birds:', error);
    virginiaBirds = [];
  }
}

// Load user's collection
async function loadCollection() {
  try {
    const deviceId = getDeviceId();
    userCollection = await fetchCollection(deviceId);
    renderCollection();
  } catch (error) {
    console.error('Failed to load collection:', error);
    userCollection = [];
    renderCollection();
  }
}

// Render the collection grid
function renderCollection() {
  if (!grid) return;
  
  // Create a map of found birds for quick lookup
  const foundBirds = new Map();
  userCollection.forEach(bird => {
    foundBirds.set(bird.birdSlug, bird);
  });
  
  // Separate found and unfound birds
  const found = [];
  const unfound = [];
  
  virginiaBirds.forEach(bird => {
    const slug = bird.commonName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (foundBirds.has(slug)) {
      found.push({ ...bird, slug, userData: foundBirds.get(slug) });
    } else {
      unfound.push({ ...bird, slug });
    }
  });
  
  // Sort both arrays alphabetically
  found.sort((a, b) => a.commonName.localeCompare(b.commonName));
  unfound.sort((a, b) => a.commonName.localeCompare(b.commonName));
  
  // Render tiles
  grid.innerHTML = '';
  
  // Render found birds first
  found.forEach(bird => {
    const tile = createBirdTile(bird, true);
    grid.appendChild(tile);
  });
  
  // Render unfound birds
  unfound.forEach(bird => {
    const tile = createBirdTile(bird, false);
    grid.appendChild(tile);
  });
}

// Create a bird tile
function createBirdTile(bird, isFound) {
  const tile = document.createElement('div');
  tile.className = `bird-tile ${isFound ? 'tile--found' : 'tile--unfound'}`;
  
  if (isFound && bird.userData.primaryPhotoUrl) {
    tile.innerHTML = `
      <img src="${bird.userData.primaryPhotoUrl}" alt="${bird.commonName}" class="bird-image">
      <div class="bird-info">
        <h3>${bird.commonName}</h3>
        <p>${bird.scientificName}</p>
        <span class="count">${bird.userData.count} sighting${bird.userData.count > 1 ? 's' : ''}</span>
      </div>
    `;
  } else {
    tile.innerHTML = `
      <div class="bird-placeholder">
        <div class="placeholder-icon">🐦</div>
      </div>
      <div class="bird-info">
        <h3>${bird.commonName}</h3>
        <p>${bird.scientificName}</p>
        <span class="status">Not found</span>
      </div>
    `;
  }
  
  if (isFound) {
    tile.addEventListener('click', () => openBirdModal(bird));
    tile.style.cursor = 'pointer';
  }
  
  return tile;
}

// Open bird modal with sightings
async function openBirdModal(bird) {
  if (!modal) return;
  
  try {
    const deviceId = getDeviceId();
    const sightings = await fetchSightings(deviceId, bird.slug);
    
    modalTitle.textContent = bird.commonName;
    modalSightings.innerHTML = '';
    
    if (sightings.length === 0) {
      modalSightings.innerHTML = '<p>No sightings found.</p>';
    } else {
      sightings.forEach(sighting => {
        const sightingDiv = document.createElement('div');
        sightingDiv.className = 'sighting-item';
        sightingDiv.innerHTML = `
          <div class="sighting-image">
            ${sighting.photoUrl ? `<img src="${sighting.photoUrl}" alt="Sighting">` : '<div class="no-image">No image</div>'}
          </div>
          <div class="sighting-info">
            <p class="sighting-date">${new Date(sighting.createdAt).toLocaleDateString()}</p>
          </div>
        `;
        modalSightings.appendChild(sightingDiv);
      });
    }
    
    modal.removeAttribute('hidden');
  } catch (error) {
    console.error('Failed to load sightings:', error);
    modalSightings.innerHTML = '<p>Failed to load sightings.</p>';
    modal.removeAttribute('hidden');
  }
}

// Close modal
function closeModal() {
  if (!modal) return;
  modal.setAttribute('hidden', '');
  if (modalSightings) modalSightings.innerHTML = '';
}

// Event listeners
closeBtn?.addEventListener('click', closeModal);
modal?.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// Listen for collection updates
window.addEventListener('collection:updated', () => {
  loadCollection();
});

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Force modal closed on first load so no grey bar appears
  closeModal();
  
  await loadVirginiaBirds();
  await loadCollection();
});
