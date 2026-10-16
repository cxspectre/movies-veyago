// cues.ts — the transition's COMPLETE foley list (module-local seconds; CONTRACT 12.5, BIBLE 5.4-5.5 and 7.1).
// Strokes catching light have NO pencil sound (foley hands over to music at 1:31); the band's lap is a `sweep`, the
// four UI snaps are `snap` hits on the beats.
import type {Cue, ModuleCues} from '../../audio/cues';
import {transition} from '../../beats';

const {lap} = transition.edgeLight;

export const cues: ModuleCues = [
  {kind: 'sweep', t: lap.from, dur: lap.to - lap.from},
  ...transition.snaps.map((s): Cue => ({kind: 'hit', t: s.t, name: 'snap'})),
];
