// EraserCrumbs.tsx — little rolled crumbs of eraser rubber, greyed by the graphite they lifted, each with a
// tiny lamp shadow. Deterministic scatter (seeded), clustered around where the erasing happened.
import React, {useMemo} from 'react';
import {hash01, hashSigned} from './geometry/noise';
import {DEFAULT_LAMP, type Lamp, lampVector, shadowOffset} from './lamp';

export type CrumbArea = {readonly x: number; readonly y: number; readonly w: number; readonly h: number};

export type EraserCrumbsProps = {
  /** Where they lie, in the parent's px (e.g. sketch px when placed inside a <PaperSheet>). */
  readonly area: CrumbArea;
  readonly seed?: number;
  readonly count?: number;
  /** Size multiplier (1 = crumbs from a pencil-end eraser on an A3 page at sketch scale). */
  readonly scale?: number;
  readonly lamp?: Lamp;
  /** 0-1: how many of the crumbs are visible (they can appear as erasing happens). Default 1. */
  readonly amount?: number;
  readonly style?: React.CSSProperties;
};

export type Crumb = {x: number; y: number; length: number; thickness: number; angle: number; bend: number; grey: number};

const RUBBER = [236, 231, 222] as const;
const LIFTED_GRAPHITE = [126, 124, 122] as const;

/** Pure: the crumbs for a seed, clustered (most near the middle of the area, a few strays). */
export const scatterCrumbs = (area: CrumbArea, seed: number, count: number, scale: number): readonly Crumb[] =>
  Array.from({length: count}, (_, i) => {
    const r = Math.sqrt(-2 * Math.log(Math.max(1e-4, hash01(seed, i * 5)))) * 0.36;
    const a = hash01(seed, i * 5 + 1) * Math.PI * 2;
    return {
      x: area.x + area.w * (0.5 + Math.cos(a) * Math.min(0.5, r)),
      y: area.y + area.h * (0.5 + Math.sin(a) * Math.min(0.5, r)),
      length: (2 + hash01(seed, i * 5 + 2) ** 1.4 * 15) * scale,
      thickness: (2.4 + hash01(seed, i * 5 + 3) * 2.4) * scale,
      angle: hash01(seed, i * 5 + 4) * 180,
      bend: hashSigned(seed, i * 7 + 11) * 0.6,
      grey: 0.08 + hash01(seed, i * 7 + 12) ** 1.5 * 0.42,
    };
  });

const mix = (k: number): string =>
  `rgb(${RUBBER.map((c, i) => Math.round(c + ((LIFTED_GRAPHITE[i] as number) - c) * k)).join(',')})`;

/** A rolled crumb is lumpy and a little twisted: a short wavy spine, drawn as overlapping round strokes. */
const crumbPath = (c: Crumb, k: number): string => {
  const h = c.length / 2;
  const wave = c.thickness * 0.18 * (k - 1);
  return `M ${(-h).toFixed(2)} ${wave.toFixed(2)} Q ${(-h * 0.2).toFixed(2)} ${(c.bend * c.length - wave).toFixed(2)} ${(h * 0.3).toFixed(2)} ${(c.bend * c.length * 0.4).toFixed(2)} T ${h.toFixed(2)} ${(wave * 0.5).toFixed(2)}`;
};

const CrumbShape: React.FC<{c: Crumb; lamp: Lamp; i: number}> = ({c, lamp, i}) => {
  const d = crumbPath(c, 1);
  const lumps = [crumbPath(c, 0), crumbPath(c, 2)];
  const o = shadowOffset(lamp, c.thickness * 0.9);
  const v = lampVector(lamp);
  const rad = (c.angle * Math.PI) / 180;
  // Highlight offset toward the lamp, in the crumb's rotated frame.
  const hx = (v.x * Math.cos(rad) + v.y * Math.sin(rad)) * c.thickness * 0.22;
  const hy = (-v.x * Math.sin(rad) + v.y * Math.cos(rad)) * c.thickness * 0.22;
  return (
    <g transform={`translate(${c.x.toFixed(2)} ${c.y.toFixed(2)})`}>
      <g transform={`translate(${o.x.toFixed(2)} ${o.y.toFixed(2)}) rotate(${c.angle.toFixed(1)})`}>
        <path d={d} stroke="rgb(48,34,20)" strokeOpacity={0.07} strokeWidth={c.thickness * 2.3} strokeLinecap="round" fill="none" />
        <path d={d} stroke="rgb(48,34,20)" strokeOpacity={0.16} strokeWidth={c.thickness * 1.25} strokeLinecap="round" fill="none" />
      </g>
      <g transform={`rotate(${c.angle.toFixed(1)})`}>
        <path d={d} stroke={mix(c.grey)} strokeWidth={c.thickness} strokeLinecap="round" fill="none" />
        {lumps.map((l, k) => (
          <path key={k} d={l} stroke={mix(c.grey + (k === 0 ? -0.04 : 0.06))} strokeWidth={c.thickness * (0.78 + 0.1 * k)} strokeLinecap="round" fill="none" />
        ))}
        <path d={d} stroke={mix(c.grey + 0.25)} strokeOpacity={0.5} strokeWidth={c.thickness * 0.45} strokeLinecap="round" fill="none" transform={`translate(${(-hx).toFixed(2)} ${(-hy).toFixed(2)})`} />
        <path d={d} stroke="#fff" strokeOpacity={0.55} strokeWidth={c.thickness * 0.32} strokeLinecap="round" fill="none" transform={`translate(${hx.toFixed(2)} ${hy.toFixed(2)})`} />
        {hash01(i, 99) > 0.4 ? <circle cx={hashSigned(i, 98) * c.length * 0.3} cy={0} r={c.thickness * 0.22} fill="rgb(70,70,72)" fillOpacity={0.5} /> : null}
      </g>
    </g>
  );
};

export const EraserCrumbs: React.FC<EraserCrumbsProps> = ({area, seed = 7, count = 16, scale = 1, lamp = DEFAULT_LAMP, amount = 1, style}) => {
  const crumbs = useMemo(() => scatterCrumbs(area, seed, count, scale), [area, seed, count, scale]);
  const shown = crumbs.slice(0, Math.round(crumbs.length * Math.min(1, Math.max(0, amount))));
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', ...style}} width={1} height={1}>
      {shown.map((c, i) => (
        <CrumbShape key={i} c={c} lamp={lamp} i={i + seed * 1000} />
      ))}
    </svg>
  );
};
