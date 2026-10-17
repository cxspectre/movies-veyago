// geometry.ts — chapter 1's line: the film's anchors with the four detours (heart rate, calendar, passport, key) drawn
// into the stretch between 7.0 and 16.5 (BIBLE4 §1.3, §5.1). Every sketch is part of the one stroke: the head draws it,
// holds half a second on its last point, and moves on. Chapter 1 starts at master 0, so local seconds are master seconds.
import {line} from '../../beats4';
import {buildLine, masterAnchors, type LineGeometry, type TimedAnchor} from '../../endless/lineGeometry';
import {LINE_ANCHORS, type Point} from '../../sheet4';

const BASE = 4000;
/** The head creeps this far during a hold so the path never has a zero-length segment. */
const HOLD_CREEP = 2;
/** Arc points per full turn; a corner sharper than CORNER_TURN gets flanking points so the line's fillet stays small. */
const ARC_STEPS = 28;
const CORNER_TURN = 0.7;
const CORNER_TIGHT = 8;

type Pts = readonly Point[];
const at = (x: number, y: number): Point => [x, y];

/** Keep corners crisp: the line rounds each corner by up to 0.4 of its shorter leg, so sharp turns get a point a few px either side. */
const crisp = (pts: Pts): Pts =>
  pts.flatMap((p, i) => {
    const a = pts[i - 1];
    const b = pts[i + 1];
    if (!a || !b) return [p];
    const [ux, uy] = [p[0] - a[0], p[1] - a[1]];
    const [vx, vy] = [b[0] - p[0], b[1] - p[1]];
    const lu = Math.hypot(ux, uy);
    const lv = Math.hypot(vx, vy);
    if (lu === 0 || lv === 0) return [p];
    const turn = Math.acos(Math.min(1, Math.max(-1, (ux * vx + uy * vy) / (lu * lv))));
    if (turn < CORNER_TURN || Math.min(lu, lv) <= CORNER_TIGHT * 2.5) return [p];
    return [at(p[0] - (ux / lu) * CORNER_TIGHT, p[1] - (uy / lu) * CORNER_TIGHT), p, at(p[0] + (vx / lv) * CORNER_TIGHT, p[1] + (vy / lv) * CORNER_TIGHT)];
  });

/** Spread the points of a detour over its draw window, in proportion to the distance between them. */
const timed = (pts: Pts, from: number, to: number): readonly TimedAnchor[] => {
  const legs = pts.slice(1).map((p, i) => Math.hypot(p[0] - (pts[i] as Point)[0], p[1] - (pts[i] as Point)[1]));
  const total = legs.reduce((a, b) => a + b, 0) || 1;
  let run = 0;
  return pts.map((p, i) => {
    if (i > 0) run += legs[i - 1] as number;
    return {t: from + (run / total) * (to - from), p};
  });
};

/** One beat of an ECG, 84 px wide: flat, a small bump, the spike up and down through the baseline, a low swell, flat. */
const beatAt = (x: number, amp: number): Pts => [
  [0, 0], [10, -0.18], [20, 0], [31, 0.12], [39, -1], [49, 0.35], [56, 0], [68, -0.22], [84, 0],
].map(([dx, dy]) => at(x + (dx as number), BASE + (dy as number) * amp));
/** x 1400-1700: three spikes of amplitude 120. */
const heartRate = (): Pts => [at(1400, BASE), ...[1420, 1505, 1590].flatMap((x) => beatAt(x, 120)), at(1700, BASE)];

/** x 1800-2100: a 4x3 calendar grid (300 x 220) as one zigzag: five verticals, then the top, two inner rules and the bottom. */
const CAL = {x0: 1800, x1: 2100, top: BASE - 220, cols: 4, rows: 3} as const;
const calendar = (): Pts => {
  const step = (CAL.x1 - CAL.x0) / CAL.cols;
  const xs = Array.from({length: CAL.cols + 1}, (_, i) => CAL.x0 + i * step);
  const verticals = xs.flatMap((x, i) => (i % 2 === 0 ? [at(x, BASE), at(x, CAL.top)] : [at(x, CAL.top), at(x, BASE)]));
  const rule = (k: number): number => CAL.top + (k * (BASE - CAL.top)) / CAL.rows;
  return [
    ...verticals,
    at(CAL.x1, CAL.top), at(CAL.x0, CAL.top),
    at(CAL.x0, rule(1)), at(CAL.x1, rule(1)),
    at(CAL.x1, rule(2)), at(CAL.x0, rule(2)),
    at(CAL.x0, BASE), at(CAL.x1, BASE),
  ];
};

/** Points round a circle from angle `from` to `to` (radians, y down: increasing = clockwise on screen). */
const arc = (cx: number, cy: number, r: number, from: number, to: number): Pts => {
  const n = Math.max(2, Math.ceil((Math.abs(to - from) / (Math.PI * 2)) * ARC_STEPS));
  return Array.from({length: n + 1}, (_, i) => {
    const a = from + ((to - from) * i) / n;
    return at(cx + r * Math.cos(a), cy + r * Math.sin(a));
  });
};

/** x 2200-2500: a passport 260 x 340 as one loop (cover, then the emblem circle), out along the baseline. */
const passport = (): Pts => {
  const x0 = 2220;
  const x1 = 2480;
  const top = BASE - 340;
  const cx = (x0 + x1) / 2;
  const r = 52;
  const cy = top + 130;
  return [
    at(2200, BASE), at(x0, BASE), at(x0, top), at(x1, top), at(x1, BASE), at(cx, BASE),
    at(cx, cy + r), ...arc(cx, cy, r, Math.PI / 2, Math.PI / 2 + Math.PI * 2).slice(1), at(cx, BASE), at(2500, BASE),
  ];
};

/** x 2600-2900: a key: ring r 40, shaft 200, three teeth. The ring is entered from the baseline and closed on the way out. */
const key = (): Pts => {
  const r = 40;
  const cx = 2640;
  const cy = BASE - 100;
  const rim = Math.asin(16 / r); // where the shaft's lower edge meets the ring
  const end = cx + r + 200;
  const edge = cy + 16;
  return [
    at(2600, BASE), at(cx, BASE), at(cx, cy + r),
    ...arc(cx, cy, r, Math.PI / 2, Math.PI * 2).slice(1), // bottom, left, top, to the right
    at(end, cy), at(end, edge), // along the top of the shaft, down the end
    at(end, edge + 20), at(end - 22, edge + 20), at(end - 22, edge), at(end - 54, edge), at(end - 54, edge + 14), at(end - 78, edge + 14),
    at(end - 78, edge), at(cx + Math.cos(rim) * r, edge), // the three teeth, back to the ring
    ...arc(cx, cy, r, rim, Math.PI / 2).slice(1), // down the ring's lower right, to the bottom
    at(cx, BASE), at(2900, BASE),
  ];
};

/** A hold: the head stays on its last point for `seconds`. */
const hold = (last: TimedAnchor, until: number): readonly TimedAnchor[] => [
  {t: until, p: at(last.p[0] + HOLD_CREEP, last.p[1])},
];

const sketch = (pts: Pts, d: {readonly draw: {readonly from: number; readonly to: number}; readonly hold: number}): readonly TimedAnchor[] => {
  const drawn = timed(crisp(pts), d.draw.from, d.draw.to);
  return [...drawn, ...hold(drawn[drawn.length - 1] as TimedAnchor, d.hold)];
};

const SHAPES: Record<(typeof line.detours)[number]['id'], () => Pts> = {'heart-rate': heartRate, calendar, passport, key};

/** Chapter 1's own anchors (master time = local time here). */
export const lineAnchors = (): readonly TimedAnchor[] => {
  const given = LINE_ANCHORS.line.map((a) => ({t: a.t, p: a.p, note: a.note}));
  const before = given.filter((a) => a.t < line.detours[0].draw.from);
  const after = given.filter((a) => a.t >= 18.0);
  const detours = line.detours.flatMap((d) => sketch(SHAPES[d.id](), d));
  return [...before, ...detours, ...after];
};

/** The whole film's anchors with chapter 1 replaced by the above (the remaining chapters are untouched). */
export const filmAnchorsWithDetours = (): readonly TimedAnchor[] => {
  const mine = lineAnchors();
  const last = mine[mine.length - 1] as TimedAnchor;
  const rest = masterAnchors().filter((a) => a.t > last.t || (a.t === last.t && (a.p[0] !== last.p[0] || a.p[1] !== last.p[1])));
  return [...mine, ...rest];
};

let built: LineGeometry | null = null;
/** The line geometry for `PencilLine geometry={...}`: the film's line with chapter 1's detours drawn in. Built once. */
export const lineGeometry = (): LineGeometry => {
  built = built ?? buildLine(filmAnchorsWithDetours());
  return built;
};
