// designs.ts — the seven characters of the design sheet (BIBLE4 §4): proportions, silhouette, the one accent
// detail, and the poses the chapters need. Pure: every pose is a function of the proportions.
import type {XY} from '../paper';
import {beardStrokes, capHair, cropHair, faceStrokes, knotHair, plainHead, ponytailHair, quiffHair, type Mood} from './faces';
import {dogPoses} from './dog';
import {headPoint, limb, outline, type HairFn, type Mitten, type Side, type Skeleton, type Sleeve, type Widths} from './rig';
import type {CharacterDesign, CharacterId, Figure, HeadGeom, Polyline, PoseId} from './types';
import {add, lerp, mul, norm, perp, rotate, rotateAbout, sub, RAD} from './vec';

export type Proportions = {
  readonly headR: number;
  readonly headRy: number;
  readonly neckLen: number;
  readonly neckHalf: number;
  readonly shoulderX: number;
  readonly shoulderDrop: number;
  readonly torso: number;
  readonly hipX: number;
  readonly upperArm: number;
  readonly foreArm: number;
  readonly thigh: number;
  readonly shin: number;
  readonly armW: Widths;
  readonly legW: Widths;
  readonly hipFlare: number;
  readonly mitten: number;
  readonly foot: number;
  readonly sleeve: Sleeve;
  readonly hair: HairFn;
  readonly collar?: boolean;
  readonly backpack?: Side;
  readonly bag?: Side;
  readonly skirt?: {readonly hem: number; readonly drop: number};
  readonly sock?: Side;
  readonly stoop?: number;
  readonly beard?: boolean;
  readonly mittens?: readonly [Mitten, Mitten];
};

/** Arm angles per side in degrees: [upper arm from straight down, forearm bend]; positive = away from the body. */
export type Arms = readonly [readonly [number, number], readonly [number, number]];

export type PoseOpts = {
  readonly facing?: number;
  /** Torso lean in degrees, positive toward the facing side. */
  readonly lean?: number;
  /** Head tilt in degrees, positive = chin up toward the facing side (looking up). */
  readonly headUp?: number;
  readonly arms?: Arms;
  readonly stance?: number;
  /** Toe direction per foot, -1..1 (default: a little outward). */
  readonly feet?: readonly [number, number];
  readonly mood?: Mood;
  readonly mittens?: readonly [Mitten, Mitten];
  /** Bent knees: a seated or lying figure sets these itself. */
  readonly kneeBend?: number;
  /** Leave out the far arm / leg of a turned figure (default: both when |facing| >= FAR_HIDE and seated). */
  readonly farArm?: 'hide' | 'show';
  readonly farLeg?: 'hide' | 'show';
  /** Forearm length per side as a fraction (foreshortening of an arm coming toward the viewer). */
  readonly foreArmScale?: readonly [number, number];
};

const HANGING: Arms = [[9, -5], [9, -5]];
const FAR_HIDE = 0.55;
const FORESHORTEN = 0.42;
const WOBBLE = 1.1;
const BUST_DEPTH = 0.42;
const GROUND_CLEAR = 0.9;

type Joints = {hip: readonly [XY, XY]; kn: readonly [XY, XY]; an: readonly [XY, XY]; seat?: XY};

const skeletonOf = (p: Proportions, o: PoseOpts, joints: Joints, seated: boolean, bust?: number): Skeleton => {
  const facing = o.facing ?? 0;
  const fs = facing >= 0 ? 1 : -1;
  const far: 0 | 1 = facing >= 0 ? 0 : 1;
  const af = Math.abs(facing);
  const leanRad = (o.lean ?? 0) * fs * RAD;
  const stoop = p.stoop ?? 0;
  const hipC = lerp(joints.hip[0], joints.hip[1], 0.5);
  const up = (d: number): XY => rotate([0, -d], leanRad);
  const neck = add(add(hipC, up(p.torso)), [stoop * fs * 0.6, stoop * 0.4]);
  // Foreshortening: the far shoulder comes in as the figure turns.
  const shX = (i: 0 | 1): number => p.shoulderX * (i === far ? 1 - FORESHORTEN * af : 1 + 0.08 * af);
  const sh: readonly [XY, XY] = [add(neck, rotate([-shX(0), p.shoulderDrop], leanRad)), add(neck, rotate([shX(1), p.shoulderDrop], leanRad))];
  const tilt = -(o.headUp ?? 0) * fs * RAD;
  const headC = add(add(neck, rotate([facing * 5 + stoop * fs * 0.8, -(p.neckLen + p.headRy)], leanRad)), [0, stoop * 0.3]);
  const head: HeadGeom = {c: headC, rx: p.headR, ry: p.headRy, facing, tilt};
  const arms = o.arms ?? HANGING;
  const armOf = (i: 0 | 1): readonly [XY, XY] => {
    const sign = i === 0 ? -1 : 1;
    const a = arms[i];
    return limb(sh[i], sign * a[0] + (o.lean ?? 0) * fs * 0.3, p.upperArm, sign * a[1], p.foreArm * (o.foreArmScale?.[i] ?? 1));
  };
  const [elL, wrL] = armOf(0);
  const [elR, wrR] = armOf(1);
  const feet = o.feet ?? [-0.9, 0.9];
  const hideFar = af >= FAR_HIDE;
  const hideArm = (o.farArm ?? (hideFar && seated ? 'hide' : 'show')) === 'hide' ? far : undefined;
  const hideLeg = (o.farLeg ?? (hideFar && seated ? 'hide' : 'show')) === 'hide' ? far : undefined;
  return {
    head,
    neck,
    sh,
    el: [elL, elR],
    wr: [wrL, wrR],
    hip: joints.hip,
    kn: joints.kn,
    an: joints.an,
    neckHalf: p.neckHalf,
    armW: p.armW,
    legW: p.legW,
    hipFlare: p.hipFlare,
    mitten: p.mitten,
    mittenShape: o.mittens ?? p.mittens ?? ['round', 'round'],
    foot: [feet[0] * p.foot, feet[1] * p.foot],
    sleeve: p.sleeve,
    hair: p.hair,
    skirt: p.skirt ? {hem: p.skirt.hem, hemY: hipC[1] + p.skirt.drop} : undefined,
    bust,
    hideArm,
    hideLeg,
    seat: hideLeg === undefined ? undefined : joints.seat,
    collar: p.collar,
    backpack: p.backpack,
    bag: p.bag,
    sock: p.sock,
  };
};

const standingJoints = (p: Proportions, o: PoseOpts): Joints => {
  const ankleY = -p.legW[2] * GROUND_CLEAR;
  const stance = o.stance ?? 5;
  const bend = o.kneeBend ?? 0;
  const an: readonly [XY, XY] = [[-p.hipX - stance, ankleY], [p.hipX + stance, ankleY]];
  const legLen = (p.thigh + p.shin) * (0.985 - bend * 0.1);
  const hipY = ankleY - legLen;
  const hip: readonly [XY, XY] = [[-p.hipX, hipY], [p.hipX, hipY]];
  const kn: readonly [XY, XY] = [[lerp(hip[0], an[0], 0.5)[0] - 1 - bend * 10, hipY + p.thigh], [lerp(hip[1], an[1], 0.5)[0] + 1 + bend * 10, hipY + p.thigh]];
  return {hip, kn, an};
};

/** Seated on a kitchen chair, the near thigh toward the facing side; the far leg sits a little behind. */
const seatedJoints = (p: Proportions, o: PoseOpts): Joints => {
  const facing = o.facing ?? 0;
  const fs = facing >= 0 ? 1 : -1;
  const af = Math.abs(facing);
  const ankleY = -p.legW[2] * GROUND_CLEAR;
  const seat = p.shin * 0.92 + 12;
  const hipY = ankleY - seat;
  const near: 0 | 1 = facing >= 0 ? 1 : 0;
  const back = -fs * p.hipX * 0.9;
  const hipAt = (i: 0 | 1): XY => (i === near ? [back + fs * 4, hipY] : [back - fs * 6, hipY - 4]);
  const hip: readonly [XY, XY] = [hipAt(0), hipAt(1)];
  const forward = 0.35 + 0.45 * af;
  const knAt = (i: 0 | 1): XY => [hipAt(i)[0] + fs * p.thigh * forward, hipY + 6 + (1 - af) * 12];
  const kn: readonly [XY, XY] = [knAt(0), knAt(1)];
  const an: readonly [XY, XY] = [[knAt(0)[0] + fs * p.shin * 0.1 - (1 - af) * 8, ankleY], [knAt(1)[0] + fs * p.shin * 0.1 + (1 - af) * 8, ankleY]];
  const seatPt: XY = [hipAt(near)[0] - fs * p.legW[0] * 0.9, hipY + p.legW[0] * 1.05];
  return {hip, kn, an, seat: seatPt};
};

const faceOf = (p: Proportions, sk: Skeleton, o: PoseOpts): readonly Polyline[] => [
  ...faceStrokes(sk.head, o.mood ?? 'warm'),
  ...(p.beard ? beardStrokes(sk.head) : []),
];

type AccentFn = (sk: Skeleton) => readonly Polyline[];

const circlePts = (c: XY, r: number, n = 10): readonly XY[] =>
  Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI * 0.6;
    return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r] as const;
  });

const figure = (p: Proportions, o: PoseOpts, accent: AccentFn, kind: 'stand' | 'sit' | 'bust' | 'lie'): Figure => {
  const joints = kind === 'sit' ? seatedJoints(p, o) : standingJoints(p, o);
  const base = skeletonOf(p, o, joints, kind === 'sit');
  const cut = base.neck[1] + p.torso * BUST_DEPTH;
  // A bust stands on its cut line: its origin is the sill or the node's centre line, not the floor.
  const sk = kind === 'bust' ? shiftSkeleton(skeletonOf(p, o, joints, false, cut), [0, -cut]) : base;
  const lying = kind === 'lie' ? rotateSkeleton(sk, -90 * RAD, p) : sk;
  return {body: outline(lying), face: faceOf(p, lying, o), accent: accent(lying), wobble: WOBBLE};
};

const mapSkeleton = (s: Skeleton, f: (q: XY) => XY, tilt = 0): Skeleton => {
  const pair = (q: readonly [XY, XY]): readonly [XY, XY] => [f(q[0]), f(q[1])];
  return {...s, head: {...s.head, c: f(s.head.c), tilt: s.head.tilt + tilt}, neck: f(s.neck), sh: pair(s.sh), el: pair(s.el), wr: pair(s.wr), hip: pair(s.hip), kn: pair(s.kn), an: pair(s.an), bust: s.bust === undefined ? undefined : f([0, s.bust])[1], seat: s.seat ? f(s.seat) : undefined};
};
const shiftSkeleton = (s: Skeleton, by: XY): Skeleton => mapSkeleton(s, (q) => add(q, by));

/** Lay a standing skeleton down (head to the left), resting on the ground line. */
const rotateSkeleton = (s: Skeleton, rad: number, p: Proportions): Skeleton => {
  const o: XY = [0, 0];
  const shift: XY = [p.headRy + p.neckLen + p.torso + p.thigh + p.shin - 10, -(p.shoulderX + p.armW[0] + 4)];
  return mapSkeleton(s, (q) => add(rotateAbout(q, o, rad), shift), rad);
};

// ---- accent details -------------------------------------------------------------------------------------------

const hairClip: AccentFn = (sk) => {
  const t = headPoint(sk.head, 198, 1.02);
  return [{pts: [add(t, [-4, 2]), add(t, [-1, 7]), add(t, [7, -4])], smooth: 0.3}];
};
const glasses: AccentFn = (sk) => {
  const h = sk.head;
  const s = h.facing * 0.3;
  const at = (x: number, y: number): XY => rotateAbout([h.c[0] + x * h.rx, h.c[1] + y * h.ry], h.c, h.tilt);
  const r = 14;
  const l = at(-0.56 + s, 0.06);
  const rr = at(0.56 + s, 0.06);
  return [{pts: circlePts(l, r), smooth: 1, closed: true}, {pts: [add(l, [r, -3]), add(rr, [-r, -3])], smooth: 0}, {pts: circlePts(rr, r), smooth: 1, closed: true}];
};
const capBrim: AccentFn = (sk) => {
  const f = sk.head.facing >= 0 ? 1 : -1;
  const start = headPoint(sk.head, f > 0 ? 357 : 183, 1.1);
  return [{pts: [start, add(start, [f * 24, 5]), add(start, [f * 48, 4])], smooth: 1}];
};
const bobble: AccentFn = (sk) => {
  const h = sk.head;
  const back = h.facing >= 0 ? -1 : 1;
  const c = rotateAbout([h.c[0] + back * 1.22 * h.rx, h.c[1] + 0.3 * h.ry], h.c, h.tilt);
  return [{pts: circlePts(c, 8, 8), smooth: 1, closed: true}];
};
const watchStrap: AccentFn = (sk) => {
  const d = norm(sub(sk.wr[0], sk.el[0]));
  const n = perp(d);
  const c = sub(sk.wr[0], mul(d, 7));
  const w = sk.sleeve === 'long' ? sk.armW[2] : sk.armW[2] * 0.72;
  const pts: readonly XY[] = [add(add(c, mul(d, -5)), mul(n, -w - 2)), add(add(c, mul(d, 5)), mul(n, -w - 2)), add(add(c, mul(d, 5)), mul(n, w + 2)), add(add(c, mul(d, -5)), mul(n, w + 2))];
  return [{pts, smooth: 0, closed: true}];
};
const scarf: AccentFn = (sk) => {
  const n = sk.neck;
  const h = sk.neckHalf;
  return [{pts: [[n[0] - h * 2.2, n[1] + 2], [n[0] - h * 0.5, n[1] + 9], [n[0] + h * 1.6, n[1] + 6], [n[0] + h * 2.4, n[1] + 24], [n[0] + h * 2.1, n[1] + 38]], smooth: 1}];
};

// ---- the seven ---------------------------------------------------------------------------------------------

const MAYA: Proportions = {
  headR: 30, headRy: 33, neckLen: 12, neckHalf: 8, shoulderX: 44, shoulderDrop: 13, torso: 150, hipX: 15,
  upperArm: 78, foreArm: 70, thigh: 96, shin: 94, armW: [13, 11, 8], legW: [19, 14, 10], hipFlare: 6,
  mitten: 20, foot: 26, sleeve: 'pushed', hair: knotHair,
};
const DAD: Proportions = {
  headR: 29, headRy: 32, neckLen: 10, neckHalf: 8, shoulderX: 42, shoulderDrop: 16, torso: 142, hipX: 15,
  upperArm: 74, foreArm: 68, thigh: 94, shin: 92, armW: [13, 11, 9], legW: [19, 14, 10], hipFlare: 4,
  mitten: 20, foot: 32, sleeve: 'long', hair: plainHead, collar: true, stoop: 18,
};
const LEO: Proportions = {
  headR: 24, headRy: 26, neckLen: 7, neckHalf: 6, shoulderX: 30, shoulderDrop: 9, torso: 86, hipX: 11,
  upperArm: 48, foreArm: 44, thigh: 56, shin: 56, armW: [10, 9, 7], legW: [14, 11, 8], hipFlare: 3,
  mitten: 15, foot: 20, sleeve: 'long', hair: capHair, backpack: 0,
};
const MIA: Proportions = {
  headR: 23, headRy: 25, neckLen: 6, neckHalf: 5.5, shoulderX: 26, shoulderDrop: 8, torso: 74, hipX: 10,
  upperArm: 42, foreArm: 38, thigh: 50, shin: 50, armW: [9, 8, 6], legW: [11, 9, 7], hipFlare: 0,
  mitten: 13, foot: 17, sleeve: 'long', hair: ponytailHair, skirt: {hem: 36, drop: 42}, sock: 1,
};
const JONAS: Proportions = {
  headR: 30, headRy: 34, neckLen: 14, neckHalf: 9, shoulderX: 48, shoulderDrop: 12, torso: 158, hipX: 16,
  upperArm: 82, foreArm: 76, thigh: 100, shin: 98, armW: [14, 12, 9], legW: [20, 15, 11], hipFlare: 4,
  mitten: 22, foot: 28, sleeve: 'rolled', hair: cropHair, beard: true,
};
const SAM: Proportions = {
  headR: 29, headRy: 32, neckLen: 12, neckHalf: 8, shoulderX: 43, shoulderDrop: 13, torso: 150, hipX: 15,
  upperArm: 78, foreArm: 70, thigh: 96, shin: 94, armW: [13, 11, 8], legW: [19, 14, 10], hipFlare: 4,
  mitten: 20, foot: 26, sleeve: 'long', hair: quiffHair, bag: 0, mittens: ['round', 'phone'],
};

type PoseTable = Readonly<Partial<Record<PoseId, () => Figure>>>;

const human = (p: Proportions, accent: AccentFn, poses: Readonly<Partial<Record<PoseId, readonly [PoseOpts, 'stand' | 'sit' | 'bust' | 'lie']>>>): PoseTable =>
  Object.fromEntries(Object.entries(poses).map(([id, [o, kind]]) => [id, () => figure(p, o, accent, kind)])) as PoseTable;

const ON_TABLE: Arms = [[16, 58], [-10, -60]];

export const DESIGNS: Readonly<Record<CharacterId, CharacterDesign>> = {
  maya: {
    id: 'maya', name: 'Maya', ink: 'sepia', height: 420, lineWidth: 2.2,
    poses: human(MAYA, hairClip, {
      stand: [{facing: 0.3, arms: [[10, -6], [12, -4]]}, 'stand'],
      tree: [{facing: 0.25, mood: 'calm'}, 'bust'],
      'sit-A': [{facing: -0.8, lean: 10, arms: ON_TABLE, foreArmScale: [0.58, 1], mood: 'calm'}, 'sit'],
      'sit-B': [{facing: -0.7, lean: -14, headUp: 10, arms: [[58, 78], [-10, -60]], foreArmScale: [0.85, 1], mood: 'worried'}, 'sit'],
      'look-up': [{facing: -0.7, lean: 2, headUp: 24, arms: [[14, 56], [-10, -60]], foreArmScale: [0.58, 1], mood: 'up'}, 'sit'],
      window: [{facing: 0.1, mood: 'calm'}, 'bust'],
      doorway: [{facing: 0.6, arms: [[8, -4], [58, 108]], stance: 7, feet: [-0.3, 1]}, 'stand'],
      tap: [{facing: 0.9, arms: [[-2, -4], [46, 30]], foreArmScale: [1, 0.8], feet: [0.4, 1]}, 'stand'],
    }),
  },
  dad: {
    id: 'dad', name: 'Dad', ink: 'graphite', height: 410, lineWidth: 2.2,
    poses: human(DAD, glasses, {
      stand: [{facing: 0.35, arms: [[8, 2], [9, 4]], feet: [-0.6, 0.8], mood: 'calm'}, 'stand'],
      tree: [{facing: 0.2, mood: 'calm'}, 'bust'],
      'hold-up': [{facing: 0.5, arms: [[8, 2], [16, -124]], foreArmScale: [1, 0.8], feet: [-0.5, 0.9], mood: 'calm'}, 'stand'],
      lie: [{facing: 0.4, arms: [[14, 118], [16, 112]], kneeBend: 0.8, headUp: 24, mood: 'calm'}, 'lie'],
      sit: [{facing: 0.3, lean: 6, arms: [[30, 36], [30, 36]], mood: 'calm'}, 'sit'],
    }),
  },
  leo: {
    id: 'leo', name: 'Leo', ink: 'graphite', height: 260, lineWidth: 2.0,
    poses: human(LEO, capBrim, {
      stand: [{facing: 0.5, arms: [[12, -4], [14, -2]], stance: 7, farArm: 'hide'}, 'stand'],
      tree: [{facing: 0.3}, 'bust'],
      reach: [{facing: 0.5, arms: [[10, -4], [162, 8]], stance: 6, farArm: 'hide'}, 'stand'],
    }),
  },
  mia: {
    id: 'mia', name: 'Mia', ink: 'graphite', height: 230, lineWidth: 2.0,
    poses: human(MIA, bobble, {
      stand: [{facing: 0.4, arms: [[16, -2], [18, 2]], stance: 4}, 'stand'],
      tree: [{facing: 0.3}, 'bust'],
      reach: [{facing: 0.5, arms: [[14, 0], [166, 6]], stance: 5}, 'stand'],
    }),
  },
  jonas: {
    id: 'jonas', name: 'Jonas', ink: 'graphite', height: 440, lineWidth: 2.2,
    poses: human(JONAS, watchStrap, {
      stand: [{facing: -0.3, arms: [[10, -6], [9, -5]], mood: 'calm'}, 'stand'],
      tree: [{facing: -0.2, mood: 'calm'}, 'bust'],
      sit: [{facing: 0.7, lean: 8, arms: [[-10, -60], [16, 58]], foreArmScale: [1, 0.58], mood: 'calm'}, 'sit'],
    }),
  },
  sam: {
    id: 'sam', name: 'Sam', ink: 'graphite', height: 420, lineWidth: 2.2,
    poses: human(SAM, scarf, {
      stand: [{facing: 0.45, headUp: -14, arms: [[9, -5], [12, -44]], foreArmScale: [1, 0.85]}, 'stand'],
      tree: [{facing: 0.3}, 'bust'],
      'hold-up': [{facing: 0.5, arms: [[9, -5], [36, -118]]}, 'stand'],
    }),
  },
  biscuit: {id: 'biscuit', name: 'Biscuit', ink: 'graphite', height: 110, lineWidth: 2.0, poses: dogPoses},
};

export const CHARACTER_IDS = Object.keys(DESIGNS) as readonly CharacterId[];
