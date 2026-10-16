// edlCues.ts — the cut-down's foley cue sheet, pure. Each scene module's cues (module-local seconds) are sliced to
// the segment's [from, to] and moved onto the edit's timeline; the segment's own `sfxAt` hits are added; silences
// and VO placements ride along so the mixer has one file per cut-down. Times are EDIT seconds.
import type {Cue, ModuleCues, SfxName} from '../audio/cues';
import type {Edl} from '../edits';
import {segmentSeconds} from '../edits';
import type {ModuleId} from '../film';
import {CUTDOWN_MIN_SILENCE_SECONDS, placeSegments, SILENCE_WINDOWS} from './edl';
import type {PlacedSegment} from './types';

/** Every SfxName, checked complete by the compiler (a Record over the union). */
const SFX_NAMES: Record<SfxName, true> = {
  tick: true,
  cup_down: true,
  sticky_press: true,
  sticky_smooth: true,
  pencil_down: true,
  pencil_click: true,
  pen_cap: true,
  phone_down: true,
  snap: true,
  card_flip: true,
  wallet_slide: true,
  paper_drop: true,
  ruler_tap: true,
  key_clink: true,
  coin_clink: true,
  bubble_pop: true,
  title_in: true,
  fold: true,
  scissors: true,
  crumple: true,
  stamp: true,
  string: true,
  pin: true,
  odometer: true,
  train: true,
  plane: true,
  rocket: true,
  marble_run: true,
  padlock: true,
};
const isSfxName = (name: string): name is SfxName => Object.hasOwn(SFX_NAMES, name);

/** A continuous cue cut shorter than this by a slice is dropped (the shortest stroke cue the engine emits). */
const MIN_SLICE_SECONDS = 0.04;
/** An `sfxAt` hit replaces a sliced module hit of the same name this close to it (they are the same event). */
const SAME_EVENT_SECONDS = 0.1;

const round3 = (n: number): number => Math.round(n * 1000) / 1000;

export type EditCue = Cue & {source: 'module' | 'sfxAt'; segment: number; module: ModuleId};
export type EditSilence = {start: number; end: number; reason: string};
export type EditVo = {line: number; t: number; file: string; cut?: string; segment: number};

export type EdlCueSheet = {
  edl: string;
  format: Edl['format'];
  lengthSec: number;
  cues: readonly EditCue[];
  silences: readonly EditSilence[];
  vo: readonly EditVo[];
  /** Modules that exported no `cues` yet (stubs): their slices contribute nothing but the EDL's own sfxAt. */
  modulesWithoutCues: readonly ModuleId[];
  warnings: readonly string[];
};

/** `snap_card` -> `snap`: an sfxAt key is an SfxName, optionally followed by `_<what>` for the editor's reading. */
export const sfxNameOf = (key: string): SfxName => {
  const parts = key.split('_');
  const match = parts.map((_, i) => parts.slice(0, parts.length - i).join('_')).find(isSfxName);
  if (!match) throw new Error(`sfxAt key "${key}" names no SfxName (src/audio/cues.ts)`);
  return match;
};

const sliceCue = (c: Cue, p: PlacedSegment): EditCue | undefined => {
  const {from, to} = p.segment;
  const shift = p.start - from;
  const tag = {source: 'module' as const, segment: p.index, module: p.module};
  if (c.kind === 'hit') return c.t >= from && c.t < to ? {...c, t: round3(c.t + shift), ...tag} : undefined;
  const start = Math.max(c.t, from);
  const end = Math.min(c.t + c.dur, to);
  if (end - start < MIN_SLICE_SECONDS) return undefined;
  return {...c, t: round3(start + shift), dur: round3(end - start), ...tag};
};

const sfxAtCues = (p: PlacedSegment): readonly EditCue[] =>
  Object.entries(p.segment.props?.sfxAt ?? {}).map(([key, at]) => {
    if (at < 0 || at > segmentSeconds(p.segment)) throw new Error(`sfxAt ${key} at ${at}s is outside segment ${p.index} (${segmentSeconds(p.segment)}s)`);
    return {kind: 'hit' as const, name: sfxNameOf(key), t: round3(p.start + at), source: 'sfxAt' as const, segment: p.index, module: p.module};
  });

const isSameEvent = (a: EditCue, b: EditCue): boolean =>
  a.kind === 'hit' && b.kind === 'hit' && a.name === b.name && Math.abs(a.t - b.t) <= SAME_EVENT_SECONDS;

const segmentCues = (p: PlacedSegment, moduleCues: ModuleCues): readonly EditCue[] => {
  const placedHits = sfxAtCues(p);
  const sliced = moduleCues.map((c) => sliceCue(c, p)).filter((c): c is EditCue => c !== undefined);
  return [...sliced.filter((c) => !placedHits.some((h) => isSameEvent(c, h))), ...placedHits];
};

/** Silences: a slice of a module's silence window, or the minimum silence on the cut into the title from elsewhere. */
const segmentSilences = (p: PlacedSegment, previous: PlacedSegment | undefined): readonly EditSilence[] => {
  const {from, to} = p.segment;
  const shift = p.start - from;
  const sliced = (SILENCE_WINDOWS[p.module] ?? [])
    .map((w) => ({start: Math.max(w.from, from), end: Math.min(w.to, to)}))
    .filter((w) => w.end > w.start)
    .map((w) => ({start: round3(w.start + shift), end: round3(w.end + shift), reason: `${p.module} silence (slice ${p.index})`}));
  if (sliced.length > 0 || p.module !== 'title' || previous?.module === 'title') return sliced;
  return [{start: p.start, end: round3(p.start + CUTDOWN_MIN_SILENCE_SECONDS), reason: `the cut into the title keeps ${CUTDOWN_MIN_SILENCE_SECONDS}s of silence (BIBLE 7.2)`}];
};

const segmentVo = (p: PlacedSegment): readonly EditVo[] => {
  const vo = p.segment.props?.vo;
  if (!vo) return [];
  return [{line: vo.line, t: round3(p.start + vo.at), file: `audio/vo/vo${vo.line}.wav`, segment: p.index, ...(vo.cut ? {cut: vo.cut} : {})}];
};

const cueStart = (c: EditCue): number => c.t;
const inSilence = (t: number, silences: readonly EditSilence[]): EditSilence | undefined => silences.find((s) => t >= s.start && t < s.end);

/** The whole sheet. `cuesOf` returns a module's exported cues, or undefined for a stub. */
export const edlCueSheet = (edl: Edl, cuesOf: (module: ModuleId) => ModuleCues | undefined): EdlCueSheet => {
  const placed = placeSegments(edl);
  const cues = placed.flatMap((p) => segmentCues(p, cuesOf(p.module) ?? [])).sort((a, b) => cueStart(a) - cueStart(b));
  const silences = placed.flatMap((p, i) => segmentSilences(p, placed[i - 1]));
  const vo = placed.flatMap(segmentVo);
  const warnings = [
    ...cues.flatMap((c) => {
      const s = inSilence(c.t, silences);
      return s ? [`${c.kind === 'hit' ? c.name : c.kind} at ${c.t}s (${c.source}, segment ${c.segment}) falls in the silence ${s.start}-${s.end}s and will be muted`] : [];
    }),
    ...vo.flatMap((v) => {
      const s = inSilence(v.t, silences);
      return s ? [`VO ${v.line} at ${v.t}s starts in the silence ${s.start}-${s.end}s`] : [];
    }),
  ];
  const last = placed[placed.length - 1];
  return {
    edl: edl.id,
    format: edl.format,
    lengthSec: last ? last.end : 0,
    cues,
    silences,
    vo,
    modulesWithoutCues: [...new Set(placed.map((p) => p.module).filter((m) => cuesOf(m) === undefined))],
    warnings,
  };
};
