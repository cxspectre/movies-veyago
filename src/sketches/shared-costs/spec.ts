// spec.ts — page 7, "Who paid what?" (BIBLE §4.8). Three people split by dotted lines, the coins each put in under
// them, and one accent circle around the one who paid most. Each coin is a `coin_clink`.
import {handCircle, handDottedLine, type SketchSpec, type XY} from '../../paper';
import {coin, stickFigure} from '../kit-b/glyphs';
import {checkSpec, STROKE_CAP_FAST} from '../kit-b/page';
import {accent, line, note, slots, WEIGHT} from '../kit-b/timed';

const SPLITS = [425, 775] as const;
const SPLIT_Y = {top: 180, bottom: 700} as const;
const FIGURE_X = [250, 600, 950] as const;
/** Head r 28 at y 250, body to 400, arms at y 310 ±40, legs to y 470 ±30 (BIBLE §4.8). */
const FIGURE = {headY: 250, headR: 28, hipY: 400, armY: 310, armSpan: 40, footY: 470, footSpread: 30} as const;
/** How each person stands: a shrug, a straight stance, arms a little lower. Three people, not one stamp. */
const POSES = [0.5, -0.4, 0.9] as const;
const COIN_R = 16;
const COINS: readonly XY[] = [
  [230, 510],
  [272, 510],
  // The bible's triangle (560,510)/(600,540)/(640,510) inside its ring read as a face at review; the three coins
  // sit in a row instead, so the page counts 2 / 3 / 1 at a glance.
  [561, 512],
  [600, 515],
  [639, 511],
  [950, 510],
];
/** The ring hugs the row of three: an ellipse 64 px wide each side, centred on the coins. */
const RING = {cx: 600, cy: 518, rx: 66, ry: 42} as const;

const splitStrokes = SPLITS.map((x, i) => {
  const [from, to] = slots(0.0, 0.1, SPLITS.length)[i] ?? [0, 0.1];
  return line(`split-${i + 1}`, handDottedLine(x, SPLIT_Y.top, x + (i === 0 ? 2 : -2), SPLIT_Y.bottom, 700 + i), from, to, {
    style: 'dotted',
    width: WEIGHT.dotted,
  });
});

const figureStrokes = FIGURE_X.map((cx, i) => {
  const [from, to] = slots(0.1, 0.62, FIGURE_X.length)[i] ?? [0.1, 0.62];
  return line(`fig-${i + 1}`, stickFigure({cx, ...FIGURE, pose: POSES[i] ?? 0}, 710 + i * 10), from, to, {width: WEIGHT.box});
});

const coinStrokes = COINS.map(([x, y], i) => {
  const [from, to] = slots(0.62, 0.78, COINS.length)[i] ?? [0.62, 0.78];
  return line(`coin-${i + 1}`, coin(x, y, COIN_R, 740 + i), from, to, {width: 1.8});
});

export const spec: SketchSpec = checkSpec(
  {
    id: 'shared-costs',
    strokes: [
      ...splitStrokes,
      ...figureStrokes,
      ...coinStrokes,
      accent('circle', handCircle(RING.cx, RING.cy, RING.rx, RING.ry, 760), 0.8, 0.86),
    ],
    labels: [note('Who paid what?', 780, 650, 2, 0.88, 1.0)],
  },
  STROKE_CAP_FAST,
);
