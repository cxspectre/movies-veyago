// accentLoop.ts — a hand's loop round a wide pair of things (the two answer chips): a superellipse, so it holds
// the ends of a long row better than an ellipse, drawn once round from the upper left with a short, clean overlap.
import {handPath, type XY} from '../../paper';

export type AccentLoop = {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  /** Superellipse exponent: 2 is an ellipse, higher is squarer. */
  readonly squareness: number;
  /** How far the end runs past the start, px along the loop. */
  readonly overlapPx: number;
};

const SAMPLES = 48;
const START_DEG = 200;
/** The loop opens a hair as it goes round, so the overlap sits beside the start, not on top of it. */
const GROW = 0.035;

const signedPow = (v: number, p: number): number => Math.sign(v) * Math.abs(v) ** p;

const pointAt = (o: AccentLoop, deg: number, scale: number): XY => {
  const a = (deg * Math.PI) / 180;
  const p = 2 / o.squareness;
  return [o.cx + signedPow(Math.cos(a), p) * o.rx * scale, o.cy + signedPow(Math.sin(a), p) * o.ry * scale];
};

/** Clockwise on screen from the upper left, once round, then `overlapPx` further. */
export const accentLoop = (o: AccentLoop, seed: number): string => {
  const ring = Array.from({length: SAMPLES + 1}, (_, i): XY => pointAt(o, START_DEG + (360 * i) / SAMPLES, 1 - GROW / 2 + (GROW * i) / SAMPLES));
  const last = ring[ring.length - 1] as XY;
  const step = 360 / SAMPLES;
  const tail = Array.from({length: 4}, (_, i): XY => pointAt(o, START_DEG + 360 + (step * (i + 1)) / 2, 1 + GROW / 2));
  const lengths = tail.map((p, i) => Math.hypot(p[0] - ((tail[i - 1] ?? last) as XY)[0], p[1] - ((tail[i - 1] ?? last) as XY)[1]));
  const extra = tail.filter((_, i) => lengths.slice(0, i + 1).reduce((a, b) => a + b, 0) <= o.overlapPx + 0.5);
  return handPath([...ring, ...extra], seed, {wobble: 0.6});
};
