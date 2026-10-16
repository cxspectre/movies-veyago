// desk4.ts — the v4 desk and board families: stamp, pin, string, padlock, odometer.

import {SR} from '../../foley/core/constants';
import type {Rng} from '../../foley/core/rng';
import {mixMono, smoothstep, zeros, type Mono} from '../../foley/core/signal';
import type {Voice} from '../../foley/core/voice';
import {contactForce, modalBank, type Contact, type Mode} from '../../foley/core/modal';
import {frictionSource} from '../../foley/sounds/friction';
import {crinkles, deskPan, DESK_MODES, lengthOf, PAPER_PATCH_MODES, relativeTo, struck} from '../../foley/sounds/kit';
import {PLASTIC_ON_PLASTIC} from '../../foley/sounds/materials';
import {
  addMove, CARD_MODES, CORK_MODES, curveOf, eventTrain, fractures, glideBank, HOUSING_MODES, KNOB_MODES, LOCK_BODY_MODES,
  param, STEEL_ON_STEEL, THREAD_ON_FINGERS, WHEEL_MODES, type Partial,
} from './kit4';

/** Small cavities in the inked die collapsing: short damped resonances whose pitch rises as each one shrinks. */
function squelch(len: number, start: number, span: number, count: number, rng: Rng): Mono {
  const n = lengthOf(len);
  const parts = Array.from({length: count}, (_, k) => {
    const r = rng.fork(`cavity${k}`);
    const at = start + r.uniform(0, span);
    const f = r.uniform(1600, 3400);
    const force = contactForce(n, [{at, impulse: r.logNormal(0.4), tau: r.uniform(0.0003, 0.0006)}]);
    const f0 = curveOf(n, (t) => (t < at ? f : f * (1 + 0.25 * (1 - Math.exp(-(t - at) / 0.004)))));
    return glideBank(force, f0, [{ratio: 1, t60: r.uniform(0.006, 0.01), amp: 1}]);
  });
  return mixMono(n, parts.map((sig) => ({sig})));
}

/**
 * stamp — a rubber stamp pressed onto card on the desk. Rubber is compliant: a long (~5 ms) contact, so the
 * thud is all desk and card, no highs; the die rocks flat a few ms later; the ink film and the air in the
 * engraving squelch as it compresses; after a short hold the stamp lifts: the ink's tack lets go in a quick
 * crackle and a small suction pop. Sync = the first contact.
 */
export function stamp(rng: Rng, pan?: number): Voice {
  const hold = rng.uniform(0.14, 0.22);
  const len = hold + 0.4;
  const n = lengthOf(len);
  const t0 = 0.004;
  const contacts: Contact[] = [
    {at: t0, impulse: 1, tau: rng.uniform(0.0045, 0.0055)},
    {at: t0 + rng.uniform(0.006, 0.01), impulse: rng.uniform(0.25, 0.4), tau: 0.003},
  ];
  const desk = struck(len, contacts, DESK_MODES, rng.fork('desk'));
  const card = struck(len, contacts, CARD_MODES, rng.fork('card'));
  const knob = struck(len, [{at: t0, impulse: 1, tau: 0.0015}], KNOB_MODES, rng.fork('knob'));
  const ink = squelch(len, t0 + 0.004, 0.035, rng.int(4, 7), rng.fork('ink'));
  const lift = t0 + hold;
  const tack = crinkles(len, {start: lift, span: 0.025, count: rng.int(8, 14), centerHz: 2000}, rng.fork('tack'));
  const popForce = contactForce(n, [{at: lift + 0.012, impulse: 1, tau: 0.0006}]);
  const pop = glideBank(popForce, curveOf(n, (t) => 700 + 260 * smoothstep((t - lift - 0.012) / 0.015)), [{ratio: 1, t60: 0.02, amp: 1}]);
  const mono = mixMono(n, [
    {sig: desk},
    {sig: relativeTo(card, desk, 0.6)},
    {sig: relativeTo(knob, desk, 0.12)},
    {sig: relativeTo(ink, desk, 0.16)},
    {sig: relativeTo(tack, desk, 0.22)},
    {sig: relativeTo(pop, desk, 0.18)},
  ]);
  return {mono, pan: deskPan(rng.fork('pan'), pan, 0.12), space: 'desk', syncSample: Math.round(t0 * SR)};
}

const PIN_HEAD_MODES: readonly Mode[] = [
  {freq: 3200, t60: 0.01, amp: 1},
  {freq: 5400, t60: 0.007, amp: 0.5},
];

/** One pin: thumb on the head, the point through the paper, into the cork, the head seats. Seat at `seat`. */
function onePin(len: number, seat: number, rng: Rng): Mono {
  const n = lengthOf(len);
  const drive = rng.uniform(0.04, 0.06);
  const touch = seat - drive - 0.012;
  const thumb = struck(len, [{at: touch, impulse: 0.4, tau: rng.uniform(0.003, 0.004)}], CORK_MODES, rng.fork('thumb'));
  const pierce = crinkles(len, {start: touch + 0.01, span: 0.004, count: rng.int(3, 5), centerHz: 4200}, rng.fork('pierce'));
  const cells = fractures(len, eventTrain(len, {
    rate: (t) => (t > seat - drive && t < seat ? 1500 * (1 - (t - (seat - drive)) / drive) : 0),
    centerHz: () => 1400, size: () => 1, spreadOct: 0.6, alpha: 2.2, cap: 6, tau: [0.0001, 0.0003],
  }, rng.fork('cells')), rng.fork('cellModes'));
  const seatContact = [{at: seat, impulse: 1, tau: rng.uniform(0.0008, 0.0011)}];
  const board = struck(len, seatContact, CORK_MODES, rng.fork('board'));
  const patch = struck(len, seatContact, PAPER_PATCH_MODES, rng.fork('patch'));
  const head = struck(len, seatContact, PIN_HEAD_MODES, rng.fork('head'));
  return mixMono(n, [
    {sig: board},
    {sig: relativeTo(patch, board, 0.5)},
    {sig: relativeTo(head, board, 0.15)},
    {sig: relativeTo(cells, board, 0.4)},
    {sig: relativeTo(pierce, board, 0.18)},
    {sig: relativeTo(thumb, board, 0.25)},
  ]);
}

/**
 * pin — a push pin pressed through a card into cork: the thumb meets the head, the point pierces the paper,
 * cork cells collapse in a short decelerating crunch, the plastic head seats against the card with a damped
 * low "tok". With `dur`, a row of pins (one every ~0.25 s). Sync = the first seat.
 */
export function pin(rng: Rng, pan: number | undefined, durIn?: number): Voice {
  const count = durIn === undefined ? 1 : Math.max(1, Math.min(12, Math.round(param(durIn, 0.25, 0.25, 4) / 0.25)));
  const first = 0.08;
  const seats = Array.from({length: count}, (_, k) => first + k * 0.25 + (k === 0 ? 0 : rng.uniform(-0.03, 0.03)));
  const len = (seats[seats.length - 1] ?? first) + 0.3;
  const n = lengthOf(len);
  const mono = mixMono(n, seats.map((s, k) => ({sig: onePin(len, s, rng.fork(`pin${k}`)), gain: k === 0 ? 1 : rng.uniform(0.75, 1)})));
  return {mono, pan: deskPan(rng.fork('pan'), pan, 0.15), space: 'desk', syncSample: Math.round(first * SR)};
}

/** Harmonic partials of a thin thread, with a little stiffness (inharmonicity B). */
const threadPartials = (t60: number): Partial[] =>
  Array.from({length: 6}, (_, k) => {
    const h = k + 1;
    return {ratio: h * Math.sqrt(1 + 0.0004 * h * h), t60: t60 / Math.sqrt(h), amp: 1 / Math.pow(h, 1.2)};
  });

/**
 * string — a thread drawn taut between pins. The pull: fine fibre friction through the fingers, speeding
 * up, then stopping dead when the thread goes tight; the friction also drives the thread itself, whose
 * pitch rises with tension (f ~ sqrt(T)). The taut beat: the thread catches on the pin and twangs once,
 * quietly, settling a hair flat as the tension spike relaxes; the cork board takes the knock.
 * `dur` is the pull. Sync = the start of the pull; the twang lands at `dur`.
 */
export function string(rng: Rng, pan: number | undefined, durIn?: number): Voice {
  const dur = param(durIn, 0.8, 0.3, 4);
  const len = dur + 0.6;
  const n = lengthOf(len);
  const peak = rng.uniform(260, 340);
  const speed = curveOf(n, (t) => {
    const u = t / dur;
    if (u >= 1) return 0;
    return peak * (u < 0.88 ? smoothstep(u / 0.6) : smoothstep(u / 0.6) * (0.5 + 0.5 * Math.cos((Math.PI * (u - 0.88)) / 0.12)));
  });
  const pull = frictionSource(speed, new Float64Array(n).fill(0.6), THREAD_ON_FINGERS, rng.fork('pull'));
  const fEnd = rng.uniform(330, 390);
  const tension = curveOf(n, (t) => {
    if (t < dur) return fEnd * (0.25 + 0.75 * Math.pow(t / dur, 1.2));
    return fEnd * (1 + 0.012 * Math.exp(-(t - dur) / 0.04)) * (1 - 0.006 * (1 - Math.exp(-(t - dur) / 0.2)));
  });
  const drawn = glideBank(pull, tension, threadPartials(0.12));
  const pluck = contactForce(n, [{at: dur, impulse: 1, tau: rng.uniform(0.0005, 0.0007)}]);
  const twang = glideBank(pluck, tension, threadPartials(0.35));
  const board = struck(len, [{at: dur, impulse: 1, tau: 0.001}], CORK_MODES, rng.fork('board'));
  const mono = mixMono(n, [{sig: twang}, {sig: relativeTo(pull, twang, 0.8)}, {sig: relativeTo(drawn, twang, 0.25)}, {sig: relativeTo(board, twang, 0.35)}]);
  return {mono, pan: deskPan(rng.fork('pan'), pan, 0.15), space: 'desk', syncSample: 0};
}

/** Brass shackle: a bent rod, free-free beam modes. */
const shackleModes = (f0: number): Mode[] =>
  [1, 2.757, 5.404, 8.933].map((ratio, i) => ({freq: f0 * ratio, t60: [0.14, 0.09, 0.06, 0.04][i] ?? 0.04, amp: [1, 0.6, 0.35, 0.2][i] ?? 0.2}));

/**
 * padlock — a small padlock snapped shut in the hand: the shackle slides into its bore (steel on brass),
 * rides the spring bolt (a faint pre-click), then the bolt snaps into the notch and the shackle bottoms out
 * (two contacts 1.5-3 ms apart) — the body and shackle ring briefly, damped by the fingers; the thumb's push
 * stops with a soft low thump. Sync = the snap.
 */
export function padlock(rng: Rng, pan?: number): Voice {
  const len = 0.4;
  const n = lengthOf(len);
  const snapAt = rng.uniform(0.065, 0.08);
  const slide = frictionSource(addMove(zeros(n), 0.005, snapAt - 0.005, 50), new Float64Array(n).fill(0.6), STEEL_ON_STEEL, rng.fork('slide'));
  const pre = struck(len, [{at: snapAt - rng.uniform(0.012, 0.02), impulse: 0.22, tau: 0.00015}], LOCK_BODY_MODES, rng.fork('pre'));
  const snaps: Contact[] = [
    {at: snapAt, impulse: 1, tau: rng.uniform(0.00012, 0.00016)},
    {at: snapAt + rng.uniform(0.0018, 0.0026), impulse: rng.uniform(0.3, 0.42), tau: 0.0002},
  ];
  const body = struck(len, snaps, LOCK_BODY_MODES, rng.fork('body'));
  const shackle = struck(len, snaps, shackleModes(rng.uniform(1350, 1550)), rng.fork('shackle'));
  const thumb = modalBank(contactForce(n, [{at: snapAt + 0.002, impulse: 1, tau: 0.003}]), [{freq: 180, t60: 0.03, amp: 1}, {freq: 410, t60: 0.02, amp: 0.4}]);
  const mono = mixMono(n, [
    {sig: body},
    {sig: relativeTo(shackle, body, 0.55)},
    {sig: relativeTo(pre, body, 0.2)},
    {sig: relativeTo(slide, body, 0.16)},
    {sig: relativeTo(thumb, body, 0.3)},
  ]);
  return {mono, pan: deskPan(rng.fork('pan'), pan, 0.08), space: 'desk', syncSample: Math.round(snapAt * SR)};
}

export const ODOMETER_DEFAULT_RATE = 8;
const CARRY_EVERY = 10;

/**
 * odometer — digit wheels rolling over: each tick is the detent pawl dropping off a ratchet tooth (a ~0.2 ms
 * plastic contact into the wheel and the housing); every tenth tick the next wheel is carried along, a
 * second, slightly lower tick a few ms later; a faint plastic purr of the gears runs underneath. `dur` is
 * the roll, `rate` ticks per second (2-30; above ~18 it blurs into a whirr, as a real counter does).
 * Sync = the first tick.
 */
export function odometer(rng: Rng, pan: number | undefined, durIn?: number, rateIn?: number): Voice {
  const dur = param(durIn, 1, 0.15, 8);
  const rate = param(rateIn, ODOMETER_DEFAULT_RATE, 2, 30);
  const count = Math.max(1, Math.floor(dur * rate));
  const first = 0.004;
  const len = first + count / rate + 0.15;
  const n = lengthOf(len);
  const ticks: Contact[] = Array.from({length: count}, (_, k) => ({at: first + (k + rng.uniform(-0.03, 0.03) * (k > 0 ? 1 : 0)) / rate, impulse: rng.logNormal(0.12), tau: rng.uniform(0.00018, 0.00024)}));
  const carries: Contact[] = ticks.filter((_, k) => k % CARRY_EVERY === CARRY_EVERY - 1).map((c) => ({at: c.at + rng.uniform(0.006, 0.009), impulse: 0.8, tau: 0.00024}));
  const wheel = struck(len, ticks, WHEEL_MODES, rng.fork('wheel'));
  const carried = struck(len, carries, WHEEL_MODES.map((m) => ({...m, freq: m.freq * 0.92})), rng.fork('carry'));
  const housing = struck(len, [...ticks, ...carries], HOUSING_MODES, rng.fork('housing'));
  const rollEnd = first + count / rate;
  const gears = frictionSource(curveOf(n, (t) => 30 * smoothstep((t - first) / 0.02) * smoothstep((rollEnd - t) / 0.03)), new Float64Array(n).fill(0.5), PLASTIC_ON_PLASTIC, rng.fork('gears'));
  const mono = mixMono(n, [{sig: wheel}, {sig: relativeTo(carried, wheel, 0.8)}, {sig: relativeTo(housing, wheel, 0.4)}, {sig: relativeTo(gears, wheel, 0.06)}]);
  return {mono, pan: deskPan(rng.fork('pan'), pan, 0.1), space: 'desk', syncSample: Math.round(first * SR)};
}
