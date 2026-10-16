// layout.ts — where the end card's type and mark sit (pure).
import {DM_SANS_CAP_HEIGHT} from '../../glass';
import type {FormatName} from '../../film';
import type {WordMetrics} from '../title/measure';
import {END_CARD} from './tokens';

export type CardLayout = {
  readonly titleX: number;
  readonly titleBaseline: number;
  readonly lineX: number;
  readonly lineBaseline: number;
  /** Top-left of the mark and its size. */
  readonly markX: number;
  readonly markY: number;
  readonly markSize: number;
};

/** x of a run's origin so that its INK is centred on `centreX`. */
const inkCentred = (centreX: number, m: WordMetrics): number => centreX - (m.inkLeft + m.inkRight) / 2;

export const cardLayout = (frame: {format: FormatName; width: number; height: number}, title: WordMetrics, line: WordMetrics): CardLayout => {
  const titleCap = END_CARD.title.size[frame.format] * DM_SANS_CAP_HEIGHT;
  const lineCap = END_CARD.line.size[frame.format] * DM_SANS_CAP_HEIGHT;
  const gap = END_CARD.lineGapPx[frame.format];
  const block = titleCap + gap + lineCap;
  const top = frame.height * END_CARD.opticalCentreOfHeight - block / 2;
  const titleBaseline = top + titleCap;
  const centreX = frame.width / 2;
  const markSize = END_CARD.mark.heightPx[frame.format];
  return {
    titleX: inkCentred(centreX, title),
    titleBaseline,
    lineX: inkCentred(centreX, line),
    lineBaseline: titleBaseline + gap + lineCap,
    markX: centreX - markSize / 2,
    markY: frame.height - END_CARD.mark.bottomPx - markSize,
    markSize,
  };
};
