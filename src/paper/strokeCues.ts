// strokeCues.ts — foley cues from the exact drawing schedule the renderer uses (module/page-local seconds).
import type {Cue, ModuleCues} from '../audio/cues';
import {FPS} from '../film';
import {compileSketch} from './marks/compile';
import type {Mark} from './marks/types';
import type {SketchSpec} from './types';

/** Movements of the same stroke closer than this are heard as one continuous sound. */
const MERGE_GAP_S = 0.06;
const MIN_CUE_S = 0.04;

type Run = {id: string; word: number; t0: number; t1: number; pressureSum: number; weight: number};

const toSeconds = (fraction: number, drawFrames: number): number => (fraction * drawFrames) / FPS;

const pressureOf = (m: Mark): number => {
  if (m.kind === 'glyph') return 0.6 * m.deposit;
  const mean = m.pts.reduce((a, p) => a + p.p, 0) / Math.max(1, m.pts.length);
  return mean * m.deposit;
};

const runsOf = (marks: readonly Mark[], drawFrames: number): readonly Run[] =>
  marks.reduce<Run[]>((runs, m) => {
    const t0 = toSeconds(m.start, drawFrames);
    const t1 = toSeconds(m.end, drawFrames);
    const word = m.kind === 'glyph' ? m.word : -1;
    const dur = t1 - t0;
    const last = runs[runs.length - 1];
    if (last && last.id === m.strokeId && last.word === word && t0 - last.t1 <= MERGE_GAP_S) {
      const merged = {...last, t1: Math.max(last.t1, t1), pressureSum: last.pressureSum + pressureOf(m) * dur, weight: last.weight + dur};
      return [...runs.slice(0, -1), merged];
    }
    return [...runs, {id: m.strokeId, word, t0, t1, pressureSum: pressureOf(m) * dur, weight: dur}];
  }, []);

/**
 * 'stroke' cues for every pencil movement (merged per stroke / per written word) and a 'tick' hit for strokes
 * marked `tick: true`, timed from the page's own start in seconds. Add the page's offset in the module yourself.
 */
export const strokeCues = (spec: SketchSpec, drawFrames: number): ModuleCues => {
  const strokes: Cue[] = runsOf(compileSketch(spec), drawFrames).map((r) => ({
    kind: 'stroke' as const,
    t: r.t0,
    dur: Math.max(MIN_CUE_S, r.t1 - r.t0),
    pressure: Math.round((r.weight > 0 ? r.pressureSum / r.weight : 0.5) * 100) / 100,
    tool: 'pencil' as const,
  }));
  const ticks: Cue[] = spec.strokes
    .filter((s) => s.tick === true)
    .map((s) => ({kind: 'hit' as const, t: toSeconds(Math.max(s.from, s.to), drawFrames), name: 'tick' as const}));
  return [...strokes, ...ticks].sort((a, b) => a.t - b.t);
};

/** Shift a page's cues by an offset (seconds), e.g. to where the page starts inside a module. */
export const offsetCues = (cues: ModuleCues, seconds: number): ModuleCues => cues.map((c) => ({...c, t: c.t + seconds}));
