// layout.ts — family-tabs timing and the erase moment's numbers (BIBLE 4.2, 2.7), shared by the page and its layer.
import type {Span} from '../v1-home/kit';

/** Stroke-order fractions (BIBLE 4.2). */
export const FAMILY_TABS_FRACTIONS = {
  shelf: [0.0, 0.08],
  mom: [0.08, 0.185],
  ghost: [0.188, 0.22],
  erase: [0.22, 0.3],
  dad: [0.3, 0.4],
  me: [0.4, 0.5],
  child: [0.5, 0.62],
  dog: [0.62, 0.76],
  add: [0.76, 0.82],
  arrow: [0.84, 0.92],
  note: [0.92, 1.0],
} as const satisfies Record<string, Span>;
/** Where the eraser leaves its crumbs (BIBLE 2.7: 8 crumbs near (330,230)). */
export const CRUMBS = {area: {x: 306, y: 219, w: 56, h: 24}, count: 8, seed: 5, scale: 0.62} as const;

