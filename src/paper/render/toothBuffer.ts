// toothBuffer.ts — the paper tooth resampled to a canvas's pixel grid (one byte per pixel), cached per size.
import {TEXTURES} from '../textures';

const cache = new Map<string, Uint8Array>();
const MAX_CACHED = 8;

/** Re-spread the values so every tooth height is equally likely again (downscaling narrows the spread). */
const equalise = (src: Uint8Array): Uint8Array => {
  const hist = new Uint32Array(256);
  for (let i = 0; i < src.length; i++) hist[src[i] as number]! += 1;
  const map = new Uint8Array(256);
  let acc = 0;
  for (let v = 0; v < 256; v++) {
    const count = hist[v] as number;
    map[v] = Math.round(((acc + count / 2) / src.length) * 255);
    acc += count;
  }
  return src.map((v) => map[v] as number);
};

/**
 * Tooth heights for a width x height canvas drawn at `density` device px per sketch px.
 * `offset` shifts the grain (sketch px) so pages do not share identical paper; match it on <PaperSheet>.
 */
export const toothBuffer = (
  img: HTMLImageElement,
  width: number,
  height: number,
  density: number,
  offset: {x: number; y: number},
): Uint8Array => {
  const key = `${width}x${height}@${density.toFixed(3)}:${offset.x},${offset.y}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  if (!ctx) throw new Error('Paper engine: no 2D context for the tooth buffer');
  const pattern = ctx.createPattern(img, 'repeat');
  if (!pattern) throw new Error('Paper engine: could not create the tooth pattern');
  const scale = (TEXTURES.tooth.logical * density) / img.naturalWidth;
  pattern.setTransform(new DOMMatrix().translate(-offset.x * density, -offset.y * density).scale(scale));
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  const rgba = ctx.getImageData(0, 0, width, height).data;
  const gray = new Uint8Array(width * height);
  for (let i = 0, j = 0; i < gray.length; i++, j += 4) gray[i] = rgba[j] as number;
  const result = equalise(gray);
  if (cache.size >= MAX_CACHED) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, result);
  return result;
};
