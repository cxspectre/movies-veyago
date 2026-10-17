// layout.ts — where the title's pieces sit (BIBLE section 3, "Type on glass", with the review's numbers in
// ./tokens), from the format and measured type. Pure: metrics in, logical px out.
import {type FormatName} from '../../../film';
import {DM_SANS_CAP_HEIGHT, GLASS_TYPE} from '../../../glass';
import {TITLE} from './tokens';
import type {InkBox} from './twoGlyph';
import type {WordMetrics} from './measure';

export type TitleLayout = {
  /** Origin (pen x of the first letter) and baseline of "Provisum". */
  readonly wordX: number;
  readonly baseline: number;
  /** Translation that puts the 2's compiled path (its own px) in the frame. */
  readonly twoX: number;
  readonly twoY: number;
  /** Subline baseline (centred on the frame's centre line). */
  readonly sublineBaseline: number;
  readonly centreX: number;
  /** How far the word's own ink centre ends up left of the frame centre (the bible estimated 40 px). */
  readonly leftShift: number;
};

export type TitleFrame = {readonly format: FormatName; readonly width: number; readonly height: number};

/**
 * Cap height centred on `TITLE.capCentreOfHeight` (0.5 H wide, 0.46 H tall); the 2's ink `TITLE.twoGapPx` right of
 * the m's ink, its lowest ink on the baseline; the subline's cap tops `TITLE.sublineGapPx` under the baseline.
 * Horizontal: the bible shifts the word left "so that Provisum 2 together is centred when the 2 arrives"; the shift
 * is computed from the measured ink, so the pair's ink is centred on the frame, the same centre line as the subline.
 */
export const titleLayout = (frame: TitleFrame, word: WordMetrics, two: InkBox): TitleLayout => {
  const size = GLASS_TYPE.title.size[frame.format];
  const baseline = frame.height * TITLE.capCentreOfHeight[frame.format] + (size * DM_SANS_CAP_HEIGHT) / 2;
  const centreX = frame.width / 2;
  const pairInk = word.inkRight - word.inkLeft + TITLE.twoGapPx + (two.right - two.left);
  const wordX = centreX - pairInk / 2 - word.inkLeft;
  const sublineSize = TITLE.subline.size[frame.format];
  return {
    wordX,
    baseline,
    twoX: wordX + word.inkRight + TITLE.twoGapPx - two.left,
    twoY: baseline - two.bottom,
    sublineBaseline: baseline + TITLE.sublineGapPx + sublineSize * DM_SANS_CAP_HEIGHT,
    centreX,
    leftShift: centreX - (wordX + (word.inkLeft + word.inkRight) / 2),
  };
};
