// cues.ts — chapter 4's COMPLETE foley list (module-local seconds), from BIBLE4 5.4 and 7.4: the four folds, the marble run
// (7.0-35.0, continuous), a stamp for every stopped card (the sound department thins them to one a second), the card landing,
// its unfold, the plane, and the pencil that writes the five gate labels and the card's line. The music is not foley.
import type {Cue, ModuleCues} from '../../audio/cues';
import {filterMachine as M} from '../../beats4';
import {PLAN, stampAt} from './layout';

const hit = (t: number, name: Extract<Cue, {kind: 'hit'}>['name'], o: {dur?: number; gain?: number} = {}): Cue => ({kind: 'hit', t, name, ...o});
const pencil = (t: number, dur: number): Cue => ({kind: 'stroke', t, dur, pressure: 0.7});

export const cues: ModuleCues = [
  ...M.popUp.parts.map((_, i) => hit(M.popUp.from + i, 'fold', {dur: 0.9})),
  hit(M.marbleRun.from, 'marble_run', {dur: M.marbleRun.to - M.marbleRun.from, gain: 0.5}),
  ...M.gateLabels.map((g) => pencil(g.at, 1.5)),
  ...PLAN.filter((p) => p.gate < 5).map((p) => hit(stampAt(p), 'stamp', {gain: 0.8})),
  hit(M.cardLands, 'paper_drop'),
  hit(M.unfold.from, 'fold', {dur: M.unfold.to - M.unfold.from}),
  pencil(M.cardText.from, M.cardText.to - M.cardText.from),
  hit(M.flyHome.from, 'plane', {dur: M.flyHome.to - M.flyHome.from}),
];
