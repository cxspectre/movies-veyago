// Caption.tsx — one burned-in caption (BIBLE §3 and §7.4). Glass tone: #F5F7FA at 92% on a 62% black pill (legible over phone UI).
// Paper tone: graphite at 90% on a 40% paper pill (radius 16, padding 10x18). Drawn as SVG so every baseline lands
// exactly where captionLayout.ts puts it. Fonts are loaded by FilmShell before this renders.
import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import type {CaptionTone} from '../edits';
import {rgba} from '../glass';
import {useFormat} from '../useFormat';
import {CAPTION_STYLE, captionCanvasFont, layoutCaption, type Measure} from './captionLayout';

const canvasMeasure = (font: string): Measure => {
  const context = document.createElement('canvas').getContext('2d');
  if (!context) throw new Error('Caption: no 2D canvas to measure text with');
  const ctx = context;
  ctx.font = font;
  return (text: string) => ctx.measureText(text).width;
};

export type CaptionProps = {text: string; tone: CaptionTone; opacity: number};

export const Caption: React.FC<CaptionProps> = ({text, tone, opacity}) => {
  const {format, width, height} = useFormat();
  const layout = useMemo(() => layoutCaption(text, canvasMeasure(captionCanvasFont(format)), width, height, format), [text, format, width, height]);
  if (opacity <= 0) return null;
  const ink = tone === 'paper' ? rgba(CAPTION_STYLE.paper.ink, CAPTION_STYLE.paper.inkOpacity) : rgba(CAPTION_STYLE.glass.ink, CAPTION_STYLE.glass.inkOpacity);
  const {box} = layout;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute', inset: 0}}>
        <g opacity={opacity}>
          <rect
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            rx={CAPTION_STYLE.paper.pillRadius}
            fill={tone === 'paper' ? rgba(CAPTION_STYLE.paper.pill, CAPTION_STYLE.paper.pillOpacity) : rgba(CAPTION_STYLE.glass.pill, CAPTION_STYLE.glass.pillOpacity)}
          />
          {layout.lines.map((line) => (
            <text
              key={`${line.baseline}-${line.text}`}
              x={width / 2}
              y={line.baseline}
              textAnchor="middle"
              fontFamily={CAPTION_STYLE.fontFamily}
              fontWeight={CAPTION_STYLE.weight}
              fontSize={layout.fontSize}
              fill={ink}
              style={{fontKerning: 'normal', fontFeatureSettings: '"kern" 1, "liga" 1'}}
            >
              {line.text}
            </text>
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
