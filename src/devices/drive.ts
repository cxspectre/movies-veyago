// drive.ts — the rigs' keyframes, read from src/beats.ts (never re-typed). Pure functions of MODULE-LOCAL seconds that
// return rig props, so scenes can write <Phone3D {...transitionPhone(t, format)} screen={…} />.
import {familyOfDevices, pair, transition, type EasingName} from '../beats';
import type {FormatName} from '../film';
import {cornerParam, type RoundedRect} from '../glass/edgeLightPath';
import {ease, interpolateKeyframes, windowProgress} from '../glass/motion';
import {PHONE} from './phone/phoneSpec';
import {frameToWorld, type StageSize} from './stage/camera';
import type {EdgeLight, Placement, Rotation} from './types';

/** Seconds the band takes to come up to full when a lap starts. */
const LIGHT_RAMP_SECONDS = 0.4;

/** Phone placement in the transition and at the handoff (BIBLE 5.3). Heights are fractions of the frame height. */
export const transitionPlacement = (format: FormatName, frameHeight: number): Placement => {
  const [x, y] = transition.handoff.phoneCentre[format];
  return {x, y, height: transition.handoff.phoneHeightFraction[format] * frameHeight};
};

/** FOV over the lift-off (0° flat drawing -> 28°). */
export const transitionFov = (t: number): number => {
  const p = transition.perspective;
  return p.fovFrom + (p.fovTo - p.fovFrom) * windowProgress(p, t, 'easeInOutSine');
};

export const transitionRotation = (t: number): Rotation => ({
  y: interpolateKeyframes(transition.rotationY, t, transition.rotationEasing),
  x: interpolateKeyframes(transition.rotationX, t, transition.rotationEasing),
});

/**
 * The transition's edge light: from the top-left corner at 7.0, one clockwise lap by 15.0 (constant speed), then a
 * drift along the top edge to the top-right corner by 17.0, where it rests for the handoff.
 */
export const transitionEdgeLight = (t: number, outline: RoundedRect = PHONE.outline): EdgeLight => {
  const {lap, settle} = transition.edgeLight;
  const intensity = windowProgress({from: lap.from, to: lap.from + LIGHT_RAMP_SECONDS}, t, 'easeOutCubic');
  if (t < lap.to) return {position: windowProgress(lap, t), intensity};
  const drift = windowProgress(settle, t, 'easeInOutSine');
  return {position: cornerParam(outline, settle.endCorner) * drift, intensity};
};

/** Everything the phone needs during the transition (from 7.0; before that the scene shows the drawing). */
export const transitionPhone = (t: number, format: FormatName, frameHeight: number): {placement: Placement; rotation: Rotation; edgeLight: EdgeLight; fov: number} => ({
  placement: transitionPlacement(format, frameHeight),
  rotation: transitionRotation(t),
  edgeLight: transitionEdgeLight(t),
  fov: transitionFov(t),
});

/** familyOfDevices: the light rests at the top-right corner and the glow settles 1 -> 0.7 over 3-5 s. */
export const familyGlow = (t: number): number => 1 + (familyOfDevices.settle.glowTo - 1) * windowProgress(familyOfDevices.settle, t, 'easeInOutSine');

/**
 * The Watch lighting in during the flip (BIBLE 5.7, "edge light first, body second"): its edge light comes up over the
 * first 0.27 s of `watchIn` (keynote ease), then the body and screen over the rest, full exactly when the card lands.
 * `position` runs the band up the left side and round the top-left corner as it comes up, so the light draws the case.
 */
export const WATCH_IN_LIGHT_SHARE = 0.54;
export const familyWatchIn = (t: number): {light: number; body: number; position: number} => {
  const w = familyOfDevices.watchIn;
  const split = w.from + (w.to - w.from) * WATCH_IN_LIGHT_SHARE;
  const light = windowProgress({from: w.from, to: split}, t, 'keynote');
  return {light, body: windowProgress({from: split, to: w.to}, t, 'keynote'), position: 0.8 + 0.26 * light};
};

/** The phone's x during the family slide (0.5 -> 0.36 wide; stays centred in tall). */
export const familyPhoneX = (t: number, format: FormatName): number => {
  const s = familyOfDevices.phoneSlide;
  return s.fromX + (s.toX[format] - s.fromX) * windowProgress(s, t, s.easing);
};

/** The pair's glow: 1 until 4.0, dimming to 0.4 by 5.0. */
export const pairGlow = (t: number): number => 1 + (pair.dim.glowTo - 1) * windowProgress(pair.dim, t, 'easeInOutSine');

/**
 * One band sweeping left -> right across several devices (the pair, 2:21-2:22.5): the band's world x at time t runs
 * from `fromX` to `toX` (frame fractions). `sweepFor` turns it into a device's own sweep (0..1 across its width).
 */
export const pairSweepX = (t: number, fromX: number, toX: number, easing: EasingName = 'easeInOutSine'): number =>
  fromX + (toX - fromX) * windowProgress(pair.sweep, t, easing);

export const sweepFor = (sweepFrameX: number, placement: Placement, widthOfHeight: number, stage: StageSize, intensity = 1): EdgeLight['sweep'] => {
  const [wx] = frameToWorld(sweepFrameX, 0.5, stage);
  const [cx] = frameToWorld(placement.x, placement.y, stage);
  const widthPx = widthOfHeight * placement.height;
  return {x: (wx - cx) / widthPx + 0.5, intensity};
};

/** Sweep intensity: up at the start of the window, down at its end (so it never pops). */
export const pairSweepIntensity = (t: number): number => {
  const rise = windowProgress({from: pair.sweep.from, to: pair.sweep.from + 0.2}, t, 'easeOutCubic');
  const fall = 1 - windowProgress({from: pair.sweep.to - 0.2, to: pair.sweep.to}, t, 'easeInOutSine');
  return Math.min(rise, fall);
};

/** Keynote-eased progress through a window; re-exported for scenes that drive rigs by hand. */
export const keynote = (from: number, to: number, t: number): number => ease('keynote', (t - from) / (to - from));
