// lineGeometry.ts — the unbroken line as ONE path in sheet px, with the master time the head reaches every point.
// Built from LINE_ANCHORS (src/sheet4.ts): straight runs between anchors, corners rounded to a small fillet,
// the v1 wobble (0.8 px, 0.03/px) laid on top, resampled every 1.5 px. Pressure and width factors come from the v1
// pencil physics (`shapeMark`), so the line leans on its corners and tapers at its ends like the rest of the film.
import {SLOTS4} from '../film4';
import {LINE_ANCHORS, type Point} from '../sheet4';
import {wobble} from '../paper/geometry/noise';
import {resample, SAMPLE_STEP, type Pt} from '../paper/geometry/path';
import {shapeMark} from '../paper/marks/shape';

export type TimedAnchor = {readonly t: number; readonly p: Point; readonly note?: string};

/** Where the line parks while the glass chapter runs and where it picks up again in the last chapter (BIBLE4 §1.3-1.4). */
const GLASS_PARK: Point = [27600, 3420];

const WOBBLE_AMP = 0.8;
const WOBBLE_PER_PX = 0.03;
const FILLET_MAX = 40;
const FILLET_MIN_TURN = 0.12; // radians; gentler bends stay straight
const INSTANT_SPEED = 600; // px/s: a "zero-time" move (a rise, a drop) takes this long
const INSTANT_MAX = 0.25;
const DIP = {from: 1.5, to: 4.5, factor: 0.7, ramp: 0.4} as const; // BIBLE4 §5.1: pressure dips while the line writes the super

/** Master-timed anchors for the whole film, duplicates at chapter hand-offs removed, bridges added. */
export const masterAnchors = (): readonly TimedAnchor[] => {
  const raw: TimedAnchor[] = SLOTS4.flatMap((slot) => {
    const list = LINE_ANCHORS[slot.id].map((a) => ({t: slot.start + a.t, p: a.p, note: a.note}));
    // The last chapter enters from the parked point: add its (0, parked) anchor so the stretch is drawn, not skipped.
    return slot.id === 'providedFor' ? [{t: slot.start, p: GLASS_PARK, note: 'picks up again'}, ...list] : list;
  });
  return raw.filter((a, i) => {
    const prev = raw[i - 1];
    return !prev || prev.p[0] !== a.p[0] || prev.p[1] !== a.p[1] || prev.t !== a.t;
  });
};

/** Moves that take no time in the anchors get a short, honest duration borrowed from the run before them. */
const separateInstants = (anchors: readonly TimedAnchor[]): readonly TimedAnchor[] =>
  anchors.map((a, i) => {
    const next = anchors[i + 1];
    const prev = anchors[i - 1];
    if (!next || next.t !== a.t) return a;
    const dist = Math.hypot(next.p[0] - a.p[0], next.p[1] - a.p[1]);
    if (dist === 0) return a;
    const want = Math.min(INSTANT_MAX, dist / INSTANT_SPEED);
    const room = prev ? (a.t - prev.t) / 2 : want;
    return {...a, t: a.t - Math.min(want, room)};
  });

const norm = (x: number, y: number): [number, number] => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};

/** Straight runs through the anchors, each interior corner cut with a short quadratic fillet. Returns the points
 * and, per anchor, the index of the point nearest it (the fillet's middle). */
const filleted = (anchors: readonly TimedAnchor[]): {pts: Pt[]; anchorAt: number[]} => {
  const pts: Pt[] = [];
  const anchorAt: number[] = [];
  anchors.forEach((a, i) => {
    const prev = anchors[i - 1];
    const next = anchors[i + 1];
    if (!prev || !next) {
      pts.push({x: a.p[0], y: a.p[1]});
      anchorAt.push(pts.length - 1);
      return;
    }
    const din = norm(a.p[0] - prev.p[0], a.p[1] - prev.p[1]);
    const dout = norm(next.p[0] - a.p[0], next.p[1] - a.p[1]);
    const turn = Math.acos(Math.min(1, Math.max(-1, din[0] * dout[0] + din[1] * dout[1])));
    const lin = Math.hypot(a.p[0] - prev.p[0], a.p[1] - prev.p[1]);
    const lout = Math.hypot(next.p[0] - a.p[0], next.p[1] - a.p[1]);
    const r = Math.min(FILLET_MAX, lin * 0.4, lout * 0.4);
    if (turn < FILLET_MIN_TURN || r < 1) {
      pts.push({x: a.p[0], y: a.p[1]});
      anchorAt.push(pts.length - 1);
      return;
    }
    const p0 = {x: a.p[0] - din[0] * r, y: a.p[1] - din[1] * r};
    const p2 = {x: a.p[0] + dout[0] * r, y: a.p[1] + dout[1] * r};
    const steps = 8;
    const start = pts.length;
    for (let k = 0; k <= steps; k++) {
      const u = k / steps;
      const m = 1 - u;
      pts.push({x: m * m * p0.x + 2 * m * u * a.p[0] + u * u * p2.x, y: m * m * p0.y + 2 * m * u * a.p[1] + u * u * p2.y});
    }
    anchorAt.push(start + Math.floor(steps / 2));
  });
  return {pts, anchorAt};
};

export type LineGeometry = {
  readonly anchors: readonly TimedAnchor[];
  /** Base samples every SAMPLE_STEP: sheet position, arc length, pressure, width factor (1 = nominal). */
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly s: Float32Array;
  readonly p: Float32Array;
  readonly wf: Float32Array;
  readonly length: number;
  /** Anchor times and the arc length at each (non-decreasing). */
  readonly anchorT: Float32Array;
  readonly anchorS: Float32Array;
};

const pressureDip = (t: number): number => {
  const inDip = Math.min(1, Math.max(0, (t - DIP.from) / DIP.ramp)) * Math.min(1, Math.max(0, (DIP.to - t) / DIP.ramp));
  return 1 - (1 - DIP.factor) * inDip;
};

/** Build the geometry from timed anchors (default: the film's). Pure. */
export const buildLine = (anchorsIn: readonly TimedAnchor[] = masterAnchors()): LineGeometry => {
  const anchors = separateInstants(anchorsIn);
  const {pts, anchorAt} = filleted(anchors);
  const base = resample(pts, SAMPLE_STEP);
  // Arc length of each anchor = arc length at its nearest point (the fillet's middle), mapped to the resampled line.
  const rawS: number[] = [];
  pts.reduce((acc, q, i) => {
    const prev = pts[i - 1];
    const here = prev ? acc + Math.hypot(q.x - prev.x, q.y - prev.y) : 0;
    rawS.push(here);
    return here;
  }, 0);
  const rawLength = rawS[rawS.length - 1] || 1;
  const n = base.pts.length;
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const s = new Float32Array(n);
  base.pts.forEach((q, i) => {
    const sArc = base.s[i] as number;
    const prev = base.pts[Math.max(0, i - 1)] as Pt;
    const next = base.pts[Math.min(n - 1, i + 1)] as Pt;
    const [tx, ty] = norm(next.x - prev.x, next.y - prev.y);
    const off = WOBBLE_AMP * wobble(0x5171, sArc * WOBBLE_PER_PX);
    x[i] = q.x - ty * off;
    y[i] = q.y + tx * off;
    s[i] = sArc;
  });
  const shaped = shapeMark({pts: base.pts, s: base.s, length: base.length, closed: false}, {width: 1, pressure: 1, seed: 0x5171});
  const anchorS = new Float32Array(anchors.length);
  anchorAt.forEach((rawIndex, k) => {
    anchorS[k] = ((rawS[rawIndex] as number) / rawLength) * base.length;
  });
  // Make the anchor arcs non-decreasing (a wobble-free monotone guard).
  for (let k = 1; k < anchorS.length; k++) anchorS[k] = Math.max(anchorS[k] as number, anchorS[k - 1] as number);
  const tAtPoint = (arc: number): number => timeAtArcIn(anchors, anchorS, arc);
  return {
    anchors,
    x,
    y,
    s,
    p: Float32Array.from(shaped.map((m, i) => m.p * pressureDip(tAtPoint(s[i] as number)))),
    wf: Float32Array.from(shaped.map((m) => m.w)),
    length: base.length,
    anchorT: Float32Array.from(anchors.map((a) => a.t)),
    anchorS,
  };
};

const timeAtArcIn = (anchors: readonly TimedAnchor[], anchorS: Float32Array, arc: number): number => {
  const n = anchors.length;
  if (arc <= (anchorS[0] as number)) return (anchors[0] as TimedAnchor).t;
  if (arc >= (anchorS[n - 1] as number)) return (anchors[n - 1] as TimedAnchor).t;
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((anchorS[mid] as number) <= arc) lo = mid;
    else hi = mid;
  }
  const s0 = anchorS[lo] as number;
  const s1 = anchorS[hi] as number;
  const t0 = (anchors[lo] as TimedAnchor).t;
  const t1 = (anchors[hi] as TimedAnchor).t;
  return s1 > s0 ? t0 + ((arc - s0) / (s1 - s0)) * (t1 - t0) : t0;
};

/** Master time at which the head drew arc length `arc` (the first time it got there). */
export const timeAtArc = (g: LineGeometry, arc: number): number => timeAtArcIn(g.anchors, g.anchorS, arc);

/** Arc length the head has drawn by master time `t`. */
export const arcAt = (g: LineGeometry, t: number): number => {
  const n = g.anchorT.length;
  if (t <= (g.anchorT[0] as number)) return 0;
  if (t >= (g.anchorT[n - 1] as number)) return g.length;
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((g.anchorT[mid] as number) <= t) lo = mid;
    else hi = mid;
  }
  const t0 = g.anchorT[lo] as number;
  const t1 = g.anchorT[hi] as number;
  const s0 = g.anchorS[lo] as number;
  const s1 = g.anchorS[hi] as number;
  return t1 > t0 ? s0 + ((t - t0) / (t1 - t0)) * (s1 - s0) : s1;
};

/** Interpolated base sample at arc length `arc`. */
export const pointAtArc = (g: LineGeometry, arc: number): {x: number; y: number; p: number; wf: number} => {
  const f = Math.min(Math.max(0, arc / SAMPLE_STEP), g.s.length - 1.0001);
  const i = Math.floor(f);
  const k = f - i;
  const lerp = (a: Float32Array): number => (a[i] as number) + ((a[i + 1] as number) - (a[i] as number)) * k;
  return {x: lerp(g.x), y: lerp(g.y), p: lerp(g.p), wf: lerp(g.wf)};
};

let shared: LineGeometry | null = null;
/** The film's line, built once. */
export const filmLine = (): LineGeometry => {
  shared = shared ?? buildLine();
  return shared;
};

/** The head (the pencil tip) in sheet px at a master time. */
export const headAt = (masterSeconds: number): Point => {
  const g = filmLine();
  const q = pointAtArc(g, arcAt(g, masterSeconds));
  return [q.x, q.y];
};
