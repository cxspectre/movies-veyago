// conversion.ts — how the page turns to light, stroke by stroke (pure). Every stroke of binder-home-v2 gets a
// conversion start in stroke order (BIBLE 3, 5.1); at `t` each is some way through its 0.4 s re-trace. From that
// one number per stroke this module derives what the two renderers draw: the LIGHT items (the part behind the head,
// the head itself, text wiped in) and the GRAPHITE remainder (the part the head has not reached), so they can never
// disagree about where the head is.
import {compileSketch, markProgress, type GlyphMark, type Mark, type PathMark} from '../../paper';
import {indexAtTime, tipAt} from '../../paper/marks/sample';
import {metricsOf} from '../../paper/text/handLayout';
import type {MarkPoint} from '../../paper/marks/types';
import type {HairlineInk} from '../../glass';
import {HOME_GROUPS, PHONE_FRAME, type HomeRegion} from '../../sketches/binder-home-v2/layout';
import {spec} from '../../sketches/binder-home-v2/spec';
import {conversionStart, headAlpha, offPhoneLevel, snapState, STATUS_SNAP, strokeFresh, strokeReveal, type SnapState} from './timing';

export const OUTLINE_ID = 'frame-phone';

export type StrokeClock = {
  readonly id: string;
  readonly ink: HairlineInk;
  /** Module-local second the head starts re-tracing it. */
  readonly start: number;
  readonly region: HomeRegion | null;
  /** Lies outside the phone outline (the corner "2"): it fades with the paper. */
  readonly offPhone: boolean;
};

export type ItemStyle = {
  readonly ink: HairlineInk;
  /** Brightness level (1 settled, 1.2 fresh, 1.6 flare), see hairlineStyle. */
  readonly level: number;
  readonly alpha: number;
  /** Core width override in logical px (the outline thickening into the device edge); default HAIRLINE.widthPx. */
  readonly widthPx?: number;
};
export type LightPath = {readonly kind: 'path'; readonly m: PathMark; readonly local: number; readonly style: ItemStyle};
export type LightGlyph = {readonly kind: 'glyph'; readonly g: GlyphMark; readonly wipe: number; readonly style: ItemStyle};
export type HeadPoint = {readonly x: number; readonly y: number};
export type LightHead = {
  readonly kind: 'head';
  readonly x: number;
  readonly y: number;
  /** The path just behind the head (head first), sketch px: the comet's tail. */
  readonly tail: readonly HeadPoint[];
  readonly ink: HairlineInk;
  readonly alpha: number;
};
export type LightItem = LightPath | LightGlyph | LightHead;

type Span = {readonly start: number; readonly end: number};
type GlyphWipe = {readonly lo: number; readonly hi: number};
type StrokeMarks = {
  readonly clean: readonly PathMark[];
  readonly rough: readonly PathMark[];
  readonly glyphs: readonly GlyphMark[];
  /** Time span of the clean marks (the head's schedule within the stroke). */
  readonly span: Span;
  /** Per glyph, its x-run along the label's baseline; and the label's whole run. */
  readonly wipes: readonly GlyphWipe[];
  readonly run: GlyphWipe;
};

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const EPS = 1e-6;

// ---- the schedule (built once) --------------------------------------------------------------------------------

const ordered = [...spec.strokes.map((s) => ({id: s.id, ink: s.ink, from: s.from})), ...spec.labels.map((l) => ({id: l.id, ink: l.ink, from: l.from}))].sort(
  (a, b) => a.from - b.from,
);

const regionOf = (id: string): HomeRegion | null => HOME_GROUPS.find((g) => g.strokeIds.includes(id)) ?? null;

const marksByStroke = (): ReadonlyMap<string, readonly Mark[]> =>
  compileSketch(spec).reduce((acc, m) => acc.set(m.strokeId, [...(acc.get(m.strokeId) ?? []), m]), new Map<string, readonly Mark[]>());

const boundsOf = (marks: readonly Mark[]): {x0: number; y0: number; x1: number; y1: number} => {
  const pts = marks.flatMap((m) => (m.kind === 'path' ? m.pts.map((p) => ({x: p.x, y: p.y})) : [{x: m.x, y: m.y - m.size}, {x: m.x + m.size, y: m.y}]));
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return {x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys)};
};

const isOffPhone = (marks: readonly Mark[]): boolean => {
  const b = boundsOf(marks);
  const f = PHONE_FRAME;
  return b.x1 < f.x || b.x0 > f.x + f.w || b.y1 < f.y || b.y0 > f.y + f.h;
};

const glyphWipes = (glyphs: readonly GlyphMark[]): {wipes: readonly GlyphWipe[]; run: GlyphWipe} => {
  const first = glyphs[0];
  if (!first) return {wipes: [], run: {lo: 0, hi: 1}};
  const dir = {x: Math.cos(first.rotate), y: Math.sin(first.rotate)};
  const wipes = glyphs.map((g) => {
    const offset = (g.x - first.x) * dir.x + (g.y - first.y) * dir.y;
    const xs = g.pen.map((p) => p.x);
    return {lo: offset + Math.min(...xs), hi: offset + Math.max(...xs)};
  });
  return {wipes, run: {lo: Math.min(...wipes.map((w) => w.lo)), hi: Math.max(...wipes.map((w) => w.hi))}};
};

const strokeMarksOf = (marks: readonly Mark[]): StrokeMarks => {
  const paths = marks.filter((m): m is PathMark => m.kind === 'path');
  const clean = paths.filter((m) => m.role !== 'rough');
  const glyphs = marks.filter((m): m is GlyphMark => m.kind === 'glyph');
  const timed = clean.length > 0 ? clean : glyphs;
  const span = timed.reduce<Span>((s, m) => ({start: Math.min(s.start, m.start), end: Math.max(s.end, m.end)}), {start: Infinity, end: -Infinity});
  return {clean, rough: paths.filter((m) => m.role === 'rough'), glyphs, span, ...glyphWipes(glyphs)};
};

const byStroke = marksByStroke();

/** Every stroke and label of the page, in drawing order, with its conversion start. */
export const STROKE_CLOCKS: readonly StrokeClock[] = ordered.map((s, i) => ({
  id: s.id,
  ink: s.ink,
  start: conversionStart(i, ordered.length),
  region: regionOf(s.id),
  offPhone: isOffPhone(byStroke.get(s.id) ?? []),
}));

const STROKES: ReadonlyMap<string, StrokeMarks> = new Map(STROKE_CLOCKS.map((c) => [c.id, strokeMarksOf(byStroke.get(c.id) ?? [])]));

export const clockOf = (id: string): StrokeClock => {
  const c = STROKE_CLOCKS.find((s) => s.id === id);
  if (!c) throw new Error(`transition: no stroke ${id} in binder-home-v2`);
  return c;
};

/** The clean points of the phone outline (the stroke the lift-off morphs into the device edge). */
export const outlinePoints = (): readonly MarkPoint[] => (STROKES.get(OUTLINE_ID)?.clean[0]?.pts ?? []);

// ---- per-frame state -------------------------------------------------------------------------------------------

/** Local progress of a clean mark when the head is `reveal` of the way along the stroke's schedule. */
const cleanLocal = (m: Mark, s: StrokeMarks, reveal: number): number => markProgress(m, s.span.start + (s.span.end - s.span.start) * reveal);

/** How far the wipe has crossed a glyph (0..1 of its own x-run) when the label is `reveal` wiped. */
const glyphLocal = (s: StrokeMarks, i: number, reveal: number): number => {
  const w = s.wipes[i];
  if (!w) return reveal;
  const wipe = s.run.lo + (s.run.hi - s.run.lo) * reveal;
  return clamp01((wipe - w.lo) / Math.max(EPS, w.hi - w.lo));
};

const snapOf = (clock: StrokeClock, t: number): SnapState | null => {
  if (!clock.region) return null;
  return snapState(t, clock.region.snap ?? STATUS_SNAP);
};

const styleOf = (clock: StrokeClock, t: number): ItemStyle => {
  const snap = snapOf(clock, t);
  return {
    ink: clock.ink,
    level: strokeFresh(t, clock.start) * (snap?.flare ?? 1),
    alpha: (snap?.lineAlpha ?? 1) * (clock.offPhone ? offPhoneLevel(t) : 1),
  };
};

/** The comet behind the head runs this far back along the path (sketch px). */
const TAIL_SKETCH_PX = 34;

/** The points of `pts` behind index `i` (tip first) until the tail length is used up. */
const tailBehind = (tip: HeadPoint, pts: readonly MarkPoint[], i: number): readonly HeadPoint[] => {
  const tail: HeadPoint[] = [tip];
  let left = TAIL_SKETCH_PX;
  let last: HeadPoint = tip;
  for (let k = i; k >= 0 && left > 0; k -= 1) {
    const p = pts[k];
    if (!p) break;
    const d = Math.hypot(p.x - last.x, p.y - last.y);
    if (d >= left) {
      const f = left / Math.max(EPS, d);
      tail.push({x: last.x + (p.x - last.x) * f, y: last.y + (p.y - last.y) * f});
      break;
    }
    tail.push({x: p.x, y: p.y});
    left -= d;
    last = p;
  }
  return tail;
};

type Head = HeadPoint & {readonly tail: readonly HeadPoint[]};

/** Where the head is on a stroke `reveal` of the way through: the tip of the mark it is tracing, and its tail. */
const headOf = (s: StrokeMarks, reveal: number): Head | null => {
  for (const m of s.clean) {
    const local = cleanLocal(m, s, reveal);
    if (local >= 1) continue;
    const first = m.pts[0];
    if (local <= 0) return first ? {x: first.x, y: first.y, tail: [first]} : null;
    const {pt} = tipAt(m.pts, local);
    const tip = {x: pt.x, y: pt.y};
    return {...tip, tail: tailBehind(tip, m.pts, indexAtTime(m.pts, local))};
  }
  const g0 = s.glyphs[0];
  if (!g0) return null;
  const wipe = s.run.lo + (s.run.hi - s.run.lo) * reveal;
  const rise = -metricsOf(g0.face).capHeight * g0.size * 0.5;
  const c = Math.cos(g0.rotate);
  const sn = Math.sin(g0.rotate);
  const tip = {x: g0.x + wipe * c - rise * sn, y: g0.y + wipe * sn + rise * c};
  // The wipe runs along the baseline: the tail points back along it, no further than the label's start.
  const back = Math.min(TAIL_SKETCH_PX, Math.max(0, wipe - s.run.lo));
  return {...tip, tail: [tip, {x: tip.x - back * c, y: tip.y - back * sn}]};
};

export type LightSelection = {
  /** 'phone': strokes inside the outline; 'offPhone': the rest (the corner "2"). */
  readonly which: 'phone' | 'offPhone';
  /** Stroke ids drawn elsewhere this frame (the outline during the lift-off). */
  readonly exclude?: ReadonlySet<string>;
};

/** Everything the hairline renderer draws at `t`, in drawing order. */
export const lightItemsAt = (t: number, sel: LightSelection): readonly LightItem[] =>
  STROKE_CLOCKS.flatMap((clock): readonly LightItem[] => {
    if ((sel.which === 'offPhone') !== clock.offPhone || sel.exclude?.has(clock.id)) return [];
    const reveal = strokeReveal(t, clock.start);
    if (reveal <= 0) return [];
    const style = styleOf(clock, t);
    if (style.alpha <= 0) return [];
    const s = STROKES.get(clock.id);
    if (!s) return [];
    const paths: LightItem[] = s.clean.flatMap((m) => {
      const local = cleanLocal(m, s, reveal);
      return local > 0 ? [{kind: 'path', m, local, style}] : [];
    });
    const glyphs: LightItem[] = s.glyphs.flatMap((g, i) => {
      const wipe = glyphLocal(s, i, reveal);
      return wipe > 0 ? [{kind: 'glyph', g, wipe, style}] : [];
    });
    const alpha = headAlpha(reveal) * style.alpha;
    const head = alpha > 0 ? headOf(s, reveal) : null;
    return [...paths, ...glyphs, ...(head ? [{kind: 'head', x: head.x, y: head.y, tail: head.tail, ink: clock.ink, alpha} as LightHead] : [])];
  });

// ---- the graphite remainder --------------------------------------------------------------------------------------

/** The points from the head to the end of a movement, re-timed 0..1. */
const remainderPoints = (pts: readonly MarkPoint[], local: number): readonly MarkPoint[] => {
  const i = indexAtTime(pts, local);
  const {pt} = tipAt(pts, local);
  const rest = [pt, ...pts.slice(i + 1)];
  const t0 = pt.t;
  return rest.map((p) => ({...p, t: (p.t - t0) / Math.max(EPS, 1 - t0)}));
};

const pathRemainder = (m: PathMark, local: number): readonly PathMark[] => {
  if (local >= 1) return [];
  if (local <= 0) return [m];
  const pts = remainderPoints(m.pts, local);
  return pts.length >= 2 ? [{...m, pts, start: 0, end: 1}] : [];
};

const glyphRemainder = (g: GlyphMark, wipe: number): readonly GlyphMark[] => {
  if (wipe >= 1) return [];
  if (wipe <= 0) return [g];
  const pen = remainderPoints(g.pen, wipe);
  // Just under fully drawn: the engine then masks the glyph by this (remaining) pen path instead of filling it whole.
  return pen.length >= 2 ? [{...g, pen, start: 0, end: 1 + EPS}] : [];
};

/** The marks the pencil canvas still shows at `t`: whatever the heads have not reached. Draw them at progress 1. */
export const graphiteRemainderAt = (t: number): readonly Mark[] =>
  STROKE_CLOCKS.flatMap((clock): readonly Mark[] => {
    const s = STROKES.get(clock.id);
    if (!s) return [];
    const reveal = strokeReveal(t, clock.start);
    if (reveal <= 0) return [...s.rough, ...s.clean, ...s.glyphs];
    return [
      ...s.rough.flatMap((m) => pathRemainder(m, reveal)),
      ...s.clean.flatMap((m) => pathRemainder(m, cleanLocal(m, s, reveal))),
      ...s.glyphs.flatMap((g, i) => glyphRemainder(g, glyphLocal(s, i, reveal))),
    ];
  });

/** Whether anything graphite is left at `t` (the pencil canvas can be skipped once the page is all light). */
export const graphiteRemains = (t: number): boolean => STROKE_CLOCKS.some((c) => strokeReveal(t, c.start) < 1);
