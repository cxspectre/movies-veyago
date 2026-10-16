// noise.ts — seeded noise colours. All are normalised to unit RMS so recipes set level explicitly.

import type {Rng} from './rng';
import {rms, scale, zeros, type Mono} from './signal';

const normaliseRms = (x: Mono): Mono => {
  const r = rms(x);
  return r > 0 ? scale(x, 1 / r) : x;
};

/** Gaussian white noise (friction force fluctuations are close to Gaussian at the micro scale). */
export function white(length: number, rng: Rng): Mono {
  const out = zeros(length);
  for (let i = 0; i < out.length; i++) out[i] = rng.normal();
  return out;
}

/** Pink (-3 dB/oct) via Paul Kellet's refined filter. Air and room sounds sit near 1/f. */
export function pink(length: number, rng: Rng): Mono {
  const out = zeros(length);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < out.length; i++) {
    const w = rng.normal();
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    out[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
    b6 = w * 0.115926;
  }
  return normaliseRms(out);
}

/** Brown (-6 dB/oct) as a leaky integrator (leak keeps it DC-free over long beds). */
export function brown(length: number, rng: Rng): Mono {
  const out = zeros(length);
  const leak = 0.9985;
  let y = 0;
  for (let i = 0; i < out.length; i++) {
    y = leak * y + 0.05 * rng.normal();
    out[i] = y;
  }
  return normaliseRms(out);
}
