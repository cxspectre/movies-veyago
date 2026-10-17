// designs.ts — the seven characters of the design sheet (BIBLE4 §4): proportions, silhouette and clothing, the face
// each one wears, the one accent detail, and the poses the chapters need. Pure: every pose is a function of the
// proportions. A2 art pass: weight on one leg, an S through the spine, sloped and uneven shoulders, a tilted head;
// seated figures sit ON a chair (a graphite prop drawn with the pose); Dad's `lie` is a real reclining pose in bed.
import type {XY} from '../paper';
import {beardStrokes, capBrim, capHair, cropHair, faceStrokes, knotHair, plainHead, ponytailHair, quiffHair, type FaceStyle, type Mood} from './faces';
import {dogPoses} from './dog';
import {ik, limb, outline, type HairFn, type Mitten, type Shoe, type Side, type Skeleton, type Sleeve, type TorsoShape, type Widths} from './rig';
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
  readonly face: FaceStyle;
  readonly body: TorsoShape;
  readonly shoe?: Shoe;
  readonly collar?: boolean;
  readonly backpack?: Side;
  readonly bag?: Side;
  /** A skirt (Mia's dress) or a long cardigan (Maya): half-width at the hem and its drop below the hips. */
  readonly skirt?: {readonly hem: number; readonly drop: number; readonly kind: 'skirt' | 'cardigan'};
  readonly sock?: Side;
  /** The upper back rounds and the head comes forward (Dad). */
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
  /** Sideways head tilt in degrees (+ = clockwise); default leans toward the weight leg's side. */
  readonly headTilt?: number;
  readonly arms?: Arms;
  readonly stance?: number;
  /** The leg that carries the weight (contrapposto): its hip rises, the other knee softens, the shoulders answer. */
  readonly weight?: Side;
  /** Toe direction per foot, -1..1 (default: a little outward). */
  readonly feet?: readonly [number, number];
  readonly mood?: Mood;
  readonly mittens?: readonly [Mitten, Mitten];
  /** Bent knees (a soft stance). */
  readonly kneeBend?: number;
  /** Leave out the far arm / leg of a turned figure (default: both when |facing| >= FAR_HIDE and seated). */
  readonly farArm?: 'hide' | 'show';
  readonly farLeg?: 'hide' | 'show';
  /** Forearm length per side as a fraction (foreshortening of an arm coming toward the viewer). */
  readonly foreArmScale?: readonly [number, number];
  /** Seated: the feet forward of the knees (+) or tucked back under the chair (-), px. */
  readonly feetForward?: number;
};

type Kind = 'stand' | 'sit' | 'bust' | 'lie';

const HANGING: Arms = [[9, -8], [9, -8]];
const FAR_HIDE = 0.55;
const FORESHORTEN = 0.3;
const WOBBLE = 1.1;
const BUST_DEPTH = 0.42;
const FOOT_H = 1.3;
const HIP_TILT = 4;
const HIP_SHIFT = 7;
const SHOULDER_TILT = 4;
const HEAD_TILT = 5;
const CHAIR = {back: 0.62, depth: 8, gap: 9} as const;
const BED = {under: 34, board: 120, pillowH: 15} as const;

type Joints = {hip: readonly [XY, XY]; kn: readonly [XY, XY]; an: readonly [XY, XY]; seatY?: number};

const sideOf = (i: Side): number => (i === 0 ? -1 : 1);

const skeletonOf = (p: Proportions, o: PoseOpts, joints: Joints, kind: Kind, bust?: number): Skeleton => {
  const seated = kind === 'sit';
  const facing = o.facing ?? 0;
  const fs = facing >= 0 ? 1 : -1;
  const far: Side = facing >= 0 ? 0 : 1;
  const af = Math.abs(facing);
  const leanRad = (o.lean ?? 0) * fs * RAD;
  const stoop = p.stoop ?? 0;
  const w = o.weight;
  const hipC = lerp(joints.hip[0], joints.hip[1], 0.5);
  const up = (d: number): XY => rotate([0, -d], leanRad);
  // The S: the chest swings back over the weight foot as the hips push out over it.
  const counter = w === undefined || kind !== 'stand' ? 0 : -sideOf(w) * HIP_SHIFT * 1.1;
  const neck = add(add(hipC, up(p.torso)), [counter + stoop * fs * 0.7, stoop * 0.35]);
  // Foreshortening: the far shoulder comes in as the figure turns; the shoulders tilt against the hips.
  const shX = (i: Side): number => p.shoulderX * (i === far ? 1 - FORESHORTEN * af : 1 + 0.06 * af);
  const shTilt = (i: Side): number => (w === undefined || kind !== 'stand' ? 0 : i === w ? SHOULDER_TILT : -SHOULDER_TILT);
  const stoopDrop = stoop * 0.25;
  const sh: readonly [XY, XY] = [
    add(neck, rotate([-shX(0), p.shoulderDrop + shTilt(0) + stoopDrop], leanRad)),
    add(neck, rotate([shX(1), p.shoulderDrop + shTilt(1) + stoopDrop], leanRad)),
  ];
  const sideTilt = (o.headTilt ?? (w === undefined ? 0 : sideOf(w) * HEAD_TILT)) * RAD;
  const tilt = -(o.headUp ?? 0) * fs * RAD + sideTilt;
  const headC = add(add(neck, rotate([facing * p.headR * 0.3 + stoop * fs * 0.9, -(p.neckLen + p.headRy)], leanRad)), [Math.sin(sideTilt) * p.headRy * 0.6, stoop * 0.4]);
  const head: HeadGeom = {c: headC, rx: p.headR, ry: p.headRy, facing, tilt};
  const arms = o.arms ?? HANGING;
  const armOf = (i: Side): readonly [XY, XY] => {
    const sign = sideOf(i);
    const a = arms[i];
    // The far arm of a turned figure swings a little clear of the body (it would otherwise hang across it).
    const clear = i === far && kind === 'stand' ? af * 8 : 0;
    return limb(sh[i], sign * (a[0] + clear) + (o.lean ?? 0) * fs * 0.3, p.upperArm, sign * a[1], p.foreArm * (o.foreArmScale?.[i] ?? 1));
  };
  const [elL, wrL] = armOf(0);
  const [elR, wrR] = armOf(1);
  const feet = o.feet ?? [-0.9 + fs * af * 1.6, 0.9 + fs * af * 0.4].map((v) => Math.max(-1, Math.min(1, v))) as unknown as readonly [number, number];
  const hideFar = af >= FAR_HIDE;
  const hideArm = (o.farArm ?? (hideFar && seated ? 'hide' : 'show')) === 'hide' ? far : undefined;
  const hideLeg = (o.farLeg ?? (hideFar && seated ? 'hide' : 'show')) === 'hide' ? far : undefined;
  const torso: TorsoShape = {...p.body, blade: p.body.blade + stoop * 0.35};
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
    shoe: p.shoe ?? 'shoe',
    sleeve: p.sleeve,
    hair: p.hair,
    torso,
    facing,
    skirt: p.skirt && kind === 'stand' ? {hem: p.skirt.hem, hemY: hipC[1] + p.skirt.drop, kind: p.skirt.kind} : undefined,
    bust,
    hideArm,
    hideLeg,
    seatY: joints.seatY,
    collar: p.collar,
    weight: kind === 'stand' ? w : undefined,
    backpack: p.backpack,
    bag: p.bag,
    sock: p.sock,
  };
};

/** Standing: the weight leg straight under the body, its hip high; the free leg steps out with a soft knee. */
const standingJoints = (p: Proportions, o: PoseOpts): Joints => {
  const facing = o.facing ?? 0;
  const fs = facing >= 0 ? 1 : -1;
  const af = Math.abs(facing);
  const nearSide: Side = facing >= 0 ? 1 : 0;
  const ankleY = -p.legW[2] * FOOT_H;
  const stance = o.stance ?? 5;
  const w = o.weight;
  const legLen = (p.thigh + p.shin) * (0.985 - (o.kneeBend ?? 0) * 0.04);
  // Seen from the side the hips narrow and the legs step front and back instead of apart.
  const hipX = p.hipX * (1 - af * 0.45);
  const shift = w === undefined ? 0 : sideOf(w) * HIP_SHIFT;
  const stepDir = (i: Side): number => sideOf(i) * (1 - af) + (i === nearSide ? fs : -fs) * af;
  const hipXat = (i: Side): number => sideOf(i) * hipX + shift;
  // Even weight: both feet a stance apart. Contrapposto: the weight foot under the body, the free foot where the
  // lowered hip lets it reach with the knee just soft.
  const evenX = (i: Side): number => hipXat(i) + stepDir(i) * stance;
  const wl: Side = w ?? 0;
  const anW = w === undefined ? evenX(wl) : shift * 0.3 + sideOf(wl) * hipX * 0.35 * (1 - af) + stepDir(wl) * stance * af * 0.5;
  const dxW = anW - hipXat(wl);
  const hipBase = ankleY - Math.sqrt(Math.max(1, legLen * legLen - dxW * dxW));
  const tilt = (i: Side): number => (w === undefined ? 0 : i === w ? -HIP_TILT : HIP_TILT);
  const hip: readonly [XY, XY] = [[hipXat(0), hipBase + tilt(0)], [hipXat(1), hipBase + tilt(1)]];
  const freeX = (i: Side): number => {
    const dy = ankleY - hip[i][1];
    const reach = Math.sqrt(Math.max(0, (legLen - 4) * (legLen - 4) - dy * dy));
    return hip[i][0] + stepDir(i) * Math.max(reach, stance);
  };
  const an: readonly [XY, XY] = [[w === undefined ? evenX(0) : w === 0 ? anW : freeX(0), ankleY], [w === undefined ? evenX(1) : w === 1 ? anW : freeX(1), ankleY]];
  // Knees bend forward (toward the facing side); seen from the front the bend is mostly hidden (foreshortened).
  const knee = (i: Side): XY => {
    const k = ik(hip[i], an[i], p.thigh, p.shin, [fs, 0]);
    return lerp(lerp(hip[i], an[i], p.thigh / (p.thigh + p.shin)), k, Math.max(af, 0.35));
  };
  return {hip, kn: [knee(0), knee(1)], an};
};

/** Seated on a kitchen chair: the thighs on the seat (foreshortened as the figure turns to us), the shins down. */
const seatedJoints = (p: Proportions, o: PoseOpts): Joints => {
  const facing = o.facing ?? 0;
  const fs = facing >= 0 ? 1 : -1;
  const af = Math.abs(facing);
  const ankleY = -p.legW[2] * FOOT_H;
  const seatY = ankleY - p.shin * 0.9;
  const hipY = seatY - p.legW[0] * 0.95;
  const near: Side = facing >= 0 ? 1 : 0;
  const back = -fs * p.hipX * 0.6;
  const hipAt = (i: Side): XY => (i === near ? [back + fs * 3, hipY] : [back - fs * 5, hipY - 3]);
  const hip: readonly [XY, XY] = [hipAt(0), hipAt(1)];
  const thighX = p.thigh * (0.5 + 0.48 * af);
  const knAt = (i: Side): XY => [hipAt(i)[0] + fs * thighX + (i === near ? 0 : -fs * 6), hipY + 3 + (1 - af) * 8];
  const kn: readonly [XY, XY] = [knAt(0), knAt(1)];
  const fwd = o.feetForward ?? 6;
  const anAt = (i: Side): XY => [knAt(i)[0] + fs * fwd + (i === near ? 0 : (1 - af) * 10 * sideOf(i)), ankleY];
  return {hip, kn, an: [anAt(0), anAt(1)], seatY};
};

/** The chair under a seated figure, seen from the side: the back post and rear leg, the seat's front lip and underside, the front leg. */
const chairProp = (p: Proportions, sk: Skeleton): readonly Polyline[] => {
  const seatY = sk.seatY ?? 0;
  const fs = sk.facing >= 0 ? 1 : -1;
  const near: Side = sk.facing >= 0 ? 1 : 0;
  // Behind the seat (from the hips, not the leaning torso, so a swap between seated poses keeps the same chair).
  const backH = p.torso * CHAIR.back;
  const backHip = sk.hip[near === 1 ? 0 : 1];
  const rear = backHip[0] - fs * (p.legW[0] + p.body.seat * 0.5 + CHAIR.gap);
  const front = sk.kn[near][0] - fs * (p.legW[1] + 18);
  const under = seatY + CHAIR.depth;
  return [
    {pts: [[rear - fs * 8, seatY - backH], [rear - fs * 4, seatY - backH * 0.45], [rear, under], [rear - fs * 3, 0]], smooth: 0.4},
    {pts: [[front + fs * 4, seatY + 1], [front + fs * 4, under], [rear, under]], smooth: 0},
    {pts: [[front, under], [front + fs * 3, 0]], smooth: 0},
  ];
};

/** Dad in bed: lying on his back, head on the pillow to the left, knees up under him, one arm resting on his chest. */
const lyingSkeleton = (p: Proportions, o: PoseOpts): Skeleton => {
  const lean = -(90 - (o.headUp ?? 10));
  const facing = o.facing ?? 0.5;
  const leanRad = lean * RAD;
  const thick = p.hipX + p.legW[0] + p.hipFlare;
  const hipC: XY = [0, -thick * 0.92];
  const R = (q: XY): XY => add(hipC, rotate(q, leanRad));
  const hip: readonly [XY, XY] = [R([-p.hipX * 0.7, 0]), R([p.hipX, 0])];
  const ankleY = -p.legW[2] * FOOT_H;
  const legAt = (h: XY, deg: number): readonly [XY, XY] => {
    const kn = add(h, mul([Math.cos(deg * RAD), Math.sin(deg * RAD)], p.thigh));
    const dy = Math.min(p.shin * 0.98, ankleY - kn[1]);
    const an: XY = [kn[0] + Math.sqrt(Math.max(0, p.shin * p.shin - dy * dy)), ankleY];
    return [kn, an];
  };
  const [k0, a0] = legAt(hip[0], -24);
  const [k1, a1] = legAt(hip[1], -34);
  const joints: Joints = {hip, kn: [k0, k1], an: [a0, a1], seatY: 0};
  const base = skeletonOf(p, {...o, facing, lean: lean, headUp: 0, headTilt: 0, farArm: 'hide', farLeg: 'hide'}, joints, 'lie');
  // The head turns up on the pillow; the near arm lies along the body, the hand resting on the belly.
  const head: HeadGeom = {...base.head, tilt: (lean + (o.headUp ?? 10) * 0.5) * RAD};
  const torsoDir = norm(sub(hipC, base.neck));
  const shN = base.sh[1];
  const el = add(add(shN, mul(torsoDir, p.upperArm * 0.98)), mul(perp(torsoDir), -p.armW[1] * 0.2));
  const wr = add(add(el, mul(torsoDir, p.foreArm * 0.62)), mul(perp(torsoDir), -p.armW[1] * 1.6));
  return {...base, head, el: [base.el[0], el], wr: [base.wr[0], wr], restArm: 1};
};

const bedProp = (p: Proportions, sk: Skeleton): readonly Polyline[] => {
  const h = sk.head;
  const board = h.c[0] - h.rx * 2.2;
  const foot = Math.max(sk.an[0][0], sk.an[1][0]) + p.foot * 1.6;
  const pc: XY = [h.c[0] - h.rx * 0.2, -BED.pillowH * 0.55];
  const pw = h.rx * 1.7;
  const pillow: readonly XY[] = [[pc[0] - pw, pc[1] + 4], [pc[0] - pw * 0.6, pc[1] - BED.pillowH * 0.7], [pc[0] + pw * 0.3, pc[1] - BED.pillowH * 0.8], [pc[0] + pw, pc[1] - 2], [pc[0] + pw * 0.7, pc[1] + BED.pillowH * 0.55], [pc[0] - pw * 0.4, pc[1] + BED.pillowH * 0.6]];
  return [
    {pts: [[board, -BED.board], [board, BED.under], [foot, BED.under], [foot, 2], [Math.max(sk.an[0][0], sk.an[1][0]) + p.foot * 0.9, 2]], smooth: 0},
    {pts: [[board, 2], [pc[0] - pw * 0.9, 2]], smooth: 0},
    {pts: pillow, smooth: 1, closed: true},
  ];
};

type DetailFn = (sk: Skeleton, p: Proportions, kind: Kind) => readonly Polyline[];
type AccentFn = (sk: Skeleton) => readonly Polyline[];

const faceOf = (p: Proportions, sk: Skeleton, o: PoseOpts): readonly Polyline[] => [
  ...faceStrokes(sk.head, p.face, o.mood ?? 'warm'),
  ...(p.beard ? beardStrokes(sk.head) : []),
];

const figure = (p: Proportions, o: PoseOpts, accent: AccentFn, details: DetailFn, kind: Kind): Figure => {
  if (kind === 'lie') {
    const sk = lyingSkeleton(p, o);
    const body = outline(sk);
    return {body, face: [...faceOf(p, sk, o), ...details(sk, p, kind)], accent: accent(sk), prop: bedProp(p, sk), wobble: WOBBLE};
  }
  const joints = kind === 'sit' ? seatedJoints(p, o) : standingJoints(p, o);
  const base = skeletonOf(p, o, joints, kind);
  const cut = base.neck[1] + p.torso * BUST_DEPTH;
  // A bust stands on its cut line: its origin is the sill or the node's centre line, not the floor.
  const sk = kind === 'bust' ? shiftSkeleton(skeletonOf(p, o, joints, kind, cut), [0, -cut]) : base;
  const body = outline(sk);
  return {
    body,
    face: [...faceOf(p, sk, o), ...details(sk, p, kind)],
    accent: accent(sk),
    prop: kind === 'sit' ? chairProp(p, sk) : undefined,
    wobble: WOBBLE,
  };
};

const mapSkeleton = (s: Skeleton, f: (q: XY) => XY): Skeleton => {
  const pair = (q: readonly [XY, XY]): readonly [XY, XY] => [f(q[0]), f(q[1])];
  return {...s, head: {...s.head, c: f(s.head.c)}, neck: f(s.neck), sh: pair(s.sh), el: pair(s.el), wr: pair(s.wr), hip: pair(s.hip), kn: pair(s.kn), an: pair(s.an), bust: s.bust === undefined ? undefined : f([0, s.bust])[1], seatY: s.seatY === undefined ? undefined : f([0, s.seatY])[1]};
};
const shiftSkeleton = (s: Skeleton, by: XY): Skeleton => mapSkeleton(s, (q) => add(q, by));

// ---- clothing details (same ink as the figure, drawn with the face) -----------------------------------------

const near = (sk: Skeleton): Side => (sk.facing >= 0 ? 1 : 0);
const spineOf = (sk: Skeleton): {up: XY; hipC: XY; len: number} => {
  const hipC = lerp(sk.hip[0], sk.hip[1], 0.5);
  const d = sub(sk.neck, hipC);
  return {up: norm(d), hipC, len: Math.hypot(d[0], d[1])};
};
/** Maya's cardigan: its V-neck, from the near collarbone down to the breastbone and up to the far one. */
const cardiganEdge: DetailFn = (sk, p, kind) => {
  if (kind === 'lie') return [];
  const {up} = spineOf(sk);
  const across: XY = [-up[1], up[0]];
  const s = sk.facing * p.neckHalf * 0.8;
  const v = add(add(sk.neck, mul(up, -p.torso * 0.24)), mul(across, s * 1.4));
  const a = add(add(sk.neck, mul(across, -p.neckHalf * 1.25 + s)), mul(up, -3));
  const b = add(add(sk.neck, mul(across, p.neckHalf * 1.25 + s)), mul(up, -3));
  return [{pts: [a, lerp(a, v, 0.55), v, lerp(b, v, 0.55), b], smooth: 0.5}];
};
/** Dad's shirt: the placket under the collar. */
const shirtFront: DetailFn = (sk, p, kind) => {
  if (kind === 'lie') return [];
  const {up} = spineOf(sk);
  const fs = sk.facing >= 0 ? 1 : -1;
  const across: XY = [-up[1], up[0]];
  const top = add(add(sk.neck, mul(across, fs * p.neckHalf * 0.4)), mul(up, -9));
  return [{pts: [top, add(add(top, mul(up, -p.torso * 0.3)), mul(across, fs * 3))], smooth: 0}];
};
/** Leo's backpack strap over the near shoulder. */
const packStrap: DetailFn = (sk, p, kind) => {
  if (kind === 'bust') return [];
  const i = near(sk);
  const sh = sk.sh[i];
  const top = lerp(sk.neck, sh, 0.55);
  return [{pts: [add(top, [0, -2]), add(sh, [-sideOf(i) * p.armW[0] * 0.7, p.armW[0] * 1.4]), add(sh, [-sideOf(i) * p.armW[0] * 1.2, p.armW[0] * 3.4])], smooth: 1}];
};
/** Sam's bag strap: across the chest from the near shoulder to the bag at the far hip. */
const bagStrap: DetailFn = (sk, p, kind) => {
  if (kind === 'bust' || kind === 'lie') return [];
  const i = near(sk);
  const bagSide: Side = p.bag ?? 0;
  const h = sk.hip[bagSide];
  const shTop = lerp(sk.neck, sk.sh[i], 0.6);
  return [{pts: [add(shTop, [0, -1]), lerp(shTop, h, 0.5), add(h, [sideOf(bagSide) * (p.legW[0] + p.hipFlare + 3), -32])], smooth: 0.6}];
};
const noDetails: DetailFn = () => [];

// ---- accent details -------------------------------------------------------------------------------------------

const circlePts = (c: XY, r: number, n = 10): readonly XY[] =>
  Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI * 0.6;
    return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r] as const;
  });
const headLocal = (h: HeadGeom, x: number, y: number): XY => rotateAbout([h.c[0] + x * h.rx, h.c[1] + y * h.ry], h.c, h.tilt);

/** Maya's hair clip: a 14 px tick at the temple on the back side of the face. */
const hairClip: AccentFn = (sk) => {
  const h = sk.head;
  const back = h.facing >= 0 ? -1 : 1;
  const t = headLocal(h, back * 0.72 + h.facing * 0.2, -0.52);
  return [{pts: [add(t, [-back * 4, -3]), add(t, [0, 4]), add(t, [back * 8, -8])], smooth: 0.3}];
};
/** Dad's reading glasses: two circles r 14 over the eyes, joined at the bridge. */
const glasses: AccentFn = (sk) => {
  const h = sk.head;
  const f = h.facing;
  const s = f * 0.3;
  const nearS = f >= 0 ? 1 : -1;
  const squeeze = 1 - Math.min(1, Math.abs(f)) * 0.45;
  const ex = (side: number): number => side * 0.3 * (side === -nearS ? squeeze : 1) + s * 0.7;
  const r = 14;
  const l = headLocal(h, ex(-1), 0.04);
  const rr = headLocal(h, ex(1), 0.04);
  const gap = Math.hypot(rr[0] - l[0], rr[1] - l[1]);
  const d = norm(sub(rr, l));
  const lr = Math.min(r, gap * 0.48);
  return [{pts: circlePts(l, lr), smooth: 1, closed: true}, {pts: [add(l, mul(d, lr)), add(rr, mul(d, -lr))], smooth: 0}, {pts: circlePts(rr, lr), smooth: 1, closed: true}];
};
/** Leo's cap brim: the accent pencil retraces the brim that the outline already drew (one ~50 px stroke). */
const capBrimAccent: AccentFn = (sk) => [{pts: capBrim(sk.head), smooth: 0.8}];
/** Mia's hair bobble at the root of the ponytail. */
const bobble: AccentFn = (sk) => {
  const h = sk.head;
  const back = h.facing >= 0 ? -1 : 1;
  return [{pts: circlePts(headLocal(h, back * 1.2, 0.08), 8, 8), smooth: 1, closed: true}];
};
/** Jonas's watch strap on the left wrist: a 10 x 18 band across the forearm. */
const watchStrap: AccentFn = (sk) => {
  if (sk.bust !== undefined) return [];
  // The left wrist, unless a turned pose hides that arm: then the one we can see.
  const i: Side = sk.hideArm === 0 ? 1 : 0;
  const d = norm(sub(sk.wr[i], sk.el[i]));
  const n = perp(d);
  const c = sub(sk.wr[i], mul(d, 8));
  const w = sk.sleeve === 'long' ? sk.armW[2] : sk.armW[2] * 0.85;
  const pts: readonly XY[] = [add(add(c, mul(d, -5)), mul(n, -w - 2)), add(add(c, mul(d, 5)), mul(n, -w - 2)), add(add(c, mul(d, 5)), mul(n, w + 2)), add(add(c, mul(d, -5)), mul(n, w + 2))];
  return [{pts, smooth: 0, closed: true}];
};
/** Sam's scarf: one ~60 px stroke round the neck and down the front, the end swinging. */
const scarf: AccentFn = (sk) => {
  const n = sk.neck;
  const h = sk.neckHalf;
  const f = sk.facing >= 0 ? 1 : -1;
  return [{pts: [[n[0] - f * h * 2.0, n[1] - 2], [n[0] - f * h * 0.3, n[1] + 8], [n[0] + f * h * 1.6, n[1] + 3], [n[0] + f * h * 1.9, n[1] + 22], [n[0] + f * h * 1.5, n[1] + 42]], smooth: 1}];
};

// ---- the seven ---------------------------------------------------------------------------------------------

const MAYA: Proportions = {
  headR: 34, headRy: 38, neckLen: 13, neckHalf: 7, shoulderX: 40, shoulderDrop: 23, torso: 150, hipX: 16,
  upperArm: 76, foreArm: 62, thigh: 98, shin: 94, armW: [11, 8.5, 6.5], legW: [19, 12.5, 8.5], hipFlare: 5,
  mitten: 19, foot: 25, sleeve: 'pushed', hair: knotHair,
  skirt: {hem: 37, drop: 44, kind: 'cardigan'},
  face: {browY: -0.26, browArch: 0.1, browLen: 0.25, browTilt: 0.06, eyeLen: 0.12, eyeArc: 0.06, noseLen: 0.36, noseTip: 0.12, mouthW: 0.25, mouthCurve: 0.11, mouthTilt: 0.06},
  body: {chest: 6, belly: 0, blade: 3, seat: 9, sway: 0},
};
const DAD: Proportions = {
  headR: 34, headRy: 36, neckLen: 8, neckHalf: 8.5, shoulderX: 42, shoulderDrop: 25, torso: 140, hipX: 16,
  upperArm: 72, foreArm: 60, thigh: 92, shin: 90, armW: [12.5, 9.5, 7.5], legW: [19, 13.5, 9.5], hipFlare: 6,
  mitten: 20, foot: 30, sleeve: 'long', hair: plainHead, collar: true, stoop: 18, shoe: 'slipper',
  face: {browY: -0.2, browArch: 0.03, browLen: 0.24, browTilt: 0.07, eyeLen: 0.09, eyeArc: 0.02, noseLen: 0.42, noseTip: 0.16, mouthW: 0.17, mouthCurve: 0.05, mouthTilt: 0.01},
  body: {chest: 2, belly: 9, blade: 4, seat: 6, sway: 0},
};
const LEO: Proportions = {
  headR: 28, headRy: 30, neckLen: 7, neckHalf: 6, shoulderX: 28, shoulderDrop: 13, torso: 86, hipX: 11,
  upperArm: 46, foreArm: 38, thigh: 56, shin: 56, armW: [9, 7.5, 6], legW: [12.5, 9.5, 7.5], hipFlare: 3,
  mitten: 15, foot: 20, sleeve: 'long', hair: capHair, backpack: 0,
  face: {browY: -0.3, browArch: 0.08, browLen: 0.18, browTilt: 0.0, eyeLen: 0.09, eyeArc: 0.08, noseLen: 0.3, noseTip: 0.1, mouthW: 0.27, mouthCurve: 0.14, mouthTilt: 0.03},
  body: {chest: 1, belly: 1, blade: 2, seat: 4, sway: 0},
};
const MIA: Proportions = {
  headR: 27, headRy: 29, neckLen: 6, neckHalf: 5.5, shoulderX: 24, shoulderDrop: 11, torso: 72, hipX: 10,
  upperArm: 40, foreArm: 33, thigh: 50, shin: 50, armW: [8, 6.5, 5.5], legW: [10, 8, 6.5], hipFlare: 0,
  mitten: 13, foot: 17, sleeve: 'long', hair: ponytailHair, skirt: {hem: 34, drop: 40, kind: 'skirt'}, sock: 1,
  face: {browY: -0.31, browArch: 0.1, browLen: 0.16, browTilt: 0.04, eyeLen: 0.07, eyeArc: 0.05, noseLen: 0.26, noseTip: 0.08, mouthW: 0.18, mouthCurve: 0.12, mouthTilt: 0},
  body: {chest: 0, belly: 2, blade: 1, seat: 3, sway: 0},
};
const JONAS: Proportions = {
  headR: 34, headRy: 39, neckLen: 15, neckHalf: 9.5, shoulderX: 50, shoulderDrop: 19, torso: 160, hipX: 16,
  upperArm: 82, foreArm: 68, thigh: 102, shin: 100, armW: [14, 10.5, 8.5], legW: [20, 14, 10], hipFlare: 3,
  mitten: 22, foot: 30, sleeve: 'rolled', hair: cropHair, beard: true,
  face: {browY: -0.2, browArch: 0.015, browLen: 0.22, browTilt: -0.04, eyeLen: 0.1, eyeArc: 0.0, noseLen: 0.4, noseTip: 0.13, mouthW: 0.15, mouthCurve: 0.035, mouthTilt: 0, mouthY: 0.52},
  body: {chest: 7, belly: 0, blade: 4, seat: 7, sway: 0},
};
const SAM: Proportions = {
  headR: 31, headRy: 37, neckLen: 13, neckHalf: 7.5, shoulderX: 41, shoulderDrop: 21, torso: 150, hipX: 14,
  upperArm: 78, foreArm: 64, thigh: 100, shin: 96, armW: [11.5, 9, 7], legW: [17, 12, 8.5], hipFlare: 3,
  mitten: 19, foot: 27, sleeve: 'long', hair: quiffHair, bag: 0, mittens: ['round', 'phone'],
  face: {browY: -0.24, browArch: 0.06, browLen: 0.19, browTilt: -0.01, browAsym: 0.08, eyeLen: 0.1, eyeArc: 0.03, noseLen: 0.38, noseTip: 0.14, mouthW: 0.2, mouthCurve: 0.05, mouthTilt: 0.09},
  body: {chest: 3, belly: 0, blade: 3, seat: 5, sway: 0},
};

type PoseTable = Readonly<Partial<Record<PoseId, () => Figure>>>;

const human = (p: Proportions, accent: AccentFn, details: DetailFn, poses: Readonly<Partial<Record<PoseId, readonly [PoseOpts, Kind]>>>): PoseTable =>
  Object.fromEntries(Object.entries(poses).map(([id, [o, kind]]) => [id, () => figure(p, o, accent, details, kind)])) as PoseTable;

/** Seated at the table, facing left: the near forearm lies on the table top, the hand flat on a paper. */
const ON_TABLE_L: Arms = [[22, 62], [0, 0]];

export const DESIGNS: Readonly<Record<CharacterId, CharacterDesign>> = {
  maya: {
    id: 'maya', name: 'Maya', ink: 'sepia', height: 420, lineWidth: 3.1,
    poses: human(MAYA, hairClip, cardiganEdge, {
      stand: [{facing: 0.3, weight: 0, stance: 4, arms: [[10, -10], [14, 26]], mood: 'warm'}, 'stand'],
      tree: [{facing: 0.25, headTilt: 6, mood: 'calm'}, 'bust'],
      'sit-A': [{facing: -0.8, lean: 10, headUp: -20, arms: ON_TABLE_L, foreArmScale: [0.9, 1], mittens: ['flat', 'round'], feetForward: -6, mood: 'calm'}, 'sit'],
      'sit-B': [{facing: -0.8, lean: -12, headUp: 12, arms: [[48, 96], [0, 0]], foreArmScale: [0.8, 1], feetForward: -6, mood: 'worried'}, 'sit'],
      'look-up': [{facing: -0.8, lean: 4, headUp: 26, arms: ON_TABLE_L, foreArmScale: [0.9, 1], mittens: ['flat', 'round'], feetForward: -6, mood: 'up'}, 'sit'],
      window: [{facing: 0.1, headTilt: -5, mood: 'calm'}, 'bust'],
      doorway: [{facing: 0.55, weight: 0, stance: 6, arms: [[8, -12], [64, 104]], mittens: ['round', 'flat'], headTilt: 4, feet: [0.2, 1]}, 'stand'],
      tap: [{facing: 0.85, weight: 0, stance: 7, lean: 4, arms: [[4, -6], [34, 88]], foreArmScale: [1, 0.72], farArm: 'hide', feet: [1, 1], headUp: 4}, 'stand'],
    }),
  },
  dad: {
    id: 'dad', name: 'Dad', ink: 'graphite', height: 410, lineWidth: 2.7,
    poses: human(DAD, glasses, shirtFront, {
      stand: [{facing: 0.35, weight: 1, stance: 3, kneeBend: 0.5, arms: [[4, 10], [6, 14]], feet: [-0.5, 0.9], mood: 'calm'}, 'stand'],
      tree: [{facing: 0.2, mood: 'calm'}, 'bust'],
      'hold-up': [{facing: 0.5, weight: 0, kneeBend: 0.5, arms: [[4, 10], [28, 138]], foreArmScale: [1, 0.85], feet: [-0.3, 0.9], headUp: 8, mood: 'calm'}, 'stand'],
      lie: [{facing: 0.45, headUp: 14, mood: 'calm'}, 'lie'],
      sit: [{facing: 0.75, lean: 6, arms: [[0, 0], [22, 58]], foreArmScale: [1, 0.85], mittens: ['round', 'flat'], mood: 'calm'}, 'sit'],
    }),
  },
  leo: {
    id: 'leo', name: 'Leo', ink: 'graphite', height: 260, lineWidth: 2.4,
    poses: human(LEO, capBrimAccent, packStrap, {
      stand: [{facing: 0.5, weight: 1, stance: 8, arms: [[14, -6], [12, 22]], farArm: 'hide', feet: [0.2, 1]}, 'stand'],
      tree: [{facing: 0.3, headTilt: -5}, 'bust'],
      reach: [{facing: 0.5, weight: 1, stance: 6, arms: [[10, -4], [160, 10]], farArm: 'hide', headUp: 14, feet: [0.2, 1]}, 'stand'],
    }),
  },
  mia: {
    id: 'mia', name: 'Mia', ink: 'graphite', height: 230, lineWidth: 2.4,
    poses: human(MIA, bobble, noDetails, {
      stand: [{facing: 0.35, weight: 0, stance: 3, arms: [[24, -14], [26, 16]], feet: [0.35, -0.45], headTilt: 7}, 'stand'],
      tree: [{facing: 0.3, headTilt: 7}, 'bust'],
      reach: [{facing: 0.5, weight: 0, stance: 4, arms: [[14, -4], [164, 8]], headUp: 16, feet: [0.4, 1]}, 'stand'],
    }),
  },
  jonas: {
    id: 'jonas', name: 'Jonas', ink: 'graphite', height: 440, lineWidth: 2.7,
    poses: human(JONAS, watchStrap, noDetails, {
      stand: [{facing: -0.3, weight: 1, stance: 6, arms: [[10, -14], [8, -22]], mood: 'calm'}, 'stand'],
      tree: [{facing: -0.2, mood: 'calm'}, 'bust'],
      sit: [{facing: 0.7, lean: 10, arms: [[0, 0], [24, 62]], foreArmScale: [1, 0.9], mittens: ['round', 'flat'], mood: 'calm'}, 'sit'],
    }),
  },
  sam: {
    id: 'sam', name: 'Sam', ink: 'graphite', height: 420, lineWidth: 2.7,
    poses: human(SAM, scarf, bagStrap, {
      stand: [{facing: 0.45, weight: 0, stance: 5, headUp: -18, arms: [[8, -8], [10, -64]], foreArmScale: [1, 0.72]}, 'stand'],
      tree: [{facing: 0.3, headTilt: -6}, 'bust'],
      'hold-up': [{facing: 0.5, weight: 0, stance: 5, arms: [[8, -8], [38, 104]], foreArmScale: [1, 0.85], headUp: 10}, 'stand'],
    }),
  },
  biscuit: {id: 'biscuit', name: 'Biscuit', ink: 'graphite', height: 110, lineWidth: 2.4, poses: dogPoses},
};

export const CHARACTER_IDS = Object.keys(DESIGNS) as readonly CharacterId[];
