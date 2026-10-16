// edits.ts — the cut-downs as edit decision lists. Each segment slices one module between two MODULE-LOCAL
// times; the integrator assembles them with a negative <Sequence from>. Durations are checked by `validateEdl()`:
// VERTICAL_45 sums to exactly 45.0 s, TEASER_15 to exactly 15.0 s. The reasoning is in docs/BIBLE.md §7 and
// docs/DECISIONS.md.

import type {ModuleId} from './film';
import {sec} from './film';
import type {VoLine} from './beats';
import {isOnGrid, slotSeconds, voLine} from './beats';

export type CaptionTone = 'paper' | 'glass';

export type EditCaption = {
  /** Seconds from the segment's start. */
  at: number;
  text: string;
};

export type EditProps = {
  /** What the music does here (the music engineer re-arranges the same motif family; never a straight cut). */
  music: string;
  /** A VO line placed in this segment, starting `at` seconds from the segment's start. `cut` says which sentences are dropped. */
  vo?: {line: VoLine['n']; at: number; cut?: string};
  /** Burned-in captions for the 9:16 versions only (DM Sans 500, see BIBLE §7.3). Omitted = no caption. */
  captions?: readonly EditCaption[];
  captionTone?: CaptionTone;
  /** Foley the cut-down mix places itself (module-local hits do not survive slicing). Seconds from the segment's start. */
  sfxAt?: Readonly<Record<string, number>>;
};

export type EditSegment = {
  module: ModuleId;
  /** Module-local seconds. */
  from: number;
  to: number;
  note: string;
  props?: EditProps;
};

export type Edl = {
  id: string;
  format: 'wide' | 'tall';
  targetSeconds: number;
  segments: readonly EditSegment[];
};

const seg = (module: ModuleId, from: number, to: number, note: string, props?: EditProps): EditSegment => ({
  module,
  from,
  to,
  note,
  ...(props ? {props} : {}),
});

export const segmentSeconds = (s: EditSegment): number => Math.round((s.to - s.from) * 1000) / 1000;
export const segmentFrames = (s: EditSegment): number => sec(s.to) - sec(s.from);
export const edlSeconds = (segments: readonly EditSegment[]): number =>
  Math.round(segments.reduce((sum, s) => sum + segmentSeconds(s), 0) * 1000) / 1000;
export const edlFrames = (segments: readonly EditSegment[]): number => segments.reduce((sum, s) => sum + segmentFrames(s), 0);

// ---------------------------------------------------------------------------------------------------------------
// 0:45 vertical (9:16): shots 4, 6 (two pages), 9, 12, 13, 16, 18 (four cuts), 21
// ---------------------------------------------------------------------------------------------------------------

export const VERTICAL_45: readonly EditSegment[] = [
  seg('coldOpen', 27.0, 32.5, 'shot 4: the sticky note pressed, smoothed (chord at +1.0), lettered', {
    music: 'felt piano enters on the first frame, sparse; the first real chord at +1.0 as the note is smoothed',
    vo: {line: 2, at: 0.3},
    captions: [{at: 0.3, text: 'It worked. So we sat down and asked the harder question.'}],
    captionTone: 'paper',
    sfxAt: {sticky_press: 0.0, sticky_smooth: 1.0, pen_cap: 1.5},
  }),
  seg('desk', 3.5, 8.0, 'shot 6a: page 1 family-tabs draws (the full draw window)', {
    music: 'ostinato begins, light',
    vo: {line: 3, at: 0.0},
    captions: [{at: 0.0, text: 'We started with a person.'}],
    captionTone: 'paper',
  }),
  seg('desk', 9.5, 13.0, 'shot 6b: page 2 watch-wallet draws', {
    music: 'ostinato continues',
    captions: [{at: 0.2, text: 'Her emergency card, on Apple Watch and in Wallet.'}],
    captionTone: 'paper',
  }),
  seg('desk', 38.0, 45.0, 'shot 9: the form, the cross-out on "Stop", the conversation redrawn (held 0.5 s longer so VO 6 finishes inside it)', {
    music: 'drops to a single held note under VO 6',
    vo: {line: 6, at: 0.0},
    captions: [
      {at: 0.0, text: 'And then the biggest one.'},
      {at: 2.6, text: 'Stop asking people to fill in forms. Just ask them.'},
    ],
    captionTone: 'paper',
  }),
  seg('transition', 1.5, 6.0, 'shot 12: the lines catch light; the paper fades to black (starts 0.5 s later to pay for the longer form page)', {
    music: 'swell; the pulse starts under it',
  }),
  seg('transition', 11.0, 17.0, 'shot 13: the phone rotating in the void; snaps at +1.0, +3.0, +5.0', {
    music: 'pulse locked to a beat; hits on the three snaps',
    captionTone: 'glass',
    sfxAt: {snap_card: 1.0, snap_deadlines: 3.0, snap_chips: 5.0},
  }),
  seg('title', 2.0, 6.0, 'shot 16: "Provisum" letter by letter, the stroke of "2" completes at +3.0', {
    music: 'hard stop on the cut into this segment (0.5 s of silence), then the swell and the resolve at +3.0',
    sfxAt: {title_in: 0.5},
  }),
  seg('realThing', 0.0, 2.0, 'shot 18, cut 1: family tabs', {
    music: 'lift: ostinato',
    vo: {line: 7, at: 0.2, cut: 'drop "And none of it on our servers."'},
    captions: [{at: 0.2, text: 'Everything we drew. On your iPhone.'}],
    captionTone: 'glass',
  }),
  seg('realThing', 2.0, 3.5, 'shot 18, cut 2: the card on the Watch', {
    music: 'ostinato',
    captionTone: 'glass',
  }),
  seg('realThing', 5.5, 7.0, 'shot 18, cut 4: the scam note on a letter', {
    music: 'ostinato',
    captions: [{at: 0.0, text: 'No account. No tracking.'}],
    captionTone: 'glass',
  }),
  seg('realThing', 14.0, 16.0, 'shot 18, cut 9: the onboarding question with its chips', {
    music: 'ostinato peaks and stops clean on the cut',
    captionTone: 'glass',
  }),
  seg('endCard', 0.0, 3.0, 'shot 21: end card; the pencil click is the last sound', {
    music: 'one warm chord, decayed by +2.0',
    sfxAt: {pencil_click: 2.5},
  }),
];

// ---------------------------------------------------------------------------------------------------------------
// 0:15 teaser (9:16, plus 16:9): shot 4, a two-second sketch montage, shot 12, black, "Provisum 2"
// ---------------------------------------------------------------------------------------------------------------

export const TEASER_15: readonly EditSegment[] = [
  seg('coldOpen', 27.0, 32.5, 'shot 4: the note pressed, smoothed, lettered (no VO; the note is the copy)', {
    music: 'pencil only, then the first chord at +1.0; piano sparse under the lettering',
    sfxAt: {sticky_press: 0.0, sticky_smooth: 1.0, pen_cap: 1.5},
  }),
  seg('desk', 7.5, 8.0, 'montage 1/4: family-tabs, the margin note landing', {music: 'one piano note on the cut'}),
  seg('desk', 12.5, 13.0, 'montage 2/4: watch-wallet, the note landing', {music: 'one piano note on the cut'}),
  seg('desk', 17.0, 17.5, 'montage 3/4: pill-bottle, the note landing', {music: 'one piano note on the cut'}),
  seg('desk', 33.0, 33.5, 'montage 4/4: europe-map, "112" and "A4" landing', {music: 'one piano note on the cut'}),
  seg('transition', 1.0, 4.5, 'shot 12: the lines catch light', {music: 'swell'}),
  seg('title', 0.0, 1.0, 'black; silence', {music: 'hard stop; one full second of nothing'}),
  seg('title', 2.0, 5.0, '"Provisum", then the stroke of "2" completes on the last frame', {
    music: 'soft swell; resolves on the last frame',
    sfxAt: {title_in: 0.0},
  }),
];

const stripCaptions = (s: EditSegment): EditSegment => {
  if (!s.props) return s;
  const {captions: _captions, captionTone: _tone, ...rest} = s.props;
  return {...s, props: rest};
};

/** The same teaser for 16:9; no burned-in captions. */
export const TEASER_15_WIDE: readonly EditSegment[] = TEASER_15.map(stripCaptions);

export const EDLS: readonly Edl[] = [
  {id: 'Vertical45', format: 'tall', targetSeconds: 45, segments: VERTICAL_45},
  {id: 'Teaser15', format: 'tall', targetSeconds: 15, segments: TEASER_15},
  {id: 'Teaser15-wide', format: 'wide', targetSeconds: 15, segments: TEASER_15_WIDE},
];

/** Problems in an EDL: a bad slice, a slice outside its module, an off-grid cut, or a wrong total. Empty when clean. */
export const validateEdl = (edl: Edl): readonly string[] => {
  const problems: string[] = [];
  for (const [i, s] of edl.segments.entries()) {
    const length = slotSeconds(s.module);
    if (s.from < 0 || s.to > length || s.from >= s.to) problems.push(`${edl.id}[${i}] ${s.module} ${s.from}-${s.to}: bad slice (module is 0-${length}s)`);
    if (!isOnGrid(s.from) || !isOnGrid(s.to)) problems.push(`${edl.id}[${i}] ${s.module} ${s.from}-${s.to}: cut off the 0.5 s grid`);
    if (s.props?.vo) {
      const line = voLine(s.props.vo.line);
      if (s.props.vo.at < 0 || s.props.vo.at > segmentSeconds(s)) problems.push(`${edl.id}[${i}]: VO ${line.n} placed outside the segment`);
    }
  }
  const total = edlSeconds(edl.segments);
  if (total !== edl.targetSeconds) problems.push(`${edl.id} runs ${total}s, not ${edl.targetSeconds}s`);
  return problems;
};

export const validateEdls = (): readonly string[] => EDLS.flatMap(validateEdl);
