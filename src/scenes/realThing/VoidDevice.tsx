// VoidDevice.tsx — a void cut: the phone (or, for the Watch cut, the watch) in the black stage with the cut's footage
// playing at speed on its screen. Render inside the scene's one <DeviceStage>; key it by cut so each cut starts fresh.
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Phone3D, Watch3D, type ScreenSource} from '../../devices';
import {useFormat} from '../../useFormat';
import {footagePath} from './footage';
import {phonePose, watchPose} from './motion';
import type {PlannedCut} from './plan';

/**
 * The rigs read the MODULE frame (the stage is not inside the cut's Sequence), so the clip offset is shifted by the cut's
 * start: the clip shows `clipStart` on the cut's first frame and plays at speed, never past `clipEnd`.
 */
const screenFor = (cut: PlannedCut): ScreenSource => ({
  kind: 'video',
  src: footagePath(cut.clip),
  startAt: cut.clipStart - cut.start,
  endAt: cut.clipEnd,
});

export const VoidDevice: React.FC<{cut: PlannedCut}> = ({cut}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const {format} = useFormat();
  const t = frame / fps;
  if (cut.shot === 'watch') {
    const pose = watchPose(cut, t, format, width, height);
    return <Watch3D {...pose} screen={screenFor(cut)} />;
  }
  const pose = phonePose(cut, t, format, height);
  return <Phone3D {...pose} screen={screenFor(cut)} island={false} />;
};
