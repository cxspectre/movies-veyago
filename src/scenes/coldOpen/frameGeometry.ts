// frameGeometry.ts — the visible frame expressed in desk and sheet coordinates, and how far something has to travel
// along a direction to be out of it (so hands enter and leave exactly off frame, in both formats). Pure.
import {FORMATS} from '../../film';
import type {DeskPoint} from '../../desk';
import {SKETCH_SIZE} from '../../paper';
import type {ColdOpenLayout} from './layout';

export type Rect = {readonly left: number; readonly top: number; readonly right: number; readonly bottom: number};

const rectAround = (c: DeskPoint, halfW: number, halfH: number): Rect => ({left: c.x - halfW, top: c.y - halfH, right: c.x + halfW, bottom: c.y + halfH});

/** The static framing's visible rectangle in desk px. */
export const frameInDesk = (L: ColdOpenLayout): Rect => {
  const {width, height} = FORMATS[L.format];
  return rectAround(L.cameraCentre, width / 2 / L.cameraScale, height / 2 / L.cameraScale);
};

/**
 * The visible rectangle in the V1 sheet's own px (the phone centre is the frame centre). The sheet's small
 * rotation is ignored; callers add a margin.
 */
export const frameInSheet = (L: ColdOpenLayout): Rect => {
  const {width, height} = FORMATS[L.format];
  const k = L.sheet.scale * L.cameraScale;
  return rectAround({x: SKETCH_SIZE.width / 2, y: SKETCH_SIZE.height / 2}, width / 2 / k, height / 2 / k);
};

/** Distance along unit `dir` from `p` until a disc of radius `margin` around it has left `rect`. */
export const travelToLeave = (p: DeskPoint, dir: DeskPoint, rect: Rect, margin: number): number => {
  const candidates = [
    dir.x > 1e-6 ? (rect.right + margin - p.x) / dir.x : Infinity,
    dir.x < -1e-6 ? (rect.left - margin - p.x) / dir.x : Infinity,
    dir.y > 1e-6 ? (rect.bottom + margin - p.y) / dir.y : Infinity,
    dir.y < -1e-6 ? (rect.top - margin - p.y) / dir.y : Infinity,
  ].filter((s) => s > 0);
  return candidates.length > 0 ? Math.min(...candidates) : 0;
};

export const unit = (v: DeskPoint): DeskPoint => {
  const l = Math.hypot(v.x, v.y) || 1;
  return {x: v.x / l, y: v.y / l};
};
