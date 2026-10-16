// house.tsx — the dollhouse net (BIBLE4 5.2) and the village house (5.9). One builder, different data.
import React from 'react';
import {foldKeys} from '../fold';
import {Box, Drawing, Hatch, Ink, Line, Scribble, Window} from '../art';
import {handRect} from '../../paper';
import {COLORS, FONTS} from '../../film';
import type {Panel, PopUpSpec} from '../types';

export type HouseData = {
  readonly id: string;
  /** Front width, depth (floor) and wall height, px. */
  readonly width: number;
  readonly depth: number;
  readonly wall: number;
  /** Height of the yard (the front wall lying open) and of the roof flap, px. */
  readonly yard: number;
  readonly roof: number;
  /** Seconds each part starts folding, and how long a fold takes. */
  readonly timing: {readonly back: number; readonly sides: number; readonly roof: number; readonly front?: number; readonly dur: number};
  /** Final angles (degrees): walls stand near 90, the roof leans back (negative). */
  readonly angles: {readonly back: number; readonly sides: number; readonly roof: number; readonly front: number};
  /** Wallpaper wash over the inside walls (rgba) and the door label, if any. */
  readonly wallpaper?: string;
  readonly doorLabel?: string;
};

export const houseSpec = (d: HouseData): PopUpSpec & {readonly data: HouseData} => {
  const side = d.wall;
  const ox = side; // the left wall's net lies left of the floor
  const oy = d.roof;
  const {dur, back, sides, roof, front} = d.timing;
  const panels: readonly Panel[] = [
    {id: 'floor', rect: {x: ox, y: oy + d.wall, w: d.width, h: d.depth}},
    {id: 'back', parent: 'floor', hinge: 'bottom', rect: {x: ox, y: oy, w: d.width, h: d.wall}, angle: foldKeys(back, dur, d.angles.back), tint: d.wallpaper},
    {id: 'left', parent: 'floor', hinge: 'right', rect: {x: 0, y: oy + d.wall, w: d.wall, h: d.depth}, angle: foldKeys(sides, dur, d.angles.sides), tint: d.wallpaper},
    {id: 'right', parent: 'floor', hinge: 'left', rect: {x: ox + d.width, y: oy + d.wall, w: d.wall, h: d.depth}, angle: foldKeys(sides, dur, d.angles.sides), tint: d.wallpaper},
    {id: 'roof', parent: 'back', hinge: 'bottom', rect: {x: ox, y: 0, w: d.width, h: d.roof}, angle: foldKeys(roof, dur, d.angles.roof)},
    {id: 'front', parent: 'floor', hinge: 'top', rect: {x: ox, y: oy + d.wall + d.depth, w: d.width, h: d.yard}, angle: front === undefined ? 0 : foldKeys(front, dur, d.angles.front)},
  ];
  return {id: d.id, size: {w: ox * 2 + d.width, h: oy + d.wall + d.depth + d.yard}, panels, data: d};
};

/** Pencil art in net coordinates. Side walls are drawn rotated so that "up" is up once they stand. */
export const HouseArt: React.FC<{spec: ReturnType<typeof houseSpec>}> = ({spec}) => {
  const d = spec.data;
  const ox = d.wall;
  const oy = d.roof;
  const fy = oy + d.wall + d.depth; // top of the yard
  const sideMid = d.depth / 2;
  return (
    <Drawing w={spec.size.w} h={spec.size.h}>
      {/* back wall: window, picture, skirting */}
      <Window x={ox + d.width * 0.12} y={oy + d.wall * 0.2} w={d.width * 0.22} h={d.wall * 0.34} seed={11} />
      <Box x={ox + d.width * 0.5} y={oy + d.wall * 0.18} w={d.width * 0.16} h={d.wall * 0.22} seed={14} width={1.8} />
      <Line x1={ox + d.width * 0.54} y1={oy + d.wall * 0.26} x2={ox + d.width * 0.62} y2={oy + d.wall * 0.26} seed={15} width={1.2} />
      <Line x1={ox} y1={oy + d.wall * 0.88} x2={ox + d.width} y2={oy + d.wall * 0.88} seed={16} width={1.6} />
      <Hatch x={ox + d.width * 0.72} y={oy + d.wall * 0.14} w={d.width * 0.2} h={d.wall * 0.5} gap={9} seed={600} />
      {/* floor: boards and a rug */}
      {[0.25, 0.5, 0.75].map((k, i) => (
        <Line key={i} x1={ox} y1={oy + d.wall + d.depth * k} x2={ox + d.width} y2={oy + d.wall + d.depth * k} seed={20 + i} width={1.2} />
      ))}
      <Ink d={handRect(ox + d.width * 0.28, oy + d.wall + d.depth * 0.3, d.width * 0.44, d.depth * 0.4, 21, {radius: 10})} width={1.8} fill="rgba(47,91,234,0.10)" />
      {/* left wall (rotated -90): top at the net's left end */}
      <g transform={`matrix(0,-1,1,0,0,${oy + d.wall + d.depth})`}>
        <Window x={sideMid - 50} y={d.wall * 0.22} w={100} h={d.wall * 0.36} seed={30} />
        <Line x1={0} y1={d.wall * 0.88} x2={d.depth} y2={d.wall * 0.88} seed={34} width={1.6} />
      </g>
      {/* right wall (rotated +90): top at the net's right end */}
      <g transform={`matrix(0,1,-1,0,${ox + d.width + d.wall},${oy + d.wall})`}>
        <Box x={sideMid - 36} y={d.wall * 0.3} w={72} h={d.wall * 0.58} seed={40} width={2.2} />
        <Ink d={`M ${sideMid + 22} ${d.wall * 0.6} l 5 1`} width={4} />
        <Line x1={0} y1={d.wall * 0.88} x2={d.depth} y2={d.wall * 0.88} seed={44} width={1.6} />
      </g>
      {/* roof flap: shingle rows */}
      {[0.25, 0.5, 0.75].map((k, i) => (
        <Line key={i} x1={ox} y1={d.roof * k} x2={ox + d.width} y2={d.roof * k} seed={50 + i} width={1.4} />
      ))}
      {/* the yard: path, fence, grass */}
      <Ink d={`M ${ox + d.width * 0.42} ${fy} L ${ox + d.width * 0.36} ${fy + d.yard} M ${ox + d.width * 0.58} ${fy} L ${ox + d.width * 0.64} ${fy + d.yard}`} width={2} />
      {Array.from({length: 9}, (_, i) => (
        <Line key={i} x1={ox + 14 + i * ((d.width - 28) / 8)} y1={fy + d.yard - 10} x2={ox + 14 + i * ((d.width - 28) / 8)} y2={fy + d.yard - 34} seed={70 + i} width={1.6} />
      ))}
      <Line x1={ox + 10} y1={fy + d.yard - 24} x2={ox + d.width - 10} y2={fy + d.yard - 24} seed={80} width={1.6} />
      <Scribble x={ox + 24} y={fy + 24} w={90} rows={2} gap={12} seed={90} />
      {d.doorLabel ? (
        <>
          <Box x={ox + d.width * 0.5 - 50} y={fy + 10} w={100} h={d.yard - 24} seed={95} width={2.2} />
          <text x={ox + d.width / 2} y={fy + d.yard * 0.55} textAnchor="middle" fontFamily="Patrick Hand" fontSize={26} fill={COLORS.graphite} style={{fontFamily: `Patrick Hand, ${FONTS.hand}`}}>
            {d.doorLabel}
          </text>
        </>
      ) : null}
    </Drawing>
  );
};

/** BIBLE4 5.2: back and side walls lift (to ~80°), the roof folds, the front lies open as the yard. */
export const MAYAS_HOUSE: ReturnType<typeof houseSpec> = houseSpec({
  id: 'mayasHouse',
  width: 620,
  depth: 380,
  wall: 300,
  yard: 150,
  roof: 120,
  timing: {back: 0.0, sides: 0.35, roof: 1.0, dur: 0.9},
  angles: {back: 86, sides: 80, roof: -32, front: 0},
  wallpaper: 'rgba(219,210,253,0.30)',
});

/** BIBLE4 5.9: a small house that pops up with a door label. */
export const villageHouse = (id: string, label: string, wallpaper: string, start: number): ReturnType<typeof houseSpec> =>
  houseSpec({
    id,
    width: 260,
    depth: 170,
    wall: 150,
    yard: 90,
    roof: 70,
    timing: {back: start, sides: start + 0.15, roof: start + 0.5, dur: 0.6},
    angles: {back: 86, sides: 82, roof: -30, front: 0},
    wallpaper,
    doorLabel: label,
  });
