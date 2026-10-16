// layout.ts — BIBLE §2.10 as typed data: where every prop sits on the desk, per format.
// Desk coordinates = the wide-desk framing at scale 1.0 (wide 1920x1080, tall 1080x1920). Sheets are the 1200x850
// sketch, scaled. Rotations are fixed; the camera (scene owner) moves, the props do not.
import type {FormatName} from '../film';
import {FORMATS} from '../film';

export type DeskPoint = {readonly x: number; readonly y: number};

export type SheetSlot = {
  readonly centre: DeskPoint;
  /** Scale of the 1200x850 sketch. */
  readonly scale: number;
  readonly rotation: number;
};

export type PropSlot = {
  readonly centre: DeskPoint;
  readonly rotation: number;
  /** Logical px: diameter for round props, width/height for the rest. */
  readonly size: {readonly w: number; readonly h: number};
};

export type RulerSlot = {
  readonly from: DeskPoint;
  readonly to: DeskPoint;
  readonly size: {readonly w: number; readonly h: number};
  readonly rotation: number;
};

export type StackSlot = PropSlot & {
  /** Scale of each blank A3 sheet. */
  readonly scale: number;
  readonly count: number;
  /** Each sheet up the stack turns this much more. */
  readonly rotationStep: number;
};

export type FinishedPagesSlot = {
  /** Where the first finished page lands; each later one adds `step`. */
  readonly first: DeskPoint;
  readonly step: number;
  readonly scale: number;
  readonly rotation: number;
  readonly rotationJitter: number;
};

export type DeskLayout = {
  readonly format: FormatName;
  readonly width: number;
  readonly height: number;
  readonly activeSheet: SheetSlot & {readonly slideInRotation: number};
  readonly v1Sheet: SheetSlot;
  readonly blankStack: StackSlot;
  readonly pencilCup: PropSlot;
  readonly coffeeCup: PropSlot;
  readonly eraser: PropSlot;
  readonly ruler: RulerSlot;
  readonly stickyPad: PropSlot;
  readonly phone: PropSlot;
  readonly finishedPages: FinishedPagesSlot;
};

const point = (x: number, y: number): DeskPoint => ({x, y});
const round = (centre: DeskPoint, r: number): PropSlot => ({centre, rotation: 0, size: {w: r * 2, h: r * 2}});
const box = (centre: DeskPoint, w: number, h: number, rotation: number): PropSlot => ({centre, rotation, size: {w, h}});

const RULER_MM = 300;

const ruler = (from: DeskPoint, to: DeskPoint, h: number, rotation: number): RulerSlot => ({
  from,
  to,
  size: {w: Math.hypot(to.x - from.x, to.y - from.y), h},
  rotation,
});

export const DESK_LAYOUT: Record<FormatName, DeskLayout> = {
  wide: {
    format: 'wide',
    ...FORMATS.wide,
    activeSheet: {centre: point(1080, 560), scale: 0.833, rotation: 0, slideInRotation: 3},
    v1Sheet: {centre: point(330, 300), scale: 0.55, rotation: -6},
    blankStack: {...box(point(1700, 760), 1200 * 0.55, 850 * 0.55, 4), scale: 0.55, count: 4, rotationStep: 1},
    pencilCup: round(point(1780, 180), 60),
    coffeeCup: round(point(560, 470), 70),
    eraser: box(point(560, 900), 60, 24, 18),
    ruler: ruler(point(120, 1010), point(640, 1040), 34, -2),
    stickyPad: box(point(300, 700), 110, 110, -8),
    phone: box(point(1640, 300), 78, 160, 12),
    finishedPages: {first: point(620, 160), step: 40, scale: 0.55, rotation: -4, rotationJitter: 2},
  },
  tall: {
    format: 'tall',
    ...FORMATS.tall,
    activeSheet: {centre: point(540, 900), scale: 0.75, rotation: 0, slideInRotation: 3},
    v1Sheet: {centre: point(200, 260), scale: 0.45, rotation: -8},
    blankStack: {...box(point(900, 1520), 1200 * 0.45, 850 * 0.45, 5), scale: 0.45, count: 4, rotationStep: 1},
    pencilCup: round(point(960, 180), 52),
    coffeeCup: round(point(420, 470), 62),
    eraser: box(point(160, 1500), 54, 22, 20),
    ruler: ruler(point(100, 1800), point(700, 1820), 30, -2),
    stickyPad: box(point(160, 1300), 100, 100, -8),
    phone: box(point(880, 1700), 70, 144, 10),
    finishedPages: {first: point(240, 560), step: 34, scale: 0.45, rotation: -4, rotationJitter: 2},
  },
};

/** Logical px per mm on the ruler (300 mm over its drawn length). */
export const rulerPxPerMm = (slot: RulerSlot): number => slot.size.w / RULER_MM;

/** Where finished page `n` (0-based) lands, with its seeded rotation. */
export const finishedPagePlacement = (layout: DeskLayout, n: number, rotationSeed01: number): SheetSlot => {
  const f = layout.finishedPages;
  return {
    centre: point(f.first.x + f.step * n, f.first.y + f.step * n),
    scale: f.scale,
    rotation: f.rotation + (rotationSeed01 * 2 - 1) * f.rotationJitter,
  };
};

export const DESK_PROP_IDS = ['pencilCup', 'coffeeCup', 'eraser', 'ruler', 'stickyPad', 'phone', 'blankStack'] as const;
export type DeskPropId = (typeof DESK_PROP_IDS)[number];
