// form-to-chat — page 12 (BIBLE 4.13): the form crossed out, redrawn as a conversation. drawFrames 225 on the desk.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {ModuleCues} from '../../audio/cues';
import {deskPage} from '../../beats';
import {COLORS} from '../../film';
import {GraphiteSketch, SKETCH_SIZE, strokeCues, type SketchProps} from '../../paper';
import type {PreviewSpec} from '../../previewTypes';
import {spec} from './spec';

export {spec};
export {PENCIL_RESTS, pencilState, type PencilRest} from './pencil';

/** Foley: 'stroke' cues from the schedule; the cross-out is one long, heavy stroke cue (pressure from the line). */
export const cues = (drawFrames: number): ModuleCues => strokeCues(spec, drawFrames);

export const Sketch: React.FC<SketchProps> = ({drawFrames}) => <GraphiteSketch spec={spec} drawFrames={drawFrames} />;

const DESK_HOLD_FRAMES = 30;

/** The page at its real desk timing (drawFrames from beats.ts, 225), for reviewing the pauses. */
const DeskTiming: React.FC = () => (
  <AbsoluteFill style={{background: COLORS.paper}}>
    <div style={{position: 'absolute', inset: 0, width: SKETCH_SIZE.width, height: SKETCH_SIZE.height}}>
      <Sketch drawFrames={deskPage('form-to-chat').drawFrames} />
    </div>
  </AbsoluteFill>
);

export const previews: readonly PreviewSpec[] = [
  {
    id: 'SketchDesk-form-to-chat',
    component: DeskTiming,
    durationInFrames: deskPage('form-to-chat').drawFrames + DESK_HOLD_FRAMES,
    width: SKETCH_SIZE.width,
    height: SKETCH_SIZE.height,
  },
];
