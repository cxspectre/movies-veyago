// handPath.ts — turns clean geometry into path data that reads as drawn by a hand: slight wobble on every
// point, smooth Catmull-Rom curves through them, never perfectly straight or perfectly closed.
import {hashSigned, noise1} from '../geometry/noise';

export type XY = readonly [number, number];

export type HandPathOptions = {
  /** Max random displacement of each point, px (default 1). */
  readonly wobble?: number;
  /** Join the end back to the start smoothly (default false; hand-drawn shapes usually overshoot instead). */
  readonly closed?: boolean;
  /** 0 = straight segments, 1 = full Catmull-Rom smoothness (default 1). */
  readonly smooth?: number;
};

const f2 = (v: number): string => (Math.round(v * 100) / 100).toString();

/** Jitter points deterministically (endpoints get half the wobble so joins stay where you put them). */
export const jitter = (points: readonly XY[], seed: number, amount: number): readonly XY[] =>
  points.map(([x, y], i) => {
    const k = i === 0 || i === points.length - 1 ? 0.5 : 1;
    return [x + hashSigned(seed, i * 2) * amount * k, y + hashSigned(seed, i * 2 + 1) * amount * k] as const;
  });

/** Insert points every `step` px along each segment, displaced sideways by slow noise (a hand's drift). */
export const drift = (points: readonly XY[], seed: number, step: number, amount: number): readonly XY[] =>
  points.flatMap(([x, y], i) => {
    const next = points[i + 1];
    if (!next) return [[x, y] as const];
    const len = Math.hypot(next[0] - x, next[1] - y);
    const n = Math.max(1, Math.round(len / step));
    const nx = -(next[1] - y) / (len || 1);
    const ny = (next[0] - x) / (len || 1);
    return Array.from({length: n}, (_, k) => {
      const t = k / n;
      const off = k === 0 ? 0 : noise1(seed + i * 31, (t * len) / 60) * amount * Math.sin(Math.PI * t);
      return [x + (next[0] - x) * t + nx * off, y + (next[1] - y) * t + ny * off] as const;
    });
  });

/** Smooth path data through points (Catmull-Rom as cubic Béziers), with deterministic wobble. */
export const handPath = (points: readonly XY[], seed: number, o: HandPathOptions = {}): string => {
  const pts = jitter(points, seed, o.wobble ?? 1);
  const first = pts[0];
  if (!first) return '';
  const smooth = (o.smooth ?? 1) / 6;
  const closed = o.closed ?? false;
  const at = (i: number): XY => {
    const n = pts.length;
    if (closed) return pts[((i % n) + n) % n] as XY;
    return pts[Math.max(0, Math.min(n - 1, i))] as XY;
  };
  const segments = closed ? pts.length : pts.length - 1;
  const body = Array.from({length: segments}, (_, i) => {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1: XY = [p1[0] + (p2[0] - p0[0]) * smooth, p1[1] + (p2[1] - p0[1]) * smooth];
    const c2: XY = [p2[0] - (p3[0] - p1[0]) * smooth, p2[1] - (p3[1] - p1[1]) * smooth];
    return `C ${f2(c1[0])} ${f2(c1[1])} ${f2(c2[0])} ${f2(c2[1])} ${f2(p2[0])} ${f2(p2[1])}`;
  });
  return `M ${f2(first[0])} ${f2(first[1])} ${body.join(' ')}${closed ? ' Z' : ''}`;
};

/** Straight segments (for sharp things like arrow heads), still slightly wobbled. */
export const handPolyline = (points: readonly XY[], seed: number, wobble = 0.6): string => {
  const pts = jitter(points, seed, wobble);
  return pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${f2(x)} ${f2(y)}`).join(' ');
};
