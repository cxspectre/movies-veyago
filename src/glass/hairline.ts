// hairline.ts — "the sketch re-rendered as light" (BIBLE section 3), as styles for SVG, CSS and canvas.
// The transition owner draws the strokes; these helpers keep every hairline in the film on the same numbers.
// Normal blending only (CONTRACT 12.3): the glow is a shadow/blur UNDER the core, never a blend mode.
import {HAIRLINE} from './tokens';

export type HairlineInk = 'graphite' | 'accent';
export type HairlineStyle = {
  core: {color: string; opacity: number; widthPx: number};
  glow: {color: string; opacity: number; radiusPx: number};
};

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** Hex (#RRGGBB) + alpha -> rgba(). */
export const rgba = (hex: string, alpha: number): string => {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  if (Number.isNaN(n) || hex.replace('#', '').length !== 6) throw new Error(`rgba: not a #RRGGBB colour: ${hex}`);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${clamp(alpha, 0, 1).toFixed(4)})`;
};

/**
 * Brightness of a stroke `secondsSince` after it turned to light: 1.2 for the first 0.6 s, then an ease back to 1.0
 * over 0.3 s. Before conversion (negative time) it is 0.
 */
export const SETTLE_SECONDS = 0.3;
export const freshLevel = (secondsSince: number): number => {
  if (secondsSince < 0) return 0;
  if (secondsSince <= HAIRLINE.freshSeconds) return HAIRLINE.freshFlare;
  const k = clamp((secondsSince - HAIRLINE.freshSeconds) / SETTLE_SECONDS, 0, 1);
  const smooth = k * k * (3 - 2 * k);
  return HAIRLINE.freshFlare + (1 - HAIRLINE.freshFlare) * smooth;
};

/** The style of a hairline at `level` (1 = settled, 1.2 = fresh, 1.6 = snap flare). Width and glow are logical px. */
export const hairlineStyle = (ink: HairlineInk, level = 1): HairlineStyle => {
  const accent = ink === 'accent';
  const glowLevel = clamp(level, 0, 3);
  return {
    core: {
      color: accent ? HAIRLINE.accentCore : HAIRLINE.core,
      opacity: clamp(HAIRLINE.coreOpacity * Math.min(level, 1), 0, 1),
      // Above 1 the core does not get more opaque; it gets a touch wider, which reads as brighter.
      widthPx: HAIRLINE.widthPx * (level > 1 ? 1 + (level - 1) * 0.5 : 1),
    },
    glow: {
      color: accent ? HAIRLINE.accentGlow : HAIRLINE.glow,
      opacity: clamp((accent ? HAIRLINE.accentGlowOpacity : HAIRLINE.glowOpacity) * glowLevel, 0, 1),
      radiusPx: HAIRLINE.glowPx * (level > 1 ? 1 + (level - 1) * 0.75 : 1),
    },
  };
};

/** A CSS `filter` value that puts the glow under an SVG/HTML hairline (two stacked drop-shadows: tight + wide). */
export const hairlineGlowFilter = (ink: HairlineInk, level = 1, zoom = 1): string => {
  const {glow} = hairlineStyle(ink, level);
  const tight = rgba(glow.color, glow.opacity);
  const wide = rgba(glow.color, glow.opacity * 0.5);
  return `drop-shadow(0 0 ${(glow.radiusPx * 0.5 * zoom).toFixed(2)}px ${tight}) drop-shadow(0 0 ${(glow.radiusPx * zoom).toFixed(2)}px ${wide})`;
};

/** SVG stroke attributes for the core line. */
export const hairlineSvgStroke = (ink: HairlineInk, level = 1, zoom = 1): {stroke: string; strokeWidth: number; strokeOpacity: number; strokeLinecap: 'round'; strokeLinejoin: 'round'; fill: 'none'} => {
  const {core} = hairlineStyle(ink, level);
  return {stroke: core.color, strokeWidth: core.widthPx * zoom, strokeOpacity: core.opacity, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none'};
};

/**
 * Strokes `path` on a 2D canvas as light: a blurred glow pass, then the core. `devicePx` is device pixels per logical
 * px (the render scale times any zoom). Leaves the context state as it found it.
 */
export const strokeHairline = (ctx: CanvasRenderingContext2D, path: Path2D, ink: HairlineInk, level = 1, devicePx = 1): void => {
  const {core, glow} = hairlineStyle(ink, level);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = rgba(glow.color, glow.opacity);
  ctx.shadowBlur = glow.radiusPx * devicePx;
  ctx.strokeStyle = rgba(glow.color, glow.opacity);
  ctx.lineWidth = core.widthPx * devicePx * 2;
  ctx.stroke(path);
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = rgba(core.color, core.opacity);
  ctx.lineWidth = core.widthPx * devicePx;
  ctx.stroke(path);
  ctx.restore();
};
