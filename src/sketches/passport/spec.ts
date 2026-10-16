// spec.ts — page 6, passports and IDs reminded early (BIBLE §4.7). A passport, a real ruler laid across the page
// (its tap is heard), and three accent marks on it at 9, 6 and 3 months. The marks are named `mark-` so they do NOT
// sound as list ticks.
import {handCircle, handLine, handPath, measureHand, type SketchSpec, type XY} from '../../paper';
import {roundedRect, ruled, ruledBox, textLines} from '../kit-b/glyphs';
import {checkSpec, STROKE_CAP_FAST} from '../kit-b/page';
import {accent, line, note, slots, tag, WEIGHT} from '../kit-b/timed';

const PASSPORT = {x1: 160, y1: 180, x2: 500, y2: 640, r: 14} as const;
const EMBLEM = {cx: 330, cy: 330, r: 40} as const;
const RULER = {x1: 600, y1: 380, x2: 1120, y2: 440} as const;
const GRADUATION = {first: 610, step: 20, count: 26, short: 12, long: 20, everyLong: 5} as const;
const MARK = {top: 330, bottom: 377} as const;
const MONTHS = [
  {months: 9, x: 700, labelX: 694},
  {months: 6, x: 860, labelX: 854},
  {months: 3, x: 1020, labelX: 1014},
] as const;
const MARK_WINDOWS: readonly (readonly [number, number])[] = [
  [0.68, 0.72],
  [0.74, 0.78],
  [0.8, 0.84],
];
const LABEL_Y = 480;
/** The booklet's hinge: a line just inside the left edge, so the cover reads as a book, not a card. */
const SPINE_X = 184;
/** The cover's title under the globe (Patrick Hand, graphite): it makes the booklet a passport at a glance. */
const TITLE = {text: 'PASSPORT', y: 428, size: 26} as const;
/** The marks are pressed: they are the page's "yes", and the eye must find them on a fast page. */
const MARK_PRESSURE = 1.35;
const MONTHS_X = 1050;

/** The cover's globe: the ring, then the equator, then one meridian as a narrow ellipse. */
const globe = (): string =>
  [
    handCircle(EMBLEM.cx, EMBLEM.cy, EMBLEM.r, EMBLEM.r * 0.98, 621, {overlap: 0.1}),
    handLine(EMBLEM.cx - EMBLEM.r + 3, EMBLEM.cy + 1, EMBLEM.cx + EMBLEM.r - 2, EMBLEM.cy - 1, 622, {overshoot: 0, bow: 0.6}),
    handCircle(EMBLEM.cx, EMBLEM.cy, EMBLEM.r * 0.42, EMBLEM.r * 0.97, 623, {overlap: 0.04, startAngle: -90}),
  ].join(' ');

/** The cover in one movement, then the hinge line down its left side. */
const cover = (): string =>
  [
    roundedRect(PASSPORT.x1, PASSPORT.y1, PASSPORT.x2 - PASSPORT.x1, PASSPORT.y2 - PASSPORT.y1, PASSPORT.r, 620, 8),
    handLine(SPINE_X, PASSPORT.y1 + 8, SPINE_X - 1, PASSPORT.y2 - 8, 626, {overshoot: 0, bow: 1}),
  ].join(' ');

/** Ruler graduations hanging from the top edge; every fifth runs longer. One movement each, pencil against the edge. */
const graduations = (): string =>
  Array.from({length: GRADUATION.count}, (_, i) => {
    const x = GRADUATION.first + i * GRADUATION.step;
    const len = i % GRADUATION.everyLong === 0 ? GRADUATION.long : GRADUATION.short;
    return ruled(x, RULER.y1, x, RULER.y1 + len, 630 + i, 0.5);
  }).join(' ');

/** An accent mark: one quick downward stroke that lands on the ruler's edge, leaning a touch like a real hand. */
const markPath = (x: number, seed: number): string => {
  const pts: XY[] = [
    [x + 2.5, MARK.top],
    [x + 1, (MARK.top + MARK.bottom) / 2],
    [x - 1, MARK.bottom],
  ];
  return handPath(pts, seed, {wobble: 0.4});
};

const [l9, l6, l3, lMonths] = slots(0.84, 0.9, 4);

export const spec: SketchSpec = checkSpec(
  {
    id: 'passport',
    strokes: [
      line('passport', cover(), 0.0, 0.24, {width: WEIGHT.device, rough: true}),
      line('emblem', globe(), 0.24, 0.3),
      line('lines', textLines([[200, 540, 460], [200, 580, 460]], 624), 0.32, 0.4, {width: WEIGHT.text}),
      line('ruler', ruledBox(RULER.x1, RULER.y1, RULER.x2, RULER.y2, 625), 0.42, 0.56),
      line('graduations', graduations(), 0.56, 0.66, {width: WEIGHT.text}),
      ...MONTHS.map((m, i) => {
        const [from, to] = MARK_WINDOWS[i] ?? [0.68, 0.72];
        return accent(`mark-${m.months}`, markPath(m.x, 640 + i), from, to, {width: WEIGHT.tick, pressure: MARK_PRESSURE});
      }),
    ],
    labels: [
      tag('title', TITLE.text, EMBLEM.cx - measureHand(TITLE.text, TITLE.size, 'patrick-400') / 2, TITLE.y, 0.3, 0.32, {size: TITLE.size}),
      ...MONTHS.map((m, i) => {
        const [from, to] = [l9, l6, l3][i] ?? [0.84, 0.9];
        return tag(`label-${m.months}`, String(m.months), m.labelX, LABEL_Y, from, to);
      }),
      tag('label-months', 'months', MONTHS_X, LABEL_Y, lMonths?.[0] ?? 0.885, lMonths?.[1] ?? 0.9),
      note('Reminded early. For everyone.', 600, 620, -2, 0.9, 1.0),
    ],
  },
  STROKE_CAP_FAST,
);
