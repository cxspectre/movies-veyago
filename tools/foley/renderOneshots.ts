// renderOneshots.ts — CLI: pre-render every SfxName (3 takes each), example continuous sounds and a room
// tone loop into audio/foley/oneshots/, with a catalogue index.json.
//
//   npx tsx tools/foley/renderOneshots.ts [--out audio/foley/oneshots] [--variants 3] [--snap-hz 880]

import {writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import type {SfxName} from '../../src/audio/cues';
import {stereoTruePeakDb} from './core/dynamics';
import {momentaryMax} from './core/loudness';
import {hashSeed} from './core/rng';
import {fadeInOut} from './core/envelope';
import {gainToDb, multiply, peakAbs, rms} from './core/signal';
import type {Stereo} from './core/space';
import {writeWav24} from './core/wav';
import {num, one, parseArgs} from './render/args';
import {ONESHOT_CEILING_DBTP, type ContinuousKey} from './render/levels';
import {renderContinuous, renderHit, type Rendered} from './render/sound';
import {calibratedRoomTone} from './render/stem';
import {SFX, SFX_NAMES_V1, type Family} from './sounds/registry';

const DEFAULT_OUT = 'audio/foley/oneshots';
const DEFAULT_VARIANTS = 3;
const ROOM_LOOP_SEC = 20;
const ROOM_LOOP_FADE_SEC = 0.05;
const SR_RATE = 48_000;

export type CatalogEntry = {
  readonly name: string;
  readonly kind: 'hit' | 'stroke' | 'erase' | 'slide' | 'sweep' | 'room';
  readonly family: Family;
  readonly variant: number;
  readonly file: string;
  readonly duration: number;
  readonly syncSec: number;
  readonly peak: number;
  readonly truePeak: number;
  readonly rms: number;
  readonly lufsMomentaryMax: number;
  readonly description: string;
};

type Example = {name: string; key: ContinuousKey; dur: number; pressure?: number; family: Family; description: string};

const CONTINUOUS_EXAMPLES: readonly Example[] = [
  {name: 'stroke_pencil', key: 'pencil', dur: 1.6, family: 'drawing', description: 'Graphite pencil line, pressure 0.6: chained hand sub-movements, paper tooth grain, stick-slip crackle.'},
  {name: 'stroke_pencil_light', key: 'pencil', dur: 1.6, pressure: 0.3, family: 'drawing', description: 'The same pencil, light pressure 0.3 (quieter and duller).'},
  {name: 'stroke_pencil_short', key: 'pencil', dur: 0.25, family: 'drawing', description: 'A short dash (0.25 s): one sub-movement.'},
  {name: 'stroke_pen', key: 'pen', dur: 1.6, family: 'drawing', description: 'Fine pen line: smoother, thinner, higher and quieter than graphite.'},
  {name: 'erase', key: 'erase', dur: 1.4, family: 'drawing', description: 'Soft eraser rubbed back and forth (~3.8 Hz): dull friction, sheet flex, crumbs. No squeak.'},
  {name: 'slide', key: 'slide', dur: 0.8, family: 'paper', description: 'An A3 sheet slid across the desk: low rustle following a min-jerk move, flutter, soft settle.'},
  {name: 'sweep', key: 'sweep', dur: 1.6, family: 'glass', description: 'Edge-light sweep: restrained air glide plus a fixed-pitch glassy shimmer, panned with the light.'},
];

function stats(s: Stereo): Pick<CatalogEntry, 'duration' | 'peak' | 'truePeak' | 'rms' | 'lufsMomentaryMax'> {
  const round = (v: number): number => Math.round(v * 100) / 100;
  return {
    duration: Math.round((s.left.length / SR_RATE) * 1000) / 1000,
    peak: round(gainToDb(Math.max(peakAbs(s.left), peakAbs(s.right)))),
    truePeak: round(stereoTruePeakDb(s)),
    rms: round(gainToDb(Math.sqrt((rms(s.left) ** 2 + rms(s.right) ** 2) / 2))),
    lufsMomentaryMax: round(momentaryMax(s)),
  };
}

function save(dir: string, base: Omit<CatalogEntry, 'file' | 'duration' | 'peak' | 'truePeak' | 'rms' | 'lufsMomentaryMax' | 'syncSec'>, r: Rendered): CatalogEntry {
  const file = `${base.name}_${base.variant}.wav`;
  const entry: CatalogEntry = {...base, file, syncSec: Math.round((r.syncSample / SR_RATE) * 10000) / 10000, ...stats(r.stereo)};
  if (entry.truePeak > ONESHOT_CEILING_DBTP) throw new Error(`${file}: true peak ${entry.truePeak} dBTP exceeds ${ONESHOT_CEILING_DBTP} dBTP`);
  writeWav24(join(dir, file), r.stereo);
  return entry;
}

function renderHits(dir: string, variants: number, snapHz: number | undefined): CatalogEntry[] {
  return SFX_NAMES_V1.flatMap((name: SfxName) =>
    Array.from({length: variants}, (_, v) =>
      save(dir, {name, kind: 'hit', family: SFX[name].family, variant: v + 1, description: SFX[name].description}, renderHit(name, hashSeed('oneshot', name, v + 1), {snapHz})),
    ),
  );
}

function renderExamples(dir: string): CatalogEntry[] {
  return CONTINUOUS_EXAMPLES.flatMap((ex) =>
    [1, 2].map((variant) => {
      const kind = ex.key === 'pencil' || ex.key === 'pen' ? 'stroke' : ex.key;
      const r = renderContinuous(ex.key, ex.dur, hashSeed('oneshot', ex.name, variant), {pressure: ex.pressure});
      return save(dir, {name: ex.name, kind, family: ex.family, variant, description: ex.description}, r);
    }),
  );
}

function renderRoom(dir: string): CatalogEntry {
  const room = calibratedRoomTone(ROOM_LOOP_SEC, []);
  const fade = fadeInOut(room.left.length, ROOM_LOOP_FADE_SEC, ROOM_LOOP_FADE_SEC);
  const stereo = {left: multiply(room.left, fade), right: multiply(room.right, fade)};
  return save(dir, {name: 'room_tone', kind: 'room', family: 'room', variant: 1, description: `Warm quiet room, ${ROOM_LOOP_SEC} s, calibrated to -60 LUFS integrated. Use renderCues --room-tone-only for a full-length bed.`}, {stereo, syncSample: 0});
}

function main(argv: readonly string[]): void {
  const args = parseArgs(argv, []);
  const dir = resolve(one(args, 'out') ?? DEFAULT_OUT);
  const variants = num(args, 'variants') ?? DEFAULT_VARIANTS;
  if (!Number.isInteger(variants) || variants < 1 || variants > 9) throw new Error('--variants must be an integer 1-9');
  const entries = [...renderHits(dir, variants, num(args, 'snap-hz')), ...renderExamples(dir), renderRoom(dir)];
  writeFileSync(join(dir, 'index.json'), JSON.stringify({sampleRate: SR_RATE, bitDepth: 24, channels: 2, entries}, null, 2) + '\n');
  process.stdout.write(`${entries.length} files -> ${dir}\n`);
}

try {
  main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`renderOneshots: ${(error as Error).message}\n`);
  process.exitCode = 1;
}
