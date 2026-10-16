// pencil.ts — where the pencil is on page 12, with its rests. The engine's getPencilState glides the pencil from
// one stroke to the next across any gap; this page's pauses are its hero beat (BIBLE 4.13: "the pencil rests, tip
// down, 12 px off the paper, at (430,760)"), so here it settles quickly, holds still, and leaves only at the end.
// The desk/hand owner reads this instead of getPencilState for form-to-chat.
import {FORM_TO_CHAT_FRACTIONS as F} from '../../beats';
import {getPencilState, type PencilState, type XY} from '../../paper';
import {easeInOut} from '../../paper/geometry/noise';
import {spec} from './spec';

export type PencilRest = {
  /** Page-progress window (fractions of drawFrames) in which the pencil holds still. */
  readonly window: readonly [number, number];
  /** Where it rests; null = right where it lifted. */
  readonly at: XY | null;
};

const REST_POINT: XY = [430, 760];
/** 12 px off the paper, in the engine's lift units (about 90 px for a full lift). */
const REST_LIFT = 12 / 90;
/** Settling in and leaving each take at most this much page progress. */
const MOVE = 0.02;
const LIFT_DISTANCE = 90;
const MIN_HOP = 0.18;

export const PENCIL_RESTS: readonly PencilRest[] = [
  {window: F.pause, at: REST_POINT},
  {window: F.pauseAfter, at: REST_POINT},
  {window: [F.question[1], F.chipMom[0]], at: null},
];

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** A short lifted move from a to b at local progress k, never dropping below `floor` lift. */
const hop = (a: XY, b: XY, k: number, floor: (e: number) => number, base: PencilState): PencilState => {
  const e = easeInOut(clamp01(k));
  const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const height = Math.max(MIN_HOP, Math.min(1, dist / LIFT_DISTANCE));
  return {
    ...base,
    x: a[0] + (b[0] - a[0]) * e,
    y: a[1] + (b[1] - a[1]) * e,
    angle: dist > 0.5 ? Math.atan2(b[1] - a[1], b[0] - a[0]) : base.angle,
    pressure: 0,
    drawing: false,
    lift: Math.max(floor(e), Math.sin(Math.PI * clamp01(k)) * height),
  };
};

const restState = (rest: PencilRest, u: number, base: PencilState, drawFrames: number): PencilState => {
  const [from, to] = rest.window;
  const leave = getPencilState(spec, from * drawFrames, drawFrames);
  const arrive = getPencilState(spec, to * drawFrames, drawFrames);
  const lifted: XY = [leave.x, leave.y];
  const at = rest.at ?? lifted;
  const target: XY = [arrive.x, arrive.y];
  const settle = Math.min(MOVE, (to - from) / 3);
  if (u < from + settle) return hop(lifted, at, (u - from) / settle, (e) => REST_LIFT * e, base);
  if (u >= to - settle) return hop(at, target, (u - (to - settle)) / settle, (e) => REST_LIFT * (1 - e), base);
  return {...base, x: at[0], y: at[1], angle: leave.angle, pressure: 0, drawing: false, lift: REST_LIFT};
};

/** Pure: the pencil on page 12 at `frame` (page-local), with the rests in place of the engine's glide. */
export const pencilState = (frame: number, drawFrames: number): PencilState => {
  const base = getPencilState(spec, frame, drawFrames);
  const u = drawFrames > 0 ? frame / drawFrames : 1;
  const rest = PENCIL_RESTS.find((r) => u > r.window[0] && u < r.window[1]);
  return rest && !base.drawing ? restState(rest, u, base, drawFrames) : base;
};
