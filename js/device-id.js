export function getDeviceId() {
  const k = 'device_id_v1';
  let v = localStorage.getItem(k);
  if (!v) { 
    v = (crypto.randomUUID?.() || String(Date.now()) + Math.random().toString(36).slice(2)); 
    localStorage.setItem(k, v); 
  }
  return v;
}

export const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
