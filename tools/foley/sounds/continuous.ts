// continuous.ts — erase, slide and sweep: sounds whose length is set by the cue.

import {SR} from '../core/constants';
import {fadeInOut, smoothRandom} from '../core/envelope';
import {applyBiquad, applyChain, bandpass, highpass, lowpass, lowShelf, peaking, svf} from '../core/filters';
import {pink, white} from '../core/noise';
import type {Rng} from '../core/rng';
import {clamp, mixMono, multiply, smoothstep, type Mono} from '../core/signal';
import type {Voice} from '../core/voice';
import {frictionSource} from './friction';
import {rubbingSpeed, singleMove, wobblyPressure} from './gesture';
import {airPuff, crinkles, DESK_MODES, relativeTo, struck} from './kit';
import {ERASER_ON_PAPER, PAPER_ON_DESK, SKIN_ON_PAPER} from './materials';

export const CONTINUOUS_MIN_SEC = 0.15;
export const CONTINUOUS_MAX_SEC = 8;
const clampDur = (d: number): number => clamp(d, CONTINUOUS_MIN_SEC, CONTINUOUS_MAX_SEC);

/**
 * erase — a soft eraser rubbed back and forth at 3-4.4 Hz. Friction from a broad compliant patch (dull,
 * wide slips, random spacing so no squeak), the sheet buckling a little at each reversal (low paper
 * rustle), and crumbs rolling off (rare tiny ticks).
 */
export function eraseVoice(durSec: number, rng: Rng, panOverride?: number): Voice {
  const dur = clampDur(durSec);
  const n = Math.round(dur * SR);
  const {speed, direction} = rubbingSpeed(dur, rng.fork('rub'));
  const pressure = wobblyPressure(n, 0.7, 0.15, rng.fork('pressure'));
  const rub = applyChain(frictionSource(speed, pressure, ERASER_ON_PAPER, rng.fork('friction')), [peaking(900, 0.9, 2), lowShelf(250, -2)]);
  // the sheet flexes most when the motion reverses (speed near zero, force changing sign)
  const flex = speed.map((v) => 1 / (1 + v / 15));
  const rustle = multiply(applyBiquad(white(n, rng.fork('rustle')), bandpass(320, 0.9)), flex);
  const crumbs = crinkles(dur, {start: 0.05, span: Math.max(0.01, dur - 0.1), count: Math.round(dur * 5), centerHz: 4200}, rng.fork('crumbs'));
  const mixed = mixMono(n, [{sig: rub}, {sig: relativeTo(rustle, rub, 0.12)}, {sig: relativeTo(crumbs, rub, 0.06)}]);
  const shaped = multiply(mixed, fadeInOut(n, Math.min(0.04, dur * 0.25), Math.min(0.06, dur * 0.3)));
  const base = panOverride ?? rng.uniform(-0.12, 0.12);
  const pan = direction.map((d) => clamp(base + 0.05 * d, -1, 1));
  return {mono: shaped, pan, space: 'desk', syncSample: 0};
}

/**
 * slide — an A3 sheet pushed across the desk by a hand: one minimum-jerk move. Large light contact
 * (low rustle, brightness and level follow speed), the sheet's edge fluttering (6-14 Hz), the
 * fingertips on top, a few crinkles as it unsticks, and the air cushion settling at the end.
 */
export function slideVoice(durSec: number, rng: Rng, panOverride?: number): Voice {
  const dur = clampDur(durSec);
  const tail = 0.12;
  const n = Math.round((dur + tail) * SR);
  const travel = rng.uniform(150, 300);
  const move = singleMove(dur, travel);
  const speed = Float64Array.from({length: n}, (_, i) => move[i] ?? 0);
  const pressure = new Float64Array(n).fill(0.5);
  const sheet = frictionSource(speed, pressure, PAPER_ON_DESK, rng.fork('sheet'));
  const flutter = smoothRandom(n, rng.uniform(6, 14), rng.fork('flutter')).map((f) => 1 + 0.4 * f);
  const hand = frictionSource(speed, pressure, SKIN_ON_PAPER, rng.fork('hand'));
  const unstick = crinkles(dur + tail, {start: 0, span: Math.min(0.06, dur * 0.3), count: rng.int(3, 5), centerHz: 2600}, rng.fork('unstick'));
  const settle = struck(dur + tail, [{at: dur * 0.97, impulse: 1, tau: 0.006}], DESK_MODES, rng.fork('settle'));
  const settleAir = airPuff(dur + tail, {at: dur * 0.94, attack: 0.012, decay: 0.03, cutoffHz: 400}, rng.fork('air'));
  const body = multiply(sheet, flutter);
  const mixed = mixMono(n, [
    {sig: body},
    {sig: relativeTo(hand, body, 0.25)},
    {sig: relativeTo(unstick, body, 0.18)},
    {sig: relativeTo(settle, body, 0.12)},
    {sig: relativeTo(settleAir, body, 0.18)},
  ]);
  const shaped = multiply(mixed, fadeInOut(n, 0.01, 0.02));
  const end = panOverride ?? rng.uniform(-0.3, 0.3);
  const start = clamp(end - Math.sign(end || 1) * rng.uniform(0.2, 0.4), -1, 1);
  const pan = Float64Array.from({length: n}, (_, i) => start + (end - start) * smoothstep(i / Math.round(dur * SR)));
  return {mono: shaped, pan, space: 'desk', syncSample: 0};
}

/** Bell for the light band: rises over 55 % of the sweep, falls over the rest, smooth at both ends. */
function sweepBell(n: number): Mono {
  const peakAt = 0.55;
  return Float64Array.from({length: n}, (_, i) => {
    const s = i / Math.max(1, n - 1);
    return s < peakAt ? smoothstep(s / peakAt) ** 1.5 : smoothstep((1 - s) / (1 - peakAt)) ** 1.2;
  });
}

/**
 * sweep — the band of light travelling along a device edge. Air: pink noise through a band-pass whose
 * centre glides 350 Hz -> 2.6 kHz -> back with the band's brightness (no pitched tone moves, so it
 * never becomes a laser). Shimmer: four very narrow noise bands (Q 60) at fixed high frequencies, the
 * way a glass edge sings, entering slightly after the air and twinkling slowly. Pan follows the light.
 */
export function sweepVoice(durSec: number, rng: Rng, panOverride?: number): Voice {
  const dur = clampDur(durSec);
  const n = Math.round(dur * SR);
  const bell = sweepBell(n);
  const centre = bell.map((b) => 350 * Math.pow(2600 / 350, b));
  const air = multiply(svf(pink(n, rng.fork('air')), centre, 0.9, 'bp'), bell);
  const airTop = multiply(applyBiquad(pink(n, rng.fork('top')), highpass(5000, 0.7)), bell.map((b) => b * b));
  const shimmerBands = [4186, 5274, 6272, 8372].map((f, k) => {
    const band = applyBiquad(applyBiquad(white(n, rng.fork(`glint${k}`)), bandpass(f, 60)), lowpass(12000));
    const twinkle = smoothRandom(n, rng.uniform(1.5, 3), rng.fork(`tw${k}`)).map((t) => 0.6 + 0.4 * t);
    return multiply(band, twinkle);
  });
  const lagged = Float64Array.from({length: n}, (_, i) => bell[Math.max(0, i - Math.round(0.08 * dur * SR))] ?? 0);
  const shimmer = multiply(mixMono(n, shimmerBands.map((sig) => ({sig}))), lagged);
  const mixed = mixMono(n, [{sig: air}, {sig: relativeTo(airTop, air, 0.15)}, {sig: relativeTo(shimmer, air, 0.22)}]);
  const travel = panOverride ?? 0;
  const pan = Float64Array.from({length: n}, (_, i) => clamp(travel - 0.6 + 1.2 * smoothstep(i / n), -1, 1));
  return {mono: mixed, pan, space: 'void', syncSample: 0};
}
