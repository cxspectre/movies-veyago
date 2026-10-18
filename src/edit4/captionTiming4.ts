// captionTiming4.ts — when each burned-in caption of a v4 cut-down is on screen, in EDIT frames. The rules are v1's
// (src/edit/captionTiming.ts, BIBLE4 §6): a caption starts at its `at` and holds until the next caption of its
// segment; the last caption of a segment holds across the cut into following segments that have a `captionTone` and
// no captions, and ends on the cut into a segment with its own captions or no tone. Fades, the hold-over-swap and the
// tone rule are the v1 ones (captionOpacity is imported from there, unchanged).
import type {CaptionTone} from '../edits';
import {sec} from '../film';
import type {CaptionWindow} from '../edit/captionTiming';
import type {Edl4} from '../edits4';
import {protectedWindows} from './protected4';
import {placeSegments4, type PlacedSegment4} from './place';

/** A caption clipped to end where copy begins must still be readable. */
const MIN_CLIPPED_FRAMES = sec(0.8);

export {captionOpacity} from '../edit/captionTiming';
export type {CaptionWindow};

const hasCaptions = (p: PlacedSegment4): boolean => (p.segment.props?.captions?.length ?? 0) > 0;
const carriesOn = (p: PlacedSegment4): boolean => !hasCaptions(p) && p.segment.props?.captionTone !== undefined;

const continuationOf = (placed: readonly PlacedSegment4[], index: number): readonly PlacedSegment4[] => {
  const after = placed.slice(index + 1);
  const stop = after.findIndex((p) => !carriesOn(p));
  return stop === -1 ? after : after.slice(0, stop);
};

const segmentWindows = (placed: readonly PlacedSegment4[], p: PlacedSegment4): readonly CaptionWindow[] => {
  const captions = p.segment.props?.captions ?? [];
  const continuation = continuationOf(placed, p.index);
  const lastOver = continuation[continuation.length - 1] ?? p;
  const runEnd = lastOver.startFrame + lastOver.durationFrames;
  return captions.map((c, i) => {
    const next = captions[i + 1];
    const isLast = next === undefined;
    return {
      text: c.text,
      fromFrame: p.startFrame + sec(c.at),
      toFrame: isLast ? runEnd : p.startFrame + sec(next.at),
      segment: p.index,
      over: isLast ? [p.index, ...continuation.map((s) => s.index)] : [p.index],
    };
  });
};

/** Edit frames where a super, the sticky notes, the title or the end card BEGIN, over the segments a window is drawn on. */
const protectedStarts = (placed: readonly PlacedSegment4[], w: CaptionWindow): readonly number[] =>
  w.over.flatMap((i) => {
    const p = placed[i]!;
    return protectedWindows(p.chapter)
      .map((pw) => p.startFrame + sec(pw.from - p.segment.from))
      .filter((f) => f > w.fromFrame && f < w.toFrame && f >= p.startFrame && f < p.startFrame + p.durationFrames);
  });

/** "Never over a super, a sticky note, the title or the end card": a caption that is running when one begins ends there
 *  (when that leaves it readable; otherwise it stays and tools/captionAudit4.ts reports it). */
const clipAtProtected = (placed: readonly PlacedSegment4[], w: CaptionWindow): CaptionWindow => {
  const clip = Math.min(w.toFrame, ...protectedStarts(placed, w));
  return clip < w.toFrame && clip - w.fromFrame >= MIN_CLIPPED_FRAMES ? {...w, toFrame: clip} : w;
};

export const edlCaptionWindows4 = (edl: Edl4): readonly CaptionWindow[] => {
  const placed = placeSegments4(edl);
  const windows = placed.flatMap((p) => segmentWindows(placed, p)).map((w) => clipAtProtected(placed, w));
  const starts = new Set(windows.map((w) => w.fromFrame));
  return windows.map((w) => (starts.has(w.toFrame) ? {...w, holdOut: true} : w));
};

/** The tone a caption is drawn in at an edit frame: the tone of the segment under it. */
export const toneAt4 = (placed: readonly PlacedSegment4[], frame: number): CaptionTone | undefined =>
  placed.find((p) => frame >= p.startFrame && frame < p.startFrame + p.durationFrames)?.segment.props?.captionTone;
