// sheet4.ts — the endless sheet of the long film (v4): the coordinate system, the chapter regions, the unbroken
// pencil line and the camera paths for both formats, in MODULE-LOCAL seconds on the 0.5 s grid.
// Direction and reasoning: docs/v4/BIBLE4.md §1-2. Times: src/beats4.ts. Nobody re-types a number.

import type {ChapterId} from './film4';
import {SLOTS4, slotOf4} from './film4';
import type {EasingName} from './beats';
import type {FormatName} from './film';

export type Point = readonly [number, number];

/** Sheet px = logical px at zoom 1.0. The drawing occupies this rectangle; the paper itself is infinite. */
export const SHEET = {width: 40000, height: 8000, baseline: 4000} as const;

/** The pencil line renders at a constant screen width whatever the zoom (BIBLE4 §1.1). */
export const LINE_WIDTH = {wide: 3, tall: 2, minimum: 1.5} as const;

/** Level of detail by zoom (BIBLE4 §1.6). */
export const LOD = {
  /** At or above: the active chapter runs the live engine; finished regions are page images. */
  near: 0.6,
  /** Between far and near: every region is a page image; only the line and one moving object are live. */
  far: 0.15,
  /** Glimpses (rough hero shapes) are fully visible below LOD.far and gone by this zoom. */
  glimpseGone: 0.3,
  /** Regions outside the viewport grown by this fraction are not mounted. */
  cullMargin: 0.2,
} as const;

export type Region = {centre: Point; size: Point; workingZoom: number};

export const REGIONS: Record<ChapterId, Region> = {
  line: {centre: [1800, 4000], size: [3600, 2200], workingZoom: 1.0},
  mayasHouse: {centre: [5400, 3800], size: [2400, 2600], workingZoom: 0.9},
  theNo: {centre: [9000, 3900], size: [2400, 2200], workingZoom: 0.9},
  filterMachine: {centre: [12600, 3600], size: [2400, 3000], workingZoom: 0.8},
  researchBoard: {centre: [16200, 3900], size: [2600, 2200], workingZoom: 0.8},
  nameAndLook: {centre: [19800, 4000], size: [2400, 2000], workingZoom: 0.8},
  engineRoom: {centre: [23400, 3850], size: [2400, 3600], workingZoom: 0.45},
  launch: {centre: [27200, 3600], size: [3200, 2800], workingZoom: 0.8},
  /** Nested at 0.25 of the sheet scale inside the map's United States (BIBLE4 §1.1). */
  village: {centre: [27600, 3380], size: [1400, 800], workingZoom: 2.0},
  paperToGlass: {centre: [27600, 3380], size: [0, 0], workingZoom: 2.0},
  providedFor: {centre: [37800, 4000], size: [2400, 1600], workingZoom: 1.0},
};

/** The central column every chapter's essential art must stay inside (reads in both crops). */
export const COLUMN_WIDTH = 1080;
export const columnOf = (id: ChapterId): {left: number; right: number} => {
  const [cx] = REGIONS[id].centre;
  return {left: cx - COLUMN_WIDTH / 2, right: cx + COLUMN_WIDTH / 2};
};

// The unbroken line

export type LineAnchor = {
  /** Module-local seconds the head reaches this point. */
  t: number;
  p: Point;
  /** What the line is doing here (a detour name, a corner, a hand-off). */
  note?: string;
};

/** The line's path, chapter by chapter: the head passes these points at these local times (BIBLE4 §1.3). */
export const LINE_ANCHORS: Record<ChapterId, readonly LineAnchor[]> = {
  line: [
    {t: 1.0, p: [200, 4000], note: 'the tip touches'},
    {t: 1.5, p: [290, 4000]},
    {t: 1.5, p: [290, 3910], note: 'super: handwriting rises 90 px'},
    {t: 4.5, p: [1250, 3910], note: 'super done'},
    {t: 4.5, p: [1250, 4000]},
    {t: 7.0, p: [1400, 4000], note: 'heart rate'},
    {t: 8.5, p: [1700, 4000]},
    {t: 9.0, p: [1800, 4000], note: 'calendar grid'},
    {t: 11.0, p: [2100, 4000]},
    {t: 11.5, p: [2200, 4000], note: 'passport'},
    {t: 13.5, p: [2500, 4000]},
    {t: 14.0, p: [2600, 4000], note: 'key'},
    {t: 16.0, p: [2900, 4000]},
    {t: 18.0, p: [3200, 4000]},
    {t: 26.0, p: [3400, 4000], note: 'the far view ends'},
    {t: 27.0, p: [4700, 4000], note: 'the corner'},
    {t: 27.5, p: [4700, 4450]},
    {t: 28.0, p: [4860, 4450], note: 'the house: ground'},
    {t: 28.5, p: [4860, 3850], note: 'left wall'},
    {t: 29.0, p: [5400, 3450], note: 'apex'},
    {t: 29.5, p: [5940, 3850]},
    {t: 30.0, p: [5940, 4450], note: 'right wall down; hand-off'},
  ],
  mayasHouse: [
    {t: 0.0, p: [5940, 4450]},
    {t: 40.0, p: [6100, 4450], note: 'the line leaves the house'},
    {t: 42.0, p: [7000, 4000]},
    {t: 45.0, p: [7800, 4000], note: 'hand-off'},
  ],
  theNo: [
    {t: 0.0, p: [7800, 4000]},
    {t: 3.0, p: [8400, 4000], note: 'the letters are drawn by the line'},
    {t: 36.0, p: [9450, 4000], note: 'the engine rides the head from here'},
    {t: 40.0, p: [10800, 4000], note: 'hand-off'},
  ],
  filterMachine: [
    {t: 0.0, p: [10800, 4000]},
    {t: 4.0, p: [12100, 4000], note: 'the machine outline is drawn by the line'},
    {t: 44.0, p: [13100, 4000], note: 'leaves the tray'},
    {t: 55.0, p: [15000, 4000], note: 'hand-off'},
  ],
  researchBoard: [
    {t: 0.0, p: [15000, 4000]},
    {t: 2.5, p: [15400, 4000], note: 'the board frame'},
    {t: 61.0, p: [17100, 4000], note: 'the truck rolls on the line'},
    {t: 65.0, p: [18600, 4000], note: 'hand-off'},
  ],
  nameAndLook: [
    {t: 0.0, p: [18600, 4000]},
    {t: 4.5, p: [19250, 4000], note: 'the names sheet'},
    {t: 53.0, p: [20350, 4000], note: 'leaves the laptop'},
    {t: 55.0, p: [21800, 4000], note: 'hand-off'},
  ],
  engineRoom: [
    {t: 0.0, p: [21800, 4000]},
    {t: 3.0, p: [22950, 4000], note: 'the phone outline is drawn by the line'},
    {t: 72.0, p: [23850, 4000], note: 'leaves the cutaway'},
    {t: 75.0, p: [25400, 4000], note: 'hand-off'},
  ],
  launch: [
    {t: 0.0, p: [25400, 4000]},
    {t: 3.0, p: [26200, 4400], note: 'the pad'},
    {t: 10.0, p: [26200, 4300], note: 'launch: the line is the trail'},
    {t: 12.5, p: [27000, 2600], note: 'apex'},
    {t: 15.0, p: [27600, 3300], note: 'lands in the United States (nested scale from here)'},
  ],
  village: [
    {t: 0.0, p: [27600, 3300]},
    {t: 13.0, p: [27560, 3320], note: 'the village street'},
    {t: 63.0, p: [27600, 3420], note: 'the green'},
  ],
  paperToGlass: [{t: 0.0, p: [27600, 3420], note: 'the line is light; not drawn further'}],
  providedFor: [
    {t: 2.0, p: [28800, 3300], note: "the map's edge"},
    {t: 6.0, p: [33000, 4000]},
    {t: 11.0, p: [37420, 4005], note: 'the pencil tip: the end'},
  ],
};

/** The sheet point the line enters and leaves each chapter on (the hand-offs). */
export const handoff = (id: ChapterId): {enter: Point; leave: Point} => {
  const anchors = LINE_ANCHORS[id];
  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  if (!first || !last) throw new Error(`No line anchors for ${id}`);
  return {enter: first.p, leave: last.p};
};

// The camera

export type CameraKey = {
  t: number;
  /** A sheet point, or 'head' to centre on the line's head plus `lead`. */
  centre: Point | 'head';
  lead?: Point;
  zoom: number;
  /** Easing INTO this key from the previous one. */
  easing: EasingName;
};

const key = (t: number, centre: Point | 'head', zoom: number, easing: EasingName = 'linear', lead?: Point): CameraKey => ({
  t,
  centre,
  zoom,
  easing,
  ...(lead ? {lead} : {}),
});

/** The far view: the whole 40 000 px width in frame. */
export const FAR_ZOOM = {wide: 0.048, tall: 0.027} as const;
/** Chapter 11's retrospective zoom: each chapter's drawing is 140-200 px tall wide. */
const RETRO_ZOOM = {wide: 0.14, tall: 0.2} as const;
const FAR_CENTRE: Point = [20000, 4000];

/** Chapter 9's nine visits: flight start (local), the house centre, the flight length. Each holds 3.0 s at zoom 5. */
export const VISITS: readonly {n: number; at: number; flight: number; centre: Point; house: string}[] = [
  {n: 1, at: 13.0, flight: 1.0, centre: [27310, 3250], house: 'Leo and Mia'},
  {n: 2, at: 17.0, flight: 1.0, centre: [27600, 3230], house: 'Dad'},
  {n: 3, at: 21.0, flight: 1.0, centre: [27640, 3230], house: "Dad's kitchen"},
  {n: 4, at: 25.0, flight: 1.0, centre: [27460, 3460], house: 'Maya'},
  {n: 5, at: 29.0, flight: 1.0, centre: [27760, 3460], house: 'Jonas'},
  {n: 6, at: 33.0, flight: 1.0, centre: [27460, 3460], house: 'Maya'},
  {n: 7, at: 37.0, flight: 1.0, centre: [27560, 3230], house: 'Dad'},
  {n: 8, at: 41.0, flight: 1.0, centre: [27610, 3610], house: "Biscuit's kennel"},
  {n: 9, at: 45.0, flight: 2.0, centre: [28380, 3160], house: 'Sam, Lisbon'},
];
export const VISIT_ZOOM = 5.0;
export const VISIT_HOLD_SECONDS = 3.0;

const visitKeys = (): readonly CameraKey[] =>
  VISITS.flatMap((v) => [key(v.at + v.flight, v.centre, VISIT_ZOOM, 'keynote'), key(v.at + v.flight + VISIT_HOLD_SECONDS, v.centre, VISIT_ZOOM)]);

const WIDE: Record<ChapterId, readonly CameraKey[]> = {
  line: [
    key(0.0, [200, 4000], 1.6),
    // The camera holds still while the first super is written, so "Every app starts as a line." is whole in frame.
    key(1.0, [900, 4000], 1.2, 'easeInOutSine'),
    key(6.0, [900, 4000], 1.2),
    key(7.0, 'head', 1.0, 'easeInOutSine', [300, 0]),
    key(18.0, [3200, 4000], 1.0),
    key(22.0, FAR_CENTRE, FAR_ZOOM.wide, 'easeInOutQuint'),
    key(26.0, FAR_CENTRE, FAR_ZOOM.wide),
    key(30.0, [5400, 3950], 0.9, 'easeInOutCubic'),
  ],
  mayasHouse: [
    key(0.0, [5400, 3950], 0.9),
    key(28.0, [5400, 3950], 0.9),
    key(31.0, [5400, 3600], 0.55, 'easeInOutCubic'),
    key(40.0, [5400, 3600], 0.55),
    key(45.0, [8600, 4000], 0.9, 'easeInOutSine'),
  ],
  theNo: [
    key(0.0, [8600, 4000], 0.9),
    key(1.0, [9000, 3950], 0.9, 'easeInOutSine'),
    key(9.0, [9000, 3950], 0.9),
    key(27.5, [9000, 3950], 0.9),
    key(30.0, [9000, 3600], 0.75, 'easeInOutSine'),
    key(36.0, [9000, 3600], 0.75),
    key(40.0, [12600, 3300], 0.8, 'easeInOutCubic'),
  ],
  filterMachine: [
    key(0.0, [12600, 3300], 0.8),
    key(7.0, [12600, 2900], 0.8, 'easeInOutSine'),
    key(35.0, [12600, 4400], 0.7),
    key(37.0, [12600, 4700], 1.1, 'easeInOutCubic'),
    key(47.0, [12600, 4700], 1.1),
    key(50.0, [5400, 3950], 0.8, 'easeInOutQuint'),
    key(51.0, [5400, 3950], 0.8),
    key(53.0, [10800, 3975], 0.3, 'easeInOutCubic'),
    key(55.0, [16200, 3900], 0.8, 'easeInOutCubic'),
  ],
  researchBoard: [
    key(0.0, [16200, 3900], 0.8),
    key(45.0, [16200, 3900], 0.8),
    key(47.0, [16200, 4100], 0.8, 'easeInOutSine'),
    key(61.0, [16200, 4100], 0.8),
    key(65.0, [19500, 3900], 0.8, 'easeInOutSine'),
  ],
  nameAndLook: [
    key(0.0, [19500, 3900], 0.8),
    key(5.0, [19500, 3900], 0.8),
    key(7.0, [19900, 3950], 0.8, 'easeInOutSine'),
    key(13.0, [19900, 3950], 0.8),
    key(16.0, [19800, 4100], 0.8, 'easeInOutSine'),
    key(20.0, [19800, 4100], 0.8),
    key(23.0, [19800, 4050], 2.2, 'easeInOutCubic'),
    key(50.0, [19800, 4050], 2.2),
    key(53.0, [19800, 4100], 0.8, 'easeInOutCubic'),
    key(55.0, [23400, 3850], 0.45, 'easeInOutSine'),
  ],
  engineRoom: [
    key(0.0, [23400, 3850], 0.45),
    key(5.0, [23400, 3850], 0.45),
    key(7.0, [23400, 3000], 0.9, 'easeInOutCubic'),
    key(16.0, [23400, 3000], 0.9),
    key(18.0, [23400, 3900], 0.9, 'easeInOutCubic'),
    key(42.0, [23400, 3900], 0.9),
    key(44.0, [23400, 5150], 0.75, 'easeInOutCubic'),
    key(62.0, [23400, 5150], 0.75),
    key(64.0, [23400, 3000], 0.9, 'easeInOutCubic'),
    key(72.0, [23400, 3000], 0.9),
    key(74.0, [23400, 3850], 0.45, 'easeInOutCubic'),
    key(75.0, [26200, 4300], 0.8, 'easeInOutSine'),
  ],
  launch: [
    key(0.0, [26200, 4300], 0.8),
    key(10.0, [26200, 4300], 0.8),
    key(12.5, [26800, 3000], 0.6, 'easeInOutSine'),
    key(15.0, [27600, 3300], 0.55, 'easeInOutSine'),
    key(35.0, [27600, 3300], 0.55),
    key(41.0, [27600, 3250], 4.0, 'easeInOutQuint'),
    key(50.0, [27600, 3250], 4.0),
  ],
  village: [
    key(0.0, [27600, 3250], 4.0),
    key(6.0, [27600, 3380], 2.0, 'easeInOutSine'),
    key(8.0, [27600, 3380], 2.0),
    key(10.0, [27900, 3350], 1.6, 'easeInOutSine'),
    key(13.0, [27900, 3350], 1.6),
    ...visitKeys(),
    key(55.0, [28000, 3250], 0.9, 'easeInOutQuint'),
    key(63.0, [28000, 3250], 0.9),
    key(65.0, [27610, 3720], 4.0, 'easeInOutCubic'),
    key(71.0, [27610, 3720], 4.0),
    key(75.0, [27600, 3380], 2.0, 'easeInOutSine'),
  ],
  paperToGlass: [key(0.0, [27600, 3380], 2.0), key(80.0, [27600, 3380], 2.0)],
  providedFor: [
    key(0.0, [27600, 3380], 2.0),
    // the retrospective: pull back to a readable mid zoom, ride the head, then travel the line back to the first chapter
    key(2.5, [29500, 3900], RETRO_ZOOM.wide, 'easeInOutCubic'),
    key(4.0, [32000, 3950], RETRO_ZOOM.wide, 'easeInOutSine'),
    key(10.0, [3000, 4000], RETRO_ZOOM.wide, 'easeInOutSine'),
    key(11.0, FAR_CENTRE, FAR_ZOOM.wide, 'easeInOutQuint'),
    key(12.0, FAR_CENTRE, FAR_ZOOM.wide),
    key(15.0, [37800, 4000], 1.0, 'easeInOutCubic'),
    key(20.0, [37800, 4000], 1.0),
    key(21.0, [38300, 3900], 1.0, 'easeInOutSine'),
    key(30.0, [38300, 3900], 1.0),
  ],
};

/** A tall override: replace the wide key at `t` (same index order) with new centre/zoom; other fields stay. */
type TallOverride = {t: number; centre?: Point; zoom?: number};

const TALL_OVERRIDES: Partial<Record<ChapterId, readonly TallOverride[]>> = {
  line: [{t: 1.0, centre: [770, 4000], zoom: 0.95}, {t: 6.0, centre: [770, 4000], zoom: 0.95}, {t: 22.0, zoom: FAR_ZOOM.tall}, {t: 26.0, zoom: FAR_ZOOM.tall}, {t: 30.0, zoom: 0.7}],
  theNo: [{t: 1.0, zoom: 0.8}, {t: 9.0, zoom: 0.8}, {t: 27.5, zoom: 0.8}],
  researchBoard: [{t: 47.0, centre: [16200, 4100], zoom: 0.6}, {t: 61.0, centre: [16200, 4100], zoom: 0.6}],
  filterMachine: [{t: 35.0, centre: [12600, 4000], zoom: 0.6}],
  mayasHouse: [{t: 0.0, zoom: 0.7}, {t: 28.0, zoom: 0.7}, {t: 31.0, centre: [5400, 3500], zoom: 0.5}, {t: 40.0, centre: [5400, 3500], zoom: 0.5}],
  nameAndLook: [{t: 23.0, zoom: 1.9}, {t: 50.0, zoom: 1.9}],
  engineRoom: [
    {t: 7.0, zoom: 0.75}, {t: 16.0, zoom: 0.75}, {t: 18.0, zoom: 0.75}, {t: 42.0, zoom: 0.75},
    {t: 64.0, zoom: 0.75}, {t: 72.0, zoom: 0.75},
  ],
  // Tall holds the street framing to 13.0 so the hook's cut to paperToGlass 0.0 (same camera) is not a zoom jump.
  village: [{t: 10.0, centre: [27600, 3380], zoom: 2.0}, {t: 13.0, centre: [27600, 3380], zoom: 2.0}, {t: 55.0, centre: [28100, 3200], zoom: 0.7}, {t: 63.0, centre: [28100, 3200], zoom: 0.7}],
  providedFor: [
    {t: 2.5, zoom: RETRO_ZOOM.tall}, {t: 4.0, zoom: RETRO_ZOOM.tall}, {t: 10.0, zoom: RETRO_ZOOM.tall},
    {t: 11.0, zoom: FAR_ZOOM.tall}, {t: 12.0, zoom: FAR_ZOOM.tall},
    {t: 21.0, centre: [37900, 3950]}, {t: 30.0, centre: [37900, 3950]},
  ],
};

const applyOverrides = (keys: readonly CameraKey[], overrides: readonly TallOverride[] = []): readonly CameraKey[] =>
  keys.map((k) => {
    const o = overrides.find((x) => x.t === k.t);
    if (!o) return k;
    return {...k, ...(o.centre ? {centre: o.centre} : {}), ...(o.zoom !== undefined ? {zoom: o.zoom} : {})};
  });

/** Tall-only keys, replacing the wide key at `replaces` (the camera holds longer in the narrow crop). */
const TALL_REPLACE: Partial<Record<ChapterId, readonly {replaces: number; keys: readonly CameraKey[]}[]>> = {
  // Hold on "Every app starts as a line." until 7.5, then follow the pencil (the wide camera follows from 7.0).
  line: [{replaces: 7.0, keys: [key(7.5, [770, 4000], 0.95), key(8.5, 'head', 1.0, 'easeInOutSine', [300, 0])]}],
};

const replaceKeys = (id: ChapterId, keys: readonly CameraKey[]): readonly CameraKey[] =>
  keys.flatMap((k) => TALL_REPLACE[id]?.find((r) => r.replaces === k.t)?.keys ?? [k]);

const TALL: Record<ChapterId, readonly CameraKey[]> = Object.fromEntries(
  SLOTS4.map((s) => [s.id, replaceKeys(s.id, applyOverrides(WIDE[s.id], TALL_OVERRIDES[s.id]))]),
) as Record<ChapterId, readonly CameraKey[]>;

export const CAMERA: Record<FormatName, Record<ChapterId, readonly CameraKey[]>> = {wide: WIDE, tall: TALL};

export const cameraKeys = (format: FormatName, id: ChapterId): readonly CameraKey[] => CAMERA[format][id];

// Validation

const GRID = 0.5;
const onGrid = (t: number): boolean => Math.abs(t / GRID - Math.round(t / GRID)) < 1e-6;
const samePoint = (a: Point, b: Point): boolean => a[0] === b[0] && a[1] === b[1];

const chapterLength = (id: ChapterId): number => slotOf4(id).end - slotOf4(id).start;

const keyProblems = (format: FormatName, id: ChapterId, keys: readonly CameraKey[]): readonly string[] => {
  const length = chapterLength(id);
  const problems: string[] = [];
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (!first || first.t !== 0) problems.push(`${format}/${id}: the camera must have a key at 0.0`);
  if (!last || last.t !== length) problems.push(`${format}/${id}: the camera must have a key at ${length}`);
  keys.forEach((k, i) => {
    if (!onGrid(k.t)) problems.push(`${format}/${id}[${i}]: ${k.t}s is off the 0.5 s grid`);
    if (k.t < 0 || k.t > length) problems.push(`${format}/${id}[${i}]: ${k.t}s outside 0-${length}s`);
    const prev = keys[i - 1];
    if (prev && k.t < prev.t) problems.push(`${format}/${id}[${i}]: keys out of order`);
    if (k.zoom <= 0) problems.push(`${format}/${id}[${i}]: zoom must be positive`);
  });
  return problems;
};

/** The camera never cuts: each chapter starts exactly where the previous one ended. */
const continuityProblems = (format: FormatName): readonly string[] =>
  SLOTS4.flatMap((slot, i) => {
    const prev = SLOTS4[i - 1];
    if (!prev) return [];
    const last = CAMERA[format][prev.id][CAMERA[format][prev.id].length - 1];
    const first = CAMERA[format][slot.id][0];
    if (!last || !first || last.centre === 'head' || first.centre === 'head') return [`${format}/${slot.id}: boundary keys must be sheet points`];
    if (!samePoint(last.centre, first.centre) || last.zoom !== first.zoom) {
      return [`${format}/${slot.id}: starts at (${first.centre}) z ${first.zoom}, but ${prev.id} ends at (${last.centre}) z ${last.zoom}`];
    }
    return [];
  });

const lineProblems = (): readonly string[] =>
  SLOTS4.flatMap((slot, i) => {
    const anchors = LINE_ANCHORS[slot.id];
    const length = chapterLength(slot.id);
    const problems = anchors.flatMap((a, j) => {
      const prev = anchors[j - 1];
      const out: string[] = [];
      if (a.t < 0 || a.t > length) out.push(`line/${slot.id}[${j}]: ${a.t}s outside the chapter`);
      if (prev && a.t < prev.t) out.push(`line/${slot.id}[${j}]: anchors out of order`);
      if (a.p[0] < 0 || a.p[0] > SHEET.width || a.p[1] < 0 || a.p[1] > SHEET.height) out.push(`line/${slot.id}[${j}]: off the sheet`);
      return out;
    });
    const prevSlot = SLOTS4[i - 1];
    if (prevSlot && prevSlot.id !== 'paperToGlass') {
      const {leave} = handoff(prevSlot.id);
      const {enter} = handoff(slot.id);
      if (slot.id !== 'providedFor' && !samePoint(leave, enter)) problems.push(`line/${slot.id}: enters at (${enter}) but ${prevSlot.id} leaves at (${leave})`);
    }
    return problems;
  });

/** Problems in the sheet: keys off the grid or outside their chapter, a camera cut, a broken line. Empty when clean. */
export const validateSheet4 = (): readonly string[] => [
  ...(['wide', 'tall'] as const).flatMap((format) => [
    ...SLOTS4.flatMap((s) => keyProblems(format, s.id, CAMERA[format][s.id])),
    ...continuityProblems(format),
  ]),
  ...lineProblems(),
];
