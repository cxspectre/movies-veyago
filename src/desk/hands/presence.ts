// presence.ts — when a hand is in frame. Scene owners feed windows from beats.ts; the helper returns 0 (off frame)
// to 1 (in place) with the bible's easings, and the slide that puts an entering hand beyond the frame edge.
import {Easing, interpolate} from 'remotion';
import {EASING, type EasingName, type Window} from '../../beats';
import {norm, type Pt} from './geometry';

export type PresenceSpec = {
  /** The hand slides in over this window (seconds, in whatever clock the scene uses). */
  readonly enter?: Window;
  /** And out over this one. Omit either to be already there / never leave. */
  readonly exit?: Window;
  readonly easeIn?: EasingName;
  readonly easeOut?: EasingName;
};

const easingFn = (name: EasingName): ((t: number) => number) => {
  const [a, b, c, d] = EASING[name];
  return Easing.bezier(a, b, c, d);
};

/** 0 = fully off frame, 1 = in place. Pure. */
export const presenceAt = (t: number, spec: PresenceSpec): number => {
  let k = spec.enter ? 0 : 1;
  if (spec.enter) {
    k = interpolate(t, [spec.enter.from, spec.enter.to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easingFn(spec.easeIn ?? 'easeOutCubic')});
  }
  if (spec.exit) {
    const out = interpolate(t, [spec.exit.from, spec.exit.to], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easingFn(spec.easeOut ?? 'easeInOutSine')});
    k = Math.min(k, out);
  }
  return k;
};

export type FrameEdge = 'bottom' | 'top' | 'left' | 'right' | 'topRight' | 'bottomRight' | 'bottomLeft' | 'topLeft';

const EDGE_DIR: Record<FrameEdge, Pt> = {
  bottom: {x: 0, y: 1},
  top: {x: 0, y: -1},
  left: {x: -1, y: 0},
  right: {x: 1, y: 0},
  topRight: norm({x: 1, y: -1}),
  bottomRight: norm({x: 1, y: 1}),
  bottomLeft: norm({x: -1, y: 1}),
  topLeft: norm({x: -1, y: -1}),
};

export const edgeDirection = (edge: FrameEdge | Pt): Pt => (typeof edge === 'string' ? EDGE_DIR[edge] : norm(edge));

/** The offset to add to a hand's placement at presence `k`: `travel` px toward `edge` when fully out. */
export const presenceOffset = (k: number, travel: number, edge: FrameEdge | Pt): Pt => {
  const d = edgeDirection(edge);
  const out = (1 - Math.min(1, Math.max(0, k))) * travel;
  return {x: d.x * out, y: d.y * out};
};

/** Convenience: the window a hand is "in" (between its enter end and its exit start). */
export const inFrame = (t: number, spec: PresenceSpec): boolean => presenceAt(t, spec) > 0.001;
