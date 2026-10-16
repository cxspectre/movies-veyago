// captionTiming.ts — when each burned-in caption is on screen, in EDIT frames.
// A caption starts at its `at` (seconds from its segment's start, edits.ts) and holds until the next caption of
// its segment. The last caption of a segment carries on, unchanged, across the hard cut into any following
// segments that declare a `captionTone` but no captions of their own (in VERTICAL_45 that keeps "Everything we drew.
// On your iPhone." up over the Watch cut, and "No account. No tracking." over the chips, under the VO that says
// them); it ends on the cut into a segment with its own captions or without a tone. Captions fade in over their
// first 6 frames and out over their last 6, so nothing pops and two captions never overlap. A caption followed
// directly by another (the next one starts on its last frame's successor) does not fade out: it holds at full until
// the swap and only the new one fades in, so a sentence the VO is still speaking never leaves a blank hole.
import type {CaptionTone, Edl} from '../edits';
import {sec} from '../film';
import {CAPTION_STYLE} from './captionLayout';
import {placeSegments} from './edl';
import type {PlacedSegment} from './types';

export type CaptionWindow = {
  text: string;
  /** Edit frames: the first frame shown, and the frame after the last. */
  fromFrame: number;
  toFrame: number;
  /** The segment the caption belongs to, and the segments it is drawn over (itself first). */
  segment: number;
  over: readonly number[];
  /** True when the next caption starts exactly at `toFrame`: no fade-out, the incoming caption's fade-in covers the swap. */
  holdOut?: boolean;
};

const hasCaptions = (p: PlacedSegment): boolean => (p.segment.props?.captions?.length ?? 0) > 0;
const carriesOn = (p: PlacedSegment): boolean => !hasCaptions(p) && p.segment.props?.captionTone !== undefined && !p.black;

/** The segments after `index` the last caption of `index` holds over. */
const continuationOf = (placed: readonly PlacedSegment[], index: number): readonly PlacedSegment[] => {
  const after = placed.slice(index + 1);
  const stop = after.findIndex((p) => !carriesOn(p));
  return stop === -1 ? after : after.slice(0, stop);
};

const segmentWindows = (placed: readonly PlacedSegment[], p: PlacedSegment): readonly CaptionWindow[] => {
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

/** Every caption window of the EDL (none in a wide EDL: captions are burned into the 9:16 versions only). */
export const edlCaptionWindows = (edl: Edl): readonly CaptionWindow[] => {
  if (edl.format !== 'tall') return [];
  const placed = placeSegments(edl);
  const windows = placed.flatMap((p) => segmentWindows(placed, p));
  const starts = new Set(windows.map((w) => w.fromFrame));
  return windows.map((w) => (starts.has(w.toFrame) ? {...w, holdOut: true} : w));
};

/** The tone a caption is drawn in at an edit frame: the tone of the segment under it (paper on paper, glass on glass). */
export const toneAt = (placed: readonly PlacedSegment[], frame: number): CaptionTone | undefined =>
  placed.find((p) => frame >= p.startFrame && frame < p.startFrame + p.durationFrames)?.segment.props?.captionTone;

/** 0..1 at an edit frame: a 6-frame ramp in from `fromFrame`, a 6-frame ramp out to `toFrame` (none when `holdOut`), 0 outside. */
export const captionOpacity = (
  frame: number,
  w: Pick<CaptionWindow, 'fromFrame' | 'toFrame' | 'holdOut'>,
  fadeFrames: number = CAPTION_STYLE.fadeFrames,
): number => {
  if (frame < w.fromFrame || frame >= w.toFrame) return 0;
  const fadeIn = (frame - w.fromFrame + 1) / fadeFrames;
  const fadeOut = w.holdOut ? 1 : (w.toFrame - frame) / fadeFrames;
  return Math.min(1, fadeIn, fadeOut);
};
