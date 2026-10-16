// render.test.ts — cue validation, sample-accurate placement, digital silence, stem safety.

import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {Cue} from '../../../src/audio/cues';
import {SR} from '../core/constants';
import {stereoTruePeakDb} from '../core/dynamics';
import {renderCue} from '../render/sound';
import {renderStem} from '../render/stem';
import {validateCues, validateSilences} from '../render/validate';

test('validation accepts the cue vocabulary and reports every problem at once', () => {
  const good: unknown[] = [
    {kind: 'stroke', t: 0.5, dur: 1.2, pressure: 0.7, tool: 'pen'},
    {kind: 'erase', t: 1, dur: 0.8},
    {kind: 'slide', t: 2, dur: 0.6, pan: -0.3},
    {kind: 'sweep', t: 3, dur: 1.5},
    {kind: 'hit', t: 4, name: 'snap', gain: 0.8, pan: 0.1},
  ];
  assert.equal(validateCues(good).value.length, 5);
  assert.throws(
    () => validateCues([{kind: 'hit', t: -1, name: 'bang'}, {kind: 'stroke', t: 1}, {kind: 'laser', t: 2}]),
    (e: Error) => e.message.includes('cue[0]') && e.message.includes('bang') && e.message.includes('cue[1]') && e.message.includes('cue[2]'),
  );
  assert.throws(() => validateCues({cues: []}), /array/);
  const clamped = validateCues([{kind: 'stroke', t: 0, dur: 9}]);
  assert.equal(clamped.warnings.length, 1);
  assert.throws(() => validateSilences([{start: 5, end: 4}]), /silences\[0\]/);
});

test('a hit sync point lands on the exact sample of its cue time', () => {
  for (const name of ['pencil_click', 'cup_down', 'card_flip', 'snap'] as const) {
    const t = 2.345;
    const solo = renderCue({kind: 'hit', t, name});
    const {stereo} = renderStem({lengthSec: 5, cues: [{kind: 'hit', t, name}]});
    const start = Math.round(t * SR) - solo.syncSample;
    assert.ok(solo.stereo.left.every((v, i) => v === stereo.left[start + i]), `${name}: not placed bit-exactly at ${start}`);
  }
});

test('silences are true digital zero, including tails that spill into them', () => {
  const cues: Cue[] = [
    {kind: 'hit', t: 1.9, name: 'cup_down'}, // its ring would spill past 2.0
    {kind: 'stroke', t: 0.5, dur: 1.4},
  ];
  const {stereo, report} = renderStem({lengthSec: 4, cues, roomTone: true, silences: [{start: 2, end: 3}]});
  const inside = [...stereo.left.subarray(2 * SR, 3 * SR), ...stereo.right.subarray(2 * SR, 3 * SR)];
  assert.ok(inside.every((v) => v === 0), 'non-zero sample inside the silence');
  assert.ok(stereo.left.subarray(3.5 * SR).some((v) => v !== 0), 'room tone should return after the silence');
  assert.equal(report.placed, 2);
});

test('a pile-up of loud cues never exceeds the stem ceiling', () => {
  const cues: Cue[] = Array.from({length: 24}, () => ({kind: 'hit', t: 1, name: 'pencil_click', gain: 4}));
  const {stereo, report} = renderStem({lengthSec: 2, cues});
  assert.ok(report.limiterEngaged);
  assert.ok(stereoTruePeakDb(stereo) <= -0.9, `true peak ${stereoTruePeakDb(stereo)}`);
});

test('cues outside the stem are clipped with a warning, not an error', () => {
  const {report} = renderStem({lengthSec: 1, cues: [{kind: 'stroke', t: 0.5, dur: 2}]});
  assert.ok(report.warnings.some((w) => w.includes('runs past')));
});
