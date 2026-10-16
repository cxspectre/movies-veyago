// compile.ts — a SketchSpec compiled to its full list of timed marks (cached per spec object).
import {labelMarks} from '../text/handLayout';
import type {SketchSpec} from '../types';
import {strokeMarks} from './strokeMarks';
import type {Mark} from './types';

const cache = new WeakMap<SketchSpec, readonly Mark[]>();

/** Every pencil movement of the page, sorted by start time. Timing is in fractions (0-1) of drawFrames. */
export const compileSketch = (spec: SketchSpec): readonly Mark[] => {
  const hit = cache.get(spec);
  if (hit) return hit;
  const marks = [...spec.strokes.flatMap(strokeMarks), ...spec.labels.flatMap(labelMarks)].sort(
    (a, b) => a.start - b.start || a.order - b.order,
  );
  cache.set(spec, marks);
  return marks;
};

/** Local progress (0-1) of a mark at page progress u (0-1 of drawFrames). */
export const markProgress = (m: Mark, u: number): number => {
  if (u <= m.start) return 0;
  if (u >= m.end) return 1;
  return (u - m.start) / (m.end - m.start);
};
