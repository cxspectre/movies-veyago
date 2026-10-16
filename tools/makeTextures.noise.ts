// makeTextures.noise.ts — seeded, TILEABLE noise fields for the texture generator.
// Every field wraps at its lattice period, so the generated images tile seamlessly.

export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const PERM_SIZE = 1024;
const PERM_MASK = PERM_SIZE - 1;

const makePerm = (seed: number): Int32Array => {
  const rnd = mulberry32(seed);
  const base = Array.from({length: PERM_SIZE}, (_, i) => i);
  const shuffled = base.reduce<number[]>((acc, _, i) => {
    const j = i + Math.floor(rnd() * (PERM_SIZE - i));
    const next = acc.slice();
    const tmp = next[i] as number;
    next[i] = next[j] as number;
    next[j] = tmp;
    return next;
  }, base);
  return Int32Array.from([...shuffled, ...shuffled]);
};

const GRAD_COUNT = 16;
const GRADS = Array.from({length: GRAD_COUNT}, (_, i) => {
  const a = (i / GRAD_COUNT) * Math.PI * 2;
  return [Math.cos(a), Math.sin(a)] as const;
});

const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);
const mod = (n: number, m: number): number => ((n % m) + m) % m;

/** Gradient noise in roughly [-0.7, 0.7], periodic with integer lattice periods px, py. */
const perlinPeriodic = (perm: Int32Array, x: number, y: number, px: number, py: number): number => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const x0 = mod(xi, px);
  const y0 = mod(yi, py);
  const x1 = mod(xi + 1, px);
  const y1 = mod(yi + 1, py);
  const g = (gx: number, gy: number, dx: number, dy: number): number => {
    const h = (perm[((perm[gx & PERM_MASK] as number) + gy) & PERM_MASK] as number) % GRAD_COUNT;
    const v = GRADS[h] as readonly [number, number];
    return v[0] * dx + v[1] * dy;
  };
  const u = fade(xf);
  const v = fade(yf);
  const a = g(x0, y0, xf, yf) + u * (g(x1, y0, xf - 1, yf) - g(x0, y0, xf, yf));
  const b = g(x0, y1, xf, yf - 1) + u * (g(x1, y1, xf - 1, yf - 1) - g(x0, y1, xf, yf - 1));
  return a + v * (b - a);
};

export type FbmOptions = {
  width: number;
  height: number;
  /** Lattice cells across the tile on the first octave, per axis (anisotropy = different values). */
  cellsX: number;
  cellsY: number;
  octaves: number;
  seed: number;
  gain?: number;
};

/** Tileable fractal noise, normalised to [0, 1]. */
export const fbmField = (o: FbmOptions): Float32Array => {
  const gain = o.gain ?? 0.5;
  const perms = Array.from({length: o.octaves}, (_, i) => makePerm(o.seed * 131 + i * 7919));
  const out = new Float32Array(o.width * o.height);
  for (let y = 0; y < o.height; y++) {
    for (let x = 0; x < o.width; x++) {
      let sum = 0;
      let amp = 1;
      let norm = 0;
      for (let k = 0; k < o.octaves; k++) {
        const cx = o.cellsX * 2 ** k;
        const cy = o.cellsY * 2 ** k;
        sum += amp * perlinPeriodic(perms[k] as Int32Array, (x / o.width) * cx, (y / o.height) * cy, cx, cy);
        norm += amp;
        amp *= gain;
      }
      out[y * o.width + x] = sum / norm;
    }
  }
  return normalise(out);
};

/** Tileable cellular (F1) noise: 1 at feature points falling to 0 — rounded "tooth" bumps. */
export const cellField = (width: number, height: number, cells: number, seed: number): Float32Array => {
  const rnd = mulberry32(seed);
  const pts = Float32Array.from({length: cells * cells * 2}, () => rnd());
  const out = new Float32Array(width * height);
  const cw = width / cells;
  const ch = height / cells;
  for (let y = 0; y < height; y++) {
    const gy = Math.floor(y / ch);
    for (let x = 0; x < width; x++) {
      const gx = Math.floor(x / cw);
      let best = 1e9;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const cx = gx + ox;
          const cy = gy + oy;
          const i = (mod(cy, cells) * cells + mod(cx, cells)) * 2;
          const fx = (cx + (pts[i] as number)) * cw;
          const fy = (cy + (pts[i + 1] as number)) * ch;
          const d = Math.hypot(fx - x, fy - y);
          if (d < best) best = d;
        }
      }
      out[y * width + x] = Math.max(0, 1 - best / (cw * 0.9));
    }
  }
  return out;
};

/** Rescale a field to [0, 1]. Returns a new array. */
export const normalise = (f: Float32Array): Float32Array => {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of f) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const span = hi - lo || 1;
  return f.map((v) => (v - lo) / span);
};

/** Histogram-equalise a [0,1] field so every value is equally likely (graphite coverage then tracks pressure linearly). */
export const equalise = (f: Float32Array, bins = 4096): Float32Array => {
  const hist = new Uint32Array(bins);
  for (const v of f) hist[Math.min(bins - 1, Math.floor(v * bins))]! += 1;
  const cdf = new Float32Array(bins);
  let acc = 0;
  for (let i = 0; i < bins; i++) {
    acc += hist[i] as number;
    cdf[i] = acc / f.length;
  }
  return f.map((v) => cdf[Math.min(bins - 1, Math.floor(v * bins))] as number);
};

export const smoothstep = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
