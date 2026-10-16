// visit-recording — page 9 (BIBLE 4.10): the sound wave over a doctor's desk.
import React from 'react';
import type {ModuleCues} from '../../audio/cues';
import {GraphiteSketch, strokeCues, type SketchProps} from '../../paper';
import {spec} from './spec';

export {spec};

/** Foley for the page: 'stroke' cues straight from the drawing schedule (no hit-prefixed ids on this page). */
export const cues = (drawFrames: number): ModuleCues => strokeCues(spec, drawFrames);

export const Sketch: React.FC<SketchProps> = ({drawFrames}) => <GraphiteSketch spec={spec} drawFrames={drawFrames} />;
