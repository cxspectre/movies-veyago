// renderCues.ts — CLI: a JSON cue list (MASTER seconds) -> a foley stem WAV (48 kHz, 24-bit, stereo).
//
//   npx tsx tools/foley/renderCues.ts --cues cues.json --out audio/foley/stems/foley.wav [options]
//
// cues.json is either an array of cues ({t, kind, ...} as in src/audio/cues.ts, t in master seconds),
// or {"cues": [...], "silences": [{"start": 113, "end": 115}], "lengthSec": 160}.
// Options:
//   --length <s>          stem length (default: lengthSec from the file, else last cue + 2 s)
//   --module <id>         cues are module-local for this module of src/film.ts SLOTS (adds its start)
//   --offset <s>          add a constant offset to every t (applied after --module)
//   --silence <a:b>       true digital silence from a to b seconds (repeatable; also from the file)
//   --room-tone           add the room-tone bed (calibrated to -60 LUFS)
//   --room-tone-only      write only the room-tone bed (with the silences)
//   --snap-hz <hz>        tune the 'snap' hits (default 880, A5)
//   --ceiling <dBTP>      stem true-peak ceiling (default -1)

import {readFileSync} from 'node:fs';
import type {Cue} from '../../src/audio/cues';
import {SLOTS, type ModuleId} from '../../src/film';
import {writeWav24} from './core/wav';
import {num, one, parseArgs} from './render/args';
import {calibratedRoomTone, renderStem} from './render/stem';
import {validateCues, validateSilences} from './render/validate';
import type {Silence} from './sounds/roomTone';

const DEFAULT_TAIL_SEC = 2;
const HELP = `renderCues --cues <cues.json> --out <stem.wav> [--length s] [--module id] [--offset s]
  [--silence a:b ...] [--room-tone | --room-tone-only] [--snap-hz hz] [--ceiling dBTP]
Cue times are MASTER seconds unless --module/--offset shift them. See audio/foley/README.md.
`;
const FLAGS = ['room-tone', 'room-tone-only', 'help'] as const;

type CueFile = {cues: unknown; silences?: unknown; lengthSec?: unknown};

function readCueFile(path: string): CueFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`Could not read cues from ${path}: ${(error as Error).message}`);
  }
  if (Array.isArray(parsed)) return {cues: parsed};
  if (typeof parsed === 'object' && parsed !== null && 'cues' in parsed) return parsed as CueFile;
  throw new Error(`${path}: expected an array of cues or an object with a 'cues' array`);
}

function moduleOffset(id: string | undefined): number {
  if (id === undefined) return 0;
  const slot = SLOTS.find((s) => s.id === (id as ModuleId));
  if (!slot) throw new Error(`Unknown module '${id}' (known: ${SLOTS.map((s) => s.id).join(', ')})`);
  return slot.start;
}

function parseSilence(text: string): Silence {
  const [a, b] = text.split(':').map(Number);
  if (a === undefined || b === undefined || !Number.isFinite(a) || !Number.isFinite(b) || b <= a) {
    throw new Error(`--silence expects start:end in seconds (got '${text}')`);
  }
  return {start: a, end: b};
}

const cueEnd = (c: Cue): number => c.t + (c.kind === 'hit' ? 1 + (c.dur ?? 0) : c.dur);

function main(argv: readonly string[]): void {
  const args = parseArgs(argv, FLAGS);
  if (args.flags.has('help')) {
    process.stdout.write(HELP);
    return;
  }
  const out = one(args, 'out');
  if (!out) throw new Error('--out <file.wav> is required');
  const cuePath = one(args, 'cues');
  const file: CueFile = cuePath ? readCueFile(cuePath) : {cues: []};
  const shift = moduleOffset(one(args, 'module')) + (num(args, 'offset') ?? 0);
  const {value, warnings} = validateCues(file.cues);
  const cues = value.map((c) => ({...c, t: c.t + shift}));
  const silences = [...validateSilences(file.silences), ...(args.values.get('silence') ?? []).map(parseSilence)];
  const fileLength = typeof file.lengthSec === 'number' ? file.lengthSec : undefined;
  const lengthSec = num(args, 'length') ?? fileLength ?? Math.max(1, ...cues.map(cueEnd)) + DEFAULT_TAIL_SEC;
  if (args.flags.has('room-tone-only')) {
    writeWav24(out, calibratedRoomTone(lengthSec, silences));
    process.stdout.write(`room tone ${lengthSec}s -> ${out}\n`);
    return;
  }
  const {stereo, report} = renderStem({
    lengthSec,
    cues,
    silences,
    roomTone: args.flags.has('room-tone'),
    snapHz: num(args, 'snap-hz'),
    ceilingDbTp: num(args, 'ceiling'),
  });
  writeWav24(out, stereo);
  const notes = [...warnings, ...report.warnings].map((w) => `  warning: ${w}`).join('\n');
  const limiter = report.limiterEngaged ? `limiter engaged (max ${report.limiterMaxReductionDb.toFixed(2)} dB)` : 'limiter idle';
  process.stdout.write(
    `${report.placed} cues, ${lengthSec.toFixed(3)}s -> ${out}\n  true peak ${report.truePeakDbTp.toFixed(2)} dBTP, ${limiter}\n${notes ? notes + '\n' : ''}`,
  );
}

try {
  main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`renderCues: ${(error as Error).message}\n`);
  process.exitCode = 1;
}
