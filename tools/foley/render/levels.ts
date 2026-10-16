// levels.ts — the foley bus calibration. Every sound is rendered so that, with the foley fader at 0 dB,
// it lands at the momentary loudness below. These numbers ARE the mixing contract with the music and
// VO engineers (see audio/foley/README.md, "Levels").

import type {SfxName} from '../../../src/audio/cues';
import {HIT_TARGET_LUFS_M_V4} from '../../foley4/levels4';

/** Reference: VO is mixed to about -18 LUFS short-term while speaking (web master around -16 LUFS integrated). */
export const VO_REFERENCE_LUFS_S = -18;

/** Max momentary loudness (LUFS-M, 400 ms) per hit, at foley fader 0 dB and cue gain 1. */
export const HIT_TARGET_LUFS_M: {readonly [K in SfxName]: number} = {
  tick: -36,
  cup_down: -30,
  sticky_press: -36,
  sticky_smooth: -37,
  pencil_down: -31,
  pencil_click: -28,
  pen_cap: -33,
  phone_down: -31,
  snap: -30,
  card_flip: -31,
  wallet_slide: -31,
  paper_drop: -32,
  ruler_tap: -33,
  key_clink: -33,
  coin_clink: -34,
  bubble_pop: -36,
  title_in: -34,
  ...HIT_TARGET_LUFS_M_V4,
};

/** Continuous kinds: max momentary loudness of the calibration reference (stroke at pressure 0.6, 2 s). */
export const CONTINUOUS_TARGET_LUFS_M = {
  pencil: -34,
  pen: -38,
  erase: -36,
  slide: -34,
  sweep: -34,
} as const;
export type ContinuousKey = keyof typeof CONTINUOUS_TARGET_LUFS_M;

/** Room tone bed, integrated. Audible in a quiet room at high monitor gain, gone under anything else. */
export const ROOM_TONE_LUFS_I = -60;

/** True-peak ceilings: every one-shot file, and the summed stem (a look-ahead limiter guards the stem). */
export const ONESHOT_CEILING_DBTP = -6;
export const STEM_CEILING_DBTP = -1;
/** Anything quieter than this at the end of a sound is trimmed (then a 5 ms fade lands it on zero). */
export const TAIL_FLOOR_DBFS = -100;
export const TAIL_FADE_SEC = 0.005;
