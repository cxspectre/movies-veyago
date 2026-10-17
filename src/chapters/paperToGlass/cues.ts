// cues.ts — chapter 10's COMPLETE foley list (module-local seconds), from BIBLE4 §5.10 and §7.4: the edge light's lap, the
// nine snaps (0.3 s each), the split, the card flip and its landing, the Wallet slide, the odometer for each of the four
// rolls, the tap, the plane, the title and the one quiet pencil stroke under the 2.
// The hard stop at 68.0 has no cue: it is digital silence (picture and sound on the same frame, held to 70.0), written in
// beats4 as the `hard-stop` beat and `paperToGlass.silence`; the integrator's mix must gate every other layer there.
import type {Cue, ModuleCues} from '../../audio/cues';
import {GLASS_SNAPS, paperToGlass as P} from '../../beats4';
import {numberRollCue} from '../../kit';
import {cues as titleCues} from './title/cues';

const hit = (t: number, name: Extract<Cue, {kind: 'hit'}>['name'], o: {dur?: number; gain?: number} = {}): Cue => ({kind: 'hit', t, name, ...o});

export const cues: ModuleCues = ([
  {kind: 'sweep' as const, t: P.edgeLight.lap.from, dur: P.edgeLight.lap.to - P.edgeLight.lap.from},
  ...GLASS_SNAPS.map((s) => hit(s.t, 'snap')),
  hit(P.split.from, 'snap'),
  hit(P.family.hit, 'card_flip'),
  hit(P.family.cardLands, 'snap'),
  hit(P.family.wallet, 'wallet_slide'),
  ...P.numberRolls.map((r) => {
    const c = numberRollCue({start: r.at, duration: 0.4});
    return hit(c.t, c.name, {dur: c.dur});
  }),
  hit(P.invite.tap, 'snap'),
  hit(P.invite.plane, 'plane', {dur: P.invite.farPhoneLights - P.invite.plane}),
  hit(P.invite.farPhoneLights, 'snap'),
  ...titleCues,
] as Cue[]).slice().sort((a, b) => a.t - b.t);
