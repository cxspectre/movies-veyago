// cues.ts — chapter 5's COMPLETE foley list (module-local seconds), from BIBLE4 5.5 and 7.4: the pencil (frame, labels, supers,
// the 2x2, the circle), six pins then a pin per card, cards dropping on the cork, the string pulling tight, seven pins along the
// edges, four peels, six folds, the boxes landing on the truck and the truck rolling. The music is not foley.
import type {Cue, ModuleCues} from '../../audio/cues';
import {researchBoard as M} from '../../beats4';
import {superCues} from '../../kit';
import {pinSecond} from './layout';
import {BOARD_SUPERS} from './supers';

const hit = (t: number, name: Extract<Cue, {kind: 'hit'}>['name'], o: {dur?: number; gain?: number} = {}): Cue => ({kind: 'hit', t, name, ...o});
const pencil = (t: number, dur: number, pressure = 0.8): Cue => ({kind: 'stroke', t, dur, pressure});

export const cues: ModuleCues = [
  pencil(M.frame.from, M.frame.to - M.frame.from, 0.8),
  ...Array.from({length: 6}, (_, i) => hit(pinSecond(i), 'pin')),
  ...M.cards.flatMap((c) => [hit(c.at, 'paper_drop'), hit(c.at + M.cardPinAfter, 'pin'), pencil(c.at + 0.5, 1.4, 0.7)]),
  ...BOARD_SUPERS.flatMap((s) => superCues(s)),
  hit(M.string.from, 'string', {dur: M.string.to - M.string.from}),
  pencil(M.chart.axes.from, M.chart.axes.to - M.chart.axes.from, 0.8),
  pencil(M.chart.labels.from, M.chart.labels.to - M.chart.labels.from, 0.7),
  ...Array.from({length: 7}, (_, i) => hit(M.chart.dots.from + i * 0.28, 'pin', {gain: 0.8})),
  pencil(M.chart.circle.from, M.chart.circle.to - M.chart.circle.from, 0.9),
  ...Array.from({length: 4}, (_, i) => hit(M.peel.from + i * 0.4, 'fold', {dur: 0.8})),
  ...M.boxes.map((b) => hit(b.at, 'fold', {dur: 0.9})),
  ...M.boxes.map((b) => pencil(b.at + 0.7, 0.6, 0.7)),
  ...M.boxes.map((_, k) => hit(M.stack.from + k * M.stack.every + 0.45, 'paper_drop', {gain: 0.8})),
  {kind: 'slide', t: M.roll.from, dur: M.roll.to - M.roll.from},
];
