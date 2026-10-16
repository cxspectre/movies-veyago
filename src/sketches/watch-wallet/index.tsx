// watch-wallet — "What if the card were on her wrist?" (page 2, BIBLE 4.3). A watch with the emergency card on its
// face, a stack of Wallet cards with the card on top, an accent arrow from the wrist to the wallet, the note.
import React from 'react';
import {GraphiteSketch, label, stroke, type SketchProps, type SketchSpec} from '../../paper';
import {cardParts, curvedArrow, joinPaths, makeCues, page, plusSign, roundBox, spread, textLines, TYPE, W, type Span, type Timed} from '../v1-home/kit';
import {bandHatch, crown, peekingCard, strap, strapWithHoles} from './parts';

/** Stroke-order fractions (BIBLE 4.3). */
export const WATCH_WALLET_FRACTIONS = {
  case: [0.0, 0.18],
  straps: [0.18, 0.26],
  crown: [0.26, 0.28],
  cardFace: [0.28, 0.46],
  cardFaceLines: [0.46, 0.52],
  walletBase: [0.52, 0.68],
  walletTop: [0.68, 0.8],
  arrow: [0.8, 0.88],
  note: [0.9, 1.0],
} as const satisfies Record<string, Span>;
const F = WATCH_WALLET_FRACTIONS;

const CASE = {x1: 150, y1: 250, x2: 380, y2: 520, radius: 60} as const;
const STRAP = {x1: 205, x2: 325, top: 180, bottom: 590, radius: 20} as const;
const FACE = {x1: 185, y1: 300, x2: 345, y2: 470, radius: 12, stripBottom: 330} as const;
const CARD_RADIUS = 24;
/** The top Wallet card repeats the face's hatched header band, so it reads as the same card. */
const TOP_BAND = {x1: 806, x2: 1066, y1: 272, y2: 326, flicks: 8} as const;
const BASE_1 = {x1: 700, y1: 330, x2: 1040, y2: 540} as const;
const BASE_2 = {x1: 720, y1: 300, x2: 1060, y2: 510} as const;

const faceOutline = joinPaths(
  roundBox(FACE.x1, FACE.y1, FACE.x2, FACE.y2, FACE.radius, 21),
  // the bottom of the card's header band
  textLines(FACE.x1 + 1, [[FACE.stripBottom, FACE.x2 - 1]], 22),
);

const topCard = cardParts(
  {
    x1: 740,
    y1: 270,
    x2: 1080,
    y2: 480,
    radius: CARD_RADIUS,
    plus: [762, 286, 24],
    linesX: 764,
    rows: [
      [372, 1040],
      [408, 1028],
      [444, 940],
    ],
  },
  60,
);

// The arrow leaves the watch just past its case and lands just short of the stack (the bible's (360,390) and
// (730,390) would sit on the case outline and on the stack's edges).
const arrow = curvedArrow(
  [
    [398, 386],
    [470, 336],
    [560, 316],
    [640, 330],
    [690, 372],
  ],
  70,
  22,
);

const groups: readonly Timed[] = [
  spread([stroke('watch-case', roundBox(CASE.x1, CASE.y1, CASE.x2, CASE.y2, CASE.radius, 11), {width: W.device, rough: true})], F.case, 0),
  spread(
    [
      stroke('watch-strap-top', strap(STRAP.x1, STRAP.x2, CASE.y1 + 2, STRAP.top, STRAP.radius, 12), {width: W.ui}),
      stroke('watch-strap-bottom', strapWithHoles(STRAP.x1, STRAP.x2, CASE.y2 - 2, STRAP.bottom, STRAP.radius, 13), {width: W.ui}),
    ],
    F.straps,
    0.06,
  ),
  spread([stroke('watch-crown', crown(CASE.x2, 320, 12, 26, 14), {width: W.ui})], F.crown, 0),
  spread(
    [
      stroke('card-face', faceOutline, {width: W.ui}),
      stroke('card-face-plus', plusSign(200, 315, 14, 25), {width: W.ui}),
      stroke('card-face-hatch', bandHatch(222, 342, FACE.y1, FACE.stripBottom, 6, 23), {width: W.hatch, pressure: 0.75}),
    ],
    F.cardFace,
    0.06,
  ),
  spread(
    [
      stroke(
        'card-face-lines',
        textLines(
          200,
          [
            [350, 320],
            [380, 312],
            [410, 320],
            [440, 276],
          ],
          24,
        ),
        {width: W.text},
      ),
    ],
    F.cardFaceLines,
    0,
  ),
  spread(
    [
      stroke('wallet-base-1', peekingCard(BASE_1.x1, BASE_1.y1, BASE_1.x2, BASE_1.y2, BASE_2.x1 - BASE_1.x1, BASE_2.y2 - BASE_1.y2, CARD_RADIUS, 31), {width: W.ui}),
      stroke('wallet-base-2', peekingCard(BASE_2.x1, BASE_2.y1, BASE_2.x2, BASE_2.y2, 740 - BASE_2.x1, 480 - BASE_2.y2, CARD_RADIUS, 32), {width: W.ui}),
    ],
    F.walletBase,
    0.06,
  ),
  spread(
    [
      stroke('wallet-top', joinPaths(topCard.outline, textLines(742, [[TOP_BAND.y2, 1078]], 61)), {width: W.ui, rough: true}),
      stroke('wallet-top-plus', topCard.plus, {width: W.ui}),
      stroke('wallet-top-hatch', bandHatch(TOP_BAND.x1, TOP_BAND.x2, TOP_BAND.y1, TOP_BAND.y2, TOP_BAND.flicks, 62), {width: W.hatch, pressure: 0.75}),
      stroke('wallet-top-lines', topCard.lines, {width: W.text}),
    ],
    F.walletTop,
    0.06,
  ),
  spread([stroke('arrow', arrow.shaft, {ink: 'accent', width: W.accent}), stroke('arrow-head', arrow.head, {ink: 'accent', width: W.accent})], F.arrow, 0.05),
  spread([label('note', 'What if the card were on her wrist?', 120, 700, {ink: 'accent', size: TYPE.noteLong, rotate: -1.5})], F.note, 0),
];

export const spec: SketchSpec = page('watch-wallet', groups);

export const cues = makeCues(spec);

export const Sketch: React.FC<SketchProps> = ({drawFrames}) => <GraphiteSketch spec={spec} drawFrames={drawFrames} />;
