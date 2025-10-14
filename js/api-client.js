// Backend API base URL
const API_BASE_URL = 'https://bwbirdapp-backend-production.up.railway.app';

export async function analyzeImage(blob) {
  const fd = new FormData();
  fd.append('image', blob, 'photo.jpg');
  const res = await fetch(`${API_BASE_URL}/api/analyze`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('analyze failed');
  return res.json();
}

export async function addSighting({ blob, deviceId, commonName }) {
  const fd = new FormData();
  fd.append('image', blob, 'photo.jpg');
  fd.append('deviceId', deviceId);
  fd.append('commonName', commonName);
  const res = await fetch(`${API_BASE_URL}/api/sightings`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('add sighting failed');
  return res.json();
}

export async function fetchCollection(deviceId) {
  const res = await fetch(`${API_BASE_URL}/api/collection?deviceId=${encodeURIComponent(deviceId)}`);
  let data;
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) {
    console.error('collection API error:', data || res.statusText);
    throw new Error(data?.error || 'collection failed');
  }
  return data;
}

export async function fetchSightings(deviceId, birdSlug) {
  const res = await fetch(`${API_BASE_URL}/api/sightings?deviceId=${encodeURIComponent(deviceId)}&bird=${encodeURIComponent(birdSlug)}`);
  if (!res.ok) throw new Error('sightings failed');
  return res.json();
}
