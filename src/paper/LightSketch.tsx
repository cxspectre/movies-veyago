// LightSketch.tsx — the same page re-rendered as hairlines of light (Act 3, "the lines catch light").
// A clean, fast SVG base for the transition owner to style: the exact marks the graphite renderer draws, revealed
// stroke by stroke, with glow built from layered strokes (no SVG filters).
import React, {useMemo} from 'react';
import {COLORS} from '../film';
import {compileSketch, markProgress} from './marks/compile';
import {indexAtTime, tipAt} from './marks/sample';
import type {GlyphMark, Mark, MarkPoint, PathMark} from './marks/types';
import {metricsOf} from './text/handLayout';
import {SKETCH_SIZE, type SketchSpec, type StrokeSpec} from './types';

export type LightOrder = 'spec' | 'sequential';

export type LightSketchProps = {
  readonly spec: SketchSpec;
  /** 0-1 reveal of the whole page. */
  readonly progress: number;
  /**
   * 'spec' (default): each stroke lights up in its own from/to window (same order and rhythm as the pencil).
   * 'sequential': strokes and labels light one after another in spec order, evenly spread over the progress.
   */
  readonly order?: LightOrder;
  /** Full control: return the 0-1 reveal for a stroke/label id at the page progress (overrides `order`). */
  readonly revealOf?: (id: string, progress: number) => number;
  /** Core hairline colour (default COLORS.glassWhite) and the accent strokes' colour (default: same as color). */
  readonly color?: string;
  readonly accentColor?: string;
  /** The sepia strokes' colour (Maya in the light, BIBLE4 §3; default: same as color). */
  readonly sepiaColor?: string;
  /** 0 = bare hairlines, 1 = default glow, >1 brighter halo. */
  readonly glow?: number;
  /** Core hairline width in sketch px (default 1.1). */
  readonly coreWidth?: number;
  /** Draw the loose rough passes too (default false: the clean drawing only). */
  readonly includeRough?: boolean;
  /** Brightness boost travelling with each stroke's leading tip (default 1). */
  readonly tipFlare?: number;
  readonly style?: React.CSSProperties;
};

type Layer = {width: number; opacity: number};
/** Glow from wide-and-faint to the bright core. */
const LAYERS: readonly Layer[] = [
  {width: 9, opacity: 0.05},
  {width: 4.5, opacity: 0.12},
  {width: 2.2, opacity: 0.3},
];

const f1 = (v: number): string => (Math.round(v * 10) / 10).toString();

const polyD = (pts: readonly {x: number; y: number}[]): string =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${f1(p.x)} ${f1(p.y)}`).join('');

const visibleD = (m: PathMark, local: number): {d: string; tip: MarkPoint | null} => {
  if (local >= 1) return {d: polyD(m.pts), tip: null};
  const i = indexAtTime(m.pts, local);
  const tip = tipAt(m.pts, local).pt;
  return {d: polyD([...m.pts.slice(0, i + 1), tip]), tip};
};

/** Default reveal: either the pencil's own windows, or an even sequence over spec order. */
const revealFn = (spec: SketchSpec, order: LightOrder): ((id: string, u: number) => number | null) => {
  if (order === 'spec') return () => null;
  const ids = [...spec.strokes.map((s: StrokeSpec) => s.id), ...spec.labels.map((l) => l.id)];
  const slot = 1 / Math.max(1, ids.length);
  const index = new Map(ids.map((id, i) => [id, i]));
  return (id, u) => Math.min(1, Math.max(0, (u - (index.get(id) ?? 0) * slot) / slot));
};

/** Local progress of a mark: from the override (stroke-level reveal spread across the stroke's marks) or its own window. */
const localOf = (m: Mark, u: number, strokeReveal: number | null, span: {start: number; end: number} | undefined): number => {
  if (strokeReveal === null || !span) return markProgress(m, u);
  const t = span.start + (span.end - span.start) * strokeReveal;
  return markProgress(m, t);
};

const strokeSpans = (marks: readonly Mark[]): Map<string, {start: number; end: number}> =>
  marks.reduce((acc, m) => {
    const s = acc.get(m.strokeId);
    acc.set(m.strokeId, s ? {start: Math.min(s.start, m.start), end: Math.max(s.end, m.end)} : {start: m.start, end: m.end});
    return acc;
  }, new Map<string, {start: number; end: number}>());

const PathLight: React.FC<{m: PathMark; local: number; color: string; glow: number; core: number; flare: number}> = ({m, local, color, glow, core, flare}) => {
  const {d, tip} = visibleD(m, local);
  const dash = m.role === 'dotted' ? `${f1(core * 0.6)} ${f1(Math.max(6, m.pts[0]?.w ?? 2) * 3)}` : undefined;
  return (
    <g stroke={color} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash}>
      {glow > 0 ? LAYERS.map((l, i) => <path key={i} d={d} strokeWidth={l.width * core} strokeOpacity={Math.min(1, l.opacity * glow)} />) : null}
      <path d={d} strokeWidth={core} />
      {tip && flare > 0 ? <circle cx={tip.x} cy={tip.y} r={core * 3.5} fill={color} fillOpacity={0.35 * flare} stroke="none" /> : null}
    </g>
  );
};

const GlyphLight: React.FC<{g: GlyphMark; local: number; color: string; glow: number; core: number}> = ({g, local, color, glow, core}) => {
  if (local <= 0) return null;
  const f = metricsOf(g.face);
  const deg = (g.rotate * 180) / Math.PI;
  return (
    <g transform={`translate(${f1(g.x)} ${f1(g.y)}) rotate(${deg.toFixed(2)})`} opacity={Math.min(1, local * 1.4)}>
      <text fontFamily={`"${f.family}"`} fontWeight={f.weight} fontSize={g.size} fill="none" stroke={color} strokeWidth={core * 2.6 * glow} strokeOpacity={0.14} strokeLinejoin="round">
        {g.char}
      </text>
      <text fontFamily={`"${f.family}"`} fontWeight={f.weight} fontSize={g.size} fill={color}>
        {g.char}
      </text>
    </g>
  );
};

export const LightSketch: React.FC<LightSketchProps> = ({
  spec,
  progress,
  order = 'spec',
  revealOf,
  color = COLORS.glassWhite,
  accentColor,
  sepiaColor,
  glow = 1,
  coreWidth = 1.1,
  includeRough = false,
  tipFlare = 1,
  style,
}) => {
  const marks = useMemo(() => compileSketch(spec).filter((m) => includeRough || m.kind !== 'path' || m.role !== 'rough'), [spec, includeRough]);
  const spans = useMemo(() => strokeSpans(marks), [marks]);
  const fallback = useMemo(() => revealFn(spec, order), [spec, order]);
  const u = Math.min(1, Math.max(0, progress));
  return (
    <svg
      width={SKETCH_SIZE.width}
      height={SKETCH_SIZE.height}
      viewBox={`0 0 ${SKETCH_SIZE.width} ${SKETCH_SIZE.height}`}
      style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', ...style}}
    >
      {marks.map((m, i) => {
        const reveal = revealOf ? revealOf(m.strokeId, u) : fallback(m.strokeId, u);
        const local = localOf(m, u, reveal, spans.get(m.strokeId));
        if (local <= 0) return null;
        const c = m.ink === 'accent' ? (accentColor ?? color) : m.ink === 'sepia' ? (sepiaColor ?? color) : color;
        return m.kind === 'path' ? (
          <PathLight key={i} m={m} local={local} color={c} glow={glow} core={coreWidth} flare={tipFlare} />
        ) : (
          <GlyphLight key={i} g={m} local={local} color={c} glow={glow} core={coreWidth} />
        );
      })}
    </svg>
  );
};
