// noteMotion.ts — pure state of the sticky note and pair B's hands around it: the carry in (note and hand
// together), the press, the smoothing sweep, the pen's arrival and exit. Sheet px; module-local seconds in.
import {interpolate} from 'remotion';
import {sec, FPS} from '../../film';
import {presenceAt, presenceOffset, type DeskPoint} from '../../desk';
import {stickyState, type StickyState, type StickyTiming} from '../../paper';
import {easingOf} from './easing';
import {frameInSheet, travelToLeave, unit} from './frameGeometry';
import type {ColdOpenLayout} from './layout';
import {NOTE, PEN} from './timing';

/** Pair B comes from the right edge (wide) / the top-right corner (tall), BIBLE 2.11. */
export const PAIR_B_DIR = {wide: unit({x: 1, y: 0.08}), tall: unit({x: 1, y: -0.75})} as const;
/** Clearance past the frame edge for the note (half its diagonal) and the hand trailing it, sheet px. */
const CARRY_MARGIN_PER_SIZE = 0.75;

export const stickyTiming: StickyTiming = {
  pressAt: sec(NOTE.pressAt),
  approachFrames: sec(NOTE.carry.to - NOTE.carry.from),
  smoothAt: sec(NOTE.smooth.from),
  smoothFrames: sec(NOTE.smooth.to - NOTE.smooth.from),
};

export const noteState = (t: number): StickyState => stickyState(t * FPS, stickyTiming);

/** How far the hand has to carry the note in from (sheet px along PAIR_B_DIR). */
const carryTravel = (L: ColdOpenLayout): number =>
  travelToLeave(L.note.centre, PAIR_B_DIR[L.format], frameInSheet(L), L.note.size * CARRY_MARGIN_PER_SIZE);

/** The note's (and the carrying hand's) offset from the note's resting place. */
export const carryOffset = (t: number, L: ColdOpenLayout): DeskPoint => {
  const k = interpolate(t, [NOTE.carry.from, NOTE.carry.to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easingOf('easeOutCubic')});
  return presenceOffset(k, carryTravel(L), PAIR_B_DIR[L.format]);
};

/** Where the smoothing hand's pad is on the note (note px): on the adhesive strip, then sweeping to the bottom. */
const STRIP = 0.12;
const SWEEP_END = 0.86;
export const smoothPad = (t: number, size: number): DeskPoint => {
  const s = noteState(t);
  const sweep = t >= NOTE.smooth.to ? 1 : (s.sweep ?? 0);
  return {x: size * 0.5, y: size * (STRIP + sweep * (SWEEP_END - STRIP))};
};

/** 0-1: the smoothing hand leaving after the chord. */
export const smoothHandPresence = (t: number): number => presenceAt(t, {exit: PEN.smoothOut, easeOut: 'easeInOutSine'});

/** 0-1: the pen hand coming in for penCap and leaving after the last word. */
export const penPresence = (t: number): number => presenceAt(t, {enter: PEN.in, exit: PEN.out, easeIn: 'easeOutCubic'});

/** How far the pen hand travels to be off frame from the note (sheet px). */
export const penTravel = (L: ColdOpenLayout): number => carryTravel(L);
