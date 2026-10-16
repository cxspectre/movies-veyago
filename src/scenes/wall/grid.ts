// grid.ts — the wall grid of BIBLE §2.10 as data (pure): 15 slots per format, the tile order from beats.ts, the
// physical scale of a tile (an A3 sheet), and the desk props laid off the grid. backToDesk reuses all of it.
import {WALL_GRID_TALL, WALL_GRID_WIDE, type WallTile} from '../../beats';
import type {FormatName} from '../../film';
import {SKETCH_SIZE} from '../../paper';
import type {DeskPoint} from '../../desk';

/** Column centres, row centres and the tile size (desk px) per format: BIBLE §2.10, literally. */
const GRID_GEOMETRY: Record<FormatName, {readonly columns: readonly number[]; readonly rows: readonly number[]; readonly tile: {readonly w: number; readonly h: number}}> = {
  wide: {columns: [288, 672, 1056, 1440, 1824], rows: [220, 540, 860], tile: {w: 340, h: 241}},
  tall: {columns: [190, 540, 890], rows: [300, 630, 960, 1290, 1620], tile: {w: 320, h: 227}},
};

const ORDER: Record<FormatName, readonly (readonly WallTile[])[]> = {wide: WALL_GRID_WIDE, tall: WALL_GRID_TALL};

export type WallSlot = {
  readonly tile: WallTile;
  readonly row: number;
  readonly column: number;
  readonly centre: DeskPoint;
};

/** Desk px per sketch px for a tile: the 1200x850 page shrunk to the tile's width. */
export const tileScale = (format: FormatName): number => GRID_GEOMETRY[format].tile.w / SKETCH_SIZE.width;

/** A3 is 420 mm wide: desk px per mm at the wall's scale (props and the real phone are sized by it). */
const A3_WIDTH_MM = 420;
export const wallPxPerMm = (format: FormatName): number => GRID_GEOMETRY[format].tile.w / A3_WIDTH_MM;

export const tileSize = (format: FormatName): {readonly w: number; readonly h: number} => GRID_GEOMETRY[format].tile;

export const wallSlots = (format: FormatName): readonly WallSlot[] => {
  const g = GRID_GEOMETRY[format];
  return ORDER[format].flatMap((row, r) =>
    row.map((tile, c) => {
      const x = g.columns[c];
      const y = g.rows[r];
      if (x === undefined || y === undefined) throw new Error(`wall: tile ${tile} has no slot at row ${r}, column ${c} (${format})`);
      return {tile, row: r, column: c, centre: {x, y}};
    }),
  );
};

export const slotOfTile = (format: FormatName, tile: WallTile): WallSlot => {
  const slot = wallSlots(format).find((s) => s.tile === tile);
  if (!slot) throw new Error(`wall: no slot for ${tile} (${format})`);
  return slot;
};

/** The redrawn binder home sits in the centre tile. */
export const centreSlot = (format: FormatName): WallSlot => slotOfTile(format, 'binder-home-v2');

/** The grid's bounding box (desk px), tiles edge to edge. */
export const gridBounds = (format: FormatName): {readonly x0: number; readonly y0: number; readonly x1: number; readonly y1: number} => {
  const g = GRID_GEOMETRY[format];
  const first = (a: readonly number[]): number => a[0] ?? 0;
  const last = (a: readonly number[]): number => a[a.length - 1] ?? 0;
  return {
    x0: first(g.columns) - g.tile.w / 2,
    y0: first(g.rows) - g.tile.h / 2,
    x1: last(g.columns) + g.tile.w / 2,
    y1: last(g.rows) + g.tile.h / 2,
  };
};

export const gridCentre = (format: FormatName): DeskPoint => {
  const b = gridBounds(format);
  return {x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2};
};

/** Small fixed rotations per tile (seeded by hand, never animated except while a sheet is carried), degrees. */
export const TILE_ROTATION: Record<WallTile, number> = {
  'v1-home': -1.2,
  'family-tabs': 0.6,
  'watch-wallet': -0.4,
  'pill-bottle': 0.9,
  'share-card': -0.7,
  'scam-letter': 0.5,
  passport: -0.8,
  'binder-home-v2': 0,
  'shared-costs': 0.7,
  'where-is-it': -0.5,
  'visit-recording': 0.8,
  'europe-map': -0.6,
  'speech-bubbles': 0.4,
  'form-to-chat': -0.9,
  phone: 8,
};

/** One sheet in ten has a corner lifted (BIBLE §2.3): these do, at this curl. */
export const TILE_CURL: Partial<Record<WallTile, number>> = {'pill-bottle': 0.5, 'visit-recording': 0.4};

// ---- props off the grid (BIBLE §2.10: cup top-left, pencil cup top-right, ruler and eraser along the bottom) ----

export type WallProp = {readonly centre: DeskPoint; readonly rotation: number};
export type WallProps = {
  readonly coffeeCup: WallProp;
  readonly pencilCup: WallProp;
  readonly eraser: WallProp;
  /** The ruler from one end to the other. */
  readonly ruler: {readonly from: DeskPoint; readonly to: DeskPoint};
};

export const WALL_PROPS: Record<FormatName, WallProps> = {
  wide: {
    coffeeCup: {centre: {x: 34, y: 52}, rotation: 0},
    pencilCup: {centre: {x: 2082, y: 64}, rotation: 0},
    eraser: {centre: {x: 760, y: 1046}, rotation: 18},
    ruler: {from: {x: 300, y: 1040}, to: {x: 543, y: 1048}},
  },
  tall: {
    coffeeCup: {centre: {x: 70, y: 96}, rotation: 0},
    pencilCup: {centre: {x: 1010, y: 100}, rotation: 0},
    eraser: {centre: {x: 650, y: 1812}, rotation: 20},
    ruler: {from: {x: 160, y: 1806}, to: {x: 389, y: 1814}},
  },
};

/** Physical sizes of the props (mm), drawn at the wall's px/mm so they agree with the A3 tiles. */
export const PROP_MM = {
  cupRadius: 44,
  pencilCupRadius: 38,
  eraser: {w: 50, h: 20},
  ruler: {w: 300, h: 30},
  phone: {w: 71.9, h: 150},
} as const;
