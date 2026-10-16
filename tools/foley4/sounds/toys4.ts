// toys4.ts — the v4 moving paper toys: train, plane, rocket, marble_run.

import {SR} from '../../foley/core/constants';
import {burst, smoothRandom} from '../../foley/core/envelope';
import {applyChain, highpass, lowpass, smooth, svf} from '../../foley/core/filters';
import {contactForce, modalBank, type Contact} from '../../foley/core/modal';
import {pink} from '../../foley/core/noise';
import type {Rng} from '../../foley/core/rng';
import {clamp, integrate, mixMono, multiply, smoothstep, zeros, type Mono} from '../../foley/core/signal';
import type {Voice} from '../../foley/core/voice';
import {frictionSource} from '../../foley/sounds/friction';
import {airPuff, crinkles, DESK_MODES, lengthOf, relativeTo, struck} from '../../foley/sounds/kit';
import {addMove, CARD_MODES, curveOf, eventTrain, glideBank, movingBand, PAPER_ON_PAPER, param, relativeRms, ROLL_ON_CARD, TIN_MODES} from './kit4';

const G = 9.81;

/** Amplitude modulation of a fluttering paper edge: a wandering 20-40 Hz flap, `depth` deep. */
function flutter(n: number, hz: number, depth: number, rng: Rng): Mono {
  const wander = smoothRandom(n, 3, rng);
  const phase = integrate(Float64Array.from(wander, (w) => hz * (1 + 0.2 * w)), SR);
  return Float64Array.from(phase, (p) => 1 + depth * Math.sin(2 * Math.PI * p));
}

const AXLES_MM = [0, 18, 62, 80] as const;
const JOINT_MM = 40;

/** Times at which each axle crosses a rail joint, for a position curve in mm. */
function jointCrossings(position: Mono, speedNorm: Mono, rng: Rng): Contact[] {
  return AXLES_MM.flatMap((offset) => {
    const out: Contact[] = [];
    let last = Math.floor(((position[0] ?? 0) - offset) / JOINT_MM);
    for (let i = 1; i < position.length; i++) {
      const x = (position[i] ?? 0) - offset;
      const k = Math.floor(x / JOINT_MM);
      if (x > 0 && k > last) out.push({at: i / SR, impulse: rng.logNormal(0.25) * (0.5 + 0.5 * (speedNorm[i] ?? 0)), tau: rng.uniform(0.0003, 0.0005)});
      last = k;
    }
    return out;
  });
}

/**
 * train — a small tin train with card carriages on a card track. Four axles click over the track's joints
 * (spacing 40 mm, so at ~20 cm/s the familiar paired "clack-clack" at about five a second); the tin shell
 * rattles loosely in proportion to speed; the wheels rumble on the card. It accelerates in, runs, slows, and
 * crosses the frame left to right. `dur` is the run. Sync = the start of motion.
 */
export function train(rng: Rng, pan: number | undefined, durIn?: number): Voice {
  const dur = param(durIn, 2, 0.8, 12);
  const len = dur + 0.3;
  const n = lengthOf(len);
  const cruise = rng.uniform(190, 230);
  const speed = curveOf(n, (t) => cruise * smoothstep(t / 0.35) * smoothstep((dur - t) / 0.35));
  const norm = speed.map((v) => v / cruise);
  const clacks = jointCrossings(integrate(speed, SR), norm, rng.fork('joints'));
  const track = struck(len, clacks, CARD_MODES, rng.fork('track'));
  const shell = struck(len, clacks, TIN_MODES, rng.fork('shell'));
  const desk = struck(len, clacks, DESK_MODES, rng.fork('desk'));
  const rattleEvents = eventTrain(len, {rate: (t) => 70 * (norm[Math.min(n - 1, Math.round(t * SR))] ?? 0), centerHz: () => 2000, size: () => 0.3, spreadOct: 0, alpha: 2.5, cap: 4, tau: [0.00015, 0.0003]}, rng.fork('rattle'));
  const rattle = modalBank(contactForce(n, rattleEvents), TIN_MODES);
  const rumble = frictionSource(speed, new Float64Array(n).fill(0.5), ROLL_ON_CARD, rng.fork('rumble'));
  const mono = mixMono(n, [
    {sig: track},
    {sig: relativeTo(shell, track, 0.5)},
    {sig: relativeTo(desk, track, 0.3)},
    {sig: relativeTo(rattle, track, 0.25)},
    {sig: relativeTo(rumble, track, 0.35)},
  ]);
  const base = pan ?? 0;
  const panCurve = curveOf(n, (t) => clamp(base - 0.55 + (1.1 * Math.min(t, dur)) / dur, -1, 1));
  return {mono, pan: panCurve, space: 'desk', syncSample: 0};
}

/**
 * plane — a paper plane gliding past, 30 cm from the listener. The sound is air over its edges: two bands of
 * edge noise (broad ~1.5 kHz, narrow ~3.8 kHz) whose pitch is shifted by the motion (an exaggerated doppler:
 * the toy is given a sound speed of six times its own, so the sweep is about +20 % approaching, -14 %
 * receding), 1/r level, high frequencies lost with distance, a 20-30 Hz trailing-edge flutter, and a pan
 * that follows it across. `dur` is the pass; closest approach at 55 % of it. Sync = the start of the pass.
 */
export function plane(rng: Rng, pan: number | undefined, durIn?: number): Voice {
  const dur = param(durIn, 1.4, 0.5, 5);
  const len = dur + 0.1;
  const n = lengthOf(len);
  const tc = 0.55 * dur;
  const d = 0.3;
  const v = 3 / dur;
  const cEff = 6 * v;
  const geo = (t: number): {x: number; r: number} => {
    const x = v * (t - tc);
    return {x, r: Math.sqrt(d * d + x * x)};
  };
  const ratio = curveOf(n, (t) => {
    const {x, r} = geo(t);
    return 1 / (1 + (v * x) / r / cEff);
  });
  const body = movingBand(n, ratio.map((k) => 1500 * k), 1.2, rng.fork('body'));
  const edge = movingBand(n, ratio.map((k) => 3800 * k), 4, rng.fork('edge'));
  // the air the plane pushes is low-mid, not sub-bass: a paper plane moves no air below ~150 Hz
  const low = applyChain(pink(n, rng.fork('low')), [lowpass(320, 0.7), highpass(140, 0.7)]);
  const fadeEnds = curveOf(n, (t) => smoothstep(t / 0.12) * smoothstep((dur - t) / 0.12));
  const level = curveOf(n, (t) => (d / geo(t).r) * (fadeEnds[Math.min(n - 1, Math.round(t * SR))] ?? 0));
  const source = mixMono(n, [{sig: body}, {sig: edge, gain: 0.35}, {sig: low, gain: 0.3}]);
  const shaped = multiply(multiply(source, level), flutter(n, rng.uniform(22, 30), 0.2, rng.fork('flutter')));
  const mono = applyChain(svf(shaped, curveOf(n, (t) => 1800 + 7000 * (d / geo(t).r)), 0.7, 'lp'), [highpass(150, 0.7), highpass(110, 0.7)]);
  const base = pan ?? 0;
  const panCurve = curveOf(n, (t) => {
    const {x, r} = geo(Math.min(t, dur));
    return clamp(base + 0.8 * (x / r), -1, 1);
  });
  return {mono, pan: panCurve, space: 'desk', syncSample: 0};
}

/**
 * rocket — a paper rocket launched by air (a straw or squeeze-bulb launcher), not fire. The pressure
 * release drives the launch tube's air column (a quarter-wave mode near 500 Hz that falls towards 300 Hz as
 * the rocket slides off and the column lengthens): a soft "phoomp"; a low puff from the bulb; the paper tube
 * rubbing off the launcher; the fins crinkling; then the rocket's air wake rising and fading as it climbs
 * away, its fins fluttering. Restrained by design. Sync = the launch.
 */
export function rocket(rng: Rng, pan?: number): Voice {
  const len = 1.5;
  const n = lengthOf(len);
  const t0 = 0.01;
  // the bulb's puff: low-mid, held off the sub-bass (a paper toy, not an engine)
  const puff = applyChain(airPuff(len, {at: t0, attack: 0.006, decay: 0.04, cutoffHz: 300}, rng.fork('puff')), [highpass(110, 0.7)]);
  // the pressure release is a smooth ~6 ms push (plus a little turbulence riding on it)
  const push = contactForce(n, [{at: t0, impulse: 1, tau: rng.uniform(0.005, 0.007)}]);
  const turbulence = airPuff(len, {at: t0, attack: 0.004, decay: 0.03, cutoffHz: 1200}, rng.fork('drive'));
  const drive = mixMono(n, [{sig: push}, {sig: relativeTo(turbulence, push, 0.15)}]);
  const column = curveOf(n, (t) => 520 - 220 * smoothstep((t - t0) / 0.06));
  const tube = glideBank(drive, column, [{ratio: 1, t60: 0.05, amp: 1}, {ratio: 3, t60: 0.03, amp: 0.3}]);
  const slide = frictionSource(addMove(zeros(n), t0, 0.05, 1600), new Float64Array(n).fill(0.6), PAPER_ON_PAPER, rng.fork('slide'));
  const fins = crinkles(len, {start: t0 + 0.01, span: 0.05, count: rng.int(5, 8), centerHz: 2400}, rng.fork('fins'));
  const climb = movingBand(n, curveOf(n, (t) => 900 + 600 * smoothstep((t - t0) / 0.6)), 1.5, rng.fork('climb'));
  const wakeEnv = burst(n, t0 + 0.02, 0.04, 0.3);
  const wake = svf(multiply(multiply(climb, wakeEnv), flutter(n, rng.uniform(34, 42), 0.2, rng.fork('flutter'))), curveOf(n, (t) => 6000 - 4200 * smoothstep(t / 1.0)), 0.7, 'lp');
  const mono = mixMono(n, [
    {sig: tube},
    {sig: relativeRms(puff, tube, 0.45)},
    {sig: relativeTo(slide, tube, 0.3)},
    {sig: relativeTo(fins, tube, 0.2)},
    {sig: relativeRms(wake, tube, 0.6)},
  ]);
  return {mono, pan: pan ?? 0, space: 'desk', syncSample: Math.round(t0 * SR)};
}

type RunPlan = {readonly rolls: {start: number; end: number; vEnd: number}[]; readonly contacts: Contact[]; readonly flaps: Contact[]};

/** Bounces of a marble dropped `h` metres onto card: intervals and impulses shrink by the restitution e. */
function bounces(land: number, h: number, e: number, rng: Rng): Contact[] {
  const first = (2 * e * Math.sqrt(2 * G * h)) / G;
  const out: Contact[] = [];
  let at = land;
  for (let k = 0; k < 6 && first * Math.pow(e, k) > 0.004; k++) {
    out.push({at, impulse: Math.pow(e, k) * rng.uniform(0.9, 1.1), tau: rng.uniform(0.0002, 0.0003)});
    at += first * Math.pow(e, k);
  }
  return out;
}

/** Lay out the run: roll down a ramp, hit a gate flap, drop to the next ramp, bounce, roll on... */
function planRun(dur: number, rng: Rng): RunPlan {
  const rolls: RunPlan['rolls'] = [];
  const contacts: Contact[] = [];
  const flaps: Contact[] = [];
  let t = 0.02;
  while (t < dur - 0.25) {
    const end = Math.min(dur, t + rng.uniform(0.45, 0.8));
    rolls.push({start: t, end, vEnd: rng.uniform(260, 340)});
    if (end >= dur - 0.15) break;
    const h = rng.uniform(0.02, 0.04);
    flaps.push({at: end, impulse: 0.5, tau: 0.00025}, {at: end + rng.uniform(0.15, 0.25), impulse: 0.22, tau: 0.0006});
    const land = end + Math.sqrt((2 * h) / G);
    contacts.push(...bounces(land, h, rng.uniform(0.45, 0.55), rng));
    t = land + 0.01;
  }
  return {rolls, contacts, flaps};
}

/**
 * marble_run — a glass marble through a card run: it rolls down each ramp (gravity: speed rising, the
 * rumble of the card's grain, the ramp resonating), knocks a gate flap open, drops 2-4 cm onto the next ramp
 * and bounces (restitution ~0.5: the intervals shrink geometrically), while the flap swings back behind it.
 * Continuous: `dur` is the run (up to 30 s); the pan wanders as the ramps zig-zag. Sync = the start.
 */
export function marbleRun(rng: Rng, pan: number | undefined, durIn?: number): Voice {
  const dur = param(durIn, 3, 1, 30);
  const len = dur + 0.4;
  const n = lengthOf(len);
  const plan = planRun(dur, rng.fork('plan'));
  const speed = plan.rolls.reduce(
    (curve, r) => curve.map((v, i) => {
      const t = i / SR;
      if (t < r.start || t >= r.end) return v;
      const u = (t - r.start) / (r.end - r.start);
      return v + (60 + (r.vEnd - 60) * u) * smoothstep((t - r.start) / 0.015) * smoothstep((r.end - t) / 0.01);
    }),
    zeros(n),
  );
  const roll = frictionSource(speed, new Float64Array(n).fill(0.5), ROLL_ON_CARD, rng.fork('roll'));
  const ramp = modalBank(roll, CARD_MODES);
  const hits = struck(len, [...plan.contacts, ...plan.flaps], CARD_MODES, rng.fork('card'));
  const desk = struck(len, plan.contacts, DESK_MODES, rng.fork('desk'));
  const mono = mixMono(n, [
    {sig: hits},
    {sig: relativeTo(desk, hits, 0.25)},
    {sig: relativeTo(roll, hits, 0.4)},
    {sig: relativeTo(ramp, hits, 0.2)},
  ]);
  const base = pan ?? 0;
  const steps = curveOf(n, (t) => {
    const k = plan.rolls.findIndex((r) => t < r.end);
    return clamp(base + (((k < 0 ? plan.rolls.length : k) % 2 === 0 ? -1 : 1) * 0.25), -1, 1);
  });
  return {mono, pan: smooth(steps, 0.12), space: 'desk', syncSample: 0};
}
