// lightStroke.ts — a compiled pencil movement cut at an arc length, as short width-carrying segments (pure).
// The light renderer draws them as round-capped lines inside one opaque group, so the union reads as one stroke
// whose width follows the engine's pressure, sample by sample.
import type {MarkPoint, PathMark} from '../../paper';

export type LightSegment = {readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number; readonly w: number; readonly p: number};
export type LightCut = {readonly segments: readonly LightSegment[]; readonly head: MarkPoint | null};

/**
 * Light width from pressure, as a multiple of the nominal width: stronger than the graphite mapping so the pencil's
 * landing, its turns and the lift-off taper read in light (light has no grain to show pressure with).
 */
const WIDTH_FROM_PRESSURE = {floor: 0.32, gain: 0.64, min: 0.3, max: 1.24} as const;

export const lightWidth = (lineWidth: number, p: number): number =>
  lineWidth * Math.min(WIDTH_FROM_PRESSURE.max, Math.max(WIDTH_FROM_PRESSURE.min, WIDTH_FROM_PRESSURE.floor + WIDTH_FROM_PRESSURE.gain * p));

/** Cumulative arc length at every sample of a mark (px). */
export const arcLengths = (pts: readonly MarkPoint[]): readonly number[] =>
  pts.reduce<number[]>((acc, p, i) => {
    const prev = pts[i - 1];
    return [...acc, prev ? (acc[i - 1] ?? 0) + Math.hypot(p.x - prev.x, p.y - prev.y) : 0];
  }, []);

const lerpPoint = (a: MarkPoint, b: MarkPoint, k: number): MarkPoint => ({
  x: a.x + (b.x - a.x) * k,
  y: a.y + (b.y - a.y) * k,
  w: a.w + (b.w - a.w) * k,
  p: a.p + (b.p - a.p) * k,
  t: a.t + (b.t - a.t) * k,
});

const segment = (a: MarkPoint, b: MarkPoint): LightSegment => ({x1: a.x, y1: a.y, x2: b.x, y2: b.y, w: (a.w + b.w) / 2, p: (a.p + b.p) / 2});

/** The part of `mark` drawn when the head has covered `fraction` (0-1) of its arc length. */
export const cutAt = (mark: PathMark, lengths: readonly number[], fraction: number): LightCut => {
  const pts = mark.pts;
  const total = lengths[lengths.length - 1] ?? 0;
  if (fraction <= 0 || pts.length < 2 || total <= 0) return {segments: [], head: null};
  const s = Math.min(1, fraction) * total;
  const last = lengths.findIndex((l) => l >= s);
  const end = last < 0 ? pts.length - 1 : last;
  const full = pts.slice(0, end).flatMap((p, i) => {
    const next = pts[i + 1];
    return next && i + 1 < end ? [segment(p, next)] : [];
  });
  const a = pts[Math.max(0, end - 1)] as MarkPoint;
  const b = pts[end] as MarkPoint;
  const la = lengths[Math.max(0, end - 1)] ?? 0;
  const lb = lengths[end] ?? la;
  const head = lerpPoint(a, b, lb > la ? (s - la) / (lb - la) : 1);
  return {segments: [...full, segment(a, head)], head: fraction >= 1 ? null : head};
};
