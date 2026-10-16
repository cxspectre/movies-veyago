// glyphs.ts — small things a quick pencil draws over and over on Sketch owner A's pages: a plus, text-line
// placeholders, a tick, a bell, an envelope, a folder, the emergency card. All deterministic by seed.
import {handLine, handPath, handPolyline, type XY} from '../../../paper';
import {hashSigned} from '../../../paper/geometry/noise';
import {joinPaths, roundBox, roundedRun} from './outline';

/** A plus sign in a size x size box with its top-left at (x, y): the down stroke, then the across stroke. */
export const plusSign = (x: number, y: number, size: number, seed: number): string => {
  const cx = x + size / 2 + hashSigned(seed, 1) * 0.6;
  const cy = y + size / 2 + hashSigned(seed, 2) * 0.6;
  const h = size / 2;
  return joinPaths(
    handLine(cx + 0.6, cy - h, cx - 0.4, cy + h, seed, {overshoot: 0.5, bow: 0.4}),
    handLine(cx - h - 0.5, cy + 0.8, cx + h + 0.5, cy - 0.4, seed + 1, {overshoot: 1, bow: -0.3}),
  );
};

/** Placeholder text lines: one movement per line, left to right, all starting at x. */
export const textLines = (x: number, rows: readonly (readonly [y: number, x2: number])[], seed: number): string =>
  joinPaths(
    ...rows.map(([y, x2], i) =>
      handLine(x + hashSigned(seed, i) * 1.5, y, x2, y + hashSigned(seed, i + 9) * 1.2, seed + i * 7, {overshoot: 1.5, bow: 0.6, wobble: 0.35}),
    ),
  );

/**
 * A tick in a 26x22 box centred on (cx, cy): a short stroke down into the knee, then the long flick up and out.
 * One quick movement (give it a short window).
 */
export const tickMark = (cx: number, cy: number, seed: number, w = 26, h = 22): string =>
  handPath(
    [
      [cx - w * 0.5, cy - h * 0.02],
      [cx - w * 0.3, cy + h * 0.22],
      [cx - w * 0.14, cy + h * 0.46],
      [cx - w * 0.04, cy + h * 0.38],
      [cx + w * 0.22, cy - h * 0.06],
      [cx + w * 0.52, cy - h * 0.52],
    ],
    seed,
    {wobble: 0.35, smooth: 0.7},
  );

/** A filled dot: a tight spiral from radius r inwards (how a pencil fills a dot). */
export const dot = (cx: number, cy: number, r: number, seed: number): string => {
  const n = 16;
  const pts = Array.from({length: n + 1}, (_, i): XY => {
    const t = i / n;
    const a = -2.4 - t * Math.PI * 4.2;
    const rr = r * (1 - t * 0.8);
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  });
  return handPath(pts, seed, {wobble: 0.15});
};

/**
 * A bell `w` wide whose rim sits at y = baseY, centred on cx: one movement up the left flank, over the dome and down
 * the right flank (flaring out at the rim), then the rim line, the knob on top and the clapper (its centre 2.4 radii
 * under the rim).
 */
export const bellGlyph = (cx: number, baseY: number, w: number, h: number, seed: number, clapperR = w * 0.07): string => {
  const hw = w / 2;
  const body = handPath(
    [
      [cx - hw, baseY + h * 0.01],
      [cx - hw * 0.78, baseY - h * 0.1],
      [cx - hw * 0.68, baseY - h * 0.38],
      [cx - hw * 0.6, baseY - h * 0.66],
      [cx - hw * 0.36, baseY - h * 0.86],
      [cx + hw * 0.02, baseY - h * 0.92],
      [cx + hw * 0.38, baseY - h * 0.85],
      [cx + hw * 0.61, baseY - h * 0.64],
      [cx + hw * 0.7, baseY - h * 0.36],
      [cx + hw * 0.8, baseY - h * 0.09],
      [cx + hw * 1.02, baseY + h * 0.02],
    ],
    seed,
    {wobble: Math.max(0.2, w * 0.006)},
  );
  const rim = handLine(cx - hw * 1.08, baseY + h * 0.03, cx + hw * 1.1, baseY + h * 0.01, seed + 3, {overshoot: 1, bow: -0.5});
  const knob = handPath(
    [
      [cx - hw * 0.1, baseY - h * 0.92],
      [cx - hw * 0.1, baseY - h * 1.04],
      [cx + hw * 0.06, baseY - h * 1.07],
      [cx + hw * 0.12, baseY - h * 0.93],
    ],
    seed + 5,
    {wobble: 0.2},
  );
  return joinPaths(body, rim, knob, dot(cx + 0.5, baseY + clapperR * 2.4, clapperR, seed + 7));
};

/** An envelope: the box, then the flap as one V from the top corners to just above the middle. */
export const envelope = (x1: number, y1: number, x2: number, y2: number, seed: number, radius = 4): string => {
  const mx = (x1 + x2) / 2 + hashSigned(seed, 3) * 2;
  const my = y1 + (y2 - y1) * 0.56;
  return joinPaths(
    roundBox(x1, y1, x2, y2, radius, seed),
    handPolyline(
      [
        [x1 + 3, y1 + 3],
        [mx, my],
        [x2 - 2, y1 + 2],
      ],
      seed + 2,
      0.5,
    ),
  );
};

/** A folder: one movement up the left side, over the tab, down its slope, along the top, round and back. */
export const folder = (x1: number, tabTop: number, tabRight: number, top: number, x2: number, y2: number, seed: number): string =>
  roundedRun(
    [
      [x1 + 1, y2 + 1],
      [x1, tabTop],
      [tabRight, tabTop + 0.6],
      [tabRight + (top - tabTop) * 1.1, top],
      [x2, top + 0.6],
      [x2 + 0.5, y2],
      [x1 - 4, y2 + 1.4],
    ],
    seed,
    {radius: 4, wobble: 0.4},
  );

/** Barb half-angle of an arrowhead, radians. */
const BARB_ANGLE = 0.5;

/**
 * A loose arrow through `pts` (a smooth hand curve) and a two-barb head `head` px long at the last point, aligned with
 * the curve's final direction. Draw `shaft` first, then `head` (one quick movement: barb, tip, barb).
 */
export const curvedArrow = (pts: readonly XY[], seed: number, head = 16): {shaft: string; head: string} => {
  const tip = pts[pts.length - 1] as XY;
  const before = pts[pts.length - 2] as XY;
  const dir = Math.atan2(tip[1] - before[1], tip[0] - before[0]);
  const barb = (sign: number): XY => {
    const a = dir + Math.PI + sign * (BARB_ANGLE + hashSigned(seed, sign + 4) * 0.07);
    const l = head * (1 + hashSigned(seed, sign + 8) * 0.08);
    return [tip[0] + Math.cos(a) * l, tip[1] + Math.sin(a) * l];
  };
  return {
    shaft: handPath(pts, seed, {wobble: 0.6}),
    head: handPolyline([barb(1), [tip[0] + Math.cos(dir) * 1.5, tip[1] + Math.sin(dir) * 1.5], barb(-1)], seed + 3, 0.5),
  };
};

export type CardLayout = {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly radius: number;
  /** Top-left of the plus, and its size. */
  readonly plus: readonly [x: number, y: number, size: number];
  /** Left edge of the text lines and each row's [y, right end]. */
  readonly linesX: number;
  readonly rows: readonly (readonly [y: number, x2: number])[];
};

/** The emergency card as three movements: outline, plus, text lines. Returns the three paths separately. */
export const cardParts = (c: CardLayout, seed: number): {outline: string; plus: string; lines: string} => ({
  outline: roundBox(c.x1, c.y1, c.x2, c.y2, c.radius, seed),
  plus: plusSign(c.plus[0], c.plus[1], c.plus[2], seed + 11),
  lines: textLines(c.linesX, c.rows, seed + 21),
});
