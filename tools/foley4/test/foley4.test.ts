// foley4.test.ts — the v4 parameters do what they say (the generic safety checks over every hit, v4
// included, live in tools/foley/test/sounds.test.ts).
//   node --import tsx --test tools/foley4/test/*.test.ts

import assert from 'node:assert/strict';
import {test} from 'node:test';
import {SR} from '../../foley/core/constants';
import {stereoTruePeakDb} from '../../foley/core/dynamics';
import {ONESHOT_CEILING_DBTP} from '../../foley/render/levels';
import {renderCue, renderHit} from '../../foley/render/sound';
import {validateCues} from '../../foley/render/validate';
import {SFX_NAMES, SFX_NAMES_V1} from '../../foley/sounds/registry';
import {SFX4} from '../registry4';

const seconds = (name: Parameters<typeof renderHit>[0], opts: {dur?: number; rate?: number}): number =>
  renderHit(name, 11, opts).stereo.left.length / SR;

test('the registry holds the 17 v1 names and the 12 v4 names', () => {
  assert.equal(SFX_NAMES_V1.length, 17);
  assert.equal(Object.keys(SFX4).length, 12);
  assert.equal(SFX_NAMES.length, 29);
});

test('dur lengthens the continuous v4 sounds', () => {
  for (const name of ['fold', 'crumple', 'string', 'train', 'plane', 'marble_run', 'odometer', 'scissors', 'pin'] as const) {
    const short = seconds(name, {dur: 0.6});
    const long = seconds(name, {dur: 2.5});
    assert.ok(long > short + 1, `${name}: ${short.toFixed(2)} s -> ${long.toFixed(2)} s`);
  }
});

test('odometer rate sets the tick count (energy rises with rate, length does not)', () => {
  const slow = renderHit('odometer', 5, {dur: 1.5, rate: 4}).stereo;
  const fast = renderHit('odometer', 5, {dur: 1.5, rate: 20}).stereo;
  const energy = (x: Float64Array): number => x.reduce((a, v) => a + v * v, 0);
  assert.ok(Math.abs(slow.left.length - fast.left.length) < 0.3 * SR);
  assert.ok(energy(fast.left) > 2 * energy(slow.left));
});

test('long and fast variants stay true-peak safe', () => {
  const cases = [['marble_run', {dur: 28}], ['fold', {dur: 5}], ['crumple', {dur: 4}], ['odometer', {dur: 5, rate: 30}], ['pin', {dur: 2}], ['train', {dur: 8}]] as const;
  for (const [name, opts] of cases) {
    const {stereo} = renderHit(name, 3, opts);
    assert.ok(stereoTruePeakDb(stereo) <= ONESHOT_CEILING_DBTP, `${name} ${JSON.stringify(opts)}: ${stereoTruePeakDb(stereo)}`);
    assert.equal(stereo.left[0], 0);
    assert.equal(stereo.left[stereo.left.length - 1], 0);
  }
});

test('cues carry dur and rate through validation and rendering', () => {
  const {value} = validateCues([{kind: 'hit', t: 1, name: 'fold', dur: 2}, {kind: 'hit', t: 2, name: 'odometer', dur: 1, rate: 12}]);
  assert.equal(value.length, 2);
  assert.throws(() => validateCues([{kind: 'hit', t: 1, name: 'odometer', rate: 99}]), /rate/);
  const withDur = renderCue({kind: 'hit', t: 1, name: 'fold', dur: 2}).stereo.left.length;
  const plain = renderCue({kind: 'hit', t: 1, name: 'fold'}).stereo.left.length;
  assert.ok(withDur > plain + SR);
});
