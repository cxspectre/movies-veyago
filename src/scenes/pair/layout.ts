// layout.ts — the hero pair (pure; BIBLE 6.3, numbers from `pair` in beats.ts): phone left and Watch right facing
// slightly inward, a resting rim of light on each device's outer edge, one band sweeping left to right across both,
// the glow dimming before the hard cut.
import {pair} from '../../beats';
import {pairGlow, pairSweepIntensity, pairSweepX, PHONE, sweepFor, WATCH, type EdgeLight, type Placement, type Rotation} from '../../devices';
import type {FormatName} from '../../film';
import {EDGE_LIGHT, mix, paramOfPoint, windowProgress} from '../../glass';

export type Size = {readonly width: number; readonly height: number};
export type DevicePose = {readonly placement: Placement; readonly rotation: Rotation};

/** Wide: phone centre 0.36 W, Watch 0.66 W, Watch at 55% of the phone's height. */
const WIDE = {phone: {x: 0.36, y: 0.52}, watch: {x: 0.66, y: 0.52}, phoneOfFrame: 0.74, watchOfPhone: 0.55} as const;
/**
 * Tall: stacked, Watch at 60%. Smaller and higher than the bible's (0.40 / 0.78 at 0.42 H): the devices no longer
 * touch, and the strap stays above 0.83 H, clear of the 9:16 caption zone (BIBLE 3).
 */
const TALL = {phone: {x: 0.5, y: 0.29}, watch: {x: 0.5, y: 0.66}, phoneOfFrame: 0.33, watchOfPhone: 0.6} as const;
const PHONE_ROTATION: Rotation = {y: -14, x: -4};
const WATCH_ROTATION: Rotation = {y: 12, x: -4};
/** The glass world's slow rotation: both devices turn this much further inward over the shot, coming to rest. */
const DRIFT_DEG = 2;
/** The band crosses the frame from here to here (fractions of the width) during `pair.sweep`. */
const SWEEP = {from: 0.12, to: 0.88} as const;
/**
 * Outside the sweep each device rests under a broad, dim band on its outer edge (the phone's left, the Watch's right:
 * the edges nearest the camera), so the pair reads as a lit hero in the void and the dim at the end is visible. The
 * rig has one band width, so the rest narrows into the sweep's width as the sweep takes over and widens back after.
 */
const REST = {intensity: 0.4, width: 0.35} as const;

const driftAt = (t: number): number => windowProgress({from: pair.peak, to: pair.cut}, t, 'easeInOutSine') * DRIFT_DEG;

export const phonePose = (t: number, format: FormatName, size: Size): DevicePose => {
  const L = format === 'tall' ? TALL : WIDE;
  return {placement: {...L.phone, height: size.height * L.phoneOfFrame}, rotation: {...PHONE_ROTATION, y: (PHONE_ROTATION.y ?? 0) + driftAt(t)}};
};

export const watchPose = (t: number, format: FormatName, size: Size): DevicePose => {
  const L = format === 'tall' ? TALL : WIDE;
  return {placement: {...L.watch, height: size.height * L.phoneOfFrame * L.watchOfPhone}, rotation: {...WATCH_ROTATION, y: (WATCH_ROTATION.y ?? 0) - driftAt(t)}};
};

/** Perimeter parameters of the resting bands: the middle of the phone's left edge and of the Watch's right edge. */
const REST_AT = {
  phone: paramOfPoint(PHONE.outline, -PHONE.outline.width / 2, 0),
  watch: paramOfPoint(WATCH.outline, WATCH.outline.width / 2, 0),
} as const;

/** Each device's light at `t`: the resting rim, handing over to its share of the one sweep (x across its own width). */
export const sweepLights = (t: number, phone: Placement, watch: Placement, size: Size): {phone: EdgeLight; watch: EdgeLight} => {
  const x = pairSweepX(t, SWEEP.from, SWEEP.to);
  const blend = pairSweepIntensity(t);
  const width = mix(REST.width, EDGE_LIGHT.widthOfDeviceHeight, blend);
  const rest = REST.intensity * (1 - blend);
  return {
    phone: {position: REST_AT.phone, intensity: rest, width, sweep: sweepFor(x, phone, PHONE.outline.width, size, blend)},
    watch: {position: REST_AT.watch, intensity: rest, width, sweep: sweepFor(x, watch, WATCH.outline.width, size, blend)},
  };
};

export const glowAt = (t: number): number => pairGlow(t);
export const isCut = (t: number): boolean => t >= pair.cut;
