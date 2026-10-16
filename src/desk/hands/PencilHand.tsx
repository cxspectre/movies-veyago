// PencilHand.tsx — pair A's drawing hand attached to the pencil tip. Give it the engine's PencilState (and, for the
// damped motion, the spec + frame so it can look a few frames back), and it draws the grip pose holding the pencil
// at the tip, lifting between strokes, resting 12 px up on a hold. Coordinates are sketch px: place it inside the
// same transform as the PaperSheet.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {PencilState, SketchSpec} from '../../paper';
import {type ShadowEntry, SKETCH_PX_PER_MM} from '../palette';
import {Pencil} from '../props/Pencil';
import {type PencilKind, PENCIL_GEOMETRY} from '../props/pencilArt';
import {type FollowOptions, followPencil, type PencilRig, staticRig} from './follow';
import {Hand, type HandPair, PAIR_SIZE} from './Hand';
import {HANDS_MODE, type HandsMode} from './mode';
import {type PoseName, POSES} from './poses';

export type PencilHandProps = {
  /** The engine's state for this frame (`getPencilState(spec, frame, drawFrames)`). */
  readonly state?: PencilState;
  /** With these, the hand's motion is damped over the previous frames (recommended). */
  readonly spec?: SketchSpec;
  readonly drawFrames?: number;
  readonly frame?: number;
  /** Or drive it directly. */
  readonly rig?: PencilRig;
  readonly kind?: PencilKind;
  readonly pose?: Extract<PoseName, 'grip' | 'lower'>;
  readonly pair?: HandPair;
  readonly presence?: number;
  readonly follow?: FollowOptions;
  readonly mode?: HandsMode;
  readonly pxPerMm?: number;
  readonly style?: React.CSSProperties;
};

const RAD = Math.PI / 180;
const DEFAULT_SEAM_MM = 10;
/** The back of the pencil lies on the hand: a tight, light shadow onto the skin (not the table's). */
const SHADOW_ON_HAND: ShadowEntry = {x: 4, y: 5, blur: 8, opacity: 0.22, color: '#3A3020'};

/**
 * Where the pencil's two drawn pieces meet, mm along its axis from the tip: a point hidden under both finger caps
 * (`seamMm` behind the pinch in the hand's frame, which the pair's size scales and the tilt foreshortens).
 */
export const pencilSeamMm = (pinchMm: number, tiltDeg: number, seamMm: number, size: number): number => pinchMm + (seamMm * size) / Math.max(0.2, Math.cos(tiltDeg * RAD));

export const PencilHand: React.FC<PencilHandProps> = ({state, spec, drawFrames, frame, rig, kind = 'graphite', pose = 'grip', pair = 'A', presence = 1, follow, mode, pxPerMm = SKETCH_PX_PER_MM, style}) => {
  const current = useCurrentFrame();
  const f = frame ?? current;
  const geometry = PENCIL_GEOMETRY[kind];
  const held = POSES[pose].pencil;
  const options: FollowOptions = {pinchMm: geometry.pinch, pxPerMm, ...(held ? {tiltDeg: held.tiltDeg} : {}), ...follow};
  const resolved: PencilRig =
    rig ??
    (spec && drawFrames !== undefined
      ? followPencil(spec, f, drawFrames, options)
      : staticRig({x: state?.x ?? 0, y: state?.y ?? 0}, state && !state.drawing ? state.lift * 6 : 0, options));
  const tilt = options.tiltDeg ?? held?.tiltDeg ?? 45;
  const seam = pencilSeamMm(geometry.pinch, tilt, held?.seamMm ?? DEFAULT_SEAM_MM, PAIR_SIZE[pair]);
  // With no hand drawn (the shadows fallback) there is nothing for the back of the pencil to lie on.
  const onHand = (mode ?? HANDS_MODE) === 'illustrated';
  const tipPiece = <Pencil kind={kind} x={resolved.tip.x} y={resolved.tip.y} yaw={resolved.yaw} tilt={tilt} pxPerMm={pxPerMm} hover={resolved.hover} shadow="held" clip={[0, seam]} />;
  const backPiece = (
    <Pencil kind={kind} x={resolved.tip.x} y={resolved.tip.y} yaw={resolved.yaw} tilt={tilt} pxPerMm={pxPerMm} hover={0} shadow={onHand ? 'lying' : 'none'} shadowEntry={SHADOW_ON_HAND} clip={[seam, geometry.length]} />
  );
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, ...style}}>
      {tipPiece}
      <Hand pose={pose} pair={pair} x={resolved.pinch.x} y={resolved.pinch.y} anchor="pinch" rotation={resolved.rotation} pxPerMm={pxPerMm} lift={resolved.hover} presence={presence} mode={mode} held={backPiece} />
    </div>
  );
};
