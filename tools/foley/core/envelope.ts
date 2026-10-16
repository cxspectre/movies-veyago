// envelope.ts — envelopes and control curves (gesture speed, slow random drift, fades).

import {SR} from './constants';
import type {Rng} from './rng';
import {clamp, zeros, type Mono} from './signal';

/** Raised-cosine fade in and out (no corners, so no clicks). Lengths in seconds, clipped to half the signal. */
export function fadeInOut(length: number, inSec: number, outSec: number): Mono {
  const out = zeros(length);
  const nIn = Math.max(1, Math.min(Math.round(inSec * SR), Math.floor(length / 2)));
  const nOut = Math.max(1, Math.min(Math.round(outSec * SR), Math.floor(length / 2)));
  for (let i = 0; i < length; i++) {
    const a = i < nIn ? 0.5 - 0.5 * Math.cos((Math.PI * i) / nIn) : 1;
    const r = length - 1 - i;
    const b = r < nOut ? 0.5 - 0.5 * Math.cos((Math.PI * r) / nOut) : 1;
    out[i] = a * b;
  }
  return out;
}

/**
 * Minimum-jerk speed profile (Flash & Hogan 1985), the bell-shaped speed of a human reaching or drawing
 * movement. s in [0, 1]; normalised so the peak (s = 0.5) is 1.
 */
export function minJerkSpeed(s: number): number {
  const u = clamp(s, 0, 1);
  return 16 * u * u * (1 - u) * (1 - u);
}

/** Slow random drift in [-1, 1]: random knots at `rateHz`, cosine-interpolated (no corners). */
export function smoothRandom(length: number, rateHz: number, rng: Rng): Mono {
  const out = zeros(length);
  const step = Math.max(1, Math.round(SR / Math.max(rateHz, 1e-3)));
  const knots = Array.from({length: Math.ceil(length / step) + 2}, () => rng.uniform(-1, 1));
  for (let i = 0; i < length; i++) {
    const k = Math.floor(i / step);
    const f = (i - k * step) / step;
    const w = 0.5 - 0.5 * Math.cos(Math.PI * f);
    out[i] = (knots[k] ?? 0) * (1 - w) + (knots[k + 1] ?? 0) * w;
  }
  return out;
}

/** Exponential decay that starts at `startSec` (1 before it), reaching -60 dB after `t60Sec`. */
export function decayAfter(length: number, startSec: number, t60Sec: number): Mono {
  const out = zeros(length);
  const start = Math.round(startSec * SR);
  const rate = Math.log(1000) / Math.max(t60Sec * SR, 1);
  for (let i = 0; i < length; i++) out[i] = i < start ? 1 : Math.exp(-rate * (i - start));
  return out;
}

/** Attack-decay burst envelope: raised-cosine rise over `attackSec`, exponential fall with time constant `decaySec`. */
export function burst(length: number, startSec: number, attackSec: number, decaySec: number): Mono {
  const out = zeros(length);
  const s = Math.round(startSec * SR);
  const a = Math.max(1, Math.round(attackSec * SR));
  const d = Math.max(1, decaySec * SR);
  for (let i = Math.max(0, s); i < length; i++) {
    const n = i - s;
    out[i] = n < a ? 0.5 - 0.5 * Math.cos((Math.PI * n) / a) : Math.exp(-(n - a) / d);
  }
  return out;
}
