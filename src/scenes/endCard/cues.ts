// cues.ts — the end card's COMPLETE cue list (module-local seconds): the click of the pencil being set down, the last
// sound of the film (BIBLE 6.5, 7.1). The fades are silent.
import type {ModuleCues} from '../../audio/cues';
import {endCard} from '../../beats';

export const cues: ModuleCues = [{kind: 'hit', t: endCard.pencilClick, name: 'pencil_click'}];
