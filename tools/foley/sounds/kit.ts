// kit.ts — shared building blocks for recipes: the desk, paper crinkles, shaped noise bursts.

import {SR} from '../core/constants';
import {burst} from '../core/envelope';
import {applyBiquad, bandpass, highpass, lowpass} from '../core/filters';
import {contactForce, jitterModes, modalBank, type Contact, type Mode, type ModeJitter} from '../core/modal';
import {white} from '../core/noise';
import type {Rng} from '../core/rng';
import {multiply, peakAbs, scale, type Mono} from '../core/signal';

/**
 * A wooden desk top (solid beech/oak, ~25 mm, on a frame): the low "weight" under every object set down.
 * Plate modes 85-520 Hz, heavily damped by the frame and what lies on it.
 */
export const DESK_MODES: readonly Mode[] = [
  {freq: 88, t60: 0.1, amp: 0.6},
  {freq: 142, t60: 0.09, amp: 0.85},
  {freq: 213, t60: 0.075, amp: 0.75},
  {freq: 331, t60: 0.06, amp: 0.4},
  {freq: 517, t60: 0.045, amp: 0.25},
];

/** The paper sheet lying on the desk, struck locally: short, dry, mid-range. */
export const PAPER_PATCH_MODES: readonly Mode[] = [
  {freq: 650, t60: 0.03, amp: 1},
  {freq: 1450, t60: 0.022, amp: 0.6},
  {freq: 2900, t60: 0.014, amp: 0.4},
  {freq: 4700, t60: 0.009, amp: 0.25},
];

export const lengthOf = (sec: number): number => Math.max(2, Math.round(sec * SR));

/**
 * Radiation: what reaches the ear is surface ACCELERATION, and a plate radiates poorly below its lowest
 * modes. Without this, a long contact (a thumb, a phone on paper) leaks its quasi-static push as
 * sub-bass that no real desk would radiate.
 */
const RADIATION = highpass(60, 0.7);

/** Modal response of a body to a list of contacts, with per-take mode jitter, as radiated sound. */
export function struck(lengthSec: number, contacts: readonly Contact[], modes: readonly Mode[], rng: Rng, jitter?: ModeJitter): Mono {
  return applyBiquad(modalBank(contactForce(lengthOf(lengthSec), contacts), jitterModes(modes, rng, jitter)), RADIATION);
}

/** Band-limited noise with a raised-cosine attack and exponential decay (contact grit, air puffs). */
export function noiseBurst(
  lengthSec: number,
  opts: {at: number; attack: number; decay: number; centerHz: number; q: number},
  rng: Rng,
): Mono {
  const n = lengthOf(lengthSec);
  const band = applyBiquad(white(n, rng), bandpass(opts.centerHz, opts.q));
  return multiply(band, burst(n, opts.at, opts.attack, opts.decay));
}

/** Low-passed noise burst (air pushed out from under a sheet or a phone). */
export function airPuff(lengthSec: number, opts: {at: number; attack: number; decay: number; cutoffHz: number}, rng: Rng): Mono {
  const n = lengthOf(lengthSec);
  const air = applyBiquad(applyBiquad(white(n, rng), lowpass(opts.cutoffHz, 0.7)), highpass(50));
  return multiply(air, burst(n, opts.at, opts.attack, opts.decay));
}

/**
 * Paper crinkles: a sheet flexing releases tiny buckling events (fibres snapping over each other).
 * Each is a ~80 us pulse into a short, bright paper response, at random times inside the span.
 */
export function crinkles(lengthSec: number, opts: {start: number; span: number; count: number; centerHz: number}, rng: Rng): Mono {
  const contacts: Contact[] = Array.from({length: opts.count}, () => ({
    at: opts.start + rng.uniform(0, opts.span),
    impulse: rng.logNormal(0.6),
    tau: rng.uniform(0.00006, 0.00014),
  }));
  const modes: Mode[] = [
    {freq: opts.centerHz * 0.6, t60: 0.008, amp: 0.6},
    {freq: opts.centerHz, t60: 0.006, amp: 1},
    {freq: opts.centerHz * 1.9, t60: 0.004, amp: 0.5},
  ];
  return modalBank(contactForce(lengthOf(lengthSec), contacts), jitterModes(modes, rng, {freq: 0.15, t60: 0.2, amp: 0.4}));
}

/** Scale a part so its peak sits at `level` x the reference part's peak (recipes balance layers this way). */
export function relativeTo(part: Mono, reference: Mono, level: number): Mono {
  return scale(part, (level * peakAbs(reference)) / Math.max(peakAbs(part), 1e-12));
}

/** Seeded small pan around a centre for desk objects (they are never all dead centre). */
export const deskPan = (rng: Rng, override: number | undefined, spread = 0.12): number => override ?? rng.uniform(-spread, spread);
