// metrics.ts — the measurements that stand in for listening: level safety, envelope shape, spectrum,
// texture. Every function is pure over a Stereo buffer at 48 kHz.

import {SR} from '../core/constants';
import {stereoTruePeakDb} from '../core/dynamics';
import {momentaryMax} from '../core/loudness';
import {gainToDb, mean, peakAbs, rms, type Mono} from '../core/signal';
import type {Stereo} from '../core/space';
import {hann, powerSpectrum} from './fft';

const FRAME = 2048;
const HOP = 1024;
const ACTIVE_DB = -45;
const FULL_SCALE_24 = 8_388_607 / 8_388_608;

export const BANDS = [
  {name: 'sub', lo: 20, hi: 100},
  {name: 'low', lo: 100, hi: 400},
  {name: 'lowMid', lo: 400, hi: 1600},
  {name: 'mid', lo: 1600, hi: 6400},
  {name: 'high', lo: 6400, hi: 20000},
] as const;
export type BandName = (typeof BANDS)[number]['name'];

export type SoundMetrics = {
  readonly durationSec: number;
  readonly peakDbfs: number;
  readonly truePeakDbtp: number;
  readonly rmsDbfs: number;
  readonly lufsMomentaryMax: number;
  readonly dcOffset: number;
  readonly clippedSamples: number;
  readonly firstSample: number;
  readonly lastSample: number;
  readonly attackMs: number;
  readonly centroidHz: number;
  readonly rolloff85Hz: number;
  readonly bandsPct: Record<BandName, number>;
  readonly flatness: number;
  readonly crackleKurtosis: number;
  readonly envelopeStdDb: number;
  readonly t60EstimateSec: number;
  readonly stereoCorrelation: number;
};

export const monoSum = (s: Stereo): Mono => s.left.map((v, i) => 0.5 * (v + (s.right[i] ?? 0)));

/** RMS envelope over a sliding window (seconds), one value per sample. */
export function rmsEnvelope(x: Mono, windowSec: number): Mono {
  const w = Math.max(1, Math.round(windowSec * SR));
  const out = new Float64Array(x.length);
  let acc = 0;
  for (let i = 0; i < x.length; i++) {
    acc += (x[i] ?? 0) ** 2 - (i >= w ? (x[i - w] ?? 0) ** 2 : 0);
    out[i] = Math.sqrt(Math.max(0, acc) / w);
  }
  return out;
}

/** Frames whose energy is within ACTIVE_DB of the loudest (silence would dilute every average). */
function activeFrames(x: Mono): Float64Array[] {
  const win = hann(FRAME);
  const frames: Float64Array[] = [];
  for (let s = 0; s + FRAME <= Math.max(x.length, FRAME); s += HOP) frames.push(Float64Array.from({length: FRAME}, (_, i) => (x[s + i] ?? 0) * (win[i] ?? 0)));
  const energies = frames.map((f) => f.reduce((a, v) => a + v * v, 0));
  const max = Math.max(...energies, 1e-30);
  return frames.filter((_, k) => 10 * Math.log10((energies[k] ?? 0) / max + 1e-30) > ACTIVE_DB);
}

const binHz = (k: number): number => (k * SR) / FRAME;

function spectralStats(x: Mono): {centroid: number; rolloff: number; bands: Record<BandName, number>; flatness: number} {
  const spectra = activeFrames(x).map(powerSpectrum);
  const avg = Float64Array.from({length: FRAME / 2 + 1}, (_, k) => spectra.reduce((a, s) => a + (s[k] ?? 0), 0) / Math.max(1, spectra.length));
  const total = avg.reduce((a, v, k) => a + (binHz(k) >= 20 ? v : 0), 0) || 1e-30;
  const centroid = avg.reduce((a, v, k) => a + v * binHz(k), 0) / (avg.reduce((a, v) => a + v, 0) || 1e-30);
  let cum = 0;
  let rolloff = 0;
  for (let k = 0; k < avg.length; k++) {
    cum += binHz(k) >= 20 ? (avg[k] ?? 0) : 0;
    if (cum >= 0.85 * total) {
      rolloff = binHz(k);
      break;
    }
  }
  const bandEntries = BANDS.map((b) => [b.name, (100 * avg.reduce((a, v, k) => a + (binHz(k) >= b.lo && binHz(k) < b.hi ? v : 0), 0)) / total]);
  const flatnessPerFrame = spectra.map((s) => {
    const bins = Array.from(s).filter((_, k) => binHz(k) >= 100 && binHz(k) <= 16000).map((v) => v + 1e-30);
    const geo = Math.exp(bins.reduce((a, v) => a + Math.log(v), 0) / bins.length);
    const arith = bins.reduce((a, v) => a + v, 0) / bins.length;
    return geo / arith;
  });
  const flatness = flatnessPerFrame.reduce((a, v) => a + v, 0) / Math.max(1, flatnessPerFrame.length);
  return {centroid, rolloff, bands: Object.fromEntries(bandEntries) as Record<BandName, number>, flatness};
}

/**
 * Kurtosis of the signal divided by its own 20 ms RMS envelope, over active samples. Slow level changes
 * cancel out; what remains is micro-impulsiveness. Gaussian (white "shhh") noise gives 3.0.
 */
export function crackleKurtosis(x: Mono): number {
  const env = rmsEnvelope(x, 0.02);
  const peakEnv = peakAbs(env);
  const half = Math.round(0.01 * SR);
  const vals: number[] = [];
  for (let i = 0; i < x.length - half; i++) {
    const e = env[i + half] ?? 0; // centre the window
    if (e > peakEnv * 0.1) vals.push((x[i] ?? 0) / e);
  }
  if (vals.length < 100) return NaN;
  const m2 = vals.reduce((a, v) => a + v * v, 0) / vals.length;
  const m4 = vals.reduce((a, v) => a + v ** 4, 0) / vals.length;
  return m4 / (m2 * m2);
}

/** Standard deviation (dB) of the 10 ms envelope over active samples: how much the level moves. */
export function envelopeStdDb(x: Mono): number {
  const env = rmsEnvelope(x, 0.01);
  const peakEnv = peakAbs(env);
  const db = Array.from(env).filter((e) => e > peakEnv * 0.03).map((e) => gainToDb(e));
  const m = db.reduce((a, v) => a + v, 0) / Math.max(1, db.length);
  return Math.sqrt(db.reduce((a, v) => a + (v - m) ** 2, 0) / Math.max(1, db.length));
}

const ONSET_FRACTION = 0.25;
const LOCAL_PEAK_SEC = 0.01;

/**
 * 10 %-90 % rise time (ms) of the 0.25 ms RMS envelope at the FIRST significant event: the first point
 * reaching 25 % of the global maximum, and the local peak within 10 ms of it. (Multi-contact sounds such
 * as a bouncing key would otherwise measure the gap between bounces.)
 */
export function attackMs(x: Mono): number {
  const env = rmsEnvelope(x, 0.00025);
  const globalMax = peakAbs(env);
  const onset = env.findIndex((v) => v >= ONSET_FRACTION * globalMax);
  const start = Math.max(0, onset);
  let peakIdx = start;
  for (let i = start; i < Math.min(env.length, start + LOCAL_PEAK_SEC * SR); i++) {
    if ((env[i] ?? 0) > (env[peakIdx] ?? 0)) peakIdx = i;
  }
  const p = env[peakIdx] ?? 0;
  let i90 = peakIdx;
  while (i90 > 0 && (env[i90] ?? 0) > 0.9 * p) i90--;
  let i10 = i90;
  while (i10 > 0 && (env[i10] ?? 0) > 0.1 * p) i10--;
  return ((i90 - i10) / SR) * 1000;
}

/** T60 extrapolated from the -5 to -25 dB slope of the Schroeder backward-integrated energy after the peak. */
export function t60Estimate(x: Mono): number {
  const sq = x.map((v) => v * v);
  let peakIdx = 0;
  x.forEach((v, i) => {
    if (Math.abs(v) > Math.abs(x[peakIdx] ?? 0)) peakIdx = i;
  });
  const edc = new Float64Array(x.length);
  let acc = 0;
  for (let i = x.length - 1; i >= 0; i--) {
    acc += sq[i] ?? 0;
    edc[i] = acc;
  }
  const ref = edc[peakIdx] ?? 1e-30;
  const timeAt = (db: number): number => {
    for (let i = peakIdx; i < edc.length; i++) if (10 * Math.log10((edc[i] ?? 0) / ref + 1e-30) <= db) return (i - peakIdx) / SR;
    return NaN;
  };
  return 3 * (timeAt(-25) - timeAt(-5));
}

function correlation(a: Mono, b: Mono): number {
  let ab = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) {
    ab += (a[i] ?? 0) * (b[i] ?? 0);
    aa += (a[i] ?? 0) ** 2;
    bb += (b[i] ?? 0) ** 2;
  }
  return aa > 0 && bb > 0 ? ab / Math.sqrt(aa * bb) : 0;
}

export function measure(s: Stereo): SoundMetrics {
  const m = monoSum(s);
  const spectral = spectralStats(m);
  const clipped = [...s.left, ...s.right].filter((v) => Math.abs(v) >= FULL_SCALE_24).length;
  const last = s.left.length - 1;
  return {
    durationSec: s.left.length / SR,
    peakDbfs: gainToDb(Math.max(peakAbs(s.left), peakAbs(s.right))),
    truePeakDbtp: stereoTruePeakDb(s),
    rmsDbfs: gainToDb(Math.sqrt((rms(s.left) ** 2 + rms(s.right) ** 2) / 2)),
    lufsMomentaryMax: momentaryMax(s),
    dcOffset: Math.max(Math.abs(mean(s.left)), Math.abs(mean(s.right))),
    clippedSamples: clipped,
    firstSample: Math.max(Math.abs(s.left[0] ?? 0), Math.abs(s.right[0] ?? 0)),
    lastSample: Math.max(Math.abs(s.left[last] ?? 0), Math.abs(s.right[last] ?? 0)),
    attackMs: attackMs(m),
    centroidHz: spectral.centroid,
    rolloff85Hz: spectral.rolloff,
    bandsPct: spectral.bands,
    flatness: spectral.flatness,
    crackleKurtosis: crackleKurtosis(m),
    envelopeStdDb: envelopeStdDb(m),
    t60EstimateSec: t60Estimate(m),
    stereoCorrelation: correlation(s.left, s.right),
  };
}

export {correlation};
