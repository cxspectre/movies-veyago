// figures.ts — the two small drawings inside the tabs: a child (big head, a curl of hair, arms out) and a dog in
// profile facing right (bean body, round head, floppy ear, snout, four legs, a tail up). BIBLE 4.2 coordinates.
import {handCircle, handLine, handPath} from '../../paper';
import {dot, joinPaths} from '../v1-home/kit';

/** Child stick figure: head r 10 at (795,172), body to 205, arms at 190, legs to (786,215) / (804,215). */
export const childFigure = (seed: number): string =>
  joinPaths(
    handCircle(795, 172, 10, 10.4, seed, {overlap: 0.08, startAngle: -120}),
    // a curl of hair on the crown: what makes a small figure read as a child
    handPath(
      [
        [792, 162.5],
        [794, 157.5],
        [798.5, 157],
        [798.5, 160.5],
        [795.5, 160.8],
      ],
      seed + 1,
      {wobble: 0.15},
    ),
    handLine(795.4, 182.5, 794.8, 205, seed + 2, {overshoot: 0.4, bow: 0.5}),
    handLine(780, 188, 810, 187.5, seed + 3, {overshoot: 0.6, bow: -1.2}),
    handLine(795, 205, 786, 215.5, seed + 4, {overshoot: 0.3, bow: 0.3}),
    handLine(795, 205, 804.5, 215, seed + 5, {overshoot: 0.3, bow: -0.3}),
  );

/** Dog: a 60x26 body centred (1005,190), head r 9 at (1040,180), four 10 px legs and a tail. */
export const dogFigure = (seed: number): string =>
  joinPaths(
    // body: a bean, the back a touch flatter than the belly, drawn from the rump round the chest and back
    handPath(
      [
        [978, 186],
        [986, 178.5],
        [1005, 177],
        [1024, 178],
        [1033, 184],
        [1034, 194],
        [1024, 202.5],
        [1005, 203.5],
        [985, 202.5],
        [975.5, 195],
        [977.5, 185.5],
        [982, 181],
      ],
      seed,
      {wobble: 0.35},
    ),
    handCircle(1040, 180, 9, 8.6, seed + 1, {overlap: 0.06, startAngle: -60}),
    // snout and nose: a short muzzle forward off the head, a dot on the end
    handPath(
      [
        [1047.5, 176.5],
        [1053.5, 178.5],
        [1054, 183],
        [1047, 185.5],
      ],
      seed + 2,
      {wobble: 0.15},
    ),
    dot(1054.2, 178.6, 1.6, seed + 3),
    // floppy ear: from the crown, hanging down the back of the head past the jaw
    handPath(
      [
        [1036.5, 172.5],
        [1031.5, 175],
        [1029.5, 183],
        [1031.5, 190.5],
        [1035, 189],
        [1037.5, 180],
      ],
      seed + 4,
      {wobble: 0.15},
    ),
    // legs: hind pair under the rump, front pair under the chest; each a quick down-stroke with a toe flick
    ...[984, 992, 1019, 1027].map((x, i) =>
      handPath(
        [
          [x, 200.5],
          [x + (i % 2 === 0 ? -0.6 : 0.4), 207],
          [x + 0.2, 211.5],
          [x + 2.6, 212],
        ],
        seed + 5 + i,
        {wobble: 0.15},
      ),
    ),
    // tail: up and back from the rump, a little curve at the tip
    handPath(
      [
        [977, 185],
        [970.5, 179],
        [967.5, 171],
        [970.5, 166.5],
      ],
      seed + 9,
      {wobble: 0.2},
    ),
  );
