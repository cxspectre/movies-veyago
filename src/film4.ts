// film4.ts — the master timeline of the long film (v4, 10:00). Source: docs/SCRIPT-10MIN-v4.md (chapter map).
// Mirrors src/film.ts. Chapter time is module-local seconds on the 0.5 s grid; use slotOf4(id).start for master time.
import {at, sec} from './film';

export type ChapterId =
  | 'line'
  | 'mayasHouse'
  | 'theNo'
  | 'filterMachine'
  | 'researchBoard'
  | 'nameAndLook'
  | 'engineRoom'
  | 'launch'
  | 'village'
  | 'paperToGlass'
  | 'providedFor';

export type ChapterSlot = {
  id: ChapterId;
  /** Chapter number in the script (1-11). */
  number: number;
  /** Title as written in the script's chapter map. */
  title: string;
  start: number;
  end: number;
};

export const MASTER4_SECONDS = at(10, 0);

/** The v4 timeline: chapter slots in seconds. Changing a boundary changes the whole film; tell the director. */
export const SLOTS4: readonly ChapterSlot[] = [
  {id: 'line', number: 1, title: 'The line', start: at(0, 0), end: at(0, 30)},
  {id: 'mayasHouse', number: 2, title: "Maya's house", start: at(0, 30), end: at(1, 15)},
  {id: 'theNo', number: 3, title: 'The no', start: at(1, 15), end: at(1, 55)},
  {id: 'filterMachine', number: 4, title: 'The filter machine', start: at(1, 55), end: at(2, 50)},
  {id: 'researchBoard', number: 5, title: 'The research board', start: at(2, 50), end: at(3, 55)},
  {id: 'nameAndLook', number: 6, title: 'The name and the look', start: at(3, 55), end: at(4, 50)},
  {id: 'engineRoom', number: 7, title: 'The engine room', start: at(4, 50), end: at(6, 5)},
  {id: 'launch', number: 8, title: 'The launch', start: at(6, 5), end: at(6, 55)},
  {id: 'village', number: 9, title: 'The village', start: at(6, 55), end: at(8, 10)},
  {id: 'paperToGlass', number: 10, title: 'Paper to glass', start: at(8, 10), end: at(9, 30)},
  {id: 'providedFor', number: 11, title: 'Provided for', start: at(9, 30), end: at(10, 0)},
];

export const slotOf4 = (id: ChapterId): ChapterSlot => {
  const slot = SLOTS4.find((s) => s.id === id);
  if (!slot) throw new Error(`Unknown chapter ${id}`);
  return slot;
};

export const slotFrames4 = (id: ChapterId): number => {
  const s = slotOf4(id);
  return sec(s.end) - sec(s.start);
};
