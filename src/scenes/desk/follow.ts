// follow.ts — pair A's pencil rig over ANY pencil-state function. The desk kit's `followPencil` reads the engine's
// getPencilState for a spec; two desk pages need their own pencil (family-tabs traces its ghost tab and scrubs it
// out; form-to-chat rests between gestures, `pencilState` from the sketch). Same rig, same constants as the kit:
// exact tip, yaw damped toward the stroke, the hand lagging ≤2.5 px, a seeded tremor, 6 px lifts, a 12 px hold.
import {handRotationForYaw, type PencilRig} from '../../desk';
import type {PencilState} from '../../paper';
import {noise1} from '../../paper/geometry/noise';

export type StateAt = (frame: number) => PencilState;

export type DeskFollow = {
  /** Height the tip hovers at when the state says it is resting (form-to-chat's pauses), px. */
  readonly restHover?: (state: PencilState, frame: number) => number;
  /** Degrees added to the resting yaw at `frame` (a wrist turning the hand off what it just drew). */
  readonly yawShift?: (frame: number) => number;
};

const RIG = {yawBase: 52, yawSwing: 7, damping: 8, lagPx: 2.5, tremorPx: 0.45, tremorDeg: 0.35, seed: 11, tiltDeg: 55, pinchMm: 34, pxPerMm: 2.857} as const;
const LIFT_PX = 6;
const HOLD_PX = 12;
const HOLD_SETTLE_FRAMES = 12;
const RAD = Math.PI / 180;

const yawTarget = (s: PencilState): number => {
  if (!s.drawing) return RIG.yawBase;
  const pointing = (RIG.yawBase + 180) * RAD;
  return RIG.yawBase - RIG.yawSwing * Math.sin(s.angle - pointing);
};

type Sums = {readonly yaw: number; readonly x: number; readonly y: number; readonly w: number};

const dampedSums = (stateAt: StateAt, frame: number, now: PencilState): Sums => {
  const window = Math.max(1, Math.round(RIG.damping * 2));
  return Array.from({length: window}, (_, k) => k).reduce<Sums>(
    (acc, k) => {
      const s = k === 0 ? now : stateAt(frame - k);
      const w = Math.exp(-k / RIG.damping);
      return {yaw: acc.yaw + yawTarget(s) * w, x: acc.x + s.x * w, y: acc.y + s.y * w, w: acc.w + w};
    },
    {yaw: 0, x: 0, y: 0, w: 0},
  );
};

/** Pure: the rig at page-local `frame` of a page drawn over `drawFrames`. */
export const followState = (stateAt: StateAt, frame: number, drawFrames: number, opts: DeskFollow = {}): PencilRig => {
  const now = stateAt(frame);
  const sums = dampedSums(stateAt, frame, now);
  const lagX = sums.x / sums.w - now.x;
  const lagY = sums.y / sums.w - now.y;
  const lagLen = Math.hypot(lagX, lagY);
  const lagK = lagLen > RIG.lagPx ? RIG.lagPx / lagLen : 1;
  const t = frame / 30;
  const shift = opts.yawShift ? opts.yawShift(frame) : 0;
  const yaw = sums.yaw / sums.w + shift + noise1(RIG.seed + 13, t * 1.7) * RIG.tremorDeg;
  const hold = now.done ? Math.min(1, Math.max(0, (frame - drawFrames) / HOLD_SETTLE_FRAMES)) : 0;
  const rest = opts.restHover ? opts.restHover(now, frame) : 0;
  const hover = now.drawing ? 0 : Math.max(now.lift * LIFT_PX, hold * HOLD_PX, rest);
  const back = RIG.pinchMm * Math.cos(RIG.tiltDeg * RAD) * RIG.pxPerMm;
  const pinch = {
    x: now.x + Math.cos(yaw * RAD) * back + lagX * lagK + noise1(RIG.seed, t * 2.6) * RIG.tremorPx,
    y: now.y + Math.sin(yaw * RAD) * back + lagY * lagK + noise1(RIG.seed + 7, t * 2.2) * RIG.tremorPx,
  };
  return {tip: {x: now.x, y: now.y}, yaw, hover, pinch, rotation: handRotationForYaw(yaw), drawing: now.drawing, done: now.done, pressure: now.pressure};
};

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;

/** Blend two rigs (a hand travelling between the end of one page and the start of the next). */
export const blendRigs = (a: PencilRig, b: PencilRig, k: number): PencilRig => {
  const yaw = lerp(a.yaw, b.yaw, k);
  return {
    tip: {x: lerp(a.tip.x, b.tip.x, k), y: lerp(a.tip.y, b.tip.y, k)},
    yaw,
    hover: lerp(a.hover, b.hover, k),
    pinch: {x: lerp(a.pinch.x, b.pinch.x, k), y: lerp(a.pinch.y, b.pinch.y, k)},
    rotation: handRotationForYaw(yaw),
    drawing: false,
    done: false,
    pressure: 0,
  };
};

/** The rig moved by `offset` (a hand pulled back toward its frame edge carries the whole pencil with it). */
export const shiftRig = (rig: PencilRig, offset: {x: number; y: number}, extraHover = 0): PencilRig => ({
  ...rig,
  tip: {x: rig.tip.x + offset.x, y: rig.tip.y + offset.y},
  pinch: {x: rig.pinch.x + offset.x, y: rig.pinch.y + offset.y},
  hover: rig.hover + extraHover,
});
