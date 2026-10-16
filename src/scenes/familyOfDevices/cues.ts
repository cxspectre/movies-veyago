// cues.ts — the family of devices' COMPLETE foley list (module-local seconds; BIBLE 7.1 "1:38-1:53"): the card
// peeling off the glass, its seat on the Watch face, the pass sliding out. The hits are music's job; nothing sounds
// after the hard stop.
import type {ModuleCues} from '../../audio/cues';
import {familyOfDevices} from '../../beats';

export const cues: ModuleCues = [
  {kind: 'hit', t: familyOfDevices.hit, name: 'card_flip'},
  {kind: 'hit', t: familyOfDevices.cardLands, name: 'snap'},
  {kind: 'hit', t: familyOfDevices.walletHit, name: 'wallet_slide'},
];
