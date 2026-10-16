// family-tabs — "Mom isn't the only one." (page 1, BIBLE 4.2). A ruled shelf, a row of binder tabs (Mom, Dad, Me, a
// child, a dog, a dotted add tab), an accent arrow over the row and the margin note. The one on-camera erase: a
// too-small first "Dad" tab is drawn light, rubbed out (ghost to 10%), and its crumbs stay on the sheet.
import React from 'react';
import {handPath, label, stroke, type SketchProps, type SketchSpec, type Untimed} from '../../paper';
import type {StrokeSpec} from '../../paper/types';
import {curvedArrow, fractionToSeconds, makeCues, page, plusSign, roundBox, spread, TYPE, W, type Timed} from '../v1-home/kit';
import {FamilyTabsPage} from './FamilyTabsPage';
import {FAMILY_TABS_FRACTIONS} from './layout';
import {childFigure, dogFigure} from './figures';

const F = FAMILY_TABS_FRACTIONS;

const TAB = {y1: 150, y2: 220, radius: 14, labelY: 197, labelSize: 34} as const;
const SHELF_Y = 240;
/** The ghost is drawn as a light construction line (it reads at about 35% of a confident line). */
const GHOST_PRESSURE = 0.62;

const tab = (id: string, x1: number, x2: number, seed: number, rough = false): Untimed =>
  stroke(id, roundBox(x1, TAB.y1, x2, TAB.y2, TAB.radius, seed), {width: W.ui, rough});

const tabLabel = (id: string, text: string, x: number): Untimed =>
  label(`${id}-label`, text, x, TAB.labelY, {size: TAB.labelSize, face: 'patrick-400'});

// The shelf is ruled: straight, 0.2 px wobble, a hair of overshoot at both ends.
const shelf = handPath(
  [
    [77, SHELF_Y + 0.3],
    [600, SHELF_Y - 0.2],
    [1123, SHELF_Y + 0.4],
  ],
  1,
  {wobble: 0.2},
);

const arrow = curvedArrow(
  [
    [110, 120],
    [300, 82],
    [560, 70],
    [820, 80],
    [1040, 118],
  ],
  91,
  22,
);

/** The too-small first attempt at the Dad tab (drawn and erased by its own layer; heard, not part of `spec`). */
export const GHOST: StrokeSpec = {
  id: 'tabs-dad-ghost',
  d: roundBox(300, 160, 420, 210, 12, 33),
  ink: 'graphite',
  width: W.ui,
  pressure: GHOST_PRESSURE,
  from: F.ghost[0],
  to: F.ghost[1],
};

const groups: readonly Timed[] = [
  spread([stroke('shelf', shelf, {width: W.ui})], F.shelf, 0),
  spread([tab('tabs-mom', 90, 240, 11, true), tabLabel('tabs-mom', 'Mom', 128)], F.mom),
  spread([tab('tabs-dad', 300, 450, 12), tabLabel('tabs-dad', 'Dad', 343)], F.dad),
  spread([tab('tabs-me', 510, 660, 13), tabLabel('tabs-me', 'Me', 560)], F.me),
  spread([tab('tabs-child', 720, 870, 14), stroke('tabs-child-figure', childFigure(41), {width: 1.8})], F.child, 0.08),
  spread([tab('tabs-dog', 930, 1080, 15), stroke('tabs-dog-figure', dogFigure(51), {width: 1.8})], F.dog, 0.08),
  spread(
    [
      stroke('tabs-add', roundBox(1100, 165, 1150, 205, 10, 16, {overshoot: 0}), {width: W.dotted, style: 'dotted'}),
      stroke('tabs-add-plus', plusSign(1115, 175, 20, 17), {width: W.text}),
    ],
    F.add,
    0.08,
  ),
  spread([stroke('arrow', arrow.shaft, {ink: 'accent', width: W.accent}), stroke('arrow-head', arrow.head, {ink: 'accent', width: W.accent})], F.arrow, 0.05),
  spread([label('note', "Mom isn't the only one.", 560, 420, {ink: 'accent', size: TYPE.note, rotate: -2})], F.note, 0),
];

export const spec: SketchSpec = page('family-tabs', groups);

export const cues = makeCues(
  spec,
  (drawFrames) => [
    {kind: 'erase', t: fractionToSeconds(F.erase[0], drawFrames), dur: fractionToSeconds(F.erase[1] - F.erase[0], drawFrames)},
  ],
  [GHOST],
);

export {CRUMBS, FAMILY_TABS_FRACTIONS} from './layout';

export const Sketch: React.FC<SketchProps> = ({drawFrames}) => <FamilyTabsPage spec={spec} ghost={GHOST} drawFrames={drawFrames} />;
