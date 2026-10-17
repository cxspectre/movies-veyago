// hand.tsx — the little drawn-on-paper pieces both chapters share: handwriting that reveals left to right, a stroke that
// draws on, and the paper-pin. Plain SVG (region px), deterministic, no canvas.
import React, {useId} from 'react';
import {COLORS} from '../../film';
import {Ink} from '../../popup';

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
export const smooth = (v: number): number => {
  const k = clamp01(v);
  return k * k * (3 - 2 * k);
};
export const easeOutBack = (v: number): number => {
  const k = clamp01(v) - 1;
  return 1 + 2.4 * k * k * k + 1.4 * k * k;
};
/** Seconds `t` through `[from, from + dur]`, 0-1. */
export const prog = (t: number, from: number, dur: number): number => clamp01((t - from) / dur);

/** A fixed-seed hash in 0-1 so every render of every frame agrees. */
export const hash01 = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export const Layer: React.FC<{children: React.ReactNode; opacity?: number; style?: React.CSSProperties}> = ({children, opacity = 1, style}) => (
  <svg style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible', opacity, ...style}}>{children}</svg>
);

export type WrittenProps = {
  readonly lines: readonly string[];
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly font?: 'Patrick Hand' | 'Caveat';
  readonly weight?: number;
  readonly ink?: string;
  readonly t: number;
  readonly start: number;
  readonly dur: number;
  readonly anchor?: 'start' | 'middle';
  readonly lineHeight?: number;
  readonly opacity?: number;
};

const CHAR_W = {'Patrick Hand': 0.46, Caveat: 0.4} as const;

/** Handwriting that writes itself: the lines are revealed left to right in order over `dur` seconds. */
export const Written: React.FC<WrittenProps> = ({lines, x, y, size, font = 'Patrick Hand', weight = 400, ink = COLORS.graphite, t, start, dur, anchor = 'start', lineHeight = 1.15, opacity = 1}) => {
  const id = useId().replace(/:/g, '');
  const p = prog(t, start, dur);
  if (p <= 0) return null;
  const total = lines.reduce((n, l) => n + l.length, 0);
  let before = 0;
  return (
    <g opacity={opacity}>
      {lines.map((line, i) => {
        const from = before / total;
        before += line.length;
        const to = before / total;
        const f = clamp01((p - from) / (to - from));
        if (f <= 0) return null;
        const w = line.length * size * CHAR_W[font];
        const left = anchor === 'middle' ? x - w / 2 : x;
        const baseline = y + i * size * lineHeight;
        return (
          <g key={i}>
            {f < 1 ? (
              <clipPath id={`${id}-${i}`}>
                <rect x={left - 8} y={baseline - size * 1.1} width={w * f + 8} height={size * 1.5} />
              </clipPath>
            ) : null}
            <text x={x} y={baseline} textAnchor={anchor} fontFamily={font} fontWeight={weight} fontSize={size} fill={ink} clipPath={f < 1 ? `url(#${id}-${i})` : undefined}>
              {line}
            </text>
          </g>
        );
      })}
    </g>
  );
};

/** A hand path that draws on (the engine's hand paths are plain `d` strings). */
export const DrawOn: React.FC<{d: string; p: number; width?: number; ink?: string; fill?: string}> = ({d, p, width = 2.4, ink = COLORS.graphite, fill}) => {
  if (p <= 0) return null;
  return (
    <>
      {fill && p >= 1 ? <path d={d} fill={fill} stroke="none" /> : null}
      <path d={d} fill="none" pathLength={1} stroke={ink} strokeWidth={width * 1.9} strokeOpacity={0.16} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - p} />
      <path d={d} fill="none" pathLength={1} stroke={ink} strokeWidth={width} strokeOpacity={0.85} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - p} />
    </>
  );
};

/** A push pin seen from above: a round head, a highlight and a short soft shadow along the lamp (right and down). */
export const PushPin: React.FC<{x: number; y: number; r?: number; scale?: number; fill?: string}> = ({x, y, r = 13, scale = 1, fill = COLORS.accent}) => {
  if (scale <= 0.01) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx={r * 0.55} cy={r * 0.7} rx={r * 1.05} ry={r * 0.8} fill="rgba(42,36,28,0.28)" />
      <circle r={r} fill={fill} stroke={COLORS.graphite} strokeOpacity={0.55} strokeWidth={1.4} />
      <circle cx={-r * 0.3} cy={-r * 0.32} r={r * 0.3} fill="rgba(255,255,255,0.65)" />
    </g>
  );
};

export {Ink};
