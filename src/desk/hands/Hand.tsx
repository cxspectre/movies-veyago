// Hand.tsx — a posed hand for scene owners: name a pose, a pair, where its anchor goes, and (optionally) a presence
// 0-1 with the edge it enters from. Honours HANDS_MODE: in 'shadows' mode only the cast shadow of the hand is drawn.
import React from 'react';
import {type FrameEdge, presenceOffset} from './presence';
import {HandDrawing, type HandPlacement} from './HandDrawing';
import {HANDS_MODE, type HandsMode} from './mode';
import {type HandPose, type PoseName, POSES} from './poses';
import type {Pt} from './geometry';

export type HandPair = 'A' | 'B';

/**
 * Pair A is the author (draws, right-handed); pair B the assistant, a touch smaller. The poses are authored at
 * life size in mm; the film draws them smaller than life against the A3 sheet (a stylised hand, and the pencil at
 * full size reads longer in it).
 */
export const PAIR_SIZE: Record<HandPair, number> = {A: 0.85, B: 0.78};

export type HandProps = Omit<HandPlacement, 'size'> & {
  readonly pose: PoseName | HandPose;
  readonly pair?: HandPair;
  /** 0 = fully off frame, 1 = in place (from `presenceAt`). Default 1. */
  readonly presence?: number;
  /** Which frame edge it comes from when presence < 1. Default: along its own forearm. */
  readonly enterFrom?: FrameEdge | Pt;
  /** How far off frame it sits at presence 0, px. */
  readonly travel?: number;
  readonly mode?: HandsMode;
  readonly held?: React.ReactNode;
  readonly style?: React.CSSProperties;
};

const DEFAULT_TRAVEL = 900;

export const resolvePose = (pose: PoseName | HandPose): HandPose => (typeof pose === 'string' ? POSES[pose] : pose);

/** Direction along the forearm in parent px for a placement (so an absent `enterFrom` slides the hand along its arm). */
const forearmEdge = (placement: HandPlacement, pose: HandPose): Pt => {
  const rot = ((placement.rotation ?? 0) * Math.PI) / 180;
  const mirror = placement.handed === 'left' ? -1 : 1;
  const f = pose.forearm;
  return {x: f.x * mirror * Math.cos(rot) - f.y * Math.sin(rot), y: f.x * mirror * Math.sin(rot) + f.y * Math.cos(rot)};
};

export const Hand: React.FC<HandProps> = ({pose, pair = 'A', presence = 1, enterFrom, travel = DEFAULT_TRAVEL, mode = HANDS_MODE, held, style, ...placement}) => {
  const resolved = resolvePose(pose);
  if (presence <= 0) return null;
  const slide = presenceOffset(presence, travel, enterFrom ?? forearmEdge(placement, resolved));
  const placed: HandPlacement = {...placement, x: placement.x + slide.x, y: placement.y + slide.y, size: PAIR_SIZE[pair]};
  return <HandDrawing pose={resolved} {...placed} held={held} shadowOnly={mode === 'shadows'} style={style} />;
};
