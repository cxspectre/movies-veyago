// roomTone.ts — the quiet warm room of the paper world, and true digital silence where the film needs it.
//
// A real quiet room is mostly low-frequency: distant traffic and building rumble (brown), air movement
// (pink), a gentle room mode around 220 Hz, very little above 5 kHz. It is never static: its level
// breathes by about +-1 dB over 10-20 s and its top end drifts. Left and right are only partly
// coherent (~0.35), as with a spaced pair. Inside a silence range every sample is exactly 0.0.

import {SR} from '../core/constants';
import {smoothRandom} from '../core/envelope';
import {applyChain, highpass, lowShelf, peaking, svf} from '../core/filters';
import {brown, pink} from '../core/noise';
import type {Rng} from '../core/rng';
import {dbToGain, mixMono, multiply, zeros, type Mono} from '../core/signal';
import type {Stereo} from '../core/space';

export type Silence = {
  readonly start: number;
  readonly end: number;
  /** Fade into the silence (default 5 ms: reads as a hard cut, but no step). */
  readonly fadeOutMs?: number;
  /** Fade back out of it (default 400 ms: the room returns, it does not switch on). */
  readonly fadeInMs?: number;
};

const SHARED = 0.35;
const LEVEL_DRIFT_DB = 1.2;
const DEFAULT_FADE_OUT_MS = 5;
const DEFAULT_FADE_IN_MS = 400;
const WARMTH = [highpass(35, 0.7), lowShelf(160, 3), peaking(220, 1.2, 2), peaking(2500, 0.7, -3)];

function channel(n: number, rng: Rng): Mono {
  return mixMono(n, [{sig: brown(n, rng.fork('brown')), gain: 0.5}, {sig: pink(n, rng.fork('pink')), gain: 0.6}]);
}

function shapeRoom(x: Mono, rng: Rng): Mono {
  const n = x.length;
  const topEnd = smoothRandom(n, 0.07, rng.fork('top')).map((d) => 4500 + 1500 * d);
  const warm = svf(applyChain(x, WARMTH), topEnd, 0.6, 'lp');
  const breathe = smoothRandom(n, 0.08, rng.fork('level')).map((d) => dbToGain(LEVEL_DRIFT_DB * d));
  return multiply(warm, breathe);
}

/** Gain curve: 1 outside silences, exactly 0 inside, raised-cosine fades at the edges. */
export function silenceGate(n: number, silences: readonly Silence[]): Mono {
  const gate = new Float64Array(n).fill(1);
  for (const s of silences) {
    const a = Math.round(s.start * SR);
    const b = Math.round(s.end * SR);
    const fo = Math.max(1, Math.round(((s.fadeOutMs ?? DEFAULT_FADE_OUT_MS) / 1000) * SR));
    const fi = Math.max(1, Math.round(((s.fadeInMs ?? DEFAULT_FADE_IN_MS) / 1000) * SR));
    for (let i = Math.max(0, a - fo); i < Math.min(n, b + fi); i++) {
      const g = i < a ? 0.5 + 0.5 * Math.cos((Math.PI * (i - (a - fo))) / fo) : i < b ? 0 : 0.5 - 0.5 * Math.cos((Math.PI * (i - b)) / fi);
      gate[i] = Math.min(gate[i] ?? 1, g);
    }
  }
  return gate;
}

/** Room tone of `lengthSec`, uncalibrated level (render/levels.ts calibrates it), silences applied. */
export function roomTone(lengthSec: number, rng: Rng, silences: readonly Silence[] = []): Stereo {
  const n = Math.max(1, Math.round(lengthSec * SR));
  const shared = channel(n, rng.fork('shared'));
  const own = (label: string): Mono => mixMono(n, [{sig: shared, gain: SHARED}, {sig: channel(n, rng.fork(label)), gain: 1 - SHARED}]);
  const gate = silenceGate(n, silences);
  // the same drift curves on both sides: the room breathes as a whole
  const left = multiply(shapeRoom(own('left'), rng.fork('shape')), gate);
  const right = multiply(shapeRoom(own('right'), rng.fork('shape')), gate);
  return {left: left.map((v, i) => ((gate[i] ?? 1) === 0 ? 0 : v)), right: right.map((v, i) => ((gate[i] ?? 1) === 0 ? 0 : v))};
}

export const emptyStereo = (n: number): Stereo => ({left: zeros(n), right: zeros(n)});
