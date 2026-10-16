// faces.ts — the 3-5 stroke face (no pupils) and the hair outlines (a loose knot, a cap with its brim, a ponytail,
// plain heads) in figure px. Pure.
//
// The face is four or five pencil movements: (1) the far brow running into the bridge and down the nose, (2) the
// near brow, (3) a hint of each visible eye (a dash or a soft lid), (4) the mouth. The brow and the mouth carry the
// personality, so each character has its own FaceStyle; a pose's mood bends it.
import type {XY} from '../paper';
import type {HeadGeom, Polyline} from './types';
import type {HairFn} from './rig';
import {rotateAbout} from './vec';

export type Mood = 'warm' | 'calm' | 'worried' | 'up';

export type FaceStyle = {
  /** Brow height in head radii (negative = up), its arch, its length either side of the eye. */
  readonly browY: number;
  readonly browArch: number;
  readonly browLen: number;
  /** Inner ends of the brows lifted (kind, worried) or pressed down (steady, stern). */
  readonly browTilt: number;
  /** The near brow raised by this much (a quizzical one). */
  readonly browAsym?: number;
  /** Eye hint: half-length and lid curve (0 = a dash, + = a soft lid, more = a smiling eye). */
  readonly eyeLen: number;
  readonly eyeArc: number;
  /** Nose length and how far its tip turns toward the facing side. */
  readonly noseLen: number;
  readonly noseTip: number;
  /** Mouth half-width, smile curve, and the lift of its near corner (a lopsided smile). */
  readonly mouthW: number;
  readonly mouthCurve: number;
  readonly mouthTilt: number;
  readonly mouthY?: number;
};

/** Features slide toward the facing side by this fraction of the head radius at facing 1. */
const SHIFT = 0.3;
const TWO_EYES_BELOW = 0.45;

/** A head-local point (x, y in head radii, y down) in figure px, tilted with the head. */
const local = (h: HeadGeom, x: number, y: number): XY => rotateAbout([h.c[0] + x * h.rx, h.c[1] + y * h.ry], h.c, h.tilt);

const moodOf = (st: FaceStyle, mood: Mood): FaceStyle => {
  if (mood === 'worried') return {...st, browTilt: st.browTilt + 0.1, browY: st.browY - 0.03, mouthCurve: -0.035, mouthW: st.mouthW * 0.8, mouthTilt: 0, eyeArc: 0.02};
  if (mood === 'up') return {...st, browY: st.browY - 0.07, browArch: st.browArch + 0.03, mouthCurve: st.mouthCurve * 0.5, mouthW: st.mouthW * 0.8};
  if (mood === 'calm') return {...st, mouthCurve: st.mouthCurve * 0.55, eyeArc: st.eyeArc * 0.7};
  return st;
};

export const faceStrokes = (h: HeadGeom, style: FaceStyle, mood: Mood = 'warm'): readonly Polyline[] => {
  const st = moodOf(style, mood);
  const f = h.facing;
  const af = Math.min(1, Math.abs(f));
  const s = f * SHIFT;
  const near = f >= 0 ? 1 : -1;
  const far = -near;
  const squeeze = 1 - af * 0.45;
  const eyeX = (side: number): number => side * 0.3 * (side === far ? squeeze : 1) + s * 0.7;
  const noseX = s * 1.15;
  const by = st.browY;
  const brow = (side: number, lift: number): readonly XY[] => {
    const x = eyeX(side);
    const len = st.browLen * (side === far ? squeeze : 1);
    // Outer end, the arch, the inner end (toward the nose).
    return [local(h, x + side * len, by + 0.04 + lift), local(h, x + side * len * 0.15, by - st.browArch + lift), local(h, x - side * len * 0.85, by - st.browTilt + 0.02 + lift)];
  };
  const farBrowNose: Polyline = {
    pts: [
      ...brow(far, 0),
      local(h, noseX - near * 0.02, by + 0.12),
      local(h, noseX + near * st.noseTip * 0.5, by + st.noseLen * 0.75),
      local(h, noseX + near * st.noseTip, by + st.noseLen + 0.04),
      local(h, noseX + near * 0.02, by + st.noseLen + 0.08),
    ],
    smooth: 0.7,
  };
  const nearBrow: Polyline = {pts: brow(near, -(st.browAsym ?? 0)), smooth: 1};
  const eye = (side: number): Polyline => {
    const x = eyeX(side);
    const l = st.eyeLen * (side === far ? squeeze : 1);
    return {pts: [local(h, x - l, 0.05), local(h, x, 0.05 - st.eyeArc), local(h, x + l, 0.05)], smooth: 1};
  };
  const eyes: readonly Polyline[] = af < TWO_EYES_BELOW ? [eye(far), eye(near)] : [eye(near)];
  const my = st.mouthY ?? 0.55;
  const mx = s * 1.1;
  const w = st.mouthW * (1 - af * 0.2);
  const mouth: Polyline = {
    pts: [local(h, mx - w, my - (near < 0 ? st.mouthTilt : 0)), local(h, mx, my + st.mouthCurve), local(h, mx + w, my - (near > 0 ? st.mouthTilt : 0))],
    smooth: 1,
  };
  return [farBrowNose, nearBrow, ...eyes, mouth];
};

/** The beard in three strokes (Jonas): its line along the jaw round the chin, and two short ones under the mouth. */
export const beardStrokes = (h: HeadGeom): readonly Polyline[] => {
  const f = h.facing;
  const at = (deg: number, k: number): XY => {
    const d = f >= 0 ? deg : 180 - deg;
    const r = (d * Math.PI) / 180;
    return rotateAbout([h.c[0] + Math.cos(r) * h.rx * k + f * 0.15 * h.rx, h.c[1] + Math.sin(r) * h.ry * k], h.c, h.tilt);
  };
  const s = f * SHIFT * 1.1;
  return [
    {pts: [at(18, 1.0), at(50, 1.08), at(90, 1.14), at(125, 1.06), at(150, 0.98)], smooth: 1},
    {pts: [local(h, s - 0.1, 0.74), local(h, s - 0.12, 0.92)], smooth: 0},
    {pts: [local(h, s + 0.1, 0.74), local(h, s + 0.11, 0.9)], smooth: 0},
  ];
};

const mirror = (deg: number): number => 540 - deg; // reflect an angle about the vertical axis (180 <-> 360)
const arc = (h: HeadGeom, e: (deg: number, k?: number) => XY, spec: readonly (readonly [number, number])[]): readonly XY[] =>
  (h.facing >= 0 ? spec : [...spec].reverse().map(([d, k]) => [mirror(d), k] as const)).map(([d, k]) => e(d, k));

/** Head-local points written for a figure facing right, mirrored (and reversed) for one facing left. */
const facingLocal = (h: HeadGeom, pts: readonly (readonly [number, number])[]): readonly XY[] =>
  (h.facing >= 0 ? pts : [...pts].reverse().map(([x, y]) => [-x, y] as const)).map(([x, y]) => local(h, x, y));
const polarLocal = (deg: number, k: number): readonly [number, number] => [Math.cos((deg * Math.PI) / 180) * k, Math.sin((deg * Math.PI) / 180) * k];

/** A loose knot high at the back of the head, a little lopsided, with a soft fall of hair over the crown. */
export const knotHair: HairFn = (h, e) =>
  arc(h, e, [[150, 1], [166, 1.06], [180, 1.05], [196, 1.08], [206, 1.16], [210, 1.34], [219, 1.52], [232, 1.56], [244, 1.4], [249, 1.2], [256, 1.1], [272, 1.07], [298, 1.07], [318, 1.05], [335, 1.04], [352, 1.0], [390, 1]]);

/** The brim of Leo's cap in head-local units (facing right): root over the brow, out to the tip, back underneath. */
const BRIM: readonly (readonly [number, number])[] = [[0.96, -0.5], [1.4, -0.47], [1.86, -0.34], [1.8, -0.22], [1.36, -0.24], [0.98, -0.28]];
/** Leo's cap: a band above the ear, a dome, and the brim drawn INTO the outline (the accent pencil retraces it). */
export const capHair: HairFn = (h) =>
  facingLocal(h, [polarLocal(150, 1), polarLocal(164, 1.0), polarLocal(168, 1.13), polarLocal(196, 1.14), polarLocal(228, 1.15), polarLocal(258, 1.14), polarLocal(288, 1.13), polarLocal(314, 1.12), ...BRIM, polarLocal(8, 1.0), polarLocal(30, 1.0)]);
export const capBrim = (h: HeadGeom): readonly XY[] => facingLocal(h, BRIM);

/** A ponytail: high at the back, swinging down, the bobble (accent) at its root. */
export const ponytailHair: HairFn = (h, e) => {
  const back = h.facing >= 0 ? -1 : 1;
  const p = (x: number, y: number): XY => rotateAbout([h.c[0] + back * x * h.rx, h.c[1] + y * h.ry], h.c, h.tilt);
  const tail: readonly XY[] = [p(1.1, 0.35), p(1.32, 1.2), p(1.62, 1.55), p(1.6, 0.9), p(1.38, -0.15)];
  const head: readonly (readonly [number, number])[] = [[150, 1], [168, 1.02]];
  const rest: readonly (readonly [number, number])[] = [[212, 1.05], [240, 1.06], [270, 1.06], [300, 1.05], [328, 1.04], [352, 1], [390, 1]];
  return h.facing >= 0 ? [...arc(h, e, head), ...tail, ...arc(h, e, rest)] : [...arc(h, e, rest), ...[...tail].reverse(), ...arc(h, e, head)];
};

/** Dad: a little flat on top, the hair thinning, a tuft over each ear. */
export const plainHead: HairFn = (h, e) => arc(h, e, [[150, 1], [170, 1.07], [192, 1.08], [214, 1.02], [240, 0.99], [270, 0.97], [300, 0.99], [326, 1.03], [346, 1.07], [362, 1.02], [390, 1]]);
/** Jonas: a short crop, square at the back. */
export const cropHair: HairFn = (h, e) => arc(h, e, [[150, 1], [168, 1.05], [190, 1.08], [215, 1.09], [242, 1.09], [270, 1.08], [298, 1.07], [322, 1.05], [345, 1.02], [390, 1]]);
/** Sam: a quiff pushed up at the front. */
export const quiffHair: HairFn = (h, e) => arc(h, e, [[150, 1], [175, 1.03], [205, 1.04], [238, 1.05], [264, 1.07], [290, 1.14], [306, 1.25], [318, 1.22], [332, 1.08], [352, 1.0], [390, 1]]);
