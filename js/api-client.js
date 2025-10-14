import { getAccessToken } from './auth.js';

const API_BASE_URL = 'https://bwbirdapp-backend-production.up.railway.app';

async function authHeaders() {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function analyzeImage(blob) {
  const fd = new FormData();
  fd.append('image', blob, 'photo.jpg');
  const res = await fetch(`${API_BASE_URL}/api/analyze`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('analyze failed');
  return res.json();
}

export async function addSighting({ blob, bird }) {
  const headers = await authHeaders();
  const fd = new FormData();
  fd.append('image', blob, 'photo.jpg');
  fd.append('bird', bird);
  const res = await fetch(`${API_BASE_URL}/api/sightings`, { method: 'POST', headers, body: fd });
  let data;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    console.error('add sighting API error:', data || res.statusText);
    throw new Error(data?.error || 'add sighting failed');
  }
  return data;
}

export async function fetchCollection() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/api/collection`, { headers });
  let data;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    console.error('collection API error:', data || res.statusText);
    throw new Error(data?.error || 'collection failed');
  }
  return data;
}
