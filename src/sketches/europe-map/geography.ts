// geography.ts — the coastlines of page 10 as real longitude/latitude points, warped onto the sketch canvas so the
// shapes stay true (Brittany, the Cotentin, the Scheldt, the German Bight, the Baltic, the head of the Adriatic)
// while landing on the bible's stylised layout (BIBLE 4.11): Belgium inside circle-be (470,335), the Netherlands
// inside circle-nl (500,250), France under circle-fr (420,520), and a separate, smaller Britain inside
// (160,120)-(330,330). The eastern edge is a hand's crop line (authored in sketch px), not a coast.
import type {XY} from '../../paper';

type LonLat = readonly [number, number];
type Knots = readonly (readonly [number, number])[];

/** Piecewise-linear map through (input, output) knots, extrapolating at both ends. */
const piecewise =
  (knots: Knots) =>
  (v: number): number => {
    const segment = knots.slice(0, -1).findIndex((_, j) => v <= (knots[j + 1] as readonly [number, number])[0]);
    const i = segment < 0 ? knots.length - 2 : segment;
    const [a0, b0] = knots[i] as readonly [number, number];
    const [a1, b1] = knots[i + 1] as readonly [number, number];
    return b0 + ((v - a0) * (b1 - b0)) / (a1 - a0);
  };

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** Longitude -> x: the west compressed, Belgium centred on x 470, Germany opened up, the east folded in to x ~870. */
const CONTINENT_X = piecewise([
  [-4.8, 250],
  [2.5, 418],
  [5.6, 500],
  [10.4, 700],
  [14.5, 820],
  [17.0, 868],
]);
/** Latitude -> y (north is up): the Low Countries opened up so Belgium spans circle-be and the Netherlands circle-nl;
 * Jutland, north of the German coast, is folded a little shorter. */
const CONTINENT_Y = piecewise([
  [42.4, 718],
  [46.6, 520],
  [49.9, 372],
  [51.4, 302],
  [52.2, 250],
  [54.9, 147],
  [57.8, 52],
]);

/**
 * The Bay of Biscay leans west (a hand's licence) so circle-fr sits on France, not on the sea: full below 46 N
 * and west of the meridian, nothing above the Loire (Brittany keeps its shape) or east of 4 E.
 */
const BISCAY_LEAN = 24;
const biscayShift = ([lon, lat]: LonLat): number => BISCAY_LEAN * clamp01((4 - lon) / 4) * clamp01((47.4 - lat) / 1.4);

/** Britain on its own, smaller grid (it is a separate blob west of the Channel). */
const BRITAIN_X = (lon: number): number => 168 + (lon + 5.75) * 21.4;
const BRITAIN_Y = (lat: number): number => 328 - (lat - 49.96) * 24;

/** Jutland is narrowed about its spine so it reads as the peninsula it is, not a block (only north of 55 N). */
const JUTLAND_SPINE = 9.4;
const JUTLAND_NARROW = 0.62;
const jutlandShift = ([lon, lat]: LonLat): number =>
  (CONTINENT_X(lon) - CONTINENT_X(JUTLAND_SPINE)) * (JUTLAND_NARROW - 1) * clamp01((lat - 54.95) / 0.35);

const onContinent = (p: LonLat): XY => [CONTINENT_X(p[0]) - biscayShift(p) + jutlandShift(p), CONTINENT_Y(p[1])];

/** The peninsula south of 44 N runs at half the continent's north-south scale (a true Italy would leave the page). */
const ITALY_Y = piecewise([
  [38.0, 790],
  [44.0, 643],
]);
const onItaly = (p: LonLat): XY => [CONTINENT_X(p[0]), p[1] >= 44 ? CONTINENT_Y(p[1]) : ITALY_Y(p[1])];
const onBritain = ([lon, lat]: LonLat): XY => [BRITAIN_X(lon), BRITAIN_Y(lat)];

/**
 * The continent, one closed loop drawn the way the bible orders it: from the tip of Brittany east along the Channel,
 * up the Belgian and Dutch coasts, along the German North Sea and Baltic coasts to the Oder, down the eastern crop
 * to the Adriatic, a short crop across Italy, back west along the Mediterranean, across the Pyrenees, and up the
 * Atlantic.
 */
const NORTH: readonly LonLat[] = [
  [-4.78, 48.42],
  [-4.55, 48.62],
  [-4.0, 48.72],
  [-3.45, 48.84],
  [-3.0, 48.8],
  [-2.75, 48.55],
  [-2.3, 48.68],
  [-1.95, 48.62],
  [-1.52, 48.62],
  [-1.6, 48.9],
  [-1.85, 49.4],
  [-1.95, 49.72],
  [-1.6, 49.67],
  [-1.26, 49.68],
  [-1.2, 49.36],
  [-0.6, 49.34],
  [0.15, 49.4],
  [0.1, 49.52],
  [0.4, 49.78],
  [1.1, 49.94],
  [1.58, 50.2],
  [1.6, 50.75],
  [1.9, 50.98],
  [2.45, 51.06],
  [3.1, 51.32],
  [3.55, 51.42],
  [4.05, 51.38],
  [3.65, 51.5],
  [3.5, 51.6],
  [3.95, 51.72],
  [3.9, 51.86],
  [4.15, 52.0],
  [4.45, 52.3],
  [4.62, 52.65],
  [4.78, 52.96],
  [5.35, 53.08],
  [6.15, 53.42],
  [6.85, 53.4],
  [7.1, 53.26],
  [7.15, 53.58],
  [7.8, 53.72],
  [8.08, 53.62],
  [8.18, 53.42],
  [8.42, 53.6],
  [8.62, 53.86],
  [9.0, 53.84],
  [9.15, 53.74],
  [8.95, 54.06],
  [8.82, 54.3],
  [8.62, 54.42],
  [9.0, 54.5],
  [8.72, 54.8],
  // Jutland, up the west coast to the Skaw and back down the Kattegat side
  [8.62, 55.3],
  [8.12, 55.56],
  [8.16, 56.1],
  [8.12, 56.62],
  [8.6, 57.1],
  [9.55, 57.18],
  [10.0, 57.55],
  [10.6, 57.74],
  [10.48, 57.42],
  [10.3, 56.95],
  [10.28, 56.62],
  [10.88, 56.42],
  [10.3, 56.15],
  [9.98, 55.82],
  [9.68, 55.5],
  [9.6, 55.15],
  [9.9, 54.62],
  [10.05, 54.42],
  [10.2, 54.34],
  [10.95, 54.38],
  [10.85, 54.0],
  [11.45, 53.94],
  [12.1, 54.18],
  [12.6, 54.45],
  [13.35, 54.62],
  [13.7, 54.32],
  [14.05, 54.04],
  [14.28, 53.88],
  [14.42, 53.3],
  [14.62, 52.55],
  [14.72, 51.8],
  [15.0, 51.12],
];

/**
 * The eastern crop, in sketch px: where the hand stops the map. It leaves the Neisse and wobbles south with a few
 * kinks (the Glatz bulge, Moravia, the Vienna gap, Carinthia) down to the head of the Adriatic at Trieste.
 */
const ALPS_CROP_JOIN: XY = [868, 436];
const EAST_CROP: readonly XY[] = [
  [848, 327],
  [867, 322],
  [859, 347],
  [866, 372],
  [851, 393],
  [872, 413],
  ALPS_CROP_JOIN,
  [846, 452],
  [857, 482],
  [848, 511],
  [831, 536],
  [811, 555],
];

/** From Trieste round the head of the Adriatic to the Po delta. */
const ADRIATIC: readonly LonLat[] = [
  [13.77, 45.64],
  [13.5, 45.76],
  [13.1, 45.66],
  [12.62, 45.52],
  [12.35, 45.44],
  [12.25, 45.17],
  [12.52, 44.95],
];

/** Italy, squeezed north-south so the boot fits the page: down the Adriatic, round the heel and toe, up to Livorno. */
const ITALY: readonly LonLat[] = [
  [12.57, 44.06],
  [13.6, 43.6],
  [14.2, 42.45],
  [15.0, 42.0],
  [16.15, 41.92],
  [15.95, 41.6],
  [16.87, 41.13],
  [17.95, 40.65],
  [18.5, 40.15],
  [18.36, 39.8],
  [17.98, 40.05],
  [17.2, 40.45],
  [16.6, 40.05],
  [16.55, 39.6],
  [17.1, 39.05],
  [16.55, 38.45],
  [16.05, 37.95],
  [15.65, 38.15],
  [16.05, 38.85],
  [15.75, 39.7],
  [15.6, 40.05],
  [14.95, 40.3],
  [14.75, 40.65],
  [14.25, 40.83],
  [13.7, 41.25],
  [12.9, 41.4],
  [12.25, 41.75],
  [11.75, 42.1],
  [11.1, 42.45],
  [10.55, 42.95],
  [10.3, 43.55],
];

/** The Ligurian and French Mediterranean coasts west to Cerbère, in few points. */
const MEDITERRANEAN: readonly LonLat[] = [
  [10.2, 43.95],
  [9.85, 44.08],
  [8.95, 44.42],
  [8.2, 44.02],
  [7.5, 43.78],
  [6.9, 43.45],
  [5.93, 43.1],
  [5.3, 43.32],
  [4.55, 43.43],
  [3.65, 43.4],
  [3.05, 42.95],
  [3.17, 42.44],
];

/** The Pyrenees crop and the Atlantic coast north to Brittany, closing the loop. */
const WEST: readonly LonLat[] = [
  [2.0, 42.42],
  [0.8, 42.68],
  [-0.4, 42.82],
  [-1.2, 43.1],
  [-1.78, 43.38],
  [-1.5, 43.6],
  [-1.28, 44.1],
  [-1.22, 44.66],
  [-1.15, 45.15],
  [-1.15, 45.55],
  [-1.1, 45.8],
  [-1.2, 46.15],
  [-1.82, 46.5],
  [-2.18, 46.92],
  [-2.2, 47.28],
  [-2.8, 47.45],
  [-3.15, 47.5],
  [-3.45, 47.7],
  [-3.9, 47.84],
  [-4.36, 47.8],
  [-4.3, 48.1],
  [-4.72, 48.04],
  [-4.5, 48.24],
  [-4.62, 48.34],
  [-4.82, 48.36],
  [-4.74, 48.46],
];

/** Great Britain, clockwise from Dover. */
const BRITAIN: readonly LonLat[] = [
  [1.36, 51.14],
  [0.97, 50.93],
  [0.25, 50.74],
  [-0.6, 50.8],
  [-1.3, 50.72],
  [-2.45, 50.56],
  [-3.0, 50.7],
  [-3.64, 50.24],
  [-4.4, 50.36],
  [-5.2, 49.98],
  [-5.71, 50.07],
  [-5.4, 50.25],
  [-4.53, 51.02],
  [-3.5, 51.22],
  [-2.7, 51.6],
  [-3.9, 51.6],
  [-4.4, 51.58],
  [-5.3, 51.86],
  [-4.2, 52.42],
  [-4.75, 52.8],
  [-4.62, 53.32],
  [-3.6, 53.32],
  [-3.02, 53.5],
  [-3.05, 53.88],
  [-3.25, 54.14],
  [-3.62, 54.5],
  [-3.25, 54.94],
  [-4.86, 54.66],
  [-4.75, 55.45],
  [-5.45, 55.95],
  [-5.65, 56.65],
  [-5.75, 57.4],
  [-5.2, 58.1],
  [-4.98, 58.62],
  [-3.08, 58.64],
  [-3.1, 58.42],
  [-4.15, 57.56],
  [-2.0, 57.7],
  [-2.1, 57.15],
  [-2.58, 56.3],
  [-3.2, 56.02],
  [-2.5, 56.0],
  [-2.0, 55.76],
  [-1.43, 55.02],
  [-1.15, 54.62],
  [-0.08, 54.12],
  [-0.15, 53.62],
  [0.15, 53.56],
  [0.3, 52.95],
  [1.3, 52.96],
  [1.76, 52.48],
  [1.28, 51.94],
  [0.6, 51.52],
  [1.44, 51.38],
  [1.34, 51.2],
];

/** France / Belgium and Luxembourg: from the coast at the Belgian line to the Moselle at Schengen. */
const FRANCE_BELGIUM: readonly LonLat[] = [
  [2.55, 51.08],
  [3.1, 50.78],
  [4.15, 50.3],
  [4.85, 50.05],
  [5.8, 49.55],
  [6.37, 49.46],
];

/** The Netherlands / Belgium: from the Scheldt mouth east, then down the Limburg strip to Vaals. */
const NETHERLANDS_BELGIUM: readonly LonLat[] = [
  [3.42, 51.4],
  [4.3, 51.38],
  [5.1, 51.45],
  [5.85, 51.15],
  [5.7, 50.82],
  [6.02, 50.75],
];

/** Germany's western border from the Ems to the Rhine and Basel, then east along the Alps; it ends on the crop line. */
const GERMANY_WEST_AND_SOUTH: readonly LonLat[] = [
  [7.2, 53.27],
  [7.05, 52.6],
  [6.7, 52.3],
  [6.15, 51.85],
  [6.05, 51.2],
  [6.02, 50.75],
  [6.4, 50.3],
  [6.13, 50.0],
  [6.37, 49.46],
  [7.0, 49.15],
  [8.2, 48.98],
  [7.85, 48.4],
  [7.58, 47.58],
  [8.6, 47.65],
  [9.6, 47.52],
  [10.5, 47.5],
  [12.2, 47.65],
  [13.0, 47.5],
  [13.4, 48.3],
  [14.6, 48.65],
];

/** France / Switzerland and Italy: from Basel down the Alps to Menton. */
const FRANCE_ALPS: readonly LonLat[] = [
  [7.58, 47.58],
  [6.95, 47.4],
  [6.1, 46.4],
  [7.0, 45.9],
  [6.7, 45.1],
  [7.0, 44.2],
  [7.5, 43.8],
];

export const continentPoints = (): readonly XY[] => [
  ...NORTH.map(onContinent),
  ...EAST_CROP,
  ...ADRIATIC.map(onContinent),
  ...ITALY.map(onItaly),
  ...MEDITERRANEAN.map(onContinent),
  ...WEST.map(onContinent),
];
export const britainPoints = (): readonly XY[] => BRITAIN.map(onBritain);
export const franceBelgiumPoints = (): readonly XY[] => FRANCE_BELGIUM.map(onContinent);
export const lowCountriesPoints = (): readonly XY[] => NETHERLANDS_BELGIUM.map(onContinent);
export const germanyBorderPoints = (): readonly XY[] => [...GERMANY_WEST_AND_SOUTH.map(onContinent), ALPS_CROP_JOIN];
export const franceAlpsPoints = (): readonly XY[] => FRANCE_ALPS.map(onContinent);
