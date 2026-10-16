// cardFlipMath.ts — the emergency card's flight from the phone's dock to the Watch face (BIBLE 5.7), as a pure
// function of time. World px (y up). The card starts as the dock's red button (a disc), grows into a 3:2 card while it
// lifts, turns 180° about its long axis over the whole 0.5 s, travels to the Watch and, past edge-on, reshapes into the
// Watch screen it lands on (phases in FLIGHT_PHASES).
import {Quaternion, Vector3} from 'three';
import {ease} from '../../glass/motion';
import type {EasingName} from '../../beats';
import {PHONE, DOCK_EMERGENCY_PT, screenPointToLocal} from '../phone/phoneSpec';
import {localToWorld, rigQuaternion, type RigPose} from '../placement';
import type {StageSize} from '../stage/camera';
import {WATCH} from '../watch/watchSpec';
import {FLIP_CARD} from './passSpec';

export type CardEnd = {position: Vector3; rotation: Quaternion; width: number; height: number; radius: number};
export type CardState = {
  visible: boolean;
  position: Vector3;
  rotation: Quaternion;
  width: number;
  height: number;
  radius: number;
  /** 0 = the flat red of the button, 1 = the card's art. */
  frontArt: number;
  /** Eased 0..1 progress of the travel to the Watch. */
  progress: number;
};

/** Lifts the start point off the glass so the card never cuts into it. */
const GLASS_CLEARANCE_PX = 1.5;

/** The dock's first circle on a phone pose: the card's start. */
export const cardFromPhone = (phone: RigPose, stage: StageSize): CardEnd => {
  const [lx, ly] = screenPointToLocal(DOCK_EMERGENCY_PT.x, DOCK_EMERGENCY_PT.y);
  const h = phone.placement.height * (phone.scale ?? 1);
  const position = localToWorld(phone, stage, [lx, ly, PHONE.depth / 2 + GLASS_CLEARANCE_PX / h]);
  const diameter = (DOCK_EMERGENCY_PT.diameter / 402) * PHONE.screen.width * h;
  return {position, rotation: rigQuaternion(phone.rotation), width: diameter, height: diameter, radius: diameter / 2};
};

/** The Watch screen on a watch pose: where the card lands. */
export const cardToWatch = (watch: RigPose, stage: StageSize): CardEnd => {
  const h = watch.placement.height * (watch.scale ?? 1);
  const position = localToWorld(watch, stage, [0, WATCH.screen.centreY, WATCH.depth / 2 + GLASS_CLEARANCE_PX / h]);
  return {position, rotation: rigQuaternion(watch.rotation), width: WATCH.screen.width * h, height: WATCH.screen.height * h, radius: WATCH.screen.radius * h};
};

/** The card's full size in flight, from the phone's height in px. */
export const flightCardSize = (phoneHeightPx: number): {width: number; height: number; radius: number} => {
  const width = PHONE.outline.width * phoneHeightPx * FLIP_CARD.widthOfPhone;
  const height = width / FLIP_CARD.aspect;
  return {width, height, radius: height * FLIP_CARD.radiusOfHeight};
};

const mix = (a: number, b: number, t: number): number => a + (b - a) * t;
const smooth = (t: number): number => {
  const k = Math.max(0, Math.min(1, t));
  return k * k * (3 - 2 * k);
};

/**
 * The flight's phases, as fractions of its duration (0.5 s = 15 frames at 30 fps):
 * - the disc grows into the full 3:2 card while it lifts off the dock (0 -> GROWN, frames 0-4);
 * - the card turns 180° about its long axis over the whole flight, eased in-out about edge-on at 0.5 (frame 7.5), so
 *   its front faces the viewer nearly square for the first frames (it reads as the red card) and its back (the Watch
 *   screen) for the last ones; a constant rate would show it foreshortened almost the whole time;
 * - it travels to the Watch face over TRAVEL (keynote-like in-out, so it is held in front of the phone first and seats
 *   softly at the end);
 * - past edge-on it reshapes into the Watch screen it lands on (RESHAPE).
 */
export const FLIGHT_PHASES = {grown: 0.27, travel: {from: 0.2, to: 1}, reshape: {from: 0.55, to: 1}, art: 0.2, turnEasing: 'easeInOutCubic' as EasingName} as const;

const phase = (u: number, w: {from: number; to: number}): number => (u - w.from) / (w.to - w.from);

export type FlightSpec = {
  from: CardEnd;
  to: CardEnd;
  /** The card's size at full grow (see flightCardSize). */
  card: {width: number; height: number; radius: number};
  duration?: number;
  /** The easing of the travel to the Watch (default easeInOutCubic: held over the phone, then a soft seat). */
  easing?: EasingName;
  /** Px toward the camera while the card is held over the phone (default 55% of the card width). */
  lift?: number;
};

/** The card at `t` seconds after the hit. Invisible before 0 and from the landing on (the Watch shows its screen). */
export const cardFlight = (spec: FlightSpec, t: number): CardState => {
  const duration = spec.duration ?? FLIP_CARD.durationSeconds;
  const u = Math.max(0, Math.min(1, t / duration));
  const visible = t >= 0 && t < duration;
  const grow = smooth(u / FLIGHT_PHASES.grown);
  const land = smooth(phase(u, FLIGHT_PHASES.reshape));
  const travel = ease(spec.easing ?? 'easeInOutCubic', phase(u, FLIGHT_PHASES.travel));
  const grown = {w: mix(spec.from.width, spec.card.width, grow), h: mix(spec.from.height, spec.card.height, grow), r: mix(spec.from.radius, spec.card.radius, grow)};
  const size = {w: mix(grown.w, spec.to.width, land), h: mix(grown.h, spec.to.height, land), r: mix(grown.r, spec.to.radius, land)};
  const lift = (spec.lift ?? spec.card.width * FLIP_CARD.liftOfWidth) * grow * (1 - travel);
  const position = spec.from.position.clone().lerp(spec.to.position, travel).add(new Vector3(0, 0, lift));
  const flip = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI * ease(FLIGHT_PHASES.turnEasing, u));
  const rotation = spec.from.rotation.clone().slerp(spec.to.rotation, travel).multiply(flip);
  return {visible, position, rotation, width: size.w, height: size.h, radius: size.r, frontArt: smooth(u / FLIGHT_PHASES.art), progress: travel};
};
