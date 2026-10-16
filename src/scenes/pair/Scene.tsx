// Scene.tsx — module `pair` (2:20-2:25, local 0-5; shot 19; BIBLE 6.3). The hero: phone and Watch side by side in
// the void (stacked in tall), the phone on the binder home and the Watch on the card, a resting rim of light on
// each, one band sweeping left to right across both devices' edges at 1.0-2.5, the glow dimming to 40% over
// 4.0-5.0, then the hard cut.
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {transition} from '../../beats';
import {DeviceStage, Phone3D, Watch3D} from '../../devices';
import {VoidBackground} from '../../glass';
import {useFormat} from '../../useFormat';
import {BINDER_HOME_STILL, homeScreenSource, useHomeStill} from '../transition/homeScreen';
import {glowAt, isCut, phonePose, sweepLights, watchPose} from './layout';

/** The phone shows the binder home (patched, see transition/homeStillPatch.ts). */
export const PHONE_SCREEN = BINDER_HOME_STILL;
export const WATCH_SCREEN = 'footage/watch-card-still.png';
const FOV = transition.perspective.fovTo;

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const {format} = useFormat();
  const still = useHomeStill();
  const t = frame / fps;
  if (isCut(t) || !still) return <VoidBackground />;
  const size = {width, height};
  const phone = phonePose(t, format, size);
  const watch = watchPose(t, format, size);
  const light = sweepLights(t, phone.placement, watch.placement, size);
  const glow = glowAt(t);
  return (
    <DeviceStage fov={FOV}>
      <Phone3D placement={phone.placement} rotation={phone.rotation} edgeLight={light.phone} glow={glow} screen={homeScreenSource(still)} island />
      <Watch3D placement={watch.placement} rotation={watch.rotation} edgeLight={light.watch} glow={glow} screen={{kind: 'image', src: WATCH_SCREEN}} />
    </DeviceStage>
  );
};
