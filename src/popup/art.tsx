// art.tsx — the flat pencil drawings the presets lift. Plain SVG strokes in graphite (two passes: a light rough, a
// darker clean line) using the paper engine's hand-drawn path toolkit, so edges wobble like the real pencil.
import React from 'react';
import {COLORS} from '../film';
import {handCircle, handLine, handRect} from '../paper';

export const ACCENT_WASH = 'rgba(47, 91, 234, 0.16)';

export type InkProps = {readonly d: string; readonly width?: number; readonly ink?: string; readonly fill?: string};

/** One hand-drawn stroke: a faint wide pass under a crisp one. */
export const Ink: React.FC<InkProps> = ({d, width = 2, ink = COLORS.graphite, fill = 'none'}) => (
  <>
    <path d={d} fill={fill} stroke={ink} strokeWidth={width * 1.9} strokeOpacity={0.16} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={ink} strokeWidth={width} strokeOpacity={0.82} strokeLinecap="round" strokeLinejoin="round" />
  </>
);

export const Box: React.FC<{x: number; y: number; w: number; h: number; seed: number; width?: number; ink?: string; fill?: string}> = ({x, y, w, h, seed, width, ink, fill}) => (
  <Ink d={handRect(x, y, w, h, seed, {radius: 3})} width={width} ink={ink} fill={fill} />
);

export const Line: React.FC<{x1: number; y1: number; x2: number; y2: number; seed: number; width?: number; ink?: string}> = ({x1, y1, x2, y2, seed, width, ink}) => (
  <Ink d={handLine(x1, y1, x2, y2, seed)} width={width} ink={ink} />
);

export const Ring: React.FC<{cx: number; cy: number; r: number; seed: number; width?: number; ink?: string; fill?: string}> = ({cx, cy, r, seed, width, ink, fill}) => (
  <Ink d={handCircle(cx, cy, r, r, seed)} width={width} ink={ink} fill={fill} />
);

/** A window: frame, cross-bars and a sill. */
export const Window: React.FC<{x: number; y: number; w: number; h: number; seed: number}> = ({x, y, w, h, seed}) => (
  <>
    <Box x={x} y={y} w={w} h={h} seed={seed} width={2.2} fill="rgba(180,220,254,0.22)" />
    <Line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} seed={seed + 1} width={1.6} />
    <Line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} seed={seed + 2} width={1.6} />
    <Line x1={x - 6} y1={y + h + 5} x2={x + w + 6} y2={y + h + 5} seed={seed + 3} width={2} />
  </>
);

/** Loose scribbled text lines (never legible), as on the letters and cards. */
export const Scribble: React.FC<{x: number; y: number; w: number; rows: number; gap: number; seed: number}> = ({x, y, w, rows, gap, seed}) => (
  <>
    {Array.from({length: rows}, (_, i) => (
      <Line key={i} x1={x} y1={y + i * gap} x2={x + w * (i === rows - 1 ? 0.6 : 1 - (i % 3) * 0.07)} y2={y + i * gap + 0.6} seed={seed + i} width={1.3} />
    ))}
  </>
);

/** Parallel hatching inside a box, for shade. */
export const Hatch: React.FC<{x: number; y: number; w: number; h: number; gap: number; seed: number}> = ({x, y, w, h, gap, seed}) => (
  <>
    {Array.from({length: Math.floor((w + h) / gap)}, (_, i) => {
      const d = i * gap;
      const x1 = Math.min(x + d, x + w);
      const y1 = d > w ? y + (d - w) : y;
      const y2 = Math.min(y + d, y + h);
      const x2 = d > h ? x + (d - h) : x;
      return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} seed={seed + i} width={1} ink={COLORS.graphiteSoft} />;
    })}
  </>
);

/** Full-size SVG layer for a net (the art box). */
export const Drawing: React.FC<{w: number; h: number; children: React.ReactNode}> = ({w, h, children}) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {children}
  </svg>
);
