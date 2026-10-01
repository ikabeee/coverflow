const SAMPLE_SIZE = 16;

// Downsamples the artwork to a tiny canvas and averages its opaque pixels.
export function extractAccentColor(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        resolve(averageColor(img));
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load artwork for color extraction: ${url}`));
    img.src = url;
  });
}

function averageColor(img) {
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }
  if (!count) throw new Error('No opaque pixels sampled');

  return boostVibrance(r / count, g / count, b / count);
}

// Brightens/saturates the average so it reads as an accent against the dark UI.
function boostVibrance(r, g, b) {
  const max = Math.max(r, g, b) || 1;
  const scale = Math.min(255 / max, 1.6);
  const clamp = (value) => Math.min(255, Math.round(value * scale));
  return `rgb(${clamp(r)} ${clamp(g)} ${clamp(b)})`;
}
