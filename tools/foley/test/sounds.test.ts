// sounds.test.ts — behavioural guarantees of every recipe (what a listener would check, as numbers).

import assert from 'node:assert/strict';
import {test} from 'node:test';
import {SR} from '../core/constants';
import {stereoTruePeakDb} from '../core/dynamics';
import {momentaryMax} from '../core/loudness';
import {hashSeed} from '../core/rng';
import {correlation, crackleKurtosis, measure, monoSum} from '../analysis/metrics';
import {ONESHOT_CEILING_DBTP} from '../render/levels';
import {renderContinuous, renderHit} from '../render/sound';
import {SFX_NAMES} from '../sounds/registry';

const TAKES = [1, 2, 3];

test('every hit, every take: true-peak safe, starts and ends on zero, no DC, no NaN', () => {
  for (const name of SFX_NAMES) {
    for (const take of TAKES) {
      const {stereo, syncSample} = renderHit(name, hashSeed('test', name, take));
      const label = `${name} take ${take}`;
      assert.ok(stereo.left.every(Number.isFinite) && stereo.right.every(Number.isFinite), `${label}: non-finite sample`);
      assert.ok(stereoTruePeakDb(stereo) <= ONESHOT_CEILING_DBTP, `${label}: true peak ${stereoTruePeakDb(stereo)}`);
      assert.equal(stereo.left[0], 0, `${label}: first sample`);
      assert.equal(stereo.left[stereo.left.length - 1], 0, `${label}: last sample`);
      const m = measure(stereo);
      assert.ok(m.dcOffset < 1e-5, `${label}: DC ${m.dcOffset}`);
      assert.ok(syncSample >= 1 && syncSample < stereo.left.length, `${label}: sync ${syncSample}`);
    }
  }
});

test('takes differ, but the same seed renders bit-identically', () => {
  for (const name of SFX_NAMES) {
    const a = renderHit(name, 1).stereo.left;
    const b = renderHit(name, 1).stereo.left;
    const c = renderHit(name, 2).stereo.left;
    assert.ok(a.every((v, i) => v === b[i]), `${name}: not deterministic`);
    const n = Math.min(a.length, c.length);
    // the snap is tuned on purpose (same pitch every beat); its takes differ only in strike and decay
    const limit = name === 'snap' ? 0.999 : 0.95;
    assert.ok(Math.abs(correlation(a.subarray(0, n), c.subarray(0, n))) < limit, `${name}: takes too similar`);
  }
});

test('takes of one hit stay within 4 LU of each other (natural variation, not random level)', () => {
  for (const name of SFX_NAMES) {
    const levels = TAKES.map((t) => momentaryMax(renderHit(name, hashSeed('level', name, t)).stereo));
    const spread = Math.max(...levels) - Math.min(...levels);
    assert.ok(spread < 4, `${name}: takes vary by ${spread.toFixed(1)} LU`);
  }
});

test('pencil: harder pressure is louder; faster hand is louder and brighter', () => {
  const seed = hashSeed('test-stroke');
  const at = (pressure: number, speedScale: number) => measure(renderContinuous('pencil', 2, seed, {pressure, speedScale}).stereo);
  const light = at(0.3, 1);
  const normal = at(0.6, 1);
  const hard = at(0.9, 1);
  assert.ok(light.lufsMomentaryMax < normal.lufsMomentaryMax && normal.lufsMomentaryMax < hard.lufsMomentaryMax);
  const slow = at(0.6, 0.5);
  const fast = at(0.6, 1.5);
  assert.ok(slow.lufsMomentaryMax < normal.lufsMomentaryMax && normal.lufsMomentaryMax < fast.lufsMomentaryMax);
  assert.ok(slow.centroidHz < normal.centroidHz && normal.centroidHz < fast.centroidHz);
});

test('pencil is grainy (not Gaussian "shhh"); pen is smoother, brighter and quieter', () => {
  const seed = hashSeed('test-tools');
  const pencil = renderContinuous('pencil', 2, seed, {speedScale: 1}).stereo;
  const pen = renderContinuous('pen', 2, seed, {speedScale: 1}).stereo;
  const kPencil = crackleKurtosis(monoSum(pencil));
  const kPen = crackleKurtosis(monoSum(pen));
  assert.ok(kPencil > 4.5, `pencil crackle ${kPencil}`);
  assert.ok(kPen < kPencil, `pen ${kPen} vs pencil ${kPencil}`);
  assert.ok(measure(pen).centroidHz > measure(pencil).centroidHz);
  assert.ok(momentaryMax(pen) < momentaryMax(pencil));
  assert.ok(measure(pencil).flatness < 0.3, 'pencil spectrum must be shaped, not white');
});

test('continuous sounds honour their duration range', () => {
  for (const dur of [0.15, 5]) {
    const r = renderContinuous('pencil', dur, 7);
    assert.ok(r.stereo.left.length >= Math.round(dur * SR), `stroke ${dur}s too short`);
    assert.equal(r.stereo.left[0], 0);
  }
  for (const key of ['erase', 'slide', 'sweep'] as const) {
    const r = renderContinuous(key, 1.2, 3);
    assert.ok(stereoTruePeakDb(r.stereo) <= ONESHOT_CEILING_DBTP, `${key} true peak`);
  }
});
