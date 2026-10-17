// beats.ts — the v1 title's `title` constants, re-read from chapter 10's timeline (src/beats4.ts `paperToGlass`), so the
// copied v1 title code keeps its shape and no time is re-typed. Module-local seconds (chapter 10: 0-80).
import {paperToGlass} from '../../../beats4';

const {hardStop, silence, title: t} = paperToGlass;

export const title = {
  black: {from: hardStop, to: silence.to},
  silence,
  swellIn: t.word.from,
  word: {from: t.word.from, to: t.word.to, text: 'Provisum', letterStagger: 0.12, letterFade: 0.6},
  strokeTwo: {from: t.strokeTwo.from, to: t.strokeTwo.to, completesAt: t.resolve},
  resolve: t.resolve,
  subline: {at: t.subline, fadeSeconds: 1.0},
} as const;
