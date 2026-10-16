// rig.ts — a small 2D skeleton turned into ONE continuous outline (BIBLE4 §4): up the front of the torso, down
// around each arm's mitten, over the head, down the other arm, down and around each leg's foot, back to the start.
// Every pose of a character yields the same named segments in the same order (some may be empty), so a pose swap can
// redraw exactly the segments that changed. Pure geometry in figure px (y down, origin under the figure).
//
// The drawing hand (A2 art pass): the torso is not a box but a soft S (ribcage, waist, hip; a chest or a belly on
// the front, the shoulder blade, the small of the back and the seat on the back); shoulders slope from the neck into a
// round deltoid; limbs swell and narrow (biceps, forearm, thigh, calf) with soft joints; a mitten has a thumb; a
// foot stands flat on the ground. Clothing is drawn INTO the outline: a cardigan hem, pushed-up or rolled sleeves,
// a collar, slippers, a backpack, a bag, a skirt, a sock.
import type {XY} from '../paper';
import type {HeadGeom, Segment} from './types';
import {add, dot, lerp, mul, norm, perp, polar, rotateAbout, sub} from './vec';

export type Side = 0 | 1; // 0 = screen left, 1 = screen right
export type Pair = readonly [XY, XY];
export type Widths = readonly [number, number, number];
export type Sleeve = 'long' | 'pushed' | 'rolled';
export type Mitten = 'round' | 'phone' | 'flat';
export type Shoe = 'shoe' | 'slipper';

/** Hair: the head outline from the left jaw to the right jaw (exclusive), already tilted. */
export type HairFn = (h: HeadGeom, ellipse: (deg: number, k?: number) => XY) => readonly XY[];

/** How the torso's two contours bend: the front (chest, belly) and the back (blade, small of the back, seat). */
export type TorsoShape = {
  readonly chest: number;
  readonly belly: number;
  readonly blade: number;
  readonly seat: number;
  /** The S of the spine: sideways offset of the mid-torso, px (+ = screen right). */
  readonly sway: number;
};

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
  readonly shoe: Shoe;
  readonly sleeve: Sleeve;
  readonly hair: HairFn;
  readonly torso: TorsoShape;
  /** Which way the figure faces, -1..1 (the head's facing). */
  readonly facing: number;
  /** A skirt or a long cardigan: half-width at the hem and the hem's y. The legs come out from under it. */
  readonly skirt?: {readonly hem: number; readonly hemY: number; readonly kind: 'skirt' | 'cardigan'};
  /** Bust only (tree nodes, the window): the outline is cut at this y and has no arms or legs. */
  readonly bust?: number;
  /** The far limbs of a strongly turned figure are left out (the near ones carry the pose). */
  readonly hideArm?: Side;
  readonly hideLeg?: Side;
  /** Seated or lying: the figure rests on this y (the seat or the mattress); the seat's back contour sits on it. */
  readonly seatY?: number;
  /** The leg carrying the weight: that flank creases at the waist, the other stretches. */
  readonly weight?: Side;
  /** Lying: this arm rests along the body; its underside is hidden and the belly line takes over at the hand. */
  readonly restArm?: Side;
  readonly collar?: boolean;
  /** A backpack lobe behind this side. */
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
const ARMPIT_DOWN = 1.6;
const ARMPIT_IN = 0.45;
const WAIST_IN = 6;
const BACKPACK = {out: 24, top: 8, low: 22};
const BAG = {w: 30, h: 36};
const SKIRT_FLARE = 6;

const sideOf = (i: Side): number => (i === 0 ? -1 : 1);

/**
 * The outward normal of a limb segment of side i: the outline runs clockwise on screen, so a left limb is
 * traversed outward on its left-hand side and a right limb on its right-hand side. Robust for any limb direction
 * (the x-sign test it replaces flipped on horizontal thighs and forearms, crossing the outline).
 */
const outNormal = (d: XY, i: Side): XY => (i === 0 ? perp(d) : mul(perp(d), -1));

type Sides = {readonly outer: readonly XY[]; readonly inner: readonly XY[]};

type LimbLook = {
  /** Width multipliers [outer, inner] at 40% of the first bone and 30% of the second (muscle swell). */
  readonly swell1: readonly [number, number];
  readonly swell2: readonly [number, number];
  readonly sleeve: Sleeve | null;
};

/** The outline either side of a two-bone limb a→b→c with half-widths w, swelling between soft joints. */
const limbSides = (a: XY, b: XY, c: XY, w: Widths, i: Side, look: LimbLook): Sides => {
  const d1 = norm(sub(b, a));
  const d2 = norm(sub(c, b));
  const n1 = outNormal(d1, i);
  const n2 = outNormal(d2, i);
  const nbRaw = add(n1, n2);
  const nb = dot(nbRaw, nbRaw) < 1e-6 ? n1 : norm(nbRaw);
  const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
  const bare = look.sleeve === 'pushed' || look.sleeve === 'rolled';
  // The joint is narrower than the swell either side of it; a bent joint gets a touch wider on the outside.
  const bend = 1 - dot(d1, d2);
  const wJointOut = w[1] * (1 + bend * 0.12);
  const wJointIn = w[1] * (1 - bend * 0.18);
  const wForearm = bare ? w[2] * 1.05 : (w[1] + w[2]) / 2;
  const wEnd = bare ? w[2] * 0.82 : w[2];
  const m1 = add(a, mul(d1, l1 * 0.4));
  const m2 = add(b, mul(d2, l2 * 0.3));
  const swellW1 = (w[0] + w[1]) / 2;
  const side = (s: number): readonly XY[] => {
    const k = s > 0 ? 0 : 1;
    const pts: XY[] = [
      add(a, mul(n1, s * w[0])),
      add(m1, mul(n1, s * swellW1 * (look.swell1[k] ?? 1))),
      add(b, mul(nb, s * (s > 0 ? wJointOut : wJointIn))),
    ];
    if (look.sleeve === 'pushed') {
      // The sleeve bunched just below the elbow, then the bare forearm.
      pts.push(add(add(b, mul(d2, l2 * 0.16)), mul(n2, s * w[1] * 1.12)));
      pts.push(add(add(b, mul(d2, l2 * 0.27)), mul(n2, s * w[1] * 1.0)));
      pts.push(add(add(b, mul(d2, l2 * 0.36)), mul(n2, s * wForearm * 0.95)));
    } else if (look.sleeve === 'rolled') {
      // A rolled band at the elbow: a crisp roll, then the forearm.
      pts.push(add(add(b, mul(d2, l2 * 0.08)), mul(n2, s * w[1] * 1.14)));
      pts.push(add(add(b, mul(d2, l2 * 0.2)), mul(n2, s * w[1] * 1.12)));
      pts.push(add(add(b, mul(d2, l2 * 0.27)), mul(n2, s * wForearm * 0.98)));
    } else {
      pts.push(add(m2, mul(n2, s * wForearm * (look.swell2[k] ?? 1))));
    }
    if (look.sleeve === 'long') pts.push(add(add(c, mul(d2, -4)), mul(n2, s * wEnd * 1.08)));
    pts.push(add(c, mul(n2, s * wEnd)));
    return pts;
  };
  return {outer: side(1), inner: side(-1)};
};

/** The mitten beyond the wrist, from the inner side round to the outer side, with a hint of a thumb on the inner side. */
const mittenLoop = (b: XY, c: XY, halfW: number, length: number, shape: Mitten, i: Side): readonly XY[] => {
  const d = norm(sub(c, b));
  const n = outNormal(d, i);
  const w = halfW;
  const at = (along: number, across: number): XY => add(c, add(mul(d, along), mul(n, across)));
  if (shape === 'phone') {
    // The hand closed round a phone: the phone's edge stands out past the fingers.
    return [at(length * 0.1, -w * 1.25), at(length * 0.2, -w * 2.2), at(length * 1.3, -w * 2.0), at(length * 1.35, w * 0.4), at(length * 0.85, w * 1.2), at(length * 0.3, w * 1.1)];
  }
  if (shape === 'flat') {
    // A hand laid flat (on a table, on a frame): long and thin, the thumb tucked along it.
    return [at(length * 0.25, -w * 1.15), at(length * 0.75, -w * 0.95), at(length * 1.2, -w * 0.35), at(length * 1.18, w * 0.5), at(length * 0.55, w * 1.0)];
  }
  return [
    at(length * 0.1, -w * 1.2),
    at(length * 0.32, -w * 1.5),
    at(length * 0.48, -w * 1.25),
    at(length * 0.88, -w * 0.85),
    at(length * 1.05, -w * 0.05),
    at(length * 0.92, w * 0.85),
    at(length * 0.45, w * 1.12),
  ];
};

/**
 * The foot standing flat on its ground (y = ground): from the leg's outer line round to its inner line. The sole is
 * flat; a shoe has a heel and a toe, a slipper is a soft rounded loaf with the opening at the ankle.
 */
const footShape = (an: XY, halfW: number, toe: number, i: Side, ground: number, shoe: Shoe): readonly XY[] => {
  const t = toe >= 0 ? 1 : -1;
  const len = Math.max(Math.abs(toe), halfW * 1.1);
  const h = ground - an[1];
  const x = an[0];
  const puff = shoe === 'slipper' ? 1.25 : 1;
  // From the heel round the toe to the instep (heel side first).
  const heelToToe: readonly XY[] = [
    [x - t * halfW * 1.0, an[1] + h * 0.55],
    [x - t * halfW * 0.85, ground],
    [x + t * len * 0.55, ground + 0.5],
    [x + t * len * 0.98, ground - h * 0.2 * puff],
    [x + t * len * 0.88, ground - h * 0.62 * puff],
    ...(shoe === 'slipper' ? [[x + t * len * 0.4, ground - h * 0.95] as XY, [x + t * halfW * 0.9, an[1] + h * 0.3] as XY] : [[x + t * len * 0.35, an[1] + h * 0.35] as XY]),
  ];
  // Which ankle side does the heel sit on? The outer line of the leg is on side sideOf(i).
  const toeOnOuter = t === sideOf(i);
  return toeOnOuter ? [...heelToToe].reverse() : heelToToe;
};

const ellipseOf = (h: HeadGeom) => (deg: number, k = 1): XY => {
  const r = (deg * Math.PI) / 180;
  return rotateAbout([h.c[0] + Math.cos(r) * h.rx * k, h.c[1] + Math.sin(r) * h.ry * k], h.c, h.tilt);
};

/** Plain head: an egg from jaw to jaw over the crown. */
export const plainHair: HairFn = (_h, e) => [150, 180, 210, 240, 270, 300, 330, 360, 390].map((deg) => e(deg));

/** Build the outline segments of a skeleton. */
export const outline = (s: Skeleton): readonly Segment[] => {
  const e = ellipseOf(s.head);
  const jaw: Pair = [e(JAW_DEG.left), e(JAW_DEG.right)];
  const bust = s.bust !== undefined;
  const seated = s.seatY !== undefined;
  const armHidden = (i: Side): boolean => bust || s.hideArm === i;
  const legHidden = (i: Side): boolean => bust || s.hideLeg === i;
  const fs = s.facing >= 0 ? 1 : -1;
  const af = Math.min(1, Math.abs(s.facing));
  /** How much side i is the figure's front (0..1) or its back (0..1). */
  const frontness = (i: Side): number => Math.max(0, sideOf(i) * fs) * af;
  const backness = (i: Side): number => Math.max(0, -sideOf(i) * fs) * af;

  const hipC = lerp(s.hip[0], s.hip[1], 0.5);
  const spineUp = norm(sub(s.neck, hipC));
  /** Across the torso, toward screen-right when upright (follows the lean). */
  const across: XY = [-spineUp[1], spineUp[0]];
  const torsoLen = Math.hypot(s.neck[0] - hipC[0], s.neck[1] - hipC[1]);
  const along = (t: number): XY => add(hipC, mul(spineUp, torsoLen * t));
  const swayAt = (t: number): number => s.torso.sway * 4 * t * (1 - t);
  const outDir = (i: Side): XY => mul(across, sideOf(i));

  // With the arm hidden (a bust, a turned figure's far side) the contour flows from the deltoid straight down.
  const armpit = (i: Side): XY => {
    const sh = s.sh[i];
    const inset = armHidden(i) ? -0.85 : ARMPIT_IN;
    return add(add(sh, mul(outDir(i), -s.armW[0] * inset)), mul(spineUp, -s.armW[0] * ARMPIT_DOWN));
  };
  const hipOuter = (i: Side): XY => add(s.hip[i], mul(outDir(i), seated && backness(i) > 0 ? s.legW[0] * 0.8 + s.hipFlare * 0.5 : s.legW[0] + s.hipFlare));
  /** A point on side i of the torso at height t (0 hip .. 1 armpit) with extra outward push. */
  const torsoAt = (i: Side, t: number, push: number): XY => {
    const a = armpit(i);
    const h = hipOuter(i);
    const base = lerp(h, a, t);
    return add(add(base, mul(outDir(i), push)), mul(across, swayAt(t)));
  };
  const flank = (i: Side): readonly XY[] => {
    const f = frontness(i);
    const b = backness(i);
    const flat = 1 - f - b;
    const t = s.torso;
    const crease = s.weight === undefined ? 0 : s.weight === i ? -3 : 2;
    if (seated && b > 0) {
      // The seated back: the small of the back curves in above the seat, the shoulder blade rounds out.
      return [torsoAt(i, 0.1, 1), torsoAt(i, 0.36, -WAIST_IN * 1.5), torsoAt(i, 0.76, b * t.blade + 1)];
    }
    const waist = torsoAt(i, 0.42, -WAIST_IN * (0.6 + flat * 0.6) + f * t.belly - b * 4 + crease);
    const rib = torsoAt(i, 0.74, flat * 2 + f * t.chest + b * t.blade);
    const low = torsoAt(i, 0.16, f * t.belly * 0.6 + b * t.seat * 0.8);
    return [low, waist, rib];
  };

  const neckBase = (i: Side): XY => add(add(s.neck, mul(outDir(i), s.neckHalf * 1.35)), mul(spineUp, -2));
  /** The slope of the shoulder: from the neck, a long gentle fall over the trapezius into the round of the deltoid. */
  const shoulderRound = (i: Side): readonly XY[] => {
    const sh = s.sh[i];
    const w = s.armW[0];
    const round = add(add(sh, mul(outDir(i), w * 0.92)), mul(spineUp, w * 0.5));
    const delt = add(add(sh, mul(outDir(i), w * 0.45)), mul(spineUp, w * 0.88));
    const nb = neckBase(i);
    const trap = add(lerp(delt, nb, 0.5), mul(spineUp, w * 0.1));
    return [round, delt, trap];
  };
  const collarPts = (i: Side): readonly XY[] => {
    if (!s.collar) return [];
    const nb = neckBase(i);
    // A shirt collar: the wing points out and down past the neck, then back up round the neck.
    return [add(add(nb, mul(outDir(i), 4)), mul(spineUp, -5)), add(add(nb, mul(outDir(i), -1.5)), mul(spineUp, 7))];
  };

  const armLook = (i: Side): LimbLook => ({swell1: [1.02, 1.12], swell2: [1.12, 1.0], sleeve: s.sleeve});
  const legLook = (i: Side): LimbLook => {
    const f = frontness(i);
    const b = backness(i);
    // Seen from the side the thigh's front swells and the calf at the back; from the front, both a little.
    return {swell1: [1.04 + (f - b) * 0.04, 1.04 - (f - b) * 0.04], swell2: [1.04 + b * 0.16 - f * 0.04, 1.04 + f * 0.16 - b * 0.04], sleeve: null};
  };

  const arm = (i: Side) => {
    const sides = limbSides(s.sh[i], s.el[i], s.wr[i], s.armW, i, armLook(i));
    const wWrist = Math.max(s.sleeve === 'long' ? s.armW[2] : s.armW[2] * 0.82, s.mitten * 0.34);
    return {...sides, mitten: mittenLoop(s.el[i], s.wr[i], wWrist, s.mitten, s.mittenShape[i], i)};
  };
  const leg = (i: Side) => {
    const sides = limbSides(s.hip[i], s.kn[i], s.an[i], s.legW, i, legLook(i));
    const foot = footShape(s.an[i], s.legW[2], s.foot[i], i, s.an[i][1] + s.legW[2] * 1.3, s.shoe);
    const outer = sides.outer.flatMap((p, k) =>
      k === sides.outer.length - 2 && s.sock === i ? [add(p, [sideOf(i) * 3, -12]), add(p, [-sideOf(i) * 0.5, -10]), p] : [p],
    );
    return {outer, inner: sides.inner, foot};
  };

  /** A backpack seen past a turned figure's back: a deep lobe from the hip to above the shoulder. */
  const packBack = (i: Side): readonly XY[] => {
    const sg = sideOf(i);
    const h = hipOuter(i);
    const sh = s.sh[i];
    return [
      [h[0] + sg * 6, h[1] - 6],
      [h[0] + sg * BACKPACK.low, h[1] - 18],
      [sh[0] + sg * (s.armW[0] + BACKPACK.out), sh[1] + 30],
      [sh[0] + sg * (s.armW[0] + BACKPACK.out * 0.8), sh[1] - BACKPACK.top],
      [sh[0] + sg * s.armW[0] * 0.9, sh[1] - s.armW[0] * 1.3],
    ];
  };
  const backpackLobe = (i: Side, a: ReturnType<typeof arm>): readonly XY[] => {
    if (s.backpack !== i || armHidden(i)) return [];
    const el = a.outer[2] as XY;
    const sh = s.sh[i];
    const sg = sideOf(i);
    return [[el[0] + sg * BACKPACK.out * 0.7, el[1] - 6], [sh[0] + sg * (s.armW[0] + BACKPACK.out), sh[1] + 18], [sh[0] + sg * (s.armW[0] + BACKPACK.out * 0.75), sh[1] - BACKPACK.top], [sh[0] + sg * s.armW[0] * 0.6, sh[1] - s.armW[0] * 1.2]];
  };
  const bagLobe = (i: Side): readonly XY[] => {
    if (s.bag !== i) return [];
    const h = hipOuter(i);
    const sg = sideOf(i);
    return [[h[0] + sg * 2, h[1] - BAG.h * 0.9], [h[0] + sg * BAG.w * 0.95, h[1] - BAG.h * 0.85], [h[0] + sg * BAG.w * 1.05, h[1] + 8], [h[0] + sg * BAG.w * 0.5, h[1] + 14], [h[0] + sg * 3, h[1] + 10]];
  };

  const hem = s.skirt;
  const crotchPt: XY = seated
    ? [hipC[0] - fs * s.legW[0] * 0.2, (s.seatY ?? 0)]
    : [hipC[0], Math.max(s.hip[0][1], s.hip[1][1]) + s.legW[0] * 1.15];
  const hemCorner = (i: Side): XY => {
    if (!hem) return hipOuter(i);
    const flare = hem.kind === 'skirt' ? SKIRT_FLARE : 2;
    return [hipC[0] + sideOf(i) * (hem.hem + flare), hem.hemY];
  };
  /** Where the leg's line leaves the hem (outer or inner side of the leg). */
  const hemOverLeg = (i: Side, inner: boolean, L: ReturnType<typeof leg>): XY => {
    const line = inner ? L.inner : L.outer;
    const y = hem ? hem.hemY + 1 : crotchPt[1];
    // Interpolate the leg line at the hem's height.
    for (let k = 1; k < line.length; k += 1) {
      const a = line[k - 1] as XY;
      const b = line[k] as XY;
      if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) return lerp(a, b, (y - a[1]) / (b[1] - a[1]));
    }
    return [(line[1] as XY)[0], y];
  };

  /** Seated: the back contour runs down the back, rounds over the seat and sits on the chair. */
  const seatBack = (i: Side): readonly XY[] => {
    const sy = s.seatY ?? 0;
    const sg = sideOf(i);
    const h = hipOuter(i);
    return [[h[0] + sg * (s.torso.seat * 0.3), h[1] + (sy - h[1]) * 0.4], [h[0] - sg * s.legW[0] * 0.2, sy]];
  };

  const belowHem = (line: readonly XY[]): readonly XY[] => line.filter((p) => p[1] > (hem?.hemY ?? 0) + 3);

  const L = arm(0);
  const R = arm(1);
  const lL = leg(0);
  const lR = leg(1);

  const seg = (name: string, pts: readonly XY[]): Segment => ({name, pts});
  const cutL: XY = [armpit(0)[0] - 2, s.bust ?? 0];
  const cutR: XY = [armpit(1)[0] + 2, s.bust ?? 0];
  const backSide: Side = fs > 0 ? 0 : 1;
  const seatedBack = (i: Side): boolean => seated && i === backSide && legHidden(i);

  // The torso's side i from bottom to the armpit (sideL runs up; sideR runs down, so it is reversed there).
  const torsoUp = (i: Side): readonly XY[] => {
    if (bust) return [i === 0 ? cutL : cutR, armpit(i)];
    if (s.backpack === i && armHidden(i)) return [...(seatedBack(i) ? [...seatBack(i)].reverse() : []), ...packBack(i)];
    const bottom: readonly XY[] = seatedBack(i)
      ? [...seatBack(i)].reverse()
      : legHidden(i)
        ? []
        : hem
          ? [hemCorner(i), add(hipOuter(i), [sideOf(i) * (hem.kind === 'skirt' ? 1 : 3), 0])]
          : [hipOuter(i)];
    const bag = i === 0 ? [...bagLobe(0)].reverse() : [...bagLobe(1)].reverse();
    return [...bottom, ...bag, ...flank(i), armpit(i)];
  };
  // Lying with an arm resting on the body: the belly line starts where the hand rests.
  const restCut = (i: Side, pts: readonly XY[]): readonly XY[] => {
    if (s.restArm !== i) return pts;
    const w = s.wr[i];
    const below = pts.filter((p) => dot(sub(p, w), spineUp) < -4);
    return [...below, add(w, mul(outDir(i), -2))];
  };

  const start = seated && legHidden(0) && !seatedBack(0) ? crotchPt : null;
  const sideLpts = [...(start ? [start] : []), ...restCut(0, torsoUp(0))];
  const sideRpts = [...[...restCut(1, torsoUp(1))].reverse(), ...(seated && legHidden(1) && !seatedBack(1) ? [crotchPt] : [])];

  const armIn = (i: Side, a: ReturnType<typeof arm>): readonly XY[] => (s.restArm === i ? a.inner.slice(-1) : a.inner.slice(1));

  return [
    seg('sideL', sideLpts),
    seg('armLin', armHidden(0) ? [] : armIn(0, L)),
    seg('mittenL', armHidden(0) ? [] : L.mitten),
    seg('armLout', armHidden(0) ? shoulderRound(0) : [...[...L.outer].reverse(), ...backpackLobe(0, L), ...shoulderRound(0)]),
    seg('neckL', [neckBase(0), ...collarPts(0), jaw[0]]),
    seg('head', s.hair(s.head, e)),
    seg('neckR', [jaw[1], ...[...collarPts(1)].reverse(), neckBase(1)]),
    seg('armRout', armHidden(1) ? [...shoulderRound(1)].reverse() : [...[...shoulderRound(1)].reverse(), ...[...backpackLobe(1, R)].reverse(), ...R.outer]),
    seg('mittenR', armHidden(1) ? [] : [...R.mitten].reverse()),
    seg('armRin', armHidden(1) ? [] : [...armIn(1, R)].reverse()),
    seg('sideR', sideRpts),
    seg('legRout', legHidden(1) ? [] : hem ? [hemOverLeg(1, false, lR), ...belowHem(lR.outer)] : lR.outer),
    seg('footR', legHidden(1) ? [] : lR.foot),
    seg('legRin', legHidden(1) ? [] : hem ? [...[...belowHem(lR.inner)].reverse(), hemOverLeg(1, true, lR)] : [...lR.inner].reverse().slice(0, -1)),
    seg('crotch', bust || hem || seated ? [] : [crotchPt]),
    seg('legLin', legHidden(0) ? [] : hem ? [hemOverLeg(0, true, lL), ...belowHem(lL.inner)] : lL.inner.slice(1)),
    seg('footL', legHidden(0) ? [] : [...lL.foot].reverse()),
    seg('legLout', legHidden(0) ? [] : hem ? [...[...belowHem(lL.outer)].reverse(), hemOverLeg(0, false, lL)] : [...lL.outer].reverse()),
  ];
};

/** A point on the head egg at `deg` (90 = chin, 270 = crown), scaled by k, tilted with the head. */
export const headPoint = (h: HeadGeom, deg: number, k = 1): XY => ellipseOf(h)(deg, k);

/** Helper for pose builders: a two-bone limb from a joint by angles (degrees from straight down, positive = clockwise). */
export const limb = (from: XY, a1: number, l1: number, a2: number, l2: number): readonly [XY, XY] => {
  const mid = polar(from, a1, l1);
  return [mid, polar(mid, a1 + a2, l2)];
};

/** Two-bone IK: the middle joint of a limb from a to c with bone lengths l1, l2, bending toward `bendDir`. */
export const ik = (a: XY, c: XY, l1: number, l2: number, bendDir: XY): XY => {
  const d = sub(c, a);
  const dist = Math.min(Math.hypot(d[0], d[1]), l1 + l2 - 0.01);
  const u = norm(d);
  const x = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  let n = perp(u);
  if (dot(n, bendDir) < 0) n = mul(n, -1);
  return add(add(a, mul(u, x)), mul(n, h));
};
