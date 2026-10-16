// noise.ts — fast, deterministic hashing and smooth 1D noise for the pencil (no Math.random anywhere).

/** FNV-1a hash of a string to an unsigned 32-bit seed. */
export const seedOf = (text: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

/** Integer hash -> [0, 1). Same inputs, same output, on every machine. */
export const hash01 = (seed: number, i: number): number => {
  let h = (seed ^ Math.imul(i + 0x9e3779b9, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

/** Signed hash in [-1, 1). */
export const hashSigned = (seed: number, i: number): number => hash01(seed, i) * 2 - 1;

/** Smooth value noise in [-1, 1] along one axis (cosine-free smoothstep interpolation). */
export const noise1 = (seed: number, x: number): number => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = hashSigned(seed, i);
  const b = hashSigned(seed, i + 1);
  return a + (b - a) * u;
};

/** Two octaves of value noise: a slow drift plus a little tremor. */
export const wobble = (seed: number, x: number): number => noise1(seed, x) * 0.75 + noise1(seed + 101, x * 2.7) * 0.25;

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const smoothstep = (a: number, b: number, x: number): number => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
