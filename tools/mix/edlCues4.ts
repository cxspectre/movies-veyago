// edlCues4.ts — the cut-downs' foley cue sheets (v4) in EDIT seconds: HOOK_75, CUT_180 and the chapter shorts of
// src/edits4.ts. Each chapter's cues are sliced to every segment, re-timed, and clamped at the cut points (see
// sliceCue4 in src/audio/sheet4.ts); the segment's `sfxAt` hits, the silences and the VO placements come along.
// Also writes edl-segments4.json (each segment's edit start and MASTER source range) for the room-tone/music slicing.
//   npx tsx tools/mix/edlCues4.ts                       all EDLs -> audio/v4/foley/edl/<id>.cues.json
//   npx tsx tools/mix/edlCues4.ts --edl=Hook75          one EDL
//   npx tsx tools/mix/edlCues4.ts --out-dir=out/edl     elsewhere
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {cutdownSheet4, placeSegments4} from '../../src/audio/sheet4';
import {CHAPTER_MODULES} from '../../src/chapters/registry';
import {EDLS4, validateEdls4} from '../../src/edits4';
import {slotOf4} from '../../src/film4';

const flag = (name: string): string | undefined =>
  process.argv.slice(2).find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

try {
  const problems = validateEdls4();
  if (problems.length > 0) throw new Error(`the v4 EDLs are invalid:\n  ${problems.join('\n  ')}`);
  const only = flag('edl');
  const edls = only ? EDLS4.filter((e) => e.id === only) : EDLS4;
  if (edls.length === 0) throw new Error(`No EDL "${only}" (known: ${EDLS4.map((e) => e.id).join(', ')})`);
  const outDir = path.resolve(flag('out-dir') ?? 'audio/v4/foley/edl');
  mkdirSync(outDir, {recursive: true});
  for (const edl of edls) {
    const sheet = cutdownSheet4(edl, (id) => CHAPTER_MODULES[id].cues);
    const file = path.join(outDir, `${edl.id}.cues.json`);
    writeFileSync(file, `${JSON.stringify(sheet, null, 1)}\n`);
    process.stdout.write(`${edl.id}: ${sheet.cues.length} cues, ${sheet.silences.length} silences, ${sheet.vo.length} VO -> ${path.relative(process.cwd(), file)}\n`);
    for (const w of sheet.warnings) process.stderr.write(`  warning (${edl.id}): ${w}\n`);
  }
  const segments = EDLS4.map((edl) => ({
    id: edl.id,
    seconds: placeSegments4(edl.segments).at(-1)?.end ?? 0,
    segments: placeSegments4(edl.segments).map((p) => ({
      chapter: p.chapter, start: p.start, seconds: p.end - p.start,
      masterFrom: Math.round((slotOf4(p.chapter).start + p.segment.from) * 1000) / 1000,
      masterTo: Math.round((slotOf4(p.chapter).start + p.segment.to) * 1000) / 1000,
    })),
  }));
  const segFile = path.resolve(flag('segments-out') ?? 'audio/v4/mix/edl-segments4.json');
  mkdirSync(path.dirname(segFile), {recursive: true});
  writeFileSync(segFile, `${JSON.stringify(segments, null, 1)}\n`);
  process.stdout.write(`wrote ${path.relative(process.cwd(), segFile)}\n`);
} catch (error) {
  process.stderr.write(`edlCues4 failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
