// experiments.ts — controlled renders that prove behaviour (one variable at a time, same seed).

import {SR} from '../core/constants';
import {fadeInOut} from '../core/envelope';
import {integrated, momentaryMax, shortTermMax} from '../core/loudness';
import {pink, white} from '../core/noise';
import {createRng, hashSeed} from '../core/rng';
import {gainToDb, multiply, scale, type Mono} from '../core/signal';
import type {Stereo} from '../core/space';
import {renderContinuous, renderCue} from '../render/sound';
import {calibratedRoomTone, renderStem} from '../render/stem';
import {PEN_STYLE, PENCIL_STYLE, drawingSpeed} from '../sounds/gesture';
import {hann, powerSpectrum} from './fft';
import {correlation, measure, monoSum, rmsEnvelope, type SoundMetrics} from './metrics';

const SEED = hashSeed('analysis-stroke');
const DUR = 2;
const FRAME = 1024;

const brief = (m: SoundMetrics) => ({
  lufsM: m.lufsMomentaryMax,
  centroidHz: m.centroidHz,
  rolloff85Hz: m.rolloff85Hz,
  crackleKurtosis: m.crackleKurtosis,
  flatness: m.flatness,
  envelopeStdDb: m.envelopeStdDb,
});

export const pressureSweep = () =>
  [0.3, 0.6, 0.9].map((pressure) => ({pressure, ...brief(measure(renderContinuous('pencil', DUR, SEED, {pressure, speedScale: 1}).stereo))}));

export const speedSweep = () =>
  [0.5, 1, 1.5].map((speedScale) => ({speedScale, ...brief(measure(renderContinuous('pencil', DUR, SEED, {speedScale}).stereo))}));

export const toolComparison = () =>
  (['pencil', 'pen'] as const).map((tool) => ({tool, ...brief(measure(renderContinuous(tool, DUR, SEED, {speedScale: 1}).stereo))}));

/** The classic failure: plain noise with the same fades. Our strokes must measure far from these. */
export function noiseBaselines() {
  const n = DUR * SR;
  const fade = fadeInOut(n, 0.018, 0.035);
  const asStereo = (x: Mono): Stereo => {
    const y = scale(multiply(x, fade), 0.05);
    return {left: y, right: y};
  };
  return [
    {tool: 'white noise (baseline)', ...brief(measure(asStereo(white(n, createRng(1)))))},
    {tool: 'pink noise (baseline)', ...brief(measure(asStereo(pink(n, createRng(2)))))},
  ];
}

/** Within one stroke: does brightness and level follow the hand's speed? Pearson r over 21 ms frames. */
export function speedTracking(tool: 'pencil' | 'pen') {
  const rendered = renderContinuous(tool, DUR, SEED, {speedScale: 1});
  const speed = drawingSpeed(DUR, tool === 'pencil' ? PENCIL_STYLE : PEN_STYLE, createRng(SEED).fork('gesture'), 1);
  const x = monoSum(rendered.stereo).subarray(rendered.syncSample);
  const win = hann(FRAME);
  const rows: {v: number; db: number; centroid: number}[] = [];
  for (let s = 0; s + FRAME <= speed.length; s += FRAME / 2) {
    const v = speed[s + FRAME / 2] ?? 0;
    const spec = powerSpectrum(Float64Array.from({length: FRAME}, (_, i) => (x[s + i] ?? 0) * (win[i] ?? 0)));
    const total = spec.reduce((a, p) => a + p, 0);
    if (v < 5 || total <= 0) continue;
    rows.push({v, db: 10 * Math.log10(total), centroid: spec.reduce((a, p, k) => a + p * ((k * SR) / FRAME), 0) / total});
  }
  const r = (a: number[], b: number[]): number => correlation(Float64Array.from(a.map((v, _, arr) => v - arr.reduce((s, w) => s + w, 0) / arr.length)), Float64Array.from(b.map((v, _, arr) => v - arr.reduce((s, w) => s + w, 0) / arr.length)));
  return {
    tool,
    frames: rows.length,
    rSpeedVsLevel: r(rows.map((q) => q.v), rows.map((q) => q.db)),
    rSpeedVsCentroid: r(rows.map((q) => q.v), rows.map((q) => q.centroid)),
  };
}

/** Same cue twice = identical; same cue at another time = a different take. */
export function determinismAndVariation() {
  const cue = (t: number) => ({kind: 'stroke' as const, t, dur: 1.5, pressure: 0.6});
  const a = renderCue(cue(10)).stereo;
  const b = renderCue(cue(10)).stereo;
  const c = renderCue(cue(11)).stereo;
  const maxDiff = a.left.reduce((m, v, i) => Math.max(m, Math.abs(v - (b.left[i] ?? 0))), 0);
  const hit = (t: number) => renderCue({kind: 'hit', t, name: 'cup_down'}).stereo.left;
  return {
    identicalRenderMaxDiff: maxDiff,
    strokeCorrelationDifferentTimes: correlation(a.left, c.left.subarray(0, a.left.length)),
    cupDownCorrelationDifferentTimes: correlation(hit(20), hit(21)),
  };
}

/** Room tone: level, drift, coherence, spectrum; and a silence that must be exactly 0.0. */
export function roomToneChecks() {
  const lengthSec = 60;
  const room = calibratedRoomTone(lengthSec, [{start: 20, end: 22}]);
  const inside = room.left.subarray(20 * SR, 22 * SR);
  const nonZero = inside.reduce((a, v) => a + (v !== 0 ? 1 : 0), 0) + room.right.subarray(20 * SR, 22 * SR).reduce((a, v) => a + (v !== 0 ? 1 : 0), 0);
  const second = (sec: number) => room.left.subarray(sec * SR, (sec + 1) * SR);
  const levels = Array.from({length: 18}, (_, k) => gainToDb(Math.sqrt(second(k).reduce((a, v) => a + v * v, 0) / SR)));
  const m = measure({left: room.left.subarray(25 * SR), right: room.right.subarray(25 * SR)});
  return {
    integratedLufs: integrated(room),
    shortTermMaxLufs: shortTermMax(room),
    oneSecondLevelRangeDb: Math.max(...levels) - Math.min(...levels),
    lrCorrelation: m.stereoCorrelation,
    centroidHz: m.centroidHz,
    bandsPct: m.bandsPct,
    nonZeroSamplesInsideSilence: nonZero,
    rmsEnvelopeBeforeSilenceDb: gainToDb(rmsEnvelope(room.left.subarray(19 * SR, 20 * SR), 0.05)[SR - 1] ?? 0),
  };
}

/** A stem with one hit: its sync point must land on the exact sample. */
export function placementCheck() {
  const t = 3.21;
  const {stereo} = renderStem({lengthSec: 5, cues: [{kind: 'hit', t, name: 'pencil_click'}]});
  const solo = renderCue({kind: 'hit', t, name: 'pencil_click'});
  const expectedStart = Math.round(t * SR) - solo.syncSample;
  const firstNonZero = stereo.left.findIndex((v) => v !== 0);
  const exact = solo.stereo.left.every((v, i) => v === stereo.left[expectedStart + i]);
  return {cueSample: Math.round(t * SR), syncSample: solo.syncSample, expectedStart, firstNonZero, bitExactCopy: exact};
}

export const loudnessOf = (s: Stereo) => ({momentaryMax: momentaryMax(s), integrated: integrated(s)});
