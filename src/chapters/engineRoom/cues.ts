// cues.ts — chapter 7's COMPLETE foley list (module-local seconds), from BIBLE4 §5.7, §7.1 and §7.4: the outline,
// the cutaway's fold, the laptop, each tab (fold + pin), the Binder, the strings, the silhouettes, the tracks and the
// train with its three snaps and the bell's tick, the 9-6-3 ticks, the server drawn and ERASED (foley alone 46.5-
// 48.5, the score rests), the cloud, the phones, the safe, the padlock, the odometer, the phone frame, the close.
import type {Cue, ModuleCues} from '../../audio/cues';
import {engineRoom as B} from '../../beats4';
import {numberRollCue, superCues} from '../../kit';
import {SUPER_PROPS} from './Chapter';
import {TAB} from './layout';

const hit = (t: number, name: Extract<Cue, {kind: 'hit'}>['name'], o: {dur?: number; gain?: number; pan?: number} = {}): Cue => ({kind: 'hit', t, name, ...o});
const pencil = (t: number, dur: number, pressure = 0.8): Cue => ({kind: 'stroke', t, dur, pressure});
const r3 = (n: number): number => Math.round(n * 1000) / 1000;

const cutaway: readonly Cue[] = [
  pencil(B.outline.from, B.outline.to - B.outline.from, 1.0),
  hit(B.slice.foldAt, 'fold', {dur: 1.5}),
  pencil(4.5, 1.0, 0.8), // the floor lines
  pencil(B.top.laptop.from, B.top.laptop.to - B.top.laptop.from, 0.9),
];

const tabs: readonly Cue[] = B.tabs.names.flatMap((_, i) => {
  const pin = B.tabs.first + i * B.tabs.every;
  return [hit(r3(pin - TAB.fly), 'fold', {dur: 0.3, gain: 0.6, pan: 0.3}), hit(pin, 'pin', {pan: 0.4})];
});

const middle: readonly Cue[] = [
  hit(B.middle.binder, 'fold', {dur: 0.5}),
  pencil(r3(B.middle.binder + 0.15), 1.4, 0.8), // the six boxes
  hit(B.middle.strings.from, 'string', {dur: B.middle.strings.to - B.middle.strings.from}),
  ...B.middle.silhouettes.names.map((_, i) => pencil(B.middle.silhouettes.first + i * B.middle.silhouettes.every, 0.8, 0.7)),
  pencil(B.train.tracks.from, B.train.tracks.to - B.train.tracks.from, 0.8),
  hit(B.train.run.from, 'train', {dur: B.train.run.to - B.train.run.from}),
  ...B.train.merges.map((t) => hit(t, 'snap', {gain: 0.8})),
  hit(B.train.bell.from, 'tick', {gain: 0.7, pan: 0.4}),
  ...[0, 1, 2].map((i) => hit(r3(B.train.ticks.from + (i * (B.train.ticks.to - B.train.ticks.from)) / 3 + 0.2), 'tick')),
  hit(B.train.billTick, 'tick'),
];

const vault: readonly Cue[] = [
  pencil(B.vault.server.draw.from, B.vault.server.draw.to - B.vault.server.draw.from, 0.9),
  {kind: 'erase', t: B.vault.server.erase.from, dur: B.vault.server.erase.to - B.vault.server.erase.from},
  pencil(B.vault.pipe, 0.5, 0.8),
  pencil(B.vault.cloud.from, B.vault.cloud.to - B.vault.cloud.from, 0.85),
  pencil(B.vault.phones.from, B.vault.phones.to - B.vault.phones.from, 0.85),
  hit(B.vault.strings.from, 'string', {dur: B.vault.strings.to - B.vault.strings.from, gain: 0.7}),
  pencil(B.vault.safe.draw.from, B.vault.safe.draw.to - B.vault.safe.draw.from, 0.9),
  {kind: 'slide', t: B.vault.safe.cardIn.from, dur: B.vault.safe.cardIn.to - B.vault.safe.cardIn.from},
  hit(B.vault.safe.padlock, 'padlock'),
];

const tests: readonly Cue[] = [
  {kind: 'hit', ...numberRollCue({start: B.tests.from, duration: B.tests.to - B.tests.from})},
  pencil(B.simulator.from, 1.0, 0.8),
];

const close: readonly Cue[] = [hit(B.close.fold.from, 'fold', {dur: B.close.fold.to - B.close.fold.from})];

export const cues: ModuleCues = [...SUPER_PROPS.flatMap((p) => superCues(p)), ...cutaway, ...tabs, ...middle, ...vault, ...tests, ...close].slice().sort((a, b) => a.t - b.t);
