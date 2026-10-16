// timing.ts — the end card's fades (pure; times from `endCard` in src/beats.ts). Nothing moves after markIn.to.
import {endCard, type Window} from '../../beats';
import {windowProgress} from '../../glass';

const fade = (w: Window, t: number): number => windowProgress(w, t, 'easeInOutSine');

export type CardState = {readonly title: number; readonly line: number; readonly mark: number};

export const cardState = (t: number): CardState => ({
  title: fade(endCard.titleIn, t),
  line: fade(endCard.lineIn, t),
  mark: fade(endCard.markIn, t),
});
