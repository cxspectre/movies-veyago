// space.ts — puts a mono source into stereo: constant-power pan plus the acoustic of where it happens.
//
// 'desk'  the paper world: a small furnished room. Two early reflections per side (walls ~1.5-2 m away,
//         4-13 ms), a short warm tail (RT60 0.3 s, highs damped by soft furnishings). Sounds stop
//         sounding "in the computer" because they have a room.
// 'void'  the glass world: no walls to place, a dark, smooth, slightly longer bloom (RT60 1.1 s,
//         28 ms pre-delay), held low so the keynote sounds stay restrained.
// 'dry'   no space (room tone already is the room).

import {SR} from './constants';
import {applyBiquad, highpass, lowpass} from './filters';
import {zeros, type Mono} from './signal';

export type Stereo = {readonly left: Mono; readonly right: Mono};
export type SpaceName = 'desk' | 'void' | 'dry';

type Reflection = {readonly ms: number; readonly gain: number; readonly pan: number};
type SpaceSpec = {
  readonly reflections: readonly Reflection[];
  readonly reflectionLowpassHz: number;
  readonly delays: readonly number[];
  readonly rt60: number;
  readonly dampHz: number;
  readonly preDelayMs: number;
  readonly wet: number;
  readonly wetHighpassHz: number;
  readonly tailSec: number;
};

const SPACES: Record<Exclude<SpaceName, 'dry'>, SpaceSpec> = {
  desk: {
    reflections: [
      {ms: 4.1, gain: 0.2, pan: -0.8},
      {ms: 6.3, gain: 0.16, pan: 0.8},
      {ms: 9.7, gain: 0.11, pan: -0.4},
      {ms: 12.9, gain: 0.09, pan: 0.6},
    ],
    reflectionLowpassHz: 4500,
    delays: [337, 467, 593, 761],
    rt60: 0.3,
    dampHz: 5200,
    preDelayMs: 9,
    wet: 0.14,
    wetHighpassHz: 160,
    tailSec: 0.45,
  },
  void: {
    reflections: [],
    reflectionLowpassHz: 8000,
    delays: [1361, 1777, 2053, 2539],
    rt60: 1.1,
    dampHz: 6500,
    preDelayMs: 28,
    wet: 0.17,
    wetHighpassHz: 120,
    tailSec: 1.4,
  },
};

export const spaceTailSec = (space: SpaceName): number => (space === 'dry' ? 0 : SPACES[space].tailSec);

const panGains = (pan: number): {l: number; r: number} => {
  const theta = ((Math.max(-1, Math.min(1, pan)) + 1) * Math.PI) / 4;
  return {l: Math.cos(theta), r: Math.sin(theta)};
};

/** Constant-power pan; `pan` may be a constant or a per-sample curve in [-1, 1]. */
export function panMono(x: Mono, pan: number | Mono): Stereo {
  const left = zeros(x.length);
  const right = zeros(x.length);
  for (let i = 0; i < x.length; i++) {
    const g = panGains(typeof pan === 'number' ? pan : (pan[i] ?? 0));
    const v = x[i] ?? 0;
    left[i] = v * g.l;
    right[i] = v * g.r;
  }
  return {left, right};
}

/** 4-line feedback delay network with a Householder matrix and per-line damping. */
function fdn(x: Mono, spec: SpaceSpec): Stereo {
  const n = spec.delays.length;
  const lines = spec.delays.map((d) => zeros(d));
  const idx = new Int32Array(n);
  const loopGain = Float64Array.from(spec.delays, (d) => Math.pow(10, (-3 * d) / (spec.rt60 * SR)));
  const damp = Math.exp((-2 * Math.PI * spec.dampHz) / SR);
  const lpState = new Float64Array(n);
  const outs = new Float64Array(n);
  const pre = Math.round((spec.preDelayMs / 1000) * SR);
  const left = zeros(x.length);
  const right = zeros(x.length);
  for (let i = 0; i < x.length; i++) {
    const input = i >= pre ? (x[i - pre] ?? 0) : 0;
    let sum = 0;
    for (let k = 0; k < n; k++) {
      const v = lines[k]?.[idx[k] ?? 0] ?? 0;
      outs[k] = v;
      sum += v;
    }
    for (let k = 0; k < n; k++) {
      const fb = (outs[k] ?? 0) - (2 / n) * sum;
      const lp = (1 - damp) * fb + damp * (lpState[k] ?? 0);
      lpState[k] = lp;
      const line = lines[k];
      const pos = idx[k] ?? 0;
      if (line) line[pos] = input + lp * (loopGain[k] ?? 0);
      idx[k] = (pos + 1) % (spec.delays[k] ?? 1);
    }
    left[i] = (outs[0] ?? 0) - (outs[2] ?? 0);
    right[i] = (outs[1] ?? 0) - (outs[3] ?? 0);
  }
  return {left, right};
}

function reflections(x: Mono, spec: SpaceSpec): Stereo {
  const left = zeros(x.length);
  const right = zeros(x.length);
  const filtered = applyBiquad(x, lowpass(spec.reflectionLowpassHz));
  for (const r of spec.reflections) {
    const d = Math.round((r.ms / 1000) * SR);
    const g = panGains(r.pan);
    for (let i = d; i < x.length; i++) {
      const v = (filtered[i - d] ?? 0) * r.gain;
      left[i] = (left[i] ?? 0) + v * g.l;
      right[i] = (right[i] ?? 0) + v * g.r;
    }
  }
  return {left, right};
}

const sumStereo = (parts: readonly Stereo[], length: number): Stereo => {
  const left = zeros(length);
  const right = zeros(length);
  for (const p of parts) {
    for (let i = 0; i < length; i++) {
      left[i] = (left[i] ?? 0) + (p.left[i] ?? 0);
      right[i] = (right[i] ?? 0) + (p.right[i] ?? 0);
    }
  }
  return {left, right};
};

/** Direct sound (panned) + early reflections + diffuse tail. Output is extended by the space's tail. */
export function spatialize(x: Mono, pan: number | Mono, space: SpaceName): Stereo {
  if (space === 'dry') return panMono(x, pan);
  const spec = SPACES[space];
  const length = x.length + Math.round(spec.tailSec * SR);
  const padded = zeros(length);
  padded.set(x);
  const lastPan = typeof pan === 'number' ? pan : (pan[pan.length - 1] ?? 0);
  const panCurve = typeof pan === 'number' ? pan : Float64Array.from({length}, (_, i) => pan[i] ?? lastPan);
  const direct = panMono(padded, panCurve);
  const early = reflections(padded, spec);
  const wetIn = applyBiquad(padded, highpass(spec.wetHighpassHz));
  const tail = fdn(wetIn, spec);
  const wetTail: Stereo = {left: tail.left.map((v) => v * spec.wet), right: tail.right.map((v) => v * spec.wet)};
  return sumStereo([direct, early, wetTail], length);
}
