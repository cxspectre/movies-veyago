// layout.ts — where everything in chapter 2 sits (SHEET px) and the few local timings beats4 does not hold.
// Every beat time comes from `mayasHouse` in src/beats4.ts; this file only places things and derives from it.
//
// Placement notes (where this departs from BIBLE4 §5.2, and why):
// - The camera (sheet4.ts) shows y 3350-4550 until 28.0 and y 2618-4582 (wide, z 0.55) after the pull-back. The bible's
//   storm super (baseline y 3300) and tree super (y 2350) and the top of its tree (Dad at y 2650) fall outside those
//   frames, so the supers and the tree are moved down into view.
// - Sam's plane: the bible's (6400, 2900) is cut off in the tall frame (x 4320-6480 at z 0.5) once labelled; it sits
//   at (6110, 2880) instead.
// - Maya sits at the right end of the table (her `sit-A` faces left with her forearm on it), so Jonas and Maya swap
//   sides in the tree: the dotted branch to Sam leaves Maya's node on the right without crossing Jonas.
import type {Point} from '../../sheet4';
import {mayasHouse as B} from '../../beats4';
import {regionOrigin} from '../../kit';

const ORIGIN = regionOrigin('mayasHouse');
/** Sheet px -> region-local px (plain elements inside the chapter's region). */
export const local = (p: Point): [number, number] => [p[0] - ORIGIN[0], p[1] - ORIGIN[1]];

// The house: the outline chapter 1's line drew (BIBLE4 §1.3): ground y 4450, walls x 4860 / 5940, eaves y 3850,
// apex (5400, 3450). It becomes the back wall of a dollhouse whose floor, side walls and ceiling fold toward us.
export const HOUSE = {
  left: 4860,
  right: 5940,
  ground: 4450,
  eaves: 3850,
  apex: 3450,
  /** How far the floor, the side walls and the ceiling reach toward the viewer once folded. */
  depth: 280,
  /** The eye of the one-point perspective (sheet px) and its distance (px). */
  eye: [5400, 4150] as Point,
  perspective: 1200,
} as const;

// Maya at the table. Her sit-A forearm rests 153 px above her ground point, so the table top is there.
// C5: scaled 1.45 (line weight scales with it: 3.2 px) so she reads at the 0.55 working zoom; the forearm is 153 * 1.45 above the ground.
export const MAYA = {ground: [5600, 4450] as Point, scale: 1.45} as const;
export const TABLE = {x: 4880, w: 680, top: 4228, ground: 4450} as const;

export type PaperId = 'form' | 'passportB' | 'passportA' | 'box' | 'registration' | 'insurance' | 'letterB' | 'letterA';
export type FlyingId = Exclude<PaperId, 'box'>;
export type TreeNodeId = 'dad' | 'jonas' | 'maya' | 'leo' | 'mia' | 'biscuit';

export type Cutout = {
  readonly id: PaperId;
  /** Bottom-left on the table (sheet px) and size. */
  readonly x: number;
  readonly w: number;
  readonly h: number;
  /** Seconds the card stands up (a `fold`), and the lean it settles at (deg; negative leans back). */
  readonly pop: number;
  readonly lean: number;
};

/** The table and five cutouts pop up across `B.cutouts` (0.4 s each, staggered so the last ends at its end). */
const popStart = (i: number): number => B.cutouts.from + (i * (B.cutouts.to - B.cutouts.from - B.cutouts.each)) / 5;
export const TABLE_POP = popStart(0);
/** Draw order: back to front (the second passport and letter stand behind the first). */
export const CUTOUTS: readonly Cutout[] = [
  {id: 'form', x: 4900, w: 92, h: 118, pop: popStart(1), lean: -6},
  {id: 'passportB', x: 5024, w: 76, h: 100, pop: popStart(2) + 0.08, lean: -9},
  {id: 'passportA', x: 5004, w: 76, h: 100, pop: popStart(2), lean: -3},
  {id: 'box', x: 5112, w: 140, h: 96, pop: popStart(3), lean: 0},
  {id: 'insurance', x: 5262, w: 100, h: 64, pop: popStart(4), lean: -4},
  {id: 'letterB', x: 5356, w: 92, h: 72, pop: popStart(5) + 0.08, lean: -10},
  {id: 'letterA', x: 5338, w: 96, h: 66, pop: popStart(5), lean: -2},
];
/** Sam's car registration waits inside the box until it flies (BIBLE4 5.2: "out of the box"). */
export const REGISTRATION = {w: 84, h: 56} as const;

const fly = (paper: string): number => {
  const f = B.papersFly.find((p) => p.paper === paper);
  if (!f) throw new Error(`mayasHouse: no flight for ${paper}`);
  return f.lift;
};
/** The letters and the form lift unlabelled across 18.0-20.0 (BIBLE4 5.2; beats4 holds only the labelled three). */
const UNLABELLED = {from: 18.0, to: 20.0} as const;

export type Flight = {
  readonly id: FlyingId;
  readonly lift: number;
  /** Where it hovers until the storm (sheet px, centre) and its tilt there. */
  readonly hover: Point;
  readonly tilt: number;
  /** Where the storm's freeze sends it: a tree node, or Sam's plane. */
  readonly to: TreeNodeId | 'plane';
};
export const FLIGHTS: readonly Flight[] = [
  {id: 'insurance', lift: fly('insurance card'), hover: [5150, 3760], tilt: -8, to: 'dad'},
  {id: 'passportA', lift: fly('passports'), hover: [5640, 3800], tilt: 10, to: 'leo'},
  {id: 'passportB', lift: fly('passports') + 0.25, hover: [5760, 3930], tilt: -6, to: 'mia'},
  {id: 'registration', lift: fly('car registration'), hover: [5020, 3930], tilt: 6, to: 'plane'},
  {id: 'letterA', lift: UNLABELLED.from, hover: [5330, 3640], tilt: 4, to: 'maya'},
  {id: 'letterB', lift: UNLABELLED.from + 0.6, hover: [5560, 3630], tilt: -12, to: 'jonas'},
  {id: 'form', lift: UNLABELLED.from + 1.2, hover: [4980, 3700], tilt: -4, to: 'biscuit'},
];
/** Seconds a paper takes from the table to its hover spot. */
export const LIFT_SECONDS = 1.2;

/** The storm: an orbit around Maya (the bible's centre is (5400, 3900); she sits a little lower and to the right). */
export const STORM = {centre: [5420, 3990] as Point, squash: 0.42, blendIn: 1.0} as const;

// The family tree (sheet px): circles r 55 and labels below; Biscuit's node is a kennel.
export const NODE_R = 70;
export type TreeNode = {readonly id: TreeNodeId; readonly label: string; readonly at: Point; readonly character: 'dad' | 'jonas' | 'maya' | 'leo' | 'mia' | 'biscuit'};
export const TREE: readonly TreeNode[] = [
  {id: 'dad', label: 'Dad', at: [5400, 2900], character: 'dad'},
  {id: 'jonas', label: 'Jonas', at: [5040, 3090], character: 'jonas'},
  {id: 'maya', label: 'Maya', at: [5760, 3090], character: 'maya'},
  {id: 'leo', label: 'Leo', at: [4900, 3300], character: 'leo'},
  {id: 'mia', label: 'Mia', at: [5400, 3300], character: 'mia'},
  {id: 'biscuit', label: 'Biscuit', at: [5900, 3300], character: 'biscuit'},
];
/** The order the papers fly to the tree (B.tree.stagger apart), and how long each flight takes (a keynote move). */
export const TREE_ORDER: readonly TreeNodeId[] = B.tree.nodes.map((n) => n.toLowerCase() as TreeNodeId);
export const TREE_FLIGHT = 1.0;
export const treeFlightStart = (id: TreeNodeId): number => B.tree.from + TREE_ORDER.indexOf(id) * B.tree.stagger;
export const treeLand = (id: TreeNodeId): number => treeFlightStart(id) + TREE_FLIGHT;
/** The connecting lines draw once the last node has landed, by the end of the tree window. */
export const TREE_LINES = {from: Math.max(...TREE_ORDER.map(treeLand)), to: B.tree.to - 0.5} as const;

/** Sam's plane: where it folds (sheet px), its heading (deg), the label under it, and its size against the registration (1.6: about 130 px, so it reads at z 0.55). */
export const PLANE = {at: [6270, 2860] as Point, heading: -14, label: 'Sam, Lisbon', fold: 0.8, scale: 1.6} as const;
/** The registration rides the dotted branch out to the plane while the branch draws. */
export const REG_TO_PLANE = {from: B.branch.from, to: B.plane} as const;

/** The supers (sheet anchors). */
export const SUPER_STORM_AT: Point = [5400, 3440];
export const SUPER_TREE_AT: Point = [5400, 2740];
export const SUPER_TREE_WIDTH = 1240;

/** Maya's pose swaps: into sit-B as the storm starts; back to sit-A after the one-beat rest of the freeze. */
export const SWAP_SECONDS = 0.5;
export const SWAP_TO_B = B.storm.from;
export const SWAP_TO_A = B.freeze + 1.0;
/** The boil: 0.5 px at rest, rising to the storm's 3 px (BIBLE4 §4: 0.6 → 3). */
export const BOIL_REST = 0.5;
export const BOIL_STORM = {from: 0.6, to: 3} as const;
