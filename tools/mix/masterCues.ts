// masterCues.ts — the 2:40 master's foley cue sheet: every scene module's cues (module-local seconds) moved onto the
// master timeline, plus the hard-stop silence at 1:53-1:55 (BIBLE 7.2). Output feeds tools/foley/renderCues.ts.
//   npx tsx tools/mix/masterCues.ts            -> audio/foley/master.cues.json
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import type {Cue} from '../../src/audio/cues';
import {MASTER_SECONDS, SLOTS, at} from '../../src/film';
import {SCENES} from '../../src/scenes/registry';

const round3 = (n: number): number => Math.round(n * 1000) / 1000;
const HARD_STOP = {start: at(1, 53), end: at(1, 55), reason: 'hard stop: one full second of nothing, held to the title (BIBLE 7.2)'};

const placed = SLOTS.flatMap((slot) =>
  (SCENES[slot.id].cues ?? []).map((cue): Cue => ({...cue, t: round3(cue.t + slot.start)})),
).sort((a, b) => a.t - b.t);

const outFile = path.resolve('audio/foley/master.cues.json');
mkdirSync(path.dirname(outFile), {recursive: true});
writeFileSync(outFile, `${JSON.stringify({cues: placed, silences: [HARD_STOP], lengthSec: MASTER_SECONDS}, null, 1)}\n`);
const missing = SLOTS.filter((s) => (SCENES[s.id].cues ?? []).length === 0).map((s) => s.id);
process.stdout.write(`master: ${placed.length} cues -> ${path.relative(process.cwd(), outFile)}${missing.length ? `; no cues from ${missing.join(', ')}` : ''}\n`);
