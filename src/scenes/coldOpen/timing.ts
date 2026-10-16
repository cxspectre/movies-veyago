// timing.ts — the cold open's clock, as pure functions of module-local seconds. Every anchor comes from beats.ts
// (coldOpen); the only numbers authored here are the lengths of the hands' own gestures, named below.
import {interpolate} from 'remotion';
import {coldOpen, type Window} from '../../beats';
import {FPS} from '../../film';
import {spec as v1Spec} from '../../sketches/v1-home';
import {easingOf} from './easing';

/** The v1-home page's own clock (coldOpen.v1): it starts at 1.0 s and draws over 18.5 s. */
export const V1_FROM = coldOpen.v1.sequenceFrom / FPS;
export const V1_DRAW_FRAMES = coldOpen.v1.drawFrames;

/**
 * Hand A's reach for the accent pencil (BIBLE 2.7: the accent strokes are drawn with the second pencil, after an
 * off-frame reach). The first tick starts the instant the body is done (10.0), so the body is drawn a little
 * faster (outlineDone 6.0 -> SWAP.from instead of -> 10.0) to free this window. Ticks and VO are untouched.
 */
const SWAP_SECONDS = 0.6;
export const SWAP: Window = {from: coldOpen.v1.bodyDone - SWAP_SECONDS, to: coldOpen.v1.bodyDone};
/** The hand lifts out of frame over this much of the swap, and comes back in over the last SWAP_IN seconds. */
export const SWAP_OUT_SECONDS = 0.22;
export const SWAP_IN_SECONDS = 0.3;

const strokeWindow = (id: string): {from: number; to: number} => {
  const s = v1Spec.strokes.find((x) => x.id === id);
  if (!s) throw new Error(`v1-home has no stroke ${id}`);
  return {from: s.from, to: s.to};
};
/** The page waits here during the swap: after the folder's last mark, before the first tick's first mark. */
const SWAP_HOLD_FRACTION = (strokeWindow('packets').to + strokeWindow('tick-binder').from) / 2;

/** The page frame of the folder's last mark: where the graphite pencil leaves the paper for the reach. */
export const BODY_END_FRAME = strokeWindow('packets').to * V1_DRAW_FRAMES - 0.01;

const pageSecondsOfFraction = (fraction: number): number => V1_FROM + (fraction * V1_DRAW_FRAMES) / FPS;

/** Real (module) seconds -> the page's own seconds (module clock, before the 1.0 s offset). Pure. */
export const pageSecondsAt = (t: number): number => {
  const {outlineDone, bodyDone} = coldOpen.v1;
  if (t < outlineDone) return t;
  if (t < SWAP.from) return outlineDone + ((t - outlineDone) * (bodyDone - outlineDone)) / (SWAP.from - outlineDone);
  if (t < SWAP.to) return pageSecondsOfFraction(SWAP_HOLD_FRACTION);
  return Math.min(t, coldOpen.pencilStops);
};

/** The inverse, for cues: page seconds (module clock) -> when they are seen. */
export const realSecondsOfPage = (p: number): number => {
  const {outlineDone, bodyDone} = coldOpen.v1;
  if (p < outlineDone || p >= bodyDone) return p;
  return outlineDone + ((p - outlineDone) * (SWAP.from - outlineDone)) / (bodyDone - outlineDone);
};

/** Frame of the v1-home page (0 = its first frame) at module second t. Fractional on purpose. */
export const v1PageFrame = (t: number): number => (pageSecondsAt(t) - V1_FROM) * FPS;

/** Lamp intensity 0-1 (coldOpen.lampUp keyframes, linear between them). */
export const lampIntensity = (t: number): number => {
  const k = coldOpen.lampUp;
  return interpolate(
    t,
    k.map((p) => p.t),
    k.map((p) => p.value),
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
};

export const isPureBlack = (t: number): boolean => t < coldOpen.black.to;

/** Camera scale multiplier (1 -> 1.04 over 28-35, easeInOutSine). */
export const pushInFactor = (t: number): number => {
  const p = coldOpen.pushIn;
  return interpolate(t, [p.from, p.to], [p.scaleFrom, p.scaleTo], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easingOf(p.easing)});
};
export const PUSH_IN_MAX = coldOpen.pushIn.scaleTo / coldOpen.pushIn.scaleFrom;

// Pair B's gestures (BIBLE 2.11). Lengths are the hands' own; every anchor is a beats.ts time.

/** The cup is carried in at height, then lowered so it lands exactly on cupDown; the hand lets go and leaves before the breath. */
const CUP_CARRY_SECONDS = 1.0;
const CUP_LOWER_SECONDS = 0.45;
const CUP_LET_GO_SECONDS = 0.3;
export const CUP = {
  carry: {from: coldOpen.cupDown - CUP_LOWER_SECONDS - CUP_CARRY_SECONDS, to: coldOpen.cupDown - CUP_LOWER_SECONDS},
  lower: {from: coldOpen.cupDown - CUP_LOWER_SECONDS, to: coldOpen.cupDown},
  out: {from: coldOpen.cupDown + CUP_LET_GO_SECONDS, to: coldOpen.breath.from},
} as const;

/** The note: carried in over handsBIn, pressed at stickyPress, smoothed over stickySmooth (flat on the chord). */
export const NOTE = {
  carry: coldOpen.handsBIn,
  pressAt: coldOpen.stickyPress,
  smooth: coldOpen.stickySmooth,
} as const;

/** The smoothing hand leaves as the chord lands; the pen hand arrives uncapped on penCap and letters. */
const SMOOTH_OUT_SECONDS = 0.25;
const PEN_IN_SECONDS = 0.3;
const PEN_OUT_SECONDS = 0.4;
const PEN_OUT_DELAY = 0.1;
export const PEN = {
  smoothOut: {from: coldOpen.chord, to: coldOpen.chord + SMOOTH_OUT_SECONDS},
  in: {from: coldOpen.penCap - PEN_IN_SECONDS, to: coldOpen.penCap},
  write: {from: coldOpen.lettering.from, to: coldOpen.lettering.to},
  out: {from: coldOpen.lettering.to + PEN_OUT_DELAY, to: coldOpen.lettering.to + PEN_OUT_DELAY + PEN_OUT_SECONDS},
} as const;
