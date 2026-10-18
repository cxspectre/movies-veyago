// renderRanges.ts — the chunk ranges of tools/render.ts, pure so they can be tested.
// Every mode must tile frames 0..total-1 exactly: no gap, no overlap, no empty chunk.
import {SLOTS, sec} from '../src/film';
import {SLOTS4} from '../src/film4';

export type Range = {from: number; to: number; name: string};
export type RangeMode = {slots4?: boolean; slots?: boolean; chunk?: number};

const fromSlots = (slots: readonly {id: string; start: number; end: number}[], total: number): Range[] =>
  slots.map((s) => ({from: sec(s.start), to: Math.min(sec(s.end) - 1, total - 1), name: s.id}));

export const chunkRanges = (total: number, mode: RangeMode): Range[] => {
  if (mode.slots4) return fromSlots(SLOTS4, total);
  if (mode.slots) return fromSlots(SLOTS, total);
  const size = mode.chunk ?? 300;
  if (!Number.isInteger(size) || size < 1) throw new Error(`--chunk must be a positive integer, got ${size}`);
  const ranges: Range[] = [];
  for (let from = 0; from < total; from += size) {
    ranges.push({from, to: Math.min(from + size - 1, total - 1), name: `f${String(from).padStart(5, '0')}`});
  }
  return ranges;
};

/** Returns a list of problems (empty when the ranges tile 0..total-1 exactly). */
export const tilingProblems = (ranges: readonly Range[], total: number): string[] => {
  const problems: string[] = [];
  let next = 0;
  for (const r of ranges) {
    if (r.to < r.from) problems.push(`${r.name}: empty or reversed range ${r.from}-${r.to}`);
    if (r.from > next) problems.push(`gap before ${r.name}: frames ${next}-${r.from - 1}`);
    if (r.from < next) problems.push(`overlap at ${r.name}: starts at ${r.from}, previous ended at ${next - 1}`);
    next = r.to + 1;
  }
  if (next !== total) problems.push(`ranges end at frame ${next - 1}, composition has ${total} frames`);
  return problems;
};
