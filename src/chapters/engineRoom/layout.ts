// layout.ts — chapter 7's numbers (BIBLE4 §1.2 and §5.7, SHEET px). Times live in beats4 (engineRoom). Where the
// bible's positions fall outside the camera it sets (the vault's phones and super at y 5800-6050 against a wide view
// that ends at y 5870), they are moved up and the move is said here.
import {regionOrigin} from '../../kit';
import type {Point} from '../../sheet4';

const ORIGIN = regionOrigin('engineRoom');
export const toRegion = (p: Point): Point => [p[0] - ORIGIN[0], p[1] - ORIGIN[1]];
export const REGION_SIZE = {w: 2400, h: 3600};

/** The phone cutaway 900 x 2700 r 120 at (23400, 3850); floors at y 3350 and 4450; labels at x 22900. */
export const PHONE = {centre: [23400, 3850] as Point, w: 900, h: 2700, r: 120};
export const PHONE_TL: Point = [PHONE.centre[0] - PHONE.w / 2, PHONE.centre[1] - PHONE.h / 2];
export const FLOOR_Y = [3350, 4450] as const;
export const FLOOR_LABELS: readonly {text: string; y: number}[] = [
  {text: 'Code', y: 2610},
  {text: 'The data', y: 3450},
  {text: 'The vault', y: 4550},
];
export const LABEL_X = 22900;

/** Top floor: the laptop 560 wide at (23400, 3050) (ScreenOnPaper laptop, scale 560/1080, 16:10). */
export const LAPTOP = (() => {
  const s = 560 / 1080;
  const sw = 900 * s;
  const sh = sw / (16 / 10);
  const topB = 30 * s;
  const lidH = sh + topB + 40 * s;
  const height = lidH + Math.max(14, 34 * s);
  const at: Point = [23400, 3050];
  const top = at[1] - height / 2;
  return {at, scale: s, screen: {x: at[0] - sw / 2, y: top + topB, w: sw, h: sh}};
})();
export const SUPER_ROOMS_AT: Point = [23400, 2650];

/** Paper tabs 180 x 44 pinned at the cutaway's right margin, centred x 23950, y 2750 + 70 n. */
export const TAB = {w: 280, h: 62, x: 23900, y0: 2750, step: 78, fly: 0.7, font: 40};

/** Middle floor. */
export const BINDER = {centre: [23400, 3650] as Point, w: 260, h: 200};
export const BOXES: readonly {label: string; at: Point}[] = [
  {label: 'Documents', at: [23110, 3475]},
  {label: 'Dates', at: [23400, 3475]},
  {label: 'Bills', at: [23690, 3475]},
  {label: 'People', at: [23110, 3835]},
  {label: 'Emergency card', at: [23400, 3835]},
  {label: 'Packets', at: [23690, 3835]},
];
/** Box labels are 40 px (E3: readable at 36 px on the wide frame); "Emergency card" breaks onto two lines. */
export const BOX = {w: 230, h: 112, font: 40};
/** The six silhouettes stand ON the pencil line (y 4000 runs through this floor), 130 apart. */
export const SILHOUETTE = {ground: 3996, x0: 23075, step: 130, scale: 0.21, petScale: 0.4};
export const SUPER_MIDDLE_AT: Point = [23400, 4120];

/** The train: three tracks fan in from x 23000 and merge at x 23300 into one at y 4330, to x 23800. */
export const TRACKS = {ys: [4280, 4330, 4380] as const, x0: 22990, mergeFrom: 23170, merge: 23300, end: 23800, main: 4330};
export const CARRIAGE = {w: 120, h: 70, start: 23060, finals: [23720, 23590, 23460] as const};
export const BELL_AT: Point = [23845, 4268];

/** The vault and below. The phones sit at y 5650 (the bible's 5800 is under the wide frame's edge at 5870). */
export const SERVER = {centre: [22950, 5500] as Point, w: 320, h: 200, label: 'Veyago server'};
export const CLOUD = {centre: [23500, 5500] as Point, w: 440, h: 220, label: 'Your own iCloud'};
export const PIPE = {x: 23500, from: 5200, to: 5412};
export const PHONES: readonly {label: string; centre: Point}[] = [
  {label: 'Your brother', centre: [23040, 5650]},
  {label: 'Sam', centre: [23760, 5650]},
];
export const SMALL_PHONE = {w: 120, h: 240};
/** The vault super: inside the vault (the bible's y 6050 is below the wide frame), out before the safe needs the room. */
export const SUPER_VAULT_AT: Point = [23400, 4610];
/** The claims sheet's reword of "No server. No account. Data Not Collected." (B20, B23). */
export const VAULT_SUPER_TEXT = 'No account. Nothing collected.';

export const SAFE = {centre: [23400, 4760] as Point, w: 260, h: 220};
export const CARD = {w: 180, h: 120, from: [22980, 4760] as Point};

/** The passing-test count of the shipped build (owner decision 3, claims B26 / G27): a full unit-test run of
 * `release/1.2` at 6d5f5eb on 2026-10-18, 4,502 executed, 5 skipped, 0 failures. Re-run on release day if the code changes. */
export const TEST_COUNT = '4,497 tests';
/** Readable type on the sheet (the vault is seen at z 0.75, the rest at 0.9: 48 / 42 sheet px give 36 screen px). */
export const READ = {floor: 48, vault: 48, note: 42};
/** Above the laptop (the floor line under it, at 3350, would cut through the roll). */
export const TEST_ROLL_AT: Point = [23400, 2800];
/** The Simulator boots in a drawn phone 200 x 430 at (23750, 3050). */
export const SIM_AT: Point = [23750, 3050];
