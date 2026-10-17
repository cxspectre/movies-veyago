// supers.ts — chapter 5's six supers as kit props, shared by the art and the cues so they cannot drift apart.
import {SUPERS} from '../../beats4';
import {superFromBeat, type SuperProps} from '../../kit';
import {BLOCKS_SUPER_AT, GAP_SUPER_AT, SUPER_AT} from './layout';

const list = SUPERS.researchBoard;
const at = (i: number): (typeof list)[number] => {
  const s = list[i];
  if (!s) throw new Error(`researchBoard: super ${i} missing`);
  return s;
};

/** The four card supers sit under their cards (accent, MAKER speaks); the gap and the blocks sit under the board. */
export const BOARD_SUPERS: readonly SuperProps[] = [
  ...SUPER_AT.map((p, i) => superFromBeat(at(i), {sheet: [p[0], p[1]], align: 'left'}, {size: 42, maxWidth: 560, write: 1.5})),
  superFromBeat(at(4), {sheet: [GAP_SUPER_AT[0], GAP_SUPER_AT[1]], align: 'centre'}, {size: 46}),
  superFromBeat(at(5), {sheet: [BLOCKS_SUPER_AT[0], BLOCKS_SUPER_AT[1]], align: 'centre'}, {size: 46}),
];
