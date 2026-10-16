import React from 'react';
import {Phone3D} from '../phone/Phone3D';
import {DeviceStage} from '../stage/DeviceStage';

/** Face-on phone, no light: the screen's rendered pixels can be compared with binder-home.png (tools in README). */
export const COLOUR_CHECK_HEIGHT = 1000;
export const ColourCheck: React.FC = () => (
  <DeviceStage fov={28}>
    <Phone3D placement={{x: 0.5, y: 0.5, height: COLOUR_CHECK_HEIGHT}} screen={{kind: 'image', src: 'footage/binder-home.png'}} edgeLight={{intensity: 0}} glow={0} />
  </DeviceStage>
);
