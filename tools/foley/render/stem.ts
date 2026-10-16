// stem.ts — place rendered cues sample-accurately into a stem of fixed length, add the room, apply
// silences, guard the true peak.

import type {Cue} from '../../../src/audio/cues';
import {SR} from '../core/constants';
import {limitTruePeak, scaleStereo, stereoTruePeakDb} from '../core/dynamics';
import {integrated} from '../core/loudness';
import {createRng, hashSeed} from '../core/rng';
import {dbToGain, zeros} from '../core/signal';
import type {Stereo} from '../core/space';
import {roomTone, silenceGate, type Silence} from '../sounds/roomTone';
import {ROOM_TONE_LUFS_I, STEM_CEILING_DBTP} from './levels';
import {renderCue} from './sound';

export type StemRequest = {
  readonly lengthSec: number;
  readonly cues: readonly Cue[];
  /** Add the room-tone bed (default false: room tone is usually delivered as its own stem). */
  readonly roomTone?: boolean;
  readonly roomToneLufs?: number;
  /** Ranges of true digital silence applied to everything in the stem (the black beats). */
  readonly silences?: readonly Silence[];
  readonly ceilingDbTp?: number;
  readonly snapHz?: number;
};

export type StemReport = {
  readonly placed: number;
  readonly warnings: readonly string[];
  readonly truePeakDbTp: number;
  readonly limiterEngaged: boolean;
  readonly limiterMaxReductionDb: number;
};

/** Accumulate cue renders into a locally owned buffer (the one deliberate in-place loop: a stem is 15 M samples). */
function placeCues(n: number, cues: readonly Cue[], snapHz: number | undefined, warnings: string[]): Stereo {
  const left = zeros(n);
  const right = zeros(n);
  cues.forEach((cue, i) => {
    const r = renderCue(cue, {snapHz});
    const start = Math.round(cue.t * SR) - r.syncSample;
    if (start < 0) warnings.push(`cue[${i}] (${cue.kind}) starts ${(-start / SR).toFixed(3)}s before 0 and was clipped`);
    if (start + r.stereo.left.length > n) warnings.push(`cue[${i}] (${cue.kind} at ${cue.t}s) runs past the stem end and was cut`);
    for (let k = Math.max(0, -start); k < r.stereo.left.length && start + k < n; k++) {
      left[start + k] = (left[start + k] ?? 0) + (r.stereo.left[k] ?? 0);
      right[start + k] = (right[start + k] ?? 0) + (r.stereo.right[k] ?? 0);
    }
  });
  return {left, right};
}

export function calibratedRoomTone(lengthSec: number, silences: readonly Silence[], lufs = ROOM_TONE_LUFS_I): Stereo {
  const room = roomTone(lengthSec, createRng(hashSeed('room-tone', lengthSec)), silences);
  const measured = integrated(room);
  return Number.isFinite(measured) ? scaleStereo(room, dbToGain(lufs - measured)) : room;
}

function warnCuesInSilence(cues: readonly Cue[], silences: readonly Silence[], warnings: string[]): void {
  cues.forEach((c, i) => {
    const s = silences.find((r) => c.t >= r.start && c.t < r.end);
    if (s) warnings.push(`cue[${i}] (${c.kind} at ${c.t}s) falls inside the silence ${s.start}-${s.end}s and is muted`);
  });
}

export function renderStem(req: StemRequest): {stereo: Stereo; report: StemReport} {
  const n = Math.round(req.lengthSec * SR);
  if (!(n > 0)) throw new Error(`Stem length must be positive (got ${req.lengthSec}s)`);
  const silences = req.silences ?? [];
  const warnings: string[] = [];
  warnCuesInSilence(req.cues, silences, warnings);
  const cues = placeCues(n, req.cues, req.snapHz, warnings);
  const room = req.roomTone ? calibratedRoomTone(req.lengthSec, silences, req.roomToneLufs) : undefined;
  const gate = silenceGate(n, silences);
  const gated: Stereo = {
    left: cues.left.map((v, i) => (gate[i] === 0 ? 0 : (v + (room?.left[i] ?? 0)) * (gate[i] ?? 1))),
    right: cues.right.map((v, i) => (gate[i] === 0 ? 0 : (v + (room?.right[i] ?? 0)) * (gate[i] ?? 1))),
  };
  const limited = limitTruePeak(gated, req.ceilingDbTp ?? STEM_CEILING_DBTP);
  return {
    stereo: limited.stereo,
    report: {
      placed: req.cues.length,
      warnings,
      truePeakDbTp: stereoTruePeakDb(limited.stereo),
      limiterEngaged: limited.engaged,
      limiterMaxReductionDb: limited.maxReductionDb,
    },
  };
}
