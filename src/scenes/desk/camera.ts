// camera.ts — the desk module's camera (BIBLE §2.8), pure: t (module seconds) -> {scale, centre} in desk coordinates.
// 0:35 the CUT to the wide desk at 0.80; 0:38.0-0:38.5 the push to 1.25 on the work area; a ±1.5% / ±12 px drift
// over each later slide-in; 1:12.0-1:13.5 the push 1.25 -> 1.45 onto the form page, held to the cut at 1:20 (the
// wall module starts from exactly `DESK_END_CAMERA`). One move at a time; no shake.
import {Easing} from 'remotion';
import {EASING, type EasingName} from '../../beats';
import type {FormatName} from '../../film';
import {DESK_LAYOUT, type DeskCamera, type DeskPoint} from '../../desk';
import {hashSigned} from '../../paper/geometry/noise';
import {FORM_PAGE_INDEX, FORM_PUSH, PAGES, WORK_PUSH} from './timing';

/** The wide desk at 0:35 (BIBLE §2.8: the whole desk in frame). */
export const WIDE_SCALE = WORK_PUSH.scaleFrom;

/**
 * The tall frame is a narrower window on the same desk: at the bible's 1.25 the 900 px tall work sheet would be 104%
 * of the frame width, so tall work-area framings are scaled to the bible's own target (the sheet at ~92% of the
 * width). Wide is literal. Applies to the work-area framings only (1.25, 1.45), not to the 0.80 wide shot.
 */
const TALL_WORK_FIT = 0.883;
const DRIFT = {scale: 0.015, px: 12, seed: 4021} as const;

const ease = (name: EasingName): ((x: number) => number) => {
  const [a, b, c, d] = EASING[name];
  return Easing.bezier(a, b, c, d);
};
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const lerpCam = (a: DeskCamera, b: DeskCamera, k: number): DeskCamera => ({
  scale: lerp(a.scale, b.scale, k),
  centre: {x: lerp(a.centre.x, b.centre.x, k), y: lerp(a.centre.y, b.centre.y, k)},
});

const workFit = (format: FormatName): number => (format === 'tall' ? TALL_WORK_FIT : 1);
const deskCentre = (format: FormatName): DeskPoint => ({x: DESK_LAYOUT[format].width / 2, y: DESK_LAYOUT[format].height / 2});

/** The 0.80 wide shot. */
export const wideCamera = (format: FormatName): DeskCamera => ({scale: WIDE_SCALE, centre: deskCentre(format)});

/** A work-area framing at the bible's nominal scale (1.25, 1.45), centred on the active sheet. */
export const workCamera = (format: FormatName, nominal: number): DeskCamera => ({
  scale: nominal * workFit(format),
  centre: DESK_LAYOUT[format].activeSheet.centre,
});

/** Page `i`'s resting framing: the work framing plus its seeded drift (page 1 lands on the push exactly). */
const pageCamera = (format: FormatName, i: number): DeskCamera => {
  const base = workCamera(format, WORK_PUSH.scaleTo);
  if (i <= 0) return base;
  const sign = i % 2 === 0 ? 1 : -1;
  const k = 1 + sign * DRIFT.scale * (0.6 + 0.4 * Math.abs(hashSigned(DRIFT.seed, i)));
  return {
    scale: base.scale * k,
    centre: {x: base.centre.x + DRIFT.px * hashSigned(DRIFT.seed + 1, i), y: base.centre.y + DRIFT.px * hashSigned(DRIFT.seed + 2, i)},
  };
};

/** Where the module ends: 1.45 on the form page. The wall's 1:20 cut keeps exactly this framing. */
export const deskEndCamera = (format: FormatName): DeskCamera => workCamera(format, FORM_PUSH.scaleTo);

const formPush = (format: FormatName, t: number): DeskCamera => {
  const k = ease(FORM_PUSH.easing)(clamp01((t - FORM_PUSH.from) / (FORM_PUSH.to - FORM_PUSH.from)));
  return lerpCam(pageCamera(format, FORM_PAGE_INDEX - 1), deskEndCamera(format), k);
};

/** Pure: the camera at module time `t`. */
export const cameraAt = (format: FormatName, t: number): DeskCamera => {
  if (t < WORK_PUSH.from) return wideCamera(format);
  if (t < WORK_PUSH.to) {
    const k = ease(WORK_PUSH.easing)(clamp01((t - WORK_PUSH.from) / (WORK_PUSH.to - WORK_PUSH.from)));
    return lerpCam(wideCamera(format), pageCamera(format, 0), k);
  }
  if (t >= FORM_PUSH.from) return formPush(format, t);
  const i = PAGES.reduce((found, p, n) => (n > 0 && n < FORM_PAGE_INDEX && t >= p.start ? n : found), 0);
  const page = PAGES[i];
  if (!page || i === 0) return pageCamera(format, 0);
  const k = ease('easeInOutSine')(clamp01((t - page.start) / page.slideIn));
  return lerpCam(pageCamera(format, i - 1), pageCamera(format, i), k);
};
