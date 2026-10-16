// edgeLightPath.ts — the rounded-rect perimeter parameterisation shared by every edge light in the film.
//
// Convention (the same for 2D hairlines and the 3D rigs):
//   * coordinates are centred on the shape, x to the right, y DOWN (screen convention; the 3D rigs negate y);
//   * the parameter u runs 0..1 once around the perimeter, CLOCKWISE as seen by the viewer, starting at the
//     midpoint of the TOP-LEFT corner arc (u = 0 is "the top-left corner" in BIBLE section 3 / 5.4);
//   * distances are in the shape's own units (the rigs use "device heights": the body is 1 unit tall).
// Everything here is pure.

export type RoundedRect = {width: number; height: number; radius: number};
export type Corner = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';
export type PerimeterPoint = {
  x: number;
  y: number;
  /** Outward unit normal. */
  nx: number;
  ny: number;
  /** Unit tangent in the direction of increasing u (clockwise). */
  tx: number;
  ty: number;
};

type Segment =
  | {kind: 'arc'; length: number; cx: number; cy: number; r: number; a0: number; a1: number}
  | {kind: 'line'; length: number; x0: number; y0: number; x1: number; y1: number};

const QUARTER = Math.PI / 2;
const EIGHTH = Math.PI / 4;
const TAU = Math.PI * 2;

const validate = (rect: RoundedRect): RoundedRect => {
  const maxRadius = Math.min(rect.width, rect.height) / 2;
  if (!(rect.width > 0 && rect.height > 0)) throw new Error(`RoundedRect needs a positive size, got ${rect.width}x${rect.height}`);
  if (rect.radius < 0 || rect.radius > maxRadius + 1e-9) throw new Error(`RoundedRect radius ${rect.radius} outside 0-${maxRadius}`);
  return rect;
};

/**
 * The perimeter as segments in clockwise order (y down), starting at the top-left corner's midpoint.
 * Angles are measured in the y-down frame: angle 0 = +x, angle +90° = +y (down), so clockwise = increasing angle.
 */
const segmentsOf = (rect: RoundedRect): readonly Segment[] => {
  const {width, height, radius: r} = validate(rect);
  const hx = width / 2;
  const hy = height / 2;
  const ax = hx - r;
  const ay = hy - r;
  const arcLength = r * EIGHTH;
  const arc = (cx: number, cy: number, a0: number, a1: number): Segment => ({kind: 'arc', length: Math.abs(a1 - a0) * r, cx, cy, r, a0, a1});
  const line = (x0: number, y0: number, x1: number, y1: number): Segment => ({kind: 'line', length: Math.hypot(x1 - x0, y1 - y0), x0, y0, x1, y1});
  const tl = -Math.PI; // pointing left; the top-left arc runs from 180° (left) to 270° (up) in the y-down frame
  return [
    {...arc(-ax, -ay, tl + EIGHTH, tl + QUARTER), length: arcLength},
    line(-ax, -hy, ax, -hy),
    arc(ax, -ay, -QUARTER, 0),
    line(hx, -ay, hx, ay),
    arc(ax, ay, 0, QUARTER),
    line(ax, hy, -ax, hy),
    arc(-ax, ay, QUARTER, Math.PI),
    line(-hx, ay, -hx, -ay),
    {...arc(-ax, -ay, Math.PI, Math.PI + EIGHTH), length: arcLength},
  ];
};

const cache = new WeakMap<RoundedRect, readonly Segment[]>();
const segments = (rect: RoundedRect): readonly Segment[] => {
  const hit = cache.get(rect);
  if (hit) return hit;
  const built = segmentsOf(rect);
  cache.set(rect, built);
  return built;
};

export const perimeterLength = (rect: RoundedRect): number => segments(rect).reduce((sum, s) => sum + s.length, 0);

/** Wraps any number into 0..1. */
export const wrap01 = (u: number): number => ((u % 1) + 1) % 1;

const pointOnSegment = (s: Segment, f: number): PerimeterPoint => {
  if (s.kind === 'line') {
    const tx = (s.x1 - s.x0) / (s.length || 1);
    const ty = (s.y1 - s.y0) / (s.length || 1);
    // Outward normal of a clockwise (y-down) contour: rotate the tangent by -90° in the y-down frame.
    return {x: s.x0 + (s.x1 - s.x0) * f, y: s.y0 + (s.y1 - s.y0) * f, nx: ty, ny: -tx, tx, ty};
  }
  const a = s.a0 + (s.a1 - s.a0) * f;
  const nx = Math.cos(a);
  const ny = Math.sin(a);
  return {x: s.cx + s.r * nx, y: s.cy + s.r * ny, nx, ny, tx: -ny, ty: nx};
};

/** The point at perimeter parameter u (wrapped), with its outward normal and clockwise tangent. */
export const pointAt = (rect: RoundedRect, u: number): PerimeterPoint => {
  const segs = segments(rect);
  const total = perimeterLength(rect);
  let remaining = wrap01(u) * total;
  for (const s of segs) {
    if (remaining <= s.length || s === segs[segs.length - 1]) {
      return pointOnSegment(s, s.length > 0 ? Math.min(1, remaining / s.length) : 0);
    }
    remaining -= s.length;
  }
  throw new Error('pointAt: empty perimeter');
};

/** The parameter of the perimeter point nearest to (x, y) (y down, centred). */
export const paramOfPoint = (rect: RoundedRect, x: number, y: number): number => {
  const {width, height, radius: r} = validate(rect);
  const ax = width / 2 - r;
  const ay = height / 2 - r;
  const cx = Math.max(-ax, Math.min(ax, x));
  const cy = Math.max(-ay, Math.min(ay, y));
  const dx = x - cx;
  const dy = y - cy;
  // Inside the inner rectangle: snap to the nearest side.
  const [px, py] =
    Math.hypot(dx, dy) > 1e-9
      ? [cx + (r * dx) / Math.hypot(dx, dy), cy + (r * dy) / Math.hypot(dx, dy)]
      : nearestSide(width / 2, height / 2, x, y);
  return paramOfBoundaryPoint(rect, px, py);
};

const nearestSide = (hx: number, hy: number, x: number, y: number): [number, number] => {
  const gaps = [hy + y, hx - x, hy - y, hx + x]; // top, right, bottom, left
  const min = Math.min(...gaps);
  if (min === gaps[0]) return [x, -hy];
  if (min === gaps[1]) return [hx, y];
  if (min === gaps[2]) return [x, hy];
  return [-hx, y];
};

const paramOfBoundaryPoint = (rect: RoundedRect, x: number, y: number): number => {
  const segs = segments(rect);
  const total = perimeterLength(rect);
  let before = 0;
  let best = {d: Infinity, u: 0};
  for (const s of segs) {
    const f = s.kind === 'line' ? lineFraction(s, x, y) : arcFraction(s, x, y);
    const p = pointOnSegment(s, f);
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < best.d) best = {d, u: (before + f * s.length) / total};
    before += s.length;
  }
  return wrap01(best.u);
};

const lineFraction = (s: Extract<Segment, {kind: 'line'}>, x: number, y: number): number => {
  const vx = s.x1 - s.x0;
  const vy = s.y1 - s.y0;
  const len2 = vx * vx + vy * vy;
  return len2 > 0 ? Math.max(0, Math.min(1, ((x - s.x0) * vx + (y - s.y0) * vy) / len2)) : 0;
};

const arcFraction = (s: Extract<Segment, {kind: 'arc'}>, x: number, y: number): number => {
  const raw = Math.atan2(y - s.cy, x - s.cx);
  const lo = Math.min(s.a0, s.a1);
  const hi = Math.max(s.a0, s.a1);
  const candidates = [raw - TAU, raw, raw + TAU].filter((a) => a >= lo - 1e-9 && a <= hi + 1e-9);
  const a = candidates[0] ?? (Math.abs(raw - lo) < Math.abs(raw - hi) ? lo : hi);
  return (a - s.a0) / (s.a1 - s.a0 || 1);
};

/** The parameter of a corner's midpoint. topLeft is 0 by definition. */
export const cornerParam = (rect: RoundedRect, corner: Corner): number => {
  const {width, height, radius: r} = validate(rect);
  const total = perimeterLength(rect);
  const straightTop = width - 2 * r;
  const straightSide = height - 2 * r;
  const quarterArc = r * QUARTER;
  const at = {
    topLeft: 0,
    topRight: quarterArc / 2 + straightTop + quarterArc / 2,
    bottomRight: quarterArc / 2 + straightTop + quarterArc + straightSide + quarterArc / 2,
    bottomLeft: quarterArc / 2 + 2 * straightTop + 2 * quarterArc + straightSide + quarterArc / 2,
  }[corner];
  return wrap01(at / total);
};

/** Shortest signed distance from a to b around the loop, in parameter units (-0.5..0.5). */
export const loopDelta = (a: number, b: number): number => {
  const d = wrap01(b - a);
  return d > 0.5 ? d - 1 : d;
};

/**
 * The band's brightness at arc distance `distance` from its centre (same units as `width`): a flat core over the
 * central 40% of the width and a Gaussian feather over the remaining 60% (BIBLE section 3), exactly 0 beyond
 * 2.5 widths so the void stays black.
 */
export const BAND_CORE_FRACTION = 0.4;
export const BAND_CUTOFF_WIDTHS = 2.5;
export const bandProfile = (distance: number, width: number): number => {
  const half = (width * BAND_CORE_FRACTION) / 2;
  const feather = (width * (1 - BAND_CORE_FRACTION)) / 2;
  const sigma = feather / 2;
  const d = Math.abs(distance);
  if (d <= half) return 1;
  if (d >= width * BAND_CUTOFF_WIDTHS) return 0;
  return Math.exp(-((d - half) ** 2) / (2 * sigma * sigma));
};

/** Samples the whole perimeter at `count` evenly spaced parameters (for ribbons, SVG paths, tubes). */
export const samplePerimeter = (rect: RoundedRect, count: number): readonly (PerimeterPoint & {u: number})[] =>
  Array.from({length: count}, (_, i) => {
    const u = i / count;
    return {...pointAt(rect, u), u};
  });

/** SVG path data of the outline (y down, centred), starting at u = 0 and running clockwise. */
export const perimeterPath = (rect: RoundedRect, samples = 256): string => {
  const pts = samplePerimeter(rect, samples);
  const body = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' ');
  return `${body} Z`;
};
