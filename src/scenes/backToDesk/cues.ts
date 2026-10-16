// cues.ts — back-to-desk's COMPLETE foley list (module-local seconds; CONTRACT §12.5, BIBLE §7.1). The room is the
// sound department's (room tone, the cloth of the moving hand); the one placed hit is the faint wood tap as the
// pencil passes the ruler when the lowering starts (2:29). From `hover` (2:32.5) NOTHING: the click is on the end
// card (endCard.pencilClick), not here.
import type {ModuleCues} from '../../audio/cues';
import {backToDesk} from '../../beats';

/** Faint: it is the room, not an event. */
const WOOD_TAP_GAIN = 0.25;
/** The hand enters from the bottom right of the frame. */
const HAND_PAN = 0.25;

export const cues: ModuleCues = [{kind: 'hit', t: backToDesk.pencilLower.from, name: 'ruler_tap', gain: WOOD_TAP_GAIN, pan: HAND_PAN}];
