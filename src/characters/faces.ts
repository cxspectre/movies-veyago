// faces.ts — the 3-5 stroke face (brow, nose, mouth, a hint of an eye; no pupils) and the hair outlines
// (a loose knot, a cap, a ponytail, plain) in figure px. Pure.
import type {XY} from '../paper';
import type {HeadGeom, Polyline} from './types';
import type {HairFn} from './rig';
import {rotateAbout} from './vec';

export type Mood = 'warm' | 'calm' | 'worried' | 'up';

/** Features slide toward the facing side by this fraction of the head radius at facing 1. */
const SHIFT = 0.3;
const TWO_EYES_BELOW = 0.35;

/** A head-local point (x, y in head radii, y down) in figure px, tilted with the head. */
const local = (h: HeadGeom, x: number, y: number): XY => rotateAbout([h.c[0] + x * h.rx, h.c[1] + y * h.ry], h.c, h.tilt);

export const faceStrokes = (h: HeadGeom, mood: Mood = 'warm'): readonly Polyline[] => {
  const f = h.facing;
  const s = f * SHIFT;
  const far = f >= 0 ? -1 : 1;
  const near = -far;
  const nose = f === 0 ? 1 : near;
  const worried = mood === 'worried';
  const up = mood === 'up';
  const browLift = worried ? -0.08 : up ? -0.06 : 0;
  const brow: Polyline = {
    pts: [local(h, -0.56 + s, -0.16 + browLift * 0.5), local(h, s, -0.3 + browLift), local(h, 0.54 + s, -0.18 + browLift * 0.5)],
    smooth: 1,
  };
  const eyeDash = (x: number): Polyline => ({pts: [local(h, x - 0.11, 0.02), local(h, x + 0.11, 0.0)], smooth: 0});
  const eyes: readonly Polyline[] =
    Math.abs(f) < TWO_EYES_BELOW ? [eyeDash(-0.3 + s * 0.6), eyeDash(0.3 + s * 0.6)] : [eyeDash(far * 0.32 + s * 0.4)];
  const noseStroke: Polyline = {
    pts: [local(h, 0.04 * nose + s, -0.02), local(h, 0.1 * nose + s, 0.3), local(h, 0.26 * nose + s, 0.27)],
    smooth: 0.6,
  };
  const smile = worried ? -0.03 : mood === 'calm' ? 0.04 : 0.09;
  const mouth: Polyline = {
    pts: [local(h, -0.24 + s * 1.1, 0.56), local(h, s * 1.1, 0.56 + smile), local(h, 0.24 + s * 1.1, 0.54)],
    smooth: 1,
  };
  return [brow, ...eyes, noseStroke, mouth];
};

/** Three short strokes hanging under the jaw (Jonas). */
export const beardStrokes = (h: HeadGeom): readonly Polyline[] =>
  [70, 92, 114].map((deg) => {
    const r = (deg * Math.PI) / 180;
    const at = (k: number): XY => rotateAbout([h.c[0] + Math.cos(r) * h.rx * k, h.c[1] + Math.sin(r) * h.ry * k], h.c, h.tilt);
    return {pts: [at(0.86), at(1.5)], smooth: 0};
  });

const mirror = (deg: number): number => 540 - deg; // reflect an angle about the vertical axis (180 <-> 360)
const arc = (h: HeadGeom, e: (deg: number, k?: number) => XY, spec: readonly (readonly [number, number])[]): readonly XY[] =>
  (h.facing >= 0 ? spec : [...spec].reverse().map(([d, k]) => [mirror(d), k] as const)).map(([d, k]) => e(d, k));

/** A loose knot at the back of the head. */
export const knotHair: HairFn = (h, e) =>
  arc(h, e, [[150, 1], [180, 1], [200, 1.02], [211, 1.26], [220, 1.44], [233, 1.4], [245, 1.14], [270, 1.02], [300, 1], [330, 1], [360, 1], [390, 1]]);

/** A cap: a band over the brow, a slightly bigger dome, the brim is the accent stroke. */
export const capHair: HairFn = (h, e) =>
  arc(h, e, [[150, 1], [168, 1], [172, 1.17], [200, 1.16], [240, 1.1], [270, 1.06], [300, 1.08], [335, 1.15], [350, 1.17], [354, 1], [390, 1]]);

/** A ponytail: the head, with the tail hanging down behind, the bobble (accent) at its base. */
export const ponytailHair: HairFn = (h, e) => {
  const back = h.facing >= 0 ? -1 : 1;
  const p = (x: number, y: number): XY => rotateAbout([h.c[0] + back * x * h.rx, h.c[1] + y * h.ry], h.c, h.tilt);
  const tail: readonly XY[] = [p(1.12, 0.6), p(1.3, 1.5), p(1.75, 0.85), p(1.46, -0.1)];
  const head: readonly (readonly [number, number])[] = [[150, 1], [162, 1]];
  const rest: readonly (readonly [number, number])[] = [[205, 1], [240, 1], [270, 1], [300, 1], [330, 1], [360, 1], [390, 1]];
  return h.facing >= 0 ? [...arc(h, e, head), ...tail, ...arc(h, e, rest)] : [...arc(h, e, rest), ...[...tail].reverse(), ...arc(h, e, head)];
};

/** Plain heads: Dad's a touch flat on top, Jonas's short crop, Sam's quiff. */
export const plainHead: HairFn = (h, e) => arc(h, e, [[150, 1], [180, 1], [210, 1], [240, 1], [270, 0.98], [300, 1], [330, 1], [360, 1], [390, 1]]);
export const cropHair: HairFn = (h, e) => arc(h, e, [[150, 1], [180, 1], [210, 1.02], [240, 1.05], [270, 1.06], [300, 1.05], [330, 1.03], [360, 1], [390, 1]]);
export const quiffHair: HairFn = (h, e) => arc(h, e, [[150, 1], [180, 1], [210, 1], [240, 1.03], [270, 1.05], [295, 1.1], [312, 1.16], [330, 1.08], [360, 1], [390, 1]]);
