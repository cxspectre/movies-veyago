import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {useFormat} from '../../useFormat';
import {Phone3D} from '../phone/Phone3D';
import {DeviceStage} from '../stage/DeviceStage';
import type {ScreenSource} from '../types';

/** Phone alone: one edge-light lap over the clip, a slow turn. `still` shows the clean still with a drawn island. */
export const PhoneDemo: React.FC<{source: 'video' | 'still'}> = ({source}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const {isTall} = useFormat();
  const progress = frame / durationInFrames;
  const screen: ScreenSource =
    source === 'video' ? {kind: 'video', src: 'footage/binder-home-dark.mp4', startAt: 1.5, endAt: 7.7} : {kind: 'image', src: 'footage/binder-home.png'};
  return (
    <DeviceStage fov={28}>
      <Phone3D
        placement={{x: 0.5, y: isTall ? 0.5 : 0.52, height: isTall ? 1920 * 0.62 : 1080 * 0.78}}
        rotation={{y: -14 + 36 * progress, x: -5 * progress}}
        screen={screen}
        island={source === 'still'}
        edgeLight={{position: progress, intensity: 1}}
        glow={1}
      />
    </DeviceStage>
  );
};
