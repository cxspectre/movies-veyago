// strokeMarks.ts — compile one StrokeSpec into timed pencil movements (rough passes, clean passes, hatch flicks…).
import {seedOf} from '../geometry/noise';
import {flattenPath, type Polyline, type Pt} from '../geometry/path';
import type {StrokeSpec} from '../types';
import {DEFAULT_HATCH_ANGLE, DEFAULT_HATCH_GAP, DEFAULT_SCRIBBLE_SIZE, hatchLines, scribbleAlong} from './fills';
import {roughen, shapeMark, type ShapeOptions} from './shape';
import type {PathMark, PathRole} from './types';

/** Relative hand speeds (px per unit time). Roughs and hatching go fast; dots go slowly. */
const SPEED: Record<PathRole, number> = {rough: 1.7, clean: 1, hatch: 2.3, scribble: 2.6, dotted: 0.75};
/** Time to lift, travel and land between two movements, in "px of drawing" equivalents. */
const LIFT_COST = 14;
const AIR_SPEED = 4;
const ROUGH_PRESSURE = 0.5;
const ROUGH_DEPOSIT = 0.7;
const ROUGH_AMP = 2.4;
const ROUGH_OVERSHOOT = 11;

type Draft = {role: PathRole; poly: Polyline; shape: ShapeOptions; strands: number; deposit: number};

const strandsFor = (width: number): number => (width >= 1.6 ? 3 : 2);

const roughDrafts = (s: StrokeSpec, polys: readonly Polyline[], seed: number): readonly Draft[] =>
  polys.map((poly, i) => ({
    role: 'rough' as const,
    poly: roughen(poly, seed + 31 * i, ROUGH_AMP + s.width * 0.5, ROUGH_OVERSHOOT),
    shape: {width: s.width * 1.1, pressure: ROUGH_PRESSURE * (s.pressure ?? 1), seed: seed + 57 * i, landing: 0.1, release: 0.5},
    strands: 1,
    deposit: ROUGH_DEPOSIT,
  }));

const mainDrafts = (s: StrokeSpec, polys: readonly Polyline[], seed: number): readonly Draft[] => {
  const pressure = s.pressure ?? 1;
  const style = s.style ?? 'line';
  if (style === 'hatch') {
    return hatchLines(polys, s.hatchAngle ?? DEFAULT_HATCH_ANGLE, s.hatchGap ?? DEFAULT_HATCH_GAP, seed).map((poly, i) => ({
      role: 'hatch' as const,
      poly,
      shape: {width: s.width, pressure: pressure * 0.85, seed: seed + i * 13, landing: 0.45, release: 0.18, releasePx: poly.length * 0.55},
      strands: 1,
      deposit: 1,
    }));
  }
  if (style === 'scribble') {
    return polys.map((p, i) => ({
      role: 'scribble' as const,
      poly: scribbleAlong(p, s.scribbleSize ?? DEFAULT_SCRIBBLE_SIZE, seed + i),
      shape: {width: s.width, pressure: pressure * 0.8, seed: seed + i * 17, landing: 0.2, release: 0.35},
      strands: 1,
      deposit: 1,
    }));
  }
  const role: PathRole = style === 'dotted' ? 'dotted' : 'clean';
  return polys.map((poly, i) => ({
    role,
    poly,
    shape: {width: s.width, pressure, seed: seed + i * 19},
    strands: role === 'dotted' ? 1 : strandsFor(s.width),
    deposit: 1,
  }));
};

const endPoints = (poly: Polyline): {a: Pt; b: Pt} => ({
  a: poly.pts[0] as Pt,
  b: poly.pts[poly.pts.length - 1] as Pt,
});

/** Split the stroke's [from, to] window across its movements by drawing length, speed and pen lifts. */
const allocate = (drafts: readonly Draft[], from: number, to: number): readonly {start: number; end: number}[] => {
  const costs = drafts.map((d, i) => {
    const prev = drafts[i - 1];
    const lift = prev ? LIFT_COST + Math.hypot(endPoints(d.poly).a.x - endPoints(prev.poly).b.x, endPoints(d.poly).a.y - endPoints(prev.poly).b.y) / AIR_SPEED : 0;
    return {lift, draw: Math.max(2, d.poly.length) / SPEED[d.role]};
  });
  const total = costs.reduce((a, c) => a + c.lift + c.draw, 0) || 1;
  const span = to - from;
  let acc = 0;
  return costs.map((c) => {
    acc += c.lift;
    const start = from + (acc / total) * span;
    acc += c.draw;
    return {start, end: from + (acc / total) * span};
  });
};

/** All pencil movements for one stroke, in drawing order. */
export const strokeMarks = (s: StrokeSpec): readonly PathMark[] => {
  const seed = seedOf(s.id);
  const polys = flattenPath(s.d);
  if (polys.length === 0) return [];
  const style = s.style ?? 'line';
  const wantsRough = s.rough === true && (style === 'line' || style === 'dotted');
  const drafts = [...(wantsRough ? roughDrafts(s, polys, seed) : []), ...mainDrafts(s, polys, seed)];
  const windows = allocate(drafts, Math.min(s.from, s.to), Math.max(s.from, s.to));
  return drafts.map((d, i) => {
    const w = windows[i] as {start: number; end: number};
    return {
      kind: 'path' as const,
      strokeId: s.id,
      ink: s.ink,
      role: d.role,
      seed: d.shape.seed,
      pts: shapeMark(d.poly, d.shape),
      length: d.poly.length,
      strands: d.strands,
      deposit: d.deposit,
      start: w.start,
      end: Math.max(w.end, w.start + 1e-6),
      order: i,
    };
  });
};
