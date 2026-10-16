// glass.ts — the keynote half: designed sounds that still obey physics (finite contacts, real decays),
// placed in the 'void'. Restraint is the brief: no pitch sweeps, no zaps, nothing a cartoon would use.

import {SR} from '../../core/constants';
import {burst} from '../../core/envelope';
import {applyBiquad, applyChain, bandpass, highpass, lowpass, svf} from '../../core/filters';
import type {Contact, Mode} from '../../core/modal';
import {brown, pink, white} from '../../core/noise';
import type {Rng} from '../../core/rng';
import {mixMono, multiply, smoothstep, type Mono} from '../../core/signal';
import type {Voice} from '../../core/voice';
import {airPuff, lengthOf, noiseBurst, relativeTo, struck} from '../kit';

/** Default snap pitch: A5. Retune to the music's key with --snap-hz (the tick has one clear pitch). */
export const DEFAULT_SNAP_HZ = 880;

/** A small glass tap: fundamental, near-harmonic octave and twelfth, one inharmonic sheen partial, a soft body. */
function glassTick(f0: number, decay: number): Mode[] {
  return [
    {freq: f0, t60: 0.28 * decay, amp: 1},
    {freq: f0 * 2.003, t60: 0.17 * decay, amp: 0.45},
    {freq: f0 * 2.997, t60: 0.09 * decay, amp: 0.18},
    {freq: f0 * 4.17, t60: 0.05 * decay, amp: 0.1},
    {freq: f0 / 4, t60: 0.06, amp: 0.35},
  ];
}

/** Soften the first millisecond (a felt-tipped mallet rather than a needle): 1 - e^(-t/0.8 ms). */
const softOnset = (x: Mono, startSec: number): Mono =>
  x.map((v, i) => {
    const t = i / SR - startSec;
    return t <= 0 ? 0 : v * (1 - Math.exp(-t / 0.0008));
  });

const TUNING_JITTER = {freq: 0.002, t60: 0.08, amp: 0.15};

/** snap — a sketched element snapping into its finished interface: a soft, tuned glass tick that sits on the beat. */
export function snap(rng: Rng, pan?: number, snapHz = DEFAULT_SNAP_HZ): Voice {
  const len = 0.6;
  const n = lengthOf(len);
  const contact: Contact[] = [{at: 0, impulse: 1, tau: 0.00035}];
  const modes = glassTick(snapHz, rng.uniform(0.9, 1.1));
  const ring = softOnset(struck(len, contact, modes, rng.fork('glass'), TUNING_JITTER), 0);
  const air = noiseBurst(len, {at: 0, attack: 0.0005, decay: 0.004, centerHz: 7000, q: 0.6}, rng.fork('air'));
  const mono = mixMono(n, [{sig: ring}, {sig: relativeTo(air, ring, 0.04)}]);
  return {mono, pan: pan ?? 0, space: 'void', syncSample: 0};
}

/** One flap of a card turning through the air: band-passed noise whose centre rises as the edge speeds up. */
function flap(n: number, startSec: number, durSec: number, rng: Rng): Mono {
  const a = Math.round(startSec * SR);
  const b = Math.round((startSec + durSec) * SR);
  const env = Float64Array.from({length: n}, (_, i) => (i >= a && i < b ? Math.sin((Math.PI * (i - a)) / (b - a)) ** 2 : 0));
  const centre = Float64Array.from({length: n}, (_, i) => 900 * Math.pow(2400 / 900, Math.min(1, Math.max(0, (i - a) / (b - a)))));
  return multiply(svf(pink(n, rng), centre, 1.4, 'bp'), env);
}

/**
 * card_flip — the emergency card flips off the phone and lands on the Watch: two air flaps (one full
 * turn), then a soft glass landing (lower and shorter than the snap) with a little weight. Sync = landing.
 */
export function cardFlip(rng: Rng, pan?: number): Voice {
  const land = rng.uniform(0.3, 0.34);
  const len = land + 0.45;
  const n = lengthOf(len);
  const flaps = mixMono(n, [
    {sig: flap(n, 0.04, 0.1, rng.fork('f1')), gain: 0.6},
    {sig: flap(n, 0.15, 0.12, rng.fork('f2'))},
  ]);
  const landModes: Mode[] = [
    {freq: rng.uniform(640, 680), t60: 0.12, amp: 1},
    {freq: 1580, t60: 0.07, amp: 0.4},
    {freq: 2700, t60: 0.04, amp: 0.2},
    {freq: 140, t60: 0.05, amp: 0.6},
  ];
  const landing = softOnset(struck(len, [{at: land, impulse: 1, tau: 0.0005}], landModes, rng.fork('land')), land);
  const mono = mixMono(n, [{sig: landing}, {sig: relativeTo(flaps, landing, 0.5)}]);
  const base = pan ?? 0;
  const panCurve = Float64Array.from({length: n}, (_, i) => base - 0.15 + 0.35 * smoothstep(i / Math.round(land * SR)));
  return {mono, pan: panCurve, space: 'void', syncSample: Math.round(land * SR)};
}

/**
 * wallet_slide — the pass slides out from behind both devices: a soft release tick at the onset (sync),
 * a smooth glide that decelerates like a spring animation (fast out, settling), a faint high sheen on
 * the moving edge, and a soft low seat as it comes to rest.
 */
export function walletSlide(rng: Rng, pan?: number): Voice {
  const glide = 0.5;
  const len = glide + 0.35;
  const n = lengthOf(len);
  const speed = Float64Array.from({length: n}, (_, i) => {
    const t = i / SR;
    return t > glide ? 0 : Math.exp(-t / 0.12) * (1 - Math.exp(-t / 0.01)) * (1 - smoothstep((t - glide * 0.7) / (glide * 0.3)));
  });
  const centre = speed.map((v) => 600 * Math.pow(4, Math.min(1, v * 1.4)));
  const air = multiply(svf(pink(n, rng.fork('air')), centre, 0.8, 'bp'), speed);
  const sheen = multiply(
    mixMono(n, [
      {sig: applyBiquad(white(n, rng.fork('s1')), bandpass(5200, 30))},
      {sig: applyBiquad(white(n, rng.fork('s2')), bandpass(7800, 30)), gain: 0.7},
    ]),
    speed,
  );
  const release = softOnset(struck(len, [{at: 0, impulse: 1, tau: 0.0005}], [{freq: rng.uniform(980, 1000), t60: 0.06, amp: 1}, {freq: 2180, t60: 0.04, amp: 0.4}], rng.fork('rel')), 0);
  const seat = struck(len, [{at: glide, impulse: 1, tau: 0.002}], [{freq: 180, t60: 0.06, amp: 1}, {freq: 420, t60: 0.04, amp: 0.5}], rng.fork('seat'));
  const mono = mixMono(n, [
    {sig: air},
    {sig: relativeTo(release, air, 0.45)},
    {sig: relativeTo(sheen, air, 0.12)},
    {sig: relativeTo(seat, air, 0.35)},
  ]);
  const base = pan ?? 0;
  const panCurve = Float64Array.from({length: n}, (_, i) => base + 0.25 * smoothstep(i / Math.round(glide * SR)));
  return {mono, pan: panCurve, space: 'void', syncSample: 0};
}

/**
 * bubble_pop — a speech bubble appearing. Physically a small air cavity opening (Minnaert-like
 * resonance, f ~ 3.26 / R): a ~700 Hz damped resonance whose pitch rises by only 30 % in the first
 * 10 ms as it opens. Small rise + fast decay keep it a soft "tup", never a cartoon "bloop".
 */
export function bubblePop(rng: Rng, pan?: number): Voice {
  const len = 0.25;
  const n = lengthOf(len);
  const f0 = rng.uniform(660, 740);
  const t60 = rng.uniform(0.04, 0.05);
  const env = burst(n, 0, 0.0015, t60 / Math.log(1000));
  let phase = 0;
  const tone = Float64Array.from({length: n}, (_, i) => {
    const t = i / SR;
    phase += (2 * Math.PI * f0 * (1 + 0.3 * (1 - Math.exp(-t / 0.008)))) / SR;
    return Math.sin(phase) * (env[i] ?? 0);
  });
  const puff = airPuff(len, {at: 0, attack: 0.001, decay: 0.006, cutoffHz: 1500}, rng.fork('puff'));
  const mono = mixMono(n, [{sig: tone}, {sig: relativeTo(puff, tone, 0.15)}]);
  return {mono, pan: pan ?? rng.uniform(-0.2, 0.2), space: 'desk', syncSample: 0};
}

/**
 * title_in — supports "Provisum" fading in after the black beat: a very low, soft swell of air (brown
 * noise 40-380 Hz with a 90 Hz bloom) plus a breath of high air arriving a moment later. Starts on an
 * exact zero (it follows digital silence), no tone, no melody.
 */
export function titleIn(rng: Rng, pan?: number): Voice {
  const rise = 2.1;
  const fall = 1.1;
  const len = rise + fall;
  const n = lengthOf(len);
  const env = Float64Array.from({length: n}, (_, i) => {
    const t = i / SR;
    return t < rise ? Math.sin((Math.PI / 2) * (t / rise)) ** 2 : Math.cos((Math.PI / 2) * ((t - rise) / fall)) ** 2;
  });
  // 4th-order high-pass at 38 Hz: the swell lives at 40-380 Hz, nothing below to waste headroom or pump a woofer
  const low = applyChain(brown(n, rng.fork('low')), [lowpass(380, 0.7), highpass(38, 0.54), highpass(38, 1.31)]);
  const bloom = applyChain(brown(n, rng.fork('bloom')), [bandpass(90, 1.2), highpass(38, 0.7)]);
  const highAir = applyBiquad(applyBiquad(pink(n, rng.fork('air')), highpass(3000, 0.7)), lowpass(9000, 0.7));
  const late = Float64Array.from({length: n}, (_, i) => env[Math.max(0, i - Math.round(0.3 * SR))] ?? 0);
  const body = multiply(mixMono(n, [{sig: low}, {sig: bloom, gain: 0.6}]), env);
  const mono = mixMono(n, [{sig: body}, {sig: relativeTo(multiply(highAir, late), body, 0.06)}]);
  return {mono, pan: pan ?? 0, space: 'void', syncSample: 0};
}
