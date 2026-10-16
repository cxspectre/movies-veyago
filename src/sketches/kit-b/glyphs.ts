// glyphs.ts — small drawing helpers the engine's toolkit lacks: plus signs, text lines, a padlock, coins, stick
// figures, a key, ruled lines. Each returns SVG path data (several `M` movements = the pencil lifts between them).
// Deterministic by seed; shapes are built the way a quick, practised hand draws them, never as perfect geometry.
import {drift, handCircle, handLine, handPath, handPolyline, handRect, type XY} from '../../paper';
import {hashSigned} from '../../paper/geometry/noise';

const BOX_BOW = 0.004;
/** Rounded rectangles: max hand jitter (px), where a side is pinned, and how each corner arc is sampled. */
const ROUNDED_JITTER = 0.8;
const SIDE_STEPS = [0.04, 0.5, 0.96] as const;
const CORNER_STEPS = [0.2, 0.5, 0.8] as const;
/** A coin's face seen from above at the camera's tilt, and the depth of its edge, as fractions of its radius. */
/** Arms hang from the shoulder line: hands sit this much lower (px), varied per pose. */
const ARM_DROOP = 16;
const ARM_DROOP_POSE = 7;
const COIN_FLATTEN = 0.6;
const COIN_EDGE = 0.38;

const join = (...paths: readonly string[]): string => paths.filter(Boolean).join(' ');

/** A "+" whose box starts at (x, y): the horizontal bar first, then the vertical, each a quick flick. */
export const plus = (x: number, y: number, size: number, seed: number): string => {
  const h = size / 2;
  return join(
    handLine(x - 1, y + h + 0.5, x + size + 1, y + h - 0.5, seed, {overshoot: 1, bow: 0.4, wobble: 0.3}),
    handLine(x + h + 0.5, y - 1, x + h - 0.5, y + size + 1.5, seed + 1, {overshoot: 1, bow: 0.4, wobble: 0.3}),
  );
};

/** Placeholder text lines: `[x1, y, x2]` rows, written left to right with a little lift between rows. */
export const textLines = (rows: readonly (readonly [number, number, number])[], seed: number): string =>
  join(...rows.map(([x1, y, x2], i) => handLine(x1, y + hashSigned(seed, i) * 0.8, x2, y - 0.6, seed + i * 7, {overshoot: 1.5, wobble: 0.4})));

/** A straight edge drawn against a ruler: dead straight, tiny 0.2 px wobble, a short run past each end. */
export const ruled = (x1: number, y1: number, x2: number, y2: number, seed: number, over = 4): string => {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const dx = (x2 - x1) / len;
  const dy = (y2 - y1) / len;
  return handPolyline(
    [
      [x1 - dx * over * 0.5, y1 - dy * over * 0.5],
      [x2 + dx * over, y2 + dy * over],
    ],
    seed,
    0.2,
  );
};

/** A box drawn against a ruler: four ruled edges that cross at the corners. */
export const ruledBox = (x1: number, y1: number, x2: number, y2: number, seed: number): string =>
  join(ruled(x1, y1, x2, y1, seed), ruled(x2, y1, x2, y2, seed + 1), ruled(x2, y2, x1, y2, seed + 2), ruled(x1, y2, x1, y1, seed + 3));

/**
 * A padlock: the shackle as one arch (up the left leg, over, down the right), then the body, then the keyhole.
 * `legs` is how far the shackle's legs run into the body before the arch starts.
 */
export const padlock = (
  o: {readonly cx: number; readonly bodyTop: number; readonly bodyBottom: number; readonly halfWidth: number; readonly shackleR: number; readonly hole: XY; readonly holeR: number},
  seed: number,
): string => {
  const {cx, bodyTop, bodyBottom, halfWidth, shackleR, hole, holeR} = o;
  const legY = bodyTop + 2;
  const arch = Array.from({length: 9}, (_, i): XY => {
    const a = Math.PI + (i / 8) * Math.PI;
    return [cx + Math.cos(a) * shackleR, bodyTop - 4 + Math.sin(a) * shackleR * 1.08];
  });
  const shackle = handPath([[cx - shackleR, legY], ...arch, [cx + shackleR, legY]], seed, {wobble: 0.5});
  const body = handRect(cx - halfWidth, bodyTop, halfWidth * 2, bodyBottom - bodyTop, seed + 2, {radius: 6, overshoot: 5});
  const keyhole = join(
    handCircle(hole[0], hole[1], holeR, holeR, seed + 4, {overlap: 0.25, wobble: 0.2}),
    handLine(hole[0], hole[1] + holeR + 1, hole[0] + 0.4, hole[1] + holeR + 10, seed + 5, {overshoot: 0, bow: 0, wobble: 0.2}),
  );
  return join(shackle, body, keyhole);
};

/**
 * A coin lying on the table, the way people draw one so it reads as a coin and not an "o": the face as a flat
 * ellipse, then one movement for its edge (down the left side, along the underside, back up the right).
 */
export const coin = (cx: number, cy: number, r: number, seed: number): string => {
  const ry = r * COIN_FLATTEN;
  const edge = r * COIN_EDGE;
  const face = handCircle(cx, cy, r, ry, seed, {overlap: 0.1, wobble: 0.3});
  const under = Array.from({length: 9}, (_, i): XY => {
    const a = Math.PI - (i / 8) * Math.PI;
    return [cx + Math.cos(a) * r, cy + edge + Math.sin(a) * ry];
  });
  return join(face, handPath([[cx - r, cy + 0.5], ...under, [cx + r, cy + 0.5]], seed + 9, {wobble: 0.25}));
};

export type FigureOptions = {
  readonly cx: number;
  readonly headY: number;
  readonly headR: number;
  readonly hipY: number;
  readonly armY: number;
  readonly armSpan: number;
  readonly footY: number;
  readonly footSpread: number;
  /** -1..1: how this person stands (arm droop, a lean). Keeps three figures from being clip-art copies. */
  readonly pose: number;
};

/** A stick figure in the order people draw one: head, body, arms in one sweep, legs as one inverted V. */
export const stickFigure = (f: FigureOptions, seed: number): string => {
  const lean = f.pose * 4;
  const neck: XY = [f.cx + lean * 0.2, f.headY + f.headR + 3];
  const hip: XY = [f.cx - lean * 0.4, f.hipY];
  const droop = ARM_DROOP + f.pose * ARM_DROOP_POSE;
  const head = handCircle(f.cx, f.headY, f.headR, f.headR * 1.04, seed, {overlap: 0.1, wobble: 0.5});
  const body = handPath([neck, [f.cx + lean * 0.1, (neck[1] + hip[1]) / 2], hip], seed + 1, {wobble: 0.5});
  const arms = handPath(
    [
      [f.cx - f.armSpan, f.armY + droop],
      [f.cx - f.armSpan * 0.4, f.armY + droop * 0.15],
      [f.cx, f.armY - 1],
      [f.cx + f.armSpan * 0.4, f.armY + droop * 0.12],
      [f.cx + f.armSpan, f.armY + droop * 0.8],
    ],
    seed + 2,
    {wobble: 0.6},
  );
  const legs = handPath(
    [
      [f.cx - f.footSpread - 2, f.footY + 1],
      [f.cx - f.footSpread * 0.45, (hip[1] + f.footY) / 2],
      hip,
      [f.cx + f.footSpread * 0.45, (hip[1] + f.footY) / 2],
      [f.cx + f.footSpread + 2, f.footY - 1],
    ],
    seed + 3,
    {wobble: 0.6, smooth: 0.25},
  );
  return join(head, body, arms, legs);
};

/**
 * Key teeth hanging from a shaft at `shaftY`: drawn as one crenellated movement along the underside of the blade
 * (down, across, up, along… ), the way a key's bit is sketched. Each tooth is `[x, width, depth]`.
 */
export const keyTeeth = (teeth: readonly (readonly [number, number, number])[], shaftY: number, seed: number): string => {
  const pts = teeth.flatMap(([x, w, depth], i): XY[] => {
    const j = hashSigned(seed, i) * 0.8;
    return [
      [x, shaftY + 1],
      [x + j * 0.3, shaftY + depth],
      [x + w, shaftY + depth + j],
      [x + w - j * 0.3, shaftY + 1],
    ];
  });
  return handPolyline(pts, seed, 0.4);
};

/**
 * A rounded rectangle in one movement, clockwise from just after the top-left corner, overshooting where it
 * closes. Unlike the engine's `handRect` (sparse points, so long sides bulge), each side is pinned at both corner
 * tangents and the corners are sampled as real arcs: sides stay straight and confident, corners stay round.
 */
export const roundedRect = (x: number, y: number, w: number, h: number, r: number, seed: number, over = 8): string => {
  const rr = Math.min(r, w / 2, h / 2);
  const j = (k: number): number => hashSigned(seed, k) * ROUNDED_JITTER;
  const corner = (cx: number, cy: number, a0: number, k: number): XY[] =>
    CORNER_STEPS.map((t, i): XY => {
      const a = a0 + t * (Math.PI / 2);
      return [cx + Math.cos(a) * rr + j(k + i) * 0.3, cy + Math.sin(a) * rr + j(k + i + 5) * 0.3];
    });
  /** Points along a side, each nudged a little across it (never along it, so the corners stay put). */
  const side = (ax: number, ay: number, bx: number, by: number, k: number): XY[] => {
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / len;
    const ny = (bx - ax) / len;
    return SIDE_STEPS.map((t, i): XY => [ax + (bx - ax) * t + nx * j(k + i), ay + (by - ay) * t + ny * j(k + i)]);
  };
  const pts: XY[] = [
    [x + rr, y + j(1) * 0.5],
    ...side(x + rr, y, x + w - rr, y, 10),
    ...corner(x + w - rr, y + rr, -Math.PI / 2, 20),
    ...side(x + w, y + rr, x + w, y + h - rr, 30),
    ...corner(x + w - rr, y + h - rr, 0, 40),
    ...side(x + w - rr, y + h, x + rr, y + h, 50),
    ...corner(x + rr, y + h - rr, Math.PI / 2, 60),
    ...side(x, y + h - rr, x, y + rr, 70),
    ...corner(x + rr, y + rr, Math.PI, 80),
    [x + rr + over, y + 0.8 + j(90) * 0.5],
  ];
  return handPath(pts, seed, {wobble: 0.35});
};

/**
 * A square-cornered box the way a designer sketches one fast: four confident edges, each starting a little before
 * its corner and running past the next, so the corners cross. Overshoots vary per corner (mild asymmetry).
 */
export const crossedBox = (x1: number, y1: number, x2: number, y2: number, seed: number, over = 8): string => {
  const o = (k: number): number => over * (0.6 + 0.5 * (hashSigned(seed, k) * 0.5 + 0.5));
  const t = (k: number): number => hashSigned(seed, k + 20) * 1.4;
  /** Confident edges bow far less than a free line: about 0.4% of their length. */
  const bow = (len: number, k: number): number => len * BOX_BOW * (hashSigned(seed, k + 40) < 0 ? -1 : 1);
  const w = x2 - x1;
  const h = y2 - y1;
  return join(
    handLine(x1 - o(1) * 0.4, y1 + t(1), x2 + o(2), y1 + t(2), seed + 1, {overshoot: 0, bow: bow(w, 1)}),
    handLine(x2 + t(3), y1 - o(3) * 0.4, x2 + t(4), y2 + o(4), seed + 2, {overshoot: 0, bow: bow(h, 2)}),
    handLine(x2 + o(5) * 0.4, y2 + t(5), x1 - o(6), y2 + t(6), seed + 3, {overshoot: 0, bow: bow(w, 3)}),
    handLine(x1 + t(7), y2 + o(7) * 0.4, x1 + t(8), y1 - o(8), seed + 4, {overshoot: 0, bow: bow(h, 4)}),
  );
};

/** A long line with a hand's slow drift (for envelope folds and other edges drawn without a ruler). */
export const driftLine = (points: readonly XY[], seed: number, amount = 1.2): string => handPath(drift(points, seed, 40, amount), seed, {wobble: 0.5, smooth: 0.35});
