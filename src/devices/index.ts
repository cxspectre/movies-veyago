// The device rig: three.js phone, watch and pass rendered through @remotion/three into one black-void stage.
// See README.md in this folder.
export {DeviceStage, useStage, type DeviceStageProps, type StageInfo} from './stage/DeviceStage';
export {DEFAULT_BLOOM, type BloomSettings} from './stage/Composer';
export {cameraDistance, DEFAULT_FOV_DEG, frameToWorld, MIN_FOV_DEG, worldToFramePx, type StageSize} from './stage/camera';
export {Phone3D, type Phone3DProps} from './phone/Phone3D';
export {DOCK_EMERGENCY_PT, PHONE, SCREEN_PT, SCREEN_PX, screenPointToLocal} from './phone/phoneSpec';
export {Watch3D, type Watch3DProps} from './watch/Watch3D';
export {WATCH, WATCH_CLOCK, WATCH_SCREEN_PX} from './watch/watchSpec';
export {WalletPass3D, type WalletPass3DProps} from './pass/WalletPass3D';
export {CardFlip, type CardFlipProps} from './pass/CardFlip';
export {cardFlight, FLIGHT_PHASES, cardFromPhone, cardToWatch, flightCardSize, type CardEnd, type CardState, type FlightSpec} from './pass/cardFlipMath';
export {FLIP_CARD, PASS} from './pass/passSpec';
export {localToWorld, projectToFrame, quadTransform, rigEuler, rigMatrix, rigPosition, rigQuaternion, type RigPose} from './placement';
export {clipTime, useScreenTexture, type ScreenPatch, type ScreenTexture} from './screen/useScreenTexture';
export {patchWatchClock} from './screen/watchClockPatch';
export {
  familyGlow,
  familyPhoneX,
  familyWatchIn,
  keynote,
  pairGlow,
  pairSweepIntensity,
  pairSweepX,
  sweepFor,
  transitionEdgeLight,
  transitionFov,
  transitionPhone,
  transitionPlacement,
  transitionRotation,
} from './drive';
export type {EdgeLight, Placement, RigProps, Rotation, ScreenSource} from './types';
