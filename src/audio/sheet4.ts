// sheet4.ts — the v4 cue sheets, pure (no file access). The master sheet puts every chapter's cues (module-local seconds)
// on the 600 s timeline and checks them against the sound rules; the cut-down sheets (cutdownSheet4) slice the same cues
// to an EDL, re-time them and clamp them at the cut points. tools/mix/masterCues4.ts and tools/mix/edlCues4.ts write
// the JSON; the tests build hand-made inputs and need no audio files. Rules: docs/v4/BIBLE4.md 7.2, docs/v4/AUDIO.md.
import type {Cue, ModuleCues, SilenceCue} from './cues';
import {isSfxName, sfxNameOf} from './sfxNames';
import type {ChapterId} from '../film4';
import {MASTER4_SECONDS, SLOTS4, slotOf4} from '../film4';
import type {Edl4, EditSegment4} from '../edits4';
import {segmentSeconds4} from '../edits4';
import type {VoLine4} from '../beats4';

const round3 = (n: number): number => Math.round(n * 1000) / 1000;

/** A protected silence in chapter-local seconds: nothing may sound inside [from, to). */
export type ProtectedSilence = {chapter: ChapterId; from: number; to: number; reason: string};

/** BIBLE4 7.2 and the chapter 11 beat sheet: the freeze, the hard stop, and the stretch before the last click. */
export const PROTECTED_SILENCES: readonly ProtectedSilence[] = [
  {chapter: 'mayasHouse', from: 28.0, to: 29.0, reason: 'the freeze: every moving thing stops, foley stops too (BIBLE4 7.2)'},
  {chapter: 'paperToGlass', from: 68.0, to: 70.0, reason: 'the hard stop: digital silence on every stem, black picture (BIBLE4 7.2)'},
  {chapter: 'providedFor', from: 24.0, to: 28.0, reason: 'the final silence: nothing sounds until the pencil click at 28.0 (BIBLE4 5.11)'},
];

/** A hit cut by a slice this close to the cut would be heard cut mid-sound (the longest one-shot tail we allow). */
export const HIT_TAIL_SECONDS = 0.4;
/** A continuous cue sliced shorter than this is dropped. */
export const MIN_SLICE_SECONDS = 0.04;
/** An `sfxAt` hit replaces a sliced chapter hit of the same name this close to it (they are the same event). */
const SAME_EVENT_SECONDS = 0.1;

export type MasterCue = Cue & {chapter: ChapterId};
export type SheetSilence = {start: number; end: number; reason: string};
export type MasterVo = {id: string; voice: string; chapter: ChapterId; t: number; estimatedEnd: number; file: string};

export type MasterSheet4 = {
  lengthSec: number;
  /** Chapter cues on the master timeline, ordered by time. Safe to hand to tools/foley/renderCues.ts. */
  cues: readonly MasterCue[];
  /** The protected silences in master seconds (v1 shape: renderCues and mix.py read `silences`). */
  silences: readonly SheetSilence[];
  /** The same silences as `silence` cues: the cue kind mix.py also understands. */
  silenceCues: readonly SilenceCue[];
  vo: readonly MasterVo[];
};

export const cueEnd = (c: Cue): number => (c.kind === 'hit' ? c.t + (c.dur ?? 0) : c.t + c.dur);

/** A cue lies in a silence when it starts inside it, or sounds across any part of it. Half-open: the click at 28.0 is fine. */
export const touchesSilence = (start: number, end: number, from: number, to: number): boolean =>
  start < to && Math.max(end, start + 1e-9) > from;

/** Problems in one chapter's cue list (module-local seconds). */
export const validateChapterCues = (chapter: ChapterId, cues: ModuleCues, length: number): readonly string[] => {
  const problems: string[] = [];
  for (const [i, c] of cues.entries()) {
    const where = `${chapter} cue[${i}] (${c.kind === 'hit' ? c.name : c.kind} at ${c.t}s)`;
    if (c.kind === 'hit' && !isSfxName(c.name)) problems.push(`${where}: unknown sound name "${c.name}"`);
    if (!Number.isFinite(c.t) || c.t < 0) problems.push(`${where}: starts before the chapter`);
    if (c.kind !== 'hit' && !(c.dur > 0)) problems.push(`${where}: needs a positive dur`);
    if (cueEnd(c) > length + 1e-6) problems.push(`${where}: ends at ${round3(cueEnd(c))}s, past the chapter's ${length}s`);
    for (const s of PROTECTED_SILENCES.filter((p) => p.chapter === chapter)) {
      if (touchesSilence(c.t, cueEnd(c), s.from, s.to)) problems.push(`${where}: sounds inside the protected silence ${s.from}-${s.to}s (${s.reason})`);
    }
  }
  return problems;
};

/** Problems in the voice-over list: lines must start inside their chapter and stay out of the protected silences. */
export const validateVo = (lines: readonly VoLine4[]): readonly string[] =>
  lines.flatMap((v) => {
    const slot = slotOf4(v.chapter);
    const length = slot.end - slot.start;
    const problems: string[] = [];
    if (v.start < 0 || v.start >= length) problems.push(`VO ${v.id}: starts at ${v.start}s, outside ${v.chapter} (0-${length}s)`);
    for (const s of PROTECTED_SILENCES.filter((p) => p.chapter === v.chapter)) {
      if (touchesSilence(v.start, v.estimatedEnd, s.from, s.to)) problems.push(`VO ${v.id}: speaks inside the protected silence ${s.chapter} ${s.from}-${s.to}s`);
    }
    return problems;
  });

const silencesOnMaster = (): readonly SheetSilence[] =>
  PROTECTED_SILENCES.map((p) => ({start: round3(p.from + slotOf4(p.chapter).start), end: round3(p.to + slotOf4(p.chapter).start), reason: p.reason})).sort((a, b) => a.start - b.start);

export const silenceCuesOf = (silences: readonly SheetSilence[]): readonly SilenceCue[] =>
  silences.map((s) => ({kind: 'silence' as const, at: s.start, dur: round3(s.end - s.start)}));

/** Build the 600 s master sheet. Throws one Error listing every problem (the CLI lets it fail loudly). */
export const buildMasterSheet4 = (cuesOf: (id: ChapterId) => ModuleCues | undefined, vo: readonly VoLine4[]): MasterSheet4 => {
  const problems: string[] = [];
  const placed: MasterCue[] = [];
  for (const slot of SLOTS4) {
    const cues = cuesOf(slot.id) ?? [];
    problems.push(...validateChapterCues(slot.id, cues, slot.end - slot.start));
    for (const c of cues) placed.push({...c, t: round3(c.t + slot.start), chapter: slot.id});
  }
  problems.push(...validateVo(vo));
  const cues = placed.sort((a, b) => a.t - b.t);
  const silences = silencesOnMaster();
  // the same rule again on the master timeline: catches an offset or slot error that the chapter-local check cannot see
  for (const c of cues) {
    const s = silences.find((x) => touchesSilence(c.t, cueEnd(c), x.start, x.end));
    if (s) problems.push(`master ${c.chapter} ${c.kind === 'hit' ? c.name : c.kind} at ${c.t}s sounds inside the silence ${s.start}-${s.end}s`);
  }
  for (const [i, c] of cues.entries()) if (c.t < (cues[i - 1]?.t ?? 0)) problems.push(`master cue ${i} is out of order`);
  const latest = Math.max(0, ...cues.map(cueEnd));
  if (latest > MASTER4_SECONDS) problems.push(`the last cue ends at ${round3(latest)}s, after the ${MASTER4_SECONDS} s master`);
  if (problems.length > 0) throw new Error(`Master cue sheet is invalid:\n  ${problems.join('\n  ')}`);
  return {
    lengthSec: MASTER4_SECONDS,
    cues,
    silences,
    silenceCues: silenceCuesOf(silences),
    vo: vo.map((v) => ({id: v.id, voice: v.voice, chapter: v.chapter, t: v.masterStart, estimatedEnd: v.estimatedMasterEnd, file: `audio/v4/vo/clips/${v.id}.wav`})),
  };
};

// ---------------------------------------------------------------------------------------------------------------
// Cut-downs (HOOK_75, CUT_180, the chapter shorts): the v1 edlCues pattern on chapters
// ---------------------------------------------------------------------------------------------------------------

export type PlacedSegment4 = {index: number; segment: EditSegment4; chapter: ChapterId; start: number; end: number; last: boolean};

/** Lay the segments end to end on the edit's timeline. */
export const placeSegments4 = (segments: readonly EditSegment4[]): readonly PlacedSegment4[] => {
  let t = 0;
  return segments.map((segment, index) => {
    const start = t;
    t = round3(t + segmentSeconds4(segment));
    return {index, segment, chapter: segment.chapter, start, end: t, last: index === segments.length - 1};
  });
};

export type EditCue4 = Cue & {source: 'chapter' | 'sfxAt'; segment: number; chapter: ChapterId; clamped?: 'start' | 'end' | 'both'};
export type EditVo4 = {line: string; t: number; file: string; cut?: string; segment: number};
export type CutdownSheet4 = {
  edl: string;
  format: Edl4['format'];
  lengthSec: number;
  cues: readonly EditCue4[];
  silences: readonly SheetSilence[];
  silenceCues: readonly SilenceCue[];
  vo: readonly EditVo4[];
  /** Cues dropped because they could not be cut cleanly, or sounds that fall in a silence. Printed by the CLI. */
  warnings: readonly string[];
};

/**
 * Slice one cue to a segment. The rules, so no cue is cut mid-sound:
 *  - a hit stays whole if it starts inside [from, to); a hit that starts within HIT_TAIL_SECONDS of a cut that is
 *    followed by more picture is dropped (its tail would be chopped); a hit with a `dur` has its dur clamped instead;
 *  - a continuous cue is clamped to the slice and marked `clamped` so the renderer can fade the cut ends;
 *  - anything shorter than MIN_SLICE_SECONDS after clamping is dropped.
 */
export const sliceCue4 = (c: Cue, p: PlacedSegment4): EditCue4 | undefined => {
  const {from, to} = p.segment;
  const shift = p.start - from;
  const tag = {source: 'chapter' as const, segment: p.index, chapter: p.chapter};
  if (c.kind === 'hit') {
    if (c.t < from || c.t >= to) return undefined;
    const room = to - c.t;
    if (c.dur !== undefined) {
      if (room < MIN_SLICE_SECONDS) return undefined;
      const dur = Math.min(c.dur, room);
      return {...c, t: round3(c.t + shift), dur: round3(dur), ...tag, ...(dur < c.dur ? {clamped: 'end' as const} : {})};
    }
    if (room < HIT_TAIL_SECONDS && !p.last) return undefined;
    return {...c, t: round3(c.t + shift), ...tag};
  }
  const start = Math.max(c.t, from);
  const end = Math.min(c.t + c.dur, to);
  if (end - start < MIN_SLICE_SECONDS) return undefined;
  const cutStart = c.t < from;
  const cutEnd = c.t + c.dur > to;
  const clamped = cutStart && cutEnd ? 'both' : cutStart ? 'start' : cutEnd ? 'end' : undefined;
  return {...c, t: round3(start + shift), dur: round3(end - start), ...tag, ...(clamped ? {clamped} : {})};
};

/** `sfxAt` keys are SfxNames, optionally `_<what>` (as v1). */
const sfxAtCues4 = (p: PlacedSegment4): readonly EditCue4[] =>
  Object.entries(p.segment.props?.sfxAt ?? {}).map(([key, at]) => {
    if (at < 0 || at > segmentSeconds4(p.segment)) throw new Error(`sfxAt ${key} at ${at}s is outside segment ${p.index} (${segmentSeconds4(p.segment)}s)`);
    return {kind: 'hit' as const, name: sfxNameOf(key), t: round3(p.start + at), source: 'sfxAt' as const, segment: p.index, chapter: p.chapter};
  });

const sameEvent = (a: EditCue4, b: EditCue4): boolean => a.kind === 'hit' && b.kind === 'hit' && a.name === b.name && Math.abs(a.t - b.t) <= SAME_EVENT_SECONDS;

/** The protected silences that fall in this segment, moved onto the edit's timeline. */
const segmentSilences4 = (p: PlacedSegment4): readonly SheetSilence[] =>
  PROTECTED_SILENCES.filter((s) => s.chapter === p.chapter)
    .map((s) => ({start: Math.max(s.from, p.segment.from), end: Math.min(s.to, p.segment.to), reason: `${s.chapter}: ${s.reason}`}))
    .filter((s) => s.end > s.start)
    .map((s) => ({start: round3(s.start + p.start - p.segment.from), end: round3(s.end + p.start - p.segment.from), reason: s.reason}));

/** Merge touching silences (two slices that each hold half of one silence become one). */
const mergeSilences = (list: readonly SheetSilence[]): readonly SheetSilence[] => {
  const out: SheetSilence[] = [];
  for (const s of [...list].sort((a, b) => a.start - b.start)) {
    const last = out[out.length - 1];
    if (last && s.start <= last.end + 1e-6) out[out.length - 1] = {...last, end: Math.max(last.end, s.end)};
    else out.push(s);
  }
  return out;
};

/** The cut-down's cue sheet for one EDL. `cuesOf` returns a chapter's exported cues (chapter-local seconds). */
export const cutdownSheet4 = (edl: Pick<Edl4, 'id' | 'format' | 'segments'>, cuesOf: (id: ChapterId) => ModuleCues | undefined): CutdownSheet4 => {
  const placed = placeSegments4(edl.segments);
  const cues = placed
    .flatMap((p) => {
      const hits = sfxAtCues4(p);
      const sliced = (cuesOf(p.chapter) ?? []).map((c) => sliceCue4(c, p)).filter((c): c is EditCue4 => c !== undefined);
      return [...sliced.filter((c) => !hits.some((h) => sameEvent(c, h))), ...hits];
    })
    .sort((a, b) => a.t - b.t);
  const silences = mergeSilences(placed.flatMap(segmentSilences4));
  const vo = placed.flatMap((p): EditVo4[] => {
    const v = p.segment.props?.vo;
    return v ? [{line: v.line, t: round3(p.start + v.at), file: `audio/v4/vo/clips/${v.line}.wav`, segment: p.index, ...(v.cut ? {cut: v.cut} : {})}] : [];
  });
  const warnings = [
    ...cues.flatMap((c) => {
      const s = silences.find((x) => touchesSilence(c.t, cueEnd(c), x.start, x.end));
      return s ? [`${c.kind === 'hit' ? c.name : c.kind} at ${c.t}s (${c.source}, segment ${c.segment}) falls in the silence ${s.start}-${s.end}s and will be muted`] : [];
    }),
    ...vo.flatMap((v) => {
      const s = silences.find((x) => v.t >= x.start && v.t < x.end);
      return s ? [`VO ${v.line} at ${v.t}s starts in the silence ${s.start}-${s.end}s`] : [];
    }),
  ];
  const last = placed[placed.length - 1];
  return {edl: edl.id, format: edl.format, lengthSec: last ? last.end : 0, cues, silences, silenceCues: silenceCuesOf(silences), vo, warnings};
};
