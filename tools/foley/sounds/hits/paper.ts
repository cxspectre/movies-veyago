// paper.ts — hits of the paper world that are mostly paper: tick, sticky notes, a dropped sheet.

import {SR} from '../../core/constants';
import {minJerkSpeed} from '../../core/envelope';
import {applyChain} from '../../core/filters';
import type {Rng} from '../../core/rng';
import {mixMono, zeros, type Mono} from '../../core/signal';
import type {Voice} from '../../core/voice';
import {frictionSource} from '../friction';
import {singleMove} from '../gesture';
import {airPuff, crinkles, deskPan, DESK_MODES, lengthOf, noiseBurst, PAPER_PATCH_MODES, relativeTo, struck} from '../kit';
import {GRAPHITE_ON_PAPER, PAPER_ON_DESK, SKIN_ON_PAPER} from '../materials';
import {PENCIL_BODY} from '../stroke';

/** Place a bell-shaped (min-jerk) speed move of `peak` mm/s into a speed curve over [start, start+dur). */
function addMove(speed: Mono, startSec: number, durSec: number, peak: number): Mono {
  const a = Math.round(startSec * SR);
  const b = Math.round((startSec + durSec) * SR);
  return speed.map((v, i) => (i >= a && i < b ? v + peak * minJerkSpeed((i - a) / (b - a)) : v));
}

/**
 * tick — the pencil ticking a list item: the graphite tip taps the sheet (Hertz contact ~0.35 ms into
 * the paper-on-desk patch), then draws a check: a short down-stroke and a faster up-flick that lifts
 * off while still moving (pressure released over the last 40 %).
 */
export function tick(rng: Rng, pan?: number): Voice {
  const len = 0.32;
  const n = lengthOf(len);
  const tap = struck(len, [{at: 0, impulse: 1, tau: rng.uniform(0.0003, 0.0004)}], PAPER_PATCH_MODES, rng.fork('tap'));
  const desk = struck(len, [{at: 0, impulse: 1, tau: 0.0004}], DESK_MODES, rng.fork('desk'));
  const grit = noiseBurst(len, {at: 0, attack: 0.0004, decay: 0.002, centerHz: 4500, q: 0.8}, rng.fork('grit'));
  const down = rng.uniform(0.035, 0.05);
  const up = rng.uniform(0.07, 0.1);
  const t0 = 0.006;
  const speed = addMove(addMove(zeros(n), t0, down, rng.uniform(70, 100)), t0 + down * 0.85, up, rng.uniform(150, 200));
  const liftStart = t0 + down + up * 0.45;
  const liftEnd = t0 + down + up * 0.85;
  const pressure = Float64Array.from({length: n}, (_, i) => {
    const t = i / SR;
    return t < liftStart ? 0.65 : t < liftEnd ? 0.65 * (1 - (t - liftStart) / (liftEnd - liftStart)) : 0;
  });
  const flick = applyChain(frictionSource(speed, pressure, GRAPHITE_ON_PAPER, rng.fork('flick')), PENCIL_BODY);
  const mono = mixMono(n, [
    {sig: tap},
    {sig: relativeTo(desk, tap, 0.3)},
    {sig: relativeTo(grit, tap, 0.2)},
    {sig: relativeTo(flick, tap, 0.55)},
  ]);
  return {mono, pan: deskPan(rng.fork('pan'), pan), space: 'desk', syncSample: 0};
}

/**
 * sticky_press — a thumb pressing a sticky note onto the sheet: a soft skin contact (~5 ms, so almost
 * no highs) that moves the desk, a puff of air from under the note, the adhesive strip crackling as it
 * grabs, and the thumb rolling a few millimetres.
 */
export function stickyPress(rng: Rng, pan?: number): Voice {
  const len = 0.4;
  const n = lengthOf(len);
  const contact = [{at: 0, impulse: 1, tau: rng.uniform(0.004, 0.006)}];
  const thump = struck(len, contact, DESK_MODES, rng.fork('desk'));
  const patch = struck(len, contact, PAPER_PATCH_MODES, rng.fork('patch'));
  const puff = airPuff(len, {at: 0, attack: 0.004, decay: 0.015, cutoffHz: 350}, rng.fork('puff'));
  const tack = crinkles(len, {start: 0.002, span: 0.06, count: rng.int(14, 22), centerHz: 5200}, rng.fork('tack'));
  const roll = addMove(zeros(n), 0.01, 0.12, 60);
  const rollSound = frictionSource(roll, new Float64Array(n).fill(0.8), SKIN_ON_PAPER, rng.fork('roll'));
  const mono = mixMono(n, [
    {sig: patch},
    {sig: relativeTo(thump, patch, 0.45)},
    {sig: relativeTo(puff, patch, 0.35)},
    {sig: relativeTo(tack, patch, 0.3)},
    {sig: relativeTo(rollSound, patch, 0.4)},
  ]);
  return {mono, pan: deskPan(rng.fork('pan'), pan, 0.08), space: 'desk', syncSample: 0};
}

/**
 * sticky_smooth — two fingertip swipes smoothing the note flat: skin friction on paper (soft, breathy,
 * low), with the note's curled edge crinkling as it is flattened at the start.
 */
export function stickySmooth(rng: Rng, pan?: number): Voice {
  const first = rng.uniform(0.2, 0.25);
  const second = rng.uniform(0.17, 0.22);
  const gap = rng.uniform(0.03, 0.06);
  const len = first + gap + second + 0.15;
  const n = lengthOf(len);
  const speed = addMove(addMove(zeros(n), 0, first, rng.uniform(220, 280)), first + gap, second, rng.uniform(200, 260));
  const swipe = frictionSource(speed, new Float64Array(n).fill(0.7), SKIN_ON_PAPER, rng.fork('skin'));
  const curl = crinkles(len, {start: 0.01, span: 0.06, count: rng.int(3, 5), centerHz: 2400}, rng.fork('curl'));
  const mono = mixMono(n, [{sig: swipe}, {sig: relativeTo(curl, swipe, 0.25)}]);
  return {mono, pan: deskPan(rng.fork('pan'), pan, 0.08), space: 'desk', syncSample: 0};
}

/**
 * paper_drop — a sheet dropped flat onto the desk. It falls on an air cushion (a faint flutter), the
 * cushion is squeezed out at landing (a low "whump", the defining paper-drop sound), the sheet slaps
 * the desk softly (long ~8 ms contact over a large area), buckles (crinkles) and skids a few mm.
 */
export function paperDrop(rng: Rng, pan?: number): Voice {
  const land = rng.uniform(0.06, 0.08);
  const len = land + 0.45;
  const n = lengthOf(len);
  const fall = airPuff(len, {at: 0, attack: land * 0.8, decay: 0.015, cutoffHz: 900}, rng.fork('fall'));
  const whump = airPuff(len, {at: land - 0.01, attack: 0.012, decay: 0.035, cutoffHz: 300}, rng.fork('whump'));
  const slap = struck(len, [{at: land, impulse: 1, tau: rng.uniform(0.007, 0.009)}], DESK_MODES, rng.fork('slap'));
  const buckle = crinkles(len, {start: land, span: 0.08, count: rng.int(6, 12), centerHz: 2200}, rng.fork('buckle'));
  const skidMove = singleMove(0.12, rng.uniform(4, 8));
  const skidSpeed = Float64Array.from({length: n}, (_, i) => skidMove[i - Math.round((land + 0.005) * SR)] ?? 0);
  const skid = frictionSource(skidSpeed, new Float64Array(n).fill(0.5), PAPER_ON_DESK, rng.fork('skid'));
  const mono = mixMono(n, [
    {sig: whump},
    {sig: relativeTo(slap, whump, 0.7)},
    {sig: relativeTo(fall, whump, 0.12)},
    {sig: relativeTo(buckle, whump, 0.5)},
    {sig: relativeTo(skid, whump, 0.2)},
  ]);
  return {mono, pan: deskPan(rng.fork('pan'), pan, 0.2), space: 'desk', syncSample: Math.round(land * SR)};
}
