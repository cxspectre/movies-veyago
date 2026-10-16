// placement.ts — where a rig is in the world, and where its points land in the frame (pure).
// Lets scenes aim things at a device (the card flip's start and landing, 2D overlays warped onto a screen).
import {Euler, Matrix4, Quaternion, Vector3} from 'three';
import {cameraDistance, frameToWorld, type StageSize} from './stage/camera';
import type {Placement, Rotation} from './types';

const toRad = (deg: number): number => (deg * Math.PI) / 180;

export type RigPose = {placement: Placement; rotation?: Rotation; scale?: number};

/**
 * three.js Euler for a Rotation: yaw (y) first, then pitch (x), then roll (z). The film's yaw is the BIBLE's: POSITIVE
 * y turns the screen toward the viewer's LEFT (the right edge comes forward), so the pair's phone at -14° and Watch at
 * +12° both face inward. That is three.js's yaw negated. Pitch and roll are three.js's: negative x leans the top away.
 */
export const rigEuler = (r: Rotation | undefined): Euler => new Euler(toRad(r?.x ?? 0), -toRad(r?.y ?? 0), toRad(r?.z ?? 0), 'YXZ');

/** World position (px, y up) of a placement. */
export const rigPosition = (p: Placement, stage: StageSize): [number, number, number] => {
  const [x, y] = frameToWorld(p.x, p.y, stage);
  return [x, y, p.z ?? 0];
};

/** The rig's rotation as a quaternion. */
export const rigQuaternion = (r: Rotation | undefined): Quaternion => new Quaternion().setFromEuler(rigEuler(r));

/** Device units -> world px. */
export const rigMatrix = (pose: RigPose, stage: StageSize): Matrix4 => {
  const [x, y, z] = rigPosition(pose.placement, stage);
  const s = pose.placement.height * (pose.scale ?? 1);
  return new Matrix4().compose(new Vector3(x, y, z), rigQuaternion(pose.rotation), new Vector3(s, s, s));
};

/** A point in device units (y up) -> world px. */
export const localToWorld = (pose: RigPose, stage: StageSize, local: readonly [number, number, number?]): Vector3 =>
  new Vector3(local[0], local[1], local[2] ?? 0).applyMatrix4(rigMatrix(pose, stage));

/** A world point -> frame px (origin top-left, y down), through the stage camera. */
export const projectToFrame = (world: Vector3, stage: StageSize & {fov: number}): [number, number] => {
  const d = cameraDistance(stage.fov, stage.height);
  const k = d / Math.max(1e-6, d - world.z);
  return [stage.width / 2 + world.x * k, stage.height / 2 - world.y * k];
};

/**
 * CSS matrix3d that maps a w x h element (origin top-left) onto the quad (tl, tr, br, bl) in frame px: a planar
 * homography, exact for a flat screen in perspective. Use with `transform-origin: 0 0`.
 */
export const quadTransform = (w: number, h: number, quad: readonly [[number, number], [number, number], [number, number], [number, number]]): string => {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(det) < 1e-12) throw new Error('quadTransform: degenerate quad');
  const g = (sx * dy2 - dx2 * sy) / det;
  const hh = (dx1 * sy - sx * dy1) / det;
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + hh * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + hh * y3;
  // Unit square -> quad, then scale the element down to the unit square.
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, x0, y0, 0, 1];
  return `matrix3d(${m.map((v) => v.toFixed(10)).join(',')})`;
};
