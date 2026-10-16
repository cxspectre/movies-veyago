// tokens.ts — the glass world's numbers (BIBLE section 3), in one place for the rigs, the transition and the title.
import {COLORS} from '../film';

/** The travelling band of light on a device edge. Width is a fraction of the DEVICE HEIGHT, measured along the edge. */
export const EDGE_LIGHT = {
  widthOfDeviceHeight: 0.07,
  core: COLORS.glassWhite, // #F5F7FA
  halo: '#9FB4FF',
  haloOpacity: 0.3,
  /** The halo reaches this many band widths outside the edge (and runs this much longer along it). */
  haloExtentWidths: 2,
  /** Fresnel reflection of the edge light in the screen glass, at normal incidence. */
  glassReflection: 0.04,
  /** One lap in the transition. */
  lapSeconds: 8,
} as const;

/** Bloom on everything lit in the void. Radius in LOGICAL px (doubled at 4K by the render scale). */
export const BLOOM = {threshold: 0.6, radiusPx: 12, intensity: 0.35} as const;

/** Device bodies. */
export const BODY = {
  color: '#0B0B0C',
  edgeHighlight: '#3A3A40',
  /** Edge highlight width in logical px. */
  edgeHighlightPx: 1,
} as const;

/** The sketch re-rendered as light (the transition). */
export const HAIRLINE = {
  widthPx: 1.5,
  core: '#FFFFFF',
  coreOpacity: 0.95,
  glowPx: 6,
  glow: '#DDE6FF',
  glowOpacity: 0.35,
  accentCore: '#9FB4FF',
  accentGlow: COLORS.accent, // #2F5BEA
  accentGlowOpacity: 0.45,
  /** A freshly converted stroke glows at this level for `freshSeconds`, then settles to 1. */
  freshFlare: 1.2,
  freshSeconds: 0.6,
  /** The re-tracing head: a dot of this diameter at this brightness. */
  headPx: 10,
  headFlare: 1.6,
  /** The UI snaps flare the group's hairlines to this. */
  snapFlare: 1.6,
} as const;

export const VOID = COLORS.void;
