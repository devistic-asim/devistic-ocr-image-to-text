import type { CropRect, ProcessOptions } from '../types';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Stretch a channel away from mid-gray. 1 leaves the pixel unchanged. */
export function contrastChannel(channel: number, contrast: number): number {
  const amount = clamp(contrast, 0.5, 2.5);
  const next = (channel / 255 - 0.5) * amount + 0.5;
  return clamp(Math.round(next * 255), 0, 255);
}

export function normalizeCrop(x: number, y: number, x2: number, y2: number): CropRect | null {
  const left = clamp(Math.min(x, x2), 0, 1);
  const top = clamp(Math.min(y, y2), 0, 1);
  const right = clamp(Math.max(x, x2), 0, 1);
  const bottom = clamp(Math.max(y, y2), 0, 1);
  const w = right - left;
  const h = bottom - top;
  if (w < 0.02 || h < 0.02) return null;
  return {
    x: round4(left),
    y: round4(top),
    w: round4(w),
    h: round4(h),
  };
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not read that image. Use a PNG, JPEG, WEBP, GIF, or BMP.'));
    image.src = url;
  });
}

/**
 * Rotate, optionally grayscale and contrast, then crop.
 * The long side is scaled into 1400–2200 px, which is where Tesseract is most reliable.
 */
export function renderProcessed(
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  options: ProcessOptions,
): HTMLCanvasElement {
  const angle = ((options.rotation + options.skew) * Math.PI) / 180;
  const sin = Math.abs(Math.sin(angle));
  const cos = Math.abs(Math.cos(angle));
  const rotatedWidth = sourceWidth * cos + sourceHeight * sin;
  const rotatedHeight = sourceWidth * sin + sourceHeight * cos;
  const longSide = Math.max(rotatedWidth, rotatedHeight);
  let scale = 1;
  if (longSide > 0 && longSide < 1400) scale = 1400 / longSide;
  else if (longSide > 2200) scale = 2200 / longSide;

  const width = Math.max(1, Math.round(rotatedWidth * scale));
  const height = Math.max(1, Math.round(rotatedHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('This browser cannot prepare images for OCR.');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.save();
  context.translate(width / 2, height / 2);
  context.rotate(angle);
  context.scale(scale, scale);
  context.drawImage(image, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight);
  context.restore();

  const adjustContrast = Math.abs(options.contrast - 1) > 0.01;
  if (options.grayscale || adjustContrast) {
    const pixels = context.getImageData(0, 0, width, height);
    const data = pixels.data;
    for (let index = 0; index < data.length; index += 4) {
      let red = data[index];
      let green = data[index + 1];
      let blue = data[index + 2];
      if (options.grayscale) {
        const gray = Math.round(0.299 * red + 0.587 * green + 0.114 * blue);
        red = gray;
        green = gray;
        blue = gray;
      }
      if (adjustContrast) {
        red = contrastChannel(red, options.contrast);
        green = contrastChannel(green, options.contrast);
        blue = contrastChannel(blue, options.contrast);
      }
      data[index] = red;
      data[index + 1] = green;
      data[index + 2] = blue;
    }
    context.putImageData(pixels, 0, 0);
  }

  if (!options.applyCrop || !options.crop) return canvas;
  return cropCanvas(canvas, options.crop);
}

function cropCanvas(source: HTMLCanvasElement, crop: CropRect): HTMLCanvasElement {
  const sx = Math.round(clamp(crop.x, 0, 1) * source.width);
  const sy = Math.round(clamp(crop.y, 0, 1) * source.height);
  const sw = Math.max(1, Math.round(clamp(crop.w, 0, 1) * source.width));
  const sh = Math.max(1, Math.round(clamp(crop.h, 0, 1) * source.height));
  const width = Math.max(1, Math.min(sw, source.width - sx));
  const height = Math.max(1, Math.min(sh, source.height - sy));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return source;
  context.drawImage(source, sx, sy, width, height, 0, 0, width, height);
  return canvas;
}

export function thumbnailDataUrl(source: HTMLCanvasElement): string {
  const maxWidth = 200;
  const scale = Math.min(1, maxWidth / source.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const context = canvas.getContext('2d');
  if (!context) return '';
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.72);
}
