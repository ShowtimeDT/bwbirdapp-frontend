import { getAccessToken } from './auth.js';

async function authHeaders() {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function analyzeImage(blob) {
  const fd = new FormData();
  fd.append('image', blob, 'photo.jpg');
  const res = await fetch('/api/analyze', { method: 'POST', body: fd });
  if (!res.ok) throw new Error('analyze failed');
  return res.json();
}

export async function listBirds() {
  const r = await fetch('/api/birds');
  if (!r.ok) throw new Error('birds');
  return r.json();
}

export async function fetchCollection() {
  const headers = await authHeaders();
  const r = await fetch('/api/collection', { headers });
  let data; try { data = await r.json(); } catch {}
  if (!r.ok) throw new Error(data?.error || 'collection failed');
  return data;
}

export async function fetchSightings(birdSlug) {
  const headers = await authHeaders();
  const r = await fetch(`/api/sightings?bird=${encodeURIComponent(birdSlug)}`, { headers });
  let data; try { data = await r.json(); } catch {}
  if (!r.ok) throw new Error(data?.error || 'sightings failed');
  return data;
}

export async function addSighting({ blob, bird }) {
  const headers = await authHeaders();
  const fd = new FormData();
  fd.append('image', blob, 'photo.jpg');
  fd.append('bird', bird); // slug OR common name
  const r = await fetch('/api/sightings', { method: 'POST', headers, body: fd });
  let data; try { data = await r.json(); } catch {}
  if (!r.ok) throw new Error(data?.error || 'add sighting failed');
  return data;
}
