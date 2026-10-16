// friction.ts — the sliding-contact engine shared by pencil, pen, eraser, fingers and sheets.
//
// Physics: a tip sliding over paper meets fibre ridges ("tooth"). The friction force has two parts:
//  1. stick-slip micro-releases: the tip catches a ridge, loads, and slips. Events arrive per millimetre
//     travelled (so their RATE follows speed), with irregular spacing (no periodicity, so no squeak).
//     A faster tip slips more abruptly, so each release is a shorter, brighter pulse.
//  2. a continuous rubbing component (many tiny asperities at once): Gaussian noise.
// Both are modulated by the paper's tooth texture, which is a function of POSITION on the sheet, not
// time: drawing slowly over the same patch gives the same grain, just stretched. Level rises with
// normal force (pressure) and with sliding speed; the radiated brightness rises with speed.

import {SR} from '../core/constants';
import {applyBiquad, highpass, svf} from '../core/filters';
import type {Rng} from '../core/rng';
import {clamp, integrate, zeros, type Mono} from '../core/signal';

export type FrictionMaterial = {
  /** Correlation length of the coarse tooth texture (mm) and of the fine fibre texture (mm). */
  readonly grainCoarseMm: number;
  readonly grainFineMm: number;
  /** How strongly the texture modulates level (0 = smooth glass, 1 = rough watercolour paper). */
  readonly grainDepth: number;
  /** Stick-slip releases per millimetre travelled, and their weight against the rubbing noise. */
  readonly slipsPerMm: number;
  readonly slipGain: number;
  /** Width of one slip pulse when slow and when fast (ms): sets the transient brightness. */
  readonly slipWidthSlowMs: number;
  readonly slipWidthFastMs: number;
  readonly noiseGain: number;
  /** Radiated low-pass corner when slow and when fast, and the fixed high-pass (small radiators lose lows). */
  readonly cutoffSlowHz: number;
  readonly cutoffFastHz: number;
  readonly highpassHz: number;
  /** Speed (mm/s) treated as "normal" drawing speed. */
  readonly refSpeedMmS: number;
  readonly speedExponent: number;
  readonly pressureExponent: number;
};

/** Pressure at which a material is characterised; harder or lighter contact is relative to this. */
const REFERENCE_PRESSURE = 0.6;
/** Harder contact loads each fibre more before it slips: slips grow faster than the rubbing noise. */
const SLIP_PRESSURE_EXPONENT = 0.6;
/** ...and release more abruptly: the radiated corner moves up ~10 % per +0.3 pressure. */
const CUTOFF_PER_PRESSURE = 0.35;
/** Fraction of slips released in the direction of travel. */
const SLIP_POLARITY_BIAS = 0.72;

/** Value noise over position: Gaussian lattice values at spacing `corr`, cosine interpolated. */
function textureAt(lattice: Float64Array, corr: number): (x: number) => number {
  return (x) => {
    const u = x / corr;
    const k = Math.floor(u);
    const f = u - k;
    const w = 0.5 - 0.5 * Math.cos(Math.PI * f);
    return (lattice[k] ?? 0) * (1 - w) + (lattice[k + 1] ?? 0) * w;
  };
}

function paperTexture(pathMm: number, mat: FrictionMaterial, rng: Rng): (x: number) => number {
  const coarse = Float64Array.from({length: Math.ceil(pathMm / mat.grainCoarseMm) + 3}, () => rng.normal());
  const fine = Float64Array.from({length: Math.ceil(pathMm / mat.grainFineMm) + 3}, () => rng.normal());
  const tc = textureAt(coarse, mat.grainCoarseMm);
  const tf = textureAt(fine, mat.grainFineMm);
  // log-normal texture: always positive, occasional strong ridges (the "catch" you feel through a pencil)
  return (x) => Math.exp(mat.grainDepth * (0.75 * tc(x) + 0.5 * tf(x)) - 0.5 * mat.grainDepth * mat.grainDepth);
}

/** Add a Hann-shaped micro-pulse into a locally owned accumulator. */
function addPulse(acc: Mono, at: number, widthSamples: number, amp: number): void {
  const w = Math.max(2, Math.round(widthSamples));
  for (let i = 0; i < w; i++) {
    const j = at + i;
    if (j < acc.length) acc[j] = (acc[j] ?? 0) + amp * (0.5 - 0.5 * Math.cos((2 * Math.PI * (i + 0.5)) / w));
  }
}

/**
 * Friction sound source for a speed curve (mm/s per sample) and a pressure curve (0..1 per sample).
 * Returns the radiated (filtered) mono signal, before any body resonance or space.
 */
export function frictionSource(speed: Mono, pressure: Mono, mat: FrictionMaterial, rng: Rng): Mono {
  const n = speed.length;
  const position = integrate(speed, SR);
  const texture = paperTexture((position[n - 1] ?? 0) + 1, mat, rng.fork('texture'));
  const noiseRng = rng.fork('noise');
  const slipRng = rng.fork('slip');
  const raw = zeros(n);
  const cutoff = zeros(n);
  let nextSlip = slipRng.exponential() / mat.slipsPerMm;
  for (let i = 0; i < n; i++) {
    const v = Math.max(0, speed[i] ?? 0);
    const sn = clamp(v / mat.refSpeedMmS, 0, 2.5);
    const p = clamp(pressure[i] ?? 0, 0, 1);
    const x = position[i] ?? 0;
    const tex = texture(x);
    const level = Math.pow(p, mat.pressureExponent) * Math.pow(sn, mat.speedExponent);
    raw[i] = (raw[i] ?? 0) + noiseRng.normal() * tex * level * mat.noiseGain;
    const pressureTilt = 1 + CUTOFF_PER_PRESSURE * (p - REFERENCE_PRESSURE);
    cutoff[i] = pressureTilt * mat.cutoffSlowHz * Math.pow(mat.cutoffFastHz / mat.cutoffSlowHz, Math.min(1, sn));
    while (x >= nextSlip) {
      const widthMs = mat.slipWidthSlowMs + (mat.slipWidthFastMs - mat.slipWidthSlowMs) * Math.min(1, sn);
      const polarity = slipRng.next() < SLIP_POLARITY_BIAS ? 1 : -1;
      const load = Math.pow(p / REFERENCE_PRESSURE, SLIP_PRESSURE_EXPONENT);
      const amp = polarity * mat.slipGain * level * load * tex * slipRng.logNormal(0.55);
      addPulse(raw, i, (widthMs / 1000) * SR, amp);
      // irregular spacing with a short refractory gap: fibres are random, never a periodic squeak
      nextSlip += (0.3 + 0.7 * slipRng.exponential()) / mat.slipsPerMm;
    }
  }
  const lowpassed = svf(raw, cutoff, 0.6, 'lp');
  return applyBiquad(applyBiquad(lowpassed, highpass(mat.highpassHz, 0.6)), highpass(mat.highpassHz * 0.7, 0.6));
}
