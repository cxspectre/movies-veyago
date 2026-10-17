// cues.ts — chapter 11's COMPLETE foley list (module-local seconds), from BIBLE4 §5.11 and §7: the line's last stretch,
// the pencil set down, and the click at 28.0, the last sound of the film. Nothing sounds between the final chord's decay
// (24.0) and the click. The music (felt piano alone, the warm chord at 20.0) is not foley and is not listed here.
import type {ModuleCues} from '../../audio/cues';
import {providedFor as B} from '../../beats4';
import {SET_DOWN} from './layout';

export const cues: ModuleCues = [
  // the line draws its last stretch (2.0-11.0), ending at the pencil's tip
  {kind: 'stroke', t: B.lastStretch.from, dur: B.lastStretch.to - B.lastStretch.from, pressure: 0.8},
  // the pencil rises and sets itself down (15.0-17.0): a faint cloth stroke under it, then the wood meeting the table
  {kind: 'stroke', t: B.pencilSetsDown.from, dur: B.pencilSetsDown.to - B.pencilSetsDown.from, pressure: 0.2},
  {kind: 'hit', t: SET_DOWN.to - 0.3, name: 'pencil_down', gain: 0.5},
  // the last sound of the film: no tail beyond 0.4 s
  {kind: 'hit', t: B.pencilClick, name: 'pencil_click'},
];
