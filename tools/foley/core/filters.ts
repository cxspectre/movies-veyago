// filters.ts — RBJ biquads (static tone shaping) and a TPT state-variable filter (time-varying,
// stable under per-sample cutoff modulation, which friction sounds need as speed changes).

import {SR} from './constants';
import type {Mono} from './signal';

export type Biquad = {readonly b0: number; readonly b1: number; readonly b2: number; readonly a1: number; readonly a2: number};

const MAX_CUTOFF_RATIO = 0.49;
const safeFreq = (f: number): number => Math.min(Math.max(f, 1), SR * MAX_CUTOFF_RATIO);

function normalise(b0: number, b1: number, b2: number, a0: number, a1: number, a2: number): Biquad {
  return {b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0};
}

function omega(f: number): {cos: number; sin: number} {
  const w = (2 * Math.PI * safeFreq(f)) / SR;
  return {cos: Math.cos(w), sin: Math.sin(w)};
}

export function lowpass(f: number, q = Math.SQRT1_2): Biquad {
  const {cos, sin} = omega(f);
  const alpha = sin / (2 * q);
  return normalise((1 - cos) / 2, 1 - cos, (1 - cos) / 2, 1 + alpha, -2 * cos, 1 - alpha);
}

export function highpass(f: number, q = Math.SQRT1_2): Biquad {
  const {cos, sin} = omega(f);
  const alpha = sin / (2 * q);
  return normalise((1 + cos) / 2, -(1 + cos), (1 + cos) / 2, 1 + alpha, -2 * cos, 1 - alpha);
}

/** Band-pass with 0 dB peak gain. */
export function bandpass(f: number, q: number): Biquad {
  const {cos, sin} = omega(f);
  const alpha = sin / (2 * q);
  return normalise(alpha, 0, -alpha, 1 + alpha, -2 * cos, 1 - alpha);
}

export function peaking(f: number, q: number, gainDb: number): Biquad {
  const {cos, sin} = omega(f);
  const a = Math.pow(10, gainDb / 40);
  const alpha = sin / (2 * q);
  return normalise(1 + alpha * a, -2 * cos, 1 - alpha * a, 1 + alpha / a, -2 * cos, 1 - alpha / a);
}

function shelf(f: number, gainDb: number, high: boolean): Biquad {
  const {cos, sin} = omega(f);
  const a = Math.pow(10, gainDb / 40);
  const alpha = (sin / 2) * Math.SQRT2; // shelf slope S = 1
  const sq = 2 * Math.sqrt(a) * alpha;
  const s = high ? -1 : 1;
  const b0 = a * (a + 1 - s * (a - 1) * cos + sq);
  const b1 = s * 2 * a * (a - 1 - s * (a + 1) * cos);
  const b2 = a * (a + 1 - s * (a - 1) * cos - sq);
  const a0 = a + 1 + s * (a - 1) * cos + sq;
  const a1 = -s * 2 * (a - 1 + s * (a + 1) * cos);
  const a2 = a + 1 + s * (a - 1) * cos - sq;
  return normalise(b0, b1, b2, a0, a1, a2);
}

export const lowShelf = (f: number, gainDb: number): Biquad => shelf(f, gainDb, false);
export const highShelf = (f: number, gainDb: number): Biquad => shelf(f, gainDb, true);

/** Direct form II transposed. Returns a new buffer. */
export function applyBiquad(x: Mono, c: Biquad): Mono {
  const out = new Float64Array(x.length);
  let z1 = 0;
  let z2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = x[i] ?? 0;
    const y = c.b0 * v + z1;
    z1 = c.b1 * v - c.a1 * y + z2;
    z2 = c.b2 * v - c.a2 * y;
    out[i] = y;
  }
  return out;
}

export function applyChain(x: Mono, chain: readonly Biquad[]): Mono {
  return chain.reduce<Mono>((sig, c) => applyBiquad(sig, c), x);
}

export type SvfMode = 'lp' | 'bp' | 'hp';

/**
 * Zavalishin topology-preserving-transform SVF. `cutoff` may be a constant or a per-sample curve.
 * Band-pass output is normalised to unity gain at the centre (scaled by k).
 */
export function svf(x: Mono, cutoff: number | Mono, q: number, mode: SvfMode): Mono {
  const out = new Float64Array(x.length);
  const k = 1 / q;
  let ic1 = 0;
  let ic2 = 0;
  const constG = typeof cutoff === 'number' ? Math.tan((Math.PI * safeFreq(cutoff)) / SR) : 0;
  for (let i = 0; i < x.length; i++) {
    const g = typeof cutoff === 'number' ? constG : Math.tan((Math.PI * safeFreq(cutoff[i] ?? 1000)) / SR);
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const v0 = x[i] ?? 0;
    const v3 = v0 - ic2;
    const v1 = a1 * ic1 + a2 * v3;
    const v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1;
    ic2 = 2 * v2 - ic2;
    out[i] = mode === 'lp' ? v2 : mode === 'bp' ? k * v1 : v0 - k * v1 - v2;
  }
  return out;
}

/** One-pole smoother for control curves (time constant in seconds). */
export function smooth(x: Mono, timeConstantSec: number): Mono {
  const a = Math.exp(-1 / Math.max(1, timeConstantSec * SR));
  const out = new Float64Array(x.length);
  let y = x[0] ?? 0;
  for (let i = 0; i < x.length; i++) {
    y = a * y + (1 - a) * (x[i] ?? 0);
    out[i] = y;
  }
  return out;
}

/** Second-order high-pass at 20 Hz: removes DC and sub-sonic drift without touching the desk thuds (80 Hz and up). */
export const DC_BLOCK = highpass(20, Math.SQRT1_2);
export const dcBlock = (x: Mono): Mono => applyBiquad(x, DC_BLOCK);
