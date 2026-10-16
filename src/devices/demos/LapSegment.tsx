import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {transition} from '../../beats';
import {useFormat} from '../../useFormat';
import {transitionPhone} from '../drive';
import {Phone3D} from '../phone/Phone3D';
import {DeviceStage} from '../stage/DeviceStage';

/** The transition's phone from 7.0 to 17.0 (lift-off, the lap, the drift to the top-right corner) with the real home. */
export const LAP_SECONDS = transition.handoff.t - transition.liftOff.from;

export const LapSegment: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const {format} = useFormat();
  const t = transition.liftOff.from + frame / fps;
  const phone = transitionPhone(t, format, height);
  return (
    <DeviceStage fov={phone.fov}>
      <Phone3D
        placement={phone.placement}
        rotation={phone.rotation}
        edgeLight={phone.edgeLight}
        screen={{kind: 'video', src: 'footage/binder-home-dark.mp4', holdAt: 0.5}}
      />
    </DeviceStage>
  );
};
