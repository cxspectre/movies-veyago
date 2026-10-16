import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COLORS} from './film';
import {SKETCHES, type SketchId} from './sketches/registry';
import {SKETCH_SIZE} from './paper/types';

export const SKETCH_PREVIEW_FRAMES = 240;

/** A sketch alone on plain paper, drawing itself over 6 s. Registered as `Sketch-<id>` for stills and review. */
export const SketchPreview: React.FC<{id: SketchId; drawFrames?: number}> = ({id, drawFrames = SKETCH_PREVIEW_FRAMES - 30}) => {
  const {Sketch} = SKETCHES[id];
  useCurrentFrame();
  return (
    <AbsoluteFill style={{background: COLORS.paper}}>
      <div style={{position: 'absolute', inset: 0, width: SKETCH_SIZE.width, height: SKETCH_SIZE.height}}>
        <Sketch drawFrames={drawFrames} />
      </div>
    </AbsoluteFill>
  );
};

/** A sketch on a transparent background, finished by frame 30. `tools/renderPages.ts` stills frame 59 of this. */
export const SketchAlpha: React.FC<{id: SketchId}> = ({id}) => {
  const {Sketch} = SKETCHES[id];
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, width: SKETCH_SIZE.width, height: SKETCH_SIZE.height}}>
        <Sketch drawFrames={30} />
      </div>
    </AbsoluteFill>
  );
};
