// speech-bubbles — page 11 (BIBLE 4.12): Hello, Hola, Hallo, Bonjour, Hoi.
import React from 'react';
import type {Cue, ModuleCues} from '../../audio/cues';
import {FPS} from '../../film';
import {GraphiteSketch, strokeCues, type SketchProps, type SketchSpec} from '../../paper';
import {BUBBLE_WINDOWS, spec} from './spec';

export {spec};

const TICK_PREFIX = 'tick-';
const seconds = (fraction: number, drawFrames: number): number => (fraction * drawFrames) / FPS;

/** The page without its ticks: ticks are heard as hits, not as pencil strokes (BIBLE 4, intro). */
const withoutTicks: SketchSpec = {...spec, strokes: spec.strokes.filter((s) => !s.id.startsWith(TICK_PREFIX))};

/**
 * Foley: 'stroke' cues for the bubbles, words and note; a `tick` hit at the start of every `tick-` stroke; a
 * `bubble_pop` as each bubble is finished (its loop and its word).
 */
export const cues = (drawFrames: number): ModuleCues => {
  const ticks: readonly Cue[] = spec.strokes
    .filter((s) => s.id.startsWith(TICK_PREFIX))
    .map((s) => ({kind: 'hit', t: seconds(s.from, drawFrames), name: 'tick'}));
  const pops: readonly Cue[] = BUBBLE_WINDOWS.map(([, to]) => ({kind: 'hit', t: seconds(to, drawFrames), name: 'bubble_pop'}));
  return [...strokeCues(withoutTicks, drawFrames), ...ticks, ...pops].sort((a, b) => a.t - b.t);
};

export const Sketch: React.FC<SketchProps> = ({drawFrames}) => <GraphiteSketch spec={spec} drawFrames={drawFrames} />;
