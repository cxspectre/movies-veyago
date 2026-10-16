// layout.ts — where the three devices are, frame by frame (pure; BIBLE 5.7-5.9, numbers from `familyOfDevices` and
// `transition.handoff` in beats.ts). Local 0.0 is exactly the transition's handoff state.
import {familyOfDevices, transition} from '../../beats';
import {familyGlow, familyPhoneX, PASS, PHONE, transitionPlacement, WATCH, type EdgeLight, type Placement, type Rotation} from '../../devices';
import type {FormatName} from '../../film';
import {cornerParam, mix, windowProgress} from '../../glass';

export type Size = {readonly width: number; readonly height: number};
export type DevicePose = {readonly placement: Placement; readonly rotation: Rotation};
type Point = {readonly x: number; readonly y: number};

/** The Watch's case height as a fraction of the phone's (the pair's number, BIBLE 6.3, the same here for continuity). */
const WATCH_OF_PHONE = 0.55;
/** The pass's height as a fraction of the frame height. */
const PASS_OF_FRAME: Record<FormatName, number> = {wide: 0.26, tall: 0.15};
/** The pass starts this far behind the frame plane and ends closer (px toward the camera are positive). */
const PASS_Z = {from: -260, to: -104} as const;
/**
 * The pass's slide (frame fractions): out from behind both devices, into clear space. Wide: from the gap between
 * phone and Watch to the right of the Watch (a 120 px slide left it behind the Watch, its text cropped). Tall: from
 * behind the Watch's right half to the lower right, beside it.
 */
const PASS_PATH: Record<FormatName, {from: Point; to: Point}> = {
  wide: {from: {x: 0.51, y: 0.6}, to: {x: 0.875, y: 0.64}},
  tall: {from: {x: 0.46, y: 0.6}, to: {x: 0.7, y: 0.68}},
};
/** Tall: the phone shrinks to this fraction of its handoff height as it moves up to make room (BIBLE 5.7). */
const TALL_PHONE_SHRINK = 0.52;
/**
 * Tall positions: phone upper, Watch lower-left, pass lower-right. Above the bible's (0.38 / 0.74 / 0.76) so that
 * nothing reaches below 0.83 H, where the 9:16 captions sit (BIBLE 3, TITLE_LAYOUT.captionBaselineFromBottomPx),
 * and with clear air between the phone's bottom corner and the strap.
 */
const TALL = {phone: {x: 0.5, y: 0.33}, watch: {x: 0.3, y: 0.665}} as const;
/** Wide: the Watch beside the phone at 0.66 W on the phone's centreline. */
const WIDE = {watchX: 0.66} as const;

const WATCH_ROTATION: Rotation = {y: 12, x: -5};
const PASS_ROTATION: Rotation = {y: 8, x: -4};
/** The phone keeps turning very slowly from the handoff and comes to rest by the hard stop ("rotation stops"). */
const PHONE_DRIFT_DEG: Rotation = {y: 3, x: -1};

/**
 * The Watch lights in while the phone still covers part of it (tall: its top; wide: its left edge), so it sits
 * behind the phone's plane until the slide has ended, then comes forward to the frame plane. An unlit body is
 * black, and black in front of the phone bit into the screen; behind it, the void hides it.
 */
const WATCH_Z = {behind: -120, forward: {from: familyOfDevices.phoneSlide.to, to: familyOfDevices.phoneSlide.to + 0.6}} as const;

/** The Watch's band lights in on its left edge, climbs over the top-left corner as the card lands, and settles at its
 * top-right corner by the hard stop (the phone's light rests at the same corner). */
const WATCH_LIGHT_FROM = 0.88;
/** The band is up to full this far into the light-in. */
const WATCH_LIGHT_RAMP_SECONDS = 0.3;
/** The Watch's body follows its light: in from this much after the light starts, fully in before the card lands. */
const WATCH_BODY_DELAY = 0.08;
const PASS_LIGHT_INTENSITY = 0.8;

/**
 * The dock's Emergency circle keeps its star for the first frames (the handoff frame must match the transition's
 * last), then the star fades as the card lifts: a patch of the still over the growing card (DockStarPatch).
 */
const DOCK_STAR = {holdSeconds: 0.1, fadeSeconds: 4 / 30} as const;

export const phonePose = (t: number, format: FormatName, size: Size): DevicePose => {
  const base = transitionPlacement(format, size.height);
  const slide = windowProgress(familyOfDevices.phoneSlide, t, familyOfDevices.phoneSlide.easing);
  const tall = format === 'tall';
  const placement: Placement = {
    x: familyPhoneX(t, format),
    y: tall ? mix(base.y, TALL.phone.y, slide) : base.y,
    height: tall ? base.height * mix(1, TALL_PHONE_SHRINK, slide) : base.height,
  };
  const drift = windowProgress({from: familyOfDevices.hit, to: familyOfDevices.hardCut}, t, 'easeInOutSine');
  return {
    placement,
    rotation: {y: transition.handoff.rotationY + (PHONE_DRIFT_DEG.y ?? 0) * drift, x: transition.handoff.rotationX + (PHONE_DRIFT_DEG.x ?? 0) * drift},
  };
};

/** The phone's final (slid) height: what the Watch and the pass are sized from. */
const settledPhoneHeight = (format: FormatName, size: Size): number => {
  const base = transitionPlacement(format, size.height);
  return format === 'tall' ? base.height * TALL_PHONE_SHRINK : base.height;
};

const watchZ = (t: number): number => mix(WATCH_Z.behind, 0, windowProgress(WATCH_Z.forward, t, 'keynote'));

export const watchPose = (t: number, format: FormatName, size: Size): DevicePose => {
  const base = transitionPlacement(format, size.height);
  const height = settledPhoneHeight(format, size) * WATCH_OF_PHONE;
  const z = watchZ(t);
  const placement: Placement = format === 'tall' ? {...TALL.watch, height, z} : {x: WIDE.watchX, y: base.y, height, z};
  return {placement, rotation: WATCH_ROTATION};
};

/** 0..1 of the pass's slide (0 = still hidden; the pass is not drawn at all until it starts). */
export const passProgress = (t: number): number => windowProgress(familyOfDevices.walletSlide, t, familyOfDevices.walletSlide.easing);

export const passPose = (t: number, format: FormatName, size: Size): DevicePose => {
  const k = passProgress(t);
  const {from, to} = PASS_PATH[format];
  return {
    placement: {x: mix(from.x, to.x, k), y: mix(from.y, to.y, k), z: mix(PASS_Z.from, PASS_Z.to, k), height: size.height * PASS_OF_FRAME[format]},
    rotation: PASS_ROTATION,
  };
};

/** The pass is wider than the gap it comes out of, so its body fades up from black over the first part of the slide
 * (behind the devices, black on black) instead of appearing at once. */
const PASS_FADE_OF_SLIDE = 3;
export const passBodyOpacity = (k: number): number => Math.min(1, k * PASS_FADE_OF_SLIDE);

export const phoneLight = (): EdgeLight => ({position: cornerParam(PHONE.outline, transition.handoff.edgeLightCorner), intensity: 1});

export const watchLight = (t: number): EdgeLight => {
  const {watchIn, hardCut} = familyOfDevices;
  const intensity = windowProgress({from: watchIn.from, to: watchIn.from + WATCH_LIGHT_RAMP_SECONDS}, t, 'easeOutCubic');
  const travel = windowProgress({from: watchIn.from, to: hardCut}, t, 'easeOutCubic');
  const rest = 1 + cornerParam(WATCH.outline, 'topRight');
  return {position: mix(WATCH_LIGHT_FROM, rest, travel), intensity};
};

export const watchBodyOpacity = (t: number): number => {
  const {watchIn} = familyOfDevices;
  return windowProgress({from: watchIn.from + WATCH_BODY_DELAY, to: watchIn.to - WATCH_BODY_DELAY}, t, 'easeInOutSine');
};

export const passLight = (k: number): EdgeLight => ({position: cornerParam(PASS.outline, 'topLeft'), intensity: PASS_LIGHT_INTENSITY * k});

export const glowAt = (t: number): number => familyGlow(t);

/** 1 while the dock circle still shows its star, fading to 0 as the card lifts. */
export const dockStarAlpha = (t: number): number =>
  1 - windowProgress({from: DOCK_STAR.holdSeconds, to: DOCK_STAR.holdSeconds + DOCK_STAR.fadeSeconds}, t, 'easeInOutSine');

export const cardLanded = (t: number): boolean => t >= familyOfDevices.cardLands;
export const isHardCut = (t: number): boolean => t >= familyOfDevices.hardCut;
