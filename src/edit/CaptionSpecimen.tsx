// CaptionSpecimen.tsx — a review sheet: every caption of every 9:16 EDL, one after another on its own world's
// ground (paper or the void), with faint guides for the 300 px baseline and the caption band. Not a deliverable.
import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {EDLS} from '../edits';
import {COLORS} from '../film';
import {DeskSurface, PaperSheet} from '../paper';
import {rgba} from '../glass';
import {useFormat} from '../useFormat';
import {Caption} from './Caption';
import {CAPTION_BAND, CAPTION_STYLE} from './captionLayout';
import {captionOpacity, edlCaptionWindows, toneAt} from './captionTiming';
import {placeSegments} from './edl';

const HOLD_FRAMES = 30;
/** The specimen sheet: paper filling most of the 9:16 frame, as in the vertical's close desk shots. */
const SHEET_MARGIN_PX = 48;
const GUIDE_OPACITY = 0.35;

const SPECIMENS = EDLS.flatMap((e) => {
  const placed = placeSegments(e);
  return edlCaptionWindows(e).map((w) => ({text: w.text, tone: toneAt(placed, w.fromFrame) ?? 'glass', fromFrame: 0, toFrame: HOLD_FRAMES}));
});

export const CAPTION_SPECIMEN_FRAMES = Math.max(1, SPECIMENS.length * HOLD_FRAMES);

const Guides: React.FC = () => {
  const {width, height} = useFormat();
  const guide = rgba(COLORS.accent, GUIDE_OPACITY);
  return (
    <svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
      <line x1={0} x2={width} y1={height - CAPTION_STYLE.baselineFromBottomPx} y2={height - CAPTION_STYLE.baselineFromBottomPx} stroke={guide} strokeWidth={1} />
      <rect x={0} y={CAPTION_BAND.top} width={width} height={CAPTION_BAND.bottom - CAPTION_BAND.top} fill="none" stroke={guide} strokeDasharray="6 6" />
    </svg>
  );
};

const PaperGround: React.FC = () => {
  const {width, height} = useFormat();
  return (
    <DeskSurface>
      <div style={{position: 'absolute', left: SHEET_MARGIN_PX, top: SHEET_MARGIN_PX}}>
        <PaperSheet width={width - 2 * SHEET_MARGIN_PX} height={height - 2 * SHEET_MARGIN_PX} curl={0.3} />
      </div>
    </DeskSurface>
  );
};

const Specimen: React.FC<{w: (typeof SPECIMENS)[number]}> = ({w}) => {
  const frame = useCurrentFrame();
  const ground = w.tone === 'paper' ? <PaperGround /> : <AbsoluteFill style={{background: COLORS.void}} />;
  return (
    <AbsoluteFill>
      {ground}
      <Guides />
      <Caption text={w.text} tone={w.tone} opacity={captionOpacity(frame, w)} />
    </AbsoluteFill>
  );
};

export const CaptionSpecimen: React.FC = () => (
  <AbsoluteFill style={{background: COLORS.void}}>
    {SPECIMENS.map((w, i) => (
      <Sequence key={`${i}-${w.text}`} from={i * HOLD_FRAMES} durationInFrames={HOLD_FRAMES}>
        <Specimen w={w} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
