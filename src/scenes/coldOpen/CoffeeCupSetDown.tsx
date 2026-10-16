// CoffeeCupSetDown.tsx — pair B carries the coffee cup in from its edge, lowers it so it lands exactly on
// coldOpen.cupDown (the desk kit's set-down: the cast shadow converges and sharpens as it lands), lets go and leaves
// before the breath. Desk coordinates (render as a DeskStage child, over the V1 sheet).
import React from 'react';
import {interpolate} from 'remotion';
import {coldOpen} from '../../beats';
import {CoffeeCup, cupHandleAngle, cupSetDownState, Hand, handAnchorPx, Placed, POSES, presenceAt, presenceOffset, PAIR_SIZE, SKETCH_PX_PER_MM, type DeskPoint} from '../../desk';
import {frameInDesk, travelToLeave, unit} from './frameGeometry';
import type {ColdOpenLayout} from './layout';
import {CUP} from './timing';

/** The carrying hand's angle (0 = fingers up the screen) and the edge it comes from, per format. */
const CUP_HAND = {
  wide: {rotation: -96, dir: unit({x: 1, y: 0.05})},
  tall: {rotation: -104, dir: unit({x: 1, y: -0.35})},
} as const;
/** Clearance past the frame edge for the cup and the fingers around it, desk px beyond the rim. */
const CUP_CLEARANCE = 40;

/** After letting go the open hand's index tip sits just past the handle's end, on the hand's own side. */
const RELEASE_CLEARANCE = 26;
const releasePoint = (placement: Parameters<typeof handAnchorPx>[0], dir: DeskPoint): DeskPoint => {
  const end = handAnchorPx(placement, POSES.cupHold, 'handleEnd');
  return {x: end.x + dir.x * RELEASE_CLEARANCE, y: end.y + dir.y * RELEASE_CLEARANCE};
};

const setDownAt = (t: number): number => interpolate(t, [CUP.lower.from, CUP.lower.to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/** The cup once it is down. Rendered under the hands (an arm passes over a cup, never under it). */
export const RestingCup: React.FC<{t: number; layout: ColdOpenLayout}> = ({t, layout}) =>
  t >= coldOpen.cupDown ? (
    <Placed centre={layout.cup.centre}>
      <CoffeeCup r={layout.cup.r} setDown={1} handleAngle={cupHandleAngle(CUP_HAND[layout.format].rotation)} />
    </Placed>
  ) : null;

/** Pair B carrying the cup in, setting it down and leaving. */
export const CoffeeCupSetDown: React.FC<{t: number; layout: ColdOpenLayout}> = ({t, layout}) => {
  if (t < CUP.carry.from || t >= CUP.out.to) return null;
  const {cup} = layout;
  const hand = CUP_HAND[layout.format];
  const handleAngle = cupHandleAngle(hand.rotation);
  const resting = t >= coldOpen.cupDown;
  const presence = presenceAt(t, {enter: CUP.carry, exit: CUP.out, easeIn: 'easeInOutSine', easeOut: 'easeInOutSine'});
  const travel = travelToLeave(cup.centre, hand.dir, frameInDesk(layout), cup.r + CUP_CLEARANCE);
  const slide = presenceOffset(resting ? 1 : presence, travel, hand.dir);
  const setDown = setDownAt(t);
  const placement = {
    x: cup.centre.x + slide.x,
    y: cup.centre.y + slide.y,
    anchor: 'grip',
    rotation: hand.rotation,
    pxPerMm: SKETCH_PX_PER_MM * layout.sheet.scale,
    size: PAIR_SIZE.B,
    lift: cupSetDownState(setDown).height,
  };
  const cupAt: DeskPoint = handAnchorPx(placement, POSES.cupHold, 'grip');
  const held = resting ? undefined : (
    <div style={{position: 'absolute', left: cupAt.x, top: cupAt.y}}>
      <CoffeeCup r={cup.r} setDown={setDown} handleAngle={handleAngle} />
    </div>
  );
  return (
    <>
      {presence > 0 && !resting ? <Hand pose="cupHold" pair="B" {...placement} held={held} presence={1} /> : null}
      {presence > 0 && resting ? (
        // Let go: the fingers open from the handle into a relaxed hand, palm where it was, and it withdraws.
        <Hand pose="reach" pair="B" {...placement} {...releasePoint(placement, hand.dir)} anchor="indexTip" lift={0} presence={presence} enterFrom={hand.dir} travel={travel} />
      ) : null}
    </>
  );
};
