// palette.ts — the desk kit's colours, the bible's shadow table (BIBLE §2.1) and the lamp that produces it.
// Every prop and hand reads from here; nothing in src/desk hard-codes a colour or a shadow.
import {COLORS} from '../film';
import type {Lamp} from '../paper';
import {SKETCH_SIZE} from '../paper';

/** Sketch px per millimetre: the 1200 px canvas is an A3 landscape sheet (420 mm). Hands and pencils are authored in mm. */
export const SKETCH_PX_PER_MM = SKETCH_SIZE.width / 420;

/**
 * The daylight lamp of BIBLE §2.1: 10 o'clock, 38° elevation; shadows fall along (+0.64, +0.77).
 * azimuth = atan2(-0.77, -0.64) = 230.3° in the engine's convention (where the light comes FROM, y down).
 */
export const DESK_LAMP: Lamp = {azimuth: 230.3, elevation: 38, strength: 1, warmth: 0.45};
/** Back-to-desk (2:25-2:33) is warmer: lamp #FFE2B8, ambient 40%. */
export const DESK_LAMP_WARM: Lamp = {...DESK_LAMP, warmth: 0.85};
/** Unit vector shadows travel along (away from the lamp). */
export const SHADOW_DIR = {x: 0.64, y: 0.77} as const;
/** Shadow reach per px of height at 38° elevation (1 / tan 38°). */
export const REACH_PER_PX = 1 / Math.tan((DESK_LAMP.elevation * Math.PI) / 180);

export const DESK_PALETTE = {
  paper: COLORS.paper,
  paperShade: COLORS.paperShade,
  graphite: COLORS.graphite,
  graphiteSoft: COLORS.graphiteSoft,
  accent: COLORS.accent,
  desk: '#C8B394',
  deskGrain: '#B9A27F',
  shadow: '#3A3020',
  stickyFace: '#FFE98A',
  stickyLip: '#F2D86A',
  stickyShadow: '#5A4A10',
  hand: {tone: '#E9C9A8', shade: '#C98F6A', line: '#2A2A2D', lineOpacity: 0.7, highlight: '#FFFFFF'},
  cup: {ceramic: '#F7F4EE', ceramicShade: '#DAD4C8', coffee: '#3B2416', coffeeLight: '#5A3A24'},
  pencil: {
    body: '#D9A74A',
    bodyLight: '#E6B95E',
    bodyDark: '#B5862F',
    wood: '#EBD7B2',
    woodDark: '#D3B98B',
    lead: '#2A2A2D',
    eraser: '#E7A6A0',
    eraserDark: '#C98780',
    ferrule: '#C9C6BE',
    ferruleDark: '#8F8C84',
    ferruleLight: '#EDEBE5',
    accentBody: COLORS.accent,
    accentLight: '#5C7EF0',
    accentDark: '#1F3FA8',
    fineliner: '#2A2A2D',
    finelinerLight: '#55555A',
    finelinerCap: COLORS.accent,
  },
  eraser: {rubber: '#F4F2EC', rubberShade: '#D9D5CC', smudge: '#8A8578'},
  ruler: {plastic: 'rgba(255,255,255,0.42)', edge: 'rgba(255,255,255,0.75)', edgeShade: 'rgba(60,50,40,0.22)', tick: '#1E1E22'},
  phone: {back: '#30343A', backLight: '#4A4F57', rim: '#6D727A', plateau: '#3A3E45', lens: '#1C1F24'},
  pencilCup: {body: '#3E3C42', rim: '#5C5A60', rimLight: '#8A8890', inside: '#1E1D21'},
} as const;

export type ShadowEntry = {
  readonly x: number;
  readonly y: number;
  /** Design blur (CSS box-shadow blur; a Gaussian with half this as its standard deviation). */
  readonly blur: number;
  readonly opacity: number;
  readonly color: string;
};

const entry = (x: number, y: number, blur: number, opacity: number, color: string = DESK_PALETTE.shadow): ShadowEntry => ({x, y, blur, opacity, color});

/** BIBLE §2.1 shadow table, per object class (offset px / blur / opacity, colour #3A3020). */
export const SHADOWS = {
  sheet: entry(6, 8, 14, 0.18),
  sheetOnSheet: entry(4, 5, 8, 0.14),
  sticky: entry(3, 4, 5, 0.25, DESK_PALETTE.stickyShadow),
  pencil: entry(6, 8, 6, 0.35),
  eraser: entry(8, 10, 8, 0.3),
  ruler: entry(5, 7, 6, 0.3),
  cup: entry(26, 34, 30, 0.3),
  /** The cup's inner contact shadow ("r 6, 0.45"). */
  cupContact: entry(2, 3, 6, 0.45),
  phone: entry(10, 14, 18, 0.32),
  hands: entry(18, 24, 24, 0.28),
} as const;

export type ShadowClass = keyof typeof SHADOWS;

const hexToRgb = (hex: string): readonly [number, number, number] => {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** `rgba()` of a shadow colour at an opacity. */
export const shadowRgba = (color: string, opacity: number): string => `rgba(${hexToRgb(color).join(',')},${Math.max(0, opacity).toFixed(3)})`;

export type ShadowLift = {
  /** Extra height above the desk, px (0 = resting, as the table says). The offset grows along SHADOW_DIR, the blur grows, the opacity fades. */
  readonly height?: number;
  readonly opacityScale?: number;
};

/** The table entry for an object lifted `height` px: a pure function so set-down animations can converge to the table. */
export const liftedShadow = (e: ShadowEntry, lift: ShadowLift = {}): ShadowEntry => {
  const h = Math.max(0, lift.height ?? 0);
  const reach = h * REACH_PER_PX;
  const fade = 1 / (1 + h / 80);
  return {
    x: e.x + SHADOW_DIR.x * reach,
    y: e.y + SHADOW_DIR.y * reach,
    blur: e.blur + h * 0.9,
    opacity: e.opacity * fade * (lift.opacityScale ?? 1),
    color: e.color,
  };
};

/** CSS `box-shadow` for a table entry (use on rectangular / rounded HTML props). */
export const boxShadowOf = (e: ShadowEntry, spread = 0): string =>
  `${e.x.toFixed(2)}px ${e.y.toFixed(2)}px ${e.blur.toFixed(2)}px ${spread.toFixed(2)}px ${shadowRgba(e.color, e.opacity)}`;

/** CSS `filter: drop-shadow()` for a table entry (use on SVG silhouettes; drop-shadow's radius is the standard deviation). */
export const dropShadowOf = (e: ShadowEntry): string =>
  `drop-shadow(${e.x.toFixed(2)}px ${e.y.toFixed(2)}px ${(e.blur / 2).toFixed(2)}px ${shadowRgba(e.color, e.opacity)})`;

/** Standard deviation of a Gaussian for a design blur value (CSS `blur()` takes the deviation). */
export const blurDeviation = (designBlur: number): number => designBlur / 2;
