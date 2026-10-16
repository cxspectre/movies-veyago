// HandA.tsx — pair A, the author: draws the V1 sheet with the graphite pencil (following the engine's pencil),
// reaches off frame for the accent pencil, ticks the five items, stops at 20.0 resting 12 px above the paper, and
// slides out over coldOpen.handAOut. Sheet px (render inside the V1 sheet's SheetAt).
import React from 'react';
import {interpolate} from 'remotion';
import {coldOpen} from '../../beats';
import {FPS} from '../../film';
import {followPencil, PencilHand, presenceAt, presenceOffset, staticRig, type PencilKind, type PencilRig} from '../../desk';
import {spec as v1Spec} from '../../sketches/v1-home';
import type {DeskPoint} from '../../desk';
import {easingOf} from './easing';
import {frameInSheet, travelToLeave, unit} from './frameGeometry';
import type {ColdOpenLayout} from './layout';
import {BODY_END_FRAME, SWAP, SWAP_IN_SECONDS, SWAP_OUT_SECONDS, V1_DRAW_FRAMES, v1PageFrame} from './timing';

/** Pair A leaves (and re-enters) down and a little right, along its own forearm toward the bottom edge. */
const EXIT_DIR: DeskPoint = unit({x: 0.32, y: 1});
/** Clearance past the frame edge before the hand counts as gone (it trails its pencil tip). */
const OFF_FRAME_MARGIN = 70;
/** Height the pencil is carried at while reaching (sheet px). */
const REACH_HOVER = 14;
/**
 * After the last tick the hand drifts back from the drawing to rest in the lower-left margin (pencil tip down,
 * 12 px up, BIBLE 2.7), clear of where pair B sets the cup; it is still from coldOpen.pencilStops.
 */
const REST: Record<ColdOpenLayout['format'], {readonly tip: DeskPoint; readonly yaw: number}> = {
  wide: {tip: {x: 430, y: 660}, yaw: 52},
  // The tall frame's cup sits at its lower-right edge: the hand rests further left, its arm running more downward.
  tall: {tip: {x: 372, y: 640}, yaw: 72},
};
const REST_HOVER = 12;
const REST_MOVE_SECONDS = 0.6;
const REST_FROM = coldOpen.pencilStops - REST_MOVE_SECONDS;

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const lerpPt = (a: DeskPoint, b: DeskPoint, k: number): DeskPoint => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)});
const lerpRig = (a: PencilRig, b: PencilRig, k: number): PencilRig => ({
  ...b,
  tip: lerpPt(a.tip, b.tip, k),
  pinch: lerpPt(a.pinch, b.pinch, k),
  yaw: lerp(a.yaw, b.yaw, k),
  rotation: lerp(a.rotation, b.rotation, k),
  hover: lerp(a.hover, b.hover, k),
});

/** The hand moving from the finished page to its rest (and resting). */
const restRig = (t: number, L: ColdOpenLayout): PencilRig => {
  const from = followPencil(v1Spec, v1PageFrame(REST_FROM), V1_DRAW_FRAMES);
  const rest = REST[L.format];
  const to = staticRig(rest.tip, REST_HOVER, {yawBase: rest.yaw});
  const k = interpolate(t, [REST_FROM, coldOpen.pencilStops], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easingOf('easeInOutSine')});
  // The tip rises a little more mid-move than at either end: a lift, not a slide.
  const arc = Math.sin(Math.PI * k) * REST_HOVER;
  return {...lerpRig(from, to, k), hover: lerp(from.hover, to.hover, k) + arc};
};

type Phase =
  | {kind: 'follow'; pencil: PencilKind; frame: number; offset: DeskPoint}
  | {kind: 'rig'; pencil: PencilKind; rig: PencilRig; offset: DeskPoint}
  | {kind: 'away'};

const shift = (k: number, travel: number): DeskPoint => {
  const o = presenceOffset(k, travel, EXIT_DIR);
  return {x: o.x, y: o.y};
};

const tipAt = (frame: number): DeskPoint => {
  const r = followPencil(v1Spec, frame, V1_DRAW_FRAMES);
  return r.tip;
};

/** Pure: which pencil, which rig and how far off its place the hand is at module second t. */
export const handAPhase = (t: number, L: ColdOpenLayout): Phase => {
  const rect = frameInSheet(L);
  const leave = (frame: number): number => travelToLeave(tipAt(frame), EXIT_DIR, rect, OFF_FRAME_MARGIN);
  const outEnd = SWAP.from + SWAP_OUT_SECONDS;
  const inStart = SWAP.to - SWAP_IN_SECONDS;
  if (t >= SWAP.from && t < outEnd) {
    const k = interpolate(t, [SWAP.from, outEnd], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easingOf('easeInOutCubic')});
    const rig = followPencil(v1Spec, BODY_END_FRAME, V1_DRAW_FRAMES);
    return {kind: 'rig', pencil: 'graphite', rig: {...rig, hover: REACH_HOVER * (1 - k)}, offset: shift(k, leave(BODY_END_FRAME))};
  }
  if (t >= outEnd && t < inStart) return {kind: 'away'};
  if (t >= inStart && t < SWAP.to) {
    const tickFrame = v1PageFrame(SWAP.to);
    const k = interpolate(t, [inStart, SWAP.to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easingOf('easeOutCubic')});
    const rig = followPencil(v1Spec, tickFrame, V1_DRAW_FRAMES);
    return {kind: 'rig', pencil: 'accent', rig: {...rig, hover: REACH_HOVER * (1 - k)}, offset: shift(k, leave(tickFrame))};
  }
  if (t >= REST_FROM) {
    const rig = restRig(t, L);
    const k = presenceAt(t, {exit: coldOpen.handAOut});
    const away = travelToLeave(rig.tip, EXIT_DIR, rect, OFF_FRAME_MARGIN);
    return {kind: 'rig', pencil: 'accent', rig, offset: k < 1 ? shift(k, away) : {x: 0, y: 0}};
  }
  const frame = v1PageFrame(t);
  const pencil: PencilKind = t < SWAP.from ? 'graphite' : 'accent';
  return {kind: 'follow', pencil, frame, offset: {x: 0, y: 0}};
};

export const HandA: React.FC<{t: number; layout: ColdOpenLayout}> = ({t, layout}) => {
  if (t < coldOpen.v1.sequenceFrom / FPS || t >= coldOpen.handAOut.to) return null;
  const phase = handAPhase(t, layout);
  if (phase.kind === 'away') return null;
  const style: React.CSSProperties = {transform: `translate(${phase.offset.x.toFixed(2)}px, ${phase.offset.y.toFixed(2)}px)`};
  return phase.kind === 'rig' ? (
    <PencilHand rig={phase.rig} kind={phase.pencil} style={style} />
  ) : (
    <PencilHand spec={v1Spec} drawFrames={V1_DRAW_FRAMES} frame={phase.frame} kind={phase.pencil} style={style} />
  );
};
