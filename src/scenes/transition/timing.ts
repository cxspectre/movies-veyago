// timing.ts — the transition's clock (pure): every curve is read from `transition` in beats.ts (BIBLE 3 and 5).
import {transition, type SnapGroup, type Window} from '../../beats';
import {COLORS} from '../../film';
import {ease, freshLevel, HAIRLINE, windowProgress} from '../../glass';

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const smoothstep = (a: number, b: number, v: number): number => {
  const k = clamp01((v - a) / (b - a));
  return k * k * (3 - 2 * k);
};

// ---- the lines catch light (0.0-5.4) --------------------------------------------------------------------------

/** When the `index`-th of `count` strokes starts turning to light: spread evenly over the light-catch window. */
export const conversionStart = (index: number, count: number): number => {
  const {from, to} = transition.lightCatch;
  return count > 1 ? from + ((to - from) * index) / (count - 1) : from;
};

/** 0..1 of the stroke re-traced by the head at `t` (constant speed over perStrokeSeconds). */
export const strokeReveal = (t: number, start: number): number => clamp01((t - start) / transition.lightCatch.perStrokeSeconds);

/** Brightness of a converted stroke: 120% for 0.6 s from its conversion, then settled (BIBLE 3). */
export const strokeFresh = (t: number, start: number): number => (t < start ? 0 : freshLevel(t - start));

/** The head fades over the last part of its travel so it never pops off. */
const HEAD_FADE_FROM = 0.8;
export const headAlpha = (reveal: number): number => (reveal >= 1 ? 0 : 1 - smoothstep(HEAD_FADE_FROM, 1, reveal));

// ---- the paper fades (1.5-7.0) ---------------------------------------------------------------------------------

/** Paper texture, fibre, shadows and vignette: 1 -> 0. */
export const textureLevel = (t: number): number => 1 - windowProgress(transition.paperTextureFade, t, transition.paperTextureFade.easing);
/** How far the paper colour has gone to black: 0 -> 1 ("it stays light, then the lamp dies"). */
export const blackness = (t: number): number => windowProgress(transition.paperToBlack, t, transition.paperToBlack.easing);
/** Graphite not yet converted dims with the paper. */
export const graphiteLevel = (t: number): number => 1 - blackness(t);
/** Everything outside the phone outline (the corner "2", the sheet edges): 1 -> 0 over the last second. */
export const offPhoneLevel = (t: number): number => 1 - windowProgress(transition.offPhoneFade, t, 'easeInOutSine');

const relativeLuminance = (hex: string): number => {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
const PAPER_LUMINANCE = relativeLuminance(COLORS.paper);
/**
 * White light on cream paper does not read, so while the paper is light every hairline carries a darker under-halo
 * (hairlineCanvas.ts). It is full while the paper's luminance is above `fullAbove`, gone below `goneBelow` (about
 * 4.7-5.3 s on the paperToBlack curve), so by the time the paper is dark the stroke is pure white-on-black.
 */
const PAPER_HALO = {fullAbove: 0.5, goneBelow: 0.2} as const;
export const paperLuminance = (t: number): number => PAPER_LUMINANCE * (1 - blackness(t));
export const paperHaloLevel = (t: number): number => smoothstep(PAPER_HALO.goneBelow, PAPER_HALO.fullAbove, paperLuminance(t));

// ---- it becomes real (7.0-9.0) ---------------------------------------------------------------------------------

/** The body comes in over the first part of the lift-off (the band of light leads it, see drive.ts). */
const BODY_IN: Window = {from: transition.liftOff.from, to: transition.liftOff.from + 1.0};
export const bodyOpacity = (t: number): number => windowProgress(BODY_IN, t, 'easeOutCubic');

/** The drawn outline straightens into the device edge over the first second of the lift-off, then hands over. */
const OUTLINE_MORPH: Window = {from: transition.liftOff.from, to: transition.liftOff.from + 1.0};
const OUTLINE_HANDOVER: Window = {from: transition.liftOff.from + 1.0, to: transition.liftOff.to};
/** The outline thickens from the hairline to this many logical px as it becomes the edge. */
const OUTLINE_THICK_PX = 3;
export const outlineMorphK = (t: number): number => windowProgress(OUTLINE_MORPH, t, 'keynote');
export const outlineWidthPx = (t: number): number => HAIRLINE.widthPx + (OUTLINE_THICK_PX - HAIRLINE.widthPx) * outlineMorphK(t);
export const outlineAlpha = (t: number): number => 1 - windowProgress(OUTLINE_HANDOVER, t, 'easeInOutSine');
export const isLifting = (t: number): boolean => t >= transition.liftOff.from;

// ---- the snaps (10, 12, 14, 16) ---------------------------------------------------------------------------------

export type SnapState = {
  /** Multiplier on the group's hairline level (1 -> 1.6). */
  readonly flare: number;
  /** The hairlines' opacity (1 -> 0). */
  readonly lineAlpha: number;
  /** The real pixels' opacity (0 -> 1). */
  readonly pixelAlpha: number;
  /** The real pixels' scale (1.03 -> 1.00). */
  readonly pixelScale: number;
};

const SNAP_FLARE_IN = 0.3;
const SNAP_CROSSFADE_FROM = 0.2;
const PIXEL_SCALE_FROM = 1.03;
export const SNAP_IDLE: SnapState = {flare: 1, lineAlpha: 1, pixelAlpha: 0, pixelScale: PIXEL_SCALE_FROM};
export const SNAP_DONE: SnapState = {flare: 1, lineAlpha: 0, pixelAlpha: 1, pixelScale: 1};

export const snapTime = (group: SnapGroup): number => {
  const s = transition.snaps.find((b) => b.group === group);
  if (!s) throw new Error(`transition: no snap for ${group}`);
  return s.t;
};

/** The snap's state at `t`: the hairlines flare, then crossfade into the real pixels scaling 1.03 -> 1.00 (keynote). */
export const snapState = (t: number, group: SnapGroup): SnapState => {
  const x = (t - snapTime(group)) / transition.snapSeconds;
  if (x < 0) return SNAP_IDLE;
  if (x >= 1) return SNAP_DONE;
  const cross = ease('keynote', (x - SNAP_CROSSFADE_FROM) / (1 - SNAP_CROSSFADE_FROM));
  return {
    flare: 1 + (transition.snapFlare - 1) * smoothstep(0, SNAP_FLARE_IN, x),
    lineAlpha: 1 - cross,
    pixelAlpha: cross,
    pixelScale: PIXEL_SCALE_FROM + (1 - PIXEL_SCALE_FROM) * cross,
  };
};

/** The status band has no beat of its own: it turns real with the first snap (layout.ts). */
export const STATUS_SNAP: SnapGroup = 'tabs';

/** From here the screen is entirely real (the last snap has landed). */
export const screenRealFrom = (): number => Math.max(...transition.snaps.map((s) => s.t)) + transition.snapSeconds;
export const isScreenReal = (t: number): boolean => t >= screenRealFrom();
