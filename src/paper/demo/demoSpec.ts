// demoSpec.ts — a small page that exercises every part of the engine (used by the Engine-demo composition).
import {handPath} from '../hand/handPath';
import {handArrow, handCheck, handCircle, handDottedLine, handLine, handRect, handTick, handUnderline} from '../hand/shapes';
import {label, sequence, stroke, type Untimed} from '../hand/schedule';
import type {SketchSpec} from '../types';

const TAB_TOP = 168;
const TAB_BOTTOM = 232;
const TAB_W = 132;
const TAB_GAP = 12;
const TABS = ['Mom', 'Dad', 'Me', 'Sam', 'Dog'] as const;
const BOX = {x: 110, y: TAB_BOTTOM, w: 760, h: 450};

/** A binder tab: up the left side, a rounded top, down the right. */
const tabPath = (x: number, seed: number): string =>
  handPath(
    [
      [x, TAB_BOTTOM + 2],
      [x + 4, TAB_TOP + 14],
      [x + 18, TAB_TOP],
      [x + TAB_W - 18, TAB_TOP + 1],
      [x + TAB_W - 4, TAB_TOP + 14],
      [x + TAB_W, TAB_BOTTOM + 2],
    ],
    seed,
    {wobble: 0.8},
  );

const tabX = (i: number): number => BOX.x + 14 + i * (TAB_W + TAB_GAP);

const tabs: readonly Untimed[] = TABS.flatMap((name, i) => [
  stroke(`tab-${i}`, tabPath(tabX(i), 40 + i), {width: 2, rough: i === 0}),
  label(`tab-label-${i}`, name, tabX(i) + 34, TAB_BOTTOM - 20, {size: 34}),
]);

const rows: readonly Untimed[] = [0, 1, 2].flatMap((r) => {
  const y = BOX.y + 110 + r * 92;
  const check = handCheck(BOX.x + 60, y - 30, 32, 70 + r);
  return [
    stroke(`row-box-${r}`, check.box, {width: 1.8}),
    stroke(`row-line-${r}`, handLine(BOX.x + 120, y, BOX.x + 470 - r * 60, y, 80 + r), {width: 1.6, pressure: 0.8}),
    ...(r < 2 ? [stroke(`row-tick-${r}`, check.tick, {width: 2.2, tick: true})] : []),
  ];
});

const arrow = handArrow(1000, 470, 790, 500, 9, {bend: -0.12, head: 16});

const items: readonly Untimed[] = [
  label('title', "Mom's binder", BOX.x + 4, 112, {size: 46}),
  stroke('title-underline', handUnderline(BOX.x + 4, 126, 230, 3), {width: 1.8}),
  ...tabs,
  stroke('binder', handRect(BOX.x, BOX.y, BOX.w, BOX.h, 5, {radius: 6, overshoot: 10}), {width: 2.4, rough: true}),
  stroke('tab-hatch', tabPath(tabX(0), 40), {style: 'hatch', width: 1.3, hatchGap: 5.5, pressure: 0.7}),
  ...rows,
  stroke('tick-big', handTick(BOX.x + 600, BOX.y + 210, 70, 21), {ink: 'accent', width: 3, tick: true}),
  stroke('tick-circle', handCircle(BOX.x + 612, BOX.y + 182, 64, 54, 22), {ink: 'accent', width: 2.6}),
  stroke('dotted', handDottedLine(BOX.x + 30, BOX.y + 400, BOX.x + 720, BOX.y + 400, 30), {style: 'dotted', width: 2}),
  stroke('scribble', handLine(BOX.x + 520, BOX.y + 340, BOX.x + 700, BOX.y + 336, 31), {style: 'scribble', width: 1.4, scribbleSize: 9, pressure: 0.75}),
  label('note', "Mom isn't the\nonly one.", 935, 330, {ink: 'accent', size: 44, rotate: -4}),
  stroke('note-arrow', arrow.shaft, {ink: 'accent', width: 2.4}),
  stroke('note-arrow-head', arrow.head, {ink: 'accent', width: 2.4}),
  stroke('margin-line', handLine(925, 120, 925, 760, 41, {bow: 3}), {width: 1.2, pressure: 0.45}),
];

export const DEMO_SPEC: SketchSpec = {id: 'engine-demo', ...sequence(items, 0, 1, 0.12)};
