// tokens.ts — the title's own layout numbers, revised after the design review over the bible's first numbers
// (BIBLE section 3, which `TITLE_LAYOUT` in the glass kit still carries for other readers):
// - the "2" stands exactly at the cap height of "P" with a heavier line, 36 px from the m, so it reads as the 2 of
//   "Provisum 2" and not as a separate object;
// - the subline is a size larger, a touch brighter and 60 px under the baseline (TV distance);
// - in 9:16 the word's cap height is centred at 0.46 H, balancing the caption zone at the foot.
import type {FormatName} from '../../../film';
import {DM_SANS_CAP_HEIGHT, GLASS_TYPE} from '../../../glass';

export const TITLE = {
  twoGapPx: 36,
  twoLineWidthPx: {wide: 18, tall: 14} as Record<FormatName, number>,
  subline: {size: {wide: 48, tall: 40} as Record<FormatName, number>, opacity: 0.85},
  /** Subline cap tops this far under the title's baseline. */
  sublineGapPx: 60,
  /** Where the title's cap height is centred, as a fraction of the frame height. */
  capCentreOfHeight: {wide: 0.5, tall: 0.46} as Record<FormatName, number>,
} as const;

/** The 2's ink height: the cap height of the title's "P". */
export const twoInkHeight = (format: FormatName): number => GLASS_TYPE.title.size[format] * DM_SANS_CAP_HEIGHT;
