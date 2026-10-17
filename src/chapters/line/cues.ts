// cues.ts — chapter 1's COMPLETE foley list (module-local seconds), from BIBLE4 §5.1 and §7.1: the pencil touches down at
// 0.5 and then one continuous graphite stroke to the corner at 30.0, leaning lighter (0.7) while the line writes the super.
// 0-6 s is pencil only, dry and close; the music enters at 6.0 and is not foley. The super's handwriting is the same pencil
// as the line, so it adds no cue of its own.
import type {Cue, ModuleCues} from '../../audio/cues';
import {line} from '../../beats4';

const END = 30.0;
const PRESSURE = {normal: 1.0, writing: 0.7} as const;

const stroke = (t: number, to: number, pressure: number): Cue => ({kind: 'stroke', t, dur: to - t, pressure});

export const cues: ModuleCues = [
  {kind: 'hit', t: line.pencilDown, name: 'pencil_down'},
  stroke(line.lineStarts, line.superWrite.from, PRESSURE.normal),
  stroke(line.superWrite.from, line.superWrite.to, PRESSURE.writing),
  stroke(line.superWrite.to, END, PRESSURE.normal),
];
