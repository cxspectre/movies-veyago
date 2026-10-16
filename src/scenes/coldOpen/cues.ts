// cues.ts — the cold open's COMPLETE foley cue list, module-local seconds (CONTRACT 12.5, BIBLE 7.1): the v1-home
// page's own stroke and tick cues (offset to its start and re-timed exactly as the picture re-times the body for
// hand A's pencil swap), the cup, the sticky note's press and smoothing, the fineliner's cap and its lettering.
import type {Cue, ModuleCues} from '../../audio/cues';
import {coldOpen} from '../../beats';
import {offsetCues, strokeCues} from '../../paper';
import {cues as v1Cues} from '../../sketches/v1-home';
import {COLD_OPEN_LAYOUT} from './layout';
import {LETTERING_FRAMES, letteringSpec} from './lettering';
import {realSecondsOfPage, V1_DRAW_FRAMES, V1_FROM} from './timing';

const round3 = (n: number): number => Math.round(n * 1000) / 1000;

/** Page time -> picture time, for an instant or a window (a stroke squeezed by the faster body is heard squeezed). */
const retime = (c: Cue): Cue => {
  const t = realSecondsOfPage(c.t);
  if (c.kind === 'hit') return {...c, t: round3(t)};
  return {...c, t: round3(t), dur: round3(realSecondsOfPage(c.t + c.dur) - t)};
};

const pageCues: ModuleCues = offsetCues(v1Cues(V1_DRAW_FRAMES), V1_FROM).map(retime);

/** The fineliner is a pen, not a pencil: a faint squeak (BIBLE 7.1). Same geometry in both formats. */
const letteringCues: ModuleCues = offsetCues(strokeCues(letteringSpec(COLD_OPEN_LAYOUT.wide.note), LETTERING_FRAMES), coldOpen.lettering.from).map((c) =>
  c.kind === 'stroke' ? {...c, t: round3(c.t), dur: round3(c.dur), tool: 'pen' as const} : {...c, t: round3(c.t)},
);

const hits: ModuleCues = [
  {kind: 'hit', t: coldOpen.cupDown, name: 'cup_down'},
  {kind: 'hit', t: coldOpen.stickyPress, name: 'sticky_press'},
  // The note is smoothed over stickySmooth and lands flat on the chord: the cue sits where beats.ts puts it.
  {kind: 'hit', t: coldOpen.chord, name: 'sticky_smooth'},
  {kind: 'hit', t: coldOpen.penCap, name: 'pen_cap'},
];

export const cues: ModuleCues = [...pageCues, ...hits, ...letteringCues].sort((a, b) => a.t - b.t);
