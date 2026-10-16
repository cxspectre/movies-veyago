// spec.ts — page 4, share the emergency card with family (BIBLE §4.5). The card in the middle, three family phones
// around it, dotted links out to each, and a padlock on the card, circled: it is encrypted before it leaves.
import {handCircle, handDottedLine, handLine, type SketchSpec} from '../../paper';
import {padlock, plus, roundedRect, textLines} from '../kit-b/glyphs';
import {checkSpec, STROKE_CAP} from '../kit-b/page';
import {accent, line, note, slots, WEIGHT} from '../kit-b/timed';

type Box = {readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number};

const CARD: Box & {r: number} = {x1: 480, y1: 330, x2: 720, y2: 520, r: 18};
const CARD_PLUS = {x: 496, y: 346, size: 16} as const;
/** The card's three text lines: a name beside the "+", a line under it, and a short one left of the lock. */
const CARD_LINES: readonly (readonly [number, number, number])[] = [
  [524, 355, 664],
  [496, 380, 696],
  [496, 402, 552],
];
const PHONES: readonly (Box & {id: string})[] = [
  {id: 'phone-left', x1: 150, y1: 300, x2: 290, y2: 560},
  {id: 'phone-right', x1: 910, y1: 300, x2: 1050, y2: 560},
  {id: 'phone-bottom', x1: 530, y1: 590, x2: 670, y2: 840},
];
const PHONE_R = 24;
/** The small island at the top of each phone's screen: what makes a rounded rectangle a phone at a glance. */
const ISLAND = {w: 30, inset: 16} as const;
/** Dotted links from the card's edges to each phone's nearest edge (left, right, bottom). */
const LINKS: readonly (readonly [number, number, number, number])[] = [
  [474, 426, 298, 432],
  [726, 426, 902, 432],
  [600, 527, 600, 583],
];
const LOCK = {cx: 600, bodyTop: 420, bodyBottom: 470, halfWidth: 30, shackleR: 22, hole: [600, 440] as const, holeR: 4} as const;
const RING = {cx: 600, cy: 442, r: 48} as const;

const phonePath = (p: Box, seed: number): string => {
  const cx = (p.x1 + p.x2) / 2;
  return [
    roundedRect(p.x1, p.y1, p.x2 - p.x1, p.y2 - p.y1, PHONE_R, seed, 8),
    handLine(cx - ISLAND.w / 2, p.y1 + ISLAND.inset, cx + ISLAND.w / 2, p.y1 + ISLAND.inset, seed + 1, {overshoot: 0.5, bow: 0.3}),
  ].join(' ');
};

const phoneStrokes = PHONES.map((p, i) => {
  const [from, to] = slots(0.26, 0.66, PHONES.length)[i] ?? [0.26, 0.66];
  return line(p.id, phonePath(p, 410 + i * 3), from, to, {width: WEIGHT.device, rough: true});
});

const linkStrokes = LINKS.map(([x1, y1, x2, y2], i) => {
  const [from, to] = slots(0.66, 0.76, LINKS.length)[i] ?? [0.66, 0.76];
  return line(`link-${i + 1}`, handDottedLine(x1, y1, x2, y2, 420 + i), from, to, {style: 'dotted', width: WEIGHT.dotted});
});

export const spec: SketchSpec = checkSpec(
  {
    id: 'share-card',
    strokes: [
      line('card', roundedRect(CARD.x1, CARD.y1, CARD.x2 - CARD.x1, CARD.y2 - CARD.y1, CARD.r, 401, 9), 0.0, 0.16, {
        width: WEIGHT.box,
        rough: true,
      }),
      line('card-plus', plus(CARD_PLUS.x, CARD_PLUS.y, CARD_PLUS.size, 402), 0.16, 0.19, {width: WEIGHT.box, pressure: 1.15}),
      line('card-lines', textLines(CARD_LINES, 403), 0.19, 0.26, {width: WEIGHT.text}),
      ...phoneStrokes,
      ...linkStrokes,
      line('lock', padlock(LOCK, 404), 0.76, 0.82, {width: WEIGHT.box}),
      accent('circle', handCircle(RING.cx, RING.cy, RING.r, RING.r * 0.95, 405), 0.82, 0.88),
    ],
    labels: [
      // One line at (120,760) would run into the bottom phone (x 530-670), so the note wraps onto two short lines.
      note('Encrypted before it\nleaves the phone.', 120, 760, -2, 0.9, 1.0),
    ],
  },
  STROKE_CAP,
);
