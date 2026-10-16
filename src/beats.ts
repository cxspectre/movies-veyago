// beats.ts — the beat sheet of "Provided For": every audio-visual sync point, per module, in MODULE-LOCAL seconds.
// Conforms to CONTRACT.md §7 (MUSIC MAP v1) and §8 (VO windows v1); master times were converted with SLOTS in
// film.ts and are double-checked by `validateBeats()`. Scenes, sketches, the sound department and the editor
// import from here. Nobody re-types a number. The creative reasoning is in docs/BIBLE.md and docs/DECISIONS.md.

import type {ModuleId} from './film';
import {SLOTS, sec, slotOf} from './film';
import type {SfxName} from './audio/cues';
import type {SketchId} from './sketches/registry';

// Vocabulary

/** Every sync point lands on this grid (CONTRACT §4), except stroke-level foley and VO-derived estimates. */
export const GRID_SECONDS = 0.5;
/** VO read-speed estimate until the VO engineer reports real durations ("read slower than feels natural"). */
export const VO_WORDS_PER_SECOND = 2.3;
export const VO_SENTENCE_PAUSE_SECONDS = 0.4;
const ONE_FRAME_SECONDS = 1 / 30;

export type Beat = {
  id: string;
  /** Module-local seconds. */
  t: number;
  /** Seconds, for windows; omitted for instants. */
  dur?: number;
  note: string;
  sfx?: SfxName;
  /** The time depends on the VO read; it moves once the VO engineer reports real durations. */
  estimate?: boolean;
  /** Allowed off the 0.5 s grid (VO windows from the contract, stroke-level foley). */
  offGrid?: boolean;
};

export type Window = {from: number; to: number};
export type Keyframe = {t: number; value: number};
export type EasingName = 'linear' | 'easeOutCubic' | 'easeInOutCubic' | 'easeInOutSine' | 'easeInOutQuint' | 'keynote';

/** cubic-bezier control points for every easing named in the beat sheet (see docs/BIBLE.md §2.9). */
export const EASING: Record<EasingName, readonly [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  easeOutCubic: [0.33, 1, 0.68, 1],
  easeInOutCubic: [0.65, 0, 0.35, 1],
  easeInOutSine: [0.37, 0, 0.63, 1],
  easeInOutQuint: [0.83, 0, 0.17, 1],
  keynote: [0.2, 0, 0, 1],
};

const round3 = (n: number): number => Math.round(n * 1000) / 1000;
const window = (from: number, to: number): Window => ({from, to});
const beat = (id: string, t: number, note: string, extra: Partial<Omit<Beat, 'id' | 't' | 'note'>> = {}): Beat => ({
  id,
  t,
  note,
  ...extra,
});

// Helpers (public API)

export const slotSeconds = (id: ModuleId): number => slotOf(id).end - slotOf(id).start;
/** Master seconds -> module-local seconds. */
export const toLocal = (id: ModuleId, master: number): number => round3(master - slotOf(id).start);
/** Module-local seconds -> master seconds. */
export const toMaster = (id: ModuleId, local: number): number => round3(local + slotOf(id).start);
/** Module-local seconds -> module-local frame (the frame `useCurrentFrame()` reports inside the module). Throws outside the slot. */
export const beatFrames = (id: ModuleId, local: number): number => {
  if (local < 0 || local > slotSeconds(id)) {
    throw new Error(`Beat ${local}s is outside module ${id} (0-${slotSeconds(id)}s)`);
  }
  return sec(local);
};
/** Module-local seconds -> master frame. */
export const masterFrame = (id: ModuleId, local: number): number => sec(toMaster(id, local));
export const isOnGrid = (t: number): boolean => Math.abs(t / GRID_SECONDS - Math.round(t / GRID_SECONDS)) < 1e-6;
/** Which module a master time falls in. */
export const moduleAt = (master: number): ModuleId => {
  const slot = SLOTS.find((s) => master >= s.start && master < s.end) ?? SLOTS[SLOTS.length - 1];
  if (!slot) throw new Error('No slots');
  return slot.id;
};

const sentenceCount = (text: string): number => Math.max(1, (text.match(/[.?!]/g) ?? []).length);
export const wordCount = (text: string): number => text.trim().split(/\s+/).length;
/** The read-length estimate every VO beat uses until real durations arrive. */
export const estimateVoSeconds = (text: string): number =>
  round3(wordCount(text) / VO_WORDS_PER_SECOND + (sentenceCount(text) - 1) * VO_SENTENCE_PAUSE_SECONDS);

// VO windows (CONTRACT §8) in module-local seconds, with estimated ends

export type VoLine = {
  n: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  module: ModuleId;
  masterStart: number;
  /** Module-local start. */
  start: number;
  text: string;
  words: number;
  /** Module-local estimated end (2.3 words/s + 0.4 s per sentence break). ESTIMATE. */
  estimatedEnd: number;
  estimatedMasterEnd: number;
  /** Master deadline from the contract, where it names one. */
  mustEndByMaster?: number;
};

const vo = (n: VoLine['n'], masterStart: number, text: string, mustEndByMaster?: number): VoLine => {
  const module = moduleAt(masterStart);
  const start = toLocal(module, masterStart);
  const estimatedEnd = round3(start + estimateVoSeconds(text));
  return {
    n,
    module,
    masterStart,
    start,
    text,
    words: wordCount(text),
    estimatedEnd,
    estimatedMasterEnd: toMaster(module, estimatedEnd),
    ...(mustEndByMaster === undefined ? {} : {mustEndByMaster}),
  };
};

export const VO: readonly VoLine[] = [
  vo(1, 6.5, "Provisum 1 already did a lot. Mom's papers, in one place. Every deadline, with the right reminder. The emergency card, for the night the hospital calls.", 19.5),
  vo(2, 21.0, 'It worked. So we sat down and asked the harder question.'),
  vo(3, 36.0, 'We started with a person.'),
  vo(4, 56.3, "Then we went through Mom's mail."),
  vo(5, 66.3, 'And we looked past one country.'),
  vo(6, 73.0, 'And then the biggest one. Stop asking people to fill in forms. Just ask them.'),
  vo(7, 124.5, 'Everything we drew. On your iPhone. And none of it on our servers. No account. No tracking.'),
  vo(8, 146.0, "Provisum. It's Latin for provided for."),
];
export const voLine = (n: VoLine['n']): VoLine => {
  const line = VO.find((v) => v.n === n);
  if (!line) throw new Error(`No VO ${n}`);
  return line;
};

/**
 * Word landmarks inside VO 1 (module-local = master, coldOpen starts at 0). MEASURED on the primary read
 * (af_heart, pro-VEE-zum, audio/vo/timing.json): word starts, ±50 ms inside a sentence, sentence starts exact.
 */
export const VO1_LANDMARKS = {
  papers: 9.62, // "Mom's papers" -> the binder is ticked
  deadline: 12.31, // "Every deadline" -> the deadlines are ticked
  card: 15.52, // "The emergency card" -> the card is ticked
  hospital: 18.11, // "hospital calls." -> the last two ticks ride out under it
  calls: 18.65, // the word "calls."
  end: 19.4, // last sound of VO 1 (hard limit 19.5)
} as const;

// coldOpen 0:00-0:35 (local = master)

export type TickBeat = {item: 'binder' | 'deadlines' | 'card' | 'mail' | 'packets'; t: number; onWord: string; estimate: boolean};

/** The tick times (local): the first 0.5 s grid point at or after each noun starts (VO1_LANDMARKS). */
const V1_TICK_AT = {binder: 10.0, deadlines: 12.5, card: 16.0, mail: 18.5, packets: 19.0} as const;
/** The v1-home draw window (local), as `coldOpen.v1` runs it: sequenceFrom 1.0 s, drawFrames 18.5 s. */
const V1_DRAW = {from: 1.0, seconds: 18.5} as const;
/** How long each tick stroke takes, as a fraction of the draw window (~0.3 s, ~0.25 s for the double tick). */
const V1_TICK_SPAN = {single: 0.016, mail: 0.013, packets: 0.014} as const;
/** Unrounded, so the tick's `tick` cue (fraction x drawFrames + sequenceFrom) lands exactly on its grid point. */
const v1Tick = (t: number, span: number): readonly [number, number] => {
  const from = (t - V1_DRAW.from) / V1_DRAW.seconds;
  return [from, from + span];
};

/** Stroke-order fractions of the v1-home page (drawFrames spans local 1.0-19.5, see `coldOpen.v1`). */
export const V1_HOME_FRACTIONS = {
  leftEdge: [0.0, 0.162], // 1.0-4.0: the single line drawn in the dark
  outlineRest: [0.162, 0.27], // 4.0-6.0: top, right, bottom edges as the lamp comes up
  binderTab: [0.27, 0.324], // 6.0-7.0
  deadlines: [0.324, 0.378], // 7.0-8.0
  card: [0.378, 0.432], // 8.0-9.0
  mail: [0.432, 0.459], // 9.0-9.5
  packets: [0.459, 0.486], // 9.5-10.0
  tickBinder: v1Tick(V1_TICK_AT.binder, V1_TICK_SPAN.single), // 10.0: 0.486-0.502
  tickDeadlines: v1Tick(V1_TICK_AT.deadlines, V1_TICK_SPAN.single), // 12.5: 0.622-0.638
  tickCard: v1Tick(V1_TICK_AT.card, V1_TICK_SPAN.single), // 16.0: 0.811-0.827
  tickMail: v1Tick(V1_TICK_AT.mail, V1_TICK_SPAN.mail), // 18.5: 0.946-0.959
  tickPackets: v1Tick(V1_TICK_AT.packets, V1_TICK_SPAN.packets), // 19.0: 0.973-0.987
} as const;

export const coldOpen = {
  black: window(0.0, 1.0),
  /** The pencil is heard before it is seen. */
  lineInDark: window(1.0, 4.0),
  /** Lamp intensity 0 -> 1 (tungsten warm-up). */
  lampUp: [
    {t: 1.0, value: 0},
    {t: 2.0, value: 0.05},
    {t: 3.0, value: 0.15},
    {t: 4.0, value: 0.4},
    {t: 5.0, value: 0.75},
    {t: 6.0, value: 1},
  ] as readonly Keyframe[],
  pianoIn: 6.0,
  /** The v1-home page runs in a <Sequence from={30}> so the stroke fractions above land on these times. */
  v1: {
    sketch: 'v1-home' as SketchId,
    sequenceFrom: sec(1.0),
    drawFrames: sec(18.5),
    outlineDone: 6.0,
    bodyDone: 10.0,
  },
  /** VO 1 moved here from 7.0 (CONTRACT §12.8): it now breathes ≥ 0.5 s between sentences and ends at 19.4. */
  voStart: 6.5,
  /**
   * The pencil ticks the five V1 items; three on the VO's nouns, the last two as a double tick under "hospital calls".
   * Each lands on the first 0.5 s grid point at or after its noun starts (measured, VO1_LANDMARKS).
   */
  ticks: [
    {item: 'binder', t: V1_TICK_AT.binder, onWord: "Mom's papers", estimate: false},
    {item: 'deadlines', t: V1_TICK_AT.deadlines, onWord: 'Every deadline', estimate: false},
    {item: 'card', t: V1_TICK_AT.card, onWord: 'The emergency card', estimate: false},
    {item: 'mail', t: V1_TICK_AT.mail, onWord: 'hospital calls', estimate: false},
    {item: 'packets', t: V1_TICK_AT.packets, onWord: 'hospital calls', estimate: false},
  ] as readonly TickBeat[],
  pencilStops: 20.0,
  pianoThins: window(20.0, 28.0),
  handRests: window(20.0, 24.0),
  handAOut: window(24.0, 25.0),
  cupDown: 22.0,
  breath: window(23.0, 27.0),
  handsBIn: window(26.0, 27.0),
  stickyPress: 27.0,
  stickySmooth: window(27.5, 28.0),
  /** The first real chord lands here, exactly as the note is smoothed flat. */
  chord: 28.0,
  penCap: 28.5,
  lettering: {...window(28.5, 32.5), text: 'What are we still missing?'},
  pushIn: {...window(28.0, 35.0), scaleFrom: 1.0, scaleTo: 1.04, easing: 'easeInOutSine' as EasingName},
  hold: window(32.5, 35.0),
  cut: 35.0,
} as const;

const coldOpenBeats: readonly Beat[] = [
  beat('pencil-line', 1.0, 'pencil scratch in the dark; the line is the phone edge', {dur: 3.0}),
  beat('lamp-up', 1.0, 'lamp warms up to full by 6.0', {dur: 5.0}),
  beat('piano-in', 6.0, 'felt piano, sparse'),
  beat('vo1', coldOpen.voStart, 'VO 1 starts (ends 19.4, measured)'),
  beat('tick-binder', V1_TICK_AT.binder, 'tick: binder for Mom ("Mom\'s papers" at 9.62)', {sfx: 'tick'}),
  beat('tick-deadlines', V1_TICK_AT.deadlines, 'tick: deadlines ("Every deadline" at 12.31)', {sfx: 'tick'}),
  beat('tick-card', V1_TICK_AT.card, 'tick: emergency card ("The emergency card" at 15.52)', {sfx: 'tick'}),
  beat('tick-mail', V1_TICK_AT.mail, 'tick: mail (not named; double tick under "hospital calls", 18.11)', {sfx: 'tick'}),
  beat('tick-packets', V1_TICK_AT.packets, 'tick: packets (not named; second of the double tick)', {sfx: 'tick'}),
  beat('pencil-stops', 20.0, 'the hand rests; piano thins'),
  beat('vo2', 21.0, 'VO 2 starts'),
  beat('cup-down', 22.0, 'coffee cup set at the page edge, in the pause after "It worked."', {sfx: 'cup_down'}),
  beat('sticky-press', 27.0, 'sticky note pressed onto the centre of the sketch', {sfx: 'sticky_press'}),
  beat('sticky-smooth', 28.0, 'note smoothed flat; FIRST CHORD', {sfx: 'sticky_smooth'}),
  beat('pen-cap', 28.5, 'the accent fineliner is uncapped', {sfx: 'pen_cap'}),
  beat('lettering', 28.5, '"What are we still missing?" lettered on the note', {dur: 4.0}),
  beat('cut', 35.0, 'cut to the wide desk'),
];

// desk 0:35-1:20 (local 0-45): the sketching session, one page per idea

export type PageBeat = {
  page: number;
  id: SketchId;
  /** The sheet starts sliding in. */
  start: number;
  slideIn: number;
  drawStart: number;
  drawSeconds: number;
  drawFrames: number;
  drawEnd: number;
  /** The margin note starts (the last strokes of the page). */
  noteAt: number;
  hold: number;
  /** The next sheet starts sliding in over it (= next page's start). */
  end: number;
  /** The previous sheet is pushed up-left out of the work area over this window. */
  slideOut: Window;
  foley: readonly SfxName[];
  masterStart: number;
};

type PagePlan = {id: SketchId; seconds: number; slideIn: number; hold: number; noteFraction: number; foley: readonly SfxName[]};

/** Pacing: 6,5,4,3 s (pages 1-4, 0:38-0:56), 2 s each (pages 5-9, 0:56-1:06), 3 s each (pages 10-11, 1:06-1:12), 8 s (page 12). */
const PAGE_PLAN: readonly PagePlan[] = [
  {id: 'family-tabs', seconds: 6, slideIn: 0.5, hold: 1.0, noteFraction: 0.92, foley: ['paper_drop']},
  {id: 'watch-wallet', seconds: 5, slideIn: 0.5, hold: 1.0, noteFraction: 0.9, foley: ['paper_drop']},
  {id: 'pill-bottle', seconds: 4, slideIn: 0.5, hold: 0.5, noteFraction: 0.92, foley: ['paper_drop']},
  {id: 'share-card', seconds: 3, slideIn: 0.5, hold: 0.5, noteFraction: 0.9, foley: ['paper_drop']},
  {id: 'scam-letter', seconds: 2, slideIn: 0.3, hold: 0.2, noteFraction: 0.9, foley: ['paper_drop']},
  {id: 'passport', seconds: 2, slideIn: 0.3, hold: 0.2, noteFraction: 0.9, foley: ['paper_drop', 'ruler_tap']},
  {id: 'shared-costs', seconds: 2, slideIn: 0.3, hold: 0.2, noteFraction: 0.88, foley: ['paper_drop', 'coin_clink']},
  {id: 'where-is-it', seconds: 2, slideIn: 0.3, hold: 0.2, noteFraction: 0.88, foley: ['paper_drop', 'key_clink']},
  {id: 'visit-recording', seconds: 2, slideIn: 0.3, hold: 0.2, noteFraction: 0.9, foley: ['paper_drop']},
  {id: 'europe-map', seconds: 3, slideIn: 0.5, hold: 0.5, noteFraction: 0.95, foley: ['paper_drop']},
  {id: 'speech-bubbles', seconds: 3, slideIn: 0.5, hold: 0.5, noteFraction: 0.92, foley: ['paper_drop', 'bubble_pop']},
  {id: 'form-to-chat', seconds: 8, slideIn: 0.5, hold: 0.0, noteFraction: 0.9, foley: ['paper_drop']},
];

export const DESK_PAGES_START = 3.0; // 0:38 master
const SLIDE_OUT_SECONDS = 0.5;

const buildPages = (plan: readonly PagePlan[]): readonly PageBeat[] => {
  const pages: PageBeat[] = [];
  let start = DESK_PAGES_START;
  for (const [index, p] of plan.entries()) {
    const drawSeconds = round3(p.seconds - p.slideIn - p.hold);
    const drawStart = round3(start + p.slideIn);
    const drawEnd = round3(drawStart + drawSeconds);
    const end = round3(start + p.seconds);
    pages.push({
      page: index + 1,
      id: p.id,
      start,
      slideIn: p.slideIn,
      drawStart,
      drawSeconds,
      drawFrames: sec(drawSeconds),
      drawEnd,
      noteAt: round3(drawStart + drawSeconds * p.noteFraction),
      hold: p.hold,
      end,
      slideOut: window(end, round3(end + SLIDE_OUT_SECONDS)),
      foley: p.foley,
      masterStart: toMaster('desk', start),
    });
    start = end;
  }
  return pages;
};

export const DESK_PAGES: readonly PageBeat[] = buildPages(PAGE_PLAN);
export const deskPage = (id: SketchId): PageBeat => {
  const page = DESK_PAGES.find((p) => p.id === id);
  if (!page) throw new Error(`No desk page for ${id}`);
  return page;
};

/** Stroke-order fractions of the form-to-chat page (drawFrames = 225 on the desk, 37.5-45.0). */
export const FORM_TO_CHAT_FRACTIONS = {
  formOutline: [0.0, 0.08],
  formTitle: [0.08, 0.1],
  fields: [0.1, 0.3],
  placeholders: [0.12, 0.32],
  saveButton: [0.3, 0.33],
  pause: [0.33, 0.4],
  crossOut: [0.4, 0.47], // one heavy graphite stroke; lands on "Stop" (VO 6)
  pauseAfter: [0.47, 0.53],
  chatOutline: [0.53, 0.62],
  question: [0.62, 0.72],
  chipMom: [0.78, 0.84],
  chipDad: [0.84, 0.9],
  note: [0.9, 0.94],
  circle: [0.94, 1.0], // accent, around both chips, under "Just ask them"
} as const;

const formPage = deskPage('form-to-chat');
const formTime = (fraction: number): number => round3(formPage.drawStart + formPage.drawSeconds * fraction);

export const desk = {
  cutIn: 0.0,
  /** The wide desk, two pairs of hands entering. */
  establishing: window(0.0, 3.0),
  voStart: 1.0,
  pushToWorkArea: {...window(3.0, 3.5), scaleFrom: 0.8, scaleTo: 1.25, easing: 'easeOutCubic' as EasingName},
  pages: DESK_PAGES,
  /** Music lifts ("tempo up") at page 5 and page 10. */
  tempoUp: [21.0, 31.0] as const,
  vo4: 21.3,
  vo5: 31.3,
  /** Music drops away for the biggest idea. */
  musicDrops: 37.0,
  vo6: 38.0,
  formPushIn: {...window(37.0, 38.5), scaleFrom: 1.25, scaleTo: 1.45, easing: 'easeInOutCubic' as EasingName},
  form: {
    formDone: formTime(0.33),
    crossOut: window(formTime(0.4), formTime(0.47)),
    chatStart: formTime(0.53),
    chipMom: formTime(0.78),
    chipDad: formTime(0.84),
    circle: window(formTime(0.94), formTime(1.0)),
  },
  cut: 45.0,
} as const;

const deskBeats: readonly Beat[] = [
  beat('cut-in', 0.0, 'wide desk, hands enter'),
  beat('vo3', 1.0, 'VO 3 "We started with a person."'),
  ...DESK_PAGES.flatMap((p) => [
    beat(`p${p.page}-slide`, p.start, `page ${p.page} ${p.id} slides in`, {sfx: 'paper_drop', dur: p.slideIn, offGrid: !isOnGrid(p.start)}),
    beat(`p${p.page}-draw`, p.drawStart, `page ${p.page} draws (${p.drawFrames} frames)`, {dur: p.drawSeconds, offGrid: true}),
  ]),
  beat('tempo-up-1', 21.0, 'music lift as the mail pages start'),
  beat('vo4', 21.3, 'VO 4', {offGrid: true}),
  beat('tempo-up-2', 31.0, 'music lift as the Europe pages start'),
  beat('vo5', 31.3, 'VO 5', {offGrid: true}),
  beat('music-drops', 37.0, 'music drops away; the form page slides in'),
  beat('vo6', 38.0, 'VO 6'),
  beat('cross-out', 40.5, 'one heavy stroke crosses the form out, on "Stop"', {dur: 0.5}),
  beat('chip-mom', formTime(0.78), 'chip "Mom" drawn', {offGrid: true, estimate: true}),
  beat('chip-dad', formTime(0.84), 'chip "Dad" drawn', {offGrid: true, estimate: true}),
  beat('circle-chips', 44.5, 'accent circle around the chips, under "Just ask them"', {dur: 0.5}),
  beat('cut', 45.0, 'cut to the wall'),
];

// wall 1:20-1:31 (local 0-11): the grid, the rise, the push into the centre tile

export type WallTile = SketchId | 'phone';
/** Reading order of the 5x3 grid (wide). The centre tile is the redrawn binder home. */
export const WALL_GRID_WIDE: readonly (readonly WallTile[])[] = [
  ['v1-home', 'family-tabs', 'watch-wallet', 'pill-bottle', 'share-card'],
  ['scam-letter', 'passport', 'binder-home-v2', 'shared-costs', 'where-is-it'],
  ['visit-recording', 'europe-map', 'speech-bubbles', 'form-to-chat', 'phone'],
];
/** Reading order of the 3x5 grid (tall). Centre = row 3, column 2. */
export const WALL_GRID_TALL: readonly (readonly WallTile[])[] = [
  ['v1-home', 'family-tabs', 'watch-wallet'],
  ['pill-bottle', 'share-card', 'scam-letter'],
  ['passport', 'binder-home-v2', 'shared-costs'],
  ['where-is-it', 'visit-recording', 'europe-map'],
  ['speech-bubbles', 'form-to-chat', 'phone'],
];

/** Stroke-order fractions of the binder-home-v2 page. Base strokes finish at 0.70; the chips are the last thing drawn. */
export const BINDER_HOME_V2_FRACTIONS = {
  frame: [0.0, 0.12],
  tabs: [0.12, 0.24],
  card: [0.24, 0.42],
  deadlines: [0.42, 0.54],
  dock: [0.54, 0.64],
  two: [0.66, 0.7], // the accent "2" in the sheet's corner: drawn on paper before it is drawn in light
  pause: [0.7, 0.85],
  chipOne: [0.85, 0.9],
  chipTwo: [0.9, 0.95],
  circle: [0.95, 1.0],
} as const;

export const wall = {
  cutIn: 0.0,
  pulseStarts: 0.0,
  /** Two sheets land per beat (one per pair of hands); the phone goes face down into the last slot. */
  layout: {...window(0.0, 3.5), dropsAt: [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0] as const, sheetsPerDrop: 2, phoneDownAt: 3.5},
  centreSheetDropAt: 2.0,
  rise: {...window(0.0, 5.0), scaleFrom: 1.45, scaleTo: 0.78, easing: 'easeInOutQuint' as EasingName},
  stringsIn: 5.0,
  /** Ends on the transition's opening framing (the sketch's phone outline at 78% of frame height, wide). */
  pushIn: {...window(5.0, 11.0), scaleFrom: 0.78, easing: 'easeInOutCubic' as EasingName, nearlyStillFrom: 9.5},
  /**
   * The centre sheet arrives drawn up to fraction 0.70; the chips are drawn during the push-in.
   * Render the sketch in <Sequence from={-400}> with drawFrames 650: fraction 0.708 at local 2.0, 0.85 at 5.1, 1.0 at 8.3.
   */
  centreSheet: {
    sketch: 'binder-home-v2' as SketchId,
    sequenceFrom: -400,
    drawFrames: 650,
    baseDoneFraction: 0.7,
    chipsFrom: 0.85,
    chipsDrawn: window(5.1, 8.3),
    handClearBy: 9.0,
  },
  cut: 11.0,
} as const;

const wallBeats: readonly Beat[] = [
  beat('cut-in', 0.0, 'wide desk; pulse starts; both pairs of hands lay the grid'),
  ...wall.layout.dropsAt.map((t, i) => beat(`drop-${i + 1}`, t, 'two sheets land', {sfx: 'paper_drop'})),
  beat('centre-sheet', 2.0, 'the redrawn binder home lands in the centre tile'),
  beat('phone-down', 3.5, 'iPhone face down in the last slot', {sfx: 'phone_down'}),
  beat('rise-ends', 5.0, 'camera at the top of its rise; strings come in'),
  beat('push-in', 5.0, 'camera drops into the centre tile', {dur: 6.0}),
  beat('chips-drawn', 5.0, 'the hand draws the two chips and the accent circle on the centre sheet', {dur: 3.5}),
  beat('hand-clear', 9.0, 'hand out of frame; nothing moves but the camera'),
  beat('cut', 11.0, 'the lines catch light'),
];

// transition 1:31-1:48 (local 0-17): graphite to light, paper to void, line art to iPhone, four snaps

export type SnapGroup = 'tabs' | 'card' | 'deadlines' | 'chips';
export type SnapBeat = {n: 1 | 2 | 3 | 4; t: number; master: number; group: SnapGroup; strokePrefixes: readonly string[]; note: string};

/** Stroke ids of binder-home-v2 start with one of these prefixes; the transition groups them by it. */
export const SNAP_GROUPS: Record<SnapGroup, readonly string[]> = {
  tabs: ['tabs-'],
  card: ['card-'],
  deadlines: ['deadlines-', 'dock-'],
  chips: ['chips-'],
};

export const transition = {
  swell: 0.0,
  /** Strokes turn to light in stroke order, spread over this window; each takes perStrokeSeconds. */
  lightCatch: {...window(0.0, 5.0), perStrokeSeconds: 0.4},
  paperTextureFade: {...window(1.5, 6.5), easing: 'easeInOutSine' as EasingName},
  paperToBlack: {...window(2.5, 7.0), easing: 'easeInOutCubic' as EasingName},
  /** Everything outside the phone outline (the corner "2", the margins) goes with the paper. */
  offPhoneFade: window(6.0, 7.0),
  beatLocks: 7.0,
  liftOff: window(7.0, 9.0),
  perspective: {...window(7.0, 10.0), fovFrom: 0, fovTo: 28},
  rotationY: [
    {t: 7.0, value: 0},
    {t: 8.5, value: -8},
    {t: 17.0, value: 22},
  ] as readonly Keyframe[],
  rotationX: [
    {t: 7.0, value: 0},
    {t: 17.0, value: -5},
  ] as readonly Keyframe[],
  rotationEasing: 'easeInOutSine' as EasingName,
  edgeLight: {
    lap: window(7.0, 15.0),
    startCorner: 'topLeft',
    direction: 'clockwise',
    settle: {...window(15.0, 17.0), endCorner: 'topRight'},
  },
  snaps: [
    {n: 1, t: 10.0, master: 101.0, group: 'tabs', strokePrefixes: SNAP_GROUPS.tabs, note: 'sketched tab row -> the top bar (binder name + switcher)'},
    {n: 2, t: 12.0, master: 103.0, group: 'card', strokePrefixes: SNAP_GROUPS.card, note: 'sketched card -> the Next-up card'},
    {n: 3, t: 14.0, master: 105.0, group: 'deadlines', strokePrefixes: SNAP_GROUPS.deadlines, note: 'sketched date lines + dock -> the Later lines and the dock'},
    {n: 4, t: 16.0, master: 107.0, group: 'chips', strokePrefixes: SNAP_GROUPS.chips, note: 'sketched chips -> the helper chips'},
  ] as readonly SnapBeat[],
  snapSeconds: 0.3,
  snapFlare: 1.6,
  /** The state familyOfDevices must start from (its local 0.0). */
  handoff: {
    t: 17.0,
    rotationY: 22,
    rotationX: -5,
    phoneCentre: {wide: [0.5, 0.52], tall: [0.5, 0.5]} as const,
    phoneHeightFraction: {wide: 0.78, tall: 0.62} as const,
    edgeLightCorner: 'topRight',
    screen: 'binder-home, all four groups snapped',
  },
} as const;

const transitionBeats: readonly Beat[] = [
  beat('swell', 0.0, 'first stroke turns to light; strings swell'),
  beat('light-catch', 0.0, 'strokes convert in stroke order', {dur: 5.0}),
  beat('paper-fades', 1.5, 'paper texture and shadows fade', {dur: 5.0}),
  beat('black', 7.0, 'only light lines in black; the pulse locks to a beat'),
  beat('lift-off', 7.0, 'line art gains depth; the phone emerges and starts rotating', {dur: 2.0}),
  beat('edge-light-lap', 7.0, 'one lap of the edge light, clockwise from the top-left', {dur: 8.0}),
  ...transition.snaps.map((s) => beat(`snap-${s.group}`, s.t, s.note, {sfx: 'snap'})),
  beat('handoff', 17.0, 'rotation 22°; screen complete; light at the top-right corner'),
];

// familyOfDevices 1:48-1:53 (local 0-5)

export const familyOfDevices = {
  /** The hit: the card peels off the glass. */
  hit: 0.0,
  flip: window(0.0, 0.5),
  cardLands: 0.5,
  phoneSlide: {...window(0.0, 1.0), fromX: 0.5, toX: {wide: 0.36, tall: 0.5} as const, easing: 'keynote' as EasingName},
  watchIn: window(0.0, 0.5),
  walletHit: 2.0,
  walletSlide: {...window(2.0, 2.8), easing: 'keynote' as EasingName},
  settle: {...window(3.0, 5.0), glowTo: 0.7},
  hardCut: 5.0,
} as const;

const familyBeats: readonly Beat[] = [
  beat('hit', 0.0, 'the card flips off the phone', {sfx: 'card_flip'}),
  beat('card-lands', 0.5, 'the card seats on the Watch face', {sfx: 'snap'}),
  beat('wallet', 2.0, 'the Wallet pass slides out behind both', {sfx: 'wallet_slide'}),
  beat('settle', 3.0, 'light settles', {dur: 2.0}),
  beat('hard-stop', 5.0, 'everything cuts: picture and sound'),
];

// title 1:53-2:04 (local 0-11)

export const title = {
  black: window(0.0, 2.0),
  /** One full second of nothing, then silence holds to 2.0. */
  silence: window(0.0, 2.0),
  swellIn: 2.0,
  word: {...window(2.0, 3.5), text: 'Provisum', letterStagger: 0.12, letterFade: 0.6},
  strokeTwo: {...window(4.0, 5.0), completesAt: 5.0},
  resolve: 5.0,
  subline: {at: 7.0, fadeSeconds: 1.0, text: 'A binder for your whole family.'},
  cut: 11.0,
} as const;

const titleBeats: readonly Beat[] = [
  beat('black', 0.0, 'black and silent', {dur: 2.0}),
  beat('swell', 2.0, 'soft low swell; "Provisum" fades in letter by letter', {sfx: 'title_in'}),
  beat('two', 4.0, 'the accent pencil stroke of "2"', {dur: 1.0}),
  beat('resolve', 5.0, 'the stroke completes; music resolves'),
  beat('subline', 7.0, '"A binder for your whole family."'),
  beat('cut', 11.0, 'cut to the first feature'),
];

// realThing 2:04-2:20 (local 0-16): nine cuts of genuine footage, in the order of the pages

export type Framing = 'void' | 'bleed';
export type FeatureCut = {
  n: number;
  start: number;
  dur: number;
  end: number;
  master: number;
  /** The page this cut finishes (the one rule). */
  sketch: SketchId;
  /** Requested footage key; docs/FOOTAGE.md (footage agent) is the truth for file names. */
  footage: string;
  framing: Framing;
  /** Phone Y rotation in the void (degrees); ignored for bleed. */
  rotationY: number;
  note: string;
};

type CutPlan = Omit<FeatureCut, 'n' | 'start' | 'end' | 'master'>;
const CUT_PLAN: readonly CutPlan[] = [
  {dur: 2.0, sketch: 'family-tabs', footage: 'family-tabs', framing: 'void', rotationY: -12, note: 'the binder switcher: Mom, Dad, Me, a child, a pet'},
  {dur: 1.5, sketch: 'watch-wallet', footage: 'watch-card', framing: 'bleed', rotationY: 0, note: 'the emergency card on the Watch face (watch rig, tight)'},
  {dur: 2.0, sketch: 'pill-bottle', footage: 'refill-reminder', framing: 'void', rotationY: 10, note: 'medication list on the card; a refill reminder row'},
  {dur: 1.5, sketch: 'scam-letter', footage: 'scam-note', framing: 'bleed', rotationY: 0, note: 'the scanned letter with its scam note; crop on the banner'},
  {dur: 2.0, sketch: 'passport', footage: 'passport-reminder', framing: 'void', rotationY: -8, note: 'the passport with its 9/6/3-month reminders'},
  {dur: 1.5, sketch: 'shared-costs', footage: 'shared-costs', framing: 'bleed', rotationY: 0, note: 'who paid what; crop on the summary'},
  {dur: 2.0, sketch: 'visit-recording', footage: 'visit-summary', framing: 'void', rotationY: 14, note: 'the visit summary (private transcript and summary)'},
  {dur: 1.5, sketch: 'europe-map', footage: 'call-112', framing: 'bleed', rotationY: 0, note: 'Belgian binder, emergency mode, the red Call 112 button'},
  {dur: 2.0, sketch: 'form-to-chat', footage: 'onboarding-chips', framing: 'void', rotationY: 0, note: '"Who are you looking after?" with its chips; faces camera for the pair'},
];

const buildCuts = (plan: readonly CutPlan[]): readonly FeatureCut[] => {
  const cuts: FeatureCut[] = [];
  let start = 0;
  for (const [index, c] of plan.entries()) {
    const end = round3(start + c.dur);
    cuts.push({...c, n: index + 1, start, end, master: toMaster('realThing', start)});
    start = end;
  }
  return cuts;
};

export const FEATURE_CUTS: readonly FeatureCut[] = buildCuts(CUT_PLAN);

export const realThing = {
  lift: 0.0,
  vo7: 0.5,
  cuts: FEATURE_CUTS,
  end: 16.0,
} as const;

const realThingBeats: readonly Beat[] = [
  beat('lift', 0.0, 'rhythmic ostinato under the cuts'),
  beat('vo7', 0.5, 'VO 7'),
  ...FEATURE_CUTS.map((c) => beat(`cut-${c.n}`, c.start, `${c.footage} (${c.framing}, ${c.dur}s)`, {dur: c.dur})),
];

// pair 2:20-2:25 (local 0-5)

export const pair = {
  peak: 0.0,
  sweep: window(1.0, 2.5),
  hold: window(2.5, 4.0),
  dim: {...window(4.0, 5.0), glowTo: 0.4},
  cut: 5.0,
} as const;

const pairBeats: readonly Beat[] = [
  beat('peak', 0.0, 'phone and Watch side by side; music peak'),
  beat('sweep', 1.0, 'one band of light sweeps both devices, left to right', {dur: 1.5}),
  beat('dim', 4.0, 'light dims to 40%', {dur: 1.0}),
  beat('cut', 5.0, 'hard cut to warm paper'),
];

// backToDesk 2:25-2:33 (local 0-8)

export const backToDesk = {
  cutIn: 0.0,
  pushIn: {...window(0.0, 8.0), scaleFrom: 1.0, scaleTo: 1.08, easing: 'easeInOutSine' as EasingName},
  vo8: 1.0,
  /** The closing line, in Caladea italic, lands under "provided for". ESTIMATE. */
  closingLine: {at: 3.0, fadeSeconds: 0.6, text: 'Provided for.'},
  handIn: 3.0,
  /** The pencil is lowered and STOPS just above the paper; the click is heard on the end card. */
  pencilLower: window(4.0, 7.5),
  hover: window(7.5, 8.0),
  cut: 8.0,
} as const;

const backToDeskBeats: readonly Beat[] = [
  beat('cut-in', 0.0, 'warm paper; the real iPhone face up on the centre tile'),
  beat('vo8', 1.0, 'VO 8'),
  beat('closing-line', 3.0, '"Provided for." in Caladea italic', {estimate: true}),
  beat('hand-in', 3.0, 'the hand enters with the pencil'),
  beat('pencil-lower', 4.0, 'pencil lowered beside the phone; stops a hair above the paper', {dur: 3.5}),
  beat('cut', 8.0, 'cut to the end card'),
];

// endCard 2:33-2:40 (local 0-7)

export const endCard = {
  titleIn: window(0.0, 1.0),
  lineIn: window(1.0, 2.0),
  markIn: window(2.0, 3.0),
  /** The final chord has decayed; nothing sounds until the click. */
  musicEndsBy: 4.0,
  /** The last sound of the film. */
  pencilClick: 5.0,
  end: 7.0,
} as const;

const endCardBeats: readonly Beat[] = [
  beat('title', 0.0, '"Provisum 2" fades in'),
  beat('line', 1.0, '"Free on the App Store"'),
  beat('mark', 2.0, 'the Veyago mark'),
  beat('music-ends', 4.0, 'final chord has decayed'),
  beat('pencil-click', 5.0, 'the pencil touches the desk: the last sound', {sfx: 'pencil_click'}),
  beat('end', 7.0, 'end of film'),
];

// Index and validation

export const BEATS: Record<ModuleId, readonly Beat[]> = {
  coldOpen: coldOpenBeats,
  desk: deskBeats,
  wall: wallBeats,
  transition: transitionBeats,
  familyOfDevices: familyBeats,
  title: titleBeats,
  realThing: realThingBeats,
  pair: pairBeats,
  backToDesk: backToDeskBeats,
  endCard: endCardBeats,
};

/** Music map v1 anchors (CONTRACT §7) converted to module-local seconds, for the music engineer's reference. */
const MUSIC_MAP_MASTER: readonly (readonly [number, string])[] = [
  [6, 'felt piano enters'],
  [20, 'piano thins'],
  [28, 'first chord (note smoothed flat)'],
  [35, 'piano builds'],
  [56, 'tempo up'],
  [66, 'tempo up again'],
  [72, 'music drops away'],
  [80, 'soft pulse starts'],
  [85, 'strings in'],
  [91, 'swell: lines catch light'],
  [98, 'pulse locks to a beat'],
  [101, 'snap 1'],
  [103, 'snap 2'],
  [105, 'snap 3'],
  [107, 'snap 4'],
  [108, 'hit: card flips to the Watch'],
  [110, 'hit: Wallet pass'],
  [113, 'HARD STOP'],
  [115, 'soft swell; "Provisum"'],
  [118, '"2" completes; resolve'],
  [124, 'lift: ostinato under the cuts'],
  [140, 'peak: the pair'],
  [141, 'light sweep'],
  [145, 'felt piano alone'],
  [153, 'final chord decays'],
  [157, 'ends cleanly'],
  [158, 'pencil click (foley)'],
];
export const MUSIC_MAP_LOCAL: readonly {master: number; module: ModuleId; local: number; event: string}[] =
  MUSIC_MAP_MASTER.map(([master, event]) => {
    const module = moduleAt(master);
    return {master, module, local: toLocal(module, master), event};
  });

/** Problems in the beat sheet: times outside their slot, or sync points off the grid. Empty when clean. */
export const validateBeats = (): readonly string[] => {
  const problems: string[] = [];
  for (const slot of SLOTS) {
    for (const b of BEATS[slot.id]) {
      const length = slotSeconds(slot.id);
      if (b.t < 0 || b.t > length) problems.push(`${slot.id}/${b.id}: ${b.t}s outside 0-${length}s`);
      if (b.dur !== undefined && b.t + b.dur > length + 1e-6) problems.push(`${slot.id}/${b.id}: window ends past the slot`);
      if (!b.offGrid && !b.estimate && !isOnGrid(b.t)) problems.push(`${slot.id}/${b.id}: ${b.t}s is off the 0.5 s grid`);
    }
  }
  for (const line of VO) {
    const length = slotSeconds(line.module);
    if (line.start < 0 || line.start > length) problems.push(`VO ${line.n} starts outside ${line.module}`);
    // One frame of tolerance: VO 1 lands within 4 ms of its deadline at the estimate (DECISIONS #6).
    if (line.mustEndByMaster !== undefined && line.estimatedMasterEnd > line.mustEndByMaster + ONE_FRAME_SECONDS) {
      problems.push(`VO ${line.n} estimated to end at ${line.estimatedMasterEnd}s, after ${line.mustEndByMaster}s`);
    }
  }
  const lastPage = DESK_PAGES[DESK_PAGES.length - 1];
  if (!lastPage || lastPage.end !== slotSeconds('desk')) problems.push('desk pages do not end with the desk slot');
  const lastCut = FEATURE_CUTS[FEATURE_CUTS.length - 1];
  if (!lastCut || lastCut.end !== slotSeconds('realThing')) problems.push('feature cuts do not fill the realThing slot');
  return problems;
};
