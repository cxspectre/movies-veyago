// supers.ts — chapter 5's six supers as kit props, shared by the art and the cues so they cannot drift apart.
import {SUPERS} from '../../beats4';
import {superFromBeat, type SuperProps} from '../../kit';
import {layoutFor, type Layout} from './layout';

const list = SUPERS.researchBoard;
const at = (i: number): (typeof list)[number] => {
  const s = list[i];
  if (!s) throw new Error(`researchBoard: super ${i} missing`);
  return s;
};

/** The four card supers sit under their cards (accent, MAKER speaks); the gap and the blocks sit under the board. */
const supersFor = (L: Layout): readonly SuperProps[] => [
  ...L.superAt.map((p, i) => superFromBeat(at(i), {sheet: [p[0], p[1]], align: L.superAlign}, {size: L.superSize, maxWidth: L.superMaxWidth, write: 1.5})),
  superFromBeat(at(4), {sheet: [L.gapSuperAt[0], L.gapSuperAt[1]], align: 'centre'}, {size: 46, maxWidth: L.tall ? 1200 : undefined}),
  superFromBeat(at(5), {sheet: [L.blocksSuperAt[0], L.blocksSuperAt[1]], align: 'centre'}, {size: 46, maxWidth: L.tall ? 1200 : undefined}),
];

export const BOARD_SUPERS: readonly SuperProps[] = supersFor(layoutFor(false));
export const BOARD_SUPERS_TALL: readonly SuperProps[] = supersFor(layoutFor(true));
