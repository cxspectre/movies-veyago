// layout.ts — chapter 9's geometry and per-visit plan, all derived from src/sheet4.ts (REGIONS, VISITS) and
// src/beats4.ts (village, HOUSE_VISITS, HOUSE_WALLPAPER). Sizes are SHEET px at the nested scale (BIBLE4 §1.1, §1.2).
import {HOUSE_WALLPAPER, HOUSE_VISITS, village} from '../../beats4';
import type {FoldKey} from '../../popup';
import {REGIONS, VISITS, type Point} from '../../sheet4';

/** Region origin (top-left) in sheet px: plain elements in the art are placed relative to it. */
export const ORIGIN: Point = [REGIONS.village.centre[0] - REGIONS.village.size[0] / 2, REGIONS.village.centre[1] - REGIONS.village.size[1] / 2];
export const toRegion = (p: Point): Point => [p[0] - ORIGIN[0], p[1] - ORIGIN[1]];

/** Drawings at the nested scale are authored at 4x (page px) with the v1 line weights and placed at 0.25 (BIBLE4 §1.1). */
export const NEST = 0.25;
export const AUTHOR = 1 / NEST;

export type HouseKind = 'house' | 'kennel' | 'flat';
export type HouseId = 'dad' | 'leo' | 'mia' | 'maya' | 'jonas' | 'biscuit' | 'sam';

export type HouseDef = {
  readonly id: HouseId;
  /** The name on the door. */
  readonly door: string;
  /** Floor centre, sheet px (BIBLE4 §1.2). */
  readonly centre: Point;
  /** Front width, sheet px. */
  readonly width: number;
  readonly kind: HouseKind;
  /** HOUSE_WALLPAPER hex (the light "leading" stop). */
  readonly wallpaper: string;
  /** Local second the house pops up (Dad's stands already: chapter 8 drew it). */
  readonly popAt: number;
};

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
  {id: 'dad', door: 'Dad', centre: [27600, 3262], width: 270, kind: 'house', wallpaper: paper('Dad'), popAt: -2},
  {id: 'leo', door: 'Leo', centre: [27310, 3270], width: 200, kind: 'house', wallpaper: paper('Leo'), popAt: popAt('Leo')},
  {id: 'mia', door: 'Mia', centre: [27890, 3270], width: 200, kind: 'house', wallpaper: paper('Mia'), popAt: popAt('Mia')},
  {id: 'sam', door: 'Sam, Lisbon', centre: [28380, 3180], width: 160, kind: 'flat', wallpaper: paper('Sam'), popAt: popAt('Sam')},
  {id: 'maya', door: 'Maya', centre: [27460, 3480], width: 220, kind: 'house', wallpaper: paper('Maya'), popAt: popAt('Maya')},
  {id: 'jonas', door: 'Jonas', centre: [27760, 3480], width: 220, kind: 'house', wallpaper: paper('Jonas'), popAt: popAt('Jonas')},
  {id: 'biscuit', door: 'Biscuit', centre: [27610, 3620], width: 110, kind: 'kennel', wallpaper: paper('Biscuit'), popAt: popAt('Biscuit')},
];

export const house = (id: HouseId): HouseDef => {
  const h = HOUSES.find((x) => x.id === id);
  if (!h) throw new Error(`village: no house ${id}`);
  return h;
};

/** Floor depth and wall height, sheet px (the projected floor is what the visits look into). */
export const dims = (h: HouseDef): {depth: number; wall: number; roof: number} => {
  const depth = h.width * (h.kind === 'kennel' ? 0.62 : 0.6);
  const wall = h.width * (h.kind === 'flat' ? 0.48 : h.kind === 'kennel' ? 0.36 : 0.3);
  return {depth, wall, roof: h.width * 0.12};
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
  [28080, 3150],
  [28260, 3190],
  doorPoint('sam'),
];

// The rise (BIBLE4 §5.9, 50-63)

/** Accent circles on chapter 8's map of Europe (sheet px, radius). */
export const COUNTRIES: readonly {id: (typeof village.countries.ids)[number]; at: Point; r: number}[] = [
  {id: 'be', at: [28470, 3085], r: 12},
  {id: 'nl', at: [28480, 3060], r: 14},
  {id: 'de', at: [28560, 3080], r: 28},
  {id: 'fr', at: [28450, 3130], r: 34},
];

/** "112" and "A4" in the margin. Wide: the bible's (28850, 3000/3080). Tall: the z 0.7 frame ends at x 28871, so they move in. */
export const MARGIN_AT: Record<'wide' | 'tall', readonly Point[]> = {
  wide: [[28850, 3000], [28850, 3080]],
  tall: [[28660, 2930], [28660, 3010]],
};

/** Five bubbles float up from the houses (each from the house below it): start points, sheet px. */
export const BUBBLE_FROM: readonly {from: HouseId; at: Point}[] = [
  {from: 'dad', at: [27600, 3060]},
  {from: 'leo', at: [27300, 3090]},
  {from: 'jonas', at: [27790, 3130]},
  {from: 'mia', at: [27960, 3070]},
  {from: 'maya', at: [27440, 3170]},
];
export const BUBBLE_RISE = 60;

/** Sheet supers' anchors. The bible's "Five countries" at y 3900 is below the wide z 0.9 frame (y 2650-3850): moved up. */
export const SUPER_FIVE_AT: Point = [28000, 3800];

/** The village green (63-75). */
export const GREEN = {form: [27560, 3420] as Point, bubble: [27660, 3420] as Point};
