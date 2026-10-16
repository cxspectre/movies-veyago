// spec.ts — the page as data: every group's pieces, timed into its window of BINDER_HOME_V2_FRACTIONS.
import {BINDER_HOME_V2_FRACTIONS as F} from '../../beats';
import {label, sequence, type LabelSpec, type SketchSpec, type StrokeSpec} from '../../paper';
import {cardPieces} from './partsCard';
import {chipOnePieces, chipTwoPieces, circlePieces, tabBarPieces} from './partsBottom';
import {dockPieces, laterPieces} from './partsLater';
import {framePieces, topBarPieces} from './partsTop';
import type {Piece} from './pen';

export const SKETCH_ID = 'binder-home-v2';

/** The corner "2" (BIBLE §4.14): Caveat 700, 72, accent, baseline (1110,120), -6°. The film's first "2". */
const TWO = {x: 1110, y: 120, size: 72, rotate: -6} as const;
/** Pause between items, as a fraction of each window (the hand lifts, looks, lands). */
const GAP = 0.12;

const twoPieces = (): readonly Piece[] => [{item: label('two', '2', TWO.x, TWO.y, {ink: 'accent', size: TWO.size, rotate: TWO.rotate, face: 'caveat-700'})}];

type Window = readonly [number, number];

/** Every group in drawing order, with its window. The tab bar draws with the dock (the sheet's bottom edge). */
export const GROUP_WINDOWS: readonly {readonly pieces: () => readonly Piece[]; readonly window: Window}[] = [
  {pieces: framePieces, window: F.frame},
  {pieces: topBarPieces, window: F.tabs},
  {pieces: cardPieces, window: F.card},
  {pieces: laterPieces, window: F.deadlines},
  {pieces: () => [...dockPieces(), ...tabBarPieces()], window: F.dock},
  {pieces: twoPieces, window: F.two},
  {pieces: chipOnePieces, window: F.chipOne},
  {pieces: chipTwoPieces, window: F.chipTwo},
  {pieces: circlePieces, window: F.circle},
];

/** All pieces (with their real-screen targets) in drawing order: what alignment.ts measures. */
export const PIECES: readonly Piece[] = GROUP_WINDOWS.flatMap((g) => g.pieces());

const timed = GROUP_WINDOWS.map((g) => sequence(g.pieces().map((p) => p.item), g.window[0], g.window[1], GAP));

const strokes: readonly StrokeSpec[] = timed.flatMap((t) => t.strokes);
const labels: readonly LabelSpec[] = timed.flatMap((t) => t.labels);

export const spec: SketchSpec = {id: SKETCH_ID, strokes, labels};
