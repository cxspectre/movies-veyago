// captions4.test.ts — the caption maths needs no audio files.
//   node --import tsx --test tools/captions4.test.ts
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {CAPTION_IDS, cueProblems, cuesFor, durationsFrom, lineCues, timestamp, toSrt, toVtt, wavSeconds, wrapLines} from './captions4';
import {VO4} from '../src/beats4';
import {EDLS4} from '../src/edits4';
import {placeSegments4} from '../src/audio/sheet4';

const wav = (seconds: number, rate = 8000): Uint8Array => {
  const data = Math.round(seconds * rate * 2);
  const b = new Uint8Array(44 + data);
  const v = new DataView(b.buffer);
  b.set([...'RIFF'].map((c) => c.charCodeAt(0)), 0);
  v.setUint32(4, 36 + data, true);
  b.set([...'WAVEfmt '].map((c) => c.charCodeAt(0)), 8);
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  b.set([...'data'].map((c) => c.charCodeAt(0)), 36);
  v.setUint32(40, data, true);
  return b;
};

test('a WAV header gives the duration; junk gives undefined', () => {
  assert.equal(wavSeconds(wav(2.5)), 2.5);
  assert.equal(wavSeconds(new Uint8Array(10)), undefined);
});

test('timestamps use a comma in SRT and a dot in VTT', () => {
  assert.equal(timestamp(3661.5, ','), '01:01:01,500');
  const cues = [{start: 1, end: 2.25, lines: ['Hello']}];
  assert.match(toSrt(cues), /^1\n00:00:01,000 --> 00:00:02,250\nHello\n/);
  assert.match(toVtt(cues), /^WEBVTT\n\n00:00:01\.000 --> 00:00:02\.250\nHello\n/);
});

test('wrapLines balances two lines of at most 42 characters, or refuses', () => {
  const two = wrapLines('Some weeks I am the mom, the daughter, and the one');
  assert.ok(two && two.length === 2 && two.every((l) => l.length <= 42));
  assert.equal(wrapLines('x'.repeat(100)), undefined);
  assert.deepEqual(wrapLines('Short.'), ['Short.']);
});

test('a long slow line is split so no cue passes 7 s', () => {
  const cues = lineCues('A very long sentence that goes on and on, and on again, well past what two short lines can hold at all, truly.', 0, 20);
  assert.ok(cues.length >= 3);
  assert.deepEqual(cueProblems('t', cues.map((c, i) => ({...c, start: c.start, end: c.end, lines: c.lines, i}))), []);
});

test('a recorded stem replaces the estimate', () => {
  const line = VO4[0];
  assert.ok(line);
  assert.equal(durationsFrom(undefined)(line), Math.round((line.estimatedEnd - line.start) * 1000) / 1000);
});

test('every output is well-formed on the real script', () => {
  const duration = durationsFrom(undefined);
  for (const id of CAPTION_IDS) assert.deepEqual(cueProblems(id, cuesFor(id, duration)), [], id);
});

test('the master has a cue starting at every voice line', () => {
  const cues = cuesFor('master4', durationsFrom(undefined));
  for (const l of VO4) assert.ok(cues.some((c) => Math.abs(c.start - l.masterStart) < 0.01), l.id);
});

test('no cut-down cue crosses a segment boundary', () => {
  const duration = durationsFrom(undefined);
  for (const edl of EDLS4) {
    const placed = placeSegments4(edl.segments);
    for (const c of cuesFor(edl.id, duration)) {
      const p = placed.find((s) => c.start >= s.start - 1e-6 && c.start < s.end);
      assert.ok(p, `${edl.id} cue at ${c.start} is in no segment`);
      assert.ok(c.end <= p.end + 1e-6, `${edl.id} cue ${c.start}-${c.end} crosses the cut at ${p.end}`);
    }
  }
});

test('Cut180 drops the M11 sentence the EDL cuts, and keeps the first sentences', () => {
  const text = cuesFor('Cut180', durationsFrom(undefined)).map((c) => c.lines.join(' ')).join(' | ');
  assert.match(text, /No account\. Nothing is collected\./);
  assert.doesNotMatch(text, /Sharing goes straight/);
});
