// sound.ts — turn a recipe into a calibrated, mix-ready stereo buffer.
//
// Calibration: the first time a sound is used, a fixed reference take is rendered and measured; the gain
// that puts that take at its target loudness (levels.ts) is cached and applied to every take. So takes
// keep their natural differences (harder press = louder), while the family sits at a known level.

import type {Cue, SfxName} from '../../../src/audio/cues';
import {SR} from '../core/constants';
import {scaleStereo, trimTail} from '../core/dynamics';
import {momentaryMax} from '../core/loudness';
import {createRng, hashSeed, type Rng} from '../core/rng';
import {dbToGain} from '../core/signal';
import type {Stereo} from '../core/space';
import {voiceToStereo, type Voice} from '../core/voice';
import {eraseVoice, slideVoice, sweepVoice} from '../sounds/continuous';
import {SFX, type HitOptions} from '../sounds/registry';
import {DEFAULT_PRESSURE, strokeVoice, type StrokeTool} from '../sounds/stroke';
import {CONTINUOUS_TARGET_LUFS_M, HIT_TARGET_LUFS_M, TAIL_FADE_SEC, TAIL_FLOOR_DBFS, type ContinuousKey} from './levels';

export type Rendered = {readonly stereo: Stereo; readonly syncSample: number};

const CALIBRATION_SEED = hashSeed('provisum-foley-calibration');
const REFERENCE_DUR: Record<ContinuousKey, number> = {pencil: 2, pen: 2, erase: 1.5, slide: 0.8, sweep: 1.5};
const calibrationCache = new Map<string, number>();

function calibrated(key: string, targetLufs: number, reference: () => Voice): number {
  const cached = calibrationCache.get(key);
  if (cached !== undefined) return cached;
  const measured = momentaryMax(voiceToStereo(reference()));
  if (!Number.isFinite(measured)) throw new Error(`Calibration of '${key}' measured silence`);
  const gain = dbToGain(targetLufs - measured);
  calibrationCache.set(key, gain);
  return gain;
}

/** One leading zero sample: a contact force is non-zero in its first sample, the file must not be. */
const withLeadingZero = (s: Stereo): Stereo => {
  const pad = (x: Float64Array): Float64Array => {
    const out = new Float64Array(x.length + 1);
    out.set(x, 1);
    return out;
  };
  return {left: pad(s.left), right: pad(s.right)};
};

function finish(voice: Voice, gain: number): Rendered {
  const stereo = trimTail(scaleStereo(voiceToStereo(voice), gain), TAIL_FLOOR_DBFS, TAIL_FADE_SEC);
  return {stereo: withLeadingZero(stereo), syncSample: voice.syncSample + 1};
}

const continuousVoice = (key: ContinuousKey, dur: number, rng: Rng, pan?: number, pressure?: number): Voice => {
  if (key === 'pencil' || key === 'pen') return strokeVoice({dur, tool: key, pressure, pan}, rng);
  if (key === 'erase') return eraseVoice(dur, rng, pan);
  if (key === 'slide') return slideVoice(dur, rng, pan);
  return sweepVoice(dur, rng, pan);
};

const continuousGain = (key: ContinuousKey): number =>
  calibrated(`continuous:${key}`, CONTINUOUS_TARGET_LUFS_M[key], () =>
    continuousVoice(key, REFERENCE_DUR[key], createRng(CALIBRATION_SEED), 0, DEFAULT_PRESSURE),
  );

const hitGain = (name: SfxName, opts: HitOptions): number =>
  calibrated(`hit:${name}:${opts.snapHz ?? 'default'}`, HIT_TARGET_LUFS_M[name], () => SFX[name].render(createRng(CALIBRATION_SEED), 0, opts));

/** A hit, fully calibrated (cue gain is a linear multiplier on top). */
export function renderHit(name: SfxName, seed: number, opts: {pan?: number; gain?: number} & HitOptions = {}): Rendered {
  const voice = SFX[name].render(createRng(seed), opts.pan, opts);
  return finish(voice, hitGain(name, opts) * (opts.gain ?? 1));
}

/** A continuous sound (stroke/erase/slide/sweep) of `dur` seconds, calibrated. */
export function renderContinuous(
  key: ContinuousKey,
  dur: number,
  seed: number,
  opts: {pan?: number; pressure?: number; speedScale?: number} = {},
): Rendered {
  const rng = createRng(seed);
  const voice =
    (key === 'pencil' || key === 'pen') && opts.speedScale !== undefined
      ? strokeVoice({dur, tool: key, pressure: opts.pressure, pan: opts.pan, speedScale: opts.speedScale}, rng)
      : continuousVoice(key, dur, rng, opts.pan, opts.pressure);
  return finish(voice, continuousGain(key));
}

/** Seed of a cue: its kind, its sound and its exact start sample, so every call differs and every render repeats. */
export function cueSeed(cue: Cue): number {
  const at = Math.round(cue.t * SR);
  if (cue.kind === 'hit') return hashSeed('hit', cue.name, at);
  if (cue.kind === 'stroke') return hashSeed('stroke', cue.tool ?? 'pencil', at, cue.dur, cue.pressure ?? DEFAULT_PRESSURE);
  return hashSeed(cue.kind, at, cue.dur);
}

export function renderCue(cue: Cue, opts: HitOptions = {}): Rendered {
  const seed = cueSeed(cue);
  switch (cue.kind) {
    case 'hit':
      return renderHit(cue.name, seed, {pan: cue.pan, gain: cue.gain, snapHz: opts.snapHz});
    case 'stroke':
      return renderContinuous((cue.tool ?? 'pencil') as StrokeTool, cue.dur, seed, {pressure: cue.pressure});
    case 'erase':
      return renderContinuous('erase', cue.dur, seed);
    case 'slide':
      return renderContinuous('slide', cue.dur, seed, {pan: cue.pan});
    case 'sweep':
      return renderContinuous('sweep', cue.dur, seed);
  }
}
