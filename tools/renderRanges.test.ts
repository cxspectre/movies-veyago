// renderRanges.test.ts — the chunk ranges must tile the master exactly.
//   node --import tsx --test tools/renderRanges.test.ts
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {MASTER4_SECONDS, SLOTS4} from '../src/film4';
import {sec} from '../src/film';
import {chunkRanges, tilingProblems} from './renderRanges';

const TOTAL = sec(MASTER4_SECONDS);

test('the master is 18,000 frames', () => assert.equal(TOTAL, 18000));

test('--slots4 tiles frames 0-17999 with no gap or overlap', () => {
  const ranges = chunkRanges(TOTAL, {slots4: true});
  assert.deepEqual(tilingProblems(ranges, TOTAL), []);
  assert.equal(ranges[0]!.from, 0);
  assert.equal(ranges[ranges.length - 1]!.to, TOTAL - 1);
});

test('--slots4 matches SLOTS4 chapter by chapter', () => {
  const ranges = chunkRanges(TOTAL, {slots4: true});
  assert.equal(ranges.length, SLOTS4.length);
  ranges.forEach((r, i) => {
    assert.equal(r.name, SLOTS4[i]!.id);
    assert.equal(r.from, sec(SLOTS4[i]!.start));
    assert.equal(r.to, sec(SLOTS4[i]!.end) - 1);
  });
});

test('--chunk sizes tile too, including a size that does not divide 18000', () => {
  for (const chunk of [300, 450, 7, 17999, 18000, 40000]) {
    assert.deepEqual(tilingProblems(chunkRanges(TOTAL, {chunk}), TOTAL), [], `chunk ${chunk}`);
  }
});

test('the tiling check catches a gap, an overlap and a short end', () => {
  const r = chunkRanges(TOTAL, {slots4: true});
  assert.ok(tilingProblems([r[0]!, r[2]!], TOTAL).some((p) => p.startsWith('gap')));
  assert.ok(tilingProblems([r[0]!, r[0]!, r[1]!], TOTAL).some((p) => p.startsWith('overlap')));
  assert.ok(tilingProblems(r.slice(0, -1), TOTAL).some((p) => p.includes('ranges end')));
});

test('a bad --chunk is refused', () => assert.throws(() => chunkRanges(TOTAL, {chunk: 0})));
