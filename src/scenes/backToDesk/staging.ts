// staging.ts — back to the desk (2:25-2:33), pure: the camera (the wall's top-of-rise framing tightened to 1.00 on
// the centre tile, then the slow push 1.00 -> 1.08 on the face-up phone), where the real phone lies, and the hand
// lowering the pencil beside it. BIBLE §2.8, §6.4; beats.ts `backToDesk`.
import {backToDesk} from '../../beats';
import type {FormatName} from '../../film';
import {FORMATS} from '../../film';
import type {DeskCamera, DeskPoint} from '../../desk';
import {ease, mix, windowProgress} from '../../glass';
import {PHONE_FRAME} from '../../sketches/binder-home-v2/screen';
import {centreSlot, tileScale} from '../wall';

/** The phone lies on the drawn home's centre (the outline is centred on the page), turned +6° (clockwise). */
export const PHONE_ROTATION_DEG = 6;

export const phoneDeskCentre = (format: FormatName): DeskPoint => centreSlot(format).centre;

/**
 * The real phone covers the drawn one (BIBLE §6.4: "the drawing under it is the same home"): as tall as the sketch's
 * phone outline (desk px), so turned +6° only the drawn outline's corners show around it. Larger than a real phone
 * on A3; the film's last image is the product lying on its own drawing, not a scale model.
 */
const PHONE_COVERS_OUTLINE = 1.0;
export const phoneDeskHeight = (format: FormatName): number => PHONE_FRAME.h * tileScale(format) * PHONE_COVERS_OUTLINE;

/**
 * Tall only: the camera sits this far below the centre tile (desk px), lifting the grid so the closing line's
 * baseline (120 px up) lands on bare wood under the bottom row instead of on a paper edge. Wide has no such band at
 * this framing (the bottom row runs to ~60 px from the edge); its line gets a panel instead (ClosingLine).
 */
export const CLOSING_LINE_LIFT: Record<FormatName, number> = {wide: 0, tall: 42};
/** Tall: the eraser moves along the bottom edge, out from under the closing line's last word. */
export const ERASER_NUDGE: Record<FormatName, DeskPoint> = {wide: {x: 0, y: 0}, tall: {x: 130, y: 6}};

export const backToDeskCamera = (format: FormatName, t: number): DeskCamera => {
  const k = windowProgress(backToDesk.pushIn, t, backToDesk.pushIn.easing);
  const c = phoneDeskCentre(format);
  return {scale: mix(backToDesk.pushIn.scaleFrom, backToDesk.pushIn.scaleTo, k), centre: {x: c.x, y: c.y + CLOSING_LINE_LIFT[format]}};
};

/** A desk point in frame px under the camera. */
export const toFrame = (format: FormatName, cam: DeskCamera, p: DeskPoint): DeskPoint => {
  const {width, height} = FORMATS[format];
  return {x: width / 2 + (p.x - cam.centre.x) * cam.scale, y: height / 2 + (p.y - cam.centre.y) * cam.scale};
};

// ---- pair A's hand with the pencil (sketch px of the centre sheet) ----------------------------------------------

/** The tip comes down beside the phone, on the lamp's far side (its shadow falls away from the screen). */
const TIP_FROM: DeskPoint = {x: 838, y: 560};
const TIP_TO: DeskPoint = {x: 806, y: 606};
/** Hover of the tip above the paper, px: high as the hand comes in, a hair above the paper at the end. */
export const HOVER_HIGH = 60;
export const HOVER_HAIR = 2;
/** The pencil's back end points down-right, toward pair A at the bottom edge. */
export const PENCIL_YAW = 56;
/** The hand comes in this far from below (sketch px), from beyond the frame. */
export const HAND_TRAVEL = 2600;

export type PencilPose = {readonly presence: number; readonly tip: DeskPoint; readonly hover: number};

export const pencilPose = (t: number): PencilPose => {
  const presence = windowProgress({from: backToDesk.handIn, to: backToDesk.pencilLower.from}, t, 'easeOutCubic');
  const k = windowProgress(backToDesk.pencilLower, t, 'easeInOutSine');
  return {
    presence,
    tip: {x: mix(TIP_FROM.x, TIP_TO.x, k), y: mix(TIP_FROM.y, TIP_TO.y, k)},
    hover: mix(HOVER_HIGH, HOVER_HAIR, ease('linear', k)),
  };
};

/** The closing line's opacity (0.6 s fade from `closingLine.at`). */
export const closingLineOpacity = (t: number): number =>
  windowProgress({from: backToDesk.closingLine.at, to: backToDesk.closingLine.at + backToDesk.closingLine.fadeSeconds}, t, 'easeInOutSine');

/** Desk px per sketch px of the centre sheet. */
export const sheetScale = tileScale;
