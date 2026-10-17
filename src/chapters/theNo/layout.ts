// layout.ts — chapter 3's sheet numbers (BIBLE4 5.3 / sheet4.ts REGIONS.theNo), in SHEET px unless a name says local.
import {REGIONS} from '../../sheet4';
import type {Point} from '../../sheet4';

const R = REGIONS.theNo;
const ORIGIN: Point = [R.centre[0] - R.size[0] / 2, R.centre[1] - R.size[1] / 2];
/** Sheet px -> region-local px (what plain elements in the Art use). */
export const local = (p: Point): Point => [p[0] - ORIGIN[0], p[1] - ORIGIN[1]];

export const LETTER = {w: 460, h: 600, radius: 180, centres: [[8640, 4000], [9360, 4000]] as const, tilt: [-3, 2] as const};
export const BALL_AT: Point = [9000, 4000];

/** The drawing that unfolds from the ball and that the scissors cut: old panel on the left, the engine on the right. */
export const CARD = {w: 1200, h: 560, centre: [9000, 4000] as Point, cutX: 480};
export const CARD_CUT: readonly (readonly [number, number])[] = [
  [CARD.cutX, 0],
  [CARD.cutX - 4, 140],
  [CARD.cutX + 5, 290],
  [CARD.cutX, 430],
  [CARD.cutX, CARD.h],
];
/** The engine block inside the card (card coordinates). 680 x 400 rather than 900 x 520 so card + slide stay in the 1080 column. */
export const ENGINE = {x: 510, y: 80, w: 680, h: 400};
export const GEARS = [
  {fx: 0.17, fy: 0.38, label: 'storage', dir: 1, up: true},
  {fx: 0.39, fy: 0.64, label: 'sync', dir: -1, up: false},
  {fx: 0.61, fy: 0.38, label: 'reminders', dir: 1, up: true},
  {fx: 0.83, fy: 0.64, label: 'export', dir: -1, up: false},
] as const;
export const GEAR_R = 82;
export const GEAR_DEG_PER_S = 6;
/** The unfold takes this long (then the creases fade for UNFOLD_FADE). */
export const UNFOLD = {duration: 2.0, fade: 1.0};

/** The split: right half (the engine) slides right, the left half (old name, idea, purpose) left and fades. */
export const SPLIT = {right: 150, left: -320, slideDur: 1.0};
/** Card centre of the right half's piece after the slide: where the carry starts. */
export const PIECE_CENTRE_X = CARD.centre[0] - CARD.w / 2 + (CARD.cutX + CARD.w) / 2 + SPLIT.right;

export const CALENDAR = {w: 520, h: 600, centre: [9000, 3200] as Point};
export const DATE_ROLL: Point = [9000, 3650];
export const GUIDELINE_AT: Point = [9000, 4500];
export const SUPER_AT: Point = [9000, 3500];

/** The carry: the right piece scales to CARRY_SCALE and rides above the line's head from x 9450 to 10800. */
export const CARRY = {scale: 0.75, from: PIECE_CENTRE_X, to: 10800, lift: 40};
