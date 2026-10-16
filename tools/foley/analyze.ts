// analyze.ts — CLI: measure every rendered one-shot from disk, run the behaviour experiments, draw a
// spectrogram per family, cross-check loudness with ffmpeg, and write audio/foley/analysis/.
//
//   npx tsx tools/foley/analyze.ts [--oneshots audio/foley/oneshots] [--out audio/foley/analysis]

import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {integrated} from './core/loudness';
import {readWav} from './core/wav';
import {measure, type SoundMetrics} from './analysis/metrics';
import {buildReel, ffmpegEbur128, renderReelImages, type ReelLayout} from './analysis/spectrograms';
import {
  determinismAndVariation,
  noiseBaselines,
  placementCheck,
  pressureSweep,
  roomToneChecks,
  speedSweep,
  speedTracking,
  toolComparison,
} from './analysis/experiments';
import {section, table, type Row} from './analysis/report';
import {one, parseArgs} from './render/args';
import type {CatalogEntry} from './renderOneshots';
import type {Family} from './sounds/registry';

type Measured = {entry: CatalogEntry; metrics: SoundMetrics};
const FAMILIES: readonly Family[] = ['drawing', 'paper', 'desk', 'metal', 'glass', 'room'];
const CROSS_CHECK = ['pencil_click_1.wav', 'cup_down_1.wav', 'stroke_pencil_1.wav', 'room_tone_1.wav'];

function loadIndex(dir: string): CatalogEntry[] {
  try {
    return (JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8')) as {entries: CatalogEntry[]}).entries;
  } catch (error) {
    throw new Error(`Run renderOneshots first (could not read ${dir}/index.json: ${(error as Error).message})`);
  }
}

const safetyRow = ({entry, metrics: m}: Measured): Row => ({
  file: entry.file,
  dur: m.durationSec,
  'peak dBFS': m.peakDbfs,
  'TP dBTP': m.truePeakDbtp,
  'LUFS-M max': m.lufsMomentaryMax,
  DC: m.dcOffset,
  clipped: m.clippedSamples,
  'first/last': `${m.firstSample === 0 ? '0' : m.firstSample.toExponential(1)} / ${m.lastSample === 0 ? '0' : m.lastSample.toExponential(1)}`,
});

const shapeRow = ({entry, metrics: m}: Measured): Row => ({
  sound: entry.name,
  'attack ms': m.attackMs,
  'T60 s': m.t60EstimateSec,
  'centroid Hz': m.centroidHz,
  'sub %': m.bandsPct.sub,
  'low %': m.bandsPct.low,
  'lowMid %': m.bandsPct.lowMid,
  'mid %': m.bandsPct.mid,
  'high %': m.bandsPct.high,
  crackle: m.crackleKurtosis,
  'L/R r': m.stereoCorrelation,
});

function familyImages(outDir: string, measured: readonly Measured[], oneshots: string): Record<string, ReelLayout[]> {
  return Object.fromEntries(
    FAMILIES.map((family) => {
      const picks = measured.filter((m) => m.entry.family === family && m.entry.variant === 1);
      const {stereo, layout} = buildReel(picks.map((p) => ({label: p.entry.name, stereo: readWav(join(oneshots, p.entry.file)).stereo})));
      renderReelImages(outDir, `reel_${family}`, stereo);
      return [family, layout];
    }),
  );
}

function crossCheck(oneshots: string, measured: readonly Measured[]): Row[] {
  return CROSS_CHECK.map((file) => {
    const ours = measured.find((m) => m.entry.file === file)?.metrics;
    const ff = ffmpegEbur128(join(oneshots, file));
    return {
      file,
      'ours TP': ours?.truePeakDbtp ?? NaN,
      'ffmpeg TP': ff.truePeak,
      'ours M max': ours?.lufsMomentaryMax ?? NaN,
      'ffmpeg M max': ff.momentaryMax,
      'ours I': integrated(readWav(join(oneshots, file)).stereo),
      'ffmpeg I': ff.integrated,
    };
  });
}

function main(argv: readonly string[]): void {
  const args = parseArgs(argv, []);
  const oneshots = resolve(one(args, 'oneshots') ?? 'audio/foley/oneshots');
  const outDir = resolve(one(args, 'out') ?? 'audio/foley/analysis');
  mkdirSync(outDir, {recursive: true});
  const measured: Measured[] = loadIndex(oneshots).map((entry) => ({entry, metrics: measure(readWav(join(oneshots, entry.file)).stereo)}));
  const experiments = {
    pressureSweep: pressureSweep(),
    speedSweep: speedSweep(),
    toolComparison: toolComparison(),
    noiseBaselines: noiseBaselines(),
    speedTracking: [speedTracking('pencil'), speedTracking('pen')],
    determinism: determinismAndVariation(),
    roomTone: roomToneChecks(),
    placement: placementCheck(),
  };
  const reels = familyImages(outDir, measured, oneshots);
  const ffmpegCheck = crossCheck(oneshots, measured);
  const worst = {
    maxTruePeakDbtp: Math.max(...measured.map((m) => m.metrics.truePeakDbtp)),
    maxAbsDc: Math.max(...measured.map((m) => m.metrics.dcOffset)),
    clippedSamples: measured.reduce((a, m) => a + m.metrics.clippedSamples, 0),
    filesNotStartingOnZero: measured.filter((m) => m.metrics.firstSample !== 0).map((m) => m.entry.file),
    filesNotEndingOnZero: measured.filter((m) => m.metrics.lastSample !== 0).map((m) => m.entry.file),
  };
  writeFileSync(join(outDir, 'metrics.json'), JSON.stringify({worst, experiments, ffmpegCheck, reels, files: measured.map((m) => ({...m.entry, metrics: m.metrics}))}, null, 2) + '\n');
  const md = [
    '# Foley measurements (generated by tools/foley/analyze.ts; do not edit by hand)\n',
    section('Worst case over every file', 'All one-shots, read back from the 24-bit files on disk.', table([{...worst, filesNotStartingOnZero: worst.filesNotStartingOnZero.length, filesNotEndingOnZero: worst.filesNotEndingOnZero.length}])),
    section('Pressure sweep (pencil, same gesture)', 'Level must rise with pressure; brightness rises a little (harder contact).', table(experiments.pressureSweep)),
    section('Speed sweep (pencil, same seed)', 'Level and brightness must rise with hand speed.', table(experiments.speedSweep)),
    section('Pencil vs pen vs plain noise', 'crackle = kurtosis after removing slow level changes (Gaussian noise = 3.0). flatness 1 = white.', table([...experiments.toolComparison, ...experiments.noiseBaselines].map((r) => r as unknown as Row))),
    section('Speed tracking inside one stroke', 'Pearson r between the hand speed curve and frame level / spectral centroid (21 ms frames).', table(experiments.speedTracking)),
    section('Determinism and variation', 'Same cue twice must be bit-identical; the same cue at another time must be a different take (r near 0).', table([experiments.determinism])),
    section('Room tone and digital silence', 'Bed rendered 60 s with a silence at 20-22 s.', table([{...experiments.roomTone, bandsPct: JSON.stringify(Object.fromEntries(Object.entries(experiments.roomTone.bandsPct).map(([k, v]) => [k, Math.round(v)])))}])),
    section('Sample-accurate placement', 'One pencil_click cue at t = 3.21 s in a 5 s stem.', table([experiments.placement])),
    section('ffmpeg ebur128 cross-check', 'Independent meter (ffmpeg) against our BS.1770 code.', table(ffmpegCheck)),
    section('Shape per sound (take 1)', 'attack = 10-90 % rise of the 0.25 ms RMS envelope; T60 from the Schroeder decay (-5 to -25 dB, x3).', table(measured.filter((m) => m.entry.variant === 1).map(shapeRow))),
    section('Safety per file', 'Every file: peak, true peak, loudness, DC, clipped samples, first and last sample.', table(measured.map(safetyRow))),
  ].join('\n');
  writeFileSync(join(outDir, 'MEASUREMENTS.md'), md);
  process.stdout.write(`measured ${measured.length} files; worst TP ${worst.maxTruePeakDbtp.toFixed(2)} dBTP -> ${outDir}\n`);
}

try {
  main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`analyze: ${(error as Error).message}\n`);
  process.exitCode = 1;
}
