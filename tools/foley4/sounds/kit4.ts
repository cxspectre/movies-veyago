// kit4.ts — building blocks the v4 recipes share on top of the v1 kit (tools/foley/sounds/kit.ts):
// sparse fracture events with their own pitch, glide (time-varying) resonators, moving band noise,
// and the extra bodies and friction materials the new families need. Same rules as v1: every onset is a
// finite contact (Hertz pulse) or a raised-cosine envelope, every random draw comes from the seeded Rng.

import {LN_1000, MAX_MODE_HZ, SR, TWO_PI} from '../../foley/core/constants';
import {minJerkSpeed} from '../../foley/core/envelope';
import {applyBiquad, highpass, svf} from '../../foley/core/filters';
import {contactForce, modalBank, type Contact, type Mode} from '../../foley/core/modal';
import {pink} from '../../foley/core/noise';
import type {Rng} from '../../foley/core/rng';
import {clamp, mixMono, rms, scale, zeros, type Mono} from '../../foley/core/signal';
import type {FrictionMaterial} from '../../foley/sounds/friction';
import {lengthOf} from '../../foley/sounds/kit';

/** Clamp an optional parameter into a recipe's physical range. */
export const param = (value: number | undefined, fallback: number, lo: number, hi: number): number =>
  clamp(value !== undefined && Number.isFinite(value) ? value : fallback, lo, hi);

/** Add a bell-shaped (min-jerk) move of `peak` into a curve over [start, start + dur). Returns a new curve. */
export function addMove(curve: Mono, startSec: number, durSec: number, peak: number): Mono {
  const a = Math.round(startSec * SR);
  const b = Math.max(a + 1, Math.round((startSec + durSec) * SR));
  return curve.map((v, i) => (i >= a && i < b ? v + peak * minJerkSpeed((i - a) / (b - a)) : v));
}

/** A curve from a function of time in seconds. */
export const curveOf = (n: number, f: (tSec: number) => number): Mono => Float64Array.from({length: n}, (_, i) => f(i / SR));

/** Pareto-distributed energy (crumpling and fracture emit power-law event sizes), capped so no event can spike. */
export const pareto = (rng: Rng, alpha: number, cap: number): number => Math.min(cap, Math.pow(1 - rng.next() * 0.999999, -1 / alpha));

export type Fracture = {readonly at: number; readonly impulse: number; readonly tau: number; readonly centerHz: number};

/** Log-spaced pitch bins: events are rendered per bin (one modal bank each) so a thousand events stay cheap. */
const BIN_EDGES_HZ = [600, 900, 1350, 2000, 3000, 4500, 6700, 10000] as const;

/**
 * Fracture / buckling events, each a ~50-300 us contact into a short, bright three-mode response centred on
 * its own frequency (a small facet rings high, a large panel low). Paper crumpling, shearing and cork cells
 * collapsing are all sums of such events with heavy-tailed sizes: grainy, never a Gaussian hiss.
 */
export function fractures(lengthSec: number, events: readonly Fracture[], rng: Rng): Mono {
  const n = lengthOf(lengthSec);
  const parts = BIN_EDGES_HZ.slice(0, -1).map((lo, b) => {
    const hi = BIN_EDGES_HZ[b + 1] ?? lo * 1.5;
    const inBin = events.filter((e) => e.centerHz >= lo && (e.centerHz < hi || b === BIN_EDGES_HZ.length - 2));
    if (inBin.length === 0) return zeros(n);
    const centre = Math.sqrt(lo * hi);
    const local = rng.fork(`bin${b}`);
    const modes: Mode[] = [
      {freq: centre * 0.62 * local.uniform(0.95, 1.05), t60: 0.009, amp: 0.55},
      {freq: centre * local.uniform(0.97, 1.03), t60: 0.006, amp: 1},
      {freq: centre * 1.85 * local.uniform(0.95, 1.05), t60: 0.004, amp: 0.45},
    ];
    const contacts: Contact[] = inBin.map((e) => ({at: e.at, impulse: e.impulse, tau: e.tau}));
    return modalBank(contactForce(n, contacts), modes);
  });
  // a facet a few millimetres across radiates nothing below a few hundred Hz
  return applyBiquad(mixMono(n, parts.map((sig) => ({sig}))), FACET_RADIATION);
}

const FACET_RADIATION = highpass(150, 0.7);

/**
 * Poisson events whose rate (events/s) and pitch follow curves: rate(t) and centre(t) in Hz, with a log
 * spread (octaves) per event, power-law sizes scaled by size(t).
 */
export function eventTrain(
  lengthSec: number,
  shape: {rate: (t: number) => number; centerHz: (t: number) => number; size: (t: number) => number; spreadOct: number; alpha: number; cap: number; tau: [number, number]},
  rng: Rng,
): Fracture[] {
  const n = lengthOf(lengthSec);
  const events: Fracture[] = [];
  const step = 16; // evaluate the rate every 16 samples (0.33 ms): far finer than any event spacing here
  for (let i = 0; i < n; i += step) {
    const t = i / SR;
    const p = Math.max(0, shape.rate(t)) * (step / SR);
    if (rng.next() < p) {
      const centre = shape.centerHz(t) * Math.pow(2, rng.uniform(-shape.spreadOct, shape.spreadOct));
      events.push({at: t + rng.uniform(0, step / SR), impulse: pareto(rng, shape.alpha, shape.cap) * shape.size(t), tau: rng.uniform(shape.tau[0], shape.tau[1]), centerHz: clamp(centre, 600, 9800)});
    }
  }
  return events;
}

export type Partial = {readonly ratio: number; readonly t60: number; readonly amp: number};

/**
 * A bank of two-pole resonators whose fundamental follows `f0` (Hz per sample): a string under changing
 * tension, a tube whose air column lengthens. Same normalisation as modalBank (unit impulse -> amplitude amp).
 */
export function glideBank(force: Mono, f0: Mono, partials: readonly Partial[]): Mono {
  const out = zeros(force.length);
  for (const p of partials) {
    const r = Math.exp(-LN_1000 / Math.max(p.t60 * SR, 1));
    let y1 = 0;
    let y2 = 0;
    for (let i = 0; i < force.length; i++) {
      const f = (f0[i] ?? 0) * p.ratio;
      if (f <= 0 || f >= MAX_MODE_HZ) {
        y2 = y1;
        y1 = 0;
        continue;
      }
      const w = (TWO_PI * f) / SR;
      const y = 2 * r * Math.cos(w) * y1 - r * r * y2 + p.amp * Math.sin(w) * (force[i] ?? 0);
      out[i] = (out[i] ?? 0) + y;
      y2 = y1;
      y1 = y;
    }
  }
  return out;
}

/** Pink noise through a band-pass whose centre follows a curve: moving air (a plane's edge, a rocket's wake). */
export function movingBand(n: number, centreHz: Mono, q: number, rng: Rng): Mono {
  return svf(pink(n, rng), centreHz, q, 'bp');
}

/**
 * Scale a noisy layer so its RMS is `level` x the reference's RMS. Noise peaks are random, so balancing a
 * noise layer by its peak (relativeTo) would make the takes' loudness wander; its energy is what is heard.
 */
export function relativeRms(part: Mono, reference: Mono, level: number): Mono {
  return scale(part, (level * rms(reference)) / Math.max(rms(part), 1e-12));
}

/** Pan curve that travels linearly from `from` to `to` across the sound. */
export const panTravel = (n: number, from: number, to: number): Mono => Float64Array.from({length: n}, (_, i) => from + ((to - from) * i) / Math.max(1, n - 1));

// Bodies ---------------------------------------------------------------------------------------------

/** A 300 g/m2 card panel (a pop-up wall, a gate flap, a card ramp): low, papery, quickly damped. */
export const CARD_MODES: readonly Mode[] = [
  {freq: 190, t60: 0.06, amp: 0.7},
  {freq: 430, t60: 0.045, amp: 1},
  {freq: 980, t60: 0.03, amp: 0.6},
  {freq: 2100, t60: 0.018, amp: 0.35},
  {freq: 3900, t60: 0.01, amp: 0.2},
];

/** A cork board (10 mm cork on a fibreboard back, on a wall): heavily damped low-mid thunk. */
export const CORK_MODES: readonly Mode[] = [
  {freq: 165, t60: 0.05, amp: 0.8},
  {freq: 290, t60: 0.045, amp: 1},
  {freq: 520, t60: 0.035, amp: 0.6},
  {freq: 930, t60: 0.022, amp: 0.3},
];

/** Small brass lock body held in the fingers (the hand damps it). */
export const LOCK_BODY_MODES: readonly Mode[] = [
  {freq: 2350, t60: 0.05, amp: 1},
  {freq: 3680, t60: 0.04, amp: 0.7},
  {freq: 5900, t60: 0.03, amp: 0.45},
  {freq: 8300, t60: 0.02, amp: 0.25},
];

/** Thin tinplate shell of a toy carriage: bright, short, slightly rattly. */
export const TIN_MODES: readonly Mode[] = [
  {freq: 1180, t60: 0.035, amp: 0.8},
  {freq: 2050, t60: 0.03, amp: 1},
  {freq: 2900, t60: 0.025, amp: 0.7},
  {freq: 4400, t60: 0.018, amp: 0.45},
  {freq: 6100, t60: 0.012, amp: 0.25},
];

/** A plastic digit wheel and the counter's housing. */
export const WHEEL_MODES: readonly Mode[] = [
  {freq: 2600, t60: 0.012, amp: 1},
  {freq: 4150, t60: 0.009, amp: 0.6},
  {freq: 6500, t60: 0.006, amp: 0.35},
];
export const HOUSING_MODES: readonly Mode[] = [
  {freq: 820, t60: 0.02, amp: 0.6},
  {freq: 1500, t60: 0.016, amp: 0.5},
];

/** A beech stamp knob: short wooden knock. */
export const KNOB_MODES: readonly Mode[] = [
  {freq: 780, t60: 0.03, amp: 1},
  {freq: 1650, t60: 0.02, amp: 0.55},
  {freq: 3100, t60: 0.012, amp: 0.3},
];

// Friction materials ---------------------------------------------------------------------------------

/** Cotton thread pulled through fingers and over a pin: fine, light, a dry hiss with tiny catches. */
export const THREAD_ON_FINGERS: FrictionMaterial = {
  grainCoarseMm: 0.6, grainFineMm: 0.15, grainDepth: 0.4, slipsPerMm: 2.5, slipGain: 2.5,
  slipWidthSlowMs: 0.25, slipWidthFastMs: 0.1, noiseGain: 0.8, cutoffSlowHz: 2800, cutoffFastHz: 6500,
  highpassHz: 700, refSpeedMmS: 250, speedExponent: 0.8, pressureExponent: 1,
};

/** Steel on steel (a scissor pivot, a padlock shackle in its bore): hard, smooth, bright, quiet. */
export const STEEL_ON_STEEL: FrictionMaterial = {
  grainCoarseMm: 0.5, grainFineMm: 0.1, grainDepth: 0.2, slipsPerMm: 3, slipGain: 3,
  slipWidthSlowMs: 0.08, slipWidthFastMs: 0.04, noiseGain: 0.5, cutoffSlowHz: 4500, cutoffFastHz: 9000,
  highpassHz: 1500, refSpeedMmS: 60, speedExponent: 0.7, pressureExponent: 1,
};

/** A tin wheel or a glass marble rolling on card: a soft, low rumble with the card's grain in it. */
export const ROLL_ON_CARD: FrictionMaterial = {
  grainCoarseMm: 1.2, grainFineMm: 0.35, grainDepth: 0.5, slipsPerMm: 1.5, slipGain: 2,
  slipWidthSlowMs: 0.6, slipWidthFastMs: 0.3, noiseGain: 1, cutoffSlowHz: 700, cutoffFastHz: 2200,
  highpassHz: 130, refSpeedMmS: 250, speedExponent: 0.9, pressureExponent: 1,
};

/** Paper sliding on paper (a rocket tube leaving its launch tube, a crushed sheet in the palms). */
export const PAPER_ON_PAPER: FrictionMaterial = {
  grainCoarseMm: 2, grainFineMm: 0.5, grainDepth: 0.45, slipsPerMm: 0.8, slipGain: 2.5,
  slipWidthSlowMs: 0.7, slipWidthFastMs: 0.35, noiseGain: 1, cutoffSlowHz: 1600, cutoffFastHz: 4200,
  highpassHz: 200, refSpeedMmS: 250, speedExponent: 0.8, pressureExponent: 1,
};
