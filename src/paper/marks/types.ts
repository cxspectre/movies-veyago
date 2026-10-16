// marks/types.ts — the engine's internal drawing model. A page (SketchSpec) compiles to a list of MARKS:
// single pencil movements with per-point width, pressure and timing. Every renderer (graphite canvas, light
// hairlines) and every follower (hands, cup, foley) reads the same marks, so they can never disagree.
import type {HandFaceKey, Ink} from '../types';

/** One sample of a pencil movement. `t` is the normalised time (0-1 within the mark) the tip reaches it. */
export type MarkPoint = {
  readonly x: number;
  readonly y: number;
  /** Line width here, sketch px. */
  readonly w: number;
  /** Pressure here, ~0.1 (feather) to ~1.4 (pressed hard). */
  readonly p: number;
  readonly t: number;
};

export type PathRole = 'rough' | 'clean' | 'hatch' | 'scribble' | 'dotted';

export type PathMark = {
  readonly kind: 'path';
  readonly strokeId: string;
  readonly ink: Ink;
  readonly role: PathRole;
  readonly seed: number;
  readonly pts: readonly MarkPoint[];
  readonly length: number;
  /** How many slightly offset strands one movement lays down (1-3). */
  readonly strands: number;
  /** Graphite laid down per unit pressure (rough passes are lighter). */
  readonly deposit: number;
  /** Fractions (0-1) of the page's drawFrames. */
  readonly start: number;
  readonly end: number;
  /** Index of the mark inside its stroke (0 = first movement). */
  readonly order: number;
};

export type GlyphMark = {
  readonly kind: 'glyph';
  readonly strokeId: string;
  readonly ink: Ink;
  readonly seed: number;
  readonly char: string;
  readonly face: HandFaceKey;
  /** Glyph origin (baseline-left), sketch px. */
  readonly x: number;
  readonly y: number;
  readonly size: number;
  /** Radians. */
  readonly rotate: number;
  readonly deposit: number;
  /** The pen's path through the glyph in glyph-local px (origin at the glyph baseline), used to reveal it. */
  readonly pen: readonly MarkPoint[];
  /** Width of the reveal brush in glyph-local px. */
  readonly brush: number;
  readonly start: number;
  readonly end: number;
  /** Word counter inside the label (sound groups words; the pen lifts between them). */
  readonly word: number;
  readonly order: number;
};

export type Mark = PathMark | GlyphMark;
