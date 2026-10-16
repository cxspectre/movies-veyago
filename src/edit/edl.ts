// edl.ts — pure timeline maths for the cut-downs: where each EDL segment sits on the edit's timeline, which slices
// are pure black, and the checks that make a broken EDL fail loudly at module load.
import {coldOpen as coldOpenBeats, title as titleBeats, type Window} from '../beats';
import type {EditSegment, Edl} from '../edits';
import {edlFrames, segmentFrames, segmentSeconds, validateEdl} from '../edits';
import {sec, slotOf, type ModuleId} from '../film';
import type {PlacedSegment} from './types';

const round3 = (n: number): number => Math.round(n * 1000) / 1000;

/** Modules whose own picture is the copy: a burned-in caption never sits over them (BIBLE §7.4). */
export const CAPTION_FREE_MODULES: readonly ModuleId[] = ['title', 'endCard'];

/** Windows the beat sheet declares pure black (module-local seconds). A slice wholly inside one is drawn as #000. */
export const BLACK_WINDOWS: Partial<Record<ModuleId, readonly Window[]>> = {
  coldOpen: [coldOpenBeats.black],
  title: [titleBeats.black],
};

/** Module-local silence windows (all stems cut) a slice can land in. BIBLE §7.2. */
export const SILENCE_WINDOWS: Partial<Record<ModuleId, readonly Window[]>> = {
  title: [titleBeats.silence],
};

/** The cut into the title from another module keeps at least this much silence (BIBLE §7.2, DECISIONS #15). */
export const CUTDOWN_MIN_SILENCE_SECONDS = 0.5;

export const isBlackSlice = (s: EditSegment): boolean =>
  (BLACK_WINDOWS[s.module] ?? []).some((w) => s.from >= w.from && s.to <= w.to);

/** Composition id for an EDL: `Vertical45` -> `Vertical45-tall`; ids that already name their format keep it. */
export const compositionIdOf = (edl: Edl): string => (edl.id.endsWith(`-${edl.format}`) ? edl.id : `${edl.id}-${edl.format}`);

/** Every segment of an EDL placed on the edit timeline, back to back, with hard cuts. */
export const placeSegments = (edl: Edl): readonly PlacedSegment[] =>
  edl.segments.reduce<PlacedSegment[]>((placed, segment, index) => {
    const previous = placed[placed.length - 1];
    const startFrame = previous ? previous.startFrame + previous.durationFrames : 0;
    const start = previous ? previous.end : 0;
    const slotStart = slotOf(segment.module).start;
    return [
      ...placed,
      {
        index,
        segment,
        module: segment.module,
        startFrame,
        durationFrames: segmentFrames(segment),
        moduleFromFrame: sec(segment.from),
        start,
        end: round3(start + segmentSeconds(segment)),
        masterFrom: round3(slotStart + segment.from),
        masterTo: round3(slotStart + segment.to),
        black: isBlackSlice(segment),
      },
    ];
  }, []);

const captionProblems = (edl: Edl, s: EditSegment, i: number): readonly string[] => {
  const captions = s.props?.captions ?? [];
  const tone = s.props?.captionTone;
  const where = `${edl.id}[${i}] ${s.module} ${s.from}-${s.to}`;
  const length = segmentSeconds(s);
  const sorted = captions.every((c, k) => k === 0 || c.at > (captions[k - 1]?.at ?? -1));
  const covered = captions.length > 0 || tone !== undefined;
  return [
    ...(captions.length > 0 && edl.format !== 'tall' ? [`${where}: captions are burned into the 9:16 versions only`] : []),
    ...(covered && CAPTION_FREE_MODULES.includes(s.module) ? [`${where}: no caption over the ${s.module} (it is the copy)`] : []),
    ...(captions.length > 0 && !tone ? [`${where}: captions without a captionTone ('paper' or 'glass')`] : []),
    ...(covered && isBlackSlice(s) ? [`${where}: caption over a black slice`] : []),
    ...(sorted ? [] : [`${where}: caption times must increase`]),
    ...captions.flatMap((c) => [
      ...(c.at < 0 || c.at >= length ? [`${where}: caption "${c.text}" at ${c.at}s is outside the segment`] : []),
      ...(c.text.trim().length === 0 ? [`${where}: empty caption`] : []),
    ]),
  ];
};

/** Everything `validateEdl` checks, plus the player's own rules (frames add up, captions are placeable). */
export const edlProblems = (edl: Edl): readonly string[] => [
  ...validateEdl(edl),
  ...(edlFrames(edl.segments) === sec(edl.targetSeconds) ? [] : [`${edl.id}: ${edlFrames(edl.segments)} frames, not ${sec(edl.targetSeconds)}`]),
  ...edl.segments.flatMap((s, i) => captionProblems(edl, s, i)),
];
