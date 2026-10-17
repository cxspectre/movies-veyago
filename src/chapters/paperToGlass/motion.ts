// motion.ts — chapter 10's pure frame -> state maps (BIBLE4 §5.10). Module-local seconds in; every time comes from
// `paperToGlass` in src/beats4.ts. The phone's numbers are the v1 handoff's (78% / 62% of the frame height), so the
// family-of-devices layout of v1 (src/scenes/familyOfDevices/layout.ts) can run on `t - family.hit`.
import {GLASS_SNAPS, RECORDINGS, paperToGlass as P, type Recording} from '../../beats4';
import {PHONE, type EdgeLight, type Placement, type Rotation} from '../../devices';
import type {FormatName} from '../../film';
import {cornerParam, ease, interpolateKeyframes, mix, windowProgress} from '../../glass';
import {footageClip, stillSource, type ScreenSource as KitScreen} from '../../kit/footage';
import type {ScreenSource} from '../../devices';

export type Size = {readonly width: number; readonly height: number};

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** The phone the line folds into (wide centre 0.5 / 0.52, tall 0.5 / 0.5; 78% / 62% of the frame height). */
export const basePlacement = (format: FormatName, size: Size): Placement =>
  format === 'tall' ? {x: 0.5, y: 0.5, height: 0.62 * size.height} : {x: 0.5, y: 0.52, height: 0.78 * size.height};

export const fovAt = (t: number): number => P.perspective.fovFrom + (P.perspective.fovTo - P.perspective.fovFrom) * windowProgress(P.perspective, t, 'easeInOutSine');

export const mainRotation = (t: number): Rotation => ({
  y: interpolateKeyframes(P.rotationY, t, 'easeInOutSine'),
  x: -5 * windowProgress({from: P.perspective.from, to: P.perspective.to}, t, 'easeInOutSine'),
});

/** Snap flare (160%) decaying over 0.3 s after `at`. */
const flare = (t: number, at: number, peak = 1.6): number => {
  const s = t - at;
  return s < 0 || s > P.snapSeconds ? 1 : 1 + (peak - 1) * (1 - ease('easeOutCubic', s / P.snapSeconds));
};

/** Extra screen swaps that are not one of the nine snaps (the split's wallpaper, the home before the flip). */
export const SCREEN_SWAPS = {split: P.split.from, home: 35.4} as const;

export const lightFlare = (t: number): number => {
  let k = 1;
  for (const s of GLASS_SNAPS) k = Math.max(k, flare(t, s.t));
  k = Math.max(k, flare(t, SCREEN_SWAPS.split, 1.4), flare(t, SCREEN_SWAPS.home, 1.4), flare(t, P.invite.tap));
  return k;
};

/** The phone's edge light: one clockwise lap 8.0-16.0 (a 0.4 s ramp), the drift to the top-right corner 16.0-18.0, then rest. */
export const mainLight = (t: number): EdgeLight => {
  const {lap, settle} = P.edgeLight;
  const intensity = windowProgress({from: lap.from, to: lap.from + 0.4}, t, 'easeOutCubic') * lightFlare(t);
  if (t < lap.to) return {position: windowProgress(lap, t), intensity};
  return {position: cornerParam(PHONE.outline, 'topRight') * windowProgress(settle, t, 'easeInOutSine'), intensity};
};

export const REST_LIGHT: EdgeLight = {position: cornerParam(PHONE.outline, 'topRight'), intensity: 1};

/** The body comes in under the lit outline (the edge light is first). */
export const mainBodyOpacity = (t: number): number => windowProgress({from: 9.0, to: 10.0}, t, 'easeInOutSine');

// The nine snaps

export const snapIndexAt = (t: number): number => {
  if (t < GLASS_SNAPS[0]!.t) return -1;
  let i = 0;
  GLASS_SNAPS.forEach((s, n) => {
    if (t >= s.t) i = n;
  });
  return i;
};

const SNAP_SECONDS_EACH = 1.5;
export const snapWindow = (i: number): {from: number; to: number} => {
  const s = GLASS_SNAPS[i]!;
  const next = GLASS_SNAPS[i + 1];
  return {from: s.t, to: next ? next.t : P.split.from - 0.0};
};

/** A clip of the manifests as a rig screen: the hot window's start shows at `at`, never past the hot window's end. */
export const clipScreen = (id: string, at: number): ScreenSource => {
  const c = footageClip(id);
  if (c.kind !== 'video') throw new Error(`paperToGlass: ${id} is not a clip`);
  return {kind: 'video', src: c.src, startAt: c.hotStart - at, endAt: c.hotEnd ?? undefined};
};

export const stillScreen = (src: string): ScreenSource => ({kind: 'image', src});

/** The id a plan entry names: `capture: pet-binder` -> `pet-binder`. */
const planId = (footage: string): string => footage.replace(/^capture:\s*/, '');

/** Snap `i`'s picture, started at its own beat. */
export const snapScreen = (i: number): ScreenSource => {
  const s = GLASS_SNAPS[i]!;
  const id = planId(s.footage);
  if (id === 'pet-binder') return stillScreen('footage4/binder-home-biscuit-light.png');
  return clipScreen(id, s.t);
};

// The row of five (25.0-35.4) and the merge

export const BINDERS = P.split.binders;
export const ROW_X: Record<FormatName, readonly number[]> = {wide: [0.18, 0.34, 0.5, 0.66, 0.82], tall: [0.1, 0.3, 0.5, 0.7, 0.9]};
export const ROW_HEIGHT: Record<FormatName, number> = {wide: 0.42, tall: 0.24};
export const ROW_YAW = [-10, -10, 0, 10, 10] as const;
export const ROW_Y: Record<FormatName, number> = {wide: 0.5, tall: 0.5};

/** 0 = one phone, 1 = the row of five. */
export const rowSpread = (t: number): number => windowProgress(P.split, t, 'keynote') * (1 - windowProgress(P.merge, t, 'keynote'));

export const rowSlot = (format: FormatName, size: Size, index: number, k: number, from: Placement, fromRotation: Rotation): {placement: Placement; rotation: Rotation} => ({
  placement: {
    x: mix(from.x, ROW_X[format][index]!, k),
    y: mix(from.y, ROW_Y[format], k),
    height: mix(from.height, ROW_HEIGHT[format] * size.height, k),
  },
  rotation: {x: mix(fromRotation.x ?? 0, 0, k), y: mix(fromRotation.y ?? 0, ROW_YAW[index]!, k)},
});

export const binderScreen = (name: string): ScreenSource => stillScreen(`footage4/binder-home-${name.toLowerCase()}-light.png`);

/** The four clones fade in over the first third of the split and out over the last third of the merge. */
export const cloneOpacity = (k: number): number => clamp01(k / 0.3);

// The family (36.0-42.0): the v1 layout runs on `t - P.family.hit`.
export const familyT = (t: number): number => t - P.family.hit;
export const glowAt = (t: number): number => mix(1, 0.7, windowProgress(P.family.settle, t, 'easeInOutSine'));
export const devicesFade = (t: number): number => 1 - windowProgress(P.devicesOut, t, 'easeInOutSine');

// The eight recordings (48.0-60.0)

export const recordingAt = (t: number): Recording | null => RECORDINGS.find((r) => t >= r.t && t < r.t + r.dur) ?? null;

export const REC_PHONE_HEIGHT: Record<FormatName, number> = {wide: 0.78, tall: 0.7};
export const REC_PHONE_Y: Record<FormatName, number> = {wide: 0.46, tall: 0.42};

export const recordingScreen = (r: Recording): ScreenSource => clipScreen(r.footage.replace(/^capture:\s*/, ''), r.t);

export const recordingPose = (r: Recording, t: number, format: FormatName, size: Size): {placement: Placement; rotation: Rotation; scale: number} => {
  const p = clamp01((t - r.t) / r.dur);
  return {
    placement: {x: 0.5, y: REC_PHONE_Y[format], height: REC_PHONE_HEIGHT[format] * size.height},
    rotation: {x: -4, y: r.rotationY + (r.rotationY >= 0 ? 1 - 2 * p : -1 + 2 * p)},
    scale: 1 + 0.018 * p,
  };
};

// The invitation (60.0-68.0)

export type Spot = {x: number; y: number};
export const INVITE: Record<FormatName, {phone: Spot & {height: number}; maya: Spot & {height: number}; far: Spot & {height: number}}> = {
  wide: {phone: {x: 0.38, y: 0.5, height: 0.36}, maya: {x: 0.22, y: 0.82, height: 0.5}, far: {x: 0.86, y: 0.5, height: 0.18}},
  tall: {phone: {x: 0.5, y: 0.55, height: 0.26}, maya: {x: 0.5, y: 0.4, height: 0.2}, far: {x: 0.5, y: 0.86, height: 0.16}},
};

/** The title's light level at 80.0: chapter 10 dims 1 -> this over 79.5-80.0 and chapter 11 starts from it (BIBLE4 5.10/5.11). */
export const HANDOFF_LIGHT = 0.6;
