// gesture.ts — how hands move: speed curves (mm/s per sample) for drawing, rubbing and sliding.
//
// Drawing is not constant-speed. A line is a chain of sub-movements, each with the bell-shaped
// minimum-jerk speed profile; at the joins (corners, direction changes) the tip slows to ~10-25 % but
// stays on the paper. That rhythm (2-6 sub-movements per second) is most of what makes a pencil read
// as a hand and not as a noise generator.

import {SR} from '../core/constants';
import {minJerkSpeed, smoothRandom} from '../core/envelope';
import {smooth} from '../core/filters';
import type {Rng} from '../core/rng';
import {zeros, type Mono} from '../core/signal';

export type DrawingStyle = {
  readonly segmentSec: readonly [number, number];
  readonly peakSpeedMmS: readonly [number, number];
  /** Fraction of peak speed retained at the joins between sub-movements. */
  readonly joinFloor: readonly [number, number];
};

export const PENCIL_STYLE: DrawingStyle = {segmentSec: [0.16, 0.55], peakSpeedMmS: [70, 160], joinFloor: [0.08, 0.25]};
export const PEN_STYLE: DrawingStyle = {segmentSec: [0.2, 0.6], peakSpeedMmS: [60, 140], joinFloor: [0.12, 0.3]};

const SPEED_SMOOTH_SEC = 0.012;

/** Split a duration into sub-movement lengths drawn from the style's range (the last one absorbs the rest). */
function planSegments(durSec: number, style: DrawingStyle, rng: Rng): number[] {
  const [lo, hi] = style.segmentSec;
  if (durSec <= lo * 1.5) return [durSec];
  const segments: number[] = [];
  let remaining = durSec;
  while (remaining > hi) {
    const len = rng.uniform(lo, hi);
    segments.push(len);
    remaining -= len;
  }
  return remaining < lo * 0.6 && segments.length > 0
    ? [...segments.slice(0, -1), (segments[segments.length - 1] ?? 0) + remaining]
    : [...segments, remaining];
}

/** A freehand line: chained minimum-jerk sub-movements, from rest to rest. */
export function drawingSpeed(durSec: number, style: DrawingStyle, rng: Rng, speedScale = 1): Mono {
  const n = Math.max(2, Math.round(durSec * SR));
  const out = zeros(n);
  const segments = planSegments(durSec, style, rng);
  let start = 0;
  segments.forEach((len, k) => {
    const peak = rng.uniform(style.peakSpeedMmS[0], style.peakSpeedMmS[1]) * speedScale;
    const floorIn = k === 0 ? 0 : rng.uniform(style.joinFloor[0], style.joinFloor[1]);
    const floorOut = k === segments.length - 1 ? 0 : rng.uniform(style.joinFloor[0], style.joinFloor[1]);
    const a = Math.round(start * SR);
    const b = Math.min(n, Math.round((start + len) * SR));
    for (let i = a; i < b; i++) {
      const s = (i - a) / Math.max(1, b - a);
      const floor = s < 0.5 ? floorIn : floorOut;
      out[i] = peak * (floor + (1 - floor) * minJerkSpeed(s));
    }
    start += len;
  });
  return smooth(out, SPEED_SMOOTH_SEC);
}

/** One move of `travelMm` over `durSec` with a minimum-jerk profile (a sheet slid across the desk). */
export function singleMove(durSec: number, travelMm: number): Mono {
  const n = Math.max(2, Math.round(durSec * SR));
  const peak = (1.875 * travelMm) / durSec; // peak of the min-jerk profile = 1.875 x mean speed
  return Float64Array.from({length: n}, (_, i) => peak * minJerkSpeed(i / (n - 1)));
}

/** Back-and-forth rubbing: |speed| of each half-stroke is a bell, reversing direction at rest. */
export function rubbingSpeed(durSec: number, rng: Rng): {speed: Mono; direction: Mono} {
  const n = Math.max(2, Math.round(durSec * SR));
  const speed = zeros(n);
  const direction = zeros(n);
  const cycleHz = rng.uniform(3.2, 4.4);
  let t = 0;
  let dir = rng.next() < 0.5 ? 1 : -1;
  while (t < durSec) {
    const half = (1 / (2 * cycleHz)) * rng.uniform(0.85, 1.15);
    const travel = rng.uniform(7, 14); // mm per half stroke
    const peak = (1.875 * travel) / half;
    const a = Math.round(t * SR);
    const b = Math.min(n, Math.round((t + half) * SR));
    for (let i = a; i < b; i++) {
      speed[i] = peak * minJerkSpeed((i - a) / Math.max(1, b - a));
      direction[i] = dir;
    }
    dir = -dir;
    t += half;
  }
  return {speed, direction};
}

/** Constant pressure with a slow, small human wobble (grip tension changes 2-4 times a second). */
export function wobblyPressure(n: number, base: number, depth: number, rng: Rng): Mono {
  const drift = smoothRandom(n, rng.uniform(2, 4), rng);
  return drift.map((d) => Math.max(0, Math.min(1, base * (1 + depth * d))));
}
