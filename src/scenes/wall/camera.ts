// camera.ts — the wall's one camera (pure): the CUT to 1.45 on the work area, the RISE to 0.78 over the whole grid
// (0-5 s, easeInOutQuint), then the PUSH into the centre tile (5-11 s) that ends EXACTLY on the transition's opening
// framing: the centre sheet's drawn phone outline at 78% of the frame height (wide) / 62% (tall), its centre where
// the transition's phone will stand (transition.handoff.phoneCentre). BIBLE §2.8, beats.ts `wall`.
import {transition, wall} from '../../beats';
import type {FormatName} from '../../film';
import {FORMATS} from '../../film';
import {DESK_LAYOUT, type DeskCamera, type DeskPoint} from '../../desk';
import {ease, mix} from '../../glass';
import {PHONE_FRAME} from '../../sketches/binder-home-v2/screen';
import {centreSlot, gridCentre, tileScale} from './grid';

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/**
 * The push: a smooth start (zero velocity at 5.0, like the easeInOutCubic beats.ts names) and a long tail, so the
 * last 1.5 s from `pushIn.nearlyStillFrom` move less than 1% (BIBLE §2.8 "nearly still, the quint tail"); a
 * bezier ease leaves 5-8% of the zoom for that stretch. Scale moves in log space, where a zoom reads evenly.
 */
const PUSH_TAIL_POWER = 3;
const pushEase = (p: number): number => {
  const s = p * p * (3 - 2 * p);
  return 1 - (1 - s) ** PUSH_TAIL_POWER;
};
const logMix = (a: number, b: number, k: number): number => Math.exp(mix(Math.log(a), Math.log(b), k));

/** Where a desk point lands in the frame under a camera. */
export const deskToFrame = (format: FormatName, cam: DeskCamera, p: DeskPoint): DeskPoint => {
  const {width, height} = FORMATS[format];
  return {x: width / 2 + (p.x - cam.centre.x) * cam.scale, y: height / 2 + (p.y - cam.centre.y) * cam.scale};
};

/** The camera that puts desk point `p` at frame point `f` at `scale`. */
const cameraPinning = (format: FormatName, scale: number, p: DeskPoint, f: DeskPoint): DeskCamera => {
  const {width, height} = FORMATS[format];
  return {scale, centre: {x: p.x - (f.x - width / 2) / scale, y: p.y - (f.y - height / 2) / scale}};
};

/** Desk point under the drawn phone outline's centre (the centre tile's middle: the outline is centred on the page). */
export const phoneOutlineCentre = (format: FormatName): DeskPoint => {
  const slot = centreSlot(format);
  const s = tileScale(format);
  return {
    x: slot.centre.x + (PHONE_FRAME.x + PHONE_FRAME.w / 2 - 600) * s,
    y: slot.centre.y + (PHONE_FRAME.y + PHONE_FRAME.h / 2 - 425) * s,
  };
};

/**
 * The transition's opening framing, the wall's last frame: logical px per sketch px of the centre sheet, and where
 * the outline's centre sits in the frame. The transition module places its page with exactly these numbers.
 */
export const wallEndFraming = (format: FormatName): {readonly pageScale: number; readonly cameraScale: number; readonly outlineCentre: DeskPoint} => {
  const {width, height} = FORMATS[format];
  const pageScale = (transition.handoff.phoneHeightFraction[format] * height) / PHONE_FRAME.h;
  const [fx, fy] = transition.handoff.phoneCentre[format];
  return {pageScale, cameraScale: pageScale / tileScale(format), outlineCentre: {x: fx * width, y: fy * height}};
};

/** The top of the rise: the whole grid, centred (scale 0.78). */
export const riseTopCamera = (format: FormatName): DeskCamera => ({scale: wall.rise.scaleTo, centre: gridCentre(format)});

const riseCamera = (format: FormatName, t: number): DeskCamera => {
  const k = ease(wall.rise.easing, (t - wall.rise.from) / (wall.rise.to - wall.rise.from));
  const start = DESK_LAYOUT[format].activeSheet.centre;
  const end = gridCentre(format);
  return {
    scale: logMix(wall.rise.scaleFrom, wall.rise.scaleTo, k),
    centre: {x: mix(start.x, end.x, k), y: mix(start.y, end.y, k)},
  };
};

const pushCamera = (format: FormatName, t: number): DeskCamera => {
  const k = pushEase(clamp01((t - wall.pushIn.from) / (wall.pushIn.to - wall.pushIn.from)));
  const top = riseTopCamera(format);
  const end = wallEndFraming(format);
  const target = phoneOutlineCentre(format);
  const from = deskToFrame(format, top, target);
  const scale = logMix(wall.pushIn.scaleFrom, end.cameraScale, k);
  return cameraPinning(format, scale, target, {x: mix(from.x, end.outlineCentre.x, k), y: mix(from.y, end.outlineCentre.y, k)});
};

/** The wall camera at module-local second `t`. */
export const wallCamera = (format: FormatName, t: number): DeskCamera => (t < wall.pushIn.from ? riseCamera(format, t) : pushCamera(format, t));

/** The frame that is visible under a camera, in desk px. */
export const visibleDeskRect = (format: FormatName, cam: DeskCamera): {readonly x0: number; readonly y0: number; readonly x1: number; readonly y1: number} => {
  const {width, height} = FORMATS[format];
  const hw = width / 2 / cam.scale;
  const hh = height / 2 / cam.scale;
  return {x0: cam.centre.x - hw, y0: cam.centre.y - hh, x1: cam.centre.x + hw, y1: cam.centre.y + hh};
};
