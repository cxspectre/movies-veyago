// glimpses.ts — the far view's glimpses (BIBLE4 §1.5, §5.1): each chapter's hero shape as ONE rough pass, in sheet px, so the
// 0:18 pull-back shows real marks across the sheet (a house, letters, a machine, a board, a laptop, a phone cutaway, a rocket
// and a map, a village, the pencil). They are sketched before the line gets there, which is honest: a rough comes first.
import {type ChapterId} from '../../film4';
import {handCircle, handLine, handPath, handPolyline, handRect, sequence, stroke, type SketchSpec} from '../../paper';
import {REGIONS, type Point} from '../../sheet4';

/** Heavy enough to register at 1/8 scale; the engine's rough pass makes it the lighter graphite the bible asks for. */
const OPTS = {width: 24, rough: true, pressure: 0.6} as const;
const THIN = {width: 14, rough: true, pressure: 0.5} as const;

/** A shape is built lazily so its sheet coordinates can be moved into region-local px before the hand toolkit sees them. */
type Shape = {readonly make: (ox: number, oy: number) => string; readonly thin?: boolean};
const move = (pts: readonly Point[], ox: number, oy: number): [number, number][] => pts.map(([x, y]) => [x - ox, y - oy]);
const poly = (pts: readonly Point[], seed: number): Shape => ({make: (ox, oy) => handPolyline(move(pts, ox, oy), seed)});
const rect = (x: number, y: number, w: number, h: number, seed: number, thin = false): Shape => ({make: (ox, oy) => handRect(x - ox, y - oy, w, h, seed), thin});
const line = (x1: number, y1: number, x2: number, y2: number, seed: number, thin = true): Shape => ({make: (ox, oy) => handLine(x1 - ox, y1 - oy, x2 - ox, y2 - oy, seed), thin});
const ring = (cx: number, cy: number, r: number, seed: number, thin = false): Shape => ({make: (ox, oy) => handCircle(cx - ox, cy - oy, r, r, seed), thin});
const blob = (pts: readonly Point[], seed: number): Shape => ({make: (ox, oy) => handPath(move(pts, ox, oy), seed, {wobble: 6, smooth: 0.8})});

const house = (cx: number, ground: number, w: number, h: number, seed: number): readonly Shape[] => [
  poly([[cx - w / 2, ground], [cx - w / 2, ground - h], [cx, ground - h - w * 0.28], [cx + w / 2, ground - h], [cx + w / 2, ground], [cx - w / 2, ground]], seed),
  rect(cx - w * 0.08, ground - h * 0.5, w * 0.16, h * 0.5, seed + 1, true),
];

/** Hero shapes in sheet px (BIBLE4 §1.2). */
const SHAPES: Partial<Record<ChapterId, readonly Shape[]>> = {
  mayasHouse: [
    ...house(5400, 4450, 1080, 600, 11),
    ring(5100, 3000, 90, 12), ring(5400, 2800, 90, 13), ring(5700, 3000, 90, 14),
    line(5100, 3090, 5400, 3350, 15), line(5700, 3090, 5400, 3350, 16), line(5400, 2890, 5400, 3350, 17),
  ],
  theNo: [
    rect(8480, 3790, 320, 420, 21), rect(9200, 3790, 320, 420, 22),
    poly([[8480, 3790], [8640, 3990], [8800, 3790]], 23), poly([[9200, 3790], [9360, 3990], [9520, 3790]], 24),
    rect(8550, 4350, 900, 220, 25), ring(9000, 4460, 70, 26, true),
  ],
  filterMachine: [
    poly([[12100, 2500], [13100, 2500], [12950, 2800], [12250, 2800]], 31),
    rect(12250, 2800, 700, 1700, 32),
    ...[3000, 3300, 3600, 3900, 4200].map((y, i) => line(12250, y, 12950, y, 33 + i)),
    rect(12350, 4640, 500, 120, 39),
  ],
  researchBoard: [
    rect(15400, 3300, 1600, 1200, 41),
    rect(15540, 3350, 440, 300, 42, true), rect(16420, 3350, 440, 300, 43, true), rect(15540, 4100, 440, 300, 44, true), rect(16420, 4100, 440, 300, 45, true),
    line(15760, 3500, 16640, 4250, 46, false), line(16640, 3500, 15760, 4250, 47, false),
  ],
  nameAndLook: [
    rect(19350, 3770, 900, 560, 51),
    poly([[19260, 4330], [20340, 4330], [20380, 4440], [19220, 4440], [19260, 4330]], 52),
    line(19700, 4000, 20000, 4000, 53),
  ],
  engineRoom: [
    rect(22950, 2500, 900, 2700, 61),
    line(22950, 3350, 23850, 3350, 62, false), line(22950, 4450, 23850, 4450, 63, false),
    blob([[23250, 5600], [23300, 5480], [23450, 5440], [23550, 5500], [23700, 5520], [23760, 5620], [23650, 5680], [23300, 5690], [23250, 5600]], 64),
    rect(22850, 5400, 200, 200, 65, true),
  ],
  launch: [
    rect(26000, 4330, 400, 140, 71),
    poly([[26120, 4330], [26120, 3950], [26200, 3810], [26280, 3950], [26280, 4330]], 72),
    blob([[26760, 2930], [27350, 2960], [27900, 2990], [28060, 2930], [28120, 3000], [28010, 3130], [27980, 3330], [27880, 3560], [27960, 3760], [27760, 3640], [27500, 3690], [27300, 3800], [27120, 3640], [26900, 3560], [26780, 3300], [26760, 2930]], 73),
    blob([[28330, 3120], [28420, 3020], [28560, 2960], [28700, 2880], [28800, 2900], [28760, 3120], [28640, 3160], [28520, 3170], [28440, 3250], [28330, 3200], [28330, 3120]], 74),
    line(26200, 3800, 26700, 2900, 75, true),
  ],
  village: [
    ...house(27600, 3330, 270, 110, 81),
    ...house(27310, 3330, 200, 80, 82), ...house(27890, 3330, 200, 80, 83),
    ...house(27460, 3540, 220, 80, 84), ...house(27760, 3540, 220, 80, 85),
    ...house(27610, 3680, 110, 50, 86), ...house(28380, 3280, 160, 100, 87),
  ],
  providedFor: [
    poly([[37420, 4005], [37470, 4030], [37470, 3975], [37420, 4005]], 91),
    poly([[37470, 4030], [38300, 4210], [38330, 4150], [37470, 3975]], 92),
    line(37540, 4000, 38280, 4160, 93),
  ],
};

/** The chapter's glimpse as an engine page, region-local px (the region's top-left is the origin); null for chapters without one. */
export const glimpseSpecFor = (id: ChapterId): SketchSpec | null => {
  const shapes = SHAPES[id];
  if (!shapes) return null;
  const r = REGIONS[id];
  const ox = r.centre[0] - r.size[0] / 2;
  const oy = r.centre[1] - r.size[1] / 2;
  const items = shapes.map((s, i) => stroke(`g${i}`, s.make(ox, oy), s.thin ? THIN : OPTS));
  return {id: `glimpse-${id}`, ...sequence(items, 0, 1)};
};
