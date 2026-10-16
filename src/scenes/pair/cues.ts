// cues.ts — the pair's COMPLETE foley list (module-local seconds; BIBLE 6.3): the one sweep. The peak and the dim
// are music's.
import type {ModuleCues} from '../../audio/cues';
import {pair} from '../../beats';

export const cues: ModuleCues = [{kind: 'sweep', t: pair.sweep.from, dur: pair.sweep.to - pair.sweep.from}];
