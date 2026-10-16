// binder-home-v2 — the redrawn binder home: the centre tile of the wall, traced to light in the transition and
// snapped into the real interface. Drawn ON the real layout (binder-home.layout.json); see layout.ts.
import React from 'react';
import {GraphiteSketch, strokeCues, type SketchProps} from '../../paper';
import type {ModuleCues} from '../../audio/cues';
import type {PreviewSpec} from '../../previewTypes';
import {CHECK_FRAMES, CHECK_SIZE, CheckBinderHome} from './Check';
import {spec} from './spec';

export {spec} from './spec';

/** Foley for the page: one 'stroke' cue per pencil movement, page-local seconds (no tick/coin/key strokes here). */
export const cues = (drawFrames: number): ModuleCues => strokeCues(spec, drawFrames);

export const Sketch: React.FC<SketchProps> = ({drawFrames}) => <GraphiteSketch spec={spec} drawFrames={drawFrames} />;

export const previews: readonly PreviewSpec[] = [
  {id: 'Check-binder-home-v2', component: CheckBinderHome, durationInFrames: CHECK_FRAMES, width: CHECK_SIZE.width, height: CHECK_SIZE.height},
];
