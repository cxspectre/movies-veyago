// parts.ts — the watch (case, straps, crown, the card on its face) and the wallet stack (two cards peeking out
// under the top one, drawn as the visible L of each edge, the way a sketcher draws a stack). BIBLE 4.3 coordinates.
import {handCircle, handLine, type XY} from '../../paper';
import {hashSigned} from '../../paper/geometry/noise';
import {joinPaths, roundedRun} from '../v1-home/kit';

/** How much a strap narrows from the case to its end, each side (bands taper). */
const STRAP_TAPER = 6;

/** A strap leaving the case: up (or down) from the case edge, round the end, back to the case. Open at the case. */
export const strap = (x1: number, x2: number, caseY: number, endY: number, radius: number, seed: number): string => {
  const inset = 0.5;
  return roundedRun(
    [
      [x1 + inset, caseY],
      [x1 + STRAP_TAPER - 0.5, endY],
      [x2 - STRAP_TAPER + 0.6, endY + hashSigned(seed, 1) * 1.2],
      [x2 - inset, caseY + (endY > caseY ? -1 : 1)],
    ],
    seed,
    {radius, wobble: 0.4},
  );
};

/** The bottom strap with two buckle holes, so the band reads as a watch band. */
export const strapWithHoles = (x1: number, x2: number, caseY: number, endY: number, radius: number, seed: number): string => {
  const cx = (x1 + x2) / 2;
  const holes = [0.45, 0.72].map((t, i) => handCircle(cx + hashSigned(seed, i) * 0.8, caseY + (endY - caseY) * t, 3.2, 3, seed + 5 + i, {overlap: 0.15}));
  return joinPaths(strap(x1, x2, caseY, endY, radius, seed), ...holes);
};

/** The crown: a small button standing off the case's right edge. */
export const crown = (x: number, y: number, w: number, h: number, seed: number): string =>
  roundedRun(
    [
      [x - 0.5, y + 1],
      [x + w, y - 0.4],
      [x + w + 0.4, y + h],
      [x - 0.8, y + h + 0.5],
    ],
    seed,
    {radius: 3.5, wobble: 0.25},
  );

/** Short diagonal flicks across a band (the hatched header strip of the card), left to right. */
export const bandHatch = (x1: number, x2: number, y1: number, y2: number, count: number, seed: number): string => {
  const step = (x2 - x1) / count;
  const lean = (y2 - y1) * 0.55;
  return joinPaths(
    ...Array.from({length: count}, (_, i) => {
      const x = x1 + step * (i + 0.5) + hashSigned(seed, i) * 1.5;
      return handLine(x - lean / 2, y2 - 2, x + lean / 2, y1 + 2, seed + i * 3, {overshoot: 0.5, bow: 0.3, wobble: 0.2});
    }),
  );
};

/**
 * The visible part of a card lying under another card offset up-right by (dx, dy): its top edge up to where the upper
 * card begins, round the top-left corner, down the left side, along the bottom, up the right side to the upper card.
 */
export const peekingCard = (x1: number, y1: number, x2: number, y2: number, dx: number, dy: number, radius: number, seed: number): string => {
  const pts: readonly XY[] = [
    [x1 + dx + 4, y1 + 0.4],
    [x1, y1],
    [x1 - 0.6, y2 + 0.5],
    [x2 + 0.5, y2 - 0.3],
    [x2 + 0.2, y2 + dy - 4],
  ];
  return roundedRun(pts, seed, {radius, wobble: 0.4});
};
