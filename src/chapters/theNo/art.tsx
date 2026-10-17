// art.tsx — chapter 3's pieces: the rejection letters, the engine cutaway, the old name/idea/purpose scribbles.
// All SVG in their own box, driven by module-local seconds, so they can be handed to the paper effects as children.
import React, {useId} from 'react';
import {theNo as B} from '../../beats4';
import {COLORS} from '../../film';
import {handCircle, handPath, handPolyline, handRect, type XY} from '../../paper';
import {Ink} from '../../popup/art';
import {ENGINE, GEAR_DEG_PER_S, GEAR_R, GEARS, LETTER} from './layout';

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const HAND = 'Patrick Hand, cursive';

/** A stroke that draws itself (0..1): the faint and the crisp pass of `Ink`, both on a unit pathLength. */
const Draw: React.FC<{d: string; p: number; width?: number; ink?: string; fill?: string}> = ({d, p, width = 2, ink = COLORS.graphite, fill = 'none'}) => {
  if (p <= 0) return null;
  const dash = {strokeDasharray: '1 1.001', strokeDashoffset: 1 - clamp01(p)} as const;
  return (
    <>
      <path d={d} pathLength={1} fill="none" stroke={ink} strokeWidth={width * 1.9} strokeOpacity={0.16} strokeLinecap="round" strokeLinejoin="round" {...dash} />
      <path d={d} pathLength={1} fill={p >= 1 ? fill : 'none'} stroke={ink} strokeWidth={width} strokeOpacity={0.82} strokeLinecap="round" strokeLinejoin="round" {...dash} />
    </>
  );
};

/** A line of illegible handwriting: a slow wave of small ups and downs. */
export const scribbleD = (x: number, y: number, w: number, seed: number): string => {
  const n = Math.max(4, Math.round(w / 22));
  const pts: XY[] = Array.from({length: n + 1}, (_, i) => [x + (w * i) / n, y + (i % 2 === 0 ? -3.5 : 3.5) * (0.5 + ((i * 7 + seed) % 5) / 5)]);
  return handPath(pts, seed, {wobble: 0.8});
};

/** Text written left to right (a clip that opens), `p` 0..1. */
const Written: React.FC<{p: number; x: number; y: number; w: number; size: number; anchor?: 'start' | 'middle'; ink?: string; children: string}> = ({p, x, y, w, size, anchor = 'start', ink = COLORS.graphite, children}) => {
  const id = `wr${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  if (p <= 0) return null;
  const left = anchor === 'middle' ? x - w / 2 : x;
  return (
    <>
      <clipPath id={id}>
        <rect x={left - 8} y={y - size * 1.1} width={(w + 16) * clamp01(p)} height={size * 1.6} />
      </clipPath>
      <text x={x} y={y} textAnchor={anchor} fontFamily={HAND} fontSize={size} fill={ink} clipPath={`url(#${id})`}>
        {children}
      </text>
    </>
  );
};

/** Where the elements of a letter draw: [start, end] shares of the body progress. */
const HEADER = [0, 0.14] as const;
const SUB = [0.12, 0.22] as const;
const ROW_START = 0.22;
const ROW_STEP = 0.12;
const seg = (p: number, s: readonly [number, number]): number => clamp01((p - s[0]) / (s[1] - s[0]));

export type LetterProps = {
  /** Body progress 0..1 (header, then six scribbled lines). */
  readonly body: number;
  /** "Rejected" written, 0..1. */
  readonly rejected: number;
  /** The accent circle drawn around it, 0..1. */
  readonly circle: number;
  readonly seed: number;
};

/** A rejection letter in a 460 x 600 box. It has no words but "Rejected": a header line and six scribbled lines. */
export const LetterArt: React.FC<LetterProps> = ({body, rejected, circle, seed}) => {
  const {w, h} = LETTER;
  const rows = Array.from({length: 6}, (_, i) => ({y: h * 0.2 + i * 27, w: i === 5 ? w * 0.4 : w * 0.78}));
  return (
    <>
      <Draw d={handPath([[w * 0.1, h * 0.09], [w * 0.55, h * 0.09]], seed, {wobble: 0.6})} p={seg(body, HEADER)} width={3} />
      <Draw d={handPath([[w * 0.1, h * 0.135], [w * 0.34, h * 0.135]], seed + 1, {wobble: 0.6})} p={seg(body, SUB)} width={1.8} />
      {rows.map((r, i) => (
        <Draw key={i} d={scribbleD(w * 0.11, r.y, r.w, seed + 10 + i)} p={seg(body, [ROW_START + i * ROW_STEP * 0.9, ROW_START + i * ROW_STEP * 0.9 + 0.2])} width={1.6} ink={COLORS.graphiteSoft} />
      ))}
      <Written p={rejected} x={w / 2} y={h * 0.79} w={200} size={48} anchor="middle">
        Rejected
      </Written>
      <Draw d={handCircle(w / 2, h * 0.755, 150, 112, seed + 30)} p={circle} width={3} ink={COLORS.accent} />
    </>
  );
};

/** A toothed gear of outer radius r about (0, 0). */
const gearD = (r: number, teeth: number, seed: number): string => {
  const pts: XY[] = [];
  const rin = r * 0.8;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const d = Math.PI / teeth;
    for (const [da, rr] of [[-0.55, rin], [-0.3, r], [0.3, r], [0.55, rin]] as const) {
      pts.push([Math.cos(a + da * d * 1.9) * rr, Math.sin(a + da * d * 1.9) * rr]);
    }
  }
  pts.push(pts[0]!);
  return handPolyline(pts, seed, 0.5);
};
const GEAR_PATHS = GEARS.map((_, i) => gearD(GEAR_R, 10, 60 + i));

/** The engine cutaway in its own 680 x 400 box: block, four gears (turning from 18.0), their labels written 14.0-18.0. */
export const EngineArt: React.FC<{t: number}> = ({t}) => {
  const {w, h} = ENGINE;
  const spin = Math.max(0, t - B.gearsTurnFrom) * GEAR_DEG_PER_S;
  return (
    <>
      <Ink d={handRect(2, 2, w - 4, h - 4, 5, {radius: 20})} width={2.6} />
      {GEARS.map((g, i) => {
        const cx = g.fx * w;
        const cy = g.fy * h;
        const at = B.engineUnfolds.from + 1 + i;
        return (
          <React.Fragment key={g.label}>
            <g transform={`translate(${cx} ${cy}) rotate(${spin * g.dir + i * 9})`}>
              <Ink d={GEAR_PATHS[i]!} width={2.2} fill="rgba(47,91,234,0.08)" />
              <Ink d={handCircle(0, 0, GEAR_R * 0.2, GEAR_R * 0.2, 70 + i)} width={1.6} />
              {[0, 120, 240].map((a) => (
                <Ink key={a} d={handPolyline([[Math.cos((a * Math.PI) / 180) * GEAR_R * 0.2, Math.sin((a * Math.PI) / 180) * GEAR_R * 0.2], [Math.cos((a * Math.PI) / 180) * GEAR_R * 0.62, Math.sin((a * Math.PI) / 180) * GEAR_R * 0.62]], 80 + i + a, 0.3)} width={1.4} />
              ))}
            </g>
            <Written p={clamp01((t - at) / 0.8)} x={cx} y={g.up ? cy - GEAR_R - 14 : cy + GEAR_R + 34} w={150} size={30} anchor="middle">
              {g.label}
            </Written>
          </React.Fragment>
        );
      })}
    </>
  );
};

/** The old name, idea and purpose: three blocks of illegible scribble in the card's left panel, drawn 18.0-19.8. */
export const OldPanelArt: React.FC<{t: number; w: number}> = ({t, w}) => {
  const p = clamp01((t - 18.0) / 1.8);
  const x = 50;
  const wide = w - 2 * x;
  return (
    <>
      <Draw d={scribbleD(x, 130, wide * 0.7, 91)} p={seg(p, [0, 0.25])} width={3.4} />
      <Draw d={scribbleD(x, 250, wide, 92)} p={seg(p, [0.25, 0.45])} width={1.8} ink={COLORS.graphiteSoft} />
      <Draw d={scribbleD(x, 285, wide * 0.9, 93)} p={seg(p, [0.4, 0.6])} width={1.8} ink={COLORS.graphiteSoft} />
      <Draw d={scribbleD(x, 320, wide * 0.55, 94)} p={seg(p, [0.55, 0.7])} width={1.8} ink={COLORS.graphiteSoft} />
      <Draw d={scribbleD(x, 410, wide * 0.95, 95)} p={seg(p, [0.7, 0.85])} width={1.8} ink={COLORS.graphiteSoft} />
      <Draw d={scribbleD(x, 445, wide * 0.7, 96)} p={seg(p, [0.85, 1])} width={1.8} ink={COLORS.graphiteSoft} />
    </>
  );
};
