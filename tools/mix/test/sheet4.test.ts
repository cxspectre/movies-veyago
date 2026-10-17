// sheet4.test.ts — the v4 cue-sheet plumbing needs no audio files: the validator, the master sheet on the real
// chapters, and the cut-down re-timing on a hand-made EDL.
//   node --import tsx --test tools/mix/test/*.test.ts
import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {Cue, ModuleCues} from '../../../src/audio/cues';
import {HIT_TAIL_SECONDS, PROTECTED_SILENCES, buildMasterSheet4, cutdownSheet4, placeSegments4, validateChapterCues, validateVo} from '../../../src/audio/sheet4';
import {CHAPTER_MODULES} from '../../../src/chapters/registry';
import {VO4} from '../../../src/beats4';
import type {EditSegment4} from '../../../src/edits4';
import {slotOf4} from '../../../src/film4';
import type {ChapterId} from '../../../src/film4';
import {validateCues} from '../../foley/render/validate';

const hit = (t: number, name = 'tick', extra: object = {}): Cue => ({kind: 'hit', t, name: name as 'tick', ...extra});
const seg = (chapter: ChapterId, from: number, to: number, props?: EditSegment4['props']): EditSegment4 => ({chapter, from, to, note: '', ...(props ? {props} : {})});

test('the validator catches a bad sound name', () => {
  const problems = validateChapterCues('line', [hit(1, 'bang')], 30);
  assert.equal(problems.length, 1);
  assert.match(problems[0] ?? '', /unknown sound name "bang"/);
});

test('the validator catches a cue outside its chapter', () => {
  const problems = validateChapterCues('line', [hit(31), {kind: 'stroke', t: 28, dur: 4}, hit(-1)], 30);
  assert.equal(problems.length, 3);
  assert.ok(problems.some((p) => /past the chapter's 30s/.test(p)));
  assert.ok(problems.some((p) => /before the chapter/.test(p)));
});

test('the validator catches a sound inside each protected silence, and lets the edges through', () => {
  for (const s of PROTECTED_SILENCES) {
    const inside = validateChapterCues(s.chapter, [hit((s.from + s.to) / 2)], 80);
    assert.equal(inside.length, 1, `${s.chapter} ${s.from}-${s.to}`);
    assert.match(inside[0] ?? '', /protected silence/);
    const across = validateChapterCues(s.chapter, [{kind: 'stroke', t: s.from - 1, dur: 1.5}], 80);
    assert.equal(across.length, 1, 'a stroke running into the silence');
    const edges = validateChapterCues(s.chapter, [hit(s.from - 0.01), hit(s.to), {kind: 'stroke', t: s.from - 2, dur: 2}], 80);
    assert.deepEqual(edges, [], 'a sound that ends at the start, or starts at the end, is allowed');
  }
  // the chapter 11 click at 28.0 is the first sound after the final silence
  assert.deepEqual(validateChapterCues('providedFor', [hit(28.0, 'pencil_click')], 30), []);
});

test('the voice-over check flags a line that speaks into a silence', () => {
  const line = VO4.find((v) => v.id === 'F2');
  assert.ok(line);
  assert.deepEqual(validateVo([line]), []);
  assert.equal(validateVo([{...line, chapter: 'mayasHouse', start: 27.5, estimatedEnd: 29.5}]).length, 1);
});

test('the master sheet fails loudly on a bad chapter and names it', () => {
  const bad = (id: ChapterId): ModuleCues | undefined => (id === 'mayasHouse' ? [hit(28.5)] : id === 'theNo' ? [hit(1, 'bang')] : []);
  assert.throws(() => buildMasterSheet4(bad, []), (e: Error) => /mayasHouse/.test(e.message) && /theNo/.test(e.message) && /protected silence/.test(e.message));
});

test('the master sheet places cues on the 600 s timeline, ordered, with the three silences', () => {
  const sheet = buildMasterSheet4((id) => (id === 'theNo' ? [hit(5, 'tick'), hit(2, 'tick')] : []), []);
  assert.equal(sheet.lengthSec, 600);
  assert.deepEqual(sheet.cues.map((c) => c.t), [slotOf4('theNo').start + 2, slotOf4('theNo').start + 5]);
  assert.deepEqual(sheet.silences.map((s) => [s.start, s.end]), [[58.0, 59.0], [slotOf4('paperToGlass').start + 68, slotOf4('paperToGlass').start + 70], [slotOf4('providedFor').start + 24, slotOf4('providedFor').start + 28]].sort((a, b) => (a[0] ?? 0) - (b[0] ?? 0)));
  assert.deepEqual(sheet.silenceCues.map((c) => c.kind), ['silence', 'silence', 'silence']);
});

test('the real chapters build a valid master sheet that the v1 foley validator accepts (after clampCues.py)', () => {
  const sheet = buildMasterSheet4((id) => CHAPTER_MODULES[id].cues, VO4);
  assert.ok(sheet.cues.length > 100);
  assert.equal(sheet.vo.length, VO4.length);
  for (let i = 1; i < sheet.cues.length; i++) assert.ok((sheet.cues[i]?.t ?? 0) >= (sheet.cues[i - 1]?.t ?? 0));
  // some chapters ask for pressure above 1 ("harder"); tools/mix/clampCues.py clamps it before the foley render
  const clamped = sheet.cues.map((c) => (c.kind === 'stroke' && c.pressure !== undefined ? {...c, pressure: Math.min(1, Math.max(0, c.pressure))} : c));
  assert.equal(validateCues(clamped).value.length, sheet.cues.length);
});

test('cut-down re-timing on a hand-made EDL', () => {
  // chapter cues (local): a hit at 2.0, one at 5.0, a stroke 3.0-9.0
  const cues: ModuleCues = [hit(2.0), hit(5.0), {kind: 'stroke', t: 3.0, dur: 6.0, pressure: 0.5}];
  const edl = {id: 'T', format: 'tall' as const, segments: [seg('theNo', 1.0, 6.0), seg('launch', 10.0, 12.0, {music: '', sfxAt: {pencil_down: 0.5}})]};
  const placed = placeSegments4(edl.segments);
  assert.deepEqual(placed.map((p) => [p.start, p.end]), [[0, 5], [5, 7]]);
  const sheet = cutdownSheet4(edl, (id) => (id === 'theNo' ? cues : id === 'launch' ? [hit(10.5, 'tick')] : []));
  // segment 0: hit 2.0 -> 1.0; hit 5.0 starts 1.0 s before the cut, whole; the stroke is clamped to 3.0-6.0 -> edit 2.0, dur 3.0
  const hits0 = sheet.cues.filter((c) => c.segment === 0 && c.kind === 'hit').map((c) => c.t);
  assert.deepEqual(hits0, [1.0, 4.0]);
  const stroke = sheet.cues.find((c) => c.kind === 'stroke');
  assert.ok(stroke && stroke.kind === 'stroke');
  assert.equal(stroke.t, 2.0);
  assert.equal(stroke.dur, 3.0);
  assert.equal(stroke.clamped, 'end');
  // segment 1: the chapter hit 10.5 -> 5.5 and the sfxAt pencil_down at 5.5
  assert.deepEqual(sheet.cues.filter((c) => c.segment === 1).map((c) => c.kind === 'hit' ? [c.name, c.t] : []), [['tick', 5.5], ['pencil_down', 5.5]]);
  assert.equal(sheet.lengthSec, 7);
  assert.deepEqual(sheet.warnings, []);
});

test('a hit too close to a cut is dropped, not chopped; the last segment lets it ring out', () => {
  const close = hit(5.0 - HIT_TAIL_SECONDS / 2);
  const mid = cutdownSheet4({id: 'T', format: 'tall', segments: [seg('theNo', 0, 5), seg('theNo', 10, 12)]}, () => [close]);
  assert.equal(mid.cues.length, 0, 'followed by more picture: dropped');
  const last = cutdownSheet4({id: 'T', format: 'tall', segments: [seg('theNo', 0, 5)]}, () => [close]);
  assert.equal(last.cues.length, 1, 'the end of the film: stays');
});

test('a hit with a dur is clamped at the cut, a stroke cut at both ends is marked both', () => {
  const sheet = cutdownSheet4({id: 'T', format: 'tall', segments: [seg('theNo', 2, 4)]}, () => [hit(3.0, 'train', {dur: 5}), {kind: 'stroke', t: 0, dur: 10}]);
  const train = sheet.cues.find((c) => c.kind === 'hit');
  assert.ok(train && train.kind === 'hit');
  assert.equal(train.dur, 1.0);
  const stroke = sheet.cues.find((c) => c.kind === 'stroke');
  assert.equal(stroke?.kind === 'stroke' ? stroke.dur : 0, 2.0);
  assert.equal(stroke?.clamped, 'both');
});

test('the cut-down carries the silence, re-timed, and warns about a sound inside it', () => {
  const edl = {id: 'T', format: 'tall' as const, segments: [seg('theNo', 0, 3), seg('paperToGlass', 66, 72)]};
  const sheet = cutdownSheet4(edl, (id) => (id === 'paperToGlass' ? [hit(69.0, 'tick')] : []));
  assert.deepEqual(sheet.silences.map((s) => [s.start, s.end]), [[5.0, 7.0]]);
  assert.deepEqual(sheet.silenceCues, [{kind: 'silence', at: 5.0, dur: 2.0}]);
  assert.equal(sheet.warnings.length, 1);
  assert.match(sheet.warnings[0] ?? '', /falls in the silence 5-7s/);
});

test('the real hook keeps the hard stop and the real cut keeps both silences', () => {
  const cuesOf = (id: ChapterId): ModuleCues | undefined => CHAPTER_MODULES[id].cues;
  // imported lazily so a broken EDL surfaces as a test failure, not an import error
  return import('../../../src/edits4').then(({HOOK_75, CUT_180}) => {
    const hook = cutdownSheet4({id: 'Hook75', format: 'tall', segments: HOOK_75}, cuesOf);
    assert.equal(hook.lengthSec, 75);
    assert.equal(hook.silences.length, 1);
    assert.equal((hook.silences[0]?.end ?? 0) - (hook.silences[0]?.start ?? 0), 2);
    assert.deepEqual(hook.warnings, []);
    const cut = cutdownSheet4({id: 'Cut180', format: 'tall', segments: CUT_180}, cuesOf);
    assert.equal(cut.lengthSec, 180);
    assert.deepEqual(cut.warnings, []);
  });
});
