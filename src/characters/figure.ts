// figure.ts — turns a character's pose into engine strokes in sheet px: the body as one continuous path, the face,
// the accent detail; the boil (re-seeded wobble every 8 frames); and the flipbook pose swap (the changed segments
// erase from their end back to the shared anchor over 6 frames, then redraw from it over 9). Pure.
import {handPath, handPolyline, jitter, seedOf, type Ink, type SketchSpec, type StrokeSpec, type Untimed, type XY, sequence, stroke} from '../paper';
import {DESIGNS} from './designs';
import {ACCENT_ID, BODY_ID, FACE_ID, PROP_ID, type CharacterDesign, type CharacterId, type Figure, type Polyline, type PoseId, type Segment} from './types';

/** BIBLE4 §4: a swap is 0.5 s; the figure boils at 0.5 px, re-seeded every 8 frames. */
export const SWAP = {frames: 15, eraseFrames: 6, drawFrames: 9} as const;
export const BOIL = {px: 0.5, everyFrames: 8, storm: 3} as const;

const FACE_WIDTH = 0.82;
const ACCENT_WIDTH = 1.1;
const SAME_EPS = 0.05;
const DEDUPE_EPS = 0.3;
const SWAP_U = 0.5;
/** During a swap the face returns in the last part of the redraw, after the body. */
const FACE_AFTER = 0.7;

export type FigureOptions = {
  /** Ground point of the figure in the parent's px. */
  readonly x?: number;
  readonly y?: number;
  /** 1 = design-sheet size in sheet px. */
  readonly scale?: number;
  /** Default: the design's ink (sepia for Maya). */
  readonly ink?: Ink;
  /** Boil amplitude in sheet px (default BOIL.px); 0 for none. */
  readonly boil?: number;
  /** Which boil re-seed we are in (floor(frame / BOIL.everyFrames)). */
  readonly boilBucket?: number;
  /** Rough pass under the body (the first draw only, per the bible). */
  readonly rough?: boolean;
  readonly idPrefix?: string;
};

export type Placed = {
  readonly body: readonly Segment[];
  readonly face: readonly Polyline[];
  readonly accent: readonly Polyline[];
  readonly prop: readonly Polyline[];
  readonly design: CharacterDesign;
};

export const designOf = (id: CharacterId): CharacterDesign => DESIGNS[id];

export const figureOf = (character: CharacterId, pose: PoseId): Figure => {
  const build = DESIGNS[character].poses[pose];
  if (!build) throw new Error(`LineCharacter: ${character} has no pose "${pose}"`);
  return build();
};

const mapPts = (pts: readonly XY[], f: (p: XY) => XY): readonly XY[] => pts.map(f);

/** The figure in sheet px: hand wobble (in figure px, per segment name so shared segments match), scale, place, boil. */
export const placeFigure = (character: CharacterId, pose: PoseId, o: FigureOptions): Placed => {
  const fig = figureOf(character, pose);
  const s = o.scale ?? 1;
  const x = o.x ?? 0;
  const y = o.y ?? 0;
  const boil = o.boil ?? BOIL.px;
  const bucket = o.boilBucket ?? 0;
  const boilSeed = seedOf(`${character}-boil`) + bucket * 7919;
  const transform = (pts: readonly XY[], key: string, wobble: number): readonly XY[] => {
    const wobbled = jitter(pts, seedOf(`${character}-${key}`), wobble);
    const placed = mapPts(wobbled, (p) => [x + p[0] * s, y + p[1] * s]);
    return boil > 0 ? jitter(placed, boilSeed + seedOf(key), boil) : placed;
  };
  return {
    design: DESIGNS[character],
    body: fig.body.map((seg) => ({name: seg.name, pts: transform(seg.pts, seg.name, fig.wobble)})),
    face: fig.face.map((f, i) => ({...f, pts: transform(f.pts, `face-${i}`, fig.wobble * 0.5)})),
    accent: fig.accent.map((a, i) => ({...a, pts: transform(a.pts, `accent-${i}`, fig.wobble * 0.5)})),
    prop: (fig.prop ?? []).map((a, i) => ({...a, pts: transform(a.pts, `prop-${i}`, fig.wobble * 0.7)})),
  };
};

const dedupe = (pts: readonly XY[]): readonly XY[] =>
  pts.filter((p, i) => i === 0 || Math.hypot(p[0] - (pts[i - 1] as XY)[0], p[1] - (pts[i - 1] as XY)[1]) > DEDUPE_EPS);

const pathOf = (pl: Polyline, seed: number): string => {
  const pts = dedupe(pl.pts);
  if (pts.length < 2) return '';
  return (pl.smooth ?? 1) > 0 ? handPath(pts, seed, {wobble: 0, smooth: pl.smooth ?? 1, closed: pl.closed}) : handPolyline(pts, seed, 0);
};

const bodyPath = (segments: readonly Segment[], seed: number): string => pathOf({pts: segments.flatMap((s) => s.pts), smooth: 1}, seed);

const accentPath = (accent: readonly Polyline[], seed: number): string => accent.map((a, i) => pathOf(a, seed + i)).filter((d) => d.length > 0).join(' ');

/** Props (the chair, the bed) are drawings, so they are graphite whoever sits on them (BIBLE4 §3 rule 2). */
const PROP_INK: Ink = 'graphite';
const PROP_WIDTH = 0.8;

const widthOf = (d: CharacterDesign, scale: number): number => d.lineWidth * scale;

/** The character as untimed strokes (body, face strokes, accent) for anyone composing a bigger page. */
export const figureItems = (character: CharacterId, pose: PoseId, o: FigureOptions = {}): readonly Untimed[] => {
  const f = placeFigure(character, pose, o);
  const prefix = o.idPrefix ?? `${character}-${pose}`;
  const ink = o.ink ?? f.design.ink;
  const w = widthOf(f.design, o.scale ?? 1);
  const seed = seedOf(prefix);
  return [
    stroke(`${prefix}-${BODY_ID}`, bodyPath(f.body, seed), {ink, width: w, rough: o.rough ?? false}),
    stroke(`${prefix}-${PROP_ID}`, accentPath(f.prop, seed + 61), {ink: PROP_INK, width: w * PROP_WIDTH, rough: o.rough ?? false}),
    ...f.face.map((pl, i) => stroke(`${prefix}-${FACE_ID}-${i}`, pathOf(pl, seed + 11 + i), {ink, width: w * FACE_WIDTH, pressure: 0.9})),
    stroke(`${prefix}-${ACCENT_ID}`, accentPath(f.accent, seed + 41), {ink: 'accent', width: w * ACCENT_WIDTH}),
  ].filter((s) => s.d.length > 0);
};

/** A page with the character drawing on over [0, 1] of its drawFrames: body, then the face, then the accent. */
export const drawOnSpec = (character: CharacterId, pose: PoseId, o: FigureOptions = {}): SketchSpec => ({
  id: `${o.idPrefix ?? character}-${pose}`,
  ...sequence(figureItems(character, pose, {rough: true, ...o}), 0, 1, 0.08),
  labels: [],
});

const samePts = (a: readonly XY[], b: readonly XY[]): boolean =>
  a.length === b.length && a.every((p, i) => Math.abs(p[0] - (b[i] as XY)[0]) < SAME_EPS && Math.abs(p[1] - (b[i] as XY)[1]) < SAME_EPS);

/** The range [first, last] of body segments that differ between two placed poses (null when nothing differs). */
export const changedRange = (from: Placed, to: Placed): readonly [number, number] | null => {
  const n = Math.max(from.body.length, to.body.length);
  const diff = Array.from({length: n}, (_, i) => !samePts(from.body[i]?.pts ?? [], to.body[i]?.pts ?? []));
  const first = diff.indexOf(true);
  if (first < 0) return null;
  return [first, diff.lastIndexOf(true)];
};

/** A stroke window around SWAP_U so that the stroke shows exactly `p` (0-1) of itself at page progress SWAP_U. */
const windowAt = (p: number): {from: number; to: number} => {
  const k = Math.min(1, Math.max(0, p));
  return {from: SWAP_U - SWAP_U * k, to: SWAP_U + (1 - SWAP_U) * (1 - k)};
};

const timed = (id: string, d: string, ink: Ink, width: number, p: number, pressure?: number): readonly StrokeSpec[] =>
  d.length > 0 && p > 0 ? [{id, d, ink, width, ...windowAt(p), pressure}] : [];

/** Erase (0-1) and draw (0-1) progress of a swap at swap progress s (0-1 over SWAP.frames). */
export const swapPhase = (s: number): {erase: number; draw: number} => {
  const f = s * SWAP.frames;
  return {erase: Math.min(1, Math.max(0, f / SWAP.eraseFrames)), draw: Math.min(1, Math.max(0, (f - SWAP.eraseFrames) / SWAP.drawFrames))};
};

/**
 * The flipbook swap at progress s: unchanged segments hold; the changed range of the old pose retracts from its end
 * back to the anchor (its start) while erase runs 0→1, then the new range draws from the anchor while draw runs 0→1.
 * The face and the accent follow the head: they vanish with the erase and return with the draw when they moved.
 * Render it with page progress SWAP_U (`swapSpec(...).progress`).
 */
export const swapSpec = (character: CharacterId, from: PoseId, to: PoseId, s: number, o: FigureOptions = {}): SketchSpec & {progress: number} => {
  const a = placeFigure(character, from, o);
  const b = placeFigure(character, to, o);
  const prefix = o.idPrefix ?? `${character}-${from}-${to}`;
  const ink = o.ink ?? a.design.ink;
  const w = widthOf(a.design, o.scale ?? 1);
  const seed = seedOf(prefix);
  const {erase, draw} = swapPhase(s);
  const range = changedRange(a, b);
  const [i0, i1] = range ?? [b.body.length, b.body.length - 1];
  const propMoved = a.prop.length !== b.prop.length || !a.prop.every((pl, i) => samePts(pl.pts, b.prop[i]?.pts ?? []));
  const propOf = (p: Placed, pr: number, tag: string): readonly StrokeSpec[] => timed(`${prefix}-${tag}-prop`, accentPath(p.prop, seed + 61), PROP_INK, w * PROP_WIDTH, pr);
  const faceMoved = !a.face.every((pl, i) => samePts(pl.pts, b.face[i]?.pts ?? [])) || a.face.length !== b.face.length;
  const faceOf = (p: Placed, pr: number, tag: string): readonly StrokeSpec[] => [
    ...p.face.flatMap((pl, i) => timed(`${prefix}-${tag}-face-${i}`, pathOf(pl, seed + 11 + i), ink, w * FACE_WIDTH, pr, 0.9)),
    ...timed(`${prefix}-${tag}-accent`, accentPath(p.accent, seed + 41), 'accent', w * ACCENT_WIDTH, pr),
  ];
  const strokes: readonly StrokeSpec[] = [
    ...timed(`${prefix}-prefix`, bodyPath(b.body.slice(0, i0), seed + 1), ink, w, 1),
    ...timed(`${prefix}-old`, bodyPath(a.body.slice(i0, i1 + 1), seed + 2), ink, w, 1 - erase),
    ...timed(`${prefix}-new`, bodyPath(b.body.slice(i0, i1 + 1), seed + 3), ink, w, draw),
    ...timed(`${prefix}-suffix`, bodyPath(b.body.slice(i1 + 1), seed + 4), ink, w, 1),
    ...(propMoved ? [...propOf(a, 1 - erase, 'old'), ...propOf(b, draw, 'new')] : propOf(b, 1, 'held')),
    ...(faceMoved ? [...faceOf(a, 1 - erase, 'old'), ...faceOf(b, Math.max(0, (draw - FACE_AFTER) / (1 - FACE_AFTER)), 'new')] : faceOf(b, 1, 'held')),
  ];
  return {id: prefix, strokes, labels: [], progress: SWAP_U};
};

export type Bounds = {readonly x0: number; readonly y0: number; readonly x1: number; readonly y1: number};

/** Bounding box of placed figures (sheet px), grown by `margin`. */
export const boundsOf = (figures: readonly Placed[], margin: number): Bounds => {
  const pts = figures.flatMap((f) => [...f.body.flatMap((s) => s.pts), ...f.face.flatMap((p) => p.pts), ...f.accent.flatMap((p) => p.pts), ...f.prop.flatMap((p) => p.pts)]);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return {x0: Math.min(...xs) - margin, y0: Math.min(...ys) - margin, x1: Math.max(...xs) + margin, y1: Math.max(...ys) + margin};
};

/** Translate a spec's strokes by (dx, dy): strokes are path data, so this rewrites every coordinate. */
export const translateSpec = (spec: SketchSpec, dx: number, dy: number): SketchSpec => ({
  ...spec,
  strokes: spec.strokes.map((s) => ({...s, d: translatePath(s.d, dx, dy)})),
});

const NUMBER = /-?\d*\.?\d+(?:e[-+]?\d+)?/g;
const translatePath = (d: string, dx: number, dy: number): string => {
  let i = 0;
  return d.replace(NUMBER, (n) => {
    const v = Number(n) + (i % 2 === 0 ? dx : dy);
    i += 1;
    return (Math.round(v * 100) / 100).toString();
  });
};
