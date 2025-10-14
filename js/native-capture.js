// js/native-capture.js - Native camera/photo picker with image processing
export async function openNativePicker() {
    const input = document.getElementById('native-file-input');
    if (input) {
        input.click();
    }
}

export function initNativePicker(onReadyBlob) {
    const input = document.getElementById('native-file-input');
    if (!input) return;
    
    input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        
        try {
            const blob = await processFile(file); // handles HEIC->JPEG, orientation, resize
            
            // Show preview
            const url = URL.createObjectURL(blob);
            const img = document.getElementById('photo-preview');
            if (img) {
                img.src = url;
                img.style.display = 'block';
            }
            
            // Call the callback with the processed blob
            onReadyBlob?.(blob);
        } catch (error) {
            console.error('Error processing native file:', error);
            alert('Error processing image. Please try again.');
        }
    });
}

export async function processFile(file) {
    // 1) Try createImageBitmap with orientation-from-image
    let bmp = null;
    try {
        bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (e) {
        // fallback: FileReader -> HTMLImageElement
        const dataUrl = await readAsDataURL(file);
        const img = await loadImage(dataUrl);
        // (We won't parse EXIF here; rely on imageOrientation where possible)
        bmp = await createImageBitmap(img);
    }

    // 2) Resize to max 1600
    const maxDim = 1600;
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w; 
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, w, h);

    // 3) Export to JPEG
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
