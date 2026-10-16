// core.test.ts — the measuring instruments must be right before we trust what they say about sounds.
// Run: npx tsx --test tools/foley/test/*.test.ts

import assert from 'node:assert/strict';
import {test} from 'node:test';
import {SR} from '../core/constants';
import {limitTruePeak, stereoTruePeakDb, truePeak} from '../core/dynamics';
import {integrated, momentaryMax} from '../core/loudness';
import {createRng, hashSeed} from '../core/rng';
import {gainToDb, peakAbs} from '../core/signal';
import {encodeWav24, readWav} from '../core/wav';
import {mkdtempSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

const sine = (hz: number, amp: number, sec: number, phase = 0): Float64Array =>
  Float64Array.from({length: Math.round(sec * SR)}, (_, i) => amp * Math.sin((2 * Math.PI * hz * i) / SR + phase));

test('rng is deterministic and seeds are distinct', () => {
  const a = createRng(42);
  const b = createRng(42);
  assert.deepEqual([a.next(), a.next(), a.next()], [b.next(), b.next(), b.next()]);
  assert.notEqual(hashSeed('hit', 'tick', 100), hashSeed('hit', 'tick', 101));
  assert.notEqual(createRng(1).fork('x').next(), createRng(1).fork('y').next());
});

test('loudness of a 1 kHz stereo sine matches BS.1770 (reads 10 log10 of the summed channel mean squares)', () => {
  const x = sine(1000, 0.1, 3);
  // K-weighting is +0.691 dB at 1 kHz, which the -0.691 offset cancels: LUFS = 10 log10(sum of channel mean squares)
  const expected = 10 * Math.log10(2 * ((0.1 * 0.1) / 2));
  assert.ok(Math.abs(integrated({left: x, right: x}) - expected) < 0.15, `integrated ${integrated({left: x, right: x})} vs ${expected}`);
  assert.ok(Math.abs(momentaryMax({left: x, right: x}) - expected) < 0.15);
});

test('true peak finds the inter-sample peak a sample-peak meter misses', () => {
  const x = sine(SR / 4, 1, 0.1, Math.PI / 4); // samples land at +-0.707, the waveform reaches 1.0
  assert.ok(peakAbs(x) < 0.71);
  assert.ok(gainToDb(truePeak(x)) > -0.3, `true peak ${gainToDb(truePeak(x))} dB`);
});

test('the stem limiter holds the ceiling and leaves quiet material untouched', () => {
  const loud = sine(440, 1.5, 0.5);
  const limited = limitTruePeak({left: loud, right: loud}, -1);
  assert.ok(limited.engaged);
  assert.ok(stereoTruePeakDb(limited.stereo) <= -0.9, `got ${stereoTruePeakDb(limited.stereo)}`);
  const quiet = sine(440, 0.1, 0.5);
  const untouched = limitTruePeak({left: quiet, right: quiet}, -1);
  assert.equal(untouched.engaged, false);
  assert.equal(untouched.stereo.left, quiet);
});

test('24-bit WAV round trip is exact to one LSB and keeps digital zero', () => {
  const x = Float64Array.from([0, 0.5, -0.5, 1e-9, -0.25, 0]);
  const dir = mkdtempSync(join(tmpdir(), 'foley-wav-'));
  const path = join(dir, 't.wav');
  writeFileSync(path, encodeWav24({left: x, right: x.map((v) => -v)}));
  const back = readWav(path);
  assert.equal(back.sampleRate, SR);
  assert.equal(back.bits, 24);
  back.stereo.left.forEach((v, i) => assert.ok(Math.abs(v - (x[i] ?? 0)) <= 1 / 8388607));
  assert.equal(back.stereo.left[0], 0);
  assert.equal(back.stereo.left[3], 0); // below one LSB rounds to exact zero
});
