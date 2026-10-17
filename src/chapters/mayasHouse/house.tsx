// house.tsx — the dollhouse. Chapter 1's line drew the house as a front elevation; here that outline becomes the BACK
// wall, and the floor, the two side walls and the ceiling fold up off the page toward the viewer, so the open front
// faces us (a pop-up book room in one-point perspective). The table and the cutouts stand up inside it.
// Pop-ups are data (src/popup): the specs below, one engine.
import React from 'react';
import {COLORS, FONTS} from '../../film';
import {mayasHouse as B, HOUSE_WALLPAPER} from '../../beats4';
import {Box, Drawing, Ink, Line, Ring, Scribble, Window, foldKeys, type Panel, type PopUpSpec} from '../../popup';
import {handRect} from '../../paper';
import {CUTOUTS, HOUSE, REGISTRATION, TABLE, TABLE_POP, type Cutout, type PaperId} from './layout';

const D = HOUSE.depth;
const W = HOUSE.right - HOUSE.left;
const WALL = HOUSE.ground - HOUSE.eaves;
const GABLE = HOUSE.eaves - HOUSE.apex;

/** The net's box in sheet px: the back wall in the middle, the side walls, floor and ceiling lying around it. */
export const HOUSE_BOX = {x: HOUSE.left - D, y: HOUSE.apex, w: W + 2 * D, h: GABLE + WALL + D} as const;

const WALLPAPER = `${HOUSE_WALLPAPER.Maya?.hex ?? '#DBD2FD'}`;
const fold = (start: number, dur: number): Panel['angle'] => foldKeys(start, dur, 90, {spring: 0.05});
const {from: P0, to: P1} = B.popUp;
const span = P1 - P0;

export const DOLLHOUSE: PopUpSpec = {
  id: 'mayasHouse-dollhouse',
  size: {w: HOUSE_BOX.w, h: HOUSE_BOX.h},
  panels: [
    // the outline itself: a pentagon (gable on a wall)
    {id: 'back', rect: {x: D, y: 0, w: W, h: GABLE + WALL}, clip: [[0, (GABLE / (GABLE + WALL)) * 100], [50, 0], [100, (GABLE / (GABLE + WALL)) * 100], [100, 100], [0, 100]]},
    {id: 'floor', parent: 'back', hinge: 'top', rect: {x: D, y: GABLE + WALL, w: W, h: D}, angle: fold(P0, span * 0.6)},
    {id: 'left', parent: 'back', hinge: 'right', rect: {x: 0, y: GABLE, w: D, h: WALL}, angle: fold(P0 + span * 0.2, span * 0.6)},
    {id: 'right', parent: 'back', hinge: 'left', rect: {x: D + W, y: GABLE, w: D, h: WALL}, angle: fold(P0 + span * 0.2, span * 0.6)},
    {id: 'ceiling', parent: 'back', hinge: 'bottom', rect: {x: D, y: GABLE - D, w: W, h: D}, angle: fold(P0 + span * 0.4, span * 0.6)},
  ],
};

/**
 * The house's pencil art in net coordinates, per panel (the nets of the ceiling and the gable overlap, so each panel
 * draws only its own parts). `k` fades it in as the walls rise: it was not on the flat outline.
 */
export const DollhouseArt: React.FC<{panel: string; k: number}> = ({panel, k}) => {
  const bx = D; // back wall left, in the net
  const wy = GABLE; // top of the wall part
  const fy = GABLE + WALL; // floor hinge
  const rx = D + W; // right wall's net left edge
  const parts: Record<string, React.ReactNode> = {
    back: (
      <>
        <rect x={bx} y={wy} width={W} height={WALL} fill={WALLPAPER} opacity={0.32} />
        <Line x1={bx} y1={wy} x2={bx + W} y2={wy} seed={201} width={2} />
        <Window x={bx + 70} y={wy + 90} w={170} h={150} seed={210} />
        <Box x={bx + W - 250} y={wy + 70} w={130} h={96} seed={220} width={1.8} />
        <Ink d={`M ${bx + W - 232} ${wy + 150} l 30 -40 l 22 26 l 18 -16 l 40 30`} width={1.4} />
        <Ring cx={bx + W / 2 + 40} cy={wy + 110} r={30} seed={230} width={1.8} />
        <Ink d={`M ${bx + W / 2 + 40} ${wy + 110} l 0 -18 M ${bx + W / 2 + 40} ${wy + 110} l 13 6`} width={1.6} />
        <Line x1={bx} y1={fy - 26} x2={bx + W} y2={fy - 26} seed={240} width={1.6} />
        <Ring cx={bx + W / 2} cy={GABLE * 0.62} r={44} seed={250} width={2} fill="rgba(180,220,254,0.22)" />
        <Line x1={bx + W / 2 - 44} y1={GABLE * 0.62} x2={bx + W / 2 + 44} y2={GABLE * 0.62} seed={251} width={1.4} />
      </>
    ),
    floor: (
      <>
        {[0.14, 0.28, 0.42, 0.56, 0.7, 0.84].map((u, i) => (
          <Line key={i} x1={bx + W * u} y1={fy} x2={bx + W * u} y2={fy + D} seed={260 + i} width={1.2} />
        ))}
        <Ink d={handRect(bx + W * 0.22, fy + D * 0.2, W * 0.5, D * 0.6, 270, {radius: 10})} width={1.6} fill="rgba(47,91,234,0.08)" />
      </>
    ),
    left: (
      <>
        <rect x={0} y={wy} width={D} height={WALL} fill={WALLPAPER} opacity={0.32} />
        <Window x={D * 0.28} y={wy + 100} w={D * 0.46} h={150} seed={280} />
        <Line x1={0} y1={fy - 26} x2={D} y2={fy - 26} seed={281} width={1.6} />
      </>
    ),
    right: (
      <>
        <rect x={rx} y={wy} width={D} height={WALL} fill={WALLPAPER} opacity={0.32} />
        <Box x={rx + D * 0.3} y={wy + WALL * 0.3} w={D * 0.46} h={WALL * 0.7 - 2} seed={290} width={2.2} />
        <Ink d={`M ${rx + D * 0.38} ${wy + WALL * 0.66} l 6 0`} width={4} />
      </>
    ),
    ceiling: (
      <>
        {[0.33, 0.66].map((u, i) => (
          <Line key={i} x1={bx} y1={GABLE - D * u} x2={bx + W} y2={GABLE - D * u} seed={300 + i} width={1.2} />
        ))}
      </>
    ),
  };
  return (
    <div style={{position: 'absolute', inset: 0, opacity: k}}>
      <Drawing w={HOUSE_BOX.w} h={HOUSE_BOX.h}>
        {parts[panel] ?? null}
      </Drawing>
    </div>
  );
};

// The table: a silhouette that stands up from the floor (a pop-up book's stand-up), legs and top in one card.
const TABLE_H = TABLE.ground - TABLE.top;
const LEG = 5; // % of the width
const SLAB = (18 / TABLE_H) * 100;
export const TABLE_SPEC: PopUpSpec = {
  id: 'mayasHouse-table',
  size: {w: TABLE.w, h: TABLE_H},
  panels: [
    {id: 'foot', rect: {x: 0, y: TABLE_H, w: TABLE.w, h: 0}},
    {
      id: 'table',
      parent: 'foot',
      hinge: 'bottom',
      rect: {x: 0, y: 0, w: TABLE.w, h: TABLE_H},
      angle: [{t: TABLE_POP, a: 88}, {t: TABLE_POP + B.cutouts.each, a: 0, spring: 0.08}],
      hideBefore: TABLE_POP,
      clip: [[0, 0], [100, 0], [100, SLAB], [100 - 2, SLAB], [100 - 2, 100], [100 - 2 - LEG, 100], [100 - 2 - LEG, SLAB], [2 + LEG, SLAB], [2 + LEG, 100], [2, 100], [2, SLAB], [0, SLAB]],
    },
  ],
};

export const TableArt: React.FC = () => (
  <Drawing w={TABLE.w} h={TABLE_H}>
    <Ink d={handRect(1, 1, TABLE.w - 2, (SLAB / 100) * TABLE_H - 1, 401, {radius: 2})} width={2.2} />
    <Line x1={TABLE.w * 0.02} y1={TABLE_H * 0.2} x2={TABLE.w * 0.02} y2={TABLE_H - 1} seed={402} width={2} />
    <Line x1={TABLE.w * (0.02 + LEG / 100)} y1={TABLE_H * 0.2} x2={TABLE.w * (0.02 + LEG / 100)} y2={TABLE_H - 1} seed={403} width={2} />
    <Line x1={TABLE.w * 0.98} y1={TABLE_H * 0.2} x2={TABLE.w * 0.98} y2={TABLE_H - 1} seed={404} width={2} />
    <Line x1={TABLE.w * (0.98 - LEG / 100)} y1={TABLE_H * 0.2} x2={TABLE.w * (0.98 - LEG / 100)} y2={TABLE_H - 1} seed={405} width={2} />
  </Drawing>
);

/** A cutout card standing up on the table: a zero-height foot on the table top and the card hinged to it. */
export const cutoutSpec = (c: Cutout): PopUpSpec => ({
  id: `mayasHouse-${c.id}`,
  size: {w: c.w, h: c.h},
  panels: [
    {id: 'foot', rect: {x: 0, y: c.h, w: c.w, h: 0}},
    {id: 'card', parent: 'foot', hinge: 'bottom', rect: {x: 0, y: 0, w: c.w, h: c.h}, angle: [{t: c.pop, a: 86}, {t: c.pop + B.cutouts.each, a: c.lean, spring: 0.1}], hideBefore: c.pop},
  ],
});
export const CUTOUT_SPECS: Readonly<Record<string, PopUpSpec>> = Object.fromEntries(CUTOUTS.map((c) => [c.id, cutoutSpec(c)]));

const hand = {fontFamily: `Patrick Hand, ${FONTS.hand}`};

/** The art on each paper, in its own box (w x h). Only the box carries words: the script's "Sam's papers". */
export const PaperArt: React.FC<{id: PaperId; w: number; h: number}> = ({id, w, h}) => {
  switch (id) {
    case 'letterA':
    case 'letterB':
      return (
        <Drawing w={w} h={h}>
          <Line x1={w * 0.62} y1={h * 0.16} x2={w * 0.88} y2={h * 0.16} seed={id === 'letterA' ? 500 : 510} width={1.2} />
          <Scribble x={w * 0.12} y={h * 0.36} w={w * 0.74} rows={4} gap={h * 0.13} seed={id === 'letterA' ? 502 : 512} />
        </Drawing>
      );
    case 'form':
      return (
        <Drawing w={w} h={h}>
          <Line x1={w * 0.14} y1={h * 0.12} x2={w * 0.7} y2={h * 0.12} seed={520} width={1.8} />
          {[0.3, 0.46, 0.62, 0.78].map((v, i) => (
            <React.Fragment key={i}>
              <Box x={w * 0.12} y={h * v - 6} w={11} h={11} seed={530 + i} width={1.2} />
              <Line x1={w * 0.32} y1={h * v} x2={w * (0.82 - (i % 2) * 0.12)} y2={h * v} seed={540 + i} width={1.1} />
            </React.Fragment>
          ))}
        </Drawing>
      );
    case 'passportA':
    case 'passportB':
      return (
        <Drawing w={w} h={h}>
          <rect x={0} y={0} width={w} height={h} fill={id === 'passportA' ? 'rgba(122,74,42,0.10)' : 'rgba(42,42,45,0.08)'} />
          <Ring cx={w / 2} cy={h * 0.46} r={w * 0.2} seed={id === 'passportA' ? 550 : 560} width={1.6} />
          <Line x1={w * 0.25} y1={h * 0.2} x2={w * 0.75} y2={h * 0.2} seed={id === 'passportA' ? 551 : 561} width={1.3} />
          <Line x1={w * 0.3} y1={h * 0.8} x2={w * 0.7} y2={h * 0.8} seed={id === 'passportA' ? 552 : 562} width={1.1} />
        </Drawing>
      );
    case 'insurance':
      return (
        <Drawing w={w} h={h}>
          <rect x={0} y={h * 0.14} width={w} height={h * 0.16} fill="rgba(42,42,45,0.12)" />
          <Box x={w * 0.08} y={h * 0.42} w={w * 0.24} h={h * 0.36} seed={570} width={1.3} />
          <Scribble x={w * 0.4} y={h * 0.5} w={w * 0.5} rows={2} gap={h * 0.16} seed={572} />
        </Drawing>
      );
    case 'registration':
      return (
        <Drawing w={w} h={h}>
          <Line x1={w * 0.1} y1={h * 0.2} x2={w * 0.6} y2={h * 0.2} seed={580} width={1.6} />
          <Box x={w * 0.62} y={h * 0.42} w={w * 0.28} h={h * 0.4} seed={581} width={1.2} />
          <Scribble x={w * 0.1} y={h * 0.46} w={w * 0.44} rows={3} gap={h * 0.15} seed={582} />
        </Drawing>
      );
    case 'box':
      return (
        <Drawing w={w} h={h}>
          <rect x={0} y={0} width={w} height={h} fill="rgba(140,110,70,0.14)" />
          <Line x1={2} y1={h * 0.2} x2={w - 2} y2={h * 0.2} seed={590} width={1.8} />
          <text x={w / 2} y={h * 0.66} textAnchor="middle" fontSize={26} fill={COLORS.graphite} style={hand}>
            Sam&apos;s papers
          </text>
        </Drawing>
      );
  }
};

export const paperSize = (id: PaperId): {w: number; h: number} => {
  if (id === 'registration') return REGISTRATION;
  const c = CUTOUTS.find((k) => k.id === id);
  if (!c) throw new Error(`mayasHouse: no cutout ${id}`);
  return {w: c.w, h: c.h};
};
