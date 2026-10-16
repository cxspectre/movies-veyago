// Scene.tsx — back to the desk (2:25-2:33, shot 20): the grid of sketches in warmer light, the real iPhone face up
// on the drawn home, a slow push; pair A's hand brings the pencil in and lowers it beside the phone, stopping a
// hair above the paper; "Provided for." under the VO. Every page is an image; nothing here runs the pencil engine.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {DESK_LAMP_WARM, DeskStage, PAIR_SIZE, presenceOffset, SheetAt, SKETCH_PX_PER_MM, staticRig, type DeskCamera, type DeskPropId} from '../../desk';
import {FORMATS, FPS, type FormatName} from '../../film';
import {useFormat} from '../../useFormat';
import {type ArmReach, exitFromDown, reachMm, ReachingPencilHand, StaticTile, TILE_CURL, TILE_ROTATION, tileScale, wallSlots, WallFlatProps, WallTallProps} from '../wall';
import {ClosingLine} from './ClosingLine';
import {WarmGrade, WARM_VIGNETTE} from './WarmGrade';
import {PhoneOnPaper} from './PhoneOnPaper';
import {backToDeskCamera, ERASER_NUDGE, HAND_TRAVEL, pencilPose, PENCIL_YAW, PHONE_ROTATION_DEG, phoneDeskCentre, phoneDeskHeight, toFrame} from './staging';

const NO_STAGE_PROPS: Partial<Record<DeskPropId, boolean>> = {pencilCup: false, coffeeCup: false, eraser: false, ruler: false, stickyPad: false, phone: false, blankStack: false};

/** The end-of-wall grid: every page, finished, as images (the phone has moved from its slot onto the centre tile). */
const Grid: React.FC<{readonly format: FormatName}> = ({format}) => (
  <>
    {wallSlots(format).flatMap((slot) =>
      slot.tile === 'phone'
        ? []
        : [<StaticTile key={slot.tile} tile={slot.tile} centre={slot.centre} rotation={TILE_ROTATION[slot.tile]} scale={tileScale(format)} curl={TILE_CURL[slot.tile] ?? 0} lamp={DESK_LAMP_WARM} />],
    )}
  </>
);

/** A layer in desk coordinates over everything (the hand passes over the phone). */
const CameraLayer: React.FC<{readonly format: FormatName; readonly cam: DeskCamera; readonly children: React.ReactNode}> = ({format, cam, children}) => {
  const o = toFrame(format, cam, {x: 0, y: 0});
  return <AbsoluteFill style={{transform: `translate(${o.x.toFixed(3)}px, ${o.y.toFixed(3)}px) scale(${cam.scale.toFixed(5)})`, transformOrigin: '0 0'}}>{children}</AbsoluteFill>;
};

/**
 * The arm leaves through the bottom-right at a shallow angle (degrees right of straight down), clear of the phone
 * and the closing line; long enough for the widest framing (camera 1.00).
 */
const ARM_EXIT_DEG: Record<FormatName, number> = {wide: 52, tall: 50};
const armReach = (format: FormatName): ArmReach => {
  const {width, height} = FORMATS[format];
  return {exit: exitFromDown(ARM_EXIT_DEG[format]), lengthMm: reachMm(Math.hypot(width, height), tileScale(format), SKETCH_PX_PER_MM * PAIR_SIZE.A)};
};

const PencilLowering: React.FC<{readonly format: FormatName; readonly t: number}> = ({format, t}) => {
  const pose = pencilPose(t);
  if (pose.presence <= 0) return null;
  const off = presenceOffset(pose.presence, HAND_TRAVEL, 'bottom');
  return (
    <SheetAt centre={phoneDeskCentre(format)} scale={tileScale(format)} rotation={0}>
      <div style={{position: 'absolute', left: 0, top: 0, transform: `translate(${off.x.toFixed(2)}px, ${off.y.toFixed(2)}px)`}}>
        <ReachingPencilHand reach={armReach(format)} rig={staticRig(pose.tip, pose.hover, {yawBase: PENCIL_YAW})} pose="lower" pair="A" />
      </div>
    </SheetAt>
  );
};

export const BackToDeskStage: React.FC<{readonly format: FormatName; readonly frame: number}> = ({format, frame}) => {
  const t = frame / FPS;
  const cam = backToDeskCamera(format, t);
  return (
    <AbsoluteFill>
      <DeskStage format={format} camera={cam} show={NO_STAGE_PROPS} lamp={DESK_LAMP_WARM} vignette={WARM_VIGNETTE}>
        <WallFlatProps format={format} eraserNudge={ERASER_NUDGE[format]} />
        <Grid format={format} />
        <WallTallProps format={format} />
      </DeskStage>
      <PhoneOnPaper
        format={format}
        centre={toFrame(format, cam, phoneDeskCentre(format))}
        height={phoneDeskHeight(format) * cam.scale}
        rotation={PHONE_ROTATION_DEG}
        cameraScale={cam.scale}
      />
      <CameraLayer format={format} cam={cam}>
        <PencilLowering format={format} t={t} />
      </CameraLayer>
      <WarmGrade />
      <ClosingLine format={format} t={t} />
    </AbsoluteFill>
  );
};

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const {format} = useFormat();
  return <BackToDeskStage format={format} frame={frame} />;
};
