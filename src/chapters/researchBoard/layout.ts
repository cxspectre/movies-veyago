// layout.ts — chapter 5's geometry in SHEET px (BIBLE4 5.5; the board and its four cards are the 1600 x 1200 glimpse of
// chapter 1, so the far view and the real board agree).
import {researchBoard as M} from '../../beats4';
import {regionOrigin} from '../../kit';
import type {Point} from '../../sheet4';

export const ORIGIN = regionOrigin('researchBoard');
export const toRegion = (x: number, y: number): [number, number] => [x - ORIGIN[0], y - ORIGIN[1]];

export const BOARD = {x: 15400, y: 3300, w: 1600, h: 1200} as const;
export const CARD = {w: 440, h: 300, frame: {dx: 30, dy: 56, w: 380, h: 230}} as const;
export const CARD_AT: readonly Point[] = [[15540, 3350], [16420, 3350], [15540, 4100], [16420, 4100]];
/** Pin heads: the card's top centre. */
export const CARD_PIN: readonly Point[] = CARD_AT.map(([x, y]) => [x + CARD.w / 2, y + 6] as Point);
export const CENTRE: Point = [16200, 3900];
/** Six pins before any card: the four card spots, the middle where the strings meet, and a corner. */
export const FIRST_PINS: readonly Point[] = [...CARD_PIN, CENTRE, [15470, 3335]];

/** The 2x2 between the cards. */
export const CHART = {x0: 15990, x1: 16400, y0: 3720, y1: 4080} as const;
export const GAP_CIRCLE = {c: [16300, 3790] as Point, r: 70};
/** Seven blank pins along the bottom (3) and the left (4) edges. */
export const COMPETITORS: readonly Point[] = [
  [16090, 4050], [16200, 4038], [16320, 4056],
  [16022, 3790], [16014, 3880], [16024, 3960], [16016, 4030],
];

/** Where each card's super sits: under the card, graphite-line left edge. */
export const SUPER_AT: readonly Point[] = CARD_AT.map(([x, y]) => [x, y + CARD.h + 52] as Point);
export const GAP_SUPER_AT: Point = [16200, 4552];
export const BLOCKS_SUPER_AT: Point = [16200, 4650];

/** The six boxes in a row and the hand truck they end up on. */
export const BOX = {w: 190, h: 110, lid: 30, row: 4340} as const;
export const BOX_X = (k: number): number => 15545 + k * 225;
export const TRUCK = {x: 17100, ground: 4000, stackScale: 0.62} as const;

export const pinSecond = (i: number): number => M.pins.from + i * 0.3;
