// spec.ts — page 5, "Is this a scam?" (BIBLE §4.6). An envelope from Mom's mail, a big accent question mark
// beside it, circled. The question mark is the script's "red" one: the film's single accent colour (DECISIONS #9).
import {handCircle, handRect, type SketchSpec} from '../../paper';
import {crossedBox, driftLine, textLines} from '../kit-b/glyphs';
import {checkSpec, STROKE_CAP_FAST} from '../kit-b/page';
import {accent, line, note, slots, tag, WEIGHT} from '../kit-b/timed';

const ENVELOPE = {x1: 300, y1: 250, x2: 820, y2: 580} as const;
const FLAP_TIP = {x: 560, y: 440} as const;
/**
 * The stamp sits in the envelope's top-right corner. The bible's (720,280)-(790,340) is crossed by the flap's
 * diagonal (y = 323 at x 720), so the stamp moves down and right into the clear triangle under the fold.
 */
const STAMP = {x1: 738, y1: 330, x2: 798, y2: 392} as const;
const ADDRESS: readonly (readonly [number, number, number])[] = [
  [380, 460, 640],
  [380, 500, 600],
  [380, 540, 560],
];
const QUESTION = {x: 865, y: 410, size: 120} as const;
const RING = {cx: 905, cy: 370, r: 85} as const;

/** The three address lines share the window 0.42-0.58, top to bottom. */
const addressLines = ADDRESS.map(([x1, y, x2], i) => {
  const [from, to] = slots(0.42, 0.58, ADDRESS.length)[i] ?? [0.42, 0.58];
  return line(`address-${i + 1}`, textLines([[x1, y, x2]], 515 + i), from, to, {width: WEIGHT.text});
});

const envelope = crossedBox(ENVELOPE.x1, ENVELOPE.y1, ENVELOPE.x2, ENVELOPE.y2, 511, 10);
const flap = driftLine(
  [
    [ENVELOPE.x1 + 4, ENVELOPE.y1 + 3],
    [(ENVELOPE.x1 + FLAP_TIP.x) / 2 + 3, (ENVELOPE.y1 + FLAP_TIP.y) / 2 - 2],
    [FLAP_TIP.x, FLAP_TIP.y],
    [(FLAP_TIP.x + ENVELOPE.x2) / 2 - 2, (FLAP_TIP.y + ENVELOPE.y1) / 2 - 3],
    [ENVELOPE.x2 - 2, ENVELOPE.y1 + 2],
  ],
  512,
  0.8,
);
const stamp = handRect(STAMP.x1, STAMP.y1, STAMP.x2 - STAMP.x1, STAMP.y2 - STAMP.y1, 513, {radius: 2, overshoot: 5});
const stampInside = handRect(STAMP.x1 + 8, STAMP.y1 + 8, STAMP.x2 - STAMP.x1 - 16, STAMP.y2 - STAMP.y1 - 16, 514, {radius: 1, overshoot: 0});

export const spec: SketchSpec = checkSpec(
  {
    id: 'scam-letter',
    strokes: [
      line('envelope', envelope, 0.0, 0.22, {width: WEIGHT.device, rough: true}),
      line('flap', flap, 0.22, 0.34),
      line('stamp', stamp, 0.34, 0.38, {width: 1.8}),
      line('stamp-hatch', stampInside, 0.38, 0.42, {style: 'hatch', width: WEIGHT.hatch, hatchGap: 11, hatchAngle: -50, pressure: 0.75}),
      ...addressLines,
      accent('circle', handCircle(RING.cx, RING.cy, RING.r, RING.r * 0.94, 518), 0.8, 0.88),
    ],
    labels: [
      tag('question', '?', QUESTION.x, QUESTION.y, 0.62, 0.78, {size: QUESTION.size, ink: 'accent', face: 'kalam-700'}),
      note('Is this a scam?', 840, 640, -3, 0.9, 1.0),
    ],
  },
  STROKE_CAP_FAST,
);
