// ReachingArm.tsx — draws armGeometry in the kit's own hand style (BIBLE §2.7): the cast shadow under the hand, and
// the arm itself over it: flat tone #E9C9A8, the 2.2 px contour (heavier on the side away from the lamp) on its long
// edges only, one feathered shade band on the away side. Plus ReachingHand: a kit Hand with the whole arm behind it.
import React, {useMemo} from 'react';
import {blurDeviation, DESK_PALETTE, Hand, type HandPair, type HandPose, type HandProps, liftedShadow, PAIR_SIZE, resolvePose, SHADOW_DIR, SHADOWS, shadowRgba} from '../../desk';
import type {HandPlacement} from '../../desk';
import {polyPath, shadeBands} from '../../desk/hands/geometry';
import {armGeometry, type ArmGeometry, type ArmReach, KIT_FOREARM_MM} from './armReach';

/** The kit's contour (HandDrawing): 2.2 px, the lit part of a stroke under the fill, a second pass shifted away from the lamp. */
const CONTOUR = 2.2;
const CONTOUR_LIT_FRACTION = 0.72;
const CONTOUR_SHIFT = {x: 0.9, y: 1.1} as const;
/** The kit's forearm shade band. */
const ARM_BAND = {depth: 0.22, gamma: 1.2, from: 0.001, tip: false} as const;
const SHADE_FEATHER = 2.2;

const layer: React.CSSProperties = {position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'};

export type ArmLayerProps = {readonly arm: ArmGeometry; readonly lift?: number};

/** The arm's cast shadow (drawn under the hand, so it never darkens the kit's own forearm). */
export const ArmShadow: React.FC<ArmLayerProps> = ({arm, lift = 0}) => {
  const s = liftedShadow(SHADOWS.hands, {height: lift});
  return (
    <svg width={1} height={1} style={layer}>
      <g style={{filter: `blur(${blurDeviation(s.blur)}px)`, opacity: s.opacity}} transform={`translate(${s.x.toFixed(2)} ${s.y.toFixed(2)})`}>
        <path d={polyPath(arm.shadowPolygon, true)} fill={shadowRgba(s.color, 1)} />
      </g>
    </svg>
  );
};

/** The arm itself (drawn over the hand's forearm end, which it hides). */
export const ArmBody: React.FC<ArmLayerProps> = ({arm}) => {
  const H = DESK_PALETTE.hand;
  const edges = useMemo(() => [polyPath(arm.out.left), polyPath(arm.out.right)], [arm]);
  const bands = useMemo(() => shadeBands(arm.rib, arm.out, {x: SHADOW_DIR.x, y: SHADOW_DIR.y}, ARM_BAND), [arm]);
  const width = CONTOUR * 2 * CONTOUR_LIT_FRACTION;
  const strokes = (key: string): React.ReactNode =>
    edges.map((d, i) => <path key={`${key}${i}`} d={d} fill="none" stroke={H.line} strokeWidth={width} strokeLinejoin="round" strokeLinecap="round" />);
  return (
    <svg width={1} height={1} style={layer}>
      <g opacity={H.lineOpacity}>
        {strokes('a')}
        <g transform={`translate(${CONTOUR_SHIFT.x} ${CONTOUR_SHIFT.y})`}>{strokes('b')}</g>
      </g>
      <path d={polyPath(arm.polygon, true)} fill={H.tone} />
      <g fill={H.shade} style={{filter: `blur(${SHADE_FEATHER}px)`}}>
        {bands.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
};

/** The placement HandDrawing ends up with for a Hand at presence 1 (the pair sets the size). */
export const placementOf = (p: HandPlacement, pair: HandPair): HandPlacement => ({...p, size: PAIR_SIZE[pair]});

export type ReachingHandProps = Omit<HandProps, 'forearmMm' | 'presence' | 'enterFrom' | 'travel'> & {readonly reach: ArmReach};

/** A kit Hand (at presence 1; slide it with a wrapper) with its whole arm, leaving the frame along `reach`. */
export const ReachingHand: React.FC<ReachingHandProps> = ({reach, pose, pair = 'A', ...rest}) => {
  const resolved: HandPose = resolvePose(pose);
  const {held: _held, mode: _mode, style: _style, ...placement} = rest;
  const arm = armGeometry(placementOf(placement, pair), resolved, reach);
  return (
    <>
      <ArmShadow arm={arm} lift={placement.lift ?? 0} />
      <Hand pose={resolved} pair={pair} forearmMm={KIT_FOREARM_MM} {...rest} />
      <ArmBody arm={arm} />
    </>
  );
};
