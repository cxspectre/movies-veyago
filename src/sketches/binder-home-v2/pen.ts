// pen.ts — the drawing vocabulary of binder-home-v2: hand-drawn shapes placed on REAL screen rects (points),
// each carrying the rect it must land on so `alignment.ts` can measure how far the drawing strays from the screen.
import {drift, handCircle, handLine, handPath, label, seedOf, stroke, type Untimed, type UntimedLabel, type UntimedStroke, type XY} from '../../paper';
import {SCREEN_SCALE, screenPointToSketch, screenRectToSketch, type ScreenRect, type SketchRect} from './screen';

// ---- line weights (BIBLE §2.4, sketch px) ---------------------------------------------------------------------
export const WEIGHT = {
  device: 3.0,
  box: 2.2,
  text: 1.7,
  heading: 2.3,
  hatch: 1.2,
  accentCircle: 2.6,
} as const;

/** How a drawn shape is compared with its real rect: whole box, a text line's run, a label's glyphs, an icon
 * filling a glyph box, or a mark that only has to stay inside its tile. */
export type Fit = 'box' | 'line' | 'label' | 'icon' | 'inside';
export type Piece = {readonly item: Untimed; readonly target?: {readonly rect: ScreenRect; readonly fit: Fit}};

const ARC_STEP_DEG = 22.5;
const EDGE_STEP_PX = 34;
const CLOSE_OVERSHOOT_PX = 7;
const START_INSET_PX = 2.5;

// ---- path builders (sketch px) --------------------------------------------------------------------------------

const arc = (cx: number, cy: number, r: number, fromDeg: number, toDeg: number): readonly XY[] => {
  const n = Math.max(2, Math.round(Math.abs(toDeg - fromDeg) / ARC_STEP_DEG));
  return Array.from({length: n + 1}, (_, i) => {
    const a = ((fromDeg + ((toDeg - fromDeg) * i) / n) * Math.PI) / 180;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  });
};

const edge = (x0: number, y0: number, x1: number, y1: number): readonly XY[] => {
  const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / EDGE_STEP_PX));
  return Array.from({length: n}, (_, i) => [x0 + ((x1 - x0) * (i + 1)) / (n + 1), y0 + ((y1 - y0) * (i + 1)) / (n + 1)] as const);
};

/** The clean perimeter of a rounded rect, clockwise from the top edge just right of the top-left corner. */
const roundRectPoints = (r: SketchRect, radius: number): readonly XY[] => {
  const rad = Math.min(radius, r.w / 2, r.h / 2);
  const {x, y, w, h} = r;
  return [
    [x + rad, y],
    ...edge(x + rad, y, x + w - rad, y),
    ...arc(x + w - rad, y + rad, rad, -90, 0),
    ...edge(x + w, y + rad, x + w, y + h - rad),
    ...arc(x + w - rad, y + h - rad, rad, 0, 90),
    ...edge(x + w - rad, y + h, x + rad, y + h),
    ...arc(x + rad, y + h - rad, rad, 90, 180),
    ...edge(x, y + h - rad, x, y + rad),
    ...arc(x + rad, y + rad, rad, 180, 270),
  ];
};

/**
 * A rounded rect drawn in one confident movement: lands a touch inside the top edge, goes round once and runs on
 * past where it started (the closing overshoot), drifting very slightly as a hand does.
 */
export const roundRectD = (r: SketchRect, radius: number, seed: number, overshoot = CLOSE_OVERSHOOT_PX): string => {
  const pts = roundRectPoints(r, radius);
  const first = pts[0] as XY;
  const lead: XY = [first[0] + START_INSET_PX, first[1] + 0.6];
  const tail: XY = [first[0] + START_INSET_PX + overshoot, first[1] - 0.9];
  return handPath(drift([lead, ...pts.slice(1), first, tail], seed, 30, 0.7), seed, {wobble: 0.4});
};

/** A pill (fully rounded ends). */
export const pillD = (r: SketchRect, seed: number): string => roundRectD(r, Math.min(r.w, r.h) / 2, seed, Math.min(CLOSE_OVERSHOOT_PX, r.w * 0.1));

/** A pill that runs off the screen's right edge: top edge, round the left end, bottom edge. */
export const openPillD = (r: SketchRect, seed: number): string => {
  const rad = r.h / 2;
  const pts: readonly XY[] = [[r.x + r.w, r.y], ...arc(r.x + rad, r.y + rad, rad, -90, -270), [r.x + r.w, r.y + r.h]];
  return handPath(pts, seed, {wobble: 0.3});
};

/** A circle ring that overlaps its own start a little. */
export const ringD = (cx: number, cy: number, rx: number, ry: number, seed: number): string => handCircle(cx, cy, rx, ry, seed, {overlap: 0.1, wobble: 0.3});

/** A text placeholder line across a glyph run (sketch px), level, with the hand's small bow and overshoot. */
export const textLineD = (r: SketchRect, seed: number): string => {
  const y = r.y + r.h * 0.55;
  return handLine(r.x, y, r.x + r.w, y - 0.6, seed, {overshoot: 1.2, bow: Math.min(1.2, r.w * 0.008), wobble: 0.3});
};

// ---- pieces placed on screen rects (points in, sketch px out) -------------------------------------------------

const S = (r: ScreenRect): SketchRect => screenRectToSketch(r);

type StrokeOpts = Partial<Omit<UntimedStroke, 'id' | 'd'>>;

const piece = (item: Untimed, rect?: ScreenRect, fit?: Fit): Piece => (rect && fit ? {item, target: {rect, fit}} : {item});

/** A rounded box on a real frame. */
export const boxOn = (id: string, rect: ScreenRect, radiusPt: number, o: StrokeOpts = {}): Piece =>
  piece(stroke(id, roundRectD(S(rect), radiusPt * SCREEN_SCALE.x, seedOf(id)), {width: WEIGHT.box, ...o}), rect, 'box');

/** A pill on a real frame. */
export const pillOn = (id: string, rect: ScreenRect, o: StrokeOpts = {}): Piece =>
  piece(stroke(id, pillD(S(rect), seedOf(id)), {width: WEIGHT.box, ...o}), rect, 'box');

/** A circle inscribed in a real frame. */
export const circleOn = (id: string, rect: ScreenRect, o: StrokeOpts = {}): Piece => {
  const r = S(rect);
  return piece(stroke(id, ringD(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, r.h / 2, seedOf(id)), {width: WEIGHT.box, ...o}), rect, 'box');
};

/** A text line across a real glyph run. */
export const lineOn = (id: string, rect: ScreenRect, o: StrokeOpts = {}): Piece =>
  piece(stroke(id, textLineD(S(rect), seedOf(id)), {width: WEIGHT.text, pressure: 1.15, ...o}), rect, 'line');

/** Light hatching filling a real shape (style 'hatch': `d` is the region). */
export const hatchOn = (id: string, regionD: string, o: StrokeOpts = {}): Piece =>
  piece(stroke(id, regionD, {style: 'hatch', width: WEIGHT.hatch, pressure: 0.7, hatchGap: 3.2, ...o}));

/** A small icon drawn inside a real glyph box (any path builder in sketch px). */
export const iconOn = (id: string, rect: ScreenRect, build: (r: SketchRect, seed: number) => string, o: StrokeOpts & {fit?: Fit} = {}): Piece => {
  const {fit = 'icon', ...rest} = o;
  return piece(stroke(id, build(S(rect), seedOf(id)), {width: WEIGHT.text, ...rest}), rect, fit);
};

type LabelOpts = Partial<Omit<UntimedLabel, 'id' | 'text' | 'x' | 'y'>>;

/**
 * Hand lettering whose glyphs sit on a real glyph run: baseline-left at the rect's bottom-left (`baselinePt`
 * moves the baseline when the run has descenders), size as given (sketch px).
 */
export const letterOn = (id: string, text: string, rect: ScreenRect, size: number, o: LabelOpts & {baselinePt?: number} = {}): Piece => {
  const {baselinePt, ...rest} = o;
  const p = screenPointToSketch(rect.x, baselinePt ?? rect.y + rect.h);
  return piece(label(id, text, p.x, p.y, {size, face: 'patrick-400', ...rest}), rect, 'label');
};

export {handPath, handLine, drift, S as toSketch};
