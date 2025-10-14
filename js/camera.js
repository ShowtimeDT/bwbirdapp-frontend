// js/camera.js - Race-proof camera controller with session management
let currentStream = null;
let sessionId = 0;
let startAbort = null;

const video = document.getElementById('camera-video'); // ensure this exists

export async function startCamera() {
  if (currentStream?.active) return currentStream;

  // cancel any previous start in flight
  startAbort?.abort();
  startAbort = new AbortController();

  const mySession = ++sessionId;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
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
