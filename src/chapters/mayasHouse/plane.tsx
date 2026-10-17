// plane.tsx — Sam's paper plane: a four-panel pop-up net (data), folded from the car registration once it arrives at
// the end of the dotted branch. Net: a flat sheet REGISTRATION-sized, nose to the right; two keel strips along the
// centre crease and two wings. The right keel folds back under the left (the keel's V), the right wing swings back
// out on it, and both wings take a little dihedral toward the viewer.
import React from 'react';
import {Drawing, Ink, Line, type PopUpSpec} from '../../popup';
import {PLANE, REGISTRATION} from './layout';
import {mayasHouse as B} from '../../beats4';

const {w, h} = REGISTRATION;
const KEEL = 6;
const WING = (h - 2 * KEEL) / 2;
const start = B.plane;
const end = B.plane + PLANE.fold;
const keys = (to: number, delay = 0) => [
  {t: start + delay, a: 0},
  {t: end, a: to, spring: 0.08},
];

export const PAPER_PLANE: PopUpSpec = {
  id: 'mayasHouse-plane',
  size: {w, h},
  panels: [
    {id: 'keelL', rect: {x: 0, y: WING, w, h: KEEL}, clip: [[0, 0], [100, 50], [0, 100]]},
    {id: 'wingL', parent: 'keelL', hinge: 'bottom', rect: {x: 0, y: 0, w, h: WING}, clip: [[0, 0], [100, 100], [0, 100]], angle: keys(24, 0.25)},
    {id: 'keelR', parent: 'keelL', hinge: 'top', rect: {x: 0, y: WING + KEEL, w, h: KEEL}, clip: [[0, 0], [100, 50], [0, 100]], angle: keys(-150)},
    {id: 'wingR', parent: 'keelR', hinge: 'top', rect: {x: 0, y: WING + 2 * KEEL, w, h: WING}, clip: [[0, 0], [100, 0], [0, 100]], angle: keys(170, 0.1)},
  ],
};

/** The crease lines and the edge of each wing (net coordinates). */
export const PlaneArt: React.FC = () => (
  <Drawing w={w} h={h}>
    <Line x1={1} y1={WING} x2={w - 1} y2={h / 2} seed={701} width={1.1} />
    <Line x1={1} y1={WING + 2 * KEEL} x2={w - 1} y2={h / 2} seed={702} width={1.1} />
    <Ink d={`M 2 ${WING * 0.45} L ${w * 0.55} ${WING * 0.78}`} width={0.9} />
    <Ink d={`M 2 ${h - WING * 0.45} L ${w * 0.55} ${h - WING * 0.78}`} width={0.9} />
  </Drawing>
);
