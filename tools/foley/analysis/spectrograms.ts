// spectrograms.ts — family reels (one take of each sound, gaps of silence) and their spectrogram and
// waveform PNGs, drawn by ffmpeg (showspectrumpic / showwavespic).

import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {SR} from '../core/constants';
import type {Stereo} from '../core/space';
import {writeWav24} from '../core/wav';

const GAP_SEC = 0.4;
const SPECTRUM_SIZE = '1600x640';
const WAVE_SIZE = '1600x240';

export type ReelItem = {readonly label: string; readonly stereo: Stereo};
export type ReelLayout = {readonly label: string; readonly startSec: number; readonly endSec: number};

/** Concatenate items with silent gaps; returns the reel and where each item sits. */
export function buildReel(items: readonly ReelItem[]): {stereo: Stereo; layout: ReelLayout[]} {
  const gap = Math.round(GAP_SEC * SR);
  const total = items.reduce((a, it) => a + it.stereo.left.length + gap, gap);
  const left = new Float64Array(total);
  const right = new Float64Array(total);
  const layout: ReelLayout[] = [];
  let at = gap;
  for (const it of items) {
    left.set(it.stereo.left, at);
    right.set(it.stereo.right, at);
    layout.push({label: it.label, startSec: at / SR, endSec: (at + it.stereo.left.length) / SR});
    at += it.stereo.left.length + gap;
  }
  return {stereo: {left, right}, layout};
}

function ffmpeg(args: readonly string[]): void {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {encoding: 'utf8'});
  if (result.error) throw new Error(`ffmpeg could not start: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`ffmpeg failed: ${result.stderr}`);
}

/** Write the reel WAV plus `<name>_spectrogram.png` (log frequency, 100 dB range) and `<name>_waveform.png`. */
export function renderReelImages(dir: string, name: string, reel: Stereo): {wav: string; spectrogram: string; waveform: string} {
  const wav = join(dir, `${name}.wav`);
  const spectrogram = join(dir, `${name}_spectrogram.png`);
  const waveform = join(dir, `${name}_waveform.png`);
  writeWav24(wav, reel);
  ffmpeg(['-i', wav, '-lavfi', `showspectrumpic=s=${SPECTRUM_SIZE}:mode=combined:legend=1:scale=log:fscale=log:drange=100:win_func=hann:color=intensity`, spectrogram]);
  ffmpeg(['-i', wav, '-lavfi', `showwavespic=s=${WAVE_SIZE}:split_channels=0:scale=sqrt:colors=0x2F5BEA`, '-frames:v', '1', waveform]);
  return {wav, spectrogram, waveform};
}

export type EbuReport = {readonly integrated: number; readonly truePeak: number; readonly momentaryMax: number};

/** ffmpeg's own EBU R128 meter, as an independent cross-check of our loudness and true-peak code. */
export function ffmpegEbur128(path: string): EbuReport {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-v', 'verbose', '-i', path, '-af', 'ebur128=peak=true:framelog=verbose', '-f', 'null', '-'], {encoding: 'utf8'});
  if (result.status !== 0) throw new Error(`ffmpeg ebur128 failed on ${path}`);
  const log = result.stderr;
  const grab = (re: RegExp): number => Number(re.exec(log)?.[1] ?? NaN);
  const moments = [...log.matchAll(/ M:\s*(-?[\d.]+|-inf)/g)].map((m) => Number(m[1])).filter(Number.isFinite);
  return {
    integrated: grab(/Integrated loudness:\s+I:\s+(-?[\d.]+) LUFS/),
    truePeak: grab(/True peak:\s+Peak:\s+(-?[\d.]+) dBFS/),
    momentaryMax: Math.max(...moments),
  };
}
