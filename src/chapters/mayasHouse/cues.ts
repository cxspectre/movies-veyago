// cues.ts — chapter 2's complete foley list (module-local seconds), from BIBLE4 5.2 and 7.2-7.4.
// The freeze (28.0-29.0) is a protected silence: nothing here sounds inside it.
import type {Cue, ModuleCues} from '../../audio/cues';
import {mayasHouse as B, SUPERS} from '../../beats4';
import {superCues, superFromBeat} from '../../kit';
import {CUTOUTS, FLIGHTS, LIFT_SECONDS, REG_TO_PLANE, SUPER_STORM_AT, SUPER_TREE_AT, SUPER_TREE_WIDTH, SWAP_SECONDS, SWAP_TO_A, SWAP_TO_B, TABLE_POP, TREE, TREE_FLIGHT, treeFlightStart} from './layout';
import {TREE_STROKE_WINDOWS} from './tree';

const r3 = (n: number): number => Math.round(n * 1000) / 1000;
const pan = (x: number): number => r3(Math.max(-0.6, Math.min(0.6, (x - 5400) / 900)));

// the house folds up (one long card fold), then the table and each cutout snaps up (pairs share one fold)
const folds: Cue[] = [
  {kind: 'hit', t: B.popUp.from, name: 'fold', dur: B.popUp.to - B.popUp.from},
  {kind: 'hit', t: r3(TABLE_POP), name: 'fold', dur: B.cutouts.each, gain: 0.8},
  // the second passport and the second letter stand up with the first (one fold each pair)
  ...CUTOUTS.filter((c) => !c.id.endsWith('B')).map((c): Cue => ({kind: 'hit', t: r3(c.pop), name: 'fold', dur: B.cutouts.each, gain: 0.7})),
];

// Maya draws in, and her two pose swaps (short pencil strokes)
const maya: Cue[] = [
  {kind: 'stroke', t: B.mayaDraws.from, dur: B.mayaDraws.to - B.mayaDraws.from, pressure: 0.8},
  {kind: 'stroke', t: SWAP_TO_B, dur: SWAP_SECONDS, pressure: 0.6},
  {kind: 'stroke', t: SWAP_TO_A, dur: SWAP_SECONDS, pressure: 0.6},
];

// each paper lifts with a soft flutter; the storm is a run of overlapping flutters that stops dead at the freeze
const flutters: Cue[] = FLIGHTS.map((f) => ({kind: 'slide', t: r3(f.lift), dur: LIFT_SECONDS, pan: pan(f.hover[0])}));
const STORM_STEP = 0.75;
const storm: Cue[] = Array.from({length: Math.round((B.storm.to - B.storm.from) / STORM_STEP)}, (_, i) => {
  const t = r3(B.storm.from + i * STORM_STEP);
  return {kind: 'slide', t, dur: Math.min(1.0, B.freeze - t), pan: i % 2 === 0 ? -0.35 : 0.35};
});

// after the rest: the papers fly to the tree (soft slides), the tree draws, the branch, the plane
const tree: Cue[] = [
  // (a flight that starts inside the one-beat rest after the freeze is silent: BIBLE4 7.2)
  ...TREE.filter((n) => treeFlightStart(n.id) >= B.freeze + 1.0).map((n): Cue => ({kind: 'slide', t: r3(treeFlightStart(n.id)), dur: TREE_FLIGHT, pan: pan(n.at[0])})),
  ...TREE_STROKE_WINDOWS.map((w): Cue => ({kind: 'stroke', t: r3(w.t), dur: r3(w.dur), pressure: 0.8})),
  {kind: 'stroke', t: B.branch.from, dur: B.plane - B.branch.from, pressure: 0.55},
  {kind: 'slide', t: REG_TO_PLANE.from, dur: REG_TO_PLANE.to - REG_TO_PLANE.from, pan: 0.4},
  {kind: 'hit', t: B.plane, name: 'fold', dur: 0.8, gain: 0.6, pan: 0.5},
  {kind: 'hit', t: B.plane + 0.3, name: 'plane', dur: 0.8, pan: 0.5},
];

// the supers are written by the pencil
const supers: Cue[] = [
  ...(SUPERS.mayasHouse[0] ? superCues(superFromBeat(SUPERS.mayasHouse[0], {sheet: SUPER_STORM_AT, align: 'centre'})) : []),
  ...(SUPERS.mayasHouse[1] ? superCues(superFromBeat(SUPERS.mayasHouse[1], {sheet: SUPER_TREE_AT, align: 'centre'}, {maxWidth: SUPER_TREE_WIDTH})) : []),
];

// the line leaves the house for the next region
const line: Cue[] = [{kind: 'stroke', t: B.lineLeaves.from, dur: B.lineLeaves.to - B.lineLeaves.from, pressure: 1.0}];

export const cues: ModuleCues = [...folds, ...maya, ...flutters, ...storm, ...tree, ...supers, ...line].sort((a, b) => a.t - b.t);
