// EngineDemo.tsx — proves the paper engine: a sheet on the desk drawing itself over 6 s, a sticky note pressed on
// and smoothed flat, eraser crumbs. Registered as the `Engine-demo` composition. Pass {"light": true} as input
// props to see the same page as <LightSketch> hairlines.
import React from 'react';
import {AbsoluteFill, getInputProps, useCurrentFrame} from 'remotion';
import {COLORS, sec} from '../../film';
import {useFormat} from '../../useFormat';
import {DeskSurface} from '../DeskSurface';
import {GraphiteSketch} from '../GraphiteSketch';
import {LightSketch} from '../LightSketch';
import {DEFAULT_LAMP} from '../lamp';
import {PaperSheet} from '../PaperSheet';
import {SKETCH_SIZE} from '../types';
import {EraserCrumbs} from '../EraserCrumbs';
import {StickyNote} from '../sticky/StickyNote';
import {DEMO_SPEC} from './demoSpec';
import {STRESS_SPEC} from './stressSpec';

export const ENGINE_DEMO_FRAMES = sec(9);
const DRAW_FRAMES = sec(6);
const SHEET_FILL = 0.9;
const SHEET_TILT = -1.2;
const STICKY = {pressAt: sec(6.4), smoothAt: sec(7.3), x: 560, y: 470, size: 230};
const CRUMBS = {x: 150, y: 700, w: 170, h: 70};

export const EngineDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useFormat();
  const scale = Math.min((width * SHEET_FILL) / SKETCH_SIZE.width, (height * SHEET_FILL) / SKETCH_SIZE.height);
  const input = getInputProps() as {stress?: boolean; light?: boolean};
  const spec = input.stress === true ? STRESS_SPEC : DEMO_SPEC;
  if (input.light === true) {
    return (
      <AbsoluteFill style={{background: COLORS.void, alignItems: 'center', justifyContent: 'center'}}>
        <div style={{position: 'relative', width: SKETCH_SIZE.width, height: SKETCH_SIZE.height, transform: `scale(${scale})`}}>
          <LightSketch spec={spec} progress={frame / DRAW_FRAMES} />
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <DeskSurface lamp={DEFAULT_LAMP}>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{transform: `scale(${scale}) rotate(${SHEET_TILT}deg)`}}>
          <PaperSheet lamp={DEFAULT_LAMP} curl={0.4}>
            <GraphiteSketch spec={spec} drawFrames={DRAW_FRAMES} zoom={scale} frame={frame} />
            <EraserCrumbs area={CRUMBS} seed={11} count={18} />
            <div style={{position: 'absolute', left: STICKY.x, top: STICKY.y}}>
              <StickyNote text="What are we still missing?" size={STICKY.size} pressAt={STICKY.pressAt} smoothAt={STICKY.smoothAt} zoom={scale} rotate={3} />
            </div>
          </PaperSheet>
        </div>
      </AbsoluteFill>
    </DeskSurface>
  );
};
