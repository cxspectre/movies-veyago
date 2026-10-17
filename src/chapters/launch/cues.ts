// cues.ts — chapter 8's COMPLETE foley list (module-local seconds), from BIBLE4 §5.8 and §7.4: the folds, the date's
// odometer, the status snaps, the rocket, the map and the US wash in pencil and pen, the supers, the sticky notes, the
// cross-out, the house and its window, Maya.
import type {Cue, ModuleCues} from '../../audio/cues';
import {SUPERS, launch} from '../../beats4';
import {superCues, superFromBeat} from '../../kit';
import {SUPER_AT} from './layout';

const hit = (t: number, name: Extract<Cue, {kind: 'hit'}>['name'], o: {dur?: number; gain?: number} = {}): Cue => ({kind: 'hit', t, name, ...o});
const pencil = (t: number, dur: number, pressure = 0.8): Cue => ({kind: 'stroke', t, dur, pressure});

export const cues: ModuleCues = [
  hit(launch.pad, 'fold', {dur: 1.1}),
  hit(launch.rocket.from, 'fold', {dur: launch.rocket.to - launch.rocket.from}),
  hit(launch.date.at, 'odometer', {dur: 1.0}),
  ...launch.statuses.slice(1).map((s) => hit(s.at, 'snap')),
  hit(launch.liftOff.from, 'rocket', {dur: launch.liftOff.to - launch.liftOff.from - 1.0}),
  pencil(launch.map.from, launch.map.to - launch.map.from, 0.6),
  {kind: 'stroke' as const, t: launch.usFill.from, dur: launch.usFill.to - launch.usFill.from, pressure: 1.0, tool: 'pen' as const},
  ...SUPERS.launch.flatMap((s) => superCues(superFromBeat(s, {sheet: SUPER_AT, align: 'centre'}, {size: 56, maxWidth: 1080}))),
  ...launch.notes.map((n) => hit(n.press, 'sticky_press')),
  ...launch.notes.map((n) => pencil(n.write.from, n.write.to - n.write.from, 0.9)),
  pencil(launch.crossOut.from, launch.crossOut.to - launch.crossOut.from, 1.3),
  pencil(launch.smallHouse.draw.from, 1.0, 0.6),
  hit(launch.smallHouse.draw.from + 1.0, 'fold', {dur: 1.1}),
  hit(launch.smallHouse.windowLights, 'snap'),
  pencil(launch.mayaInWindow.from, launch.mayaInWindow.to - launch.mayaInWindow.from, 0.7),
].slice().sort((a, b) => a.t - b.t);
