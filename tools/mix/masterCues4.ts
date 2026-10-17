// masterCues4.ts — the 600 s master's foley cue sheet (v4): every chapter's cues (module-local seconds) moved onto the
// master timeline, the protected silences, and the voice-over lines from VO4 as their own list. Validates first and
// exits 1 with every problem listed (unknown sound names, cues outside their chapter, unordered cues, sound inside the
// freeze, the hard stop or the final silence). Output feeds tools/foley/renderCues.ts (it reads `cues`, `silences`,
// `lengthSec`; extra fields are ignored) and tools/mix/mix.py (it reads `silences`, `silenceCues` and `vo`).
//   npx tsx tools/mix/masterCues4.ts                 -> audio/v4/foley/master4.cues.json
//   npx tsx tools/mix/masterCues4.ts --out-dir=out/x
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {buildMasterSheet4} from '../../src/audio/sheet4';
import {VO4} from '../../src/beats4';
import {CHAPTER_MODULES} from '../../src/chapters/registry';
import {SLOTS4} from '../../src/film4';

const flag = (name: string): string | undefined =>
  process.argv.slice(2).find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

try {
  const sheet = buildMasterSheet4((id) => CHAPTER_MODULES[id].cues, VO4);
  const outFile = path.resolve(flag('out-dir') ?? 'audio/v4/foley', 'master4.cues.json');
  mkdirSync(path.dirname(outFile), {recursive: true});
  writeFileSync(outFile, `${JSON.stringify(sheet, null, 1)}\n`);
  const missing = SLOTS4.filter((s) => (CHAPTER_MODULES[s.id].cues ?? []).length === 0).map((s) => s.id);
  process.stdout.write(`master4: ${sheet.cues.length} cues, ${sheet.silences.length} silences, ${sheet.vo.length} VO -> ${path.relative(process.cwd(), outFile)}${missing.length ? `; no cues from ${missing.join(', ')}` : ''}\n`);
} catch (error) {
  process.stderr.write(`masterCues4 failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
