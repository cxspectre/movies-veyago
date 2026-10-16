// handShading.ts — pure helpers that shade and crease a drawn hand: bands along a polygon's away side, the forearm
// as a ribbon, joint creases and the fold crescent of a finger that curls under. HandDrawing.tsx composes them.
import {add, catmullRom, dot, insideRibbon, len, lerpPt, mul, norm, type Outline, outlineOf, perp, polyPath, type Pt, type Ribbon, rotate, smooth01, sub} from './geometry';
import type {DigitName, HandPose, WebSpec} from './poses';

const FOLD_DEPTH = 0.42;
const CREASE_SPAN = 0.62;
const CREASE_BOW = 0.56;
const WEB_DIP_MM = 2.2;
const WEB_SHOULDER_MM = 3;
/**
 * The forearm: a slight waist at the wrist, swelling to 1.5x the wrist width by 230 mm, bending gently over its
 * first 320 mm. It starts a little inside the palm so the heel's curve runs into it without a notch.
 */
const FOREARM = {waistMm: 1, swell: 1.5, swellAtMm: 230, bendOverMm: 320, stepMm: 10, insidePalmMm: 8};
const RAD = Math.PI / 180;

export type DigitArt = {
  readonly name: DigitName;
  readonly rib: Ribbon;
  readonly out: Outline;
  readonly uMcp: number;
  /** Spine length, px. */
  readonly total: number;
  readonly fold: boolean;
  readonly highlight: boolean;
  readonly cap?: {readonly rib: Ribbon; readonly out: Outline};
};


/** A band along the away-facing edges of a closed polygon (the palm); `mask` zeroes it on hidden edges. */
export const polygonBand = (points: readonly Pt[], away: Pt, depth: number, gamma: number, mask: (i: number) => number): string => {
  const n = points.length;
  const centroid = mul(
    points.reduce((a, b) => add(a, b), {x: 0, y: 0}),
    1 / n,
  );
  const inner = points.map((p, i) => {
    const a = points[(i - 1 + n) % n] as Pt;
    const b = points[(i + 1) % n] as Pt;
    let nm = perp(norm(sub(b, a)));
    if (dot(nm, sub(p, centroid)) < 0) nm = mul(nm, -1);
    const exposure = Math.max(0, dot(nm, away)) ** gamma * mask(i);
    return sub(p, mul(nm, depth * exposure));
  });
  return polyPath([...points, ...[...inner].reverse()], true);
};

export type ForearmSpec = {
  /** The wrist line in px, thumb side first. */
  readonly wrist: readonly [Pt, Pt];
  /** Unit direction the arm leaves along, px space. */
  readonly dir: Pt;
  readonly lengthMm: number;
  /** px per mm. */
  readonly k: number;
  /** Degrees the arm bends over its first 320 mm, positive toward the little-finger side (default 6). */
  readonly bendDeg?: number;
};

export const FOREARM_BEND_DEG = 6;

export type Forearm = {
  readonly rib: Ribbon;
  readonly out: Outline;
  /** Closed polygon: both long edges and a flat far end (always off frame). */
  readonly polygon: readonly Pt[];
};

/**
 * The forearm as a tapered, gently bent ribbon from the wrist line outward: a slight waist at the wrist, widening
 * to the forearm's full width, bending a few degrees toward the little-finger side. Long enough to leave the frame;
 * its far end is cut flat and never shaded as a tip.
 */
export const forearmOf = (spec: ForearmSpec): Forearm => {
  const [w0, w1] = spec.wrist;
  const across = norm(sub(w1, w0));
  const wristWidth = Math.max(1, len(sub(w1, w0)) - 2 * FOREARM.waistMm * spec.k);
  const steps = Math.max(2, Math.ceil(spec.lengthMm / FOREARM.stepMm));
  const stepPx = (spec.lengthMm / steps) * spec.k;
  const spine: Pt[] = [sub(lerpPt(w0, w1, 0.5), mul(spec.dir, FOREARM.insidePalmMm * spec.k))];
  const normals: Pt[] = [];
  const widths: number[] = [];
  const u: number[] = [];
  const dirAt = (mm: number): Pt => {
    const bend = (spec.bendDeg ?? FOREARM_BEND_DEG) * Math.min(1, mm / FOREARM.bendOverMm) * RAD;
    // Rotate the leaving direction toward `across` (the little-finger side) by the bend.
    const sign = dot(rotate(spec.dir, Math.PI / 2), across) >= 0 ? 1 : -1;
    return rotate(spec.dir, sign * bend);
  };
  for (let i = 0; i <= steps; i++) {
    const mm = (i / steps) * spec.lengthMm;
    if (i > 0) spine.push(add(spine[i - 1] as Pt, mul(dirAt(mm), stepPx)));
    const d = dirAt(mm);
    normals.push(perp(d));
    widths.push(wristWidth * (1 + (FOREARM.swell - 1) * smooth01(mm / FOREARM.swellAtMm)));
    u.push(i / steps);
  }
  const rib: Ribbon = {spine, normals, widths, u};
  const out = outlineOf(rib);
  return {rib, out, polygon: [...out.left, ...[...out.right].reverse()]};
};

/**
 * Where a digit lies over an earlier (lower) one, the edge of the upper digit that faces it, as open path pieces
 * from the knuckle on: the line that separates two folded fingers in a drawing.
 */
export const overlapContour = (upper: DigitArt, lower: DigitArt): string[] => {
  const edge = facingEdge(upper, lower);
  const side = edge === upper.out.left ? 1 : -1;
  const tipHalf = side === 1 ? upper.out.tip.slice(0, Math.ceil(upper.out.tip.length / 2)) : [...upper.out.tip].reverse().slice(0, Math.ceil(upper.out.tip.length / 2));
  const points = [...edge.map((p, i) => ({p, u: upper.rib.u[i] as number})), ...tipHalf.map((p) => ({p, u: 1}))];
  const pieces: string[] = [];
  let run: Pt[] = [];
  for (const {p, u} of points) {
    if (u >= upper.uMcp && insideRibbon(p, lower.rib, 0.5)) {
      run = [...run, p];
      continue;
    }
    if (run.length > 1) pieces.push(polyPath(run));
    run = [];
  }
  if (run.length > 1) pieces.push(polyPath(run));
  return pieces;
};

/**
 * Short curved creases across a finger at its visible joints (and at the knuckle where it folds under), bowed
 * toward the tip: what makes a drawn finger read as a finger rather than a tube.
 */
export const jointCreases = (art: DigitArt, pose: HandPose, k: number): string[] => {
  const entry = pose.digits.find(([name]) => name === art.name);
  if (!entry) return [];
  const joints = entry[1].joints;
  const n = art.rib.spine.length;
  const out: string[] = [];
  // Arc-length fraction of each joint after the knuckle (index 1).
  let acc = 0;
  const cum = joints.map((j, i) => {
    if (i > 0) acc += Math.hypot(j.x - (joints[i - 1] as Pt).x, j.y - (joints[i - 1] as Pt).y);
    return acc;
  });
  const total = Math.max(1e-6, acc);
  const from = 2;
  const to = art.fold ? joints.length - 1 : joints.length - 2;
  for (let j = from; j <= to; j++) {
    const u = (cum[j] as number) / total;
    const i = Math.max(1, Math.min(n - 2, art.rib.u.findIndex((v) => v >= u)));
    const c = art.rib.spine[i] as Pt;
    const nm = art.rib.normals[i] as Pt;
    const fwd = norm(sub(art.rib.spine[i + 1] as Pt, art.rib.spine[i - 1] as Pt));
    const half = ((art.rib.widths[i] as number) / 2) * CREASE_SPAN;
    const bow = CREASE_BOW * k;
    const a = sub(c, mul(nm, half));
    const b = add(c, mul(nm, half));
    const m = add(c, mul(fwd, bow));
    out.push(`M${a.x.toFixed(2)} ${a.y.toFixed(2)} Q${m.x.toFixed(2)} ${m.y.toFixed(2)} ${b.x.toFixed(2)} ${b.y.toFixed(2)}`);
  }
  return out;
};

/** The crescent across the end of a finger that folds under (always in shade: it turns away from every light). */
export const foldCrescent = (art: DigitArt): string => {
  const n = art.rib.spine.length;
  const centre = art.rib.spine[n - 1] as Pt;
  const inner = art.out.tip.map((p) => add(centre, mul(sub(p, centre), 1 - FOLD_DEPTH)));
  const edge = art.out.tip;
  const back = [...inner].reverse();
  return polyPath([...edge, ...back], true);
};

/** The edge of a digit that faces another digit, and a point on it `mm` past the knuckle. */
const facingEdge = (d: DigitArt, other: DigitArt): readonly Pt[] => {
  const i = Math.min(d.rib.spine.length - 1, Math.round(d.rib.spine.length * 0.4));
  const toOther = sub(other.rib.spine[i] as Pt, d.rib.spine[i] as Pt);
  return dot(d.rib.normals[i] as Pt, toOther) > 0 ? d.out.left : d.out.right;
};
const edgePointAt = (d: DigitArt, edge: readonly Pt[], mmFromKnuckle: number, k: number): Pt => {
  const u = d.uMcp + (mmFromKnuckle * k) / Math.max(1e-6, d.total);
  const idx = Math.max(0, Math.min(edge.length - 1, d.rib.u.findIndex((v) => v >= u)));
  return edge[idx < 0 ? edge.length - 1 : idx] as Pt;
};

/** A soft web between two digits: fills the V from inside the palm up to a smooth dip. Returns the shape and its dip. */
export const webFiller = (spec: WebSpec, digits: readonly DigitArt[], k: number): {d: string; dip: Pt} | null => {
  const a = digits.find((x) => x.name === spec[0]);
  const b = digits.find((x) => x.name === spec[2]);
  if (!a || !b) return null;
  const ea = facingEdge(a, b);
  const eb = facingEdge(b, a);
  const pa = edgePointAt(a, ea, spec[1], k);
  const pb = edgePointAt(b, eb, spec[3], k);
  const sa = edgePointAt(a, ea, spec[1] + WEB_SHOULDER_MM, k);
  const sb = edgePointAt(b, eb, spec[3] + WEB_SHOULDER_MM, k);
  const mid = lerpPt(pa, pb, 0.5);
  const inward = norm(sub(mid, lerpPt(a.rib.spine[a.rib.spine.length - 1] as Pt, b.rib.spine[b.rib.spine.length - 1] as Pt, 0.5)));
  const dip = add(mid, mul(inward, WEB_DIP_MM * k));
  const top = catmullRom([sa, pa, dip, pb, sb], 6);
  const roots = [eb[0] as Pt, ea[0] as Pt];
  return {d: polyPath([...top, ...roots], true), dip};
};

