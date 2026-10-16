// voice.ts — what every sound recipe returns: a dry mono source plus where it sits.

import {dcBlockStereo} from './dynamics';
import type {Mono} from './signal';
import {spatialize, type SpaceName, type Stereo} from './space';

export type Voice = {
  /** Dry source at an arbitrary (uncalibrated) level. */
  readonly mono: Mono;
  /** Constant pan or a per-sample pan curve in [-1, 1]. */
  readonly pan: number | Mono;
  readonly space: SpaceName;
  /** Sample index of the perceptual sync point (the contact, the landing, the start of the stroke). */
  readonly syncSample: number;
};

/** Pan, place in its space, remove DC. */
export const voiceToStereo = (v: Voice): Stereo => dcBlockStereo(spatialize(v.mono, v.pan, v.space));
