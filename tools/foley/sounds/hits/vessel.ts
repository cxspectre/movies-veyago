// vessel.ts — objects with a shell: the coffee mug, the phone, the pen cap.

import {SR} from '../../core/constants';
import type {Contact, Mode} from '../../core/modal';
import {doublets, modesFromRatios, SHELL_RATIOS} from '../../core/modal';
import type {Rng} from '../../core/rng';
import {mixMono} from '../../core/signal';
import type {Voice} from '../../core/voice';
import {frictionSource} from '../friction';
import {airPuff, crinkles, deskPan, DESK_MODES, lengthOf, noiseBurst, relativeTo, struck} from '../kit';
import {PLASTIC_ON_PLASTIC} from '../materials';

/**
 * A 300 ml stoneware mug with coffee: ring modes (n = 2..5) of a short thick cylinder, lowered and
 * damped by the liquid (f(2,0) ~ 1.05 kHz, T60 0.35 s down to 0.07 s), each split into a doublet by the
 * handle; plus the thick foot ring (~420 Hz, very short).
 */
function mugModes(rng: Rng): Mode[] {
  const ring = modesFromRatios(rng.uniform(1000, 1100), SHELL_RATIOS.slice(0, 4), [0.35, 0.22, 0.12, 0.07], [1, 0.55, 0.3, 0.15]);
  return [...doublets(ring, 0.006), {freq: rng.uniform(400, 440), t60: 0.05, amp: 0.8}];
}

/**
 * cup_down — the mug is set down, not dropped: the heel of the foot ring touches first, the whole base
 * lands 22-40 ms later (sync point). Stoneware on wood through one sheet: the wood and the paper
 * lengthen the contact to ~0.3-0.4 ms, which rounds the click off the ring without dulling it. The desk carries the weight; the coffee moves a little; the paper crinkles.
 */
export function cupDown(rng: Rng, pan?: number): Voice {
  const base = rng.uniform(0.022, 0.04);
  const contacts: Contact[] = [
    {at: 0, impulse: 0.25, tau: 0.00025},
    {at: base, impulse: 1, tau: rng.uniform(0.0003, 0.0004)},
  ];
  const len = base + 0.75;
  const n = lengthOf(len);
  const ceramic = struck(len, contacts, mugModes(rng.fork('mug')), rng.fork('ring'));
  const desk = struck(len, contacts, DESK_MODES, rng.fork('desk'));
  const slosh = noiseBurst(len, {at: base + 0.01, attack: 0.03, decay: 0.08, centerHz: 450, q: 0.8}, rng.fork('slosh'));
  const paper = crinkles(len, {start: base, span: 0.012, count: rng.int(2, 3), centerHz: 2600}, rng.fork('paper'));
  const grit = noiseBurst(len, {at: base, attack: 0.0005, decay: 0.0015, centerHz: 3500, q: 0.7}, rng.fork('grit'));
  const mono = mixMono(n, [
    {sig: ceramic},
    {sig: relativeTo(desk, ceramic, 0.55)},
    {sig: relativeTo(slosh, ceramic, 0.04)},
    {sig: relativeTo(paper, ceramic, 0.08)},
    {sig: relativeTo(grit, ceramic, 0.08)},
  ]);
  return {mono, pan: deskPan(rng.fork('pan'), pan, 0.25), space: 'desk', syncSample: Math.round(base * SR)};
}

/** A 190 g glass-and-aluminium slab: stiff, small, high body modes. */
const PHONE_MODES: readonly Mode[] = [
  {freq: 1850, t60: 0.03, amp: 1},
  {freq: 3400, t60: 0.02, amp: 0.7},
  {freq: 5200, t60: 0.015, amp: 0.45},
  {freq: 7400, t60: 0.01, amp: 0.3},
];

/**
 * phone_down — laid down on the sheet: the aluminium corner touches first (small, stiff contact:
 * the faint "tk" of glass and metal), then the flat back lands on paper over wood (large area, ~1.8 ms
 * contact: a soft, weighty "thup", sync point), squeezing a little air out from underneath.
 */
export function phoneDown(rng: Rng, pan?: number): Voice {
  const flat = rng.uniform(0.025, 0.035);
  const contacts: Contact[] = [
    {at: 0, impulse: 0.45, tau: 0.0004},
    {at: flat, impulse: 1, tau: rng.uniform(0.0016, 0.002)},
  ];
  const len = flat + 0.5;
  const n = lengthOf(len);
  const desk = struck(len, contacts, DESK_MODES, rng.fork('desk'));
  const body = struck(len, contacts, PHONE_MODES, rng.fork('body'));
  const air = airPuff(len, {at: flat - 0.008, attack: 0.008, decay: 0.02, cutoffHz: 500}, rng.fork('air'));
  const paper = crinkles(len, {start: flat, span: 0.02, count: 2, centerHz: 2200}, rng.fork('paper'));
  const mono = mixMono(n, [
    {sig: desk},
    {sig: relativeTo(body, desk, 0.6)},
    {sig: relativeTo(air, desk, 0.15)},
    {sig: relativeTo(paper, desk, 0.06)},
  ]);
  return {mono, pan: deskPan(rng.fork('pan'), pan, 0.2), space: 'desk', syncSample: Math.round(flat * SR)};
}

/**
 * pen_cap — the cap pushed onto a fine pen: 40-50 ms of plastic sliding over plastic (accelerating),
 * then the snap fit: the detent ridge jumps (first click) and the cap seats 4-7 ms later (second,
 * stronger click, sync point). Polypropylene is lossy: cap ring modes ~3.1 kHz up, barrel 1.35 kHz up.
 */
export function penCap(rng: Rng, pan?: number): Voice {
  const slide = rng.uniform(0.04, 0.05);
  const seat = slide + rng.uniform(0.004, 0.007);
  const len = seat + 0.25;
  const n = lengthOf(len);
  const speed = Float64Array.from({length: n}, (_, i) => (i < slide * SR ? 20 + (100 * i) / (slide * SR) : 0));
  const scrape = frictionSource(speed, new Float64Array(n).fill(0.6), PLASTIC_ON_PLASTIC, rng.fork('scrape'));
  const contacts: Contact[] = [
    {at: slide, impulse: 0.6, tau: 0.00007},
    {at: seat, impulse: 1, tau: 0.00009},
  ];
  const capModes = modesFromRatios(rng.uniform(3000, 3300), SHELL_RATIOS.slice(0, 3), [0.03, 0.02, 0.012], [1, 0.6, 0.3]);
  const barrel: Mode[] = [
    {freq: 1350, t60: 0.04, amp: 0.6},
    {freq: 2450, t60: 0.03, amp: 0.5},
    {freq: 4100, t60: 0.02, amp: 0.35},
  ];
  const click = struck(len, contacts, [...capModes, ...barrel], rng.fork('click'));
  const mono = mixMono(n, [{sig: click}, {sig: relativeTo(scrape, click, 0.12)}]);
  return {mono, pan: deskPan(rng.fork('pan'), pan), space: 'desk', syncSample: Math.round(seat * SR)};
}
