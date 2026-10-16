// ReachingPencilHand.tsx — the kit's PencilHand (pair A holding the pencil at its tip) with the whole arm behind it,
// for the wide framings of the wall and back-to-desk where the camera sees past the wrist. Same rig, same pencil
// pieces, same hand; only the forearm stops at the elbow and armReach carries it on out of the frame.
import React from 'react';
import {followPencil, type FollowOptions, type HandPair, PAIR_SIZE, Pencil, PENCIL_GEOMETRY, type PencilRig, POSES, type ShadowEntry, SKETCH_PX_PER_MM} from '../../desk';
import type {SketchSpec} from '../../paper';
import {pencilSeamMm} from '../../desk/hands/PencilHand';
import type {ArmReach} from './armReach';
import {ReachingHand} from './ReachingArm';

export type ReachingPencilHandProps = {
  readonly reach: ArmReach;
  /** Either the engine drives it (spec + drawFrames + frame, damped) or the rig is given. */
  readonly spec?: SketchSpec;
  readonly drawFrames?: number;
  readonly frame?: number;
  readonly rig?: PencilRig;
  readonly pose?: 'grip' | 'lower';
  readonly pair?: HandPair;
  readonly follow?: FollowOptions;
};

const DEFAULT_SEAM_MM = 10;
const DEFAULT_TILT_DEG = 45;
/** The back of the pencil lies on the hand: a tight, light shadow onto the skin (the kit's value). */
const SHADOW_ON_HAND: ShadowEntry = {x: 4, y: 5, blur: 8, opacity: 0.22, color: '#3A3020'};

const rigOf = (p: ReachingPencilHandProps, options: FollowOptions): PencilRig => {
  if (p.rig) return p.rig;
  if (!p.spec || p.drawFrames === undefined || p.frame === undefined) throw new Error('ReachingPencilHand: give a rig, or spec + drawFrames + frame');
  return followPencil(p.spec, p.frame, p.drawFrames, options);
};

export const ReachingPencilHand: React.FC<ReachingPencilHandProps> = (p) => {
  const pose = p.pose ?? 'grip';
  const pair = p.pair ?? 'A';
  const geometry = PENCIL_GEOMETRY.graphite;
  const held = POSES[pose].pencil;
  const options: FollowOptions = {pinchMm: geometry.pinch, pxPerMm: SKETCH_PX_PER_MM, ...(held ? {tiltDeg: held.tiltDeg} : {}), ...p.follow};
  const rig = rigOf(p, options);
  const tilt = options.tiltDeg ?? held?.tiltDeg ?? DEFAULT_TILT_DEG;
  const seam = pencilSeamMm(geometry.pinch, tilt, held?.seamMm ?? DEFAULT_SEAM_MM, PAIR_SIZE[pair]);
  const back = <Pencil kind="graphite" x={rig.tip.x} y={rig.tip.y} yaw={rig.yaw} tilt={tilt} pxPerMm={SKETCH_PX_PER_MM} hover={0} shadow="lying" shadowEntry={SHADOW_ON_HAND} clip={[seam, geometry.length]} />;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0}}>
      <Pencil kind="graphite" x={rig.tip.x} y={rig.tip.y} yaw={rig.yaw} tilt={tilt} pxPerMm={SKETCH_PX_PER_MM} hover={rig.hover} shadow="held" clip={[0, seam]} />
      <ReachingHand reach={p.reach} pose={pose} pair={pair} x={rig.pinch.x} y={rig.pinch.y} anchor="pinch" rotation={rig.rotation} pxPerMm={SKETCH_PX_PER_MM} lift={rig.hover} held={back} />
    </div>
  );
};
