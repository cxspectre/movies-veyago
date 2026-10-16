// sample.ts — where the pencil tip is inside a mark at a given local progress.
import type {GlyphMark, Mark, MarkPoint} from './types';

/** Index of the last point the tip has passed (binary search on the timing). */
export const indexAtTime = (pts: readonly MarkPoint[], t: number): number => {
  let lo = 0;
  let hi = pts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((pts[mid] as MarkPoint).t <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo;
};

/** The tip, interpolated between samples, plus the index of the sample before it. */
export const tipAt = (pts: readonly MarkPoint[], t: number): {pt: MarkPoint; index: number; angle: number} => {
  const i = indexAtTime(pts, t);
  const a = pts[i] as MarkPoint;
  const b = pts[Math.min(pts.length - 1, i + 1)] as MarkPoint;
  const span = b.t - a.t;
  const k = span > 0 ? Math.min(1, Math.max(0, (t - a.t) / span)) : 0;
  const pt = {x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, w: a.w + (b.w - a.w) * k, p: a.p + (b.p - a.p) * k, t};
  const prev = pts[Math.max(0, i - 2)] as MarkPoint;
  const next = pts[Math.min(pts.length - 1, i + 2)] as MarkPoint;
  return {pt, index: i, angle: Math.atan2(next.y - prev.y, next.x - prev.x)};
};

/** Glyph-local point -> sketch coordinates. */
export const glyphToSketch = (g: GlyphMark, x: number, y: number): {x: number; y: number} => {
  const c = Math.cos(g.rotate);
  const s = Math.sin(g.rotate);
  return {x: g.x + x * c - y * s, y: g.y + x * s + y * c};
};

/** Pencil tip of any mark at local progress (0-1), in sketch coordinates. */
export const markTip = (m: Mark, local: number): {x: number; y: number; angle: number; pressure: number} => {
  if (m.kind === 'path') {
    const {pt, angle} = tipAt(m.pts, local);
    return {x: pt.x, y: pt.y, angle, pressure: pt.p * m.deposit};
  }
  const {pt, angle} = tipAt(m.pen, local);
  const at = glyphToSketch(m, pt.x, pt.y);
  return {x: at.x, y: at.y, angle: angle + m.rotate, pressure: 0.85 * m.deposit};
};

export const markStart = (m: Mark): {x: number; y: number} => markTip(m, 0);
export const markEnd = (m: Mark): {x: number; y: number} => markTip(m, 1);
