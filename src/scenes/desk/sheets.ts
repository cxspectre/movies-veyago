// sheets.ts — where every sheet of the desk module is, pure: the incoming page sliding onto the work area (from the
// right in wide, the top-right in tall: pair B's side), the page on the work area, the finished page leaving up-left
// for the stack, and the stack itself (BIBLE §2.10 "finished pages", scale 0.55 / 0.45, −4° ±2°).
import {Easing} from 'remotion';
import {EASING} from '../../beats';
import type {FormatName} from '../../film';
import {DESK_LAYOUT, type DeskPoint} from '../../desk';
import {hashSigned} from '../../paper/geometry/noise';
import {B_CARRY_IN, PAGES} from './timing';

export type SheetPose = {
  readonly centre: DeskPoint;
  readonly scale: number;
  readonly rotation: number;
  /** Height above the desk, px (PaperSheet `lift`: the shadow grows with it). */
  readonly lift: number;
};

type Entry = {readonly dir: DeskPoint; readonly distance: number; readonly staging: DeskPoint; readonly stagingRotation: number};

const SQRT_HALF = Math.SQRT1_2;
/** Pair B's side of the desk, and where B holds page 1 during the wide shot (beside the work area, off the props). */
export const ENTRY: Record<FormatName, Entry> = {
  wide: {dir: {x: 1, y: 0}, distance: 1400, staging: {x: 1640, y: 820}, stagingRotation: 3},
  tall: {dir: {x: SQRT_HALF, y: -SQRT_HALF}, distance: 1500, staging: {x: 1000, y: 560}, stagingRotation: 6},
};

const REST_LIFT = 6;
const SLIDE_LIFT = 8;
const CARRY_LIFT = 18;
const LEAVE_LIFT = 10;
/**
 * The finished stack: each page lands within one 40 px layout step of the first slot, biased right (x 0..+1 step,
 * y ±0.5) so the pile leaves most of the V1 sheet's note in view.
 */
const STACK_SPREAD = {x: 0.5, xBias: 0.5, y: 0.5, seed: 7317} as const;

const easeOutCubic = Easing.bezier(...EASING.easeOutCubic);
const easeInOutSine = Easing.bezier(...EASING.easeInOutSine);
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const lerpPt = (a: DeskPoint, b: DeskPoint, k: number): DeskPoint => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)});
const along = (p: DeskPoint, dir: DeskPoint, d: number): DeskPoint => ({x: p.x + dir.x * d, y: p.y + dir.y * d});

/** The work area, at rest. */
export const workPose = (format: FormatName): SheetPose => {
  const s = DESK_LAYOUT[format].activeSheet;
  return {centre: s.centre, scale: s.scale, rotation: s.rotation, lift: REST_LIFT};
};

/** Finished page `i`'s place on the stack (seeded, fixed). */
export const stackPose = (format: FormatName, i: number): SheetPose => {
  const f = DESK_LAYOUT[format].finishedPages;
  return {
    centre: {x: f.first.x + f.step * (STACK_SPREAD.xBias + STACK_SPREAD.x * hashSigned(STACK_SPREAD.seed, i)), y: f.first.y + f.step * STACK_SPREAD.y * hashSigned(STACK_SPREAD.seed + 1, i)},
    scale: f.scale,
    rotation: f.rotation + f.rotationJitter * hashSigned(STACK_SPREAD.seed + 2, i),
    lift: 1.5,
  };
};

const stagingPose = (format: FormatName): SheetPose => {
  const e = ENTRY[format];
  return {centre: e.staging, scale: workPose(format).scale, rotation: e.stagingRotation, lift: REST_LIFT};
};

/** Page 1 during the wide shot: pair B carries it in, lifted, and holds it beside the work area. */
const carriedPose = (format: FormatName, t: number): SheetPose | null => {
  if (t < B_CARRY_IN.from) return null;
  const e = ENTRY[format];
  const staging = stagingPose(format);
  const k = easeOutCubic(clamp01((t - B_CARRY_IN.from) / (B_CARRY_IN.to - B_CARRY_IN.from)));
  return {...staging, centre: lerpPt(along(e.staging, e.dir, e.distance), e.staging, k), lift: lerp(CARRY_LIFT, REST_LIFT, k)};
};

/** Page `i` from the moment it is in frame until it starts to leave; null while it is not on the desk yet. */
export const incomingPose = (format: FormatName, i: number, t: number): SheetPose | null => {
  const page = PAGES[i];
  if (!page) return null;
  const work = workPose(format);
  const layout = DESK_LAYOUT[format];
  if (t < page.start) return i === 0 ? carriedPose(format, t) : null;
  const k = easeOutCubic(clamp01((t - page.start) / page.slideIn));
  const e = ENTRY[format];
  const from: SheetPose =
    i === 0 ? stagingPose(format) : {centre: along(work.centre, e.dir, e.distance), scale: work.scale, rotation: layout.activeSheet.slideInRotation, lift: REST_LIFT + SLIDE_LIFT};
  return {
    centre: lerpPt(from.centre, work.centre, k),
    scale: lerp(from.scale, work.scale, k),
    rotation: lerp(from.rotation, work.rotation, k),
    lift: lerp(from.lift, work.lift, k),
  };
};

/** Page `i` leaving the work area for the stack over its slideOut window (and resting there after). */
export const leavingPose = (format: FormatName, i: number, t: number): SheetPose => {
  const page = PAGES[i];
  const work = workPose(format);
  const stack = stackPose(format, i);
  if (!page) return stack;
  const u = clamp01((t - page.slideOut.from) / (page.slideOut.to - page.slideOut.from));
  const k = easeInOutSine(u);
  return {
    centre: lerpPt(work.centre, stack.centre, k),
    scale: lerp(work.scale, stack.scale, k),
    rotation: lerp(work.rotation, stack.rotation, k),
    lift: lerp(work.lift, stack.lift, k) + LEAVE_LIFT * Math.sin(Math.PI * u),
  };
};

export type SheetState = {readonly index: number; readonly pose: SheetPose; readonly role: 'stack' | 'leaving' | 'work' | 'incoming'};

/** Every sheet on the desk at `t`, bottom to top: the stack (oldest first), the leaving page, the work page, the incoming page. */
export const sheetsAt = (format: FormatName, t: number): readonly SheetState[] => {
  const states = PAGES.map((page, i): SheetState | null => {
    if (t >= page.slideOut.from) {
      const role = t >= page.slideOut.to ? 'stack' : 'leaving';
      return {index: i, pose: leavingPose(format, i, t), role};
    }
    const pose = incomingPose(format, i, t);
    if (!pose) return null;
    return {index: i, pose, role: t >= page.start + page.slideIn ? 'work' : 'incoming'};
  });
  const order = {stack: 0, leaving: 1, work: 2, incoming: 3} as const;
  return states.filter((s): s is SheetState => s !== null).sort((a, b) => order[a.role] - order[b.role] || a.index - b.index);
};
