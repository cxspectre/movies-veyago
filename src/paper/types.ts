// types.ts — data model for hand-drawn pages. A sketch is DATA (strokes + labels) so the same drawing can be
// rendered as graphite on paper (Acts 1-2) and re-rendered as hairlines of light (Act 3, the transition).

/** 'sepia' is Maya's ink (BIBLE4 §3): the same pencil physics as graphite, warm brown. */
export type Ink = 'graphite' | 'accent' | 'sepia';

export type StrokeSpec = {
  id: string;
  /** SVG path data in the sketch's own coordinate space (SKETCH_SIZE). */
  d: string;
  ink: Ink;
  /** Nominal line width in sketch px; the renderer adds pressure variation and wobble. */
  width: number;
  /** Stroke order, as fractions (0-1) of the sketch's drawFrames. Strokes may overlap in time. */
  from: number;
  to: number;
  style?: 'line' | 'dotted' | 'hatch' | 'scribble';
  /** Drawn on the first pass as a loose "rough" (lighter, offset) before the clean line goes over it. */
  rough?: boolean;
  // ---- optional, added by the paper engine (all have sensible defaults) ----
  /** Emit a 'tick' hit cue when this stroke finishes (a list item being ticked). */
  tick?: boolean;
  /** Pressure multiplier, 1 = a normal confident line; 0.5 = light construction line; 1.4 = pressed hard. */
  pressure?: number;
  /** 'hatch' only: `d` is the closed region to fill. Angle of the hatch lines in degrees (default -55) and gap in px (default 6). */
  hatchAngle?: number;
  hatchGap?: number;
  /** 'scribble' only: half-height of the scribble loops in px (default 7). */
  scribbleSize?: number;
};

/** Hand-lettering faces bundled in public/fonts (metrics in src/paper/text/handMetrics.ts). */
export type HandFaceKey = 'caveat-500' | 'caveat-700' | 'kalam-400' | 'kalam-700' | 'patrick-400' | 'reenie-400';

export type LabelSpec = {
  id: string;
  text: string;
  /** Baseline-left anchor in sketch px. */
  x: number;
  y: number;
  size: number;
  ink: Ink;
  rotate?: number;
  from: number;
  to: number;
  // ---- optional, added by the paper engine ----
  /** Lettering face (default 'caveat-500' for graphite, 'caveat-700' for accent). */
  face?: HandFaceKey;
  /** Pressure multiplier for the lettering (default 1). */
  pressure?: number;
};

export type SketchSpec = {
  id: string;
  strokes: readonly StrokeSpec[];
  labels: readonly LabelSpec[];
};

/** A sketched page is drawn on a fixed A3-landscape canvas; the desk scales/places it. */
export const SKETCH_SIZE = {width: 1200, height: 850} as const;

export type SketchProps = {
  /** Frames the page takes to draw itself from local frame 0; it holds the finished drawing afterwards. */
  drawFrames: number;
};
