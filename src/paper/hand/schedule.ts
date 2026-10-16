// schedule.ts — helpers for authoring pages: build StrokeSpecs and spread their timing over a window by length.
import {pathLength} from '../geometry/path';
import {measureHand} from '../text/handLayout';
import type {LabelSpec, StrokeSpec} from '../types';

/** A stroke or label without timing yet. */
export type UntimedStroke = Omit<StrokeSpec, 'from' | 'to'>;
export type UntimedLabel = Omit<LabelSpec, 'from' | 'to'>;
export type Untimed = ({kind: 'stroke'} & UntimedStroke) | ({kind: 'label'} & UntimedLabel);

/** Defaults for a graphite line. */
export const stroke = (id: string, d: string, o: Partial<Omit<UntimedStroke, 'id' | 'd'>> = {}): {kind: 'stroke'} & UntimedStroke => ({
  kind: 'stroke',
  id,
  d,
  ink: 'graphite',
  width: 2,
  ...o,
});

/** Defaults for a hand-lettered label. */
export const label = (id: string, text: string, x: number, y: number, o: Partial<Omit<UntimedLabel, 'id' | 'text' | 'x' | 'y'>> = {}): {kind: 'label'} & UntimedLabel => ({
  kind: 'label',
  id,
  text,
  x,
  y,
  size: 34,
  ink: 'graphite',
  ...o,
});

/** Px-of-line equivalent each item costs regardless of length (reaching for it, lifting, landing). */
const ITEM_COST = 40;
/** A written character costs about as much time as this many px of line (~12 characters a second on a typical page). */
const CHAR_COST = 70;

const costOf = (item: Untimed): number =>
  item.kind === 'stroke'
    ? ITEM_COST + pathLength(item.d) * (item.rough ? 1.6 : 1)
    : ITEM_COST + Array.from(item.text).length * CHAR_COST + measureHand(item.text, item.size) * 0.1;

/**
 * Spread items one after another across [from, to] (fractions of drawFrames) in proportion to how long each takes
 * to draw, with a small pause (`gap`, fraction of the window per item) between them. Returns timed specs.
 */
export const sequence = (
  items: readonly Untimed[],
  from = 0,
  to = 1,
  gap = 0.15,
): {strokes: readonly StrokeSpec[]; labels: readonly LabelSpec[]} => {
  const costs = items.map(costOf);
  const pause = (costs.reduce((a, b) => a + b, 0) / Math.max(1, items.length)) * gap;
  const total = costs.reduce((a, c) => a + c + pause, 0) - pause || 1;
  const span = to - from;
  const timed = items.map((item, i) => {
    const before = costs.slice(0, i).reduce((a, c) => a + c + pause, 0);
    const start = from + (before / total) * span;
    const end = from + ((before + (costs[i] as number)) / total) * span;
    return {item, start, end};
  });
  const strokes = timed.flatMap(({item, start, end}) => {
    if (item.kind !== 'stroke') return [];
    const {kind: _kind, ...rest} = item;
    return [{...rest, from: start, to: end}];
  });
  const labels = timed.flatMap(({item, start, end}) => {
    if (item.kind !== 'label') return [];
    const {kind: _kind, ...rest} = item;
    return [{...rest, from: start, to: end}];
  });
  return {strokes, labels};
};
