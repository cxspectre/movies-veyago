// place.ts — pure timeline maths for the v4 cut-downs: where each Edl4 segment sits on the edit's timeline and which
// MASTER frame it shows. The picture is the 9:16 master (MasterFilm4) shifted in time, so a segment of chapter c at
// module-local [from, to) plays master time slot(c).start + from.
import {sec} from '../film';
import {slotOf4, type ChapterId} from '../film4';
import {segmentFrames4, type Edl4, type EditSegment4} from '../edits4';

export type PlacedSegment4 = {
  index: number;
  segment: EditSegment4;
  chapter: ChapterId;
  /** Edit frame of the segment's first frame, and its length in frames. */
  startFrame: number;
  durationFrames: number;
  /** MASTER frame the segment starts on (the negative <Sequence from> offset). */
  masterFromFrame: number;
  /** Master seconds of the slice. */
  masterFrom: number;
  masterTo: number;
};

const round3 = (n: number): number => Math.round(n * 1000) / 1000;

export const edlFrames4 = (edl: Edl4): number => edl.segments.reduce((n, s) => n + segmentFrames4(s), 0);

/** Composition id: `Hook75` -> `Hook75-tall`; `Short-line` -> `Short-line-tall`. */
export const compositionId4 = (edl: Edl4): string => `${edl.id}-${edl.format}`;

export const placeSegments4 = (edl: Edl4): readonly PlacedSegment4[] =>
  edl.segments.reduce<PlacedSegment4[]>((placed, segment, index) => {
    const previous = placed[placed.length - 1];
    const start = slotOf4(segment.chapter).start;
    return [
      ...placed,
      {
        index,
        segment,
        chapter: segment.chapter,
        startFrame: previous ? previous.startFrame + previous.durationFrames : 0,
        durationFrames: segmentFrames4(segment),
        masterFromFrame: sec(start + segment.from),
        masterFrom: round3(start + segment.from),
        masterTo: round3(start + segment.to),
      },
    ];
  }, []);
