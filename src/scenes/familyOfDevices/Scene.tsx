// Scene.tsx — module `familyOfDevices` (1:48-1:53, local 0-5; shot 14; BIBLE 5.7-5.10). From the transition's
// handoff: the emergency card peels off the phone's dock, flips once about its long axis and lands on the Watch face
// at 0.5 as the Watch lights in beside the sliding phone; the Wallet pass slides out from behind both at 2.0; the
// light settles 3.0-5.0; the hard stop at 5.0 is a frame of pure black (the title's first frame).
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {familyOfDevices, transition} from '../../beats';
import {cameraDistance, CardFlip, cardFromPhone, cardToWatch, DeviceStage, flightCardSize, Phone3D, WalletPass3D, Watch3D, type ScreenSource, type StageInfo} from '../../devices';
import {VoidBackground} from '../../glass';
import {useFormat} from '../../useFormat';
import {BINDER_HOME_STILL, homeScreenSource, useHomeStill} from '../transition/homeScreen';
import {DockStarPatch} from './DockStarPatch';
import {cardLanded, dockStarAlpha, glowAt, isHardCut, passBodyOpacity, passLight, passPose, passProgress, phoneLight, phonePose, watchBodyOpacity, watchLight, watchPose} from './layout';

/** The phone shows the binder home (patched, see transition/homeStillPatch.ts). */
export const PHONE_SCREEN = BINDER_HOME_STILL;
/** The Watch shows the card exactly as the flip's back shows it, so the landing is seamless. */
export const WATCH_SCREEN = 'footage/watch-card-still.png';
const FOV = transition.perspective.fovTo;

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const {format} = useFormat();
  const still = useHomeStill();
  const t = frame / fps;
  if (isHardCut(t) || !still) return <VoidBackground />;
  const size = {width, height};
  const stage: StageInfo = {width, height, fov: FOV, distance: cameraDistance(FOV, height)};
  const phone = phonePose(t, format, size);
  const watch = watchPose(t, format, size);
  const glow = glowAt(t);
  const passK = passProgress(t);
  const flightPhone = phonePose(familyOfDevices.flip.from, format, size);
  const flight = {
    from: cardFromPhone(flightPhone, stage),
    to: cardToWatch(watch, stage),
    card: flightCardSize(flightPhone.placement.height),
  };
  const watchScreen: ScreenSource = cardLanded(t) ? {kind: 'image', src: WATCH_SCREEN} : {kind: 'none'};
  const star = dockStarAlpha(t);
  const overlay = star > 0 ? <DockStarPatch placement={phone.placement} rotation={phone.rotation} fov={FOV} size={size} alpha={star} /> : null;
  return (
    <DeviceStage fov={FOV} overlay={overlay}>
      <Phone3D placement={phone.placement} rotation={phone.rotation} edgeLight={phoneLight()} glow={glow} screen={homeScreenSource(still)} island />
      <Watch3D placement={watch.placement} rotation={watch.rotation} edgeLight={watchLight(t)} glow={glow} opacity={watchBodyOpacity(t)} screen={watchScreen} />
      {passK > 0 ? <WalletPass3D {...passPose(t, format, size)} edgeLight={passLight(passK)} glow={glow} opacity={passBodyOpacity(passK)} /> : null}
      <CardFlip {...flight} t={t - familyOfDevices.flip.from} />
    </DeviceStage>
  );
};
