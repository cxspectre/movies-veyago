// wood.ts — the pencil and the ruler meeting the desk.
//
// A cedar pencil is a free-free beam: L = 175 mm, r = 3.5 mm, E = 8 GPa, rho = 400 kg/m^3 gives
// f1 = (22.37 / 2 pi L^2) sqrt(E r^2 / 4 rho) ~ 910 Hz, then x2.757, x5.404, x8.933 (beam ratios).
// Wood is lossy (T60 tens of ms). The desk adds the weight underneath.

import type {Contact, Mode} from '../../core/modal';
import {BEAM_RATIOS, modesFromRatios} from '../../core/modal';
import {applyBiquad, bandpass} from '../../core/filters';
import {burst} from '../../core/envelope';
import {white} from '../../core/noise';
import type {Rng} from '../../core/rng';
import {mixMono, multiply, type Mono} from '../../core/signal';
import type {Voice} from '../../core/voice';
import {SR} from '../../core/constants';
import {deskPan, DESK_MODES, lengthOf, noiseBurst, relativeTo, struck} from '../kit';

const PENCIL_F1 = 910;
const PENCIL_T60 = [0.06, 0.04, 0.025, 0.015, 0.01];
const PENCIL_AMPS = [1, 0.7, 0.45, 0.25, 0.12];

const pencilModes = (f1: number, damping = 1): Mode[] =>
  modesFromRatios(f1, BEAM_RATIOS, PENCIL_T60.map((t) => t * damping), PENCIL_AMPS);

/** Roll of a hexagonal pencil: each facet edge lands a little later and softer than the one before. */
function rollContacts(start: number, rng: Rng): Contact[] {
  const facets = rng.int(3, 5);
  const first = rng.uniform(0.05, 0.065);
  return Array.from({length: facets}, (_, k) => {
    const at = start + first * ((Math.pow(1.35, k + 1) - 1) / 0.35);
    return {at, impulse: 0.35 * Math.pow(0.55, k), tau: 0.0003};
  });
}

/** Low rolling rumble between facet landings (the pencil's flats rubbing the paper). */
function rollRumble(lengthSec: number, from: number, to: number, rng: Rng): Mono {
  const n = lengthOf(lengthSec);
  const env = burst(n, from, Math.max(0.005, (to - from) * 0.3), (to - from) * 0.4);
  return multiply(applyBiquad(white(n, rng), bandpass(600, 0.8)), env);
}

/**
 * pencil_down — set down with a little drop: one end lands, the other 45-70 ms later, then it rolls
 * over 3-5 facets with growing intervals (rolling friction slows it) and rocks back once to settle.
 */
export function pencilDown(rng: Rng, pan?: number): Voice {
  const second = rng.uniform(0.045, 0.07);
  const roll = rollContacts(second, rng.fork('roll'));
  const last = roll[roll.length - 1]?.at ?? second;
  const contacts: Contact[] = [
    {at: 0, impulse: 0.6, tau: 0.00025},
    {at: second, impulse: 0.85, tau: 0.00025},
    ...roll,
    {at: last + 0.025, impulse: 0.05, tau: 0.0003},
  ];
  const len = last + 0.35;
  const n = lengthOf(len);
  const wood = struck(len, contacts, pencilModes(PENCIL_F1 * rng.uniform(0.96, 1.04)), rng.fork('wood'));
  const desk = struck(len, contacts, DESK_MODES, rng.fork('desk'));
  const rumble = rollRumble(len, second, last, rng.fork('rumble'));
  const mono = mixMono(n, [{sig: wood}, {sig: relativeTo(desk, wood, 0.3)}, {sig: relativeTo(rumble, wood, 0.04)}]);
  return {mono, pan: deskPan(rng.fork('pan'), pan), space: 'desk', syncSample: 0};
}

/**
 * pencil_click — the last sound of the film: the pencil put down with intent and held. The tip end
 * touches, 12-16 ms later the body lands (the decisive click, sync point), the fingertip on it damps
 * the ring (shorter T60), the desk gives it weight. No roll, one tiny settle.
 */
export function pencilClick(rng: Rng, pan?: number): Voice {
  const main = rng.uniform(0.012, 0.016);
  const contacts: Contact[] = [
    {at: 0, impulse: 0.45, tau: 0.00018},
    {at: main, impulse: 1, tau: 0.0002},
    {at: main + rng.uniform(0.045, 0.06), impulse: 0.04, tau: 0.0003},
  ];
  const len = 0.6;
  const n = lengthOf(len);
  const wood = struck(len, contacts, pencilModes(rng.uniform(930, 970), 0.8), rng.fork('wood'));
  const desk = struck(len, contacts, DESK_MODES, rng.fork('desk'));
  const grit = noiseBurst(len, {at: main, attack: 0.0003, decay: 0.0012, centerHz: 6000, q: 0.7}, rng.fork('grit'));
  const mono = mixMono(n, [{sig: wood}, {sig: relativeTo(desk, wood, 0.35)}, {sig: relativeTo(grit, wood, 0.12)}]);
  return {mono, pan: deskPan(rng.fork('pan'), pan, 0.06), space: 'desk', syncSample: Math.round(main * SR)};
}

/** A 30 cm acrylic ruler held at one end and tapped down: plate-like modes 0.6-5 kHz, a damped cantilever thwack ~105 Hz. */
const RULER_MODES: readonly Mode[] = [
  {freq: 105, t60: 0.08, amp: 0.3},
  {freq: 620, t60: 0.05, amp: 0.7},
  {freq: 1340, t60: 0.04, amp: 1},
  {freq: 2280, t60: 0.03, amp: 0.8},
  {freq: 3650, t60: 0.02, amp: 0.5},
  {freq: 5200, t60: 0.012, amp: 0.3},
];

/** ruler_tap — the ruler's end tapped on the sheet, with one small rattle as it rebounds. */
export function rulerTap(rng: Rng, pan?: number): Voice {
  const contacts: Contact[] = [
    {at: 0, impulse: 1, tau: 0.00022},
    {at: rng.uniform(0.01, 0.016), impulse: 0.2, tau: 0.00025},
  ];
  const len = 0.45;
  const n = lengthOf(len);
  const ruler = struck(len, contacts, RULER_MODES, rng.fork('ruler'));
  const desk = struck(len, contacts, DESK_MODES, rng.fork('desk'));
  const mono = mixMono(n, [{sig: ruler}, {sig: relativeTo(desk, ruler, 0.4)}]);
  return {mono, pan: deskPan(rng.fork('pan'), pan), space: 'desk', syncSample: 0};
}
