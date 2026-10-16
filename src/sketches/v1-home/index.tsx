// v1-home — Provisum 1 as it shipped (cold open, BIBLE 4.1). The "before": a phone outline, the binder tab, the
// card, three deadlines with a bell, mail and packets, then five accent ticks timed by V1_HOME_FRACTIONS.
import React from 'react';
import {V1_HOME_FRACTIONS as F} from '../../beats';
import {GraphiteSketch, handCircle, label, stroke, type SketchProps, type SketchSpec, type Untimed, type XY} from '../../paper';
import {bellGlyph, cardParts, envelope, folder, joinPaths, makeCues, page, roundBox, roundedRun, spread, textLines, tickMark, TYPE, W, type Timed} from './kit';

/** The phone frame convention (BIBLE 4): portrait outline, corner radius 48. */
const FRAME = {x1: 440, y1: 95, x2: 760, y2: 755, radius: 48} as const;
/** How far the first (left) edge runs past where its corners begin: the overshoot a quick hand leaves. */
const EDGE_OVERSHOOT = 11;

const frameLeft = (): string =>
  roundedRun(
    [
      [FRAME.x1 + 0.8, FRAME.y2 - FRAME.radius + EDGE_OVERSHOOT],
      [FRAME.x1 - 0.6, (FRAME.y1 + FRAME.y2) / 2],
      [FRAME.x1 + 0.3, FRAME.y1 + FRAME.radius - EDGE_OVERSHOOT],
    ],
    11,
    {radius: 400, drift: 1.1, wobble: 0.35},
  );

const frameRest = (): string =>
  roundedRun(
    [
      [FRAME.x1 + 0.5, FRAME.y1 + FRAME.radius + 6],
      [FRAME.x1, FRAME.y1],
      [FRAME.x2 + 0.8, FRAME.y1 + 0.6],
      [FRAME.x2 - 0.4, FRAME.y2 + 0.5],
      [FRAME.x1 + 0.6, FRAME.y2 - 0.4],
      [FRAME.x1 - 0.8, FRAME.y2 - FRAME.radius - 9],
    ],
    12,
    {radius: FRAME.radius, drift: 1.0},
  );

const DEADLINE_ROWS = [330, 370, 410] as const;
const DEADLINE = {dotX: 480, dotR: 9, x1: 500, x2: 690} as const;
// The bell sits just past the end of the first deadline line (the bible's (700,330) centre would sit on the line's end).
const BELL = {cx: 711, cy: 330, w: 20, h: 22} as const;

const deadline = (y: number, i: number): Untimed =>
  stroke(
    `deadlines-${i + 1}`,
    joinPaths(handCircle(DEADLINE.dotX, y, DEADLINE.dotR, DEADLINE.dotR * 0.95, 30 + i), textLines(DEADLINE.x1, [[y, DEADLINE.x2 - i * 4]], 40 + i)),
    {width: W.text},
  );

const card = cardParts(
  {
    x1: 470,
    y1: 200,
    x2: 730,
    y2: 300,
    radius: 10,
    plus: [490, 218, 16],
    linesX: 520,
    // Same 520-700 measure as the bible; the last line of a paragraph runs short.
    rows: [
      [240, 700],
      [262, 694],
      [284, 646],
    ],
  },
  50,
);

const TICKS: readonly (readonly [id: string, at: XY, span: readonly [number, number]])[] = [
  ['tick-binder', [415, 152], F.tickBinder],
  ['tick-deadlines', [415, 372], F.tickDeadlines],
  ['tick-card', [415, 250], F.tickCard],
  ['tick-mail', [415, 492], F.tickMail],
  // 5 px right of the bible's (575,492) so the tick sits in the gap instead of touching the envelope's edge.
  ['tick-packets', [580, 492], F.tickPackets],
];

const groups: readonly Timed[] = [
  spread([stroke('frame-left', frameLeft(), {width: W.device, rough: true})], F.leftEdge, 0),
  spread([stroke('frame-rest', frameRest(), {width: W.device, rough: true})], F.outlineRest, 0),
  spread(
    [
      stroke('binder-tab', roundBox(470, 130, 600, 175, 10, 60), {width: W.ui}),
      label('binder-tab-label', 'Mom', 505, 163, {size: TYPE.label, face: 'patrick-400'}),
    ],
    F.binderTab,
  ),
  spread(
    [
      ...DEADLINE_ROWS.map(deadline),
      stroke('deadlines-bell', bellGlyph(BELL.cx, BELL.cy + BELL.h / 2, BELL.w, BELL.h, 70, 1.6), {width: W.text}),
    ],
    F.deadlines,
    0.08,
  ),
  spread(
    [
      stroke('card', card.outline, {width: W.ui}),
      stroke('card-plus', card.plus, {width: W.ui}),
      stroke('card-lines', card.lines, {width: W.text}),
    ],
    F.card,
    0.08,
  ),
  spread([stroke('mail', envelope(470, 460, 560, 520, 80), {width: W.ui})], F.mail, 0),
  spread([stroke('packets', folder(600, 452, 640, 460, 730, 520, 90), {width: W.ui})], F.packets, 0),
  ...TICKS.map(([id, [x, y], span], i) => spread([stroke(id, tickMark(x, y, 100 + i), {ink: 'accent', width: W.tick})], span, 0)),
];

export const spec: SketchSpec = page('v1-home', groups);

export const cues = makeCues(spec);

export const Sketch: React.FC<SketchProps> = ({drawFrames}) => <GraphiteSketch spec={spec} drawFrames={drawFrames} />;
