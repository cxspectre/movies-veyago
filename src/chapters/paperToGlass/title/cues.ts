// cues.ts — the title's COMPLETE foley/hit list (module-local seconds; CONTRACT 12.5, BIBLE 6.1 and 7.1).
import type {Cue, ModuleCues} from '../../../audio/cues';
import {title} from './beats';
import {sec} from '../../../film';
import {strokeCues} from '../../../paper';
import {sizedTwo} from './twoSize';

/** The one pencil sound in the void sits under the resolve: quieter than any stroke on the desk. */
const QUIET_PENCIL = 0.55;

const strokeDrawFrames = sec(title.strokeTwo.completesAt - title.strokeTwo.from);
/** Same geometry as the wide picture; the sound does not depend on the format. */
const spec = sizedTwo('wide').spec;

/** The stroke of the 2, one continuous movement from 4.0 to 5.0, at a quiet pressure. */
const twoStroke: readonly Cue[] = strokeCues(spec, strokeDrawFrames).map((c) =>
  c.kind === 'stroke' ? {...c, t: c.t + title.strokeTwo.from, pressure: Math.round((c.pressure ?? 1) * QUIET_PENCIL * 100) / 100} : {...c, t: c.t + title.strokeTwo.from},
);

export const cues: ModuleCues = [{kind: 'hit', t: title.swellIn, name: 'title_in'}, ...twoStroke];
