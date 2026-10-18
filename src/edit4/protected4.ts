// protected4.ts — the stretches of the master where a burned-in caption must not be drawn (brief C/G1: never over a super,
// a sticky note, the title or the end card). Module-local seconds, read from the beat sheet (beats4.ts), never typed here.
import {SUPERS, launch, paperToGlass, providedFor} from '../beats4';
import {slotOf4, type ChapterId} from '../film4';

export type ProtectedWindow = {from: number; to: number; why: string; /** The title and the end card are copy that may never be covered, even by a caption already running. */ hard: boolean};

/** Module-local windows [from, to) of a chapter where a caption must not be drawn, and why. */
export const protectedWindows = (chapter: ChapterId): readonly ProtectedWindow[] => [
  ...SUPERS[chapter].map((s) => ({from: s.t, to: s.t + s.dur, why: `super "${s.text}"`, hard: false})),
  ...(chapter === 'launch' ? [{from: launch.notes[0].press, to: launch.zoomIn.notesFade.to, why: 'the sticky notes', hard: false}] : []),
  ...(chapter === 'paperToGlass' ? [{from: paperToGlass.silence.from, to: slotOf4(chapter).end - slotOf4(chapter).start, why: 'the title', hard: true}] : []),
  ...(chapter === 'providedFor' ? [{from: providedFor.endCard.title, to: providedFor.end, why: 'the end card', hard: true}] : []),
];

