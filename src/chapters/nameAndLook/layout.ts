// layout.ts — chapter 6's numbers (BIBLE4 §1.2 and §5.6, in SHEET px) and its data: the invented names, the
// sampled token colours, the wallpaper tiles, the 24 screens of the design file. Times live in beats4 (nameAndLook).
import manifest4Json from '../../../public/footage4/manifest4.json';
import {footageStill, stillSource, type ScreenSource} from '../../kit';
import {regionOrigin} from '../../kit';
import type {Point} from '../../sheet4';

const ORIGIN = regionOrigin('nameAndLook');
/** Sheet px -> region-local px (plain elements inside the region). */
export const toRegion = (p: Point): Point => [p[0] - ORIGIN[0], p[1] - ORIGIN[1]];

/** The names sheet: 520 x 640 at (19500, 3700), turned -3°. */
export const NAMES_SHEET = {centre: [19500, 3700] as Point, w: 520, h: 640, rotate: -3};

/**
 * Seven working names, each crossed out. INVENTED placeholders (claims A10: the other names must be invented or the
 * owner's; none is the first app's name). "On Behalf" is the owner's (A10, needs the owner).
 */
export const CROSSED_NAMES = ['Kinfolk', 'Hearth', 'Carebook', 'Homebase', 'Tend', 'Familio', 'Papertrail'] as const;
export const LAST_NAME = 'On Behalf';

/** PROVISUM: Caveat 700 140 sheet px centred (20000, 3900); the Latin line Caveat 500 44 under it. */
export const WORD = {text: 'PROVISUM', centre: [20000, 3900] as Point, size: 140, logoSize: 128, latinSize: 44, latinGap: 70};
/** Where the logotype settles once the laptop needs the paper (12.0-13.0): above the laptop's lid, a little smaller. */
export const WORD_PARKED = {centre: [19800, 3630] as Point, scale: 0.8, move: {from: 12.0, to: 13.0}};

/** The laptop: the screen 900 x 560 centred (19800, 4050) (ScreenOnPaper's laptop at scale 1, aspect 900/560). */
export const SCREEN = {centre: [19800, 4050] as Point, w: 900, h: 560};
export const LAPTOP = (() => {
  const topBezel = 30;
  const lidH = SCREEN.h + topBezel + 40;
  const baseH = 34;
  const height = lidH + baseH;
  const top = SCREEN.centre[1] - SCREEN.h / 2 - topBezel;
  return {at: [SCREEN.centre[0], top + height / 2] as Point, aspect: SCREEN.w / SCREEN.h, width: 1080, height, lidH, top};
})();
/** Top-left of the screen in sheet px. */
export const SCREEN_TL: Point = [SCREEN.centre[0] - SCREEN.w / 2, SCREEN.centre[1] - SCREEN.h / 2];

/**
 * Inside the screen (screen-local px, 900 x 560). The tall frame at z 1.9 sees x 166-734; the wide super sits
 * lower-left (local y ≈ 425-460), so content stays in y 40-410 and in the middle column.
 */
export const PHONE = {x: 450 - 83, y: 40, w: 166, h: 360, r: 22};

/**
 * Colour tokens, light and dark (six each), the real `VYColor` values as docs/INVENTORY.md records them (claims B8).
 * One accent: the default blue theme in its light and dark forms.
 */
export const TOKENS: {readonly role: string; readonly light: string; readonly dark: string}[] = [
  {role: 'Canvas', light: '#F3F5F9', dark: '#0B0D12'},
  {role: 'Surface', light: '#FFFFFF', dark: '#171A21'},
  {role: 'Text', light: '#111827', dark: '#F3F5F9'},
  {role: 'Secondary', light: '#4F596B', dark: '#A6AFBF'},
  {role: 'Accent', light: '#2F5BEA', dark: '#6E8BFF'},
  {role: 'On accent', light: '#FFFFFF', dark: '#0B1020'},
];

/**
 * The nine wallpapers, cropped from the real `wallpapers-sweep` capture (its poster is the Background picker with all
 * nine tiles; claims B7 and CLAIMS-additions). Tile rects in the poster's px (1206 x 2622). "Plain" is cut off at the
 * top of the picker, so its visible part is used (it is a flat colour).
 */
export const WALLPAPER_SOURCE: ScreenSource = footageStill('wallpapers-sweep');
const COL_X = [62, 436, 810];
const TILE = {w: 334, h: 444};
export const WALLPAPER_TILES: readonly {name: string; x: number; y: number; w: number; h: number}[] = [
  {name: 'Plain', x: COL_X[2] as number, y: 400, w: TILE.w, h: 186},
  {name: 'Morning mist', x: COL_X[0] as number, y: 756, ...TILE},
  {name: 'Lavender', x: COL_X[1] as number, y: 756, ...TILE},
  {name: 'Sea glass', x: COL_X[2] as number, y: 756, ...TILE},
  {name: 'Apricot', x: COL_X[0] as number, y: 1312, ...TILE},
  {name: 'Blush', x: COL_X[1] as number, y: 1312, ...TILE},
  {name: 'Sage', x: COL_X[2] as number, y: 1312, ...TILE},
  {name: 'Linen', x: COL_X[0] as number, y: 1870, ...TILE},
  {name: 'Dusk', x: COL_X[1] as number, y: 1870, ...TILE},
];
/** A wallpaper swatch, phone-shaped: 58 x 124 screen px, so the resting row (9 x 58 + 8 x 4 = 554) fits the tall column (568 px at z 1.9); the fan scales it up to 1.55 (E3, QA1 11). */
export const SWATCH = {w: 58, h: 124, gap: 4, pivot: [450, 410] as Point, fanDeg: 48};

/** manifest4's still entries (kit's footageStill reads only its clips: a gap worked around here). */
const STILLS4 = (manifest4Json as {stills?: readonly {id: string; file: string; width: number; height: number}[]}).stills ?? [];
export const still4 = (id: string): ScreenSource => {
  const e = STILLS4.find((s) => s.id === id);
  if (!e) throw new Error(`nameAndLook: no still "${id}" in manifest4.json`);
  return stillSource(`footage4/${e.file}`, e.width, e.height);
};

/** The design file: 24 distinct real screens, dark first, both the sample binder and the story's family (6 x 4). */
export const CITY: readonly ScreenSource[] = [
  ...['dad', 'leo', 'mia', 'maya', 'jonas', 'biscuit', 'sam'].map((n) => still4(`binder-home-${n}-dark`)),
  ...[
    'binder-home-dark',
    'onboarding-welcome',
    'onboarding-question',
    'emergency-card-full',
    'passport-reminder',
    'scam-check',
    'shared-costs',
    'visit-summary',
    'family-share-card',
    'med-refill',
    'family-tabs',
    'belgium-112',
    'binder-switcher-family',
    'friend-binder',
    'family-joined',
    'invite-friend',
    'emergency-largest-text',
  ].map(footageStill),
];
// C5: 8 x 3 (the bible's 6 x 4 is a tall block that reads as a sliver on a landscape screen); 568 x 433 of the 900 x 560 screen, in the tall frame's column.
export const CITY_GRID = {cols: 8, rows: 3, w: 64, h: 139, gap: 8};
