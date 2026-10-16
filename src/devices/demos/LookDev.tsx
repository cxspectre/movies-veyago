import React from 'react';
import {useCurrentFrame} from 'remotion';
import {cornerParam} from '../../glass/edgeLightPath';
import {Phone3D} from '../phone/Phone3D';
import {PHONE} from '../phone/phoneSpec';
import {DeviceStage} from '../stage/DeviceStage';
import {Watch3D} from '../watch/Watch3D';
import type {EdgeLight, Rotation} from '../types';

type Pose = {rotation: Rotation; light: EdgeLight; height?: number};

/** One pose per frame, for contact sheets of the body from every side. */
export const LOOKDEV_POSES: readonly Pose[] = [
  {rotation: {}, light: {position: 0.0, intensity: 1}},
  {rotation: {y: 22, x: -5}, light: {position: cornerParam(PHONE.outline, 'topRight'), intensity: 1}},
  {rotation: {y: -38, x: -8}, light: {position: 0.62, intensity: 1}},
  {rotation: {y: 70, x: -6}, light: {position: 0.3, intensity: 1}},
  {rotation: {y: 160, x: -10}, light: {position: 0.1, intensity: 1}},
  {rotation: {y: -100, x: 4}, light: {position: 0.82, intensity: 1}},
  {rotation: {y: 14, x: -20}, light: {position: 0.15, intensity: 0}},
  {rotation: {y: -12, x: -4}, light: {sweep: {x: 0.5, intensity: 1}}},
];

export const LookDev: React.FC<{device?: 'phone' | 'watch'}> = ({device = 'phone'}) => {
  const frame = useCurrentFrame();
  const pose = LOOKDEV_POSES[frame % LOOKDEV_POSES.length] ?? LOOKDEV_POSES[0];
  if (!pose) return null;
  return (
    <DeviceStage fov={28}>
      {device === 'phone' ? (
        <Phone3D placement={{x: 0.5, y: 0.52, height: 842}} rotation={pose.rotation} screen={{kind: 'image', src: 'footage/binder-home.png'}} island edgeLight={pose.light} />
      ) : (
        <Watch3D placement={{x: 0.5, y: 0.5, height: 600}} rotation={pose.rotation} screen={{kind: 'video', src: 'footage/watch-card.mp4', holdAt: 0.5}} edgeLight={pose.light} />
      )}
    </DeviceStage>
  );
};
