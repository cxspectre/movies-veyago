// outline.ts — rounded outlines drawn as one hand movement: a polyline of corners, each corner rounded, the long
// runs drifting a little, the end running past where it started. Shared by Sketch owner A's pages.
import {drift, handPath, type XY} from '../../../paper';
import {hash01, hashSigned} from '../../../paper/geometry/noise';

export type OutlineOptions = {
  /** Corner radius in sketch px (each corner is clamped to half its shorter neighbouring run). */
  readonly radius?: number;
  /** Point wobble passed to handPath (default 0.5). */
  readonly wobble?: number;
  /** Sideways drift of long runs, px (default 0.9). */
  readonly drift?: number;
};

/** Arc samples per corner: tight corners get few points, so the hand does not dwell (and blot) in them. */
const cornerSamples = (radius: number): number => Math.max(2, Math.min(6, Math.round(radius / 7) + 1));
const DRIFT_STEP = 55;

const towards = (p: XY, q: XY, d: number): XY => {
  const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
  return [p[0] + ((q[0] - p[0]) / l) * d, p[1] + ((q[1] - p[1]) / l) * d];
};

/** A rounded corner at `p` between neighbours `a` and `b`: a quadratic arc sampled into a few points. */
const corner = (a: XY, p: XY, b: XY, radius: number): readonly XY[] => {
  const r = Math.min(radius, Math.hypot(a[0] - p[0], a[1] - p[1]) / 2, Math.hypot(b[0] - p[0], b[1] - p[1]) / 2);
  const s = towards(p, a, r);
  const e = towards(p, b, r);
  const n = cornerSamples(r);
  return Array.from({length: n}, (_, i): XY => {
    const t = i / (n - 1);
    const u = 1 - t;
    return [u * u * s[0] + 2 * u * t * p[0] + t * t * e[0], u * u * s[1] + 2 * u * t * p[1] + t * t * e[1]];
  });
};

/**
 * Hand path through `pts` with every interior point treated as a rounded corner. Long runs drift; the pencil
 * slows into corners so the engine's pressure model darkens them a touch (it reads corners from the geometry).
 */
export const roundedRun = (pts: readonly XY[], seed: number, o: OutlineOptions = {}): string => {
  const radius = o.radius ?? 6;
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (!first || !last) return '';
  const inner = pts.slice(1, -1).flatMap((p, i) => corner(pts[i] as XY, p, pts[i + 2] as XY, radius));
  const all: readonly XY[] = [first, ...inner, last];
  // Drift only straight-ish runs: corners are dense (short segments), so drift() leaves them alone.
  return handPath(drift(all, seed, DRIFT_STEP, o.drift ?? 0.9), seed, {wobble: o.wobble ?? 0.5});
};

/** Seeded small offset, px. */
export const nudge = (seed: number, i: number, amount: number): number => hashSigned(seed, i) * amount;

/**
 * A rounded rectangle drawn clockwise from just right of the top-left corner, in one movement, closing with an
 * overshoot past the start (the way a box is really drawn). Corners land a pixel or two off, never symmetric.
 */
export const roundBox = (x1: number, y1: number, x2: number, y2: number, radius: number, seed: number, o: OutlineOptions & {overshoot?: number} = {}): string => {
  const j = (i: number): number => nudge(seed, i, 1.3);
  const over = o.overshoot ?? Math.min(14, (x2 - x1) * 0.12);
  const startX = x1 + radius + 4 + hash01(seed, 40) * 10;
  return roundedRun(
    [
      [startX, y1 + j(1) * 0.5],
      [x2 + j(2), y1 + j(3)],
      [x2 + j(4), y2 + j(5)],
      [x1 + j(6), y2 + j(7)],
      [x1 + j(8), y1 + j(9)],
      [startX + over, y1 + 1.2 + j(10) * 0.4],
    ],
    seed,
    {...o, radius},
  );
};

/** Several separate movements joined into one stroke's path data (the pencil lifts between them). */
export const joinPaths = (...paths: readonly string[]): string => paths.filter(Boolean).join(' ');
