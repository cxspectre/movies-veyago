// cues.ts — chapter 3's complete foley list (module-local seconds), from BIBLE4 5.3 and 7.4.
import type {Cue, ModuleCues} from '../../audio/cues';
import {SUPERS, theNo as B} from '../../beats4';
import {numberRollCue, superCues, superFromBeat} from '../../kit';
import {SUPER_AT, UNFOLD} from './layout';

const roll = (p: {start: number; duration: number}): Cue => ({kind: 'hit', ...numberRollCue(p)});

export const cues: ModuleCues = [
  // the two letters draw themselves, "Rejected" writes on each, the accent circles close around the words
  {kind: 'stroke', t: 0.0, dur: 1.5, pressure: 0.7},
  {kind: 'stroke', t: 1.5, dur: 1.5, pressure: 0.7},
  {kind: 'stroke', t: B.rejected[0], dur: 0.8, pressure: 0.8},
  {kind: 'stroke', t: B.rejected[1], dur: 0.8, pressure: 0.8},
  {kind: 'stroke', t: B.circles.from, dur: 0.5, pressure: 0.9},
  {kind: 'stroke', t: B.circles.from + 0.5, dur: 0.5, pressure: 0.9},
  // 4.3(a) rolls, "Design - Spam" is written beside it
  roll({start: B.guideline.at, duration: 1.0}),
  {kind: 'stroke', t: B.guideline.noteAt, dur: 1.0, pressure: 0.6},
  // the crumple is foley alone (10-12): music rests; the ball opens on a fold
  {kind: 'hit', t: B.crumple.from, name: 'crumple', dur: B.crumple.to - B.crumple.from},
  {kind: 'hit', t: B.engineUnfolds.from, name: 'fold', dur: UNFOLD.duration},
  // the super and the four gear labels are written by the pencil
  ...superCues(superFromBeat(SUPERS.theNo[0]!, {sheet: SUPER_AT, align: 'centre'})),
  ...B.gears.map((_, i): Cue => ({kind: 'stroke', t: B.engineUnfolds.from + 1 + i, dur: 0.8, pressure: 0.6})),
  // the old name, idea and purpose are scribbled onto the left panel
  {kind: 'stroke', t: 18.0, dur: 1.8, pressure: 0.5},
  // the scissors snip three times
  ...B.scissors.snips.map((t): Cue => ({kind: 'hit', t, name: 'scissors', dur: 0.4})),
  // the engine slides right, "keep" is written, the old half slides left and fades
  {kind: 'slide', t: B.split.from, dur: 1.0, pan: 0.3},
  {kind: 'slide', t: B.split.from + 0.05, dur: 1.0, pan: -0.3},
  {kind: 'stroke', t: B.split.keepLabelAt, dur: 0.6, pressure: 0.7},
  // the calendar lands, the month title is circled, the month rolls
  {kind: 'hit', t: B.calendar.land, name: 'paper_drop'},
  {kind: 'stroke', t: B.calendar.circle, dur: 0.5, pressure: 0.9},
  roll({start: B.calendar.date.at, duration: 1.0}),
  // the engine rides the line to the machine
  {kind: 'slide', t: B.carry.from, dur: B.carry.to - B.carry.from, pan: 0.2},
];
