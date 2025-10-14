import { isMobile } from './device-id.js';
import { openNativeCamera, openFilePicker, initNativeInput } from './native-capture.js';
import { analyzeImage, addSighting } from '/js/api-client.js';
import { onAuth } from '/js/auth.js';

const takeBtn = document.getElementById('btn-take-photo');
const uploadBtn = document.getElementById('btn-upload-photo');
const panel = document.getElementById('analysis');
const body = document.getElementById('analysis-body');
const addBtn = document.getElementById('btn-add');

// Hide Take Photo button on desktop
if (!isMobile && takeBtn) takeBtn.style.display = 'none';

let lastBlob = null;
let lastAnalysis = null;

// Button event listeners
takeBtn?.addEventListener('click', () => openNativeCamera());
uploadBtn?.addEventListener('click', () => openFilePicker());

// Initialize native input handler
initNativeInput(async (blob) => {
  lastBlob = blob;
  panel.hidden = false;
  body.innerHTML = `<div>Analyzing photo…</div>`;
  addBtn.disabled = true;

  try {
    const analysis = await analyzeImage(blob);
    lastAnalysis = analysis;

    if (!analysis?.isBird || !analysis?.commonName) {
      body.innerHTML = `<div>We couldn't confidently identify a Virginia bird. Try another photo.</div>`;
      addBtn.disabled = true;
      return;
    }

    // Present AI results (Name, scientific name, VA months, description)
    const months = Array.isArray(analysis.monthsInVirginia)
      ? analysis.monthsInVirginia.join(', ')
      : (analysis.monthsInVirginia || '—');

    body.innerHTML = `
      <div><strong>Name:</strong> ${analysis.commonName}</div>
      <div><strong>Scientific name:</strong> ${analysis.scientificName || '—'}</div>
      <div><strong>Months in Virginia:</strong> ${months}</div>
      <div><strong>Description:</strong> ${analysis.description || '—'}</div>
    `;
    addBtn.disabled = false;
  } catch (e) {
    console.error(e);
    body.innerHTML = `<div>Analysis failed. Please try again.</div>`;
    addBtn.disabled = true;
  }
});

// Add to collection handler
addBtn?.addEventListener('click', async () => {
  if (!lastBlob || !lastAnalysis?.commonName) return;
  
  const bird = lastAnalysis.slug || lastAnalysis.commonName;
  if (!bird) return alert('No bird detected');

  let sessionUser = null;
  await new Promise((resolve)=> onAuth((s)=>{ sessionUser = s; resolve(); }));
  if (!sessionUser) {
    window.dispatchEvent(new Event('auth:open')); // open modal
    return;
  }
  try {
    addBtn.disabled = true; 
    addBtn.textContent = 'Adding…';
    
    await addSighting({ blob: lastBlob, bird });
    addBtn.textContent = 'Added!';
    
    // Broadcast collection update event
    window.dispatchEvent(new CustomEvent('collection:updated'));
  } catch (e) {
    console.error(e);
    addBtn.textContent = 'Failed, try again';
    addBtn.disabled = false;
    alert('Add failed: ' + (e?.message || 'unknown'));
  }
});
