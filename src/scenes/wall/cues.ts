// cues.ts — the wall's COMPLETE foley list (module-local seconds; CONTRACT §12.5, BIBLE §7.1): fourteen sheets
// landing in seven pairs on the half-seconds (`paper_drop`, panned to where each lands), the phone set face down
// (`phone_down`, heavier), and the centre sheet's own pencil strokes (the chips and their circle, 5.1-8.3).
import type {Cue, ModuleCues} from '../../audio/cues';
import {slotSeconds, wall} from '../../beats';
import {FPS} from '../../film';
import {offsetCues, strokeCues} from '../../paper';
import {spec} from '../../sketches/binder-home-v2';
import {dropPlan} from './drops';
import {gridBounds, slotOfTile} from './grid';

/** Sound follows the master picture (16:9). */
const FORMAT = 'wide' as const;
/** Pan range across the grid (-1 left .. +1 right), held inside the image. */
const PAN_SPREAD = 0.7;
const SHEET_GAIN = 0.8;
const PHONE_GAIN = 1.0;

const panOf = (x: number): number => {
  const b = gridBounds(FORMAT);
  const k = (x - b.x0) / (b.x1 - b.x0);
  return Math.round((k * 2 - 1) * PAN_SPREAD * 100) / 100;
};

const landings: readonly Cue[] = dropPlan(FORMAT).map((d) => ({
  kind: 'hit' as const,
  t: d.landsAt,
  name: d.tile === 'phone' ? ('phone_down' as const) : ('paper_drop' as const),
  gain: d.tile === 'phone' ? PHONE_GAIN : SHEET_GAIN,
  pan: panOf(slotOfTile(FORMAT, d.tile).centre.x),
}));

/** The centre sheet runs from `sequenceFrom` frames: only what it draws inside the module is heard. */
const centreStrokes: readonly Cue[] = offsetCues(strokeCues(spec, wall.centreSheet.drawFrames), wall.centreSheet.sequenceFrom / FPS).filter(
  (c) => c.t >= 0 && c.t < slotSeconds('wall'),
);

export const cues: ModuleCues = [...landings, ...centreStrokes].sort((a, b) => a.t - b.t);
