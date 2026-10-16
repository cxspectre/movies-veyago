// watchSpec.ts — the generic smartwatch, in DEVICE UNITS (the case is 1 unit tall; modelled on a 46 x 39 x 9.7 mm
// case). Screen at the exact aspect of the Watch captures (416 x 496 px).
import type {RoundedRect} from '../../glass/edgeLightPath';

const MM_PER_UNIT = 46;
const mm = (v: number): number => v / MM_PER_UNIT;

export const WATCH_SCREEN_PX = {width: 416, height: 496} as const;
const CASE_W = mm(39);
const SCREEN_W = CASE_W - 2 * mm(2.55);

export const WATCH = {
  outline: {width: CASE_W, height: 1, radius: mm(10.6)} as RoundedRect,
  depth: mm(9.7),
  frontEdge: mm(1.5),
  backEdge: mm(3.2),
  screen: {width: SCREEN_W, height: SCREEN_W / (WATCH_SCREEN_PX.width / WATCH_SCREEN_PX.height), radius: mm(8.4), centreY: 0},
  crown: {radius: mm(3.4), length: mm(2.6), y: mm(7.5), z: mm(0.6)},
  button: {y: mm(-6.2), length: mm(10.5), protrusion: mm(0.8), thickness: mm(3.4), z: mm(0.4)},
  /**
   * Strap stubs: `length` is the half-length of the slab (its inner half hides behind the case). The free end narrows by
   * `taper` (8%), is rounded with `radius` (0.2 of the width) and curls back by `curl` (toward the wrist).
   */
  strap: {width: mm(24), length: mm(10), thickness: mm(3.2), tiltDeg: 16, z: mm(-2.2), radius: mm(24 * 0.2), taper: 0.08, curl: mm(2.4)},
} as const;

/** The clock in the Watch captures (pixels on the 416 x 496 frame): the real time, to be covered with 9:41. */
export const WATCH_CLOCK = {
  /** Area painted over (generous around the digits at x 306-382, y 40-62). */
  cover: {x: 292, y: 28, w: 106, h: 46},
  /** Where the black is sampled (left of the clock, inside the status area). */
  sample: {x: 284, y: 50},
  /** The replacement: right-aligned at the old digits' right edge, on their baseline. */
  text: '9:41',
  right: 382,
  baseline: 62,
  /** DM Sans size whose digits are 23 px tall like the originals (digit height ~0.70 em). */
  fontSize: 33,
  weight: 500,
} as const;
