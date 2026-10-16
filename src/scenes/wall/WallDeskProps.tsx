// WallDeskProps.tsx — the props that stay on the desk around the grid (BIBLE §2.10: the cup top-left, the pencil
// cup top-right, the ruler and eraser along the bottom edge; nothing overlaps a tile), at the wall's physical scale.
import React from 'react';
import {CoffeeCup, type DeskPoint, Eraser, PencilCup, Placed, Ruler, type PencilKind} from '../../desk';
import type {FormatName} from '../../film';
import {PROP_MM, WALL_PROPS, wallPxPerMm} from './grid';

/** The graphite pencil is in pair A's hand; the accent and the spare stand in the cup. */
const CUP_PENCILS: readonly PencilKind[] = ['accent', 'graphite'];

const rulerPose = (from: {x: number; y: number}, to: {x: number; y: number}) => ({
  centre: {x: (from.x + to.x) / 2, y: (from.y + to.y) / 2},
  rotation: (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI,
  length: Math.hypot(to.x - from.x, to.y - from.y),
});

/** Flat props: under the sheets' layer (nothing overlaps, so the order only matters for shadows). */
export const WallFlatProps: React.FC<{readonly format: FormatName; readonly eraserNudge?: DeskPoint}> = ({format, eraserNudge}) => {
  const p = WALL_PROPS[format];
  const eraser = {x: p.eraser.centre.x + (eraserNudge?.x ?? 0), y: p.eraser.centre.y + (eraserNudge?.y ?? 0)};
  const k = wallPxPerMm(format);
  const ruler = rulerPose(p.ruler.from, p.ruler.to);
  return (
    <>
      <Placed centre={ruler.centre} rotation={ruler.rotation}>
        <Ruler w={ruler.length} h={PROP_MM.ruler.h * k} mm={PROP_MM.ruler.w} />
      </Placed>
      <Placed centre={eraser} rotation={p.eraser.rotation}>
        <Eraser w={PROP_MM.eraser.w * k} h={PROP_MM.eraser.h * k} />
      </Placed>
    </>
  );
};

/** Tall props: over the sheets (their shadows fall on the desk, never on a tile). */
export const WallTallProps: React.FC<{readonly format: FormatName}> = ({format}) => {
  const p = WALL_PROPS[format];
  const k = wallPxPerMm(format);
  return (
    <>
      <Placed centre={p.coffeeCup.centre}>
        <CoffeeCup r={PROP_MM.cupRadius * k} />
      </Placed>
      <Placed centre={p.pencilCup.centre}>
        <PencilCup r={PROP_MM.pencilCupRadius * k} pencils={CUP_PENCILS} />
      </Placed>
    </>
  );
};
