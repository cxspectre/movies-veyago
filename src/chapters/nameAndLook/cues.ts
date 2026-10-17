// cues.ts — chapter 6's COMPLETE foley list (module-local seconds), from BIBLE4 §5.6, §7.1 and §7.4: the pencil on
// the names, the word and the laptop; the lift; inside the screen a soft tick per swatch, the slides, the accent
// cross-out, the two snaps; the laptop's fold. The music (felt piano, the held chord 5.0-11.0, the wall pulse) is not
// foley and is not listed here.
import type {Cue, ModuleCues} from '../../audio/cues';
import {nameAndLook as B} from '../../beats4';
import {superCues} from '../../kit';
import {SUPERS_WIDE} from './Chapter';
import {CROSSED_NAMES, TOKENS} from './layout';

const hit = (t: number, name: Extract<Cue, {kind: 'hit'}>['name'], o: {dur?: number; gain?: number; pan?: number} = {}): Cue => ({kind: 'hit', t, name, ...o});
const pencil = (t: number, dur: number, pressure = 0.8): Cue => ({kind: 'stroke', t, dur, pressure});
const r3 = (n: number): number => Math.round(n * 1000) / 1000;

const IN = B.inside;
const {each} = B.crossedNames;

/** Each name scribbled, then struck through (a pressed stroke); "On Behalf" written plainly. */
const names: readonly Cue[] = [
  ...CROSSED_NAMES.flatMap((_, i) => {
    const t0 = B.crossedNames.from + i * each;
    return [pencil(r3(t0), r3(each * 0.62), 0.75), pencil(r3(t0 + each * 0.66), r3(each * 0.3), 1.15)];
  }),
  pencil(B.onBehalf.from, B.onBehalf.to - B.onBehalf.from, 0.8),
];

const word: readonly Cue[] = [
  pencil(B.provisumWrites.from, B.provisumWrites.to - B.provisumWrites.from, 1.1),
  pencil(B.latin.from, B.latin.to - B.latin.from, 0.7),
  // the letters lift off the paper (a soft card lift, low)
  hit(B.logotype.lift.from, 'fold', {dur: B.logotype.lift.to - B.logotype.lift.from, gain: 0.45}),
];

const laptop: readonly Cue[] = [pencil(B.laptop.from, B.laptop.to - B.laptop.from, 0.9)];

/** Inside the screen: a tick per swatch (two columns), the wallpapers' slide and fan, the form, the cross-out. */
const inside: readonly Cue[] = [
  ...TOKENS.flatMap((_, i) => [hit(r3(IN.tokens.from + 0.4 + i * 0.22 + 0.3), 'tick', {gain: 0.35, pan: -0.2}), hit(r3(IN.tokens.from + 0.4 + i * 0.22 + 0.11 + 0.3), 'tick', {gain: 0.35, pan: 0.2})]),
  {kind: 'slide', t: IN.wallpapers.slide.from, dur: IN.wallpapers.slide.to - IN.wallpapers.slide.from, pan: 0.3},
  {kind: 'slide', t: IN.wallpapers.fan.from, dur: IN.wallpapers.fan.to - IN.wallpapers.fan.from},
  pencil(IN.form.draw.from, IN.form.draw.to - IN.form.draw.from, 0.5),
  pencil(IN.form.crossOut.from, IN.form.crossOut.to - IN.form.crossOut.from, 1.3),
  {kind: 'slide', t: IN.form.chatIn.from, dur: IN.form.chatIn.to - IN.form.chatIn.from, pan: 0.4},
  {kind: 'slide', t: r3(IN.largestText.card.from - 0.3), dur: 0.5, pan: 0.4},
  hit(IN.largestText.snap, 'snap'),
  hit(IN.versions.settle, 'snap'),
];

const fold: readonly Cue[] = [hit(B.fold.from, 'fold', {dur: B.fold.to - B.fold.from})];

export const cues: ModuleCues = [...SUPERS_WIDE.flatMap((p) => superCues(p)), ...names, ...word, ...laptop, ...inside, ...fold].slice().sort((a, b) => a.t - b.t);
