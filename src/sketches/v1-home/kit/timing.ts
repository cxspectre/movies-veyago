// timing.ts — place untimed strokes/labels into the exact fraction windows the bible gives, and build the page's
// foley cues with the id-prefix rules (BIBLE section 4: `tick-`, `coin-`, `key-`, `bubble-` are hits at their start).
import type {Cue, ModuleCues, SfxName} from '../../../audio/cues';
import {FPS} from '../../../film';
import {sequence, strokeCues, type Untimed} from '../../../paper';
import type {LabelSpec, SketchSpec, StrokeSpec} from '../../../paper/types';

export type Timed = {readonly strokes: readonly StrokeSpec[]; readonly labels: readonly LabelSpec[]};
export type Span = readonly [from: number, to: number];

/** Spread items across a window in proportion to how long each takes to draw (the engine's own costing). */
export const spread = (items: readonly Untimed[], [from, to]: Span, gap = 0.12): Timed => sequence(items, from, to, gap);

/** Concatenate timed groups into one page spec. */
export const page = (id: string, groups: readonly Timed[]): SketchSpec => ({
  id,
  strokes: groups.flatMap((g) => g.strokes),
  labels: groups.flatMap((g) => g.labels),
});

const HIT_PREFIXES: readonly (readonly [prefix: string, name: SfxName])[] = [
  ['tick-', 'tick'],
  ['coin-', 'coin_clink'],
  ['key-', 'key_clink'],
  ['bubble-', 'bubble_pop'],
];

const hitOf = (id: string): SfxName | undefined => HIT_PREFIXES.find(([p]) => id.startsWith(p))?.[1];

/** Fraction of drawFrames -> seconds from the page's own start. */
export const fractionToSeconds = (fraction: number, drawFrames: number): number => (fraction * drawFrames) / FPS;

/**
 * cues(drawFrames) for a page: 'stroke' cues from the drawing schedule for every ordinary stroke and label, a hit at
 * the START of every prefixed stroke, plus any extra cues (e.g. an erase). `soundOnly` strokes (drawn by a separate
 * layer, such as an erased ghost) are heard but are not part of `spec`.
 */
export const makeCues = (
  spec: SketchSpec,
  extra: (drawFrames: number) => readonly Cue[] = () => [],
  soundOnly: readonly StrokeSpec[] = [],
): ((drawFrames: number) => ModuleCues) => {
  const heard: SketchSpec = {...spec, strokes: [...spec.strokes, ...soundOnly].filter((s) => hitOf(s.id) === undefined)};
  return (drawFrames: number): ModuleCues => {
    const hits: readonly Cue[] = spec.strokes.flatMap((s) => {
      const name = hitOf(s.id);
      return name ? [{kind: 'hit' as const, t: fractionToSeconds(Math.min(s.from, s.to), drawFrames), name}] : [];
    });
    return [...strokeCues(heard, drawFrames), ...hits, ...extra(drawFrames)].sort((a, b) => a.t - b.t);
  };
};
