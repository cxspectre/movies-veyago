// alignment.ts — how far each drawn shape strays from the real element it stands for (pure; used by the Check
// composition and printed by `npx tsx src/sketches/binder-home-v2/printAlignment.ts`).
import {flattenPath, measureHand, type LabelSpec, type StrokeSpec} from '../../paper';
import {metricsOf} from '../../paper/text/handLayout';
import type {Fit, Piece} from './pen';
import {HOME_LAYOUT, SCREEN_SCALE, screenRectToSketch, type SketchRect} from './screen';
import {PIECES} from './spec';

export type AlignmentRow = {
  readonly id: string;
  readonly fit: Fit;
  /** Largest edge distance between the drawn shape and its mapped real frame, sketch px. */
  readonly errorPx: number;
  /** The same in screen points. */
  readonly errorPt: number;
  readonly drawn: SketchRect;
  readonly target: SketchRect;
};

const boundsOf = (pts: readonly {x: number; y: number}[]): SketchRect => {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  return {x: x0, y: y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0};
};

const strokeBounds = (s: StrokeSpec): SketchRect => boundsOf(flattenPath(s.d).flatMap((p) => p.pts));

/** The lettering's glyph run: from the anchor to its measured width, cap height above the baseline. */
const labelBounds = (l: LabelSpec): SketchRect => {
  const face = l.face ?? 'caveat-500';
  const cap = metricsOf(face).capHeight * l.size;
  return {x: l.x, y: l.y - cap, w: measureHand(l.text, l.size, face), h: cap};
};

const edgeError = (a: SketchRect, b: SketchRect): number =>
  Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.x + a.w - (b.x + b.w)), Math.abs(a.y + a.h - (b.y + b.h)));

/** A text line is right when it spans the run end to end and stays inside the run's height. */
const lineError = (a: SketchRect, b: SketchRect): number => {
  const outside = Math.max(0, b.y - a.y, a.y + a.h - (b.y + b.h));
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.x + a.w - (b.x + b.w)), outside);
};

/** A mark inside a tile is right when no part of it leaves the tile. */
const insideError = (a: SketchRect, b: SketchRect): number =>
  Math.max(0, b.x - a.x, b.y - a.y, a.x + a.w - (b.x + b.w), a.y + a.h - (b.y + b.h));

const ERROR_OF: Record<Fit, (a: SketchRect, b: SketchRect) => number> = {
  box: edgeError,
  icon: edgeError,
  label: edgeError,
  line: lineError,
  inside: insideError,
};

const rowOf = (p: Piece): AlignmentRow | null => {
  if (!p.target) return null;
  const target = screenRectToSketch(p.target.rect);
  const drawn = p.item.kind === 'label' ? labelBounds({...p.item, from: 0, to: 1}) : strokeBounds({...p.item, from: 0, to: 1});
  const errorPx = ERROR_OF[p.target.fit](drawn, target);
  return {id: p.item.id, fit: p.target.fit, errorPx, errorPt: errorPx / SCREEN_SCALE.x, drawn, target};
};

export const ALIGNMENT: readonly AlignmentRow[] = PIECES.flatMap((p) => {
  const r = rowOf(p);
  return r ? [r] : [];
});

export const maxError = (rows: readonly AlignmentRow[], fits?: readonly Fit[]): AlignmentRow | undefined =>
  rows.filter((r) => !fits || fits.includes(r.fit)).reduce<AlignmentRow | undefined>((m, r) => (!m || r.errorPx > m.errorPx ? r : m), undefined);

/**
 * The mapping itself: with the real still stretched into SCREEN_AREA (as Check and the transition must do) every
 * mapped frame lands on its pixels exactly. If instead the still is drawn at its own aspect, fitted to the area's
 * height and centred, frames drift by up to this many sketch px at the screen's side edges.
 */
export const ASPECT_FIT_DRIFT_PX = ((SCREEN_SCALE.x - SCREEN_SCALE.y) * HOME_LAYOUT.screen.wPt) / 2;
