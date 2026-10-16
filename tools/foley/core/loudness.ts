// loudness.ts — ITU-R BS.1770-4 / EBU R128 loudness at 48 kHz: K-weighting, momentary (400 ms),
// short-term (3 s) and gated integrated loudness. Cross-checked against ffmpeg's ebur128 filter.

import {SR} from './constants';
import {applyChain, type Biquad} from './filters';
import type {Stereo} from './space';
import type {Mono} from './signal';

/** BS.1770 K-weighting at 48 kHz (pre-filter shelf + RLB high-pass), coefficients from the standard. */
const K_WEIGHTING: readonly Biquad[] = [
  {b0: 1.53512485958697, b1: -2.69169618940638, b2: 1.19839281085285, a1: -1.69065929318241, a2: 0.73248077421585},
  {b0: 1.0, b1: -2.0, b2: 1.0, a1: -1.99004745483398, a2: 0.99007225036621},
];

const LUFS_OFFSET = -0.691;
const HOP_SEC = 0.1;
const ABSOLUTE_GATE = -70;
const RELATIVE_GATE = -10;

const toLufs = (power: number): number => (power > 0 ? LUFS_OFFSET + 10 * Math.log10(power) : -Infinity);

/** Mean-square power of K-weighted blocks (window `windowSec`, hop 100 ms), both channels summed. */
function blockPowers(s: Stereo, windowSec: number): number[] {
  const win = Math.round(windowSec * SR);
  const hop = Math.round(HOP_SEC * SR);
  const length = Math.max(s.left.length, win); // short sounds are measured as if followed by silence
  const sq = (x: Mono): Float64Array => {
    const k = applyChain(x, K_WEIGHTING);
    const cum = new Float64Array(length + 1);
    for (let i = 0; i < length; i++) cum[i + 1] = (cum[i] ?? 0) + (k[i] ?? 0) ** 2;
    return cum;
  };
  const cl = sq(s.left);
  const cr = sq(s.right);
  const powers: number[] = [];
  for (let start = 0; start + win <= length; start += hop) {
    const e = (cl[start + win] ?? 0) - (cl[start] ?? 0) + (cr[start + win] ?? 0) - (cr[start] ?? 0);
    powers.push(e / win);
  }
  return powers;
}

export const momentaryMax = (s: Stereo): number => toLufs(Math.max(0, ...blockPowers(s, 0.4)));
export const shortTermMax = (s: Stereo): number => toLufs(Math.max(0, ...blockPowers(s, 3)));

/** Gated integrated loudness (absolute -70 LUFS, relative -10 LU). */
export function integrated(s: Stereo): number {
  const blocks = blockPowers(s, 0.4).filter((p) => toLufs(p) > ABSOLUTE_GATE);
  if (blocks.length === 0) return -Infinity;
  const ungated = blocks.reduce((a, b) => a + b, 0) / blocks.length;
  const gate = toLufs(ungated) + RELATIVE_GATE;
  const gated = blocks.filter((p) => toLufs(p) > gate);
  return toLufs(gated.reduce((a, b) => a + b, 0) / Math.max(1, gated.length));
}
