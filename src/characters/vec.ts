// vec.ts — tiny vector helpers on the paper toolkit's XY tuples (pure).
import type {XY} from '../paper';

export const add = (a: XY, b: XY): XY => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: XY, b: XY): XY => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: XY, k: number): XY => [a[0] * k, a[1] * k];
export const len = (a: XY): number => Math.hypot(a[0], a[1]);
export const dot = (a: XY, b: XY): number => a[0] * b[0] + a[1] * b[1];
export const norm = (a: XY): XY => {
  const l = len(a);
  return l > 1e-9 ? [a[0] / l, a[1] / l] : [0, -1];
};
/** Rotate 90° (y-down screen space: the tangent turned to its left). */
export const perp = (a: XY): XY => [-a[1], a[0]];
export const lerp = (a: XY, b: XY, t: number): XY => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const rotate = (a: XY, rad: number): XY => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [a[0] * c - a[1] * s, a[0] * s + a[1] * c];
};
export const rotateAbout = (p: XY, o: XY, rad: number): XY => add(o, rotate(sub(p, o), rad));
/** A point `dist` from `from` at `deg` degrees, 0 = straight down the screen, positive = clockwise (toward +x). */
export const polar = (from: XY, deg: number, dist: number): XY => {
  const r = (deg * Math.PI) / 180;
  return [from[0] + Math.sin(r) * dist, from[1] + Math.cos(r) * dist];
};
export const RAD = Math.PI / 180;
