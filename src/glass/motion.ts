// motion.ts — easing and keyframe helpers for the glass world, driven by the beat sheet (src/beats.ts).
import {Easing} from 'remotion';
import {EASING, type EasingName, type Keyframe, type Window} from '../beats';

const clamp01 = (t: number): number => Math.max(0, Math.min(1, t));

const EASERS: Record<EasingName, (t: number) => number> = Object.fromEntries(
  (Object.keys(EASING) as EasingName[]).map((name) => {
    const [x1, y1, x2, y2] = EASING[name];
    return [name, Easing.bezier(x1, y1, x2, y2)];
  }),
) as Record<EasingName, (t: number) => number>;

/** The named easing from the beat sheet (BIBLE section 2.9), clamped to 0..1. */
export const ease = (name: EasingName, t: number): number => EASERS[name](clamp01(t));

/** 0..1 progress through a window (module-local seconds), eased. */
export const windowProgress = (w: Window, t: number, easing: EasingName = 'linear'): number =>
  ease(easing, w.to > w.from ? (t - w.from) / (w.to - w.from) : t >= w.to ? 1 : 0);

/** Piecewise keyframe interpolation: each span is eased independently; holds the ends. */
export const interpolateKeyframes = (keys: readonly Keyframe[], t: number, easing: EasingName = 'linear'): number => {
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (!first || !last) throw new Error('interpolateKeyframes needs at least one keyframe');
  if (t <= first.t) return first.value;
  if (t >= last.t) return last.value;
  const index = keys.findIndex((k) => k.t > t);
  const a = keys[index - 1];
  const b = keys[index];
  if (!a || !b) return last.value;
  return a.value + (b.value - a.value) * ease(easing, (t - a.t) / (b.t - a.t));
};

/** Linear blend. */
export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;
