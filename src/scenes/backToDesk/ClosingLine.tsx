// ClosingLine.tsx — "Provided for." (BIBLE §6.4): the film's one Cambria line (Caladea stands in), italic 400,
// 48 px wide / 42 px tall, graphite at 85%, bottom-centre, its baseline 120 px above the bottom edge, fading in
// over 0.6 s under the VO's "provided for". The grid fills the frame at this framing, so the line gets its own
// quiet ground: a feathered panel of the graded paper's tone, so it never sits on a drawing or a paper edge.
import React from 'react';
import {backToDesk} from '../../beats';
import {COLORS, FONTS, FORMATS, type FormatName} from '../../film';
import {closingLineOpacity} from './staging';

const SIZE: Record<FormatName, number> = {wide: 48, tall: 42};
const BASELINE_FROM_BOTTOM = 120;
const GRAPHITE_OPACITY = 0.85;
/** Wide's panel: the bottom row's paper as graded (#D4CABB measured), a touch lighter, 78%, feathered 20 px, inside the bottom-centre tile so no haze falls on the wood. Tall sits on bare wood (staging CLOSING_LINE_LIFT). */
const PANEL_IN: Record<FormatName, boolean> = {wide: true, tall: false};
const PANEL = {rgb: '226, 217, 203', opacity: 0.78, feather: 20, widthEm: 6.4, heightEm: 2.0} as const;

const Panel: React.FC<{readonly size: number; readonly width: number; readonly baselineY: number; readonly opacity: number}> = ({size, width, baselineY, opacity}) => {
  const w = size * PANEL.widthEm;
  const h = size * PANEL.heightEm;
  // Centred on the words' x-height band (about 0.3 em above the baseline).
  const cy = baselineY - size * 0.3;
  return (
    <div
      style={{
        position: 'absolute',
        left: (width - w) / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        borderRadius: h / 2,
        background: `rgba(${PANEL.rgb}, ${PANEL.opacity})`,
        filter: `blur(${PANEL.feather}px)`,
        opacity,
      }}
    />
  );
};

export const ClosingLine: React.FC<{readonly format: FormatName; readonly t: number}> = ({format, t}) => {
  const opacity = closingLineOpacity(t);
  if (opacity <= 0) return null;
  const size = SIZE[format];
  const {width, height} = FORMATS[format];
  const baselineY = height - BASELINE_FROM_BOTTOM;
  return (
    <>
    {PANEL_IN[format] ? <Panel size={size} width={width} baselineY={baselineY} opacity={opacity} /> : null}
    <div
      style={{
        position: 'absolute',
        left: 0,
        width,
        // A line box of exactly the font size: its baseline sits at ~0.8 em for Caladea.
        top: baselineY - size * 0.8,
        height: size,
        lineHeight: `${size}px`,
        textAlign: 'center',
        fontFamily: FONTS.closing,
        fontStyle: 'italic',
        fontWeight: 400,
        fontSize: size,
        color: COLORS.graphite,
        opacity: opacity * GRAPHITE_OPACITY,
        whiteSpace: 'nowrap',
      }}
    >
      {backToDesk.closingLine.text}
    </div>
    </>
  );
};
