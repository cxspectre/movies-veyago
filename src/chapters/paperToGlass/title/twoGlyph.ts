// twoGlyph.ts — the "2" of the title, authored as ONE pencil movement (BIBLE section 3): a handwritten two with a
// small lead-in hook, a round shoulder, a slightly concave diagonal, a firm corner at the bottom left and a base
// stroke that lifts a touch at its end. It is paper-engine data (a SketchSpec) so the engine's pressure, tremor and
// timing physics shape it; `LightTwo` renders those marks as accent light.
import {compileSketch, handPath, type MarkPoint, type PathMark, type SketchSpec, type XY} from '../../../paper';

/** Ink centreline box: width as a fraction of the height (a hand's 2 is a little narrower than it is tall). */
const TWO_ASPECT = 0.66;
/** Forward slant of the hand, degrees. */
const SLANT_DEG = 7;
/** Max sideways wobble of the authored points, as a fraction of the height (the hand is never exact). */
const WOBBLE_OF_HEIGHT = 0.006;
/** The pencil presses a little harder than a normal line: it is the one confident gesture in the void. */
const TWO_PRESSURE = 1.1;
const TWO_SEED = 2;

/**
 * The shoulder and the diagonal, in a unit box (x right, y down, 0 = top of the 2, 1 = its baseline), before slant.
 * It starts low on the left (the lead-in), rises over the shoulder, turns down the right and runs into the diagonal.
 */
const BOWL: readonly XY[] = [
  [0.06, 0.33],
  [0.13, 0.17],
  [0.3, 0.05],
  [0.52, 0.015],
  [0.73, 0.06],
  [0.86, 0.19],
  [0.88, 0.33],
  [0.81, 0.47],
  [0.66, 0.62],
  [0.46, 0.76],
  [0.25, 0.885],
  [0.05, 0.99],
];

/** The base stroke from the corner, flat with the slightest rise and a lifted tail. */
const BASE: readonly XY[] = [
  [0.05, 0.99],
  [0.3, 0.972],
  [0.58, 0.966],
  [0.84, 0.962],
  [1.02, 0.935],
];

const slant = Math.tan((SLANT_DEG * Math.PI) / 180);

/** Unit point -> px in a box whose top is y = 0 and whose baseline (the lowest centreline point) is y = height. */
const place = (height: number) => ([u, v]: XY): XY => [(u * TWO_ASPECT + (1 - v) * slant) * height, v * height];

/**
 * Path data for the 2 at `height` px (centreline), one movement: the base continues from the corner with an `L`, so
 * the pencil never lifts (a cusp, not a new `M`).
 */
export const twoPathData = (height: number): string => {
  const wobble = height * WOBBLE_OF_HEIGHT;
  const bowl = handPath(BOWL.map(place(height)), TWO_SEED, {wobble});
  const base = handPath(BASE.map(place(height)), TWO_SEED + 1, {wobble: wobble * 0.6});
  return `${bowl} ${base.replace(/^M/, 'L')}`;
};

/** The 2 as a one-stroke page: nominal line width `lineWidth`, drawn across the whole page window (0-1). */
export const twoSpec = (height: number, lineWidth: number): SketchSpec => ({
  id: `title-two-${height}`,
  strokes: [{id: 'two', d: twoPathData(height), ink: 'accent', width: lineWidth, pressure: TWO_PRESSURE, from: 0, to: 1}],
  labels: [],
});

/** The single compiled pencil movement of the 2 (pressure, width and the engine's tremor per sample). */
export const twoMark = (spec: SketchSpec): PathMark => {
  const mark = compileSketch(spec).find((m): m is PathMark => m.kind === 'path');
  if (!mark) throw new Error(`title: the 2 (${spec.id}) compiled to no pencil movement`);
  return mark;
};

/** Ink bounds of the compiled 2: the centreline extended by each sample's half width (`widthOf(sample)`). */
export type InkBox = {readonly left: number; readonly right: number; readonly top: number; readonly bottom: number};

export const inkBox = (mark: PathMark, widthOf: (p: MarkPoint) => number = (p) => p.w): InkBox =>
  mark.pts.reduce<InkBox>(
    (b, p) => ({
      left: Math.min(b.left, p.x - widthOf(p) / 2),
      right: Math.max(b.right, p.x + widthOf(p) / 2),
      top: Math.min(b.top, p.y - widthOf(p) / 2),
      bottom: Math.max(b.bottom, p.y + widthOf(p) / 2),
    }),
    {left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity},
  );
