// twoSize.ts — the 2 sized per format so its INK (light width included) is exactly the cap height of "P"
// (./tokens). One spec object per format, so the engine's compile cache holds.
import type {FormatName} from '../../film';
import {lightWidth} from './lightStroke';
import {TITLE, twoInkHeight} from './tokens';
import {inkBox, twoMark, twoSpec, type InkBox} from './twoGlyph';
import type {PathMark, SketchSpec} from '../../paper';

export type SizedTwo = {readonly spec: SketchSpec; readonly mark: PathMark; readonly ink: InkBox; readonly lineWidth: number};

const lightInk = (mark: PathMark, lineWidth: number): InkBox => inkBox(mark, (p) => lightWidth(lineWidth, p.p));

/**
 * The centreline height is first guessed as ink height minus one line width, then corrected once by the measured
 * difference (the light width at the shoulder and the base does not scale with the height, so one pass lands it).
 */
const size = (format: FormatName): SizedTwo => {
  const lineWidth = TITLE.twoLineWidthPx[format];
  const target = twoInkHeight(format);
  const guess = twoSpec(target - lineWidth, lineWidth);
  const guessInk = lightInk(twoMark(guess), lineWidth);
  const spec = twoSpec(target - lineWidth + (target - (guessInk.bottom - guessInk.top)), lineWidth);
  const mark = twoMark(spec);
  return {spec, mark, ink: lightInk(mark, lineWidth), lineWidth};
};

const cache = new Map<FormatName, SizedTwo>();

export const sizedTwo = (format: FormatName): SizedTwo => {
  const hit = cache.get(format);
  if (hit) return hit;
  const sized = size(format);
  cache.set(format, sized);
  return sized;
};
