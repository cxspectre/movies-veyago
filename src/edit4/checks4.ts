// checks4.ts — the gate every v4 cut-down passes before it is registered (throws, so a broken EDL fails the bundle),
// and the caption audit (a report: the brief's rule "never over a super, a sticky note, the title or the end card").
import {FPS, sec} from '../film';
import {slotOf4, type ChapterId} from '../film4';
import {SUPERS, launch, paperToGlass, providedFor} from '../beats4';
import {EDLS4, validateEdl4, type Edl4} from '../edits4';
import {edlCaptionWindows4} from './captionTiming4';
import {protectedWindows} from './protected4';
import {edlFrames4, placeSegments4} from './place';

/** A caption must be readable: on screen at least this long. */
const MIN_CAPTION_SECONDS = 0.8;

export const edl4Problems = (edl: Edl4): readonly string[] => {
  const placed = placeSegments4(edl);
  return [
    ...validateEdl4(edl),
    ...(edlFrames4(edl) === sec(edl.targetSeconds) ? [] : [`${edl.id}: ${edlFrames4(edl)} frames, not ${sec(edl.targetSeconds)}`]),
    ...edl.segments.flatMap((s, i) => {
      const captions = s.props?.captions ?? [];
      const where = `${edl.id}[${i}] ${s.chapter} ${s.from}-${s.to}`;
      return [
        ...(captions.length > 0 && !s.props?.captionTone ? [`${where}: captions without a captionTone`] : []),
        ...captions.flatMap((c, k) => (c.at < 0 || c.at >= s.to - s.from || (k > 0 && c.at <= (captions[k - 1]?.at ?? -1)) ? [`${where}: caption "${c.text}" at ${c.at}s misplaced`] : [])),
      ];
    }),
    ...edlCaptionWindows4(edl)
      .filter((w) => (w.toFrame - w.fromFrame) / FPS < MIN_CAPTION_SECONDS)
      .map((w) => `${edl.id}[${w.segment}]: caption "${w.text}" is on screen < ${MIN_CAPTION_SECONDS}s`),
    ...(placed.length === 0 ? [`${edl.id}: no segments`] : []),
  ];
};

export const assertEdl4 = (edl: Edl4): Edl4 => {
  const problems = edl4Problems(edl);
  if (problems.length > 0) throw new Error(`Cut-down ${edl.id} is not playable:\n  ${problems.join('\n  ')}`);
  return edl;
};

// ---------------------------------------------------------------------------------------------------------------
// Caption audit: where does a caption sit over copy it must not cover?
// ---------------------------------------------------------------------------------------------------------------

export type CaptionOverlap = {edl: string; text: string; why: string; editFrom: number; editTo: number};

/** Every caption window that overlaps a protected window of the master picture under it (edit seconds). */
export const captionOverlaps = (edl: Edl4): readonly CaptionOverlap[] => {
  const placed = placeSegments4(edl);
  return edlCaptionWindows4(edl).flatMap((w) =>
    w.over.flatMap((i) => {
      const p = placed[i]!;
      const from = Math.max(w.fromFrame, p.startFrame);
      const to = Math.min(w.toFrame, p.startFrame + p.durationFrames);
      if (to <= from) return [];
      // edit frame -> module-local seconds of the segment
      const localFrom = p.segment.from + (from - p.startFrame) / FPS;
      const localTo = p.segment.from + (to - p.startFrame) / FPS;
      return protectedWindows(p.chapter)
        .filter((pw) => localFrom < pw.to && localTo > pw.from)
        .map((pw) => ({edl: edl.id, text: w.text, why: `${p.chapter} ${pw.why} ${pw.from}-${pw.to}s, caption over ${localFrom.toFixed(1)}-${localTo.toFixed(1)}s`, editFrom: from / FPS, editTo: to / FPS}));
    }),
  );
};

/** Throws for every EDL in EDLS4 that is not playable. Called by previews.ts at load. */
export const assertAllEdls4 = (): readonly Edl4[] => EDLS4.map(assertEdl4);
