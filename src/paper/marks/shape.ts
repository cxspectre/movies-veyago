// shape.ts — the pencil physics of one movement: pressure (landing, turns, lift-off), width and speed.
import {clamp, smoothstep, wobble} from '../geometry/noise';
import {curvatureAt, type Polyline, type Pt, resample, tangentAt} from '../geometry/path';
import type {MarkPoint} from './types';

export type ShapeOptions = {
  readonly width: number;
  readonly pressure: number;
  readonly seed: number;
  /** Extra weight where the lead lands (0.25 = a quarter heavier). */
  readonly landing?: number;
  /** Pressure left at lift-off as a fraction (0.4 = a soft taper; 0.2 = a flick). */
  readonly release?: number;
  /** Length of the lift-off taper, px. */
  readonly releasePx?: number;
};

const LANDING_PX = 9;
const TURN_SCALE = 9; // curvature (rad/px) that counts as a full turn
const TURN_BOOST = 0.32; // extra pressure at turns
const TURN_SLOWDOWN = 1.6; // the hand slows down at turns
const TREMOR = 0.12;
const TREMOR_PX = 26;
const SPEED_FLOOR = 0.28; // speed at the very start/end relative to cruise

/** Turn a resampled polyline into timed, pressured mark points. */
export const shapeMark = (poly: Polyline, o: ShapeOptions): readonly MarkPoint[] => {
  const L = Math.max(poly.length, 0.001);
  const landing = o.landing ?? 0.28;
  const release = o.release ?? 0.42;
  const releaseLen = Math.min(L * 0.3, o.releasePx ?? 24);
  const raw = poly.pts.map((pt, i) => {
    const s = poly.s[i] as number;
    const turn = clamp(curvatureAt(poly.pts, i) * TURN_SCALE, 0, 1);
    const land = 1 + landing * Math.exp(-s / LANDING_PX);
    const lift = 1 - (1 - release) * smoothstep(L - releaseLen, L, s);
    const tremor = 1 + TREMOR * wobble(o.seed, s / TREMOR_PX);
    const p = clamp(o.pressure * land * lift * tremor * (1 + TURN_BOOST * turn), 0.05, 1.6);
    const along = clamp(s / L, 0, 1);
    const cruise = SPEED_FLOOR + (1 - SPEED_FLOOR) * Math.sin(Math.PI * along) ** 0.55;
    const speed = cruise / (1 + TURN_SLOWDOWN * turn);
    return {x: pt.x, y: pt.y, w: o.width * (0.7 + 0.4 * Math.min(p, 1.2)), p, speed, s};
  });
  const costs = raw.map((r, i) => {
    const prev = raw[i - 1];
    return prev ? (r.s - prev.s) / Math.max(0.05, (r.speed + prev.speed) / 2) : 0;
  });
  const total = costs.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  return raw.map((r, i) => {
    acc += costs[i] as number;
    return {x: r.x, y: r.y, w: r.w, p: r.p, t: i === raw.length - 1 ? 1 : acc / total};
  });
};

/** Push a polyline sideways by a slow wobble and stretch its ends (the loose "rough" under a clean line). */
export const roughen = (poly: Polyline, seed: number, amp: number, overshoot: number): Polyline => {
  const n = poly.pts.length;
  const first = poly.pts[0] as Pt;
  const last = poly.pts[n - 1] as Pt;
  const t0 = tangentAt(poly.pts, 0);
  const t1 = tangentAt(poly.pts, n - 1);
  const pre = overshoot * (0.4 + 0.6 * Math.abs(wobble(seed + 3, 0.5)));
  const post = overshoot * (0.5 + 0.5 * Math.abs(wobble(seed + 4, 0.5)));
  const moved = poly.pts.map((pt, i) => {
    const tan = tangentAt(poly.pts, i);
    const off = amp * wobble(seed, (poly.s[i] as number) / 48) + amp * 0.35;
    return {x: pt.x - tan.y * off, y: pt.y + tan.x * off};
  });
  const extended: Pt[] = [
    {x: first.x - t0.x * pre, y: first.y - t0.y * pre},
    ...moved,
    {x: last.x + t1.x * post - t1.y * amp * 0.5, y: last.y + t1.y * post + t1.x * amp * 0.5},
  ];
  return resample(extended, undefined, poly.closed);
};
