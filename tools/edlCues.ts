// edlCues.ts — CLI: the foley cue sheet of each cut-down, in EDIT seconds, for tools/foley/renderCues.ts.
// Module cues (each scene folder's `cues`, module-local seconds) are sliced to every EDL segment and offset onto the
// edit's timeline; the segment's `sfxAt` hits, the cut-down's silences and the VO placements come along.
//
//   npx tsx tools/edlCues.ts                         all EDLs -> audio/foley/edl/<id>.cues.json
//   npx tsx tools/edlCues.ts --edl=Vertical45        one EDL
//   npx tsx tools/edlCues.ts --out-dir=out/edl       elsewhere
//   npx tsx tools/edlCues.ts --edl=Teaser15 --stdout print instead of writing
//
// Then: npx tsx tools/foley/renderCues.ts --cues audio/foley/edl/Vertical45.cues.json --out audio/foley/stems/foley-vertical.wav
// (the file carries `lengthSec` and `silences`, which renderCues reads; extra fields are ignored by it).
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import type {ModuleCues} from '../src/audio/cues';
import {EDLS, type Edl} from '../src/edits';
import type {ModuleId} from '../src/film';
import {assertEdl} from '../src/edit/checks';
import {edlCueSheet} from '../src/edit/edlCues';
import {SCENES} from '../src/scenes/registry';

const DEFAULT_OUT_DIR = 'audio/foley/edl';

const flag = (name: string): string | undefined =>
  process.argv
    .slice(2)
    .find((a) => a.startsWith(`--${name}=`))
    ?.slice(name.length + 3);
const has = (name: string): boolean => process.argv.slice(2).includes(`--${name}`);

const cuesOf = (module: ModuleId): ModuleCues | undefined => SCENES[module].cues;

const pickEdls = (id: string | undefined): readonly Edl[] => {
  if (id === undefined) return EDLS;
  const edl = EDLS.find((e) => e.id === id);
  if (!edl) throw new Error(`No EDL "${id}" (known: ${EDLS.map((e) => e.id).join(', ')})`);
  return [edl];
};

const main = (): void => {
  const outDir = path.resolve(flag('out-dir') ?? DEFAULT_OUT_DIR);
  const toStdout = has('stdout');
  for (const edl of pickEdls(flag('edl')).map(assertEdl)) {
    const sheet = edlCueSheet(edl, cuesOf);
    const json = `${JSON.stringify(sheet, null, 2)}\n`;
    if (toStdout) {
      process.stdout.write(json);
    } else {
      mkdirSync(outDir, {recursive: true});
      const file = path.join(outDir, `${edl.id}.cues.json`);
      writeFileSync(file, json);
      const stubs = sheet.modulesWithoutCues.length > 0 ? `; no cues yet from ${sheet.modulesWithoutCues.join(', ')}` : '';
      process.stdout.write(`${edl.id}: ${sheet.cues.length} cues, ${sheet.silences.length} silences, ${sheet.vo.length} VO -> ${path.relative(process.cwd(), file)}${stubs}\n`);
    }
    for (const w of sheet.warnings) process.stderr.write(`  warning (${edl.id}): ${w}\n`);
  }
};

try {
  main();
} catch (error) {
  process.stderr.write(`edlCues failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
