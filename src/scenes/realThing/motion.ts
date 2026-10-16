// motion.ts — pure frame -> state maps for the realThing's two framings (BIBLE 6.2). Module-local seconds in.
import type {FormatName} from '../../film';
import {PHONE, WATCH, type EdgeLight, type Placement, type Rotation} from '../../devices';
import {cornerParam, mix} from '../../glass';
import type {Focus, PlannedCut} from './plan';

/** BIBLE 6.2: "slight -4° X". */
const PITCH_DEG = -4;
/**
 * The phone's body height and centre as fractions of the frame height. Tall sits high, so the whole phone (and its push)
 * stays above the 9:16 captions, whose baseline is 300 px above the bottom edge (BIBLE section 3).
 */
const PHONE_HEIGHT: Record<FormatName, number> = {wide: 0.86, tall: 0.7};
const PHONE_CENTRE_Y: Record<FormatName, number> = {wide: 0.5, tall: 0.42};
/** A slow push over each void cut (hard cuts either side, so constant speed). */
const PUSH_SCALE = 0.018;
/** The Watch cut is tight: the case nearly fills the frame (wide: its height of the frame's; tall: its width of the frame's). */
const WATCH_FILL: Record<FormatName, number> = {wide: 0.82, tall: 0.86};
/** Bleed: 1.06x over a cover fit (a cut may set its own `bleedScale`), drifting 2% of the frame across the cut (BIBLE 6.2). */
const BLEED_SCALE = 1.06;
const BLEED_DRIFT = 0.02;

/** 0..1 through the cut. */
export const cutProgress = (cut: PlannedCut, t: number): number => Math.min(1, Math.max(0, (t - cut.start) / cut.dur));

export type VoidPose = {placement: Placement; rotation: Rotation; edgeLight: EdgeLight; scale: number};

const restingLight = (cut: PlannedCut, outline: typeof PHONE.outline | typeof WATCH.outline): EdgeLight => ({
  position: cornerParam(outline, cut.lightCorner),
  intensity: 1,
});

const yaw = (cut: PlannedCut, p: number): number => cut.rotationY + mix(cut.yawDrift[0], cut.yawDrift[1], p);

/** The phone in the void: centred, the listed yaw drifting a degree toward camera, -4° pitch, a slow push. */
export const phonePose = (cut: PlannedCut, t: number, format: FormatName, frameHeight: number): VoidPose => {
  const p = cutProgress(cut, t);
  return {
    placement: {x: 0.5, y: PHONE_CENTRE_Y[format], height: PHONE_HEIGHT[format] * frameHeight},
    rotation: {x: PITCH_DEG, y: yaw(cut, p)},
    edgeLight: restingLight(cut, PHONE.outline),
    scale: 1 + PUSH_SCALE * p,
  };
};

/** The Watch, tight: its case nearly fills the frame. */
export const watchPose = (cut: PlannedCut, t: number, format: FormatName, frameWidth: number, frameHeight: number): VoidPose => {
  const p = cutProgress(cut, t);
  const height = format === 'wide' ? WATCH_FILL.wide * frameHeight : (WATCH_FILL.tall * frameWidth) / WATCH.outline.width;
  return {
    placement: {x: 0.5, y: 0.5, height},
    rotation: {x: PITCH_DEG, y: yaw(cut, p)},
    edgeLight: restingLight(cut, WATCH.outline),
    scale: 1 + PUSH_SCALE * p,
  };
};

export type BleedLayout = {width: number; height: number; left: number; top: number};

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/**
 * Where the footage sits for a full-bleed crop: cover fit x 1.06, the focus point centred, clamped so the picture covers
 * the frame for the whole drift, then moved by 2% of the frame along `drift` (centred on the cut's midpoint).
 */
export const bleedLayout = (cut: PlannedCut, t: number, format: FormatName, frameWidth: number, frameHeight: number): BleedLayout => {
  const cover = Math.max(frameWidth / cut.clip.width, frameHeight / cut.clip.height) * (cut.bleedScale?.[format] ?? BLEED_SCALE);
  const width = cut.clip.width * cover;
  const height = cut.clip.height * cover;
  const focus: Focus = cut.focus[format];
  const reachX = (BLEED_DRIFT * frameWidth) / 2;
  const reachY = (BLEED_DRIFT * frameHeight) / 2;
  const baseLeft = clamp(frameWidth / 2 - focus.x * width, frameWidth - width + reachX, -reachX);
  const baseTop = clamp(frameHeight / 2 - focus.y * height, frameHeight - height + reachY, -reachY);
  const offset = cutProgress(cut, t) - 0.5;
  return {
    width,
    height,
    left: baseLeft + cut.drift.x * BLEED_DRIFT * frameWidth * offset,
    top: baseTop + cut.drift.y * BLEED_DRIFT * frameHeight * offset,
  };
};
