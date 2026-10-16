// edits4.ts — the cut-downs of the long film (v4) as edit decision lists. Each segment slices one chapter between
// two MODULE-LOCAL times (assembled with a negative <Sequence from>, as src/edits.ts). The v1 EditProps / caption
// types are reused; segments point at chapters instead of modules. Reasoning: docs/v4/BIBLE4.md §6.

import type {ChapterId} from './film4';
import {SLOTS4} from './film4';
import {sec} from './film';
import type {EditProps} from './edits';
import {isOnGrid} from './beats';
import {chapterSeconds, voLine4} from './beats4';

export type {CaptionTone, EditCaption} from './edits';

/** A v4 EditProps: the same fields, but `vo` names a v4 line id (F1…, M1…, Y1…). */
export type EditProps4 = Omit<EditProps, 'vo'> & {vo?: {line: string; at: number; cut?: string}};

export type EditSegment4 = {
  chapter: ChapterId;
  /** Module-local seconds. */
  from: number;
  to: number;
  note: string;
  props?: EditProps4;
};

export type Edl4 = {
  id: string;
  format: 'wide' | 'tall';
  targetSeconds: number;
  segments: readonly EditSegment4[];
  /** Chapter shorts carry their chapter; the hook and the cut do not. */
  chapter?: ChapterId;
};

const seg = (chapter: ChapterId, from: number, to: number, note: string, props?: EditProps4): EditSegment4 => ({
  chapter,
  from,
  to,
  note,
  ...(props ? {props} : {}),
});

const round3 = (n: number): number => Math.round(n * 1000) / 1000;
export const segmentSeconds4 = (s: EditSegment4): number => round3(s.to - s.from);
export const segmentFrames4 = (s: EditSegment4): number => sec(s.to) - sec(s.from);
export const edlSeconds4 = (segments: readonly EditSegment4[]): number => round3(segments.reduce((sum, s) => sum + segmentSeconds4(s), 0));

/** The hook must run between these (PLAN: "a 60-90 s hook"); chapter shorts at most this long. */
export const HOOK_RANGE = {min: 60, max: 90} as const;
export const SHORT_MAX_SECONDS = 60;

// ---------------------------------------------------------------------------------------------------------------
// 9:16 hook, 75 s
// ---------------------------------------------------------------------------------------------------------------

export const HOOK_75: readonly EditSegment4[] = [
  seg('line', 0.0, 7.0, 'the pencil touches; "Every app starts as a line." (the super is the copy)', {
    music: 'pencil only, the felt piano at +6.0',
    sfxAt: {pencil_down: 0.5},
  }),
  seg('mayasHouse', 4.0, 11.0, 'Maya at the table', {
    music: 'felt piano, warm',
    vo: {line: 'Y1', at: 0.0},
    captions: [{at: 0.0, text: "Some weeks I'm the mom, the daughter, and the one who knows where everything is."}],
    captionTone: 'paper',
  }),
  seg('theNo', 0.0, 10.0, 'two letters, "Rejected" twice, 4.3(a)', {
    music: 'B-flat minor, sparse',
    vo: {line: 'F3', at: 0.0},
    captions: [{at: 0.0, text: "Our first app was turned down twice. It wasn't different enough. Apple was right."}],
    captionTone: 'paper',
    sfxAt: {odometer: 5.0},
  }),
  seg('filterMachine', 35.0, 47.0, 'the one card lands and unfolds', {
    music: 'the ostinato stops on the landing; felt piano under F6',
    vo: {line: 'F6', at: 0.5},
    captions: [
      {at: 0.5, text: 'One idea made it through all five.'},
      {at: 4.0, text: 'We started with the hardest version: looking after a parent.'},
    ],
    captionTone: 'paper',
    sfxAt: {paper_drop: 0.0, fold: 0.5},
  }),
  seg('village', 0.0, 13.0, 'the houses pop up; "Version 2: a binder for everyone you call family."', {
    music: 'home key, plucks on each house',
    vo: {line: 'F14', at: 1.0},
    captions: [{at: 8.0, text: 'Nobody looks after just one person.'}],
    captionTone: 'paper',
  }),
  seg('paperToGlass', 0.0, 8.0, 'the village turns to light; the houses lift', {music: 'swell; the pulse locks at +7.0'}),
  seg('paperToGlass', 42.0, 48.0, 'four number rolls on black', {
    music: 'dry pulse',
    captionTone: 'glass',
    sfxAt: {odometer_1: 0.0, odometer_2: 1.5, odometer_3: 3.0, odometer_4: 4.5},
  }),
  seg('paperToGlass', 68.0, 80.0, 'the hard stop, one second of nothing, "Provisum", the "2", the subline', {
    music: 'hard stop on the cut; swell at +2.0; resolve at +5.0; felt piano alone',
    sfxAt: {title_in: 2.0},
  }),
];

// ---------------------------------------------------------------------------------------------------------------
// 9:16 cut, 3:00
// ---------------------------------------------------------------------------------------------------------------

export const CUT_180: readonly EditSegment4[] = [
  seg('line', 0.0, 7.0, 'the line starts; the super', {music: 'pencil only, then piano', sfxAt: {pencil_down: 0.5}}),
  seg('mayasHouse', 4.0, 11.0, 'Maya', {
    music: 'felt piano',
    vo: {line: 'Y1', at: 0.0},
    captions: [{at: 0.0, text: "Some weeks I'm the mom, the daughter, and the one who knows where everything is."}],
    captionTone: 'paper',
  }),
  seg('mayasHouse', 22.0, 28.0, 'the storm; the sepia super; the freeze on the last frame', {music: 'a lift that stops dead on the cut'}),
  seg('theNo', 0.0, 7.0, 'two rejections', {
    music: 'B-flat minor',
    vo: {line: 'F3', at: 0.0},
    captions: [{at: 0.0, text: "Our first app was turned down twice. It wasn't different enough. Apple was right."}],
    captionTone: 'paper',
    sfxAt: {odometer: 5.0},
  }),
  seg('theNo', 28.0, 35.0, 'the calendar: 21 September 2026', {
    music: 'one low note on the landing',
    vo: {line: 'F5', at: 3.0},
    captions: [{at: 3.0, text: 'On the twenty-first of September, we started again.'}],
    captionTone: 'paper',
    sfxAt: {paper_drop: 0.5, odometer: 2.5},
  }),
  seg('filterMachine', 0.0, 7.0, 'the machine folds up', {
    music: 'the ostinato begins',
    vo: {line: 'M1', at: 0.0},
    captions: [{at: 0.0, text: 'Before we had one idea, we built the filter that every idea had to pass.'}],
    captionTone: 'paper',
    sfxAt: {fold: 0.0},
  }),
  seg('filterMachine', 35.0, 44.0, 'the one card', {
    music: 'stops on the landing; felt piano',
    vo: {line: 'F6', at: 0.5},
    captions: [{at: 0.5, text: 'One idea made it through all five.'}, {at: 4.0, text: 'We started with the hardest version: looking after a parent.'}],
    captionTone: 'paper',
    sfxAt: {paper_drop: 0.0},
  }),
  seg('researchBoard', 30.0, 40.0, 'the string pulls tight; the 2x2; the gap', {
    music: 'strings; the glissando at +2.0',
    captions: [{at: 8.0, text: 'The gap: all of it, for everyone, privately.'}],
    captionTone: 'paper',
    sfxAt: {string: 0.0},
  }),
  seg('researchBoard', 45.0, 55.0, 'six building blocks', {
    music: 'plucks on the boxes',
    vo: {line: 'M5', at: 3.0},
    captions: [{at: 3.0, text: 'Six building blocks. Everything the app does is one of them, or a mix of them.'}],
    captionTone: 'paper',
  }),
  seg('nameAndLook', 5.0, 13.0, 'PROVISUM writes itself and becomes the logotype', {
    music: 'held chord; resolve at +6.0',
    vo: {line: 'F8', at: 2.0},
    captions: [{at: 2.0, text: 'Provisum. Latin for provided for. What you want everyone you love to be.'}],
    captionTone: 'paper',
  }),
  seg('nameAndLook', 20.0, 28.0, 'the dive into the screen; the colour tokens', {music: 'the soft pulse', captionTone: 'glass'}),
  seg('engineRoom', 44.0, 54.0, 'the server is drawn and erased; your own iCloud', {
    music: 'a rest for the eraser; the pedal returns',
    vo: {line: 'M11', at: 0.0},
    captions: [{at: 0.0, text: 'There is no Veyago server.'}, {at: 3.0, text: 'Your data lives on your phone and in your own iCloud.'}],
    captionTone: 'paper',
  }),
  seg('launch', 0.0, 10.0, 'the rocket; three statuses; 28 September 2026', {
    music: 'three plucked notes',
    vo: {line: 'F10', at: 0.0},
    captions: [{at: 0.0, text: 'Seven days after the first sketch, App Review said yes.'}],
    captionTone: 'paper',
    sfxAt: {fold: 0.0, odometer: 4.0},
  }),
  seg('launch', 22.0, 31.0, 'two sticky notes', {
    music: 'dry rest',
    vo: {line: 'F12', at: 4.0},
    captions: [{at: 4.0, text: 'On day one we got the price wrong. On day two we fixed it.'}],
    captionTone: 'paper',
    sfxAt: {sticky_press: 0.0, sticky_press_2: 5.0},
  }),
  seg('village', 0.0, 9.0, 'the houses pop up', {
    music: 'home key',
    vo: {line: 'F14', at: 1.0},
    captions: [{at: 1.0, text: 'Version one was a binder for a parent. Nobody looks after just one person.'}],
    captionTone: 'paper',
  }),
  seg('village', 50.0, 60.0, 'the rise: Europe, five bubbles', {
    music: 'swell',
    captions: [{at: 7.0, text: 'Five countries. Five languages.'}],
    captionTone: 'paper',
  }),
  seg('paperToGlass', 0.0, 10.0, 'paper to glass', {music: 'swell; the pulse locks at +7.0'}),
  seg('paperToGlass', 42.0, 48.0, 'number rolls', {music: 'dry pulse', captionTone: 'glass'}),
  seg('paperToGlass', 68.0, 80.0, 'the silence; the title', {music: 'hard stop; swell at +2.0; resolve at +5.0', sfxAt: {title_in: 2.0}}),
  seg('providedFor', 12.0, 20.0, 'the pencil sets itself down', {
    music: 'felt piano alone',
    vo: {line: 'F16', at: 2.0},
    captions: [{at: 2.0, text: "Provisum. It's Latin for provided for. For everyone you call family."}],
    captionTone: 'paper',
  }),
  seg('providedFor', 20.0, 30.0, 'the end card on paper; the click', {music: 'the final chord, decayed by +4.0', sfxAt: {pencil_click: 8.0}}),
];

// ---------------------------------------------------------------------------------------------------------------
// Chapter shorts (9:16, one per chapter, at most 60 s)
// ---------------------------------------------------------------------------------------------------------------

const paper = (text: string, at = 0.0): Pick<EditProps4, 'captions' | 'captionTone'> => ({captions: [{at, text}], captionTone: 'paper'});

export const CHAPTER_SHORTS: readonly Edl4[] = [
  {id: 'Short-line', format: 'tall', chapter: 'line', targetSeconds: 30, segments: [
    seg('line', 0.0, 30.0, 'the whole chapter', {music: 'as the master', vo: {line: 'F1', at: 7.0}, ...paper('This is the story of one app.', 7.0)}),
  ]},
  {id: 'Short-mayasHouse', format: 'tall', chapter: 'mayasHouse', targetSeconds: 45, segments: [
    seg('mayasHouse', 0.0, 45.0, 'the whole chapter', {music: 'as the master', vo: {line: 'Y1', at: 4.0}, ...paper("Some weeks I'm the mom, the daughter, and the one who knows where everything is.", 4.0)}),
  ]},
  {id: 'Short-theNo', format: 'tall', chapter: 'theNo', targetSeconds: 40, segments: [
    seg('theNo', 0.0, 40.0, 'the whole chapter', {music: 'as the master', vo: {line: 'F3', at: 0.0}, ...paper("Our first app was turned down twice. It wasn't different enough. Apple was right.")}),
  ]},
  {id: 'Short-filterMachine', format: 'tall', chapter: 'filterMachine', targetSeconds: 47, segments: [
    seg('filterMachine', 0.0, 47.0, 'the machine to the one card (the fly-back is dropped)', {music: 'as the master', vo: {line: 'M1', at: 0.0}, ...paper('Before we had one idea, we built the filter that every idea had to pass.')}),
  ]},
  {id: 'Short-researchBoard', format: 'tall', chapter: 'researchBoard', targetSeconds: 48, segments: [
    seg('researchBoard', 0.0, 20.0, 'the four cards', {music: 'as the master', vo: {line: 'M3', at: 0.0}, ...paper('Next, we stopped guessing.')}),
    seg('researchBoard', 30.0, 58.0, 'the string, the gap, the six boxes', {music: 'as the master', vo: {line: 'M5', at: 18.0}, ...paper('The gap: all of it, for everyone, privately.', 8.0)}),
  ]},
  {id: 'Short-nameAndLook', format: 'tall', chapter: 'nameAndLook', targetSeconds: 43, segments: [
    seg('nameAndLook', 0.0, 13.0, 'the names; PROVISUM', {music: 'as the master', vo: {line: 'F7', at: 0.0}, ...paper('For a few days it was called On Behalf. Then we found a better word.')}),
    seg('nameAndLook', 20.0, 50.0, 'inside the screen', {music: 'as the master', captionTone: 'glass'}),
  ]},
  {id: 'Short-engineRoom', format: 'tall', chapter: 'engineRoom', targetSeconds: 41, segments: [
    seg('engineRoom', 0.0, 6.0, 'the cutaway opens', {music: 'as the master', vo: {line: 'M8', at: 0.0}, ...paper('Native Swift, for iPhone, Apple Watch and widgets. Nothing in between.')}),
    seg('engineRoom', 16.0, 28.0, 'the data model', {music: 'as the master', vo: {line: 'M9', at: 2.0}, ...paper('Everything belongs to a binder, and a binder belongs to a person.', 2.0)}),
    seg('engineRoom', 42.0, 62.0, 'the vault', {music: 'as the master', vo: {line: 'M11', at: 2.0}, ...paper('There is no Veyago server.', 2.0)}),
    seg('engineRoom', 72.0, 75.0, 'the cutaway closes', {music: 'as the master'}),
  ]},
  {id: 'Short-launch', format: 'tall', chapter: 'launch', targetSeconds: 41, segments: [
    seg('launch', 0.0, 35.0, 'rocket, map, sticky notes', {music: 'as the master', vo: {line: 'F10', at: 0.0}, ...paper('Seven days after the first sketch, App Review said yes.')}),
    seg('launch', 44.0, 50.0, 'Maya in the window', {music: 'as the master', vo: {line: 'Y3', at: 1.0}, ...paper('It was never only my dad.', 1.0)}),
  ]},
  {id: 'Short-village', format: 'tall', chapter: 'village', targetSeconds: 38, segments: [
    seg('village', 0.0, 13.0, 'the houses pop up', {music: 'as the master', vo: {line: 'F14', at: 1.0}, ...paper('Nobody looks after just one person.', 1.0)}),
    seg('village', 29.0, 37.0, 'two visits', {music: 'as the master', vo: {line: 'Y4', at: 0.0}, ...paper("Sam's car, Dad's medications, the kids' passports. Same place. Same calm.")}),
    seg('village', 45.0, 62.0, "Sam's flat; the rise; Europe", {music: 'as the master', ...paper('Five countries. Five languages.', 12.0)}),
  ]},
  {id: 'Short-paperToGlass', format: 'tall', chapter: 'paperToGlass', targetSeconds: 43, segments: [
    seg('paperToGlass', 0.0, 25.0, 'paper to glass; nine snaps', {music: 'as the master', captionTone: 'glass'}),
    seg('paperToGlass', 42.0, 48.0, 'number rolls', {music: 'as the master', captionTone: 'glass'}),
    seg('paperToGlass', 68.0, 80.0, 'the silence; the title', {music: 'as the master', sfxAt: {title_in: 2.0}}),
  ]},
  {id: 'Short-providedFor', format: 'tall', chapter: 'providedFor', targetSeconds: 30, segments: [
    seg('providedFor', 0.0, 30.0, 'the whole chapter', {music: 'as the master', vo: {line: 'F16', at: 14.0}, ...paper("Provisum. It's Latin for provided for. For everyone you call family.", 14.0)}),
  ]},
];

export const EDLS4: readonly Edl4[] = [
  {id: 'Hook75', format: 'tall', targetSeconds: 75, segments: HOOK_75},
  {id: 'Cut180', format: 'tall', targetSeconds: 180, segments: CUT_180},
  ...CHAPTER_SHORTS,
];

/** Problems in an EDL: a bad slice, a slice outside its chapter, an off-grid cut, a VO outside its segment, a wrong total. */
export const validateEdl4 = (edl: Edl4): readonly string[] => {
  const problems: string[] = [];
  for (const [i, s] of edl.segments.entries()) {
    const length = chapterSeconds(s.chapter);
    if (s.from < 0 || s.to > length || s.from >= s.to) problems.push(`${edl.id}[${i}] ${s.chapter} ${s.from}-${s.to}: bad slice (chapter is 0-${length}s)`);
    if (!isOnGrid(s.from) || !isOnGrid(s.to)) problems.push(`${edl.id}[${i}] ${s.chapter} ${s.from}-${s.to}: cut off the 0.5 s grid`);
    if (edl.chapter && s.chapter !== edl.chapter) problems.push(`${edl.id}[${i}]: a chapter short may only slice ${edl.chapter}`);
    const v = s.props?.vo;
    if (v) {
      const line = voLine4(v.line);
      if (line.chapter !== s.chapter) problems.push(`${edl.id}[${i}]: VO ${v.line} belongs to ${line.chapter}, not ${s.chapter}`);
      if (v.at < 0 || v.at > segmentSeconds4(s)) problems.push(`${edl.id}[${i}]: VO ${v.line} placed outside the segment`);
    }
    for (const c of s.props?.captions ?? []) {
      if (c.at < 0 || c.at > segmentSeconds4(s)) problems.push(`${edl.id}[${i}]: caption "${c.text}" outside the segment`);
    }
  }
  const total = edlSeconds4(edl.segments);
  if (total !== edl.targetSeconds) problems.push(`${edl.id} runs ${total}s, not ${edl.targetSeconds}s`);
  if (edl.id === 'Hook75' && (total < HOOK_RANGE.min || total > HOOK_RANGE.max)) problems.push(`${edl.id}: a hook runs ${HOOK_RANGE.min}-${HOOK_RANGE.max}s`);
  if (edl.chapter && total > SHORT_MAX_SECONDS) problems.push(`${edl.id}: a chapter short runs at most ${SHORT_MAX_SECONDS}s`);
  return problems;
};

export const validateEdls4 = (): readonly string[] => [
  ...EDLS4.flatMap(validateEdl4),
  ...SLOTS4.filter((s) => !CHAPTER_SHORTS.some((e) => e.chapter === s.id)).map((s) => `no chapter short for ${s.id}`),
];
