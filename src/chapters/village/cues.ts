// cues.ts — chapter 9's COMPLETE foley list (module-local seconds), from BIBLE4 §5.9 and §7.4: the folds, the
// string, the pencil (supers, interiors, figures, notes, the form, the question), the pen circles and the bubbles.
import type {Cue, ModuleCues} from '../../audio/cues';
import {SUPERS, village} from '../../beats4';
import {superCues, superFromBeat} from '../../kit';
import {FRONT_FOLD, SUPER_FIVE_AT, VISIT, VISIT_PLANS, closeAt} from './layout';

const hit = (t: number, name: Extract<Cue, {kind: 'hit'}>['name'], o: {dur?: number; gain?: number; pan?: number} = {}): Cue => ({kind: 'hit', t, name, ...o});
const pencil = (t: number, dur: number, pressure = 0.8): Cue => ({kind: 'stroke', t, dur, pressure});

const [superV2, superFive] = SUPERS.village;
if (!superV2 || !superFive) throw new Error('village: two supers expected');

/** House pops (each a fold), then the string. */
const popCues: readonly Cue[] = [
  ...village.houses.map((h) => hit(h.at, 'fold', {dur: 1.1})),
  hit(village.string.from, 'string', {dur: village.string.to - village.string.from}),
];

/** Each visit: the front wall folds open (and shut), the interior draws, the resident and Maya draw, the note. */
const visitCues: readonly Cue[] = VISIT_PLANS.flatMap((v, i) => {
  const close = closeAt(i);
  return [
    hit(v.open, 'fold', {dur: FRONT_FOLD}),
    pencil(v.open, VISIT.drawSeconds, 0.75),
    pencil(v.open + VISIT.mayaAfter, 0.5, 0.7),
    pencil(v.open + VISIT.noteAfter, 1.0, 0.9),
    ...(close === undefined ? [] : [hit(close, 'fold', {dur: FRONT_FOLD, gain: 0.6})]),
  ];
});

/** The rise: four circles in pen, the bubbles, "112" and "A4". */
const riseCues: readonly Cue[] = [
  {kind: 'stroke', t: village.countries.from, dur: village.countries.to - village.countries.from, pressure: 1.0, tool: 'pen'},
  ...village.bubbles.map((b) => hit(b.at, 'bubble_pop')),
  pencil(village.margin.from, village.margin.to - village.margin.from, 1.0),
];

/** The green: the form, the one stroke that crosses it out (pressed), the question and its chips. */
const greenCues: readonly Cue[] = [
  pencil(village.green.form.from, village.green.form.to - village.green.form.from, 0.8),
  pencil(village.green.crossOut.from, village.green.crossOut.to - village.green.crossOut.from, 1.3),
  pencil(village.green.bubble.from, village.green.bubble.to - village.green.bubble.from, 0.85),
];

export const cues: ModuleCues = [
  ...superCues(superFromBeat(superV2, {screen: 'super'})),
  ...superCues(superFromBeat(superFive, {sheet: SUPER_FIVE_AT, align: 'centre'}, {size: 62})),
  ...popCues,
  ...visitCues,
  ...riseCues,
  ...greenCues,
].slice().sort((a, b) => a.t - b.t);
