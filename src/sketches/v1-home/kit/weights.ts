// weights.ts — line weights by element class (BIBLE 2.4), in sketch px on the 1200x850 page.
export const W = {
  device: 3.0,
  ui: 2.2,
  text: 1.6,
  hatch: 1.2,
  dotted: 1.6,
  tick: 3.0,
  accent: 2.6,
} as const;

/** Lettering sizes (BIBLE 2.6). */
export const TYPE = {
  note: 44,
  noteLong: 36,
  label: 30,
} as const;

/** Notes longer than this many characters use the smaller margin-note size. */
export const LONG_NOTE_CHARS = 26;
