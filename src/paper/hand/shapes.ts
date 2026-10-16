// shapes.ts — the hand-drawing toolkit: lines, boxes, circles, arrows, ticks… as StrokeSpec `d` strings with
// controlled imperfection (bow, overshoot at corners, an unclosed circle that overlaps itself). All deterministic.
import {hash01, hashSigned} from '../geometry/noise';
import {drift, handPath, handPolyline, type XY} from './handPath';

export type LineOptions = {
  /** Sideways bow at the middle, px (default: ~1% of the length, random side). */
  readonly bow?: number;
  /** How far the line runs past its end, px (default 2). Starts slightly early by a third of this. */
  readonly overshoot?: number;
  readonly wobble?: number;
};

const unit = (x: number, y: number): XY => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};

/** A single hand-drawn straight line. */
export const handLine = (x1: number, y1: number, x2: number, y2: number, seed: number, o: LineOptions = {}): string => {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const [dx, dy] = unit(x2 - x1, y2 - y1);
  const bow = o.bow ?? len * 0.012 * (hash01(seed, 1) < 0.5 ? -1 : 1);
  const over = o.overshoot ?? 2;
  const pts: XY[] = [
    [x1 - dx * over * 0.3, y1 - dy * over * 0.3],
    [x1 + (x2 - x1) * 0.5 - dy * bow, y1 + (y2 - y1) * 0.5 + dx * bow],
    [x2 + dx * over, y2 + dy * over],
  ];
  return handPath(drift(pts, seed, Math.max(20, len / 6), Math.min(1.4, len / 120)), seed, {wobble: o.wobble ?? 0.5});
};

/** A dotted line (render it with style: 'dotted'). */
export const handDottedLine = (x1: number, y1: number, x2: number, y2: number, seed: number): string =>
  handLine(x1, y1, x2, y2, seed, {overshoot: 0, wobble: 0.4});

/** An underline that rises a touch and flicks off at the end. */
export const handUnderline = (x: number, y: number, width: number, seed: number): string =>
  handPath(
    [
      [x, y],
      [x + width * 0.5, y + 1 + hashSigned(seed, 3)],
      [x + width, y - 2],
      [x + width + 6, y - 5],
    ],
    seed,
    {wobble: 0.6},
  );

export type RectOptions = {
  /** Corner rounding, px (default 4). */
  readonly radius?: number;
  /** How far the closing stroke runs past the start corner, px (default 7). */
  readonly overshoot?: number;
  readonly wobble?: number;
};

/** A box drawn in one continuous movement, clockwise from the top-left, overshooting where it closes. */
export const handRect = (x: number, y: number, w: number, h: number, seed: number, o: RectOptions = {}): string => {
  const r = o.radius ?? 4;
  const over = o.overshoot ?? 7;
  const j = (k: number): number => hashSigned(seed, k) * 1.2;
  const pts: XY[] = [
    [x + r * 1.5, y + j(1)],
    [x + w - r, y + j(2)],
    [x + w + j(3) * 0.4, y + r],
    [x + w + j(4), y + h - r],
    [x + w - r, y + h + j(5) * 0.4],
    [x + r, y + h + j(6)],
    [x + j(7) * 0.4, y + h - r],
    [x + j(8), y + r],
    [x + r * 1.2, y + j(9) * 0.6],
    [x + r * 1.5 + over, y + j(10) * 0.6 + 0.8],
  ];
  return handPath(drift(pts, seed + 1, 60, 0.8), seed, {wobble: o.wobble ?? 0.6});
};

/** A box drawn as four separate lines that cross at the corners (a looser, sketchier box). Returns 4 paths. */
export const handRectStrokes = (x: number, y: number, w: number, h: number, seed: number, overshoot = 5): readonly string[] => [
  handLine(x - overshoot * 0.5, y, x + w + overshoot, y, seed + 1, {overshoot: 0}),
  handLine(x + w, y - overshoot * 0.5, x + w, y + h + overshoot, seed + 2, {overshoot: 0}),
  handLine(x + w + overshoot * 0.5, y + h, x - overshoot, y + h, seed + 3, {overshoot: 0}),
  handLine(x, y + h + overshoot * 0.5, x, y - overshoot, seed + 4, {overshoot: 0}),
];

export type CircleOptions = {
  /** Extra turn past the start (default 0.12 turns): circles drawn by hand never close exactly. */
  readonly overlap?: number;
  /** Start angle, degrees (default about 10 o'clock, varied by the seed). */
  readonly startAngle?: number;
  readonly wobble?: number;
};

/** An ellipse ring drawn in one movement, counter-clockwise like most right-handed circles, overlapping its start. */
export const handCircle = (cx: number, cy: number, rx: number, ry: number, seed: number, o: CircleOptions = {}): string => {
  const turns = 1 + (o.overlap ?? 0.12);
  const start = ((o.startAngle ?? -150 + hashSigned(seed, 1) * 25) * Math.PI) / 180;
  const n = Math.max(10, Math.round(turns * 14));
  const pts = Array.from({length: n + 1}, (_, i): XY => {
    const t = i / n;
    const a = start - t * turns * Math.PI * 2;
    const grow = 1 + (t - 0.5) * 0.07 + hashSigned(seed, i + 7) * 0.012;
    return [cx + Math.cos(a) * rx * grow, cy + Math.sin(a) * ry * grow];
  });
  return handPath(pts, seed, {wobble: o.wobble ?? 0.5});
};

export type ArrowOptions = {
  /** Length of each barb, px (default 14). */
  readonly head?: number;
  /** Curvature of the shaft as a fraction of its length (default 0.06; negative bends the other way). */
  readonly bend?: number;
};

/** An arrow: a gently curved shaft and a two-barb head drawn as one movement. Draw `shaft` first, then `head`. */
export const handArrow = (x1: number, y1: number, x2: number, y2: number, seed: number, o: ArrowOptions = {}): {shaft: string; head: string} => {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const bend = (o.bend ?? 0.06) * len;
  const [dx, dy] = unit(x2 - x1, y2 - y1);
  const mid: XY = [(x1 + x2) / 2 - dy * bend, (y1 + y2) / 2 + dx * bend];
  const shaft = handPath([[x1, y1], mid, [x2, y2]], seed, {wobble: 0.6});
  const [ex, ey] = unit(x2 - mid[0], y2 - mid[1]);
  const head = o.head ?? 14;
  const barb = (sign: number): XY => {
    const a = Math.atan2(ey, ex) + Math.PI + sign * (0.48 + hashSigned(seed, sign + 5) * 0.06);
    return [x2 + Math.cos(a) * head, y2 + Math.sin(a) * head];
  };
  return {shaft, head: handPolyline([barb(1), [x2 + ex * 1.2, y2 + ey * 1.2], barb(-1)], seed + 3, 0.5)};
};

/** A tick (check mark ✓) whose knee is at (x, y), `size` px tall. One quick movement. */
export const handTick = (x: number, y: number, size: number, seed: number): string =>
  handPath(
    [
      [x - size * 0.36, y - size * 0.34],
      [x - size * 0.12, y - size * 0.08],
      [x + size * 0.02, y + size * 0.02],
      [x + size * 0.3, y - size * 0.45],
      [x + size * 0.62, y - size * 0.98],
    ],
    seed,
    {wobble: size * 0.025},
  );

/** A checkbox with a tick in it. `x, y` is the box's top-left. Draw `box` first, then `tick`. */
export const handCheck = (x: number, y: number, size: number, seed: number): {box: string; tick: string} => ({
  box: handRect(x, y, size, size, seed, {radius: size * 0.12, overshoot: size * 0.2}),
  tick: handTick(x + size * 0.42, y + size * 0.78, size * 1.05, seed + 9),
});

/** An X: two strokes in one path (the pencil lifts between them). */
export const handCross = (cx: number, cy: number, size: number, seed: number): string => {
  const h = size / 2;
  return `${handLine(cx - h, cy - h, cx + h, cy + h, seed, {overshoot: 1})} ${handLine(cx + h, cy - h, cx - h, cy + h, seed + 1, {overshoot: 1})}`;
};

/** Short ruler-style tick marks across a line from (x1,y1) to (x2,y2): `count` marks, `length` px long. */
export const handTickMarks = (x1: number, y1: number, x2: number, y2: number, count: number, length: number, seed: number): string => {
  const [dx, dy] = unit(x2 - x1, y2 - y1);
  return Array.from({length: count}, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const cx = x1 + (x2 - x1) * t;
    const cy = y1 + (y2 - y1) * t;
    const l = length * (0.9 + hash01(seed, i) * 0.2);
    return handLine(cx + dy * l * 0.5, cy - dx * l * 0.5, cx - dy * l * 0.5, cy + dx * l * 0.5, seed + i * 3, {overshoot: 0.5, bow: 0});
  }).join(' ');
};
