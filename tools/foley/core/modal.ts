// modal.ts — contact forces and modal resonators: the physics core of every impact.
//
// An impact is (1) a contact force pulse whose duration is set by the stiffness of the two surfaces
// (Hertz: a hard small sphere on steel ~ 50 us; graphite on paper ~ 300 us; a phone on paper ~ 2 ms),
// driving (2) a bank of damped modes of the struck bodies. A finite contact time is what keeps onsets
// natural: the excitation spectrum rolls off above ~1.5/tau, so nothing can produce a digital click.

import {LN_1000, MAX_MODE_HZ, SR, TWO_PI} from './constants';
import type {Rng} from './rng';
import {zeros, type Mono} from './signal';

export type Mode = {readonly freq: number; readonly t60: number; readonly amp: number};
export type Contact = {readonly at: number; readonly impulse: number; readonly tau: number};

/** Hertzian contact force shape sin^1.5 over the contact time, normalised to unit impulse (area 1). */
export function hertzPulse(tauSec: number): Mono {
  const n = Math.max(2, Math.round(tauSec * SR));
  const raw = Array.from({length: n}, (_, i) => Math.pow(Math.sin((Math.PI * (i + 0.5)) / n), 1.5));
  const area = raw.reduce((s, v) => s + v, 0);
  return Float64Array.from(raw, (v) => v / area);
}

/** The force signal of a sequence of contacts (bounces, double hits, facet landings). */
export function contactForce(length: number, contacts: readonly Contact[]): Mono {
  const out = zeros(length);
  for (const c of contacts) {
    const pulse = hertzPulse(c.tau);
    const start = Math.round(c.at * SR);
    for (let i = 0; i < pulse.length; i++) {
      const j = start + i;
      if (j >= 0 && j < out.length) out[j] = (out[j] ?? 0) + (pulse[i] ?? 0) * c.impulse;
    }
  }
  return out;
}

/**
 * Drive a bank of two-pole resonators with a force signal. Each mode's impulse response is
 * amp * r^n * sin(w (n+1)): unit impulse in gives a sinusoid of amplitude `amp` decaying to -60 dB in t60.
 */
export function modalBank(force: Mono, modes: readonly Mode[]): Mono {
  const out = zeros(force.length);
  for (const m of modes) {
    if (m.freq <= 0 || m.freq >= MAX_MODE_HZ || m.amp === 0) continue;
    const w = (TWO_PI * m.freq) / SR;
    const r = Math.exp(-LN_1000 / Math.max(m.t60 * SR, 1));
    const c1 = 2 * r * Math.cos(w);
    const c2 = -r * r;
    const g = m.amp * Math.sin(w);
    let y1 = 0;
    let y2 = 0;
    for (let i = 0; i < force.length; i++) {
      const y = c1 * y1 + c2 * y2 + g * (force[i] ?? 0);
      out[i] = (out[i] ?? 0) + y;
      y2 = y1;
      y1 = y;
    }
  }
  return out;
}

/** Modes from a ratio series (e.g. free-free beam 1 : 2.757 : 5.404 : 8.933). */
export function modesFromRatios(f0: number, ratios: readonly number[], t60s: readonly number[], amps: readonly number[]): Mode[] {
  return ratios.map((ratio, i) => ({freq: f0 * ratio, t60: t60s[i] ?? t60s[t60s.length - 1] ?? 0.05, amp: amps[i] ?? 0}));
}

/** Free-free (unsupported) beam bending modes: pencils, rulers, keys. */
export const BEAM_RATIOS = [1, 2.757, 5.404, 8.933, 13.344] as const;
/** Ring/shell (n, 0) modes of a thin cylinder, n = 2..6: mugs, pen caps. Ratio n(n^2-1)/sqrt(n^2+1) normalised to n = 2. */
export const SHELL_RATIOS = [1, 2.828, 5.423, 8.771, 12.86] as const;
/** Free thin disc (coins): (2,0), (0,1), (3,0), (1,1), (4,0). */
export const DISC_RATIOS = [1, 1.73, 2.33, 3.91, 4.11] as const;

export type ModeJitter = {readonly freq: number; readonly t60: number; readonly amp: number};
const DEFAULT_JITTER: ModeJitter = {freq: 0.015, t60: 0.12, amp: 0.3};

/**
 * Per-take variation: object size tolerance shifts frequencies a little, mounting changes damping,
 * and the strike position changes which modes are excited (|sin| of a random node position).
 */
export function jitterModes(modes: readonly Mode[], rng: Rng, jitter: ModeJitter = DEFAULT_JITTER): Mode[] {
  const shift = 1 + rng.uniform(-jitter.freq, jitter.freq);
  const position = rng.uniform(0.15, 0.85);
  return modes.map((m, i) => ({
    freq: m.freq * shift * (1 + rng.uniform(-0.3, 0.3) * jitter.freq),
    t60: m.t60 * (1 + rng.uniform(-jitter.t60, jitter.t60)),
    amp: m.amp * (1 - jitter.amp + jitter.amp * Math.abs(Math.sin(Math.PI * (i + 1) * position + 0.4))),
  }));
}

/** Split each mode into a close doublet (a handle or seam breaks the symmetry of a ring): slow, natural beating. */
export function doublets(modes: readonly Mode[], split: number): Mode[] {
  return modes.flatMap((m) => [
    {...m, freq: m.freq * (1 - split / 2), amp: m.amp * 0.55},
    {...m, freq: m.freq * (1 + split / 2), amp: m.amp * 0.45},
  ]);
}
