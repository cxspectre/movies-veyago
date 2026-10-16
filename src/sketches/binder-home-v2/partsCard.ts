// partsCard.ts — `card-`: the Next-up block. On the 1.2 home it is not a bordered card: a headline row, the big
// countdown word ("Tomorrow"), the title and detail lines, the Done / Snooze buttons and the page dots.
import {chevronRight, doneCheck} from './icons';
import {MEASURED} from './measured';
import {circleOn, iconOn, letterOn, lineOn, pillOn, WEIGHT, type Piece} from './pen';
import {edges, elementsOf} from './screen';

/** Lettering sizes (sketch px) fitted to the real glyph runs (alignment.ts reports the residual). */
const SIZE = {countdown: 50, button: 16} as const;
const PAGER_DOT_GROW_PT = 1;

export const cardPieces = (): readonly Piece[] => {
  const [done, snooze] = elementsOf('nextUpAction');
  if (!done || !snooze) throw new Error('binder-home-v2: the Next-up card needs its Done and Snooze buttons');
  const n = MEASURED.nextUp;
  const [detail1, detail2] = n.detail;
  const dot = n.pagerDot;
  return [
    lineOn('card-headline', n.headline, {pressure: 1.1}),
    lineOn('card-more', n.link, {pressure: 1.1}),
    iconOn('card-more-chevron', n.linkChevron, chevronRight, {width: 1.6}),
    letterOn('card-countdown', 'Tomorrow', n.countdown, SIZE.countdown, {pressure: 1.3}),
    lineOn('card-title', n.title, {width: WEIGHT.heading, pressure: 1.1}),
    lineOn('card-detail-1', detail1, {pressure: 1.1}),
    lineOn('card-detail-2', detail2, {pressure: 1.1}),
    pillOn('card-done', done.frame, {rough: true}),
    iconOn('card-done-check', n.doneCheck, doneCheck, {width: 2.0}),
    letterOn('card-done-label', 'Done', n.doneText, SIZE.button, {pressure: 1.1}),
    pillOn('card-snooze', snooze.frame),
    letterOn('card-snooze-label', 'Snooze', n.snoozeText, SIZE.button, {pressure: 1.1}),
    lineOn('card-pager', n.pagerDash, {width: 2.6, pressure: 1.1}),
    circleOn('card-pager-dot', edges(dot.x - PAGER_DOT_GROW_PT, dot.y - PAGER_DOT_GROW_PT, dot.x + dot.w + PAGER_DOT_GROW_PT, dot.y + dot.h + PAGER_DOT_GROW_PT), {width: 1.4}),
  ];
};
