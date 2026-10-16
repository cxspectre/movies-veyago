// timeline.ts — master seconds <-> chapters. The endless sheet runs on MASTER time; chapters speak module-local time.
import {type ChapterId, type ChapterSlot, MASTER4_SECONDS, SLOTS4, slotOf4} from '../film4';

export const masterOf = (id: ChapterId, local: number): number => slotOf4(id).start + local;

/** The chapter a master time falls in (clamped to the first and last chapter). */
export const slotAtMaster = (master: number): ChapterSlot => {
  const last = SLOTS4[SLOTS4.length - 1] as ChapterSlot;
  if (master >= MASTER4_SECONDS) return last;
  return SLOTS4.find((s) => master >= s.start && master < s.end) ?? (SLOTS4[0] as ChapterSlot);
};

export type ChapterState = 'future' | 'active' | 'finished';

/** Has the chapter not started, is it running, or is it done. */
export const stateAt = (id: ChapterId, master: number): ChapterState => {
  const s = slotOf4(id);
  if (master < s.start) return 'future';
  return master < s.end ? 'active' : 'finished';
};
