// cues.ts — the realThing's COMPLETE foley list (CONTRACT 12.5): deliberately empty.
//
// Decision: no foley under the nine cuts. Every cut lands on a beat of the 60 BPM ostinato (FEATURE_CUTS, all on the
// 0.5 s grid), so the music already marks each one; a glass tick per cut would double the beat, crowd VO 7 (2:04.5 to
// about 2:13.5) and turn the evidence into a slideshow. BIBLE 7.1 gives this module no foley either: the hits are music's job.
// If the mix wants a mark anyway, `cutTimes` lists the cut instants (module-local seconds) to hang one on.
import type {ModuleCues} from '../../audio/cues';
import {FEATURE_CUTS} from '../../beats';

export const cues: ModuleCues = [];

/** Module-local seconds of every hard cut after the first (the first is the module's own start). */
export const cutTimes: readonly number[] = FEATURE_CUTS.slice(1).map((c) => c.start);
