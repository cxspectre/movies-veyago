// europe-map — page 10 (BIBLE 4.11): "Past one country."
import React from 'react';
import type {ModuleCues} from '../../audio/cues';
import {GraphiteSketch, strokeCues, type SketchProps} from '../../paper';
import {spec} from './spec';

export {spec};

/** Foley for the page: 'stroke' cues from the drawing schedule (no hit-prefixed ids on this page). */
export const cues = (drawFrames: number): ModuleCues => strokeCues(spec, drawFrames);

export const Sketch: React.FC<SketchProps> = ({drawFrames}) => <GraphiteSketch spec={spec} drawFrames={drawFrames} />;
