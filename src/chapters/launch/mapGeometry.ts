// map.ts — the world map chapter 8 draws and chapter 9 lives inside (BIBLE4 §1.1, §1.2, decision 2). SHEET px.
// A sketch-map: one long rough coastline per landmass, no borders except the one the village needs (the United States).
// ONE file for the map: chapter 9 imports it (village -> launch, one direction only). The nested village (1400 x 800
// around (27600, 3380)) sits inside the US; Sam's flat (28380, 3180) stands on Iberia, the peninsula that juts out of
// Europe's Atlantic coast (Lisbon); France, Belgium, the Netherlands and Germany are circled east of it, clear of the flat.
import {REGIONS, type Point} from '../../sheet4';

// The nested scale and the village's region (the village chapter lays out inside it; the shared house is placed in it).
/** Drawings at the nested scale are authored at 4x (page px) with the v1 line weights and placed at 0.25 (BIBLE4 §1.1). */
export const NEST = 0.25;
export const AUTHOR = 1 / NEST;
export const VILLAGE_ORIGIN: Point = [REGIONS.village.centre[0] - REGIONS.village.size[0] / 2, REGIONS.village.centre[1] - REGIONS.village.size[1] / 2];
export const villageToRegion = (p: Point): Point => [p[0] - VILLAGE_ORIGIN[0], p[1] - VILLAGE_ORIGIN[1]];

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
  /** Local second the house pops up (Dad's stands already in chapter 9: chapter 8 drew it). */
  readonly popAt: number;
};

/** Floor depth and wall height, sheet px (the projected floor is what the visits look into). */
export const dims = (h: HouseDef): {depth: number; wall: number; roof: number} => {
  const depth = h.width * (h.kind === 'kennel' ? 0.62 : 0.6);
  const wall = h.width * (h.kind === 'flat' ? 0.48 : h.kind === 'kennel' ? 0.36 : 0.3);
  return {depth, wall, roof: h.width * 0.12};
};

/** Dad's house and Maya's: drawn once (houseArt.tsx), placed by both chapters from these numbers. */
export const DAD_AT: Point = [27600, 3262];
export const DAD_WIDTH = 270;
export const MAYA_AT: Point = [27460, 3480];
export const MAYA_WIDTH = 220;
/** Sam's flat, Lisbon: on Iberia's west coast. */
export const LISBON_AT: Point = [28380, 3180];
export const LISBON_WIDTH = 160;

/** Accent circles on the map's Europe (sheet px, radius): FR is east of Iberia so Lisbon's flat (x 28300-28460) is clear of it. */
export const COUNTRY_RINGS = {
  be: {at: [28478, 3090] as Point, r: 26},
  nl: {at: [28496, 3032] as Point, r: 26},
  de: {at: [28590, 3080] as Point, r: 40},
  fr: {at: [28512, 3170] as Point, r: 46},
} as const;
/** The two waypoints of the string across the Atlantic, from the US east coast to Lisbon. */
export const SEA_ROUTE: readonly Point[] = [[28080, 3150], [28260, 3190]];

export const MAP_CENTRE: Point = [28000, 3300];
export const MAP_SIZE: Point = [2600, 1400];

export const US: readonly Point[] = [
  [26760, 2930], [27350, 2936], [27900, 2934], [28060, 2930], [28120, 3000], [28010, 3130], [27980, 3330], [27880, 3560],
  [27960, 3760], [27890, 3790], [27760, 3640], [27500, 3690], [27300, 3800], [27120, 3640], [26900, 3560], [26780, 3300], [26760, 2930],
];
export const EUROPE: readonly Point[] = [
  [28300, 3150], [28340, 3110], [28400, 3080], [28420, 3020], [28460, 2990], [28500, 3010], [28560, 2960], [28620, 2900], [28700, 2880],
  [28800, 2900], [28820, 3000], [28760, 3120], [28700, 3180], [28640, 3160], [28600, 3210], [28520, 3190], [28490, 3240],
  [28440, 3262], [28350, 3270], [28290, 3250], [28280, 3190], [28300, 3150],
];
export const BRITAIN: readonly Point[] = [[28400, 2920], [28430, 2860], [28460, 2900], [28450, 2980], [28410, 2990], [28400, 2920]];

const CANADA: readonly Point[] = [
  [26760, 2930], [26700, 2800], [26820, 2690], [27100, 2630], [27450, 2610], [27800, 2650], [28050, 2720], [28120, 2820], [28060, 2930],
];  // open: its south edge is the US's north edge, drawn once (by the US)
const GREENLAND: readonly Point[] = [[28150, 2640], [28300, 2600], [28470, 2640], [28430, 2770], [28300, 2830], [28190, 2760], [28150, 2640]];
const MEXICO: readonly Point[] = [[26900, 3560], [26960, 3690], [27120, 3790], [27290, 3890], [27420, 4000], [27300, 4000], [27180, 3930], [27020, 3830], [26880, 3700], [26900, 3560]];
const AFRICA: readonly Point[] = [
  [28360, 3290], [28460, 3280], [28560, 3320], [28680, 3350], [28790, 3440], [28760, 3600], [28680, 3760], [28600, 3870], [28530, 3860],
  [28490, 3720], [28440, 3590], [28350, 3480], [28310, 3380], [28360, 3290],
];
const ASIA: readonly Point[] = [
  [28820, 3000], [28900, 2880], [29060, 2790], [29250, 2770], [29300, 2950], [29290, 3150], [29170, 3300], [29010, 3240], [28900, 3330], [28800, 3200],
  [28760, 3120], [28820, 3000],
];

export type Landmass = {readonly id: string; readonly points: readonly Point[]; readonly seed: number};

/** West to east, so the map draws under the rocket's arc. */
export const LANDMASSES: readonly Landmass[] = [
  {id: 'canada', points: CANADA, seed: 11},
  {id: 'mexico', points: MEXICO, seed: 12},
  {id: 'us', points: US, seed: 13},
  {id: 'greenland', points: GREENLAND, seed: 14},
  {id: 'britain', points: BRITAIN, seed: 15},
  {id: 'europe', points: EUROPE, seed: 16},
  {id: 'africa', points: AFRICA, seed: 17},
  {id: 'asia', points: ASIA, seed: 18},
];

export const centreOf = (pts: readonly Point[]): Point => {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
};

/** The launch region's top-left in sheet px (region-local px = sheet px - ORIGIN). */
export const ORIGIN: Point = [REGIONS.launch.centre[0] - REGIONS.launch.size[0] / 2, REGIONS.launch.centre[1] - REGIONS.launch.size[1] / 2];
export const toRegion = (p: Point): Point => [p[0] - ORIGIN[0], p[1] - ORIGIN[1]];
