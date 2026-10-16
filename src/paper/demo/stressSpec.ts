// stressSpec.ts — a dense "typical page" (about 150 strokes and 12 labels) for measuring render time.
// Render with:  npx remotion still src/index.ts Engine-demo out/x.png --frame=150 --scale=1 --props='{"stress":true}'
import {handArrow, handCircle, handDottedLine, handLine, handRect, handTick} from '../hand/shapes';
import {label, sequence, stroke, type Untimed} from '../hand/schedule';
import type {SketchSpec} from '../types';

const COLS = 6;
const ROWS = 4;
const CELL = {w: 175, h: 175, x0: 70, y0: 90};

const cell = (c: number, r: number): readonly Untimed[] => {
  const x = CELL.x0 + c * CELL.w;
  const y = CELL.y0 + r * CELL.h;
  const k = r * COLS + c;
  const arrow = handArrow(x + 20, y + 150, x + 140, y + 120, k);
  return [
    stroke(`box-${k}`, handRect(x + 10, y + 10, 150, 110, k), {width: 2, rough: k % 3 === 0}),
    stroke(`l1-${k}`, handLine(x + 25, y + 45, x + 140, y + 45, k + 1), {width: 1.5}),
    stroke(`l2-${k}`, handLine(x + 25, y + 70, x + 120, y + 70, k + 2), {width: 1.5}),
    stroke(`dot-${k}`, handDottedLine(x + 25, y + 95, x + 140, y + 95, k + 3), {width: 1.8, style: 'dotted'}),
    stroke(`ring-${k}`, handCircle(x + 130, y + 30, 16, 14, k + 4), {width: 2, ink: k % 4 === 0 ? 'accent' : 'graphite'}),
    stroke(`tick-${k}`, handTick(x + 128, y + 34, 18, k + 5), {width: 2}),
    ...(k % 4 === 1 ? [stroke(`hatch-${k}`, handRect(x + 25, y + 20, 50, 16, k + 6), {style: 'hatch', width: 1.2})] : []),
    ...(k % 5 === 0 ? [stroke(`arrow-${k}`, arrow.shaft, {ink: 'accent', width: 2}), stroke(`head-${k}`, arrow.head, {ink: 'accent', width: 2})] : []),
  ];
};

const labels: readonly Untimed[] = Array.from({length: 12}, (_, i) =>
  label(`lab-${i}`, ['Mom', 'Deadlines', 'Bills', 'Passport', 'Card', 'Packets'][i % 6] as string, CELL.x0 + (i % COLS) * CELL.w + 20, CELL.y0 + Math.floor(i / COLS) * CELL.h * 2 + 160, {
    size: 26,
    ink: i % 5 === 0 ? 'accent' : 'graphite',
  }),
);

const items: readonly Untimed[] = [...Array.from({length: COLS * ROWS}, (_, i) => cell(i % COLS, Math.floor(i / COLS))).flat(), ...labels];

export const STRESS_SPEC: SketchSpec = {id: 'engine-stress', ...sequence(items, 0, 1, 0.05)};
