// LightTwo.tsx — the pencil's reach into the void: the compiled 2 drawn as accent light (BIBLE section 3).
// Core #9FB4FF whose width follows the engine's pressure, a hotter centre where the lead pressed harder, the accent
// glow (#2F5BEA at 45%) under it, and a bright head while it travels. Normal blending only (CONTRACT 12.3).
import React, {useMemo} from 'react';
import {COLORS} from '../../../film';
import {HAIRLINE} from '../../../glass';
import type {PathMark} from '../../../paper';
import {arcLengths, cutAt, lightWidth, type LightSegment} from './lightStroke';

export type LightTwoProps = {
  readonly mark: PathMark;
  /** 0-1 of the arc length drawn. */
  readonly progress: number;
  /** Brightness level (1 = settled, 1.2 = fresh). */
  readonly level: number;
  /** Where the 2's own px sit in the frame. */
  readonly x: number;
  readonly y: number;
  /** The nominal line width (px) the engine's pressure is read against. */
  readonly lineWidth: number;
  /** Unique per render tree (filter ids). */
  readonly idPrefix: string;
};

/** Glow passes, widest first: width as a multiple of the core width, blur (logical px std dev), opacity at level 1. */
const GLOW_PASSES = [
  {key: 'far', widthOf: 2.6, blur: 16, opacity: HAIRLINE.accentGlowOpacity},
  {key: 'near', widthOf: 1.35, blur: 4.5, opacity: 0.6},
] as const;
/** The hot centre: soft inner passes, brighter where the lead pressed harder (width share of the core, opacity). */
const HOT_PASSES = [
  {key: 'hot-mid', widthOf: 0.62, opacity: 0.32, blur: 1.6},
  {key: 'hot-in', widthOf: 0.3, opacity: 0.55, blur: 0.9},
] as const;
const HOT_COLOR = '#EEF2FF';
const PRESSURE_RANGE = {min: 0.35, max: 1.35} as const;
/** The travelling head: the fresh lead, a soft white-hot point with a small accent halo. */
const HEAD_HALO_OF_WIDTH = 1.05;
const HEAD_CORE_OF_WIDTH = 0.42;
const HEAD_HALO_OPACITY = 0.5;
const HEAD_CORE_OPACITY = 0.9;
const HEAD_HALO_BLUR = 4;
const HEAD_CORE_BLUR = 1.2;
/** Filter region around the 2's own box (px), wide enough for the far glow. */
const FILTER_MARGIN = 120;
const FILTER_SIZE = 420;

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

const Lines: React.FC<{segments: readonly LightSegment[]; widthOf: (s: LightSegment) => number}> = ({segments, widthOf}) => (
  <>
    {segments.map((s, i) => (
      <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} strokeWidth={widthOf(s)} />
    ))}
  </>
);

const BlurFilter: React.FC<{id: string; std: number}> = ({id, std}) => (
  <filter id={id} filterUnits="userSpaceOnUse" x={-FILTER_MARGIN} y={-FILTER_MARGIN} width={FILTER_SIZE} height={FILTER_SIZE} colorInterpolationFilters="sRGB">
    <feGaussianBlur stdDeviation={std} />
  </filter>
);

export const LightTwo: React.FC<LightTwoProps> = ({mark, progress, level, x, y, lineWidth, idPrefix}) => {
  const lengths = useMemo(() => arcLengths(mark.pts), [mark]);
  const cut = cutAt(mark, lengths, progress);
  if (cut.segments.length === 0) return null;
  const segments = cut.segments.map((s) => ({...s, w: lightWidth(lineWidth, s.p)}));
  const head = cut.head ? {...cut.head, w: lightWidth(lineWidth, cut.head.p)} : null;
  const glowLevel = clamp(level, 0, 2);
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`} strokeLinecap="round" fill="none">
      <defs>
        {GLOW_PASSES.map((g) => (
          <BlurFilter key={g.key} id={`${idPrefix}-${g.key}`} std={g.blur} />
        ))}
        {HOT_PASSES.map((h) => (
          <BlurFilter key={h.key} id={`${idPrefix}-${h.key}`} std={h.blur} />
        ))}
        <BlurFilter id={`${idPrefix}-head`} std={HEAD_HALO_BLUR} />
        <BlurFilter id={`${idPrefix}-head-core`} std={HEAD_CORE_BLUR} />
      </defs>
      {GLOW_PASSES.map((g) => (
        <g key={g.key} stroke={COLORS.accent} opacity={clamp(g.opacity * glowLevel, 0, 1)} filter={`url(#${idPrefix}-${g.key})`}>
          <Lines segments={segments} widthOf={(s) => s.w * g.widthOf} />
        </g>
      ))}
      <g stroke={HAIRLINE.accentCore}>
        <Lines segments={segments} widthOf={(s) => s.w} />
      </g>
      {HOT_PASSES.map((h) => (
        <g key={h.key} stroke={HOT_COLOR} opacity={clamp(h.opacity * glowLevel, 0, 1)} filter={`url(#${idPrefix}-${h.key})`}>
          <Lines segments={segments} widthOf={(s) => s.w * h.widthOf * clamp(s.p, PRESSURE_RANGE.min, PRESSURE_RANGE.max)} />
        </g>
      ))}
      {head ? (
        <g>
          <circle cx={head.x} cy={head.y} r={head.w * HEAD_HALO_OF_WIDTH} fill={HAIRLINE.accentCore} opacity={HEAD_HALO_OPACITY} filter={`url(#${idPrefix}-head)`} />
          <circle cx={head.x} cy={head.y} r={head.w * HEAD_CORE_OF_WIDTH} fill={COLORS.glassWhite} opacity={HEAD_CORE_OPACITY} filter={`url(#${idPrefix}-head-core)`} />
        </g>
      ) : null}
    </g>
  );
};
