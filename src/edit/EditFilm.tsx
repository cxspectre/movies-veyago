// EditFilm.tsx — the EDL player. Every EditSegment of src/edits.ts becomes a <Sequence> on the edit timeline
// (hard cuts, lengths from `segmentFrames`), showing its module's scene trimmed to [from, to]; the burned-in
// captions of the 9:16 versions run on their own track above the picture, on the edit's clock, so a caption can
// hold across a cut (captionTiming.ts).
import React, {useMemo} from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import type {Edl} from '../edits';
import {COLORS, type FormatName} from '../film';
import {useFormat} from '../useFormat';
import {Caption} from './Caption';
import {captionOpacity, edlCaptionWindows, toneAt, type CaptionWindow} from './captionTiming';
import {placeSegments} from './edl';
import {SegmentPicture} from './SegmentPicture';
import type {PlacedSegment} from './types';

/** The caption track; `useCurrentFrame()` here is the edit frame. */
const CaptionTrack: React.FC<{windows: readonly CaptionWindow[]; placed: readonly PlacedSegment[]}> = ({windows, placed}) => {
  const frame = useCurrentFrame();
  const tone = toneAt(placed, frame);
  if (!tone) return null;
  return (
    <>
      {windows
        .filter((w) => frame >= w.fromFrame && frame < w.toFrame)
        .map((w) => (
          <Caption key={`${w.fromFrame}-${w.text}`} text={w.text} tone={tone} opacity={captionOpacity(frame, w)} />
        ))}
    </>
  );
};

export type EditFilmProps = {
  edl: Edl;
  /** Defaults to the EDL's own format; must match the canvas the composition renders into. */
  format?: FormatName;
};

export const EditFilm: React.FC<EditFilmProps> = ({edl, format = edl.format}) => {
  const canvas = useFormat();
  if (canvas.format !== format || format !== edl.format) {
    throw new Error(`EditFilm ${edl.id}: the EDL is ${edl.format}, the prop says ${format}, the canvas is ${canvas.format}`);
  }
  const placed = useMemo(() => placeSegments(edl), [edl]);
  const windows = useMemo(() => edlCaptionWindows(edl), [edl]);
  const captionedSegments = useMemo(() => new Set(windows.flatMap((w) => w.over)), [windows]);
  return (
    <AbsoluteFill style={{background: COLORS.void}}>
      {placed.map((p) => (
        <Sequence key={p.index} from={p.startFrame} durationInFrames={p.durationFrames} name={`${p.index + 1}. ${p.segment.note}`}>
          <SegmentPicture placed={p} edlId={edl.id} format={format} captioned={captionedSegments.has(p.index)} />
        </Sequence>
      ))}
      {windows.length > 0 ? <CaptionTrack windows={windows} placed={placed} /> : null}
    </AbsoluteFill>
  );
};
