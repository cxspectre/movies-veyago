// dynamics.ts — level safety: true peak (4x oversampled, BS.1770-4 style), a transparent look-ahead
// true-peak limiter for summed stems, DC removal and clean tails.

import {SR} from './constants';
import {dcBlock} from './filters';
import type {Stereo} from './space';
import {dbToGain, gainToDb, zeros, type Mono} from './signal';

const OVERSAMPLE = 4;
const HALF_TAPS = 12;

/** Windowed-sinc interpolation kernels for the three in-between phases (1/4, 2/4, 3/4). */
const KERNELS: readonly Float64Array[] = Array.from({length: OVERSAMPLE - 1}, (_, p) => {
  const frac = (p + 1) / OVERSAMPLE;
  return Float64Array.from({length: 2 * HALF_TAPS}, (_, k) => {
    const t = k - HALF_TAPS + 1 - frac; // distance from sample n + k - HALF + 1 to n + frac
    const sinc = t === 0 ? 1 : Math.sin(Math.PI * t) / (Math.PI * t);
    const w = 0.5 + 0.5 * Math.cos((Math.PI * t) / (HALF_TAPS + 0.5)); // Hann
    return sinc * w;
  });
});

/** Per-sample true-peak magnitude: max |x| over the sample and the 3 interpolated points after it. */
export function truePeakEnvelope(x: Mono): Mono {
  const out = zeros(x.length);
  for (let n = 0; n < x.length; n++) {
    let m = Math.abs(x[n] ?? 0);
    for (const kernel of KERNELS) {
      let acc = 0;
      for (let k = 0; k < kernel.length; k++) acc += (x[n + k - HALF_TAPS + 1] ?? 0) * (kernel[k] ?? 0);
      m = Math.max(m, Math.abs(acc));
    }
    out[n] = m;
  }
  return out;
}

export function truePeak(x: Mono): number {
  return truePeakEnvelope(x).reduce((m, v) => Math.max(m, v), 0);
}

export const stereoTruePeakDb = (s: Stereo): number => gainToDb(Math.max(truePeak(s.left), truePeak(s.right)));

export const scaleStereo = (s: Stereo, gain: number): Stereo => ({
  left: s.left.map((v) => v * gain),
  right: s.right.map((v) => v * gain),
});

export const dcBlockStereo = (s: Stereo): Stereo => ({left: dcBlock(s.left), right: dcBlock(s.right)});

export type LimitResult = {readonly stereo: Stereo; readonly engaged: boolean; readonly maxReductionDb: number};

const LOOKAHEAD_SEC = 0.0015;
const RELEASE_SEC = 0.08;

/** min(x[i .. i+window-1]) in O(n) with a monotone deque. */
function slidingMinForward(x: Mono, window: number): Mono {
  const n = x.length;
  const out = zeros(n);
  const deque = new Int32Array(n + 1);
  let head = 0;
  let tail = 0;
  for (let j = n - 1; j >= 0; j--) {
    const v = x[j] ?? 1;
    while (tail > head && (x[deque[tail - 1] ?? 0] ?? 1) >= v) tail--;
    deque[tail++] = j;
    while ((deque[head] ?? 0) > j + window - 1) head++;
    out[j] = x[deque[head] ?? j] ?? 1;
  }
  return out;
}

/** Mean of x[i-window+1 .. i]; samples before 0 repeat x[0] (so a peak in the first window is still caught). */
function movingAverageBackward(x: Mono, window: number): Mono {
  const out = zeros(x.length);
  const first = x[0] ?? 1;
  let sum = window * first;
  for (let i = 0; i < x.length; i++) {
    sum += (x[i] ?? 1) - (i - window >= 0 ? (x[i - window] ?? 1) : first);
    out[i] = sum / window;
  }
  return out;
}

/**
 * Look-ahead true-peak limiter: gain = min over the look-ahead window of ceiling/truePeak, released
 * slowly. On calibrated foley it should almost never engage; it exists so a pile-up can never clip.
 */
export function limitTruePeak(s: Stereo, ceilingDb: number): LimitResult {
  const ceiling = dbToGain(ceilingDb);
  const envL = truePeakEnvelope(s.left);
  const envR = truePeakEnvelope(s.right);
  const n = s.left.length;
  const look = Math.round(LOOKAHEAD_SEC * SR);
  const target = Float64Array.from({length: n}, (_, i) => Math.min(1, ceiling / Math.max(envL[i] ?? 0, envR[i] ?? 0, 1e-12)));
  if (target.every((g) => g >= 1)) return {stereo: s, engaged: false, maxReductionDb: 0};
  const hold = slidingMinForward(target, look + 1);
  const ramp = movingAverageBackward(hold, look + 1);
  const release = Math.exp(-1 / (RELEASE_SEC * SR));
  const gain = zeros(n);
  let g = 1;
  for (let i = 0; i < n; i++) {
    const want = ramp[i] ?? 1;
    g = want < g ? want : release * g + (1 - release) * want;
    gain[i] = g;
  }
  const minGain = gain.reduce((m, v) => Math.min(m, v), 1);
  return {
    stereo: {left: s.left.map((v, i) => v * (gain[i] ?? 1)), right: s.right.map((v, i) => v * (gain[i] ?? 1))},
    engaged: true,
    maxReductionDb: -gainToDb(minGain),
  };
}

/**
 * Trim trailing samples quieter than `floorDb` (keeping `keepSec` after the last loud one) and
 * finish with a raised-cosine fade so every file ends exactly on zero.
 */
export function trimTail(s: Stereo, floorDb: number, fadeSec: number): Stereo {
  const floor = dbToGain(floorDb);
  let last = s.left.length - 1;
  while (last > 0 && Math.abs(s.left[last] ?? 0) < floor && Math.abs(s.right[last] ?? 0) < floor) last--;
  const fade = Math.round(fadeSec * SR);
  const length = Math.min(s.left.length, last + fade + 1);
  const shape = (i: number): number => {
    const r = length - 1 - i;
    return r < fade ? 0.5 - 0.5 * Math.cos((Math.PI * r) / fade) : 1;
  };
  return {
    left: Float64Array.from({length}, (_, i) => (s.left[i] ?? 0) * shape(i) || 0), // `|| 0` turns -0 into 0
    right: Float64Array.from({length}, (_, i) => (s.right[i] ?? 0) * shape(i) || 0),
  };
}
