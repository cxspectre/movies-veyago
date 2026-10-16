// rng.ts — deterministic randomness. Every sound is a pure function of its seed; no Math.random anywhere.

export type Rng = {
  /** Uniform in [0, 1). */
  readonly next: () => number;
  readonly uniform: (lo: number, hi: number) => number;
  /** Standard normal (Box-Muller). */
  readonly normal: () => number;
  /** Exponential with mean 1. */
  readonly exponential: () => number;
  /** Log-normal with median 1 and the given sigma (in natural-log units). */
  readonly logNormal: (sigma: number) => number;
  readonly int: (lo: number, hiInclusive: number) => number;
  /** A child generator whose stream depends on this seed and the label, independent of call order elsewhere. */
  readonly fork: (label: string | number) => Rng;
  readonly seed: number;
};

const UINT32 = 4294967296;
const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** FNV-1a over the string form of the parts: a stable 32-bit seed from any mix of names and numbers. */
export function hashSeed(...parts: readonly (string | number)[]): number {
  const text = parts.map((p) => (typeof p === 'number' ? p.toFixed(6) : p)).join('|');
  let h = FNV_OFFSET;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, FNV_PRIME) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32: small, fast, well distributed for audio-rate use. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32;
  };
  const normal = (): number => {
    const u1 = Math.max(next(), 1e-12);
    const u2 = next();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
  return {
    next,
    uniform: (lo, hi) => lo + (hi - lo) * next(),
    normal,
    exponential: () => -Math.log(Math.max(next(), 1e-12)),
    logNormal: (sigma) => Math.exp(sigma * normal()),
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    fork: (label) => createRng(hashSeed(seed, label)),
    seed,
  };
}
