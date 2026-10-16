// handB.ts — pair B, the assistant (BIBLE §2.11): brings every sheet in from its side of the desk (right in wide,
// top-right in tall), flat hand on the sheet, lets go halfway through the slide (the sheet coasts the rest) and is
// off the sheet just after it lands, before pair A's first stroke can reach B's side. In the wide shot B carries
// page 1 in and holds it beside the work area until the push. Pure; coordinates are sketch px of the moving sheet.
import {Easing} from 'remotion';
import {EASING, type Window} from '../../beats';
import type {FormatName} from '../../film';
import type {FrameEdge} from '../../desk';
import {incomingPose, type SheetPose} from './sheets';
import {B_CARRY_IN, B_EXIT_TAIL, B_RELEASE_FRACTION, PAGES, SHORT_SLIDE_SECONDS} from './timing';

type BGrip = {readonly at: {readonly x: number; readonly y: number}; readonly rotation: number; readonly edge: FrameEdge};

/** Where B's palm sits on a sheet it slides (near B's own edge, clear of where A starts), fingers toward the work area. */
export const B_GRIP: Record<FormatName, BGrip> = {
  wide: {at: {x: 1160, y: 250}, rotation: -84, edge: 'right'},
  tall: {at: {x: 1120, y: 140}, rotation: -132, edge: 'topRight'},
};
/**
 * On the fast pages (0.3 s slides) A's first stroke starts the moment the sheet lands, often along the top edge:
 * B's palm sits further out, up in the sheet's top-right corner (about 170 px nearer its own edge).
 */
export const B_GRIP_SHORT: Record<FormatName, BGrip> = {
  wide: {at: {x: 1180, y: 85}, rotation: -84, edge: 'right'},
  tall: {at: {x: 1200, y: 0}, rotation: -132, edge: 'topRight'},
};

/** The grip B uses on page `i`. */
export const gripFor = (format: FormatName, i: number): BGrip => {
  const page = PAGES[i];
  return page && page.slideIn <= SHORT_SLIDE_SECONDS ? B_GRIP_SHORT[format] : B_GRIP[format];
};
export const B_TRAVEL = 1500;
/** B's hand rides a few px above the sheet it pushes. */
const ON_SHEET_LIFT = 3;

const easeInOutSine = Easing.bezier(...EASING.easeInOutSine);
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

export type HandBState = {readonly page: number; readonly sheet: SheetPose; readonly presence: number; readonly lift: number};

/** When B lets go of page `i` and when it is off the sheet (it leaves between the two). */
export const bExit = (i: number): Window => {
  const page = PAGES[i];
  if (!page) throw new Error(`desk: no page ${i}`);
  return {from: page.start + page.slideIn * B_RELEASE_FRACTION, to: page.start + page.slideIn + B_EXIT_TAIL};
};

/** The window B is on page `i`'s sheet (from when the sheet enters until B has left it). */
export const bWindow = (i: number): Window => {
  const page = PAGES[i];
  if (!page) throw new Error(`desk: no page ${i}`);
  return {from: i === 0 ? B_CARRY_IN.from : page.start, to: bExit(i).to};
};

/** Pure: pair B at module time `t`, or null when B is off the desk. */
export const handBAt = (format: FormatName, t: number): HandBState | null => {
  const i = PAGES.findIndex((_, n) => {
    const w = bWindow(n);
    return t >= w.from && t < w.to;
  });
  const page = PAGES[i];
  const sheet = incomingPose(format, i, t);
  if (!page || !sheet) return null;
  const exit = bExit(i);
  const presence = 1 - easeInOutSine(clamp01((t - exit.from) / (exit.to - exit.from)));
  return {page: i, sheet, presence, lift: sheet.lift + ON_SHEET_LIFT};
};
