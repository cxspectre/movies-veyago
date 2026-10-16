// flight.ts — one trip of a laying hand, frame by frame (pure): where the carried sheet is, how high, how turned,
// and where the hand is. The sheet enters from just beyond the frame edge (measured against the camera at that
// moment, so it never pops in), lands at `landsAt`, and the hand lets go and withdraws along its arm.
import {Easing} from 'remotion';
import type {FormatName} from '../../film';
import type {DeskPoint} from '../../desk';
import {ease} from '../../glass';
import {visibleDeskRect, wallCamera} from './camera';
import {CARRY_HEIGHT, CARRY_SECONDS, CARRY_TURN, COAST_SECONDS, LET_GO_SECONDS, WITHDRAW_SECONDS, type DropPlan, type HandId} from './drops';
import {slotOfTile, TILE_ROTATION, tileScale} from './grid';

export type SheetFlight = {
  /** Has the sheet appeared at all yet (from the start of its carry). */
  readonly visible: boolean;
  readonly landed: boolean;
  readonly centre: DeskPoint;
  readonly rotation: number;
  /** Height above the desk, px (0 = resting). */
  readonly height: number;
};

export type HandFlight = {
  readonly visible: boolean;
  /** Where the hand's fingertips are, desk px. */
  readonly fingertips: DeskPoint;
  /** Hand rotation (0 = fingers up the screen, clockwise positive). */
  readonly rotation: number;
  readonly handed: 'left' | 'right';
  readonly pair: 'A' | 'B';
  readonly lift: number;
};

const norm = (x: number, y: number): DeskPoint => {
  const l = Math.hypot(x, y) || 1;
  return {x: x / l, y: y / l};
};

/** The direction each hand comes from (toward its frame edge) and the side of the sheet it holds. */
type HandRig = {readonly from: DeskPoint; readonly side: DeskPoint; readonly rotation: number};
const HAND_RIGS: Record<FormatName, Record<HandId, HandRig>> = {
  wide: {
    'A-right': {from: norm(0.16, 1), side: {x: 1, y: 0}, rotation: -8},
    'A-left': {from: norm(-0.16, 1), side: {x: -1, y: 0}, rotation: 8},
    'B-right': {from: norm(1, -0.12), side: {x: 0, y: -1}, rotation: -86},
    'B-left': {from: norm(1, 0.12), side: {x: 0, y: 1}, rotation: -94},
  },
  tall: {
    'A-right': {from: norm(0.16, 1), side: {x: 1, y: 0}, rotation: -8},
    'A-left': {from: norm(-0.16, 1), side: {x: -1, y: 0}, rotation: 8},
    'B-right': {from: norm(1, -1.15), side: norm(-1, -0.87), rotation: -138},
    'B-left': {from: norm(1, -0.87), side: norm(1, 1.15), rotation: -132},
  },
};

/** Fingertips sit this far from the sheet centre toward the hand's edge, and to its side (sketch px). */
const GRIP_INWARD = 60;
const GRIP_SIDE = 70;
/** A sheet is out of frame once its centre is this far beyond the edge (half-diagonal of a tile plus margin). */
const OFF_FRAME_MARGIN = 240;
/** The hand lifts as it withdraws (px). */
const WITHDRAW_LIFT = 22;
/** Lifting off the landed sheet, the hand is still this high above it while carrying (px). */
const HAND_ON_SHEET = 2;

const easeInCubic = Easing.bezier(0.32, 0, 0.67, 0);
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/** How far along `dir` from `p` until a sheet there is beyond the visible frame at second `t`. */
const offFrameDistance = (format: FormatName, t: number, p: DeskPoint, dir: DeskPoint): number => {
  const v = visibleDeskRect(format, wallCamera(format, t));
  const candidates = [
    dir.x > 1e-3 ? (v.x1 - p.x + OFF_FRAME_MARGIN) / dir.x : Infinity,
    dir.x < -1e-3 ? (p.x - v.x0 + OFF_FRAME_MARGIN) / -dir.x : Infinity,
    dir.y > 1e-3 ? (v.y1 - p.y + OFF_FRAME_MARGIN) / dir.y : Infinity,
    dir.y < -1e-3 ? (p.y - v.y0 + OFF_FRAME_MARGIN) / -dir.y : Infinity,
  ];
  return Math.max(OFF_FRAME_MARGIN, Math.min(...candidates));
};

const along = (p: DeskPoint, dir: DeskPoint, d: number): DeskPoint => ({x: p.x + dir.x * d, y: p.y + dir.y * d});

/** How far inside the frame edge a hand pushes a sheet before letting it glide on (desk px). */
const REACH_IN = 300;
/** After letting go the hand coasts on this far, then withdraws. */
const COAST_PX = 26;
const BISECT_STEPS = 24;

/** The time fraction at which the keynote ease reaches `k` (pure bisection; the ease is monotonic). */
const inverseKeynote = (k: number): number => {
  const step = (lo: number, hi: number, n: number): number => {
    const mid = (lo + hi) / 2;
    if (n === 0) return mid;
    return ease('keynote', mid) < k ? step(mid, hi, n - 1) : step(lo, mid, n - 1);
  };
  return step(0, 1, BISECT_STEPS);
};

type Trip = {
  readonly start: number;
  readonly distance: number;
  /** When the hand lets the sheet go (it glides the rest of the way and settles at `landsAt`). */
  readonly release: number;
  readonly dir: DeskPoint;
};

/** The trip's geometry, measured against the camera when the carry starts. */
const tripOf = (format: FormatName, drop: DropPlan): Trip => {
  const slot = slotOfTile(format, drop.tile);
  const dir = HAND_RIGS[format][drop.hand].from;
  const start = drop.landsAt - CARRY_SECONDS;
  const distance = offFrameDistance(format, start, slot.centre, dir);
  const edge = Math.max(0, distance - OFF_FRAME_MARGIN);
  const glide = Math.max(0, edge - REACH_IN);
  const release = glide <= 0 ? drop.landsAt + LET_GO_SECONDS : start + CARRY_SECONDS * inverseKeynote(1 - glide / distance);
  return {start, distance, release, dir};
};

export const sheetFlight = (format: FormatName, drop: DropPlan, t: number): SheetFlight => {
  const slot = slotOfTile(format, drop.tile);
  const rest = TILE_ROTATION[drop.tile];
  const trip = tripOf(format, drop);
  if (t >= drop.landsAt) return {visible: true, landed: true, centre: slot.centre, rotation: rest, height: 0};
  const k = ease('keynote', (t - trip.start) / CARRY_SECONDS);
  const turn = drop.hand.startsWith('A') ? CARRY_TURN : -CARRY_TURN;
  return {
    visible: t >= trip.start,
    landed: false,
    centre: along(slot.centre, trip.dir, trip.distance * (1 - k)),
    rotation: rest + turn * (1 - k),
    // It rides a thin cushion of air and settles as it lands.
    height: CARRY_HEIGHT * (1 - k) ** 0.8,
  };
};

export const handFlight = (format: FormatName, drop: DropPlan, t: number): HandFlight => {
  const rig = HAND_RIGS[format][drop.hand];
  const trip = tripOf(format, drop);
  const s = tileScale(format);
  const grip = {x: (rig.from.x * GRIP_INWARD + rig.side.x * GRIP_SIDE) * s, y: (rig.from.y * GRIP_INWARD + rig.side.y * GRIP_SIDE) * s};
  const at = (time: number): DeskPoint => {
    const sheet = sheetFlight(format, drop, time);
    return {x: sheet.centre.x + grip.x, y: sheet.centre.y + grip.y};
  };
  const base = {rotation: rig.rotation, handed: drop.hand.endsWith('left') ? ('left' as const) : ('right' as const), pair: drop.hand.startsWith('A') ? ('A' as const) : ('B' as const)};
  const coastTo = trip.release + COAST_SECONDS;
  const withdrawTo = coastTo + WITHDRAW_SECONDS;
  if (t < trip.start || t >= withdrawTo) return {...base, visible: false, fingertips: at(trip.start), lift: 0};
  if (t < trip.release) return {...base, visible: true, fingertips: at(t), lift: sheetFlight(format, drop, t).height + HAND_ON_SHEET};
  const letGo = at(trip.release);
  const coastK = ease('easeOutCubic', (t - trip.release) / COAST_SECONDS);
  const coasted = along(letGo, rig.from, -COAST_PX * coastK);
  if (t < coastTo) return {...base, visible: true, fingertips: coasted, lift: HAND_ON_SHEET + WITHDRAW_LIFT * 0.2 * coastK};
  const k = easeInCubic(clamp01((t - coastTo) / WITHDRAW_SECONDS));
  const distance = offFrameDistance(format, withdrawTo, coasted, rig.from);
  return {...base, visible: true, fingertips: along(coasted, rig.from, distance * k), lift: HAND_ON_SHEET + WITHDRAW_LIFT * (0.2 + 0.8 * k)};
};
