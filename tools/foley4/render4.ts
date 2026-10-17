// render4.ts — CLI: the v4 foley families as one-shots (default takes plus parametric variants) with an
// index.json, then the analysis: a spectrogram and waveform per family, metrics.json and MEASUREMENTS.md.
//
//   npx tsx tools/foley4/render4.ts [--out audio/v4/foley] [--takes 3]
//
// Every file goes through the v1 renderer (renderHit), so it is calibrated exactly as renderCues places it.

import {mkdirSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import type {SfxNameV4} from '../../src/audio/cues';
import {SR} from '../foley/core/constants';
import {readWav, writeWav24} from '../foley/core/wav';
import {measure, type SoundMetrics} from '../foley/analysis/metrics';
import {section, table, type Row} from '../foley/analysis/report';
import {buildReel, ffmpegEbur128, renderReelImages} from '../foley/analysis/spectrograms';
import {hashSeed} from '../foley/core/rng';
import {num, one, parseArgs} from '../foley/render/args';
import {ONESHOT_CEILING_DBTP} from '../foley/render/levels';
import {renderHit} from '../foley/render/sound';
import {SFX4} from './registry4';
import {HIT_TARGET_LUFS_M_V4} from './levels4';

type Spec = {readonly name: SfxNameV4; readonly label: string; readonly dur?: number; readonly rate?: number; readonly takes: number; readonly note?: string};

const NAMES = Object.keys(SFX4) as SfxNameV4[];

/** Parametric variants worth having on disk (the beat sheet asks for these lengths and rates). */
const VARIANTS: readonly Omit<Spec, 'takes'>[] = [
  {name: 'fold', label: 'fold_quick', dur: 0.35, note: 'a quick flip-up'},
  {name: 'fold', label: 'fold_popup', dur: 2, note: 'a pop-up: several panels, the last snapping at 2.0 s'},
  {name: 'scissors', label: 'scissors_three', dur: 1.1, note: 'three snips in a row'},
  {name: 'crumple', label: 'crumple_long', dur: 2, note: 'chapter 3 at 10.0, dur 2.0'},
  {name: 'string', label: 'string_long', dur: 3, note: 'chapter 5 at 30.0, dur 3.0'},
  {name: 'pin', label: 'pin_row', dur: 1.5, note: 'six pins in 1.5 s'},
  {name: 'odometer', label: 'odometer_slow', dur: 1.5, rate: 4, note: 'a date rolling into place'},
  {name: 'odometer', label: 'odometer_fast', dur: 1.5, rate: 20, note: 'tests counting: blurs to a whirr'},
  {name: 'train', label: 'train_long', dur: 6, note: 'chapter 7 at 30.0, dur 6.0'},
  {name: 'plane', label: 'plane_slow', dur: 3, note: 'chapter 4 at 47.0, dur 3.0'},
  {name: 'marble_run', label: 'marble_run_long', dur: 8, note: 'an 8 s excerpt of the 28 s run'},
];

type Entry = {
  readonly name: SfxNameV4;
  readonly label: string;
  readonly variant: number;
  readonly params: {dur?: number; rate?: number};
  readonly file: string;
  readonly duration: number;
  readonly syncSec: number;
  readonly peak: number;
  readonly truePeak: number;
  readonly rms: number;
  readonly lufsMomentaryMax: number;
  readonly family: string;
  readonly description: string;
};

const r2 = (v: number): number => Math.round(v * 100) / 100;

function renderSpec(dir: string, spec: Spec): {entry: Entry; metrics: SoundMetrics}[] {
  return Array.from({length: spec.takes}, (_, k) => {
    const variant = k + 1;
    const rendered = renderHit(spec.name, hashSeed('oneshot4', spec.label, variant), {dur: spec.dur, rate: spec.rate});
    const file = `${spec.label}_${variant}.wav`;
    writeWav24(join(dir, file), rendered.stereo);
    const metrics = measure(readWav(join(dir, file)).stereo);
    if (metrics.truePeakDbtp > ONESHOT_CEILING_DBTP) throw new Error(`${file}: true peak ${metrics.truePeakDbtp} dBTP over ${ONESHOT_CEILING_DBTP}`);
    const def = SFX4[spec.name];
    const entry: Entry = {
      name: spec.name, label: spec.label, variant, params: {dur: spec.dur, rate: spec.rate}, file,
      duration: Math.round((rendered.stereo.left.length / SR) * 1000) / 1000,
      syncSec: Math.round((rendered.syncSample / SR) * 10000) / 10000,
      peak: r2(metrics.peakDbfs), truePeak: r2(metrics.truePeakDbtp), rms: r2(metrics.rmsDbfs), lufsMomentaryMax: r2(metrics.lufsMomentaryMax),
      family: def.family, description: spec.note ? `${def.description} (${spec.note})` : def.description,
    };
    return {entry, metrics};
  });
}

const measureRow = ({entry: e, metrics: m}: {entry: Entry; metrics: SoundMetrics}): Row => ({
  file: e.file, dur: e.duration, sync: e.syncSec, 'peak dBFS': m.peakDbfs, 'TP dBTP': m.truePeakDbtp, 'RMS dBFS': m.rmsDbfs,
  'M max': m.lufsMomentaryMax, 'target M': HIT_TARGET_LUFS_M_V4[e.name], 'attack ms': m.attackMs, 'centroid Hz': m.centroidHz,
  flatness: m.flatness, crackle: m.crackleKurtosis, first: m.firstSample, last: m.lastSample, DC: m.dcOffset,
});

function main(argv: readonly string[]): void {
  const args = parseArgs(argv, []);
  const root = resolve(one(args, 'out') ?? 'audio/v4/foley');
  const takes = num(args, 'takes') ?? 3;
  if (!Number.isInteger(takes) || takes < 2 || takes > 5) throw new Error('--takes must be an integer 2-5');
  const shots = join(root, 'oneshots');
  const analysis = join(root, 'analysis');
  mkdirSync(shots, {recursive: true});
  mkdirSync(analysis, {recursive: true});
  const specs: Spec[] = [...NAMES.map((name) => ({name, label: name, takes})), ...VARIANTS.map((v) => ({...v, takes: 2}))];
  const rendered = specs.flatMap((s) => renderSpec(shots, s));
  writeFileSync(join(shots, 'index.json'), JSON.stringify({sampleRate: SR, bitDepth: 24, channels: 2, entries: rendered.map((r) => r.entry)}, null, 2) + '\n');
  const reels = NAMES.map((name) => {
    const picks = rendered.filter((r) => r.entry.name === name && (r.entry.label === name || r.entry.variant === 1));
    const {stereo, layout} = buildReel(picks.map((p) => ({label: p.entry.file, stereo: readWav(join(shots, p.entry.file)).stereo})));
    renderReelImages(analysis, `reel_${name}`, stereo);
    return {name, layout};
  });
  const cross = NAMES.map((name) => {
    const file = `${name}_1.wav`;
    const ours = rendered.find((r) => r.entry.file === file)?.metrics;
    const ff = ffmpegEbur128(join(shots, file));
    return {file, 'ours TP': ours?.truePeakDbtp ?? NaN, 'ffmpeg TP': ff.truePeak, 'ours M max': ours?.lufsMomentaryMax ?? NaN, 'ffmpeg M max': ff.momentaryMax};
  });
  const levels = NAMES.map((name) => {
    const own = rendered.filter((r) => r.entry.label === name).map((r) => r.metrics.lufsMomentaryMax);
    return {name, 'target M': HIT_TARGET_LUFS_M_V4[name], 'takes min': Math.min(...own), 'takes max': Math.max(...own), 'spread LU': Math.max(...own) - Math.min(...own)};
  });
  const worst = {
    files: rendered.length,
    maxTruePeakDbtp: Math.max(...rendered.map((r) => r.metrics.truePeakDbtp)),
    maxAbsDc: Math.max(...rendered.map((r) => r.metrics.dcOffset)),
    clippedSamples: rendered.reduce((a, r) => a + r.metrics.clippedSamples, 0),
    notStartingOnZero: rendered.filter((r) => r.metrics.firstSample !== 0).length,
    notEndingOnZero: rendered.filter((r) => r.metrics.lastSample !== 0).length,
  };
  writeFileSync(join(analysis, 'metrics.json'), JSON.stringify({worst, levels, ffmpegCheck: cross, reels, files: rendered.map((r) => ({...r.entry, metrics: r.metrics}))}, null, 2) + '\n');
  const md = [
    '# v4 foley measurements (generated by tools/foley4/render4.ts; do not edit by hand)\n',
    section('Worst case over every file', 'All v4 one-shots, read back from the 24-bit files on disk. Ceiling: -6 dBTP per file.', table([worst])),
    section('Levels against the calibration targets', 'Max momentary loudness (LUFS-M) of the default takes; the family gain is fixed, so takes differ naturally.', table(levels)),
    section('ffmpeg ebur128 cross-check', 'Independent meter on take 1 of each family.', table(cross)),
    section('Every file', 'attack = 10-90 % rise of the 0.25 ms RMS envelope; crackle = kurtosis after removing slow level changes (Gaussian noise = 3); flatness 1 = white.', table(rendered.map(measureRow))),
  ].join('\n');
  writeFileSync(join(analysis, 'MEASUREMENTS.md'), md);
  process.stdout.write(`${rendered.length} files -> ${shots}; worst TP ${worst.maxTruePeakDbtp.toFixed(2)} dBTP; analysis -> ${analysis}\n`);
}

try {
  main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`render4: ${(error as Error).message}\n`);
  process.exitCode = 1;
}
