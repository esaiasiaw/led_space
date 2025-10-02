/**
 * Dithering algorithms for converting images to LED patterns
 */

export type DitherPreset = 'none' | 'floyd-steinberg' | 'bayer' | 'atkinson' | 'halftone';

/**
 * Convert image to grayscale LED grid data
 */
export function imageToLEDGrid(
  imageData: ImageData,
  gridSize: number,
  ditherPreset: DitherPreset,
  threshold: number = 128,
  contrast: number = 1.0,
  brightness: number = 1.0
): number[][] {
  const { width, height, data } = imageData;
  const grid: number[][] = [];

  // Calculate cell size
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;

  // Create grayscale version with adjustments
  const grayscale = new Uint8ClampedArray(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Convert to grayscale
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // Apply brightness and contrast
    gray = gray * brightness;
    gray = ((gray - 128) * contrast) + 128;
    gray = Math.max(0, Math.min(255, gray));

    grayscale[i / 4] = gray;
  }

  // Apply dithering
  const dithered = applyDither(grayscale, width, height, ditherPreset, threshold);

  // Sample the dithered image to create LED grid
  for (let row = 0; row < gridSize; row++) {
    grid[row] = [];
    for (let col = 0; col < gridSize; col++) {
      const x = Math.floor(col * cellWidth + cellWidth / 2);
      const y = Math.floor(row * cellHeight + cellHeight / 2);
      const idx = y * width + x;
      grid[row][col] = dithered[idx];
    }
  }

  return grid;
}

/**
 * Apply dithering algorithm
 */
function applyDither(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  preset: DitherPreset,
  threshold: number
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data);

  switch (preset) {
    case 'floyd-steinberg':
      return floydSteinbergDither(output, width, height);
    case 'bayer':
      return bayerDither(output, width, height, threshold);
    case 'atkinson':
      return atkinsonDither(output, width, height);
    case 'halftone':
      return halftoneDither(output, width, height, threshold);
    case 'none':
    default:
      return thresholdDither(output, threshold);
  }
}

/**
 * Simple threshold dithering
 */
function thresholdDither(data: Uint8ClampedArray, threshold: number): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i++) {
    output[i] = data[i] >= threshold ? 255 : 0;
  }
  return output;
}

/**
 * Floyd-Steinberg dithering
 */
function floydSteinbergDither(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldPixel = output[idx];
      const newPixel = oldPixel < 128 ? 0 : 255;
      output[idx] = newPixel;

      const error = oldPixel - newPixel;

      // Distribute error to neighboring pixels
      if (x + 1 < width) {
        output[idx + 1] += error * 7 / 16;
      }
      if (x - 1 >= 0 && y + 1 < height) {
        output[idx + width - 1] += error * 3 / 16;
      }
      if (y + 1 < height) {
        output[idx + width] += error * 5 / 16;
      }
      if (x + 1 < width && y + 1 < height) {
        output[idx + width + 1] += error * 1 / 16;
      }
    }
  }

  return output;
}

/**
 * Bayer matrix dithering (ordered dithering)
 */
function bayerDither(data: Uint8ClampedArray, width: number, height: number, threshold: number): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);

  // 8x8 Bayer matrix
  const bayerMatrix = [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21]
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const bayerValue = bayerMatrix[y % 8][x % 8];
      const adjustedThreshold = (bayerValue / 64) * 255;
      output[idx] = data[idx] > adjustedThreshold ? 255 : 0;
    }
  }

  return output;
}

/**
 * Atkinson dithering
 */
function atkinsonDither(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldPixel = output[idx];
      const newPixel = oldPixel < 128 ? 0 : 255;
      output[idx] = newPixel;

      const error = (oldPixel - newPixel) / 8;

      // Distribute error (Atkinson pattern)
      if (x + 1 < width) output[idx + 1] += error;
      if (x + 2 < width) output[idx + 2] += error;
      if (x - 1 >= 0 && y + 1 < height) output[idx + width - 1] += error;
      if (y + 1 < height) output[idx + width] += error;
      if (x + 1 < width && y + 1 < height) output[idx + width + 1] += error;
      if (y + 2 < height) output[idx + width * 2] += error;
    }
  }

  return output;
}

/**
 * Halftone dithering (circular dots)
 */
function halftoneDither(data: Uint8ClampedArray, width: number, height: number, threshold: number): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  const dotSize = 4;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const value = data[idx];

      // Create circular halftone pattern
      const dx = x % dotSize - dotSize / 2;
      const dy = y % dotSize - dotSize / 2;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = dotSize / 2;

      const dotThreshold = (1 - distance / maxDistance) * 255;
      output[idx] = value > dotThreshold ? 255 : 0;
    }
  }

  return output;
}

/**
 * Process image/video element and return ImageData
 */
export function getImageData(element: HTMLImageElement | HTMLVideoElement, gridSize: number): ImageData | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Set canvas size to grid size for efficiency
  canvas.width = gridSize * 10; // 10x multiplier for better sampling
  canvas.height = gridSize * 10;

  // Draw image/video frame
  ctx.drawImage(element, 0, 0, canvas.width, canvas.height);

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
