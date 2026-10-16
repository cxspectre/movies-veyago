// levels4.ts — loudness targets of the v4 hits on the v1 foley bus (tools/foley/render/levels.ts): max
// momentary loudness (LUFS-M, 400 ms) of the calibration take (default dur/rate), foley fader 0 dB, gain 1.
// Longer or faster variants keep the same gain, so they are as loud as their physics makes them.

import type {SfxNameV4} from '../../src/audio/cues';

export const HIT_TARGET_LUFS_M_V4: {readonly [K in SfxNameV4]: number} = {
  fold: -35, // fifteen of them in the film: a texture, under the VO
  scissors: -32, // chapter 3 carries them alone (20.5-22.5)
  crumple: -31, // chapter 3 carries it alone (10-12)
  stamp: -31, // the rhythm section of chapter 4, with the marble run
  string: -34,
  pin: -33,
  odometer: -36, // fast ticks add up; sits like the v1 tick
  train: -33,
  plane: -35,
  rocket: -32,
  marble_run: -34, // continuous for 28 s: a bed with accents
  padlock: -32, // with a low chord in the score
};
