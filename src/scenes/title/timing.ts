// timing.ts — the title's frame -> state functions (pure). Every time comes from `title` in src/beats.ts.
import {title} from '../../beats';
import {ease, freshLevel, HAIRLINE} from '../../glass';

/** Each letter rises this far (logical px) as it fades in (BIBLE 6.1). */
export const LETTER_RISE_PX = 6;
/**
 * The head of the 2 covers this fraction of the stroke's length at constant speed, then eases out over the rest,
 * arriving exactly at `title.strokeTwo.completesAt` (BIBLE 6.1: constant speed, then ease out; DECISIONS in report).
 */
const CONSTANT_LENGTH = 0.9;
/** Share of the stroke window spent at constant speed (velocity-continuous with a quadratic ease-out). */
const CONSTANT_TIME = CONSTANT_LENGTH / (CONSTANT_LENGTH + 2 * (1 - CONSTANT_LENGTH));
const HEAD_SPEED = CONSTANT_LENGTH / CONSTANT_TIME;

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

export type LetterState = {readonly opacity: number; readonly rise: number};

/** Letter `index` of "Provisum" at module-local second `t`. */
export const letterState = (index: number, t: number): LetterState => {
  const start = title.word.from + index * title.word.letterStagger;
  const k = clamp01((t - start) / title.word.letterFade);
  return {opacity: ease('easeInOutSine', k), rise: LETTER_RISE_PX * (1 - ease('easeOutCubic', k))};
};

/** True while nothing at all may be drawn: the frames must be pure zeros. */
export const isBlack = (t: number): boolean => t < title.black.to;

/** 0-1 of the 2's arc length drawn at `t` (constant head speed, then a velocity-matched ease-out). */
export const twoProgress = (t: number): number => {
  const {from, completesAt} = title.strokeTwo;
  const u = clamp01((t - from) / (completesAt - from));
  if (u <= CONSTANT_TIME) return HEAD_SPEED * u;
  const k = (u - CONSTANT_TIME) / (1 - CONSTANT_TIME);
  return CONSTANT_LENGTH + (1 - CONSTANT_LENGTH) * (1 - (1 - k) * (1 - k));
};

/**
 * Brightness of the 2: the freshly drawn level (1.2) while the pencil is moving, then it settles to 1.0 after the
 * stroke completes, on the hairline kit's own settle curve.
 */
export const twoLevel = (t: number): number =>
  t < title.strokeTwo.completesAt ? HAIRLINE.freshFlare : freshLevel(t - title.strokeTwo.completesAt + HAIRLINE.freshSeconds);

/** Opacity factor (0-1) of the subline. */
export const sublineFade = (t: number): number => ease('easeInOutSine', (t - title.subline.at) / title.subline.fadeSeconds);
