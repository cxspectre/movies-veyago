// timing.ts — the desk module's own clock, derived from beats.ts (DESK_PAGES, desk.*). Nothing here re-types a
// time that beats.ts holds: the only numbers are the module's choreography choices (how long a hand takes to clear
// the work area, when pair B brings the first sheet in during the wide shot), named and in module-local seconds.
import {DESK_PAGES, desk, type PageBeat, type Window} from '../../beats';
import {FPS} from '../../film';
import type {SketchId} from '../../sketches/registry';

export const PAGES: readonly PageBeat[] = DESK_PAGES;

const firstPage = (): PageBeat => {
  const p = PAGES[0];
  if (!p) throw new Error('desk: DESK_PAGES is empty');
  return p;
};
export const FIRST_PAGE = firstPage();
export const FORM_PAGE_INDEX = PAGES.findIndex((p) => p.id === 'form-to-chat');
if (FORM_PAGE_INDEX < 0) throw new Error('desk: form-to-chat is not in DESK_PAGES');

/** Pair A's way into the wide shot (0:35): it comes up from the bottom edge and waits over the empty work area. */
export const A_ENTER: Window = {from: 0.4, to: 1.4};
/** Pair B carries page 1 in from the right during the wide shot and holds it beside the work area. */
export const B_CARRY_IN: Window = {from: 0.6, to: 1.8};
/** A hand clears the work area this long before a sheet starts sliding in (and is back for the first stroke). */
export const DIP_LEAD = 0.5;
/** Pair B lets go of a sheet this far through its slide (the sheet coasts the rest of the way in)... */
export const B_RELEASE_FRACTION = 0.5;
/** ...and is off the sheet this long after it lands (before A's first stroke can reach B's side). */
export const B_EXIT_TAIL = 0.05;
/** A slide this short (or shorter) is a fast page: B grips it further out, nearer its own edge. */
export const SHORT_SLIDE_SECONDS = 0.3;
/** A dip this long (or longer) takes the hand fully out of frame; shorter dips only pull it back toward the edge. */
const FULL_DIP_SECONDS = 0.9;
const MIN_DIP_DEPTH = 0.62;

export const frameOf = (t: number): number => Math.round(t * FPS);
export const secondsOf = (frame: number): number => frame / FPS;
/** Page-local frame of a page's drawing (0 at its drawStart). */
export const pageFrame = (page: PageBeat, frame: number): number => frame - frameOf(page.drawStart);

/** The page on the work area at `t`: the latest one whose slide has started. -1 before page 1 starts. */
export const activePageIndex = (t: number): number => {
  let found = -1;
  PAGES.forEach((p, i) => {
    if (t >= p.start) found = i;
  });
  return found;
};

/** The window in which pair A clears the work area before page `i` and comes back for its first stroke. */
export const dipWindow = (i: number): Window => {
  const page = PAGES[i];
  if (!page) throw new Error(`desk: no page ${i}`);
  const prev = PAGES[i - 1];
  const prevDone = prev ? prev.drawEnd : page.start - DIP_LEAD;
  return {from: Math.max(prevDone, page.start - DIP_LEAD), to: page.drawStart};
};

/** How far the dip takes the hand out (1 = fully off frame). */
export const dipDepth = (w: Window): number => Math.min(1, Math.max(MIN_DIP_DEPTH, (w.to - w.from) / FULL_DIP_SECONDS));

export type APhase =
  | {readonly kind: 'pre'}
  | {readonly kind: 'page'; readonly index: number}
  | {readonly kind: 'dip'; readonly to: number; readonly u: number; readonly depth: number};

/** What pair A is doing at `t`: waiting (the wide shot), drawing page `index`, or clearing the work area. */
export const aPhase = (t: number): APhase => {
  const dipIndex = PAGES.findIndex((_, i) => {
    const w = dipWindow(i);
    return t >= w.from && t < w.to;
  });
  if (dipIndex >= 0) {
    const w = dipWindow(dipIndex);
    return {kind: 'dip', to: dipIndex, u: (t - w.from) / (w.to - w.from), depth: dipDepth(w)};
  }
  const drawing = PAGES.reduce((found, p, i) => (t >= p.drawStart ? i : found), -1);
  return drawing < 0 ? {kind: 'pre'} : {kind: 'page', index: drawing};
};

/** The VO 6 push, from beats.ts (1:12.0-1:13.5). */
export const FORM_PUSH = desk.formPushIn;
export const WORK_PUSH = desk.pushToWorkArea;
export const MODULE_SECONDS = desk.cut;

export const pageId = (i: number): SketchId => {
  const p = PAGES[i];
  if (!p) throw new Error(`desk: no page ${i}`);
  return p.id;
};
