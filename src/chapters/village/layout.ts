// layout.ts — chapter 9's geometry and per-visit plan, all derived from src/sheet4.ts (REGIONS, VISITS) and
// src/beats4.ts (village, HOUSE_VISITS, HOUSE_WALLPAPER). Sizes are SHEET px at the nested scale (BIBLE4 §1.1, §1.2).
import {HOUSE_WALLPAPER, HOUSE_VISITS, village} from '../../beats4';
import type {FoldKey} from '../../popup';
import {REGIONS, VISITS, type Point} from '../../sheet4';
import {
  AUTHOR, COUNTRY_RINGS, DAD_AT, DAD_WIDTH, LISBON_AT, LISBON_WIDTH, MAYA_AT, MAYA_WIDTH, NEST, SEA_ROUTE, dims,
  type HouseDef, type HouseId, type HouseKind,
} from '../launch/mapGeometry';

export {AUTHOR, NEST, dims};
export type {HouseDef, HouseId, HouseKind};

/** Region origin (top-left) in sheet px: plain elements in the art are placed relative to it. */
export const ORIGIN: Point = [REGIONS.village.centre[0] - REGIONS.village.size[0] / 2, REGIONS.village.centre[1] - REGIONS.village.size[1] / 2];
export const toRegion = (p: Point): Point => [p[0] - ORIGIN[0], p[1] - ORIGIN[1]];


const popAt = (name: string): number => {
  const h = village.houses.find((x) => x.name === name);
  if (!h) throw new Error(`village: no pop time for ${name}`);
  return h.at;
};
const paper = (name: string): string => {
  const w = HOUSE_WALLPAPER[name];
  if (!w) throw new Error(`village: no wallpaper for ${name}`);
  return w.hex;
};

/** Back row first, so nearer houses overlap farther ones. */
export const HOUSES: readonly HouseDef[] = [
  {id: 'dad', door: 'Dad', centre: DAD_AT, width: DAD_WIDTH, kind: 'house', wallpaper: paper('Dad'), popAt: -2},
  {id: 'leo', door: 'Leo', centre: [27310, 3270], width: 200, kind: 'house', wallpaper: paper('Leo'), popAt: popAt('Leo')},
  {id: 'mia', door: 'Mia', centre: [27890, 3270], width: 200, kind: 'house', wallpaper: paper('Mia'), popAt: popAt('Mia')},
  {id: 'sam', door: 'Sam, Lisbon', centre: LISBON_AT, width: LISBON_WIDTH, kind: 'flat', wallpaper: paper('Sam'), popAt: popAt('Sam')},
  {id: 'maya', door: 'Maya', centre: MAYA_AT, width: MAYA_WIDTH, kind: 'house', wallpaper: paper('Maya'), popAt: popAt('Maya')},
  {id: 'jonas', door: 'Jonas', centre: [27760, 3480], width: 220, kind: 'house', wallpaper: paper('Jonas'), popAt: popAt('Jonas')},
  {id: 'biscuit', door: 'Biscuit', centre: [27610, 3620], width: 110, kind: 'kennel', wallpaper: paper('Biscuit'), popAt: popAt('Biscuit')},
];

export const house = (id: HouseId): HouseDef => {
  const h = HOUSES.find((x) => x.id === id);
  if (!h) throw new Error(`village: no house ${id}`);
  return h;
};

// The visits

export type Resident = {readonly character: 'leo' | 'mia' | 'dad' | 'jonas' | 'biscuit' | 'sam'; readonly pose: string; readonly dx: number};

export type VisitPlan = {
  readonly n: number;
  readonly house: HouseId;
  /** Flight start, wall-open time (local seconds) and the visit camera centre. */
  readonly at: number;
  readonly open: number;
  readonly centre: Point;
  readonly note: string;
  /** Which interior page (src/chapters/village/pages.ts). */
  readonly interior: 'passport' | 'watch-wallet' | 'pill-bottle' | 'share-card' | 'shared-costs' | 'scam-letter' | 'visit-recording' | 'vet-card' | 'friend-papers';
  readonly residents: readonly Resident[];
};

const HOUSE_OF: readonly HouseId[] = ['leo', 'dad', 'dad', 'maya', 'jonas', 'maya', 'dad', 'biscuit', 'sam'];
const INTERIOR: readonly VisitPlan['interior'][] = ['passport', 'watch-wallet', 'pill-bottle', 'share-card', 'shared-costs', 'scam-letter', 'visit-recording', 'vet-card', 'friend-papers'];
/** BIBLE4 §4 pose list, chapter 9 `at-home`: Leo and Mia at the fridge; Dad in bed, in the kitchen, at the doctor's; Jonas at a table; Biscuit in the kennel; Sam with the key. Maya's own house has only Maya. */
const RESIDENTS: readonly (readonly Resident[])[] = [
  [{character: 'leo', pose: 'reach', dx: 0.22}, {character: 'mia', pose: 'reach', dx: 0.38}],
  [{character: 'dad', pose: 'lie', dx: 0.18}],
  [{character: 'dad', pose: 'hold-up', dx: 0.3}],
  [],
  [{character: 'jonas', pose: 'sit', dx: 0.3}],
  [],
  [{character: 'dad', pose: 'sit', dx: 0.3}],
  [{character: 'biscuit', pose: 'lie', dx: 0.1}],
  [{character: 'sam', pose: 'hold-up', dx: 0.3}],
];

export const VISIT_PLANS: readonly VisitPlan[] = HOUSE_VISITS.map((v, i) => {
  const h = HOUSE_OF[i];
  const interior = INTERIOR[i];
  const residents = RESIDENTS[i];
  if (!h || !interior || !residents) throw new Error(`village: no plan for visit ${v.n}`);
  // HOUSE_VISITS carries the times; the camera centre is the sheet's VISITS (same index).
  const centre = VISITS[i]?.centre;
  if (!centre) throw new Error(`village: no camera visit ${v.n}`);
  return {n: v.n, house: h, at: v.at, open: v.open, centre, note: v.note, interior, residents};
});

export const VISIT = village.visit;
/** The front wall's fold, seconds. */
export const FRONT_FOLD = 0.6;
const FRONT_CLOSED = 88;
const FRONT_OPEN = 166;

/** When each visit's front wall closes again (undefined: the next visit is the same house, so it stays open). */
export const closeAt = (i: number): number | undefined => {
  const v = VISIT_PLANS[i];
  const next = VISIT_PLANS[i + 1];
  if (!v) return undefined;
  if (next && next.house === v.house && next.at === v.open + VISIT.holdSeconds) return undefined;
  return v.open + VISIT.holdSeconds;
};

/** The front wall's fold keys: up with the house, then open and shut for each of its visits. */
export const frontKeys = (h: HouseDef): readonly FoldKey[] => {
  const keys: FoldKey[] = [
    {t: h.popAt + 0.3, a: 0},
    {t: h.popAt + 0.3 + FRONT_FOLD, a: FRONT_CLOSED, spring: 0.05},
  ];
  VISIT_PLANS.forEach((v, i) => {
    if (v.house !== h.id) return;
    const last = keys[keys.length - 1];
    if (!last || last.a !== FRONT_OPEN) {
      keys.push({t: v.open, a: FRONT_CLOSED}, {t: v.open + FRONT_FOLD, a: FRONT_OPEN, spring: 0.05});
    }
    const c = closeAt(i);
    if (c !== undefined) keys.push({t: c, a: FRONT_OPEN}, {t: c + FRONT_FOLD, a: FRONT_CLOSED, spring: 0.04});
  });
  return keys;
};

// The string (BIBLE4 §5.9: 10.5-13.0 dotted string connects all seven): door to door, then across the sea to Sam.
const doorPoint = (id: HouseId): Point => {
  const h = house(id);
  return [h.centre[0], h.centre[1] + dims(h).depth / 2 + 6];
};
export const STRING_ROUTE: readonly Point[] = [
  doorPoint('dad'),
  doorPoint('leo'),
  doorPoint('maya'),
  doorPoint('biscuit'),
  doorPoint('jonas'),
  doorPoint('mia'),
  ...SEA_ROUTE,
  doorPoint('sam'),
];

// The rise (BIBLE4 §5.9, 50-63)

/** Accent circles on chapter 8's map of Europe (sheet px, radius). */
export const COUNTRIES: readonly {id: (typeof village.countries.ids)[number]; at: Point; r: number}[] = [
  {id: 'be', ...COUNTRY_RINGS.be},
  {id: 'nl', ...COUNTRY_RINGS.nl},
  {id: 'de', ...COUNTRY_RINGS.de},
  {id: 'fr', ...COUNTRY_RINGS.fr},
];

/** "112" and "A4" in the margin. Wide: the bible's (28850, 3000/3080). Tall: the z 0.7 frame ends at x 28871, so they move in. */
export const MARGIN_AT: Record<'wide' | 'tall', readonly Point[]> = {
  wide: [[28850, 3000], [28850, 3080]],
  tall: [[28660, 2930], [28660, 3010]],
};

/** Five bubbles float up from the houses (each from the house below it): start points, sheet px. */
export const BUBBLE_FROM: readonly {from: HouseId; at: Point}[] = [
  {from: 'dad', at: [27640, 3100]},
  {from: 'leo', at: [27440, 3190]},
  {from: 'jonas', at: [27840, 3190]},
  {from: 'mia', at: [28040, 3100]},
  {from: 'maya', at: [28240, 3190]},
];
export const BUBBLE_RISE = 60;

/** Sheet supers' anchors. The bible's "Five countries" at y 3900 is below the wide z 0.9 frame (y 2650-3850): moved up. */
export const SUPER_FIVE_AT: Point = [28000, 3800];

/** The village green (63-75). */
export const GREEN = {form: [27575, 3720] as Point, bubble: [27610, 3720] as Point};
