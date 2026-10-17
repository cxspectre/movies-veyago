// beats4.ts — the beat sheet of the long film (v4): every audio-visual sync point, per chapter, in MODULE-LOCAL
// seconds on the 0.5 s grid. Follows src/beats.ts. Chapter slots come from src/film4.ts (S0-B); the sheet, line
// and camera from src/sheet4.ts; the reasoning from docs/v4/BIBLE4.md. Nobody re-types a number.

import type {ChapterId} from './film4';
import {SLOTS4, slotOf4} from './film4';
import {sec} from './film';
import type {SfxName} from './audio/cues';
import type {EasingName} from './beats';
import {GRID_SECONDS, estimateVoSeconds, isOnGrid, wordCount} from './beats';
import {VISITS, VISIT_HOLD_SECONDS, validateSheet4} from './sheet4';

// Vocabulary

/** The sound families v4 adds to the v1 SfxName set (BIBLE4 §7.4); the integrator adds them to cues.ts. */
export type NewSfxName = 'fold' | 'scissors' | 'crumple' | 'stamp' | 'string' | 'odometer' | 'train' | 'plane' | 'rocket' | 'marble_run' | 'pin' | 'padlock';
export type SfxName4 = SfxName | NewSfxName;

export type Voice = 'FOUNDER' | 'MAKER' | 'MAYA';
export type Ink = 'graphite' | 'accent' | 'sepia' | 'glass';

/** The voice inks (BIBLE4 §3). Graphite and accent are COLORS in film.ts; sepia is Maya's. */
export const INK4 = {
  sepia: '#7A4A2A',
  sepiaSoft: '#A8795A',
  sepiaLight: '#F2CFA8',
} as const;
export const VOICE_INK: Record<Voice, Ink> = {FOUNDER: 'graphite', MAKER: 'accent', MAYA: 'sepia'};

/** House wallpapers in the village (the light "leading" stop of each; docs/v4/CLAIMS-additions.md). */
export const HOUSE_WALLPAPER: Record<string, {wallpaper: string; hex: string}> = {
  Dad: {wallpaper: 'mist', hex: '#B4DCFE'},
  Leo: {wallpaper: 'seaGlass', hex: '#9DE5D6'},
  Mia: {wallpaper: 'blush', hex: '#FECAD2'},
  Maya: {wallpaper: 'lavender', hex: '#DBD2FD'},
  Jonas: {wallpaper: 'sage', hex: '#B9E2B4'},
  Biscuit: {wallpaper: 'apricot', hex: '#FFD1B5'},
  Sam: {wallpaper: 'dusk', hex: '#FED0C1'},
};

export type Beat4 = {
  id: string;
  /** Module-local seconds. */
  t: number;
  dur?: number;
  note: string;
  sfx?: SfxName4;
  /** Depends on the VO read; moves once real word times arrive. */
  estimate?: boolean;
  offGrid?: boolean;
};

export type Window = {from: number; to: number};
export type SuperSpace = 'sheet' | 'screen';
export type Super = {
  t: number;
  /** Seconds on screen including the write and the fade. */
  dur: number;
  text: string;
  ink: Ink;
  space: SuperSpace;
};

const round3 = (n: number): number => Math.round(n * 1000) / 1000;
const window = (from: number, to: number): Window => ({from, to});
const beat = (id: string, t: number, note: string, extra: Partial<Omit<Beat4, 'id' | 't' | 'note'>> = {}): Beat4 => ({id, t, note, ...extra});
const sup = (t: number, dur: number, text: string, ink: Ink, space: SuperSpace = 'sheet'): Super => ({t, dur, text, ink, space});

// Helpers (public API)

export const chapterSeconds = (id: ChapterId): number => slotOf4(id).end - slotOf4(id).start;
export const toLocal4 = (id: ChapterId, master: number): number => round3(master - slotOf4(id).start);
export const toMaster4 = (id: ChapterId, local: number): number => round3(local + slotOf4(id).start);
export const chapterAt = (master: number): ChapterId => {
  const slot = SLOTS4.find((s) => master >= s.start && master < s.end) ?? SLOTS4[SLOTS4.length - 1];
  if (!slot) throw new Error('No chapter slots');
  return slot.id;
};
/** Module-local seconds -> module-local frame. Throws outside the chapter. */
export const beatFrames4 = (id: ChapterId, local: number): number => {
  if (local < 0 || local > chapterSeconds(id)) throw new Error(`Beat ${local}s is outside chapter ${id} (0-${chapterSeconds(id)}s)`);
  return sec(local);
};

// The three voices (docs/SCRIPT-10MIN-v4.md, verbatim; starts on the grid, ends estimated as in v1)

export type VoLine4 = {
  id: string;
  voice: Voice;
  chapter: ChapterId;
  masterStart: number;
  start: number;
  text: string;
  words: number;
  /** ESTIMATE: 2.3 words/s + 0.4 s per sentence break (MAYA reads at 2.0 words/s). */
  estimatedEnd: number;
  estimatedMasterEnd: number;
};

const MAYA_WORDS_PER_SECOND = 2.0;
const MAYA_SLOWDOWN = 2.3 / MAYA_WORDS_PER_SECOND;

const vo = (id: string, voice: Voice, chapter: ChapterId, start: number, text: string): VoLine4 => {
  const seconds = voice === 'MAYA' ? round3(estimateVoSeconds(text) * MAYA_SLOWDOWN) : estimateVoSeconds(text);
  const estimatedEnd = round3(start + seconds);
  return {id, voice, chapter, masterStart: toMaster4(chapter, start), start, text, words: wordCount(text), estimatedEnd, estimatedMasterEnd: toMaster4(chapter, estimatedEnd)};
};

export const VO4: readonly VoLine4[] = [
  vo('F1', 'FOUNDER', 'line', 7.0, 'This is the story of one app. From a no, to a launch, to a binder for everyone you call family.'),
  vo('Y1', 'MAYA', 'mayasHouse', 4.0, "Some weeks I'm the mom, the daughter, and the one who knows where everything is."),
  vo('Y2', 'MAYA', 'mayasHouse', 11.5, "My dad's insurance. The kids' passports. And Sam's car registration, because he's in Lisbon for a year and I'm the one he trusts."),
  vo('F2', 'FOUNDER', 'mayasHouse', 36.0, 'We wanted to build something for her. But first, we had to fail at something else.'),
  vo('F3', 'FOUNDER', 'theNo', 0.0, "Our first app was turned down twice. It wasn't different enough. Apple was right."),
  vo('F4', 'FOUNDER', 'theNo', 15.0, 'So we stopped resubmitting and held on to the one thing that was good.'),
  vo('F5', 'FOUNDER', 'theNo', 31.0, 'On the twenty-first of September, we started again.'),
  vo('M1', 'MAKER', 'filterMachine', 0.0, 'Before we had one idea, we built the filter that every idea had to pass.'),
  vo('M2', 'MAKER', 'filterMachine', 7.0, 'Useful for years. Not something the phone already does. Private by design. Buildable in weeks, not years. And a business from day one.'),
  vo('F6', 'FOUNDER', 'filterMachine', 35.5, 'One idea made it through all five. We started with the hardest version: looking after a parent.'),
  vo('M3', 'MAKER', 'researchBoard', 0.0, 'Next, we stopped guessing.'),
  vo('M4', 'MAKER', 'researchBoard', 4.0, 'We searched the store like a tired person at eleven at night. We read the one-star reviews. And every form and rule in the app comes from whoever publishes it. States, Medicare, the FTC.'),
  vo('M5', 'MAKER', 'researchBoard', 48.0, 'Six building blocks. Everything the app does is one of them, or a mix of them.'),
  vo('F7', 'FOUNDER', 'nameAndLook', 0.0, 'For a few days it was called On Behalf. Then we found a better word.'),
  vo('F8', 'FOUNDER', 'nameAndLook', 7.0, 'Provisum. Latin for provided for. What you want everyone you love to be.'),
  vo('M6', 'MAKER', 'nameAndLook', 17.0, 'Then the look. Calm, because people open this app on hard days.'),
  vo('M7', 'MAKER', 'nameAndLook', 44.0, 'Every screen was checked at the biggest text sizes. When something broke, we redesigned the screen, not the text.'),
  vo('M8', 'MAKER', 'engineRoom', 0.0, 'Native Swift, for iPhone, Apple Watch and widgets. Nothing in between.'),
  vo('M9', 'MAKER', 'engineRoom', 18.0, 'Everything belongs to a binder, and a binder belongs to a person: your dad, your daughter, yourself, your partner, a friend, even the dog.'),
  vo('M10', 'MAKER', 'engineRoom', 28.5, 'Every date from every source joins one list and gets the reminder that fits it. Passports get nine, six and three months. A bill gets the day before.'),
  vo('M11', 'MAKER', 'engineRoom', 44.0, 'There is no Veyago server. Your data lives on your phone and in your own iCloud. Sharing goes straight to the people you invite.'),
  vo('M12', 'MAKER', 'engineRoom', 56.0, 'The emergency card is encrypted on your iPhone before it goes anywhere.'),
  vo('F9', 'FOUNDER', 'engineRoom', 64.0, 'We carried the engine over from our first app, and rebuilt everything around it.'),
  vo('F10', 'FOUNDER', 'launch', 0.0, 'And App Review said yes.'),
  vo('F11', 'FOUNDER', 'launch', 15.0, "We launched in the United States, where Veyago does business, with its states' forms and Medicare built in."),
  vo('F12', 'FOUNDER', 'launch', 26.0, 'On day one we got the price wrong. On day two we fixed it.'),
  vo('F13', 'FOUNDER', 'launch', 35.5, "Then we looked at what we'd built, and at who we'd left out."),
  vo('Y3', 'MAYA', 'launch', 45.0, 'It was never only my dad.'),
  vo('F14', 'FOUNDER', 'village', 1.0, 'Version one was a binder for a parent. Nobody looks after just one person.'),
  vo('Y4', 'MAYA', 'village', 29.0, "Sam's car, Dad's medications, the kids' passports. Same place. Same calm."),
  vo('M13', 'MAKER', 'village', 63.0, 'And the biggest change: no more forms. Provisum asks one question at a time.'),
  vo('M14', 'MAKER', 'paperToGlass', 25.5, "Every person gets the documents, dates and packets that fit them. A child's binder isn't a parent's."),
  vo('F15', 'FOUNDER', 'paperToGlass', 48.0, 'Everything we drew.'),
  vo('M15', 'MAKER', 'paperToGlass', 50.0, 'Built natively. Tested at every text size.'),
  vo('Y5', 'MAYA', 'paperToGlass', 54.0, "And it's all on my phone. Not on anyone's server."),
  vo('F16', 'FOUNDER', 'providedFor', 14.0, "Provisum. It's Latin for provided for. For everyone you call family."),
];
export const voLine4 = (id: string): VoLine4 => {
  const line = VO4.find((v) => v.id === id);
  if (!line) throw new Error(`No VO ${id}`);
  return line;
};
export const voWords = (voice: Voice): number => VO4.filter((v) => v.voice === voice).reduce((n, v) => n + v.words, 0);
/** The voice speaking at a module-local time (by the estimates), or undefined. */
export const voiceAt = (chapter: ChapterId, t: number): Voice | undefined =>
  VO4.find((v) => v.chapter === chapter && t >= v.start && t < v.estimatedEnd)?.voice;

// Supers (BIBLE4 §5: text / ink / window). A sheet super is written by the line; a screen super is type over the frame.

export const SUPERS: Record<ChapterId, readonly Super[]> = {
  line: [sup(1.5, 6.0, 'Every app starts as a line.', 'graphite'), sup(20.0, 6.0, 'Provisum 2. How it was made, and why.', 'graphite', 'screen')],
  mayasHouse: [sup(22.0, 6.5, 'Every family has someone who holds it together.', 'sepia'), sup(34.0, 6.5, 'And every family is bigger than its tree.', 'graphite')],
  theNo: [sup(13.0, 7.5, 'Keep the engine. Find a new reason.', 'graphite')],
  filterMachine: [],
  researchBoard: [
    sup(5.0, 4.0, 'Does it already exist?', 'accent'),
    sup(9.0, 4.0, 'What do people really type?', 'accent'),
    sup(13.0, 4.0, 'What do the others get wrong?', 'accent'),
    sup(17.0, 4.0, 'Who publishes the real rules?', 'accent'),
    sup(38.0, 6.5, 'The gap: all of it, for everyone, privately.', 'graphite'),
    sup(48.0, 7.5, 'Six building blocks. Everything else hangs off them.', 'accent'),
  ],
  nameAndLook: [
    sup(23.5, 4.0, 'One accent. Nothing shouts.', 'glass', 'screen'),
    sup(29.0, 4.0, 'Every person gets their own colour.', 'glass', 'screen'),
    sup(36.0, 3.5, 'Ask one question at a time.', 'glass', 'screen'),
    sup(40.5, 3.0, 'Readable on the worst night of your life.', 'glass', 'screen'),
    sup(44.0, 4.0, 'Dozens of versions. One home screen.', 'glass', 'screen'),
  ],
  engineRoom: [
    sup(10.0, 8.5, 'Every feature has its own room.', 'graphite'),
    sup(22.0, 6.5, 'One person. Everything that belongs to them.', 'accent'),
    sup(36.0, 6.5, 'All the dates. One list. The right reminder.', 'accent'),
    sup(50.0, 6.5, 'No server. No account. Data Not Collected.', 'accent'),
  ],
  launch: [sup(15.0, 6.5, 'United States first. On purpose.', 'graphite'), sup(25.0, 6.5, 'Day one: a mistake. Day two: fixed.', 'graphite')],
  village: [sup(0.0, 7.5, 'Version 2: a binder for everyone you call family.', 'graphite'), sup(57.0, 5.5, 'Five countries. Five languages.', 'graphite')],
  paperToGlass: [
    sup(25.0, 5.0, 'Every person. Their own binder. Their own colour.', 'glass', 'screen'),
    sup(37.0, 4.0, 'Apple Watch. Apple Wallet.', 'glass', 'screen'),
    sup(62.0, 5.0, 'Share a binder with anyone you trust.', 'glass', 'screen'),
    sup(75.0, 4.5, 'A binder for your whole family. And the friends who are family.', 'glass', 'screen'),
  ],
  providedFor: [sup(3.0, 8.0, 'A no. Five filters. One idea. A whole village.', 'graphite', 'screen')],
};

// Chapter 1: line 0:00-0:30

export const line = {
  black: window(0.0, 0.5), pencilDown: 0.5, lineStarts: 1.0,
  superWrite: window(1.5, 4.5), superResolve: window(4.5, 5.5), vo: 7.0,
  /** The four quick sketches drawn in passing, each held 0.5 s. */
  detours: [
    {id: 'heart-rate', draw: window(7.0, 8.5), hold: 9.0},
    {id: 'calendar', draw: window(9.0, 11.0), hold: 11.5},
    {id: 'passport', draw: window(11.5, 13.5), hold: 14.0},
    {id: 'key', draw: window(14.0, 16.0), hold: 16.5},
  ] as const,
  pullBack: {...window(18.0, 22.0), easing: 'easeInOutQuint' as EasingName}, glimpsesIn: window(19.0, 21.0), farHold: window(22.0, 26.0),
  dive: {...window(26.0, 30.0), easing: 'easeInOutCubic' as EasingName}, corner: 27.0, houseOutline: window(27.0, 30.0),
} as const;

const lineBeats: readonly Beat4[] = [
  beat('pencil-down', 0.5, 'the tip touches the paper', {sfx: 'pencil_down'}),
  beat('line', 1.0, 'the line starts; pencil scratch continuous to 30.0', {dur: 29.0}),
  beat('super-1', 1.5, '"Every app starts as a line." written by the line', {dur: 3.0}),
  beat('piano-in', 6.0, 'felt piano enters'),
  beat('vo-f1', 7.0, 'F1'),
  ...line.detours.map((d) => beat(`detour-${d.id}`, d.draw.from, `${d.id} drawn in passing`, {dur: d.draw.to - d.draw.from})),
  beat('chord', 18.0, 'the chord as the camera lifts'),
  beat('pull-back', 18.0, 'the whole sheet; the glimpses', {dur: 4.0}),
  beat('super-2', 20.0, '"Provisum 2. How it was made, and why." (screen)', {dur: 6.0}),
  beat('dive', 26.0, 'dive to the house', {dur: 4.0}),
  beat('corner', 27.0, 'the line turns the corner'),
];

// Chapter 2: mayasHouse 0:30-1:15

export const mayasHouse = {
  popUp: window(0.0, 1.5),
  cutouts: {...window(1.5, 3.5), each: 0.4, labels: ['letter', 'school form', 'passport', 'insurance card', "Sam's papers"] as const},
  mayaDraws: window(4.0, 6.5),
  papersFly: [
    {paper: 'insurance card', lift: 11.0, label: "Dad's insurance", labelAt: 11.5},
    {paper: 'passports', lift: 13.5, label: "The kids' passports", labelAt: 14.0},
    {paper: 'car registration', lift: 16.5, label: "Sam's car registration", labelAt: 17.0},
  ] as const,
  labelSeconds: 2.0,
  storm: {...window(22.0, 28.0), revPerSecond: [0.25, 0.75] as const, radius: [260, 200] as const},
  freeze: 28.0,
  pullBack: {...window(28.0, 31.0), easing: 'easeInOutCubic' as EasingName},
  tree: {...window(28.5, 34.0), stagger: 0.5, nodes: ['Dad', 'Maya', 'Jonas', 'Leo', 'Mia', 'Biscuit'] as const},
  branch: window(34.0, 36.5),
  plane: 36.0,
  voF2: 36.0,
  lineLeaves: window(40.0, 45.0),
} as const;

const mayasHouseBeats: readonly Beat4[] = [
  beat('pop-up', 0.0, 'the house folds up off the page', {sfx: 'fold', dur: 1.5}),
  beat('cutouts', 1.5, 'table and five cutouts pop up, 0.4 s each', {sfx: 'fold', dur: 2.0}),
  beat('maya', 4.0, 'Maya draws in (sepia)', {dur: 2.5}),
  beat('vo-y1', 4.0, 'Y1'),
  beat('vo-y2', 11.5, 'Y2'),
  ...mayasHouse.papersFly.map((p) => beat(`fly-${p.paper.replace(/\s/g, '-')}`, p.lift, `${p.paper} lifts (a slide cue: a flutter); label "${p.label}"`)),
  beat('storm', 22.0, 'the papers storm; her line wobbles', {dur: 6.0}),
  beat('super-storm', 22.0, '"Every family has someone who holds it together." (sepia)', {dur: 3.0}),
  beat('freeze', 28.0, 'everything stops on one frame; one beat of rest'),
  beat('tree', 28.5, 'papers fly to the family tree', {dur: 5.5}),
  beat('super-tree', 34.0, '"And every family is bigger than its tree."', {dur: 3.0}),
  beat('plane', 36.0, 'the paper plane "Sam, Lisbon" folds', {sfx: 'plane'}),
  beat('vo-f2', 36.0, 'F2'),
  beat('line-leaves', 40.0, 'the line leaves the house', {dur: 5.0}),
];

// Chapter 3: theNo 1:15-1:55

export const theNo = {
  letters: window(0.0, 3.0),
  rejected: [2.0, 3.0] as const,
  circles: window(3.5, 4.5),
  guideline: {at: 5.0, text: '4.3(a)', note: 'Design - Spam', noteAt: 6.0},
  crumple: window(10.0, 12.0),
  engineUnfolds: window(13.0, 18.0),
  gears: ['storage', 'sync', 'reminders', 'export'] as const,
  gearsTurnFrom: 18.0,
  scissors: {...window(20.0, 23.0), snips: [20.5, 21.5, 22.5] as const},
  split: {...window(23.0, 27.0), keepLabelAt: 24.0, fade: window(25.0, 27.0)},
  calendar: {drop: 28.0, land: 28.5, circle: 30.0, date: {at: 30.5, text: '21 September 2026'}},
  carry: window(36.0, 40.0),
} as const;

const theNoBeats: readonly Beat4[] = [
  beat('letters', 0.0, 'two letters draw', {dur: 3.0}),
  beat('vo-f3', 0.0, 'F3'),
  beat('rejected-1', 2.0, '"Rejected" writes on the first letter'),
  beat('rejected-2', 3.0, '"Rejected" writes on the second letter'),
  beat('circles', 3.5, 'accent circles around both', {dur: 1.0}),
  beat('guideline', 5.0, 'number roll 4.3(a)', {sfx: 'odometer', dur: 1.0}),
  beat('crumple', 10.0, 'the letters crumple into a ball', {sfx: 'crumple', dur: 2.0}),
  beat('engine', 13.0, 'the ball unfolds into the engine cutaway', {sfx: 'fold', dur: 5.0}),
  beat('super-engine', 13.0, '"Keep the engine. Find a new reason."', {dur: 3.0}),
  beat('vo-f4', 15.0, 'F4'),
  ...theNo.scissors.snips.map((t, i) => beat(`snip-${i + 1}`, t, 'the scissors cut', {sfx: 'scissors'})),
  beat('split', 23.0, 'engine slides to "keep"; the old idea fades, blurred', {dur: 4.0}),
  beat('calendar', 28.5, 'the calendar page lands', {sfx: 'paper_drop'}),
  beat('circle-21', 30.0, 'the 21 is circled'),
  beat('date', 30.5, 'number roll 21 September 2026', {sfx: 'odometer', dur: 1.0}),
  beat('vo-f5', 31.0, 'F5'),
  beat('carry', 36.0, 'the engine rides the line to the machine (a slide cue)', {dur: 4.0}),
];

// Chapter 4: filterMachine 1:55-2:50

export const filterMachine = {
  popUp: {...window(0.0, 4.0), parts: ['hopper', 'body', 'gates', 'tray'] as const},
  cards: {count: 24, first: 7.0, every: 1.0, last: 29.5, fallPxPerSecond: 500, bounceSeconds: 0.2, stoppedPerGate: [7, 6, 5, 3, 2] as const},
  gateLabels: [
    {gate: 1, at: 7.5, text: 'Useful for years, not for a week'},
    {gate: 2, at: 9.5, text: 'Not something the iPhone already does'},
    {gate: 3, at: 12.5, text: 'Private: no account, no tracking'},
    {gate: 4, at: 14.5, text: 'Buildable in six to eight weeks'},
    {gate: 5, at: 17.0, text: 'Free to start, paid to unlock'},
  ] as const,
  marbleRun: window(7.0, 35.0),
  cardLands: 35.0,
  unfold: window(35.5, 38.5),
  cardText: {...window(36.5, 39.5), text: "A binder for the one who holds the family's papers."},
  flyHome: {...window(47.0, 50.0), easing: 'keynote' as EasingName},
  mayaLooksUp: window(50.0, 50.5),
  leap: window(51.0, 55.0),
} as const;

const filterMachineBeats: readonly Beat4[] = [
  ...filterMachine.popUp.parts.map((p, i) => beat(`fold-${p}`, i, `${p} folds up`, {sfx: 'fold'})),
  beat('vo-m1', 0.0, 'M1'),
  beat('vo-m2', 7.0, 'M2'),
  beat('marble-run', 7.0, 'cards rain; stamps on the stopped ones', {sfx: 'marble_run', dur: 28.0}),
  ...filterMachine.gateLabels.map((g) => beat(`gate-${g.gate}`, g.at, `gate ${g.gate}: "${g.text}"`, {dur: 1.5, estimate: true})),
  beat('card-lands', 35.0, 'the one card lands in the tray', {sfx: 'paper_drop'}),
  beat('unfold', 35.5, 'it unfolds and writes itself', {sfx: 'fold', dur: 3.0}),
  beat('vo-f6', 35.5, 'F6'),
  beat('fly-home', 47.0, 'the card flies to Maya\'s house', {sfx: 'plane', dur: 3.0}),
  beat('look-up', 50.0, 'Maya looks up', {dur: 0.5}),
  beat('leap', 51.0, 'the leap to the board', {dur: 4.0}),
];

// Chapter 5: researchBoard 2:50-3:55

export const researchBoard = {
  frame: window(0.0, 2.5),
  pins: window(2.5, 4.0),
  cards: [
    {at: 4.0, label: 'The store', footage: 'capture: store-search (drawn)'},
    {at: 8.0, label: 'The suggestions', footage: 'capture: terminal-suggestions (drawn)'},
    {at: 12.0, label: 'The reviews', footage: 'capture: reviews-blurred (drawn)'},
    {at: 16.0, label: 'The rules', footage: 'capture: official-forms'},
  ] as const,
  cardPinAfter: 0.3,
  cardScreenAfter: 1.0,
  string: {...window(30.0, 33.0), tight: window(32.0, 33.0)},
  chart: {axes: window(33.0, 34.5), labels: window(34.5, 36.0), dots: window(36.0, 38.0), circle: window(38.0, 39.5)},
  peel: window(45.0, 47.0),
  boxes: [
    {at: 46.0, label: 'Documents'}, {at: 47.5, label: 'Dates'}, {at: 49.0, label: 'Bills'},
    {at: 50.5, label: 'People'}, {at: 52.0, label: 'Emergency card'}, {at: 53.5, label: 'Packets'},
  ] as const,
  stack: {...window(58.0, 60.5), every: 0.5},
  roll: window(61.0, 65.0),
} as const;

const researchBoardBeats: readonly Beat4[] = [
  beat('frame', 0.0, 'the board draws', {dur: 2.5}),
  beat('vo-m3', 0.0, 'M3'),
  beat('pins', 2.5, 'six pins', {sfx: 'pin', dur: 1.5}),
  beat('vo-m4', 4.0, 'M4'),
  ...researchBoard.cards.flatMap((c, i) => [
    beat(`card-${i + 1}`, c.at, `${c.label} slides in`, {sfx: 'paper_drop'}),
    beat(`pin-${i + 1}`, c.at + 0.5, `${c.label} pinned`, {sfx: 'pin'}),
  ]),
  beat('string', 30.0, 'the string runs and pulls tight', {sfx: 'string', dur: 3.0}),
  beat('chart', 33.0, 'the 2x2 draws at the crossing', {dur: 5.0}),
  beat('dots', 36.0, 'seven blank pins along the edges', {sfx: 'pin', dur: 2.0}),
  beat('gap', 38.0, 'accent circle on the empty corner', {dur: 1.5}),
  beat('peel', 45.0, 'the cards peel off', {sfx: 'fold', dur: 2.0}),
  ...researchBoard.boxes.map((b) => beat(`box-${b.label.toLowerCase().replace(/\s/g, '-')}`, b.at, `box "${b.label}" folds up`, {sfx: 'fold'})),
  beat('vo-m5', 48.0, 'M5'),
  beat('stack', 58.0, 'boxes jump onto the hand truck', {sfx: 'paper_drop', dur: 2.5}),
  beat('roll', 61.0, 'the truck rolls along the line (a slide cue; two wheel squeaks)', {dur: 4.0}),
];

// Chapter 6: nameAndLook 3:55-4:50

export const nameAndLook = {
  crossedNames: {...window(0.0, 3.5), each: 0.5, count: 7},
  onBehalf: window(3.5, 4.5),
  provisumWrites: window(5.0, 7.5),
  latin: {...window(7.5, 8.5), text: 'Latin. "Provided for."'},
  logotype: {lift: window(9.0, 11.0), crossfade: window(10.0, 11.0)},
  laptop: window(13.0, 16.0),
  designFileIn: window(16.0, 18.0),
  dive: {...window(20.0, 23.0), easing: 'easeInOutCubic' as EasingName},
  inside: {
    tokens: window(23.0, 28.0),
    wallpapers: {...window(28.0, 33.0), slide: window(28.0, 30.5), fan: window(30.5, 32.0), count: 9},
    form: {draw: window(33.0, 35.0), crossOut: window(35.0, 35.5), chatIn: window(36.0, 37.0), footage: 'onboarding-question'},
    largestText: {card: window(38.0, 40.0), snap: 40.0, footage: 'emergency-card-full', then: 'capture: emergency-largest-text'},
    versions: {flick: window(43.0, 46.0), perSecond: 10, settle: 46.0, footage: 'binder-home-dark'},
  },
  pullOut: {...window(50.0, 53.0), easing: 'easeInOutCubic' as EasingName},
  fold: window(53.0, 55.0),
} as const;

const nameAndLookBeats: readonly Beat4[] = [
  beat('names', 0.0, 'seven names crossed out, then "On Behalf"', {dur: 4.5}),
  beat('vo-f7', 0.0, 'F7'),
  beat('provisum', 5.0, 'PROVISUM writes itself; a held chord', {dur: 2.5}),
  beat('vo-f8', 7.0, 'F8'),
  beat('logotype', 9.0, 'the letters lift and settle as the logotype; resolve at 11.0', {dur: 2.0}),
  beat('laptop', 13.0, 'the laptop draws', {dur: 3.0}),
  beat('design-file', 16.0, 'the imagined design file fades in: a city at night', {dur: 2.0}),
  beat('vo-m6', 17.0, 'M6'),
  beat('dive', 20.0, 'dive into the screen', {dur: 3.0}),
  beat('tokens', 23.0, 'colour tokens, light and dark', {dur: 5.0}),
  beat('wallpapers', 28.0, 'nine wallpapers slide past and fan out', {dur: 5.0}),
  beat('form', 33.0, 'a form; crossed out at 35.0; the conversation slides in at 36.0', {dur: 5.0}),
  beat('cross-out', 35.0, 'the accent stroke crosses the form out', {dur: 0.5}),
  beat('largest-text', 40.0, 'the emergency view jumps to the largest text size', {sfx: 'snap'}),
  beat('versions', 43.0, 'wireframes flick at 10/s', {dur: 3.0}),
  beat('vo-m7', 44.0, 'M7'),
  beat('settle', 46.0, 'settles on the real home', {sfx: 'snap'}),
  beat('pull-out', 50.0, 'back out of the laptop', {dur: 3.0}),
  beat('fold', 53.0, 'the laptop folds flat', {sfx: 'fold', dur: 2.0}),
];

// Chapter 7: engineRoom 4:50-6:05

export const engineRoom = {
  outline: window(0.0, 3.0),
  slice: {...window(3.0, 6.0), foldAt: 3.5, floorLabels: ['Code', 'The data', 'The vault'] as const},
  floors: {code: [2500, 3350], data: [3350, 4450], vault: [4450, 5200]} as const,
  top: {laptop: window(6.0, 8.0), xcodeIn: 8.0, footage: 'capture: xcode-navigator'},
  tabs: {names: ['Binder', 'Documents', 'Deadlines', 'Packets', 'EmergencyCard', 'Family', 'Visits'] as const, first: 9.5, every: 1.5},
  middle: {binder: 18.0, strings: window(19.0, 22.0), silhouettes: {first: 23.0, every: 1.0, names: ['Dad', 'Mia', 'Maya', 'Jonas', 'Sam', 'Biscuit'] as const}},
  train: {tracks: window(28.0, 30.0), run: window(30.0, 36.0), merges: [32.0, 33.0, 34.0] as const, bell: window(35.0, 36.0), ticks: window(36.5, 38.5), billTick: 38.5},
  vault: {
    server: {draw: window(44.0, 45.5), erase: window(46.5, 48.5)}, pipe: 49.0, cloud: window(49.5, 51.0), phones: window(51.5, 53.5),
    strings: window(53.5, 54.5), safe: {draw: window(56.0, 57.5), cardIn: window(57.5, 58.5), padlock: 59.0},
  },
  tests: {...window(64.0, 69.0), footage: 'capture: xcode-tests', buildSucceeded: 69.0},
  simulator: {...window(69.5, 72.0), footage: 'onboarding-welcome'},
  close: {fold: window(72.0, 73.5), flatten: window(73.5, 75.0)},
} as const;

const tabBeats = engineRoom.tabs.names.map((name, i) =>
  beat(`tab-${name.toLowerCase()}`, engineRoom.tabs.first + i * engineRoom.tabs.every, `"${name}" pops out as a tab and pins`, {sfx: 'pin'}),
);
const silhouetteBeats = engineRoom.middle.silhouettes.names.map((name, i) =>
  beat(`who-${name.toLowerCase()}`, engineRoom.middle.silhouettes.first + i, `${name} drawn on the VO's noun`, {estimate: true}),
);

const engineRoomBeats: readonly Beat4[] = [
  beat('outline', 0.0, 'the big phone outline', {dur: 3.0}),
  beat('vo-m8', 0.0, 'M8'),
  beat('slice', 3.5, 'the front face peels open; floors', {sfx: 'fold', dur: 2.5}),
  beat('laptop', 6.0, 'top floor: the laptop; Xcode at 8.0', {dur: 2.0}),
  ...tabBeats,
  beat('super-rooms', 10.0, '"Every feature has its own room."', {dur: 3.0}),
  beat('vo-m9', 18.0, 'M9'),
  beat('binder', 18.0, 'the paper Binder pops', {sfx: 'fold'}),
  beat('strings', 19.0, 'strings to the six boxes', {sfx: 'string', dur: 3.0}),
  beat('super-person', 22.0, '"One person. Everything that belongs to them."', {dur: 3.0}),
  ...silhouetteBeats,
  beat('vo-m10', 28.5, 'M10'),
  beat('tracks', 28.0, 'three tracks and three carriages draw', {dur: 2.0}),
  beat('train', 30.0, 'the train runs; merges at 32, 33, 34', {sfx: 'train', dur: 6.0}),
  ...engineRoom.train.merges.map((t, i) => beat(`merge-${i + 1}`, t, 'a carriage joins the one track', {sfx: 'snap'})),
  beat('super-dates', 36.0, '"All the dates. One list. The right reminder."', {dur: 3.0}),
  beat('ticks-963', 36.5, 'accent ticks 9 / 6 / 3 on the passport carriage', {sfx: 'tick', dur: 2.0}),
  beat('vo-m11', 44.0, 'M11'),
  beat('server', 44.0, 'the server box draws', {dur: 1.5}),
  beat('erase', 46.5, 'the server is erased completely', {dur: 2.0}),
  beat('cloud', 49.0, 'pipe, cloud, two phones, strings', {dur: 5.5}),
  beat('super-no-server', 50.0, '"No server. No account. Data Not Collected."', {dur: 3.0}),
  beat('vo-m12', 56.0, 'M12'),
  beat('safe', 56.0, 'the safe draws; the card slides in', {dur: 2.5}),
  beat('padlock', 59.0, 'the padlock snaps', {sfx: 'padlock'}),
  beat('vo-f9', 64.0, 'F9'),
  beat('tests', 64.0, 'tests run; the number roll counts', {sfx: 'odometer', dur: 5.0}),
  beat('build', 69.0, 'Build succeeded; the Simulator boots in a drawn phone'),
  beat('close', 72.0, 'the cutaway closes like a book', {sfx: 'fold', dur: 3.0}),
];

// Chapter 8: launch 6:05-6:55

export const launch = {
  pad: 0.0,
  rocket: window(1.0, 3.0),
  statuses: [
    {at: 3.0, text: 'Waiting for Review'},
    {at: 5.0, text: 'In Review'},
    {at: 7.0, text: 'Ready for Distribution'},
  ] as const,
  liftOff: {...window(10.0, 15.0), apexAt: 12.5},
  map: window(10.5, 14.5),
  usFill: window(15.0, 17.0),
  notes: [
    {press: 22.0, write: window(22.5, 25.0), text: 'Listed as paid. Should be free.'},
    {press: 27.0, write: window(27.5, 30.0), text: 'Fixed. Version 1.1. Next day.'},
  ] as const,
  crossOut: window(26.0, 26.5),
  zoomIn: {...window(35.0, 41.0), easing: 'easeInOutQuint' as EasingName, notesFade: window(35.0, 36.0)},
  smallHouse: {draw: window(36.0, 39.0), scale: 0.25, windowLights: 40.0, footage: 'capture: binder-home-dad'},
  mayaInWindow: window(44.0, 45.5),
} as const;

const launchBeats: readonly Beat4[] = [
  beat('pad', 0.0, 'the launchpad folds', {sfx: 'fold'}),
  beat('vo-f10', 0.0, 'F10'),
  beat('rocket', 1.0, 'the rocket folds up', {sfx: 'fold', dur: 2.0}),
  ...launch.statuses.map((s, i) => beat(`status-${i + 1}`, s.at, `status: ${s.text}`, i === 0 ? {} : {sfx: 'snap'})),
  beat('lift-off', 10.0, 'the rocket launches; the line is its trail', {sfx: 'rocket', dur: 4.0}),
  beat('map', 10.5, 'the world map draws under the arc', {dur: 4.0}),
  beat('landing', 15.0, 'lands on the United States; the fill', {dur: 2.0}),
  beat('vo-f11', 15.0, 'F11'),
  beat('super-us', 15.0, '"United States first. On purpose."', {dur: 3.0}),
  beat('note-1', 22.0, 'sticky note: "Listed as paid. Should be free."', {sfx: 'sticky_press'}),
  beat('super-day', 25.0, '"Day one: a mistake. Day two: fixed."', {dur: 3.0}),
  beat('vo-f12', 26.0, 'F12'),
  beat('cross-out', 26.0, 'the note is crossed out', {dur: 0.5}),
  beat('note-2', 27.0, 'sticky note: "Fixed. Version 1.1. Next day."', {sfx: 'sticky_press'}),
  beat('zoom-in', 35.0, 'into the United States, to one house', {dur: 6.0}),
  beat('vo-f13', 35.5, 'F13'),
  beat('window', 40.0, "the window lights: the Dad binder's top bar", {sfx: 'snap'}),
  beat('maya-window', 44.0, 'Maya in the window', {dur: 1.5}),
  beat('vo-y3', 45.0, 'Y3'),
];

// Chapter 9: village 6:55-8:10

export type HouseVisit = {n: number; at: number; open: number; house: string; interior: string; note: string; sketch: string};

const VISIT_PLAN: readonly Omit<HouseVisit, 'n' | 'at' | 'open'>[] = [
  {house: 'Leo and Mia', interior: 'two passports on a fridge, ticks at 9, 6, 3 months', note: 'IDs for everyone, reminded early.', sketch: 'passport'},
  {house: 'Dad', interior: 'a Watch on a bedside table, a Wallet pass beside it', note: 'The emergency card on the wrist and in Wallet.', sketch: 'watch-wallet'},
  {house: "Dad's kitchen", interior: 'a pill bottle, a small bell', note: 'Medication list, with refill reminders.', sketch: 'pill-bottle'},
  {house: 'Maya', interior: 'three phones around one card, a padlock', note: 'Share the card. Encrypted first.', sketch: 'share-card'},
  {house: 'Jonas', interior: 'coins splitting between three figures', note: 'Who paid what.', sketch: 'shared-costs'},
  {house: 'Maya', interior: 'an envelope, a circled question mark', note: 'Is this letter a scam?', sketch: 'scam-letter'},
  {house: 'Dad', interior: "a sound wave over a doctor's desk", note: 'Record the visit. Keep it on the phone.', sketch: 'visit-recording'},
  {house: "Biscuit's kennel", interior: 'a vet card in a tiny folder', note: 'Pets get a binder too.', sketch: 'where-is-it'},
  {house: 'Sam, Lisbon', interior: 'a key, a car registration, a lease', note: "Look after a friend's papers while they're away.", sketch: 'where-is-it'},
];

export const HOUSE_VISITS: readonly HouseVisit[] = VISIT_PLAN.map((v, i) => {
  const cam = VISITS[i];
  if (!cam) throw new Error(`No camera visit ${i + 1}`);
  return {...v, n: i + 1, at: cam.at, open: round3(cam.at + cam.flight)};
});

export const village = {
  pullBack: window(0.0, 6.0),
  houses: [
    {name: 'Leo', at: 1.0}, {name: 'Mia', at: 2.5}, {name: 'Maya', at: 4.0}, {name: 'Jonas', at: 5.5}, {name: 'Biscuit', at: 7.0}, {name: 'Sam', at: 10.0},
  ] as const,
  string: window(10.5, 13.0),
  visits: HOUSE_VISITS,
  visit: {openAfter: 0.0, drawSeconds: 2.0, mayaAfter: 0.5, noteAfter: 1.5, holdSeconds: VISIT_HOLD_SECONDS},
  rise: {...window(50.0, 55.0), easing: 'easeInOutQuint' as EasingName},
  countries: {...window(55.0, 57.0), ids: ['be', 'nl', 'de', 'fr'] as const},
  margin: {...window(57.0, 58.5), labels: ['112', 'A4'] as const},
  bubbles: [
    {text: 'Hello', at: 55.0}, {text: 'Hola', at: 55.5}, {text: 'Hallo', at: 56.0}, {text: 'Bonjour', at: 56.5}, {text: 'Hoi', at: 57.0},
  ] as const,
  dive: window(63.0, 65.0),
  green: {form: window(65.0, 67.0), crossOut: window(67.5, 68.0), bubble: window(68.5, 71.0), question: 'Who are you looking after?', chips: ['Dad', 'Leo'] as const},
  settle: window(71.0, 75.0),
} as const;

const villageBeats: readonly Beat4[] = [
  beat('super-v2', 0.0, '"Version 2: a binder for everyone you call family."', {dur: 3.0}),
  beat('vo-f14', 1.0, 'F14'),
  ...village.houses.map((h) => beat(`house-${h.name.toLowerCase()}`, h.at, `${h.name}'s house pops up`, {sfx: 'fold'})),
  beat('string', 10.5, 'dotted string connects the seven', {sfx: 'string', dur: 2.5}),
  ...HOUSE_VISITS.flatMap((v) => [
    beat(`visit-${v.n}-fly`, v.at, `flight to ${v.house}`, {dur: round3(v.open - v.at)}),
    beat(`visit-${v.n}-open`, v.open, `${v.house}: ${v.interior} — "${v.note}"`, {sfx: 'fold', dur: VISIT_HOLD_SECONDS}),
  ]),
  beat('vo-y4', 29.0, 'Y4 over the flights'),
  beat('rise', 50.0, 'the camera rises; the sea is the map', {dur: 5.0}),
  beat('countries', 55.0, 'four countries circled', {dur: 2.0}),
  ...village.bubbles.map((b) => beat(`bubble-${b.text.toLowerCase()}`, b.at, `"${b.text}" floats up`, {sfx: 'bubble_pop'})),
  beat('margin', 57.0, '"112" and "A4" in the margin', {dur: 1.5}),
  beat('super-five', 57.0, '"Five countries. Five languages."', {dur: 2.5}),
  beat('vo-m13', 63.0, 'M13'),
  beat('dive', 63.0, 'dive to the village green', {dur: 2.0}),
  beat('form', 65.0, 'a form on the green', {dur: 2.0}),
  beat('cross-out', 67.5, 'one stroke crosses it out', {dur: 0.5}),
  beat('bubble', 68.5, 'the conversation bubble with two chips', {dur: 2.5}),
  beat('settle', 71.0, 'the whole village in frame for the lift', {dur: 4.0}),
];

// Chapter 10: paperToGlass 8:10-9:30 (the v1 glass arc re-staged)

export type GlassSnap = {n: number; t: number; footage: string; label: string};
export type Recording = {n: number; t: number; dur: number; footage: string; label: string; framing: 'void' | 'bleed'; rotationY: number};

const SNAP_PLAN: readonly Omit<GlassSnap, 'n' | 't'>[] = [
  {footage: 'passport-reminder', label: 'IDs for everyone, reminded early.'},
  {footage: 'phone-show-on-watch', label: 'The emergency card on the wrist and in Wallet.'},
  {footage: 'med-refill', label: 'Medication list, with refill reminders.'},
  {footage: 'family-share-card', label: 'Share the card. Encrypted first.'},
  {footage: 'shared-costs', label: 'Who paid what.'},
  {footage: 'scam-check', label: 'Is this letter a scam?'},
  {footage: 'visit-summary', label: 'Record the visit. Keep it on the phone.'},
  {footage: 'capture: pet-binder', label: 'Pets get a binder too.'},
  {footage: 'capture: friend-binder', label: "Look after a friend's papers while they're away."},
];
const SNAP_FIRST = 10.0;
const SNAP_EVERY = 1.5;
export const GLASS_SNAPS: readonly GlassSnap[] = SNAP_PLAN.map((s, i) => ({...s, n: i + 1, t: round3(SNAP_FIRST + i * SNAP_EVERY)}));

const RECORDING_PLAN: readonly Omit<Recording, 'n' | 't' | 'dur'>[] = [
  {footage: 'capture: invite-friend', label: 'Invite a friend to a binder', framing: 'void', rotationY: -12},
  {footage: 'capture: family-joined', label: 'See who joined', framing: 'bleed', rotationY: 0},
  {footage: 'shared-costs', label: 'Shared costs', framing: 'void', rotationY: 10},
  {footage: 'passport-reminder', label: 'A passport reminder', framing: 'bleed', rotationY: 0},
  {footage: 'scam-check', label: 'The scam note', framing: 'void', rotationY: -8},
  {footage: 'visit-summary', label: 'A visit summary', framing: 'bleed', rotationY: 0},
  {footage: 'belgium-112', label: 'A Belgian binder calling 112', framing: 'void', rotationY: 14},
  {footage: 'onboarding-question', label: 'The first question', framing: 'bleed', rotationY: 0},
];
const RECORDINGS_FIRST = 48.0;
const RECORDING_SECONDS = 1.5;
export const RECORDINGS: readonly Recording[] = RECORDING_PLAN.map((r, i) => ({...r, n: i + 1, t: round3(RECORDINGS_FIRST + i * RECORDING_SECONDS), dur: RECORDING_SECONDS}));

export const paperToGlass = {
  lightCatch: {...window(0.0, 5.0), perStrokeSeconds: 0.4},
  paperTextureFade: {...window(1.5, 6.5), easing: 'easeInOutSine' as EasingName},
  paperToBlack: {...window(2.5, 7.0), easing: 'easeInOutCubic' as EasingName},
  beatLocks: 7.0,
  housesLift: window(7.0, 8.0),
  foldIntoPhone: window(8.0, 10.0),
  perspective: {...window(8.0, 11.0), fovFrom: 0, fovTo: 28},
  rotationY: [{t: 8.0, value: 0}, {t: 9.5, value: -8}, {t: 24.0, value: 22}] as const,
  edgeLight: {lap: window(8.0, 16.0), settle: window(16.0, 18.0)},
  snaps: GLASS_SNAPS,
  snapSeconds: 0.3,
  split: {...window(25.0, 26.5), easing: 'keynote' as EasingName, binders: ['Dad', 'Leo', 'Mia', 'Maya', 'Sam'] as const, appearance: 'light'},
  merge: window(34.5, 36.0),
  family: {hit: 36.0, cardLands: 36.5, wallet: 38.0, settle: window(39.0, 42.0)},
  devicesOut: window(41.5, 42.0),
  numberRolls: [
    {at: 42.0, text: '6 kinds of people'}, {at: 43.5, text: '5 countries'}, {at: 45.0, text: '5 languages'}, {at: 46.5, text: '0 servers'},
  ] as const,
  recordings: RECORDINGS,
  invite: {mayaIn: window(60.0, 61.0), tap: 61.5, plane: 62.0, farPhoneLights: 64.0, card: 'Maya invited you to "Sam".'},
  hardStop: 68.0,
  silence: window(68.0, 70.0),
  title: {word: window(70.0, 71.5), strokeTwo: window(72.0, 73.0), resolve: 73.0, subline: 75.0},
  glowFadeStarts: 79.5,
} as const;

const paperToGlassBeats: readonly Beat4[] = [
  beat('swell', 0.0, 'first stroke turns to light; strings swell'),
  beat('light-catch', 0.0, 'the village converts in stroke order', {dur: 5.0}),
  beat('paper-fades', 1.5, 'paper fades', {dur: 5.0}),
  beat('black', 7.0, 'only light on black; the pulse locks'),
  beat('lift', 7.0, 'the houses lift as hairlines', {dur: 1.0}),
  beat('fold-in', 8.0, 'they fold into one phone; depth; the edge light lap (a sweep cue 8.0-16.0)', {dur: 8.0}),
  ...GLASS_SNAPS.map((s) => beat(`snap-${s.n}`, s.t, `${s.footage}: ${s.label}`, {sfx: 'snap'})),
  beat('split', 25.0, 'one phone becomes five, one per binder', {dur: 1.5}),
  beat('super-colour', 25.0, '"Every person. Their own binder. Their own colour."', {dur: 5.0}),
  beat('vo-m14', 25.5, 'M14'),
  beat('merge', 34.5, 'the row collapses to one phone', {dur: 1.5}),
  beat('hit', 36.0, 'the card flips off the phone', {sfx: 'card_flip'}),
  beat('card-lands', 36.5, 'the card seats on the Watch', {sfx: 'snap'}),
  beat('super-watch', 37.0, '"Apple Watch. Apple Wallet."', {dur: 4.0}),
  beat('wallet', 38.0, 'the Wallet pass slides out', {sfx: 'wallet_slide'}),
  beat('settle', 39.0, 'light settles', {dur: 3.0}),
  ...paperToGlass.numberRolls.map((r, i) => beat(`roll-${i + 1}`, r.at, r.text, {sfx: 'odometer'})),
  ...RECORDINGS.map((r) => beat(`rec-${r.n}`, r.t, `${r.footage} (${r.framing}): ${r.label}`, {dur: r.dur})),
  beat('vo-f15', 48.0, 'F15'),
  beat('vo-m15', 50.0, 'M15'),
  beat('vo-y5', 54.0, 'Y5'),
  beat('maya-light', 60.0, 'Maya draws in light beside the phone', {dur: 1.0}),
  beat('tap-invite', 61.5, 'she taps Invite', {sfx: 'snap'}),
  beat('plane', 62.0, 'a paper plane flies across the black', {sfx: 'plane'}),
  beat('super-share', 62.0, '"Share a binder with anyone you trust."', {dur: 5.0}),
  beat('far-phone', 64.0, 'the far phone lights: the invitation', {sfx: 'snap'}),
  beat('hard-stop', 68.0, 'HARD STOP: black, digital silence', {dur: 2.0}),
  beat('title', 70.0, '"Provisum" letter by letter; the swell', {sfx: 'title_in'}),
  beat('two', 72.0, 'the accent stroke of "2"', {dur: 1.0}),
  beat('resolve', 73.0, 'the stroke completes; the music resolves'),
  beat('subline', 75.0, '"A binder for your whole family. And the friends who are family."'),
];

// Chapter 11: providedFor 9:30-10:00

export const providedFor = {
  glowToGraphite: window(0.0, 3.0), pullBack: {...window(0.0, 11.0), easing: 'easeInOutQuint' as EasingName}, lastStretch: window(2.0, 11.0),
  dive: {...window(12.0, 15.0), easing: 'easeInOutCubic' as EasingName}, voF16: 14.0, pencilSetsDown: window(15.0, 17.0),
  closingLine: {at: 16.0, fadeSeconds: 0.6, text: 'Provided for.'}, drift: window(20.0, 21.0),
  endCard: {title: 20.0, line: 21.0, mark: 22.0, cambria: {at: 23.0, text: 'Made by Veyago. Private by design.'}},
  musicEndsBy: 24.0, pencilClick: 28.0, end: 30.0,
} as const;

const providedForBeats: readonly Beat4[] = [
  beat('graphite', 0.0, 'the glow fades back into graphite; the paper returns', {dur: 3.0}),
  beat('pull-back', 0.0, 'the whole sheet, every chapter one drawing', {dur: 11.0}),
  beat('super-sum', 3.0, '"A no. Five filters. One idea. A whole village."', {dur: 8.0}),
  beat('dive', 12.0, 'dive to the pencil', {dur: 3.0}),
  beat('vo-f16', 14.0, 'F16'),
  beat('pencil', 15.0, 'the pencil sets itself down; stops a hair above the paper', {dur: 2.0}),
  beat('closing-line', 16.0, '"Provided for." in Caladea italic', {estimate: true}),
  beat('card-title', 20.0, '"Provisum 2" on the paper; the final chord'),
  beat('card-line', 21.0, '"Free on the App Store"'),
  beat('card-mark', 22.0, 'the Veyago mark'),
  beat('card-cambria', 23.0, '"Made by Veyago. Private by design."'),
  beat('music-ends', 24.0, 'the final chord has decayed'),
  beat('pencil-click', 28.0, 'the click: the last sound of the film', {sfx: 'pencil_click'}),
  beat('end', 30.0, 'end on the card, no fade'),
];

// Index, music map and validation

export const BEATS4: Record<ChapterId, readonly Beat4[]> = {
  line: lineBeats,
  mayasHouse: mayasHouseBeats,
  theNo: theNoBeats,
  filterMachine: filterMachineBeats,
  researchBoard: researchBoardBeats,
  nameAndLook: nameAndLookBeats,
  engineRoom: engineRoomBeats,
  launch: launchBeats,
  village: villageBeats,
  paperToGlass: paperToGlassBeats,
  providedFor: providedForBeats,
};

/** The score's anchors (BIBLE4 §7.1) in master seconds, for the music engineer. */
const MUSIC_MAP4_MASTER: readonly (readonly [number, string])[] = [
  [0, 'silence; pencil only'], [6, 'felt piano enters'], [18, 'chord: the camera lifts'], [26, 'lift: the dive'],
  [52, 'lift under the storm'], [58, 'rest: the freeze (one beat)'], [59, 'strings under the tree'],
  [75, 'B-flat minor, sparse'], [88, 'warm chord: the engine unfolds'], [103.5, 'one low note: the calendar'],
  [122, 'the lift ostinato starts (the machine)'], [150, 'stops on the one card'],
  [170, 'strings under the board'], [202, 'glissando: the string pulls tight'], [216, 'plucks: the boxes'],
  [240, 'held chord: PROVISUM'], [246, 'resolve: the logotype'], [258, 'the soft pulse inside the screen'],
  [290, 'A-flat pedal: the engine room'], [320, 'woodblock with the train'], [336.5, 'rest: the erased server'],
  [349, 'low chord: the padlock'], [354, 'rising figure under the tests'], [359, 'lands on Build succeeded'],
  [368, 'three plucked notes: the statuses'], [375, 'swell: launch'], [387, 'dry rest: the sticky notes'], [400, 'felt piano: the house'],
  [415, 'home key: the village'], [465, 'swell: the rise'], [478, 'the pulse starts under the green'],
  [490, 'swell: the lines catch light'], [497, 'the pulse locks'], [515, 'peak: five phones'], [526, 'hit: the card flips'], [528, 'hit: the Wallet pass'],
  [532, 'dry pulse: number rolls'], [538, 'ostinato under the recordings'], [550, 'warm strings: the plane'],
  [558, 'HARD STOP'], [560, 'soft swell: Provisum'], [563, '"2" completes: resolve'], [565, 'felt piano alone'],
  [570, 'felt piano under the pull-back'], [590, 'the final chord'], [594, 'decayed'], [598, 'pencil click (foley)'],
];
export const MUSIC_MAP4_LOCAL: readonly {master: number; chapter: ChapterId; local: number; event: string}[] =
  MUSIC_MAP4_MASTER.map(([master, event]) => {
    const chapter = chapterAt(master);
    return {master, chapter, local: toLocal4(chapter, master), event};
  });

const beatProblems = (): readonly string[] =>
  SLOTS4.flatMap((slot) => {
    const length = chapterSeconds(slot.id);
    return BEATS4[slot.id].flatMap((b) => {
      const out: string[] = [];
      if (b.t < 0 || b.t > length) out.push(`${slot.id}/${b.id}: ${b.t}s outside 0-${length}s`);
      if (b.dur !== undefined && b.t + b.dur > length + 1e-6) out.push(`${slot.id}/${b.id}: window ends past the chapter`);
      if (!b.offGrid && !b.estimate && !isOnGrid(b.t)) out.push(`${slot.id}/${b.id}: ${b.t}s is off the ${GRID_SECONDS} s grid`);
      return out;
    });
  });

const superProblems = (): readonly string[] =>
  SLOTS4.flatMap((slot) =>
    SUPERS[slot.id].flatMap((s) => {
      const out: string[] = [];
      const length = chapterSeconds(slot.id);
      if (s.t < 0 || s.t + s.dur > length + 1e-6) out.push(`${slot.id} super "${s.text}": outside the chapter`);
      if (!isOnGrid(s.t)) out.push(`${slot.id} super "${s.text}": off the grid`);
      const speaking = voiceAt(slot.id, s.t);
      const expected: Ink = s.ink === 'glass' ? 'glass' : speaking ? VOICE_INK[speaking] : 'graphite';
      if (s.ink !== expected) out.push(`${slot.id} super "${s.text}": ink ${s.ink}, but ${speaking ?? 'nobody'} speaks at ${s.t} (expected ${expected})`);
      return out;
    }),
  );

const voProblems = (): readonly string[] =>
  VO4.flatMap((v) => {
    const out: string[] = [];
    const length = chapterSeconds(v.chapter);
    if (v.start < 0 || v.start > length) out.push(`VO ${v.id} starts outside ${v.chapter}`);
    if (!isOnGrid(v.start)) out.push(`VO ${v.id} starts off the grid`);
    if (v.estimatedEnd > length) out.push(`VO ${v.id} estimated to end at ${v.estimatedEnd}s, past ${v.chapter}'s ${length}s`);
    const next = VO4.find((o) => o.chapter === v.chapter && o.start > v.start);
    if (next && v.estimatedEnd > next.start + 1e-6) out.push(`VO ${v.id} estimated to end at ${v.estimatedEnd}s, after ${next.id} starts at ${next.start}s`);
    return out;
  });

/** Problems in the beat sheet: beats outside their chapter or off the grid, supers in the wrong ink, VO overlaps, a camera cut. Empty when clean. */
export const validateBeats4 = (): readonly string[] => [...beatProblems(), ...superProblems(), ...voProblems(), ...validateSheet4()];
