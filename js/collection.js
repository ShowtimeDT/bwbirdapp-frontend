import { fetchCollection } from './api-client.js';

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
    userCollection = await fetchCollection();
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
  
  modalTitle.textContent = bird.commonName;
  modalSightings.innerHTML = '';
  
  // Show basic info for now (sightings endpoint removed)
  modalSightings.innerHTML = `
    <div class="sighting-item">
      <div class="sighting-info">
        <p><strong>Count:</strong> ${bird.userData.count} sighting${bird.userData.count > 1 ? 's' : ''}</p>
        <p><strong>Latest:</strong> ${new Date(bird.userData.latestAt).toLocaleDateString()}</p>
        ${bird.userData.primaryPhotoUrl ? `<img src="${bird.userData.primaryPhotoUrl}" alt="Primary photo" style="max-width: 200px; margin-top: 10px;">` : ''}
      </div>
    </div>
  `;
  
  showBirdModal();
}

// Show modal helper
function showBirdModal() {
  document.getElementById('bird-modal')?.removeAttribute('hidden');
}

// Hide modal helper  
function hideBirdModal() {
  document.getElementById('bird-modal')?.setAttribute('hidden', '');
}

// Close modal
function closeModal() {
  hideBirdModal();
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
  document.getElementById('bird-modal')?.setAttribute('hidden', '');
  
  await loadVirginiaBirds();
  await loadCollection();
});
