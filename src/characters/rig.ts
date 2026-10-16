// rig.ts — a small 2D skeleton turned into ONE continuous outline (BIBLE4 §4): up the front of the torso, down
// around each arm's mitten, over the head, down the other arm, down and around each leg's foot hook, back to the
// start. Every pose of a character yields the same named segments in the same order (some may be empty), so a pose
// swap can redraw exactly the segments that changed. Pure geometry in figure px (y down, origin under the figure).
import type {XY} from '../paper';
import type {HeadGeom, Segment} from './types';
import {add, dot, lerp, mul, norm, perp, polar, rotateAbout, sub} from './vec';

export type Side = 0 | 1; // 0 = screen left, 1 = screen right
export type Pair = readonly [XY, XY];
export type Widths = readonly [number, number, number];
export type Sleeve = 'long' | 'pushed' | 'rolled';
export type Mitten = 'round' | 'phone';

/** Hair: the head outline from the left jaw to the right jaw (exclusive), already tilted. */
export type HairFn = (h: HeadGeom, ellipse: (deg: number, k?: number) => XY) => readonly XY[];

export type Skeleton = {
  readonly head: HeadGeom;
  readonly neck: XY;
  readonly sh: Pair;
  readonly el: Pair;
  readonly wr: Pair;
  readonly hip: Pair;
  readonly kn: Pair;
  readonly an: Pair;
  readonly neckHalf: number;
  readonly armW: Widths;
  readonly legW: Widths;
  /** Extra outline width beyond the hip joints (a cardigan, trousers). */
  readonly hipFlare: number;
  readonly mitten: number;
  readonly mittenShape: readonly [Mitten, Mitten];
  /** Signed toe length per foot (x direction). */
  readonly foot: readonly [number, number];
  readonly sleeve: Sleeve;
  readonly hair: HairFn;
  /** A skirt: half-width at the hem and the hem's y. The legs come out from under it. */
  readonly skirt?: {readonly hem: number; readonly hemY: number};
  /** Bust only (tree nodes, the window): the outline is cut at this y and has no arms or legs. */
  readonly bust?: number;
  /** The far limbs of a strongly turned figure are left out (the near ones carry the pose). */
  readonly hideArm?: Side;
  readonly hideLeg?: Side;
  /** Seated: the underside of the near hip, where the seat line meets the thigh. */
  readonly seat?: XY;
  readonly collar?: boolean;
  /** A backpack lobe behind this side's arm. */
  readonly backpack?: Side;
  /** A shoulder bag hanging at this side's hip. */
  readonly bag?: Side;
  /** A sock notch on this leg's outer line (one sock up, one down). */
  readonly sock?: Side;
};

export const SEGMENT_NAMES = [
  'sideL', 'armLin', 'mittenL', 'armLout', 'neckL', 'head', 'neckR', 'armRout', 'mittenR', 'armRin', 'sideR',
  'legRout', 'footR', 'legRin', 'crotch', 'legLin', 'footL', 'legLout',
] as const;

const JAW_DEG = {left: 122, right: 418} as const;
const ARMPIT_DOWN = 1.5;
const ARMPIT_IN = 0.3;
const CAP_UP = 0.8;
const CAP_IN = -0.45;
const TRAP_LIFT = 0.15;
const PACK = {out: 18, low: 22};
const WAIST_IN = 5;
const BACKPACK_OUT = 26;
const BAG = {w: 24, h: 34};

type Sides = {readonly outer: readonly XY[]; readonly inner: readonly XY[]};

/** The outline either side of a two-bone limb a→b→c with half-widths w; `out` says which way is away from the body. */
const limbSides = (a: XY, b: XY, c: XY, w: Widths, out: XY, sleeve: Sleeve | null): Sides => {
  const d1 = norm(sub(b, a));
  const d2 = norm(sub(c, b));
  let n1 = perp(d1);
  if (dot(n1, out) < 0) n1 = mul(n1, -1);
  let n2 = perp(d2);
  if (dot(n2, n1) < 0) n2 = mul(n2, -1);
  const nbRaw = add(n1, n2);
  const nb = dot(nbRaw, nbRaw) < 1e-6 ? n1 : norm(nbRaw);
  const bare = sleeve === 'pushed' || sleeve === 'rolled';
  const wElbow = bare ? w[1] * 1.05 : w[1];
  const wWrist = bare ? w[2] * 0.8 : w[2];
  const cuffAt = add(b, mul(d2, sleeve === 'rolled' ? 16 : 10));
  const cuff = bare ? [add(cuffAt, mul(n2, w[1] * 0.78))] : [];
  const cuffIn = bare ? [sub(cuffAt, mul(n2, w[1] * 0.78))] : [];
  return {
    outer: [add(a, mul(n1, w[0])), add(b, mul(nb, wElbow)), ...cuff, add(c, mul(n2, wWrist))],
    inner: [sub(a, mul(n1, w[0])), sub(b, mul(nb, wElbow)), ...cuffIn, sub(c, mul(n2, wWrist))],
  };
};

/** The mitten loop beyond the wrist, from the inner side round to the outer side. */
const mittenLoop = (b: XY, c: XY, halfW: number, length: number, shape: Mitten, out: XY): readonly XY[] => {
  const d = norm(sub(c, b));
  let n = perp(d);
  if (dot(n, out) < 0) n = mul(n, -1);
  const w = halfW;
  const at = (along: number, across: number): XY => add(c, add(mul(d, along), mul(n, across)));
  if (shape === 'phone') {
    return [at(length * 0.1, -w * 1.9), at(length * 1.25, -w * 1.7), at(length * 1.35, w * 0.9), at(length * 0.3, w * 1.1)];
  }
  return [at(length * 0.45, -w * 1.15), at(length * 0.95, -w * 0.6), at(length * 1.0, w * 0.35), at(length * 0.6, w * 1.05)];
};

/** The foot as one hook under the ankle: outer ankle → heel → toe → inner ankle. */
const footHook = (an: XY, halfW: number, toe: number, out: XY): readonly XY[] => {
  const sign = out[0] < 0 ? -1 : 1;
  const heel: XY = [an[0] + sign * halfW * 1.05, an[1] + halfW * 0.55];
  const sole: XY = [an[0] + toe * 0.45, an[1] + halfW * 0.9];
  const tip: XY = [an[0] + toe, an[1] + halfW * 0.55];
  const top: XY = [an[0] + toe * 0.5, an[1] + halfW * 0.05];
  return toe * sign >= 0 ? [heel, sole, tip, top] : [heel, [an[0] - sign * halfW * 0.3, an[1] + halfW * 0.95], tip, top];
};

const ellipseOf = (h: HeadGeom) => (deg: number, k = 1): XY => {
  const r = (deg * Math.PI) / 180;
  return rotateAbout([h.c[0] + Math.cos(r) * h.rx * k, h.c[1] + Math.sin(r) * h.ry * k], h.c, h.tilt);
};

/** Plain head: an egg from jaw to jaw over the crown. */
export const plainHair: HairFn = (_h, e) => [150, 180, 210, 240, 270, 300, 330, 360, 390].map((deg) => e(deg));

const sideOf = (i: Side): number => (i === 0 ? -1 : 1);

/** Build the outline segments of a skeleton. */
export const outline = (s: Skeleton): readonly Segment[] => {
  const e = ellipseOf(s.head);
  const jaw: Pair = [e(JAW_DEG.left), e(JAW_DEG.right)];
  const bust = s.bust !== undefined;
  const armHidden = (i: Side): boolean => bust || s.hideArm === i;
  const legHidden = (i: Side): boolean => bust || s.hideLeg === i;

  const torsoOut = (i: Side): XY => [sideOf(i), 0];
  const armpit = (i: Side): XY => {
    const sh = s.sh[i];
    return [sh[0] - sideOf(i) * s.armW[0] * ARMPIT_IN, sh[1] + s.armW[0] * ARMPIT_DOWN];
  };
  const hipOuter = (i: Side): XY => [s.hip[i][0] + sideOf(i) * (s.legW[0] + s.hipFlare), s.hip[i][1]];
  const waist = (i: Side): XY => {
    const a = armpit(i);
    const h = hipOuter(i);
    const m = lerp(h, a, 0.55);
    return [m[0] - sideOf(i) * WAIST_IN, m[1]];
  };
  const neckBase = (i: Side): XY => [s.neck[0] + sideOf(i) * s.neckHalf * 1.3, s.neck[1]];
  /** The round of the shoulder: up from the arm's outer line, over the deltoid, along the trapezius to the neck. */
  const shoulderRound = (i: Side): readonly XY[] => {
    const capTop: XY = [s.sh[i][0] - sideOf(i) * s.armW[0] * CAP_IN, s.sh[i][1] - s.armW[0] * CAP_UP];
    const trap = add(lerp(capTop, neckBase(i), 0.5), [0, -s.armW[0] * TRAP_LIFT]);
    return [capTop, trap];
  };
  const collar = (i: Side): readonly XY[] => (s.collar ? [[s.neck[0] + sideOf(i) * s.neckHalf * 0.7, s.neck[1] + 5]] : []);
  const neckTop = (i: Side): XY => jaw[i];

  const arm = (i: Side) => {
    const sides = limbSides(s.sh[i], s.el[i], s.wr[i], s.armW, torsoOut(i), s.sleeve);
    const out = perp(norm(sub(s.wr[i], s.el[i])));
    const outDir = dot(out, torsoOut(i)) < 0 ? mul(out, -1) : out;
    const wWrist = s.sleeve === 'long' ? s.armW[2] : s.armW[2] * 0.8;
    return {...sides, mitten: mittenLoop(s.el[i], s.wr[i], wWrist, s.mitten, s.mittenShape[i], outDir)};
  };
  const leg = (i: Side) => {
    const sides = limbSides(s.hip[i], s.kn[i], s.an[i], s.legW, torsoOut(i), null);
    const foot = footHook(s.an[i], s.legW[2], s.foot[i], torsoOut(i));
    const outer = sides.outer.flatMap((p, k) => (k === 2 && s.sock === i ? [add(p, [sideOf(i) * 2.5, -15]), add(p, [-sideOf(i) * 1.5, -13]), p] : [p]));
    return {outer, inner: sides.inner, foot};
  };

  /** A backpack seen past a turned figure's back: the torso's back contour bulges from the hip to above the shoulder. */
  const packBack = (i: Side): readonly XY[] => {
    const h = hipOuter(i);
    const sg = sideOf(i);
    return [[h[0] + sg * PACK.low, h[1] - 14], [s.sh[i][0] + sg * (s.armW[0] + PACK.out), s.sh[i][1] + 4]];
  };
  const backpackLobe = (i: Side, a: ReturnType<typeof arm>): readonly XY[] => {
    if (s.backpack !== i || armHidden(i)) return [];
    const el = a.outer[1] as XY;
    const sh = s.sh[i];
    const sg = sideOf(i);
    return [[el[0] + sg * BACKPACK_OUT * 0.75, el[1] - 10], [sh[0] + sg * (s.armW[0] + BACKPACK_OUT), sh[1] + 16], [sh[0] + sg * (s.armW[0] + BACKPACK_OUT * 0.75), sh[1] - 14], [sh[0] + sg * s.armW[0] * 0.6, sh[1] - s.armW[0] * 1.2]];
  };
  const bagLobe = (i: Side): readonly XY[] => {
    if (s.bag !== i) return [];
    const h = hipOuter(i);
    const sg = sideOf(i);
    return [[h[0] + sg * BAG.w * 0.9, h[1] - BAG.h], [h[0] + sg * BAG.w, h[1] + 6], [h[0] + sg * 3, h[1] + 8]];
  };

  const hem = s.skirt;
  const hipC: XY = [(s.hip[0][0] + s.hip[1][0]) / 2, Math.max(s.hip[0][1], s.hip[1][1])];
  const crotchPt: XY = s.seat ?? [hipC[0], hipC[1] + s.legW[0] * 1.1];
  const hemCorner = (i: Side): XY => (hem ? [hem.hem * sideOf(i) + hipC[0], hem.hemY] : hipOuter(i));
  const hemOverLeg = (i: Side, inner: boolean): XY => {
    const x = (inner ? sub(s.kn[i], [sideOf(i) * s.legW[1], 0]) : add(s.kn[i], [sideOf(i) * s.legW[1], 0]))[0];
    return [x, hem ? hem.hemY : crotchPt[1]];
  };

  const L = arm(0);
  const R = arm(1);
  const lL = leg(0);
  const lR = leg(1);

  const seg = (name: string, pts: readonly XY[]): Segment => ({name, pts});
  const cutL: XY = [armpit(0)[0] - 2, s.bust ?? 0];
  const cutR: XY = [armpit(1)[0] + 2, s.bust ?? 0];
  const start = bust ? cutL : legHidden(0) ? crotchPt : hemCorner(0);

  return [
    seg('sideL', bust ? [cutL, armpit(0)] : s.backpack === 0 && armHidden(0) ? [start, ...packBack(0)] : [start, ...(hem && !legHidden(0) ? [hipOuter(0)] : []), ...[...bagLobe(0)].reverse(), waist(0), armpit(0)]),
    seg('armLin', armHidden(0) ? [] : L.inner.slice(1)),
    seg('mittenL', armHidden(0) ? [] : L.mitten),
    seg('armLout', armHidden(0) ? shoulderRound(0) : [...[...L.outer].reverse(), ...backpackLobe(0, L), ...shoulderRound(0)]),
    seg('neckL', [neckBase(0), ...collar(0), neckTop(0)]),
    seg('head', s.hair(s.head, e)),
    seg('neckR', [neckTop(1), ...collar(1), neckBase(1)]),
    seg('armRout', armHidden(1) ? [...shoulderRound(1)].reverse() : [...[...shoulderRound(1)].reverse(), ...[...backpackLobe(1, R)].reverse(), ...R.outer]),
    seg('mittenR', armHidden(1) ? [] : [...R.mitten].reverse()),
    seg('armRin', armHidden(1) ? [] : [...R.inner].reverse().slice(0, -1)),
    seg('sideR', bust ? [armpit(1), cutR] : s.backpack === 1 && armHidden(1) ? [...[...packBack(1)].reverse(), legHidden(1) ? hipOuter(1) : hemCorner(1)] : [armpit(1), waist(1), ...bagLobe(1), ...(hem && !legHidden(1) ? [hipOuter(1)] : []), legHidden(1) ? hipOuter(1) : hemCorner(1)]),
    seg('legRout', legHidden(1) ? [] : [...(hem ? [hemOverLeg(1, false)] : []), ...lR.outer.slice(hem ? 1 : 0)]),
    seg('footR', legHidden(1) ? [] : lR.foot),
    seg('legRin', legHidden(1) ? [] : [...[...lR.inner].reverse().slice(0, -1), ...(hem ? [hemOverLeg(1, true)] : [])]),
    seg('crotch', bust || hem ? [] : [crotchPt]),
    seg('legLin', legHidden(0) ? [] : [...(hem ? [hemOverLeg(0, true)] : []), ...lL.inner.slice(1)]),
    seg('footL', legHidden(0) ? [] : [...lL.foot].reverse()),
    seg('legLout', legHidden(0) ? [] : [...[...lL.outer].reverse().slice(0, -1), ...(hem ? [hemOverLeg(0, false), hemCorner(0)] : [hipOuter(0)])]),
  ];
};

/** A point on the head egg at `deg` (90 = chin, 270 = crown), scaled by k, tilted with the head. */
export const headPoint = (h: HeadGeom, deg: number, k = 1): XY => ellipseOf(h)(deg, k);

/** Helper for pose builders: a two-bone limb from a joint by angles (degrees from straight down, positive = clockwise). */
export const limb = (from: XY, a1: number, l1: number, a2: number, l2: number): readonly [XY, XY] => {
  const mid = polar(from, a1, l1);
  return [mid, polar(mid, a1 + a2, l2)];
};
