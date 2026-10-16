// cues.ts — the desk module's COMPLETE foley cue list (module-local seconds, CONTRACT §12.5): every sheet's slide in
// (panned to pair B's side) and out (toward the stack, up-left), the `paper_drop` on each page's beat
// (beats.ts `p<n>-slide`), and every page's own pencil / object cues from its schedule, offset to its drawStart.
import type {Cue, ModuleCues} from '../../audio/cues';
import {offsetCues} from '../../paper';
import {SKETCHES} from '../../sketches/registry';
import {B_CARRY_IN, MODULE_SECONDS, PAGES} from './timing';

/** Pair B's side: right in wide, top-right in tall (one cue list serves both: the mix pans right). */
const PAN_ENTRY = 0.6;
/** Toward the stack, up-left. */
const PAN_STACK = -0.45;
const DROP_GAIN = 0.8;

const slideCues = (): readonly Cue[] =>
  PAGES.flatMap((p): Cue[] => {
    const into: Cue[] = [
      {kind: 'slide', t: p.start, dur: p.slideIn, pan: PAN_ENTRY},
      {kind: 'hit', t: p.start, name: 'paper_drop', gain: DROP_GAIN, pan: PAN_ENTRY},
    ];
    const out: Cue[] = p.slideOut.from < MODULE_SECONDS ? [{kind: 'slide', t: p.slideOut.from, dur: p.slideOut.to - p.slideOut.from, pan: PAN_STACK}] : [];
    return [...into, ...out];
  });

/** Page 1 carried in by pair B during the wide shot. */
const carryCue: Cue = {kind: 'slide', t: B_CARRY_IN.from, dur: B_CARRY_IN.to - B_CARRY_IN.from, pan: PAN_ENTRY};

const pageCues = (): readonly Cue[] =>
  PAGES.flatMap((p) => {
    const make = SKETCHES[p.id].cues;
    if (!make) throw new Error(`desk: sketch ${p.id} exports no cues`);
    return offsetCues(make(p.drawFrames), p.drawStart);
  });

/** Cues the page schedules emit past the cut belong to the wall; drop them (none expected: pages end by `end`). */
const inModule = (c: Cue): boolean => c.t >= 0 && c.t < MODULE_SECONDS;

export const cues: ModuleCues = [carryCue, ...slideCues(), ...pageCues()].filter(inModule).sort((a, b) => a.t - b.t);
