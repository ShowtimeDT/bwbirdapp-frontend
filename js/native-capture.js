// js/native-capture.js - Native camera/photo picker with image processing
export function openNativeCamera({ preferRear = true } = {}) {
  const input = document.getElementById('native-file-input');
  if (!input) return;
  // Make sure attributes are set each time (some browsers cache them)
  input.setAttribute('accept', 'image/*');
  input.setAttribute('capture', preferRear ? 'environment' : 'user');
  input.value = ''; // allow re-selecting the same file
  input.click();
}

export function initNativeCapture(onBlobReady) {
  const input = document.getElementById('native-file-input');
  if (!input) return;
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    const blob = await processFileToJpeg(file); // orientation + resize + JPEG
    const url = URL.createObjectURL(blob);
    const img = document.getElementById('photo-preview');
    if (img) img.src = url;
    onBlobReady?.(blob);
  }, { passive: true });
}

async function processFileToJpeg(file) {
  let bmp;
  try {
    // Best path: respects EXIF orientation
    bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    const dataUrl = await readAsDataURL(file);
    const img = await loadImage(dataUrl);
    bmp = await createImageBitmap(img);
  }
  const maxDim = 1600;
  const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, w, h);

  const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.9));
  return blob;
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = reject;
    fr.onload = () => resolve(fr.result);
    fr.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}