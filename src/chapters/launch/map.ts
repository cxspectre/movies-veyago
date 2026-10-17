// map.ts — the world map chapter 8 draws and chapter 9 lives inside (BIBLE4 §1.1, §1.2, decision 2). SHEET px.
// A sketch-map: one long rough coastline per landmass, no borders except the one the village needs (the United States).
// The United States, Europe and Britain are the outlines chapter 9's placeholder uses, so the nested village (1400 x 800
// around (27600, 3380)) sits inside the US and Sam's flat (28380, 3180) sits on Europe's Atlantic coast, Lisbon.
import {REGIONS, type Point} from '../../sheet4';

export const MAP_CENTRE: Point = [28000, 3300];
export const MAP_SIZE: Point = [2600, 1400];

export const US: readonly Point[] = [
  [26760, 2930], [27350, 2960], [27900, 2990], [28060, 2930], [28120, 3000], [28010, 3130], [27980, 3330], [27880, 3560],
  [27960, 3760], [27890, 3790], [27760, 3640], [27500, 3690], [27300, 3800], [27120, 3640], [26900, 3560], [26780, 3300], [26760, 2930],
];
export const EUROPE: readonly Point[] = [
  [28330, 3120], [28400, 3080], [28420, 3020], [28460, 2990], [28500, 3010], [28560, 2960], [28620, 2900], [28700, 2880],
  [28800, 2900], [28820, 3000], [28760, 3120], [28700, 3180], [28640, 3160], [28600, 3210], [28520, 3170], [28470, 3200],
  [28440, 3250], [28360, 3260], [28330, 3200], [28330, 3120],
];
export const BRITAIN: readonly Point[] = [[28400, 2920], [28430, 2860], [28460, 2900], [28450, 2980], [28410, 2990], [28400, 2920]];

const CANADA: readonly Point[] = [
  [26760, 2930], [26700, 2800], [26820, 2690], [27100, 2630], [27450, 2610], [27800, 2650], [28050, 2720], [28120, 2820], [28060, 2930],
  [27900, 2990], [27350, 2960], [26760, 2930],
];
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
