// camera.ts — the one virtual camera: sheet px -> screen px, as a pure function of master time.
// A CameraKey timeline (src/sheet4.ts) is evaluated per chapter; centre and zoom share one easing per span,
// zoom is blended in log space (a 20x pull-back reads as constant speed), a 'head' key follows the pencil.
import {Easing} from 'remotion';
import {EASING} from '../beats';
import type {FormatName} from '../film';
import {FORMATS} from '../film';
import type {ChapterId} from '../film4';
import {slotOf4} from '../film4';
import {type CameraKey, cameraKeys, type Point} from '../sheet4';
import {headAt} from './lineGeometry';
import {slotAtMaster} from './timeline';

export type Camera = {readonly centre: Point; readonly zoom: number};
/** A rectangle in sheet px. */
export type SheetRect = {readonly x0: number; readonly y0: number; readonly x1: number; readonly y1: number};

const easers = Object.fromEntries(Object.entries(EASING).map(([name, [a, b, c, d]]) => [name, Easing.bezier(a, b, c, d)])) as Record<string, (t: number) => number>;
const ease = (name: string, t: number): number => (easers[name] ?? easers.linear)!(Math.min(1, Math.max(0, t)));

const resolveCentre = (k: CameraKey, master: number): Point => {
  if (k.centre !== 'head') return k.centre;
  const h = headAt(master);
  return [h[0] + (k.lead?.[0] ?? 0), h[1] + (k.lead?.[1] ?? 0)];
};

/** Camera for a chapter at a chapter-local time. `master` is only used to find the head for 'head' keys. */
export const cameraInChapter = (format: FormatName, id: ChapterId, local: number, master: number): Camera => {
  const keys = cameraKeys(format, id);
  const first = keys[0] as CameraKey;
  const last = keys[keys.length - 1] as CameraKey;
  if (local <= first.t) return {centre: resolveCentre(first, master), zoom: first.zoom};
  if (local >= last.t) return {centre: resolveCentre(last, master), zoom: last.zoom};
  const i = keys.findIndex((k) => k.t > local);
  const a = keys[i - 1] as CameraKey;
  const b = keys[i] as CameraKey;
  const w = ease(b.easing, (local - a.t) / (b.t - a.t));
  const ca = resolveCentre(a, master);
  const cb = resolveCentre(b, master);
  return {
    centre: [ca[0] + (cb[0] - ca[0]) * w, ca[1] + (cb[1] - ca[1]) * w],
    zoom: Math.exp(Math.log(a.zoom) + (Math.log(b.zoom) - Math.log(a.zoom)) * w),
  };
};

/** Where the camera is at a master time (0-600 s). Clamped to the film. */
export const cameraAt = (format: FormatName, masterSeconds: number): Camera => {
  const slot = slotAtMaster(masterSeconds);
  const local = Math.min(Math.max(0, masterSeconds - slot.start), slot.end - slot.start);
  return cameraInChapter(format, slot.id, local, masterSeconds);
};

export const viewportOf = (camera: Camera, width: number, height: number): SheetRect => {
  const hw = width / 2 / camera.zoom;
  const hh = height / 2 / camera.zoom;
  return {x0: camera.centre[0] - hw, y0: camera.centre[1] - hh, x1: camera.centre[0] + hw, y1: camera.centre[1] + hh};
};

/** Sheet px -> screen px for a canvas of this size. */
export const toScreen = (camera: Camera, width: number, height: number, p: Point): Point => [
  width / 2 + (p[0] - camera.centre[0]) * camera.zoom,
  height / 2 + (p[1] - camera.centre[1]) * camera.zoom,
];

/** Screen px of the sheet origin (0,0): the paper texture is anchored here, so it travels with the sheet. */
export const sheetOrigin = (camera: Camera, width: number, height: number): Point => toScreen(camera, width, height, [0, 0]);

export const canvasOf = (format: FormatName): {width: number; height: number} => FORMATS[format];
export const chapterStartOf = (id: ChapterId): number => slotOf4(id).start;
