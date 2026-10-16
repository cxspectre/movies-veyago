// inkLook.ts — how deposited graphite / coloured pencil turns into visible pixels on the paper tooth.
// Deposit is stored per pixel in one 8-bit channel (graphite = R, accent = G), accumulated additively.
import {COLORS} from '../../film';
import type {Ink} from '../types';

/** One unit of deposit (a single movement at full pressure) is stored as DEPOSIT_UNIT/255 of the channel. */
export const DEPOSIT_UNIT = 100;

export type InkLook = {
  /** Colour at full coverage: the ink multiplied onto the nominal paper colour (the canvas composites with normal alpha). */
  readonly rgb: readonly [number, number, number];
  /** How deep into the tooth one unit of deposit reaches (fraction of tooth heights covered per unit). */
  readonly reach: number;
  /** Softness of the tooth threshold (0 = hard speckle, 0.3 = soft). */
  readonly soft: number;
  /** Opacity of a barely-there touch and of a fully burnished line. */
  readonly minOpacity: number;
  readonly maxOpacity: number;
  /** How quickly opacity climbs with deposit. */
  readonly build: number;
};

const hexToRgb = (hex: string): readonly [number, number, number] => {
  const v = Number.parseInt(hex.replace('#', ''), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};

/** What an ink looks like multiplied onto the paper (so normal alpha-over matches a multiply on real paper). */
const onPaper = (hex: string): readonly [number, number, number] => {
  const ink = hexToRgb(hex);
  const paper = hexToRgb(COLORS.paper);
  return [0, 1, 2].map((i) => Math.round(((ink[i] as number) * (paper[i] as number)) / 255)) as unknown as readonly [number, number, number];
};

/** A cool HB-2B graphite: never black, slightly blue-grey against the warm paper. */
export const GRAPHITE_LOOK: InkLook = {
  rgb: onPaper(COLORS.graphite),
  reach: 0.74,
  soft: 0.17,
  minOpacity: 0.24,
  maxOpacity: 0.74,
  build: 0.95,
};

/** Coloured pencil in the one accent: waxier, so it skips more tooth and never goes fully opaque. */
export const ACCENT_LOOK: InkLook = {
  rgb: onPaper(COLORS.accent),
  reach: 0.66,
  soft: 0.2,
  minOpacity: 0.3,
  maxOpacity: 0.8,
  build: 1,
};

export const LOOKS: Record<Ink, InkLook> = {graphite: GRAPHITE_LOOK, accent: ACCENT_LOOK};

const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** 65536-entry table: (deposit byte << 8 | tooth byte) -> alpha byte. */
export const buildLut = (look: InkLook): Uint8Array =>
  Uint8Array.from({length: 65536}, (_, idx) => {
    const d = (idx >> 8) / DEPOSIT_UNIT;
    const tooth = (idx & 255) / 255;
    if (d <= 0) return 0;
    const threshold = 1 - look.reach * d;
    const cover = smooth(threshold - look.soft, threshold + look.soft, tooth);
    const opacity = look.minOpacity + (look.maxOpacity - look.minOpacity) * (1 - Math.exp(-look.build * d));
    return Math.round(255 * cover * opacity);
  });
