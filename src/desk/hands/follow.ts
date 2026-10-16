// follow.ts — the pencil rig: turns the engine's PencilState into where the drawing hand is. Pure and deterministic.
// The tip is exact (the engine's); the hand lags a little, its yaw is damped toward the stroke direction, a slow
// tremor keeps it alive, and it lifts between strokes (BIBLE §2.7: 6 px between strokes, 12 px on a hold).
import {getPencilState, type PencilState, type SketchSpec} from '../../paper';
import {noise1} from '../../paper/geometry/noise';
import {GRIP} from './poses';
import type {Pt} from './geometry';

export type PencilRig = {
  /** Tip, sketch px (exact). */
  readonly tip: Pt;
  /** Direction from the tip toward the pencil's back end, degrees (screen, clockwise). */
  readonly yaw: number;
  /** Height of the tip above the paper, px. */
  readonly hover: number;
  /** Where the hand's pinch anchor goes (lags the tip a little), sketch px. */
  readonly pinch: Pt;
  /** The hand's rotation for the Hand component, degrees. */
  readonly rotation: number;
  readonly drawing: boolean;
  readonly done: boolean;
  readonly pressure: number;
};

export type FollowOptions = {
  /** Resting yaw of the pencil, degrees: the back end points this way (default 60: down-right, a right hand from the bottom edge; the forearm then leaves at about 30° from vertical). */
  readonly yawBase?: number;
  /** How far the yaw follows a sideways stroke, degrees. */
  readonly yawSwing?: number;
  /** Frames of damping (exponential window). */
  readonly damping?: number;
  /** Max px the hand lags behind the tip. */
  readonly lagPx?: number;
  readonly tremorPx?: number;
  readonly tremorDeg?: number;
  readonly seed?: number;
  /** Pencil tilt, degrees to the paper. */
  readonly tiltDeg?: number;
  /** The pinch point's distance from the tip along the pencil, mm (PENCIL_GEOMETRY.pinch). */
  readonly pinchMm?: number;
  readonly pxPerMm?: number;
  /** A left hand mirrors the rig. */
  readonly handed?: 'right' | 'left';
};

const LIFT_PX = 6;
const HOLD_PX = 12;
const HOLD_SETTLE_FRAMES = 12;
const RAD = Math.PI / 180;

const DEFAULTS: Required<FollowOptions> = {
  yawBase: 60,
  yawSwing: 7,
  damping: 8,
  lagPx: 2.5,
  tremorPx: 0.45,
  tremorDeg: 0.35,
  seed: 11,
  tiltDeg: GRIP.pencil?.tiltDeg ?? 55,
  pinchMm: 34,
  pxPerMm: 2.857,
  handed: 'right',
};

/** The hand's rotation that lays the pose's pencil along `yaw` (the pose's pencil direction is in the hand frame). */
export const handRotationForYaw = (yawDeg: number, handed: 'right' | 'left' = 'right'): number => {
  const d = GRIP.pencil?.dir ?? {x: 0, y: 1};
  const poseYaw = Math.atan2(d.y, handed === 'left' ? -d.x : d.x) / RAD;
  return yawDeg - poseYaw;
};

const yawTarget = (s: PencilState, o: Required<FollowOptions>): number => {
  if (!s.drawing) return o.yawBase;
  const pointing = (o.yawBase + 180) * RAD;
  const side = Math.sin(s.angle - pointing);
  return o.yawBase - o.yawSwing * side * (o.handed === 'left' ? -1 : 1);
};

/** Pure: the rig at `frame` for a page drawn over `drawFrames`. Samples a few earlier frames for the damping. */
export const followPencil = (spec: SketchSpec, frame: number, drawFrames: number, opts: FollowOptions = {}): PencilRig => {
  const o = {...DEFAULTS, ...opts};
  const now = getPencilState(spec, frame, drawFrames);
  const window = Math.max(1, Math.round(o.damping * 2));
  let yawSum = 0;
  let xSum = 0;
  let ySum = 0;
  let wSum = 0;
  for (let k = 0; k < window; k++) {
    const s = k === 0 ? now : getPencilState(spec, frame - k, drawFrames);
    const w = Math.exp(-k / o.damping);
    yawSum += yawTarget(s, o) * w;
    xSum += s.x * w;
    ySum += s.y * w;
    wSum += w;
  }
  const yawSmooth = yawSum / wSum;
  const lagX = xSum / wSum - now.x;
  const lagY = ySum / wSum - now.y;
  const lagLen = Math.hypot(lagX, lagY);
  const lagK = lagLen > o.lagPx ? o.lagPx / lagLen : 1;
  const t = frame / 30;
  const tremorX = noise1(o.seed, t * 2.6) * o.tremorPx;
  const tremorY = noise1(o.seed + 7, t * 2.2) * o.tremorPx;
  const tremorYaw = noise1(o.seed + 13, t * 1.7) * o.tremorDeg;
  const yaw = yawSmooth + tremorYaw;
  const hold = now.done ? Math.min(1, Math.max(0, (frame - drawFrames) / HOLD_SETTLE_FRAMES)) : 0;
  const hover = now.drawing ? 0 : Math.max(now.lift * LIFT_PX, hold * HOLD_PX);
  const back = o.pinchMm * Math.cos(o.tiltDeg * RAD) * o.pxPerMm;
  const pinch = {
    x: now.x + Math.cos(yaw * RAD) * back + lagX * lagK + tremorX,
    y: now.y + Math.sin(yaw * RAD) * back + lagY * lagK + tremorY,
  };
  return {tip: {x: now.x, y: now.y}, yaw, hover, pinch, rotation: handRotationForYaw(yaw, o.handed), drawing: now.drawing, done: now.done, pressure: now.pressure};
};

/** A rig for a pencil that is not following a page: the tip you give it, the resting yaw, a hover height. */
export const staticRig = (tip: Pt, hover: number, opts: FollowOptions = {}): PencilRig => {
  const o = {...DEFAULTS, ...opts};
  const back = o.pinchMm * Math.cos(o.tiltDeg * RAD) * o.pxPerMm;
  const yaw = o.yawBase;
  return {
    tip,
    yaw,
    hover,
    pinch: {x: tip.x + Math.cos(yaw * RAD) * back, y: tip.y + Math.sin(yaw * RAD) * back},
    rotation: handRotationForYaw(yaw, o.handed),
    drawing: false,
    done: false,
    pressure: 0,
  };
};
