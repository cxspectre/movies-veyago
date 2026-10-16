// cues.ts — a page's foley from its own drawing schedule (BIBLE §4 intro): pencil `stroke` cues from the engine,
// plus object hits. A hit that REPLACES its stroke's sound (a coin, a key's teeth) silences that stroke's pencil
// cues; a hit that ACCOMPANIES it (the ruler being laid down) keeps them.
import type {Cue, ModuleCues, SfxName} from '../../audio/cues';
import {FPS} from '../../film';
import {compileSketch, strokeCues, type SketchSpec} from '../../paper';

export type PageHit = {
  /** Stroke id the hit belongs to; it fires when the pencil first lands on that stroke. */
  readonly id: string;
  readonly name: SfxName;
  /** true: the hit is the stroke's sound (no pencil cue for it). false: both are heard. */
  readonly replacesStroke: boolean;
};

/** The id-prefix rule of BIBLE §4: these prefixes mean a hit at the stroke's start instead of pencil sound. */
const PREFIX_HITS: readonly (readonly [string, SfxName])[] = [
  ['tick-', 'tick'],
  ['coin-', 'coin_clink'],
  ['key-', 'key_clink'],
  ['bubble-', 'bubble_pop'],
];

/** Hits the prefix rule gives a spec's strokes. */
export const prefixHits = (spec: SketchSpec): readonly PageHit[] =>
  spec.strokes.flatMap((s) => {
    const rule = PREFIX_HITS.find(([prefix]) => s.id.startsWith(prefix));
    return rule ? [{id: s.id, name: rule[1], replacesStroke: true}] : [];
  });

/** Seconds from the page's start at which the pencil first touches stroke `id`. */
const landingSeconds = (spec: SketchSpec, id: string, drawFrames: number): number => {
  const starts = compileSketch(spec)
    .filter((m) => m.strokeId === id)
    .map((m) => m.start);
  if (starts.length === 0) {
    throw new Error(`pageCues: no stroke "${id}" in sketch "${spec.id}"`);
  }
  return (Math.min(...starts) * drawFrames) / FPS;
};

/** Complete cue list for a page drawn in `drawFrames`, in seconds from the page's own start, sorted by time. */
export const pageCues = (spec: SketchSpec, drawFrames: number, hits: readonly PageHit[]): ModuleCues => {
  const silenced = new Set(hits.filter((h) => h.replacesStroke).map((h) => h.id));
  const audible: SketchSpec = {...spec, strokes: spec.strokes.filter((s) => !silenced.has(s.id))};
  const pencil = strokeCues(audible, drawFrames);
  const objects: Cue[] = hits.map((h) => ({kind: 'hit', t: landingSeconds(spec, h.id, drawFrames), name: h.name}));
  return [...pencil, ...objects].sort((a, b) => a.t - b.t);
};
