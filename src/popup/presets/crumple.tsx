// crumple.tsx — a sheet that crumples into a ball and unfolds into a drawing (BIBLE4 5.3).
// The sheet is a grid of facets; every crease folds by a deterministic random angle scaled by one shared 0..1 amount.
import React from 'react';
import {random} from 'remotion';
import {COLORS} from '../../film';
import {Box, Drawing, Line, Ring, Scribble} from '../art';
import type {FoldKey, Panel, PopUpSpec} from '../types';

export type CrumpleData = {
  readonly id: string;
  readonly w: number;
  readonly h: number;
  readonly cols: number;
  readonly rows: number;
  readonly seed: string;
  /** Crumple amount over time: 0 = flat sheet, 1 = ball. */
  readonly amount: readonly FoldKey[];
  /** Largest crease angle at amount 1, degrees. */
  readonly maxCrease?: number;
};

const MIN_CREASE_SHARE = 0.35;

export const crumpleSpec = (d: CrumpleData): PopUpSpec => {
  const max = d.maxCrease ?? 150;
  const fw = d.w / d.cols;
  const fh = d.h / d.rows;
  const panels: Panel[] = [];
  for (let r = 0; r < d.rows; r++) {
    for (let c = 0; c < d.cols; c++) {
      const id = `f${c}-${r}`;
      const rect = {x: c * fw, y: r * fh, w: fw, h: fh};
      if (c === 0 && r === 0) {
        panels.push({id, rect});
        continue;
      }
      // First column hangs from the facet above it (a horizontal crease); every other facet hangs from its left neighbour.
      const fromAbove = c === 0;
      const sign = random(`${d.seed}-s-${c}-${r}`) < 0.5 ? -1 : 1;
      const size = max * (MIN_CREASE_SHARE + (1 - MIN_CREASE_SHARE) * random(`${d.seed}-a-${c}-${r}`));
      const parent = fromAbove ? `f0-${r - 1}` : `f${c - 1}-${r}`;
      panels.push({
        id,
        rect,
        parent,
        hinge: fromAbove ? 'top' : 'left',
        angle: d.amount.map((k) => ({t: k.t, a: k.a * sign * size})),
      });
    }
  }
  return {id: d.id, size: {w: d.w, h: d.h}, panels, keep: {ground: true, centre: true}};
};


/** A rejection letter: a header, scribbled body, a word in the margin. */
export const LetterArt: React.FC<{spec: PopUpSpec}> = ({spec}) => {
  const {w, h} = spec.size;
  return (
    <Drawing w={w} h={h}>
      <Line x1={w * 0.1} y1={h * 0.1} x2={w * 0.5} y2={h * 0.1} seed={3} width={2.6} />
      <Line x1={w * 0.1} y1={h * 0.15} x2={w * 0.34} y2={h * 0.15} seed={4} width={1.6} />
      <Scribble x={w * 0.1} y={h * 0.26} w={w * 0.8} rows={7} gap={h * 0.065} seed={20} />
      <Box x={w * 0.1} y={h * 0.78} w={w * 0.3} h={h * 0.1} seed={31} width={2} />
      <text x={w * 0.14} y={h * 0.855} fontFamily="Patrick Hand" fontSize={Math.round(h * 0.055)} fill={COLORS.graphite}>
        Rejected
      </text>
    </Drawing>
  );
};

const GEARS = [
  {cx: 0.25, cy: 0.35},
  {cx: 0.42, cy: 0.62},
  {cx: 0.6, cy: 0.35},
  {cx: 0.77, cy: 0.62},
];

/** The engine cutaway: a block with four gears. */
export const EngineArt: React.FC<{spec: PopUpSpec}> = ({spec}) => {
  const {w, h} = spec.size;
  return (
    <Drawing w={w} h={h}>
      <Box x={w * 0.04} y={h * 0.1} w={w * 0.92} h={h * 0.8} seed={5} width={2.6} />
      {GEARS.map(({cx, cy}, i) => (
        <React.Fragment key={i}>
          <Ring cx={w * cx} cy={h * cy} r={h * 0.17} seed={40 + i} width={2.2} fill="rgba(47,91,234,0.08)" />
          <Ring cx={w * cx} cy={h * cy} r={h * 0.05} seed={50 + i} width={1.6} />
        </React.Fragment>
      ))}
    </Drawing>
  );
};

/** Two letters crumple 10.0-12.0 (module seconds), the ball unfolds into the engine from 13.0. */
export const CRUMPLE_LETTER: PopUpSpec = crumpleSpec({
  id: 'crumple',
  w: 460,
  h: 600,
  cols: 5,
  rows: 6,
  seed: 'letter',
  amount: [
    {t: 1.0, a: 0},
    {t: 3.0, a: 1},
    {t: 5.0, a: 1},
    {t: 7.0, a: 0},
  ],
});
