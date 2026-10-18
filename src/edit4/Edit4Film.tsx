// Edit4Film.tsx — the v4 cut-down player. Every segment of an Edl4 is a <Sequence> on the edit timeline (hard cuts)
// showing the 9:16 master (MasterFilm4, the same one-sheet component) shifted so the segment's MASTER time plays:
// inside the shifted <Sequence from={-masterFromFrame}> `useCurrentFrame()` is the master frame, exactly as in
// Master4-tall. The captions run on their own track on the edit's clock (captionTiming4.ts), so one can hold across a cut.
import React, {useMemo} from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {Caption4} from './Caption4';
import {COLORS} from '../film';
import type {Edl4} from '../edits4';
import {MasterFilm4} from '../MasterFilm4';
import {useFormat} from '../useFormat';
import {captionOpacity, edlCaptionWindows4, toneAt4, type CaptionWindow} from './captionTiming4';
import {placeSegments4, type PlacedSegment4} from './place';

const CaptionTrack: React.FC<{windows: readonly CaptionWindow[]; placed: readonly PlacedSegment4[]}> = ({windows, placed}) => {
  const frame = useCurrentFrame();
  const tone = toneAt4(placed, frame);
  if (!tone) return null;
  return (
    <>
      {windows
        .filter((w) => frame >= w.fromFrame && frame < w.toFrame)
        .map((w) => (
          <Caption4 key={`${w.fromFrame}-${w.text}`} text={w.text} tone={tone} opacity={captionOpacity(frame, w)} />
        ))}
    </>
  );
};

export const Edit4Film: React.FC<{edl: Edl4}> = ({edl}) => {
  const canvas = useFormat();
  if (canvas.format !== edl.format) throw new Error(`Edit4Film ${edl.id}: the EDL is ${edl.format}, the canvas is ${canvas.format}`);
  const placed = useMemo(() => placeSegments4(edl), [edl]);
  const windows = useMemo(() => edlCaptionWindows4(edl), [edl]);
  return (
    <AbsoluteFill style={{background: COLORS.void}}>
      {placed.map((p) => (
        <Sequence key={p.index} from={p.startFrame} durationInFrames={p.durationFrames} name={`${p.index + 1}. ${p.chapter} ${p.segment.from}-${p.segment.to}s`}>
          <Sequence from={-p.masterFromFrame} name={`master ${p.masterFrom}-${p.masterTo}s`}>
            <MasterFilm4 />
          </Sequence>
        </Sequence>
      ))}
      {windows.length > 0 ? <CaptionTrack windows={windows} placed={placed} /> : null}
    </AbsoluteFill>
  );
};
