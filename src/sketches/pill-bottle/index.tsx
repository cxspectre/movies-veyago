// pill-bottle — the medication list on the card, with refill reminders (page 3, BIBLE 4.4). A pill bottle with a
// ridged cap and a label, a bell above it (the refill reminder), the emergency card beside it, the accent circle
// round the bell, an accent arrow from the label to the card, the note. No schedule, no taken/not-taken: a list.
import React from 'react';
import {GraphiteSketch, handCircle, handLine, label, stroke, type SketchProps, type SketchSpec} from '../../paper';
import {hashSigned} from '../../paper/geometry/noise';
import {bellGlyph, cardParts, curvedArrow, joinPaths, makeCues, page, roundBox, roundedRun, spread, textLines, TYPE, W, type Span, type Timed} from '../v1-home/kit';

/** Stroke-order fractions (BIBLE 4.4). */
export const PILL_BOTTLE_FRACTIONS = {
  cap: [0.0, 0.1],
  body: [0.1, 0.26],
  label: [0.26, 0.34],
  labelLines: [0.34, 0.52],
  bell: [0.52, 0.66],
  card: [0.66, 0.78],
  circle: [0.8, 0.86],
  arrow: [0.86, 0.92],
  note: [0.92, 1.0],
} as const satisfies Record<string, Span>;
const F = PILL_BOTTLE_FRACTIONS;

const CAP = {x1: 400, y1: 270, x2: 640, y2: 330, radius: 8, ridges: 6} as const;
const BODY = {x1: 420, y1: 330, x2: 620, y2: 700, radius: 20} as const;
const BELL = {cx: 520, rimY: 220, w: 60, h: 50, clapperR: 4} as const;

/** The cap's grip ridges: short verticals, evenly spaced by eye (a pixel or two off). */
const ridges = joinPaths(
  ...Array.from({length: CAP.ridges}, (_, i) => {
    const x = CAP.x1 + ((CAP.x2 - CAP.x1) * (i + 1)) / (CAP.ridges + 1) + hashSigned(9, i) * 1.6;
    return handLine(x, CAP.y1 + 9, x + hashSigned(10, i) * 1.2, CAP.y2 - 8, 200 + i, {overshoot: 0.6, bow: 0.4, wobble: 0.25});
  }),
);

/** The body hangs from under the cap: down the left side, round the base, up the right side. Open at the top. */
const body = roundedRun(
  [
    [BODY.x1 + 2, BODY.y1 + 1],
    [BODY.x1 - 0.5, BODY.y2],
    [BODY.x2 + 0.6, BODY.y2 + 0.8],
    [BODY.x2 - 1.5, BODY.y1 + 2],
  ],
  12,
  {radius: BODY.radius, drift: 1.1},
);

const card = cardParts(
  {
    x1: 720,
    y1: 560,
    x2: 900,
    y2: 680,
    radius: 10,
    plus: [738, 576, 16],
    linesX: 768,
    rows: [
      [612, 880],
      [636, 872],
      [660, 830],
    ],
  },
  40,
);

// From just outside the bottle's right side (the bible's (600,520) is inside the body outline) to the card's edge.
const arrow = curvedArrow(
  [
    [632, 524],
    [664, 548],
    [690, 578],
    [711, 600],
  ],
  50,
  16,
);

const groups: readonly Timed[] = [
  spread(
    [
      stroke('cap', roundBox(CAP.x1, CAP.y1, CAP.x2, CAP.y2, CAP.radius, 11), {width: W.device}),
      stroke('cap-ridges', ridges, {width: W.hatch, pressure: 0.8}),
    ],
    F.cap,
    0.05,
  ),
  spread([stroke('body', body, {width: W.device, rough: true})], F.body, 0),
  spread([stroke('label', roundBox(445, 420, 595, 620, 6, 13), {width: W.ui})], F.label, 0),
  spread(
    [
      // the name line first, pressed a little harder; then the four detail lines
      stroke('label-lines-name', textLines(460, [[450, 580]], 14), {width: 2.0, pressure: 1.15}),
      stroke(
        'label-lines',
        textLines(
          460,
          [
            [480, 560],
            [510, 548],
            [540, 560],
            [570, 524],
          ],
          15,
        ),
        {width: W.text},
      ),
    ],
    F.labelLines,
    0.06,
  ),
  spread([stroke('bell', bellGlyph(BELL.cx, BELL.rimY, BELL.w, BELL.h, 16, BELL.clapperR), {width: W.ui})], F.bell, 0),
  spread(
    [
      stroke('card', card.outline, {width: W.ui}),
      stroke('card-plus', card.plus, {width: W.ui}),
      stroke('card-lines', card.lines, {width: W.text}),
    ],
    F.card,
    0.06,
  ),
  // r 60 across; a touch flatter so it clears the cap below it
  spread([stroke('circle', handCircle(520, 203, 62, 56, 17), {ink: 'accent', width: W.accent})], F.circle, 0),
  spread([stroke('arrow', arrow.shaft, {ink: 'accent', width: W.accent}), stroke('arrow-head', arrow.head, {ink: 'accent', width: W.accent})], F.arrow, 0.05),
  spread([label('note', 'On the card, with a refill reminder.', 700, 420, {ink: 'accent', size: TYPE.noteLong, rotate: 2})], F.note, 0),
];

export const spec: SketchSpec = page('pill-bottle', groups);

export const cues = makeCues(spec);

export const Sketch: React.FC<SketchProps> = ({drawFrames}) => <GraphiteSketch spec={spec} drawFrames={drawFrames} />;
