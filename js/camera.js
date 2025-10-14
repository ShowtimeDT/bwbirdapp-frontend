// js/camera.js - Race-proof camera controller with device selection
let currentStream = null;
let sessionId = 0;
let startAbort = null;
let selectedDeviceId = null;

const video = document.getElementById('camera-video'); // ensure this exists

// Desktop detection helper
export function isDesktop() {
  return !/iPhone|Android|iPad|iPod/i.test(navigator.userAgent);
}

// Device selection logic for rear camera
async function selectRearCamera() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    // Look for rear camera devices
    const rearDevices = videoDevices.filter(device => {
      const label = device.label.toLowerCase();
      return label.includes('back') || label.includes('rear') || label.includes('environment');
    });
    
    if (rearDevices.length === 1) {
      return rearDevices[0].deviceId;
    } else if (rearDevices.length > 1) {
      // Use the first rear device found
      return rearDevices[0].deviceId;
    }
    
    // Fallback to any video device
    return videoDevices[0]?.deviceId;
  } catch (error) {
    console.log('Device enumeration failed, using default constraints');
    return null;
  }
}

export async function startCamera() {
  if (currentStream?.active) return currentStream;

  // cancel any previous start in flight
  startAbort?.abort();
  startAbort = new AbortController();

  const mySession = ++sessionId;

  try {
    // Select the best rear camera device
    const deviceId = await selectRearCamera();
    
    // Build constraints with device selection
    const constraints = deviceId
      ? { video: { deviceId: { exact: deviceId } }, audio: false }
      : { video: { facingMode: { ideal: 'environment' } }, audio: false };

    const stream = await navigator.mediaDevices.getUserMedia({
      ...constraints,
      signal: startAbort.signal, // ignored by some browsers; harmless
    });

    // If a newer session took over, shut this down immediately
    if (mySession !== sessionId) {
      try { stream.getTracks().forEach(t => t.stop()); } catch {}
      return null;
    }

    currentStream = stream;

    // Auto-cleanup if tracks end externally
    stream.getTracks().forEach(t => { t.onended = () => stopCamera(); });

    if (video) {
      (video).srcObject = stream;
      try { await video.play(); } catch {} // ignore autoplay errors

      // If STOP happened while play() awaited, detach now
      if (mySession !== sessionId) {
        try { video.pause(); } catch {}
        video.srcObject = null;
        video.removeAttribute('src');
        video.load?.();
        try { stream.getTracks().forEach(t => t.stop()); } catch {}
        currentStream = null;
        return null;
      }
    }

    return stream;
  } catch (err) {
    if (err?.name !== 'AbortError') console.error('startCamera error:', err);
    return null;
  }
}

export function stopCamera() {
  // Invalidate any older start attempts
  sessionId++;

  // Abort pending getUserMedia/play
  startAbort?.abort();
  startAbort = null;

  if (currentStream) {
    try { currentStream.getTracks().forEach(t => t.stop()); } catch {}
    currentStream = null;
  }

  if (video) {
    try { video.pause(); } catch {}
    video.srcObject = null;
    video.removeAttribute('src'); // critical for Safari/iOS
    video.load?.();
  }
}

// Global defensive listeners (attach once)
(function attachLifecycleListeners(){
  const stop = () => stopCamera();
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); }, { passive:true });
  window.addEventListener('pagehide', stop, { passive:true });
  window.addEventListener('beforeunload', stop);
  window.addEventListener('blur', stop, { passive:true });
})();
