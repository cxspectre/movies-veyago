// lamp.ts — the one-sided daylight lamp over the desk, and the shadow helpers every paper object shares.
// All lengths are logical px. Shadows are layered CSS box-shadows (cheap, no SVG filters).

export type Lamp = {
  /** Where the light comes FROM, degrees in screen space (y down): 180 = from the left, 270 = from the top. */
  readonly azimuth: number;
  /** Height of the lamp above the desk, degrees. Lower = longer shadows. */
  readonly elevation: number;
  /** Shadow darkness multiplier (1 = default). */
  readonly strength: number;
  /** 0 = neutral daylight, 1 = warm. */
  readonly warmth: number;
};

/** Daylight lamp from the upper left, fairly low for soft, long shadows. */
export const DEFAULT_LAMP: Lamp = {azimuth: 205, elevation: 34, strength: 1, warmth: 0.45};

const RAD = Math.PI / 180;
/** Warm-brown shadow colour (shadows on paper and oak are never neutral grey). */
const SHADOW_RGB = '48, 34, 20';

export const lampVector = (lamp: Lamp): {x: number; y: number} => ({x: Math.cos(lamp.azimuth * RAD), y: Math.sin(lamp.azimuth * RAD)});

/** Offset of the shadow of something `height` px above the desk (points away from the lamp). */
export const shadowOffset = (lamp: Lamp, height: number): {x: number; y: number} => {
  const v = lampVector(lamp);
  const reach = height / Math.tan(Math.max(5, lamp.elevation) * RAD);
  return {x: -v.x * reach, y: -v.y * reach};
};

export type ShadowOptions = {
  /** Height above the surface, px. Paper lying flat ~2, a lifted sticky note ~20, a cup ~60. */
  readonly height: number;
  /** Extra darkness multiplier. */
  readonly opacity?: number;
  /** Shrinks (negative) or grows the shadow footprint, px. */
  readonly spread?: number;
};

const layer = (lamp: Lamp, h: number, k: number, blur: number, alpha: number, spread: number): string => {
  const o = shadowOffset(lamp, h * k);
  return `${o.x.toFixed(2)}px ${o.y.toFixed(2)}px ${blur.toFixed(2)}px ${spread.toFixed(2)}px rgba(${SHADOW_RGB}, ${alpha.toFixed(3)})`;
};

/** A soft, physically-ordered CSS box-shadow: tight contact shadow, a mid penumbra and a long faint ambient. */
export const castShadow = (lamp: Lamp, o: ShadowOptions): string => {
  const h = Math.max(0, o.height);
  const s = lamp.strength * (o.opacity ?? 1);
  const spread = o.spread ?? 0;
  const fade = 1 / (1 + h / 60); // high objects throw lighter, softer shadows
  return [
    layer(lamp, h, 0.12, 0.6 + h * 0.08, 0.34 * s * fade, spread),
    layer(lamp, h, 0.55, 2 + h * 0.7, 0.22 * s * fade, spread),
    layer(lamp, h, 1.1, 6 + h * 2.4, 0.15 * s * fade, spread),
  ].join(', ');
};

/** CSS angle (deg) for a linear-gradient that runs from the lamp side to the far side. */
export const awayFromLampAngle = (lamp: Lamp): number => {
  const v = lampVector(lamp);
  return (Math.atan2(-v.x, v.y) * 180) / Math.PI;
};

/** A warm shade (darkening) colour at `alpha`, for normal-blend overlays. */
export const shade = (alpha: number): string => `rgba(${SHADOW_RGB}, ${Math.max(0, alpha).toFixed(3)})`;

/**
 * Light falloff across a surface as a normal-blend overlay: clear on the lamp side, `depth` of warm shade on the far side.
 * (The engine never uses CSS mix-blend-mode: blended layers break in Chrome when other layers overlap them.)
 */
export const lampFalloff = (lamp: Lamp, depth = 0.08): string =>
  `linear-gradient(${awayFromLampAngle(lamp).toFixed(1)}deg, ${shade(0)} 0%, ${shade(depth * 0.35)} 45%, ${shade(depth)} 100%)`;

/** Warm tint of the lamp's light as an rgba string (normal-blend overlays that brighten slightly). */
export const lampTint = (lamp: Lamp, alpha: number): string =>
  `rgba(255, ${Math.round(244 - lamp.warmth * 18)}, ${Math.round(228 - lamp.warmth * 46)}, ${alpha})`;
