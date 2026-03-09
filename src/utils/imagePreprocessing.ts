/**
 * Canvas-based image preprocessing pipeline for OCR improvement.
 * Produces multiple preprocessed crop variants from a card photo.
 */

interface CropRegion {
  label: string;
  yStart: number; // fraction of image height
  yEnd: number;
  xStart: number; // fraction of image width
  xEnd: number;
}

const CROP_REGIONS: CropRegion[] = [
  { label: 'top-15', yStart: 0, yEnd: 0.15, xStart: 0, xEnd: 1 },
  { label: 'top-20', yStart: 0, yEnd: 0.20, xStart: 0, xEnd: 1 },
  { label: 'top-25-center', yStart: 0, yEnd: 0.25, xStart: 0.1, xEnd: 0.9 },
  { label: 'top-30', yStart: 0, yEnd: 0.30, xStart: 0, xEnd: 1 },
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function toGrayscale(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = d[i + 1] = d[i + 2] = gray;
  }
  ctx.putImageData(imageData, 0, 0);
}

function adjustContrast(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  // Find min/max for histogram stretch
  let min = 255, max = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] < min) min = d[i];
    if (d[i] > max) max = d[i];
  }
  const range = max - min || 1;
  for (let i = 0; i < d.length; i += 4) {
    const val = Math.round(((d[i] - min) / range) * 255);
    d[i] = d[i + 1] = d[i + 2] = val;
  }
  ctx.putImageData(imageData, 0, 0);
}

function sharpen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const src = new Uint8ClampedArray(imageData.data);
  const dst = imageData.data;
  // 3x3 sharpen kernel: [0,-1,0, -1,5,-1, 0,-1,0]
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let val = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * w + (x + kx)) * 4;
          val += src[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
        }
      }
      const idx = (y * w + x) * 4;
      const clamped = Math.max(0, Math.min(255, val));
      dst[idx] = dst[idx + 1] = dst[idx + 2] = clamped;
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

function adaptiveThreshold(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  const blockSize = Math.max(15, Math.round(w / 30) | 1); // odd number
  const half = Math.floor(blockSize / 2);
  const C = 10; // threshold offset

  // Build integral image for fast mean calculation
  const integral = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    for (let x = 0; x < w; x++) {
      rowSum += d[(y * w + x) * 4];
      integral[y * w + x] = rowSum + (y > 0 ? integral[(y - 1) * w + x] : 0);
    }
  }

  const getAreaSum = (x1: number, y1: number, x2: number, y2: number) => {
    x1 = Math.max(0, x1); y1 = Math.max(0, y1);
    x2 = Math.min(w - 1, x2); y2 = Math.min(h - 1, y2);
    let sum = integral[y2 * w + x2];
    if (x1 > 0) sum -= integral[y2 * w + (x1 - 1)];
    if (y1 > 0) sum -= integral[(y1 - 1) * w + x2];
    if (x1 > 0 && y1 > 0) sum += integral[(y1 - 1) * w + (x1 - 1)];
    return sum;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x1 = x - half, y1 = y - half;
      const x2 = x + half, y2 = y + half;
      const count = (Math.min(x2, w - 1) - Math.max(x1, 0) + 1) * (Math.min(y2, h - 1) - Math.max(y1, 0) + 1);
      const mean = getAreaSum(x1, y1, x2, y2) / count;
      const idx = (y * w + x) * 4;
      const val = d[idx] > mean - C ? 255 : 0;
      d[idx] = d[idx + 1] = d[idx + 2] = val;
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

export async function preprocessForOCR(imageDataUrl: string): Promise<string[]> {
  const img = await loadImage(imageDataUrl);
  const results: string[] = [];

  for (const region of CROP_REGIONS) {
    const sx = Math.floor(img.width * region.xStart);
    const sy = Math.floor(img.height * region.yStart);
    const sw = Math.floor(img.width * (region.xEnd - region.xStart));
    const sh = Math.floor(img.height * (region.yEnd - region.yStart));

    const canvas = document.createElement('canvas');
    // Scale up small crops for better OCR
    const scale = Math.max(1, Math.ceil(600 / sw));
    canvas.width = sw * scale;
    canvas.height = sh * scale;
    const ctx = canvas.getContext('2d')!;

    // Draw cropped region scaled up
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    // Apply preprocessing pipeline
    toGrayscale(ctx, canvas.width, canvas.height);
    adjustContrast(ctx, canvas.width, canvas.height);
    sharpen(ctx, canvas.width, canvas.height);
    adaptiveThreshold(ctx, canvas.width, canvas.height);

    results.push(canvas.toDataURL('image/png'));
  }

  return results;
}
