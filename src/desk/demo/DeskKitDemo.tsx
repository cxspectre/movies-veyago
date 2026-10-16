// DeskKitDemo.tsx — the whole desk layout (BIBLE §2.10) with both pairs of hands in several poses, for review:
// `Desk-kit-wide` / `Desk-kit-tall`. Over 6 s, in the bible's own discipline (§2.11: the pairs never work the sheet
// at once): pair A draws on the active sheet (left hand steadying it) and leaves along its forearm; pair B reaches
// in from the right edge (top-right in tall) with the coffee cup, sets it down at the V1 sheet's corner, withdraws,
// and comes back to smooth the sticky note. Every hand is drawn at the desk's own px per mm.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {sec} from '../../film';
import {GraphiteSketch, PaperSheet, StickyNote} from '../../paper';
import {DEMO_SPEC} from '../../paper/demo/demoSpec';
import {useFormat} from '../../useFormat';
import {DeskStage, SheetAt} from '../DeskStage';
import {DESK_LAYOUT, type DeskPoint, type SheetSlot} from '../layout';
import {DESK_LAMP, SKETCH_PX_PER_MM} from '../palette';
import {CoffeeCup, cupSetDownState} from '../props/CoffeeCup';
import {Hand, PAIR_SIZE} from '../hands/Hand';
import {PencilHand} from '../hands/PencilHand';
import {handAnchorPx} from '../hands/HandDrawing';
import {cupGripAnchor, cupHandleAngle, type HandPose, POSES} from '../hands/poses';
import {presenceAt, presenceOffset} from '../hands/presence';

export const DESK_KIT_FRAMES = sec(6);
const DRAW_FRAMES = sec(2);
const CAMERA = {wide: {scale: 0.8, centre: {x: 960, y: 540}}, tall: {scale: 0.8, centre: {x: 540, y: 960}}} as const;
const A_OUT = {from: 2.1, to: 2.6};
const A_STEADY_OUT = {from: 2.2, to: 2.7};
const CUP_IN = {from: 2.5, to: 3.5};
const CUP_DOWN = {from: 3.5, to: 4.1};
const CUP_OUT = {from: 4.2, to: 4.8};
const SMOOTH_IN = {from: 4.7, to: 5.3};
const STICKY_AT = sec(3.0);
/** Where pair A's left hand holds the sheet (sketch px) and how its arm leaves, per format. */
const STEADY = {wide: {x: 300, y: 690, rotation: 16}, tall: {x: 300, y: 690, rotation: 14}} as const;
/**
 * Pair B: the cup hand's rotation, how far off frame it starts (desk px) and which way its arm bends, per format.
 * In wide the arm comes in level with the cup and bends a little toward the thumb side, so it stays under the
 * phone and clear of the pencil cup.
 */
const PAIR_B = {wide: {rotation: -84, edge: 'right', travel: 1800, bend: -6}, tall: {rotation: -135, edge: 'topRight', travel: 1500, bend: 6}} as const;
const SMOOTH = {wide: {rotation: -78, edge: 'right', travel: 1800, bend: -6}, tall: {rotation: -127, edge: 'topRight', travel: 1500, bend: 6}} as const;
/** The sticky note's place on the V1 sheet (sketch px) and where the smoothing fingers land on it. */
const NOTE_AT = {x: 560, y: 470, size: 230};
const SMOOTH_AT = {x: 675, y: 640};
const A_EXIT_TRAVEL = 1500;

/** A point on a sheet (sketch px) in desk coordinates. */
const sheetToDesk = (slot: SheetSlot, p: DeskPoint): DeskPoint => {
  const r = (slot.rotation * Math.PI) / 180;
  const dx = (p.x - 600) * slot.scale;
  const dy = (p.y - 425) * slot.scale;
  return {x: slot.centre.x + dx * Math.cos(r) - dy * Math.sin(r), y: slot.centre.y + dx * Math.sin(r) + dy * Math.cos(r)};
};

export const DeskKitDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const {format} = useFormat();
  const layout = DESK_LAYOUT[format];
  const t = frame / 30;
  const sheet = layout.activeSheet;
  const v1 = layout.v1Sheet;
  const deskPxPerMm = SKETCH_PX_PER_MM * sheet.scale;
  const cupPresence = presenceAt(t, {enter: CUP_IN, exit: CUP_OUT});
  const setDown = presenceAt(t, {enter: CUP_DOWN});
  const cupState = cupSetDownState(setDown);
  const cupHeld = t < CUP_OUT.from;
  const b = PAIR_B[format];
  // Pair B's hand slides in from the frame edge; the cup travels with it, drawn between the hand and its thumb.
  const slide = presenceOffset(cupPresence, b.travel, b.edge);
  const cupRadius = layout.coffeeCup.size.w / 2;
  const cupPose: HandPose = {...POSES.cupHold, anchors: {...POSES.cupHold.anchors, grip: cupGripAnchor(cupRadius / (deskPxPerMm * PAIR_SIZE.B))}};
  const cupPlacement = {
    x: layout.coffeeCup.centre.x + slide.x,
    y: layout.coffeeCup.centre.y + slide.y,
    anchor: 'grip',
    rotation: b.rotation,
    pxPerMm: deskPxPerMm,
    size: PAIR_SIZE.B,
    lift: cupState.height,
    forearmBend: b.bend,
  };
  const cupAt = handAnchorPx(cupPlacement, cupPose, 'grip');
  const s = SMOOTH[format];
  const smoothAt = sheetToDesk(v1, SMOOTH_AT);
  const smoothingHand = (
    <Hand pose="smooth" pair="B" x={smoothAt.x} y={smoothAt.y} anchor="pad" rotation={s.rotation + v1.rotation} pxPerMm={deskPxPerMm} presence={presenceAt(t, {enter: SMOOTH_IN})} enterFrom={s.edge} travel={s.travel} forearmBend={s.bend} />
  );
  const steady = STEADY[format];
  return (
    <DeskStage format={format} camera={CAMERA[format]} show={{coffeeCup: !cupHeld}} cupPencils={['accent', 'graphite']} above={smoothingHand}>
      <SheetAt centre={v1.centre} scale={v1.scale} rotation={v1.rotation}>
        <PaperSheet lamp={DESK_LAMP} curl={0.2}>
          <GraphiteSketch spec={DEMO_SPEC} drawFrames={1} frame={1} zoom={v1.scale * CAMERA[format].scale} />
          <div style={{position: 'absolute', left: NOTE_AT.x, top: NOTE_AT.y}}>
            <StickyNote text="What are we still missing?" size={NOTE_AT.size} pressAt={STICKY_AT} zoom={v1.scale * CAMERA[format].scale} rotate={3} />
          </div>
        </PaperSheet>
      </SheetAt>
      <SheetAt centre={sheet.centre} scale={sheet.scale} rotation={sheet.rotation}>
        <PaperSheet lamp={DESK_LAMP} curl={0.3}>
          <GraphiteSketch spec={DEMO_SPEC} drawFrames={DRAW_FRAMES} zoom={sheet.scale * CAMERA[format].scale} />
        </PaperSheet>
        <Hand pose="steady" handed="left" x={steady.x} y={steady.y} anchor="indexTip" rotation={steady.rotation} presence={presenceAt(t, {exit: A_STEADY_OUT})} travel={A_EXIT_TRAVEL} />
        <PencilHand spec={DEMO_SPEC} drawFrames={DRAW_FRAMES} presence={presenceAt(t, {exit: A_OUT})} follow={{yawBase: format === 'tall' ? 66 : 60}} />
      </SheetAt>
      {cupHeld && cupPresence > 0 ? (
        <Hand
          pose={cupPose}
          pair="B"
          {...cupPlacement}
          held={
            <div style={{position: 'absolute', left: cupAt.x, top: cupAt.y}}>
              <CoffeeCup r={cupRadius} setDown={setDown} handleAngle={cupHandleAngle(cupPlacement.rotation)} />
            </div>
          }
        />
      ) : null}
    </DeskStage>
  );
};
