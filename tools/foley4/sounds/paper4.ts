// paper4.ts — the v4 paper families: fold, crumple, scissors.

import {SR} from '../../foley/core/constants';
import {applyBiquad, highpass, lowpass} from '../../foley/core/filters';
import {white} from '../../foley/core/noise';
import type {Rng} from '../../foley/core/rng';
import {mixMono, multiply, zeros, type Mono} from '../../foley/core/signal';
import type {Voice} from '../../foley/core/voice';
import {frictionSource} from '../../foley/sounds/friction';
import {airPuff, deskPan, DESK_MODES, lengthOf, PAPER_PATCH_MODES, relativeTo, struck} from '../../foley/sounds/kit';
import {SKIN_ON_PAPER} from '../../foley/sounds/materials';
import {addMove, CARD_MODES, eventTrain, fractures, param, STEEL_ON_STEEL, type Fracture} from './kit4';

export const FOLD_DEFAULT_SEC = 0.6;
const FOLD_PANEL_SEC = 0.55;
const MAX_PANELS = 8;

/** One panel rotating up on its crease from `start` for `dur`, ending in its snap. Returns its layers. */
function foldPanel(len: number, start: number, dur: number, weight: number, rng: Rng): {snap: Mono; crease: Mono; air: Mono} {
  const n = lengthOf(len);
  const end = start + dur;
  // the panel's angular speed is a min-jerk bell; the air it pushes is low-passed noise shaped by speed^1.5
  const speed = addMove(zeros(n), start, dur, 1);
  const airEnv = speed.map((v) => Math.pow(v, 1.5));
  const air = multiply(applyBiquad(applyBiquad(white(n, rng.fork('air')), lowpass(rng.uniform(380, 520), 0.7)), highpass(60)), airEnv);
  // the crease buckles fibre by fibre, more densely as the bend tightens towards the end of the fold
  const crease = fractures(len, eventTrain(len, {
    rate: (t) => (t >= start && t < end ? 30 + 260 * Math.pow((t - start) / dur, 1.6) : 0),
    centerHz: (t) => 1500 + 1600 * Math.min(1, Math.max(0, (t - start) / dur)),
    size: () => 1, spreadOct: 0.6, alpha: 1.8, cap: 12, tau: [0.00006, 0.00016],
  }, rng.fork('crease')), rng.fork('creaseModes'));
  // the snap: the panel reaches its stop (the tab locks, the card straightens): a soft ~1.5 ms card contact
  const contact = [{at: end, impulse: weight, tau: rng.uniform(0.0012, 0.0018)}];
  const card = struck(len, contact, CARD_MODES, rng.fork('card'));
  const patch = struck(len, contact, PAPER_PATCH_MODES, rng.fork('patch'));
  const snap = mixMono(n, [{sig: card}, {sig: relativeTo(patch, card, 0.45)}]);
  return {snap, crease, air};
}

/**
 * fold — paper lifting into 2.5D on a crease: the panel's air push, the crease buckling ever faster, and a
 * soft card snap when it reaches its stop. `dur` is the fold; longer folds (over ~1.2 s) are several panels
 * rising one after another (a pop-up), the last snapping at `dur`. Sync = the start of the motion.
 */
export function fold(rng: Rng, pan: number | undefined, durIn?: number): Voice {
  const dur = param(durIn, FOLD_DEFAULT_SEC, 0.2, 8);
  const panels = dur <= 1.2 ? 1 : Math.min(MAX_PANELS, Math.round(dur / FOLD_PANEL_SEC));
  const len = dur + 0.35;
  const n = lengthOf(len);
  const layers = Array.from({length: panels}, (_, k) => {
    const pr = rng.fork(`panel${k}`);
    const pDur = panels === 1 ? dur : Math.min(dur, pr.uniform(0.38, 0.6));
    const pEnd = panels === 1 ? dur : (dur * (k + 1)) / panels - pr.uniform(0, 0.06);
    return foldPanel(len, Math.max(0, pEnd - pDur), pDur, pr.uniform(0.75, 1.1), pr);
  });
  const sum = (key: 'snap' | 'crease' | 'air'): Mono => mixMono(n, layers.map((l) => ({sig: l[key]})));
  const snap = sum('snap');
  const desk = struck(len, [{at: dur, impulse: 1, tau: 0.002}], DESK_MODES, rng.fork('desk'));
  const mono = mixMono(n, [
    {sig: snap},
    {sig: relativeTo(sum('crease'), snap, 0.4)},
    {sig: relativeTo(sum('air'), snap, 0.22)},
    {sig: relativeTo(desk, snap, 0.18)},
  ]);
  return {mono, pan: deskPan(rng.fork('pan'), pan, 0.15), space: 'desk', syncSample: 0};
}

export const CRUMPLE_DEFAULT_SEC = 1.2;

/** Hands squeezing: 2-4 bell-shaped squeezes across the crush, the later ones shorter and harder. */
function squeezeCurve(n: number, dur: number, rng: Rng): Mono {
  const count = Math.max(2, Math.min(6, Math.round(dur / 0.45)));
  return Array.from({length: count}, (_, k) => k).reduce((curve, k) => {
    const centre = ((k + 0.55) / count) * dur;
    const width = (dur / count) * rng.uniform(1.1, 1.5);
    return addMove(curve, Math.max(0, centre - width / 2), width, 0.6 + (0.4 * (k + 1)) / count);
  }, zeros(n));
}

/**
 * crumple — a sheet crushed into a ball. Crumpling paper emits discrete clicks with power-law energies
 * (Houle and Sethna 1996): a Poisson stream whose rate follows the squeezing hands, each click a short
 * contact into a facet whose pitch rises as the ball shrinks and stiffens. Under it, the palms' skin
 * friction and the air pockets squeezed out. Sync = the first squeeze.
 */
export function crumple(rng: Rng, pan: number | undefined, durIn?: number): Voice {
  const dur = param(durIn, CRUMPLE_DEFAULT_SEC, 0.4, 6);
  const len = dur + 0.3;
  const n = lengthOf(len);
  const squeeze = squeezeCurve(n, dur, rng.fork('squeeze'));
  const at = (t: number): number => squeeze[Math.min(n - 1, Math.round(t * SR))] ?? 0;
  const events: Fracture[] = eventTrain(len, {
    rate: (t) => 1100 * Math.pow(at(t), 1.3) + (t < dur + 0.15 ? 8 : 0),
    centerHz: (t) => 1300 * (1 + 2.2 * Math.min(1, t / dur)),
    size: (t) => 0.4 + 0.6 * at(t), spreadOct: 0.8, alpha: 1.5, cap: 18, tau: [0.00005, 0.00018],
  }, rng.fork('clicks'));
  const clicks = fractures(len, events, rng.fork('facets'));
  const palms = frictionSource(squeeze.map((v) => 160 * v), new Float64Array(n).fill(0.7), SKIN_ON_PAPER, rng.fork('palms'));
  const pockets = mixMono(n, Array.from({length: 3}, (_, k) => ({
    sig: airPuff(len, {at: ((k + 0.6) / 3) * dur, attack: 0.03, decay: 0.05, cutoffHz: 420}, rng.fork(`pocket${k}`)),
  })));
  const mono = mixMono(n, [{sig: clicks}, {sig: relativeTo(palms, clicks, 0.3)}, {sig: relativeTo(pockets, clicks, 0.12)}]);
  return {mono, pan: deskPan(rng.fork('pan'), pan, 0.1), space: 'desk', syncSample: 0};
}

const SNIP_CLOSE_SEC: [number, number] = [0.09, 0.13];
const SNIP_PERIOD_SEC: [number, number] = [0.33, 0.4];

/** Steel blade (a free-free beam, ~2.1 kHz): what rings, briefly, under every snip. */
const BLADE_RATIOS = [1, 2.757, 5.404] as const;

/**
 * scissors — steel blades through paper. Each snip: the blades close in a ~0.1 s min-jerk; the cutting
 * point shears fibres in a stream of fracture events whose rate follows the closing speed; the pivot rubs
 * (steel on steel); the blades ring faintly; the heels meet at the end (a soft 0.35 ms contact, the "snip").
 * One snip by default (a beat per snip); with `dur`, a run of snips every ~0.37 s. Sync = the first closure.
 */
export function scissors(rng: Rng, pan: number | undefined, durIn?: number): Voice {
  const snips = durIn === undefined ? 1 : Math.max(1, Math.min(8, Math.round(param(durIn, 0.4, 0.2, 3) / 0.37)));
  const lead = 0.03;
  const closes = Array.from({length: snips}, (_, k) => rng.fork(`snip${k}`)).map((r, k) => ({r, close: r.uniform(...SNIP_CLOSE_SEC), period: k === 0 ? 0 : r.uniform(...SNIP_PERIOD_SEC)}));
  const starts = closes.reduce<number[]>((acc, c, k) => [...acc, k === 0 ? lead : (acc[k - 1] ?? lead) + c.period], []);
  const ends = closes.map((c, k) => (starts[k] ?? lead) + c.close);
  const len = (ends[ends.length - 1] ?? lead) + 0.35;
  const n = lengthOf(len);
  const closing = closes.reduce((curve, c, k) => addMove(curve, starts[k] ?? lead, c.close, 1), zeros(n));
  const opening = closes.reduce((curve, _c, k) => {
    const next = closes[k + 1];
    return next ? addMove(curve, (ends[k] ?? 0) + 0.04, next.period * 0.5, 0.5) : curve;
  }, zeros(n));
  const atClose = (t: number): number => closing[Math.min(n - 1, Math.round(t * SR))] ?? 0;
  const shear = fractures(len, eventTrain(len, {
    rate: (t) => 900 * atClose(t), centerHz: () => 4200, size: () => 1, spreadOct: 0.5, alpha: 2, cap: 8, tau: [0.00005, 0.00012],
  }, rng.fork('shear')), rng.fork('shearModes'));
  const pivotSpeed = closing.map((v, i) => 40 * v + 25 * (opening[i] ?? 0));
  const pivot = frictionSource(pivotSpeed, new Float64Array(n).fill(0.6), STEEL_ON_STEEL, rng.fork('pivot'));
  const heels = ends.map((at, k) => ({at, impulse: closes[k]?.r.uniform(0.85, 1.05) ?? 1, tau: rng.uniform(0.0003, 0.0004)}));
  const f0 = rng.uniform(2000, 2250);
  const bladeModes = BLADE_RATIOS.map((ratio, i) => ({freq: f0 * ratio, t60: [0.12, 0.08, 0.05][i] ?? 0.05, amp: [1, 0.5, 0.25][i] ?? 0.2}));
  const blades = struck(len, heels, bladeModes, rng.fork('blades'));
  const patch = struck(len, heels.map((h) => ({...h, impulse: h.impulse * 0.6, tau: 0.0006})), PAPER_PATCH_MODES, rng.fork('patch'));
  const mono = mixMono(n, [
    {sig: shear},
    {sig: relativeTo(blades, shear, 0.32)},
    {sig: relativeTo(patch, shear, 0.35)},
    {sig: relativeTo(pivot, shear, 0.18)},
  ]);
  return {mono, pan: deskPan(rng.fork('pan'), pan, 0.12), space: 'desk', syncSample: Math.round((ends[0] ?? lead) * SR)};
}

