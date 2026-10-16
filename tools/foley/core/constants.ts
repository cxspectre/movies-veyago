// constants.ts — fixed facts of the foley toolkit (sample rate, bit depth, physical shorthands).

/** Every buffer in the toolkit runs at 48 kHz. Nothing resamples. */
export const SR = 48_000;
/** Output files are 24-bit integer PCM, stereo. */
export const BIT_DEPTH = 24;
export const CHANNELS = 2;
export const TWO_PI = 2 * Math.PI;
/** ln(1000): a mode with this many time constants per T60 has decayed by 60 dB. */
export const LN_1000 = Math.log(1000);
/** Highest modal frequency we synthesise; partials above this are dropped (alias-safe, inaudible on most systems). */
export const MAX_MODE_HZ = 0.4 * SR;

export const secondsToSamples = (seconds: number): number => Math.round(seconds * SR);
export const samplesToSeconds = (samples: number): number => samples / SR;
