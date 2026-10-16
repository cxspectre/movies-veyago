// pencilA.ts — pair A, the author: where the drawing hand and its pencil are at every frame of the module, pure.
// Waiting over the empty work area in the wide shot; drawing each page with the page's own schedule; clearing the
// work area before every slide (fully out on the slow pages, pulled back toward the bottom edge on the 2 s pages)
// and coming back for the next page's first stroke. Coordinates: sketch px of the work-area sheet.
import {Easing} from 'remotion';
import {EASING, FORM_TO_CHAT_FRACTIONS} from '../../beats';
import type {PencilKind, PencilRig} from '../../desk';
import {getPencilState, type PencilState, type SketchSpec} from '../../paper';
import {SKETCHES} from '../../sketches/registry';
import {GHOST, FAMILY_TABS_FRACTIONS} from '../../sketches/family-tabs';
import {PENCIL_RESTS, pencilState as formPencilState} from '../../sketches/form-to-chat';
import {blendRigs, followState, shiftRig, type StateAt} from './follow';
import {A_ENTER, aPhase, dipWindow, frameOf, pageFrame, PAGES} from './timing';

/** Where A's pencil waits over the empty work area in the wide shot (sketch px of the work sheet). */
const WAIT_TIP = {x: 470, y: 690} as const;
/** A pulls back along this direction (down, a little right: the forearm's way to the bottom edge), sketch px. */
const RETREAT = {dir: {x: 0.29, y: 0.96}, distance: 1050} as const;
const REST_HOVER_PX = 12;
/** form-to-chat's lift unit: its `pencilState` counts about 90 px for a full lift. */
const FORM_LIFT_PX = 90;
const LOOKAHEAD_FRAMES = 3;

const easeInOutSine = Easing.bezier(...EASING.easeInOutSine);
const easeOutCubic = Easing.bezier(...EASING.easeOutCubic);
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

const specOf = (i: number): SketchSpec => {
  const page = PAGES[i];
  const spec = page ? SKETCHES[page.id].spec : undefined;
  if (!page || !spec) throw new Error(`desk: page ${i} has no exported spec`);
  return spec;
};

// family-tabs: the hand also draws the light ghost "Dad" tab (its own layer, not in `spec`), then scrubs it out.
const familySpec = specOf(0);
const FAMILY_WITH_GHOST: SketchSpec = {...familySpec, id: `${familySpec.id}+ghost`, strokes: [...familySpec.strokes, GHOST]};
const ERASE = FAMILY_TABS_FRACTIONS.erase;
/**
 * The rubbing: the tip rides the family-tabs page's wipe edge (its WIPE 286 -> 436 sketch px, eased 1-(1-t)^2 over
 * the erase window, so the ghost fades right where the tip is) and scrubs across the ghost box (300-420, 160-210)
 * in five short zig-zag strokes, kissing the paper and lifting a hair at each turn.
 */
const SCRUB = {wipeFrom: 286, wipeTo: 436, behind: 10, swingX: 20, top: 166, bottom: 204, strokes: 5, contact: 0.15, turnLift: 0.5, blend: 0.1} as const;

const wipeEase = (k: number): number => 1 - (1 - k) ** 2;

const scrubPoint = (k: number): {x: number; y: number; lift: number} => {
  const edge = SCRUB.wipeFrom + (SCRUB.wipeTo - SCRUB.wipeFrom) * wipeEase(k);
  const phase = k * SCRUB.strokes * Math.PI;
  const zig = Math.sin(phase);
  const turn = Math.abs(Math.cos(phase)) ** 6;
  return {
    x: edge - SCRUB.behind + SCRUB.swingX * zig,
    y: SCRUB.top + ((SCRUB.bottom - SCRUB.top) * (1 - Math.cos(phase))) / 2,
    lift: SCRUB.contact + (SCRUB.turnLift - SCRUB.contact) * turn,
  };
};

const familyState = (drawFrames: number): StateAt => (frame) => {
  const base = getPencilState(FAMILY_WITH_GHOST, frame, drawFrames);
  const u = frame / drawFrames;
  if (u <= ERASE[0] || u >= ERASE[1]) return base;
  const k = (u - ERASE[0]) / (ERASE[1] - ERASE[0]);
  const scrub = scrubPoint(k);
  const edge = k < SCRUB.blend ? k / SCRUB.blend : k > 1 - SCRUB.blend ? (1 - k) / SCRUB.blend : 1;
  const e = easeInOutSine(clamp01(edge));
  return {...base, x: base.x + (scrub.x - base.x) * e, y: base.y + (scrub.y - base.y) * e, drawing: false, pressure: 0, lift: base.lift + (scrub.lift - base.lift) * e};
};

/**
 * The module ends as the accent loop closes at its left end; a right hand resting there lies over the chips. While
 * the loop goes round, the wrist turns the hand from its usual down-right toward straight down-left of the tip, so the
 * last frame (the wall's first) shows both chips and the loop with the pencil still on the line.
 */
const END_TURN = {from: FORM_TO_CHAT_FRACTIONS.circle[0] + 0.005, to: FORM_TO_CHAT_FRACTIONS.circle[1] - 0.005, degrees: 58} as const;

const formYawShift = (drawFrames: number) => (frame: number): number => {
  const k = clamp01((frame / drawFrames - END_TURN.from) / (END_TURN.to - END_TURN.from));
  return END_TURN.degrees * easeInOutSine(k);
};

const formRestHover = (drawFrames: number) => (s: PencilState, frame: number): number => {
  const u = frame / drawFrames;
  const resting = PENCIL_RESTS.some((r) => u > r.window[0] && u < r.window[1]);
  return resting ? Math.min(REST_HOVER_PX, s.lift * FORM_LIFT_PX) : 0;
};

const stateFnOf = (i: number, drawFrames: number): StateAt => {
  const id = PAGES[i]?.id;
  if (id === 'family-tabs') return familyState(drawFrames);
  if (id === 'form-to-chat') return (frame) => formPencilState(frame, drawFrames);
  const spec = specOf(i);
  return (frame) => getPencilState(spec, frame, drawFrames);
};

/** Pair A's rig on page `i` at page-local `frame`. */
export const pageRig = (i: number, frame: number): PencilRig => {
  const page = PAGES[i];
  if (!page) throw new Error(`desk: no page ${i}`);
  const stateAt = stateFnOf(i, page.drawFrames);
  const isForm = page.id === 'form-to-chat';
  const restHover = isForm ? formRestHover(page.drawFrames) : undefined;
  const yawShift = isForm ? formYawShift(page.drawFrames) : undefined;
  return followState(stateAt, frame, page.drawFrames, {restHover, yawShift});
};

/** Which pencil is in the hand: the accent one for accent strokes (the swap happens in the air, before the stroke). */
const pageKind = (i: number, frame: number): PencilKind => {
  const page = PAGES[i];
  if (!page) return 'graphite';
  const stateAt = stateFnOf(i, page.drawFrames);
  const ahead = Array.from({length: LOOKAHEAD_FRAMES + 1}, (_, k) => stateAt(frame + k)).find((s) => s.drawing);
  const ink = ahead?.ink ?? stateAt(frame).ink;
  return ink === 'accent' ? 'accent' : 'graphite';
};

const WAIT_STATE: PencilState = {...WAIT_TIP, angle: 0, pressure: 0, drawing: false, lift: 1, ink: null, strokeId: null, progress: 0, done: false};
const waitRig = (frame: number): PencilRig => followState(() => WAIT_STATE, frame, 1, {restHover: () => REST_HOVER_PX});

const retreat = (presence: number): {x: number; y: number} => {
  const out = (1 - clamp01(presence)) * RETREAT.distance;
  return {x: RETREAT.dir.x * out, y: RETREAT.dir.y * out};
};

export type HandAState = {readonly rig: PencilRig; readonly kind: PencilKind; readonly presence: number};

/** A dip's shape: out and back, with a short hang at the bottom. */
const dipBump = (u: number): number => Math.sin(Math.PI * clamp01(u)) ** 0.6;

const dipState = (to: number, u: number, depth: number): HandAState => {
  const w = dipWindow(to);
  const fromFrame = frameOf(w.from);
  const prevIndex = to - 1;
  const prev = prevIndex >= 0 ? PAGES[prevIndex] : undefined;
  const prevRig = prev ? pageRig(prevIndex, pageFrame(prev, fromFrame)) : waitRig(fromFrame);
  const prevKind = prev ? pageKind(prevIndex, pageFrame(prev, fromFrame)) : 'graphite';
  const presence = 1 - depth * dipBump(u);
  const rig = blendRigs(prevRig, pageRig(to, 0), easeInOutSine(clamp01(u)));
  return {rig: shiftRig(rig, retreat(presence)), kind: u < 0.5 ? prevKind : pageKind(to, 0), presence};
};

/** Pure: pair A at module frame `frame`. */
export const handAAt = (frame: number): HandAState => {
  const t = frame / 30;
  const phase = aPhase(t);
  if (phase.kind === 'pre') {
    const k = clamp01((t - A_ENTER.from) / (A_ENTER.to - A_ENTER.from));
    const presence = easeOutCubic(k);
    return {rig: shiftRig(waitRig(frame), retreat(presence)), kind: 'graphite', presence};
  }
  if (phase.kind === 'dip') return dipState(phase.to, phase.u, phase.depth);
  const page = PAGES[phase.index];
  if (!page) throw new Error(`desk: no page ${phase.index}`);
  const f = pageFrame(page, frame);
  return {rig: pageRig(phase.index, f), kind: pageKind(phase.index, f), presence: 1};
};

/** What stands in the pencil cup: everything A is not holding (the spare graphite stays). */
export const cupPencilsFor = (kind: PencilKind): readonly PencilKind[] => (kind === 'accent' ? ['graphite', 'graphite'] : ['accent', 'graphite']);
