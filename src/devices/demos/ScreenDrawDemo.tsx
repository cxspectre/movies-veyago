import React from 'react';
import {useVideoConfig} from 'remotion';
import layout from '../../../public/footage/binder-home.layout.json';
import {strokeHairline} from '../../glass/hairline';
import {Phone3D} from '../phone/Phone3D';
import {SCREEN_PX} from '../phone/phoneSpec';
import {DeviceStage} from '../stage/DeviceStage';
import type {ScreenSource} from '../types';

/**
 * Example of a `draw` screen source: the binder home's element frames drawn as hairlines of light ON the glass, one
 * element per few frames (how the transition can keep its line art on the turning phone before the snaps).
 */
const FRAMES_PER_ELEMENT = 3;
const PX_PER_PT = layout.screen.scale;
const visible = layout.elements.filter((e) => e.onFirstScreen && e.kind !== 'tabBarTab');

const drawHome = (ctx: CanvasRenderingContext2D, frame: number): void => {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, SCREEN_PX.width, SCREEN_PX.height);
  const count = Math.min(visible.length, Math.floor(frame / FRAMES_PER_ELEMENT) + 1);
  visible.slice(0, count).forEach((e, i) => {
    const r = Math.min(16, e.frame.h / 2) * PX_PER_PT;
    const path = new Path2D();
    path.roundRect(e.frame.x * PX_PER_PT, e.frame.y * PX_PER_PT, e.frame.w * PX_PER_PT, e.frame.h * PX_PER_PT, r);
    const age = (frame - i * FRAMES_PER_ELEMENT) / 30;
    strokeHairline(ctx, path, e.kind === 'helperChip' ? 'accent' : 'graphite', age < 0.6 ? 1.2 : 1, PX_PER_PT);
  });
};

export const ScreenDrawDemo: React.FC = () => {
  const {height} = useVideoConfig();
  const screen: ScreenSource = {kind: 'draw', width: SCREEN_PX.width, height: SCREEN_PX.height, draw: drawHome};
  return (
    <DeviceStage fov={28}>
      <Phone3D placement={{x: 0.5, y: 0.52, height: height * 0.78}} rotation={{y: -8, x: -3}} screen={screen} screenBloom={1} edgeLight={{position: 0.1, intensity: 1}} />
    </DeviceStage>
  );
};
