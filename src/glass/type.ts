// type.ts — DM Sans on glass (BIBLE section 3, "Type on glass"), as CSS for the title, the subline and captions.
// Sizes are LOGICAL px. Fonts are loaded by FilmShell (src/fonts.ts); nothing here loads a font.
import type {CSSProperties} from 'react';
import {COLORS, FONTS, type FormatName} from '../film';
import {rgba} from './hairline';

export type GlassTypeRole = 'title' | 'subline' | 'caption';

type RoleSpec = {
  weight: 400 | 500 | 700;
  size: Record<FormatName, number>;
  trackingEm: number;
  color: string;
  opacity: number;
  lineHeight: number;
};

export const GLASS_TYPE: Record<GlassTypeRole, RoleSpec> = {
  title: {weight: 700, size: {wide: 168, tall: 132}, trackingEm: -0.03, color: COLORS.glassWhite, opacity: 1, lineHeight: 1},
  subline: {weight: 400, size: {wide: 44, tall: 38}, trackingEm: 0, color: COLORS.glassWhite, opacity: 0.8, lineHeight: 1.2},
  caption: {weight: 500, size: {wide: 44, tall: 44}, trackingEm: 0, color: COLORS.glassWhite, opacity: 0.92, lineHeight: 1.18},
};

/** Title layout numbers that are not type styles. */
export const TITLE_LAYOUT = {
  /** "Provisum" sits this far left of centre so that "Provisum 2" is centred once the 2 arrives. */
  leftShiftPx: 40,
  /** Gap between the "m" and the drawn "2". */
  twoGapPx: 42,
  twoHeightPx: {wide: 150, tall: 118} as Record<FormatName, number>,
  twoLineWidthPx: 14,
  /** Subline baseline below the title baseline. */
  sublineGapPx: 48,
  /** 9:16 captions: baseline this far above the bottom edge, at most two lines. */
  captionBaselineFromBottomPx: 300,
  captionMaxLines: 2,
} as const;

/** DM Sans cap height as a fraction of the font size (measured from the face; used to centre on cap height). */
export const DM_SANS_CAP_HEIGHT = 0.7;

/** CSS for a role on glass. */
export const glassTextStyle = (role: GlassTypeRole, format: FormatName): CSSProperties => {
  const spec = GLASS_TYPE[role];
  return {
    fontFamily: FONTS.super,
    fontWeight: spec.weight,
    fontSize: spec.size[format],
    letterSpacing: `${spec.trackingEm}em`,
    lineHeight: spec.lineHeight,
    color: rgba(spec.color, spec.opacity),
    fontKerning: 'normal',
    fontFeatureSettings: '"kern" 1, "liga" 1',
    fontOpticalSizing: 'auto',
    WebkitFontSmoothing: 'antialiased',
    whiteSpace: 'pre',
  };
};

/** The canvas `font` shorthand for a role (for measuring with CanvasRenderingContext2D.measureText). */
export const glassCanvasFont = (role: GlassTypeRole, format: FormatName): string => {
  const spec = GLASS_TYPE[role];
  return `${spec.weight} ${spec.size[format]}px "DM Sans"`;
};
