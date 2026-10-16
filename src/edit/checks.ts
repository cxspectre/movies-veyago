// checks.ts — the one gate every cut-down passes before it is registered or its cues are written.
import type {Edl} from '../edits';
import {FPS} from '../film';
import {edlCaptionWindows} from './captionTiming';
import {edlProblems} from './edl';

/** A caption must be readable: on screen at least this long. */
const MIN_CAPTION_SECONDS = 0.8;

const captionTimingProblems = (edl: Edl): readonly string[] =>
  edlCaptionWindows(edl)
    .filter((w) => (w.toFrame - w.fromFrame) / FPS < MIN_CAPTION_SECONDS)
    .map((w) => `${edl.id}[${w.segment}]: caption "${w.text}" is on screen < ${MIN_CAPTION_SECONDS}s`);

/** Every problem in the EDL: `validateEdl`, the player's rules and the caption timing. Empty when playable. */
export const allEdlProblems = (edl: Edl): readonly string[] => [...edlProblems(edl), ...captionTimingProblems(edl)];

/** Throws one Error listing every problem. Called at module load by previews.ts and by the edl tools. */
export const assertEdl = (edl: Edl): Edl => {
  const problems = allEdlProblems(edl);
  if (problems.length > 0) throw new Error(`Cut-down ${edl.id} is not playable:\n  ${problems.join('\n  ')}`);
  return edl;
};
