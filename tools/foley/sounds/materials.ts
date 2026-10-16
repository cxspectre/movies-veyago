// materials.ts — friction materials, each a physical description of what slides on what.

import type {FrictionMaterial} from './friction';

/** HB graphite on 120 g cartridge paper. Graphite shears in flakes: dense, irregular stick-slip; a grainy, soft scratch. */
export const GRAPHITE_ON_PAPER: FrictionMaterial = {
  grainCoarseMm: 0.5,
  grainFineMm: 0.12,
  grainDepth: 0.5,
  slipsPerMm: 8,
  slipGain: 2.5,
  slipWidthSlowMs: 0.35,
  slipWidthFastMs: 0.1,
  noiseGain: 1,
  cutoffSlowHz: 2600,
  cutoffFastHz: 8500,
  highpassHz: 220,
  refSpeedMmS: 110,
  speedExponent: 0.7,
  pressureExponent: 1.1,
};

/** A 0.3 mm fineliner: a hard plastic nib on a fibre bed, wet ink lubricates. Smoother, thinner, higher, quieter. */
export const FINE_PEN_ON_PAPER: FrictionMaterial = {
  grainCoarseMm: 1.2,
  grainFineMm: 0.3,
  grainDepth: 0.3,
  slipsPerMm: 1.2,
  slipGain: 4,
  slipWidthSlowMs: 0.12,
  slipWidthFastMs: 0.05,
  noiseGain: 0.8,
  cutoffSlowHz: 3000,
  cutoffFastHz: 7500,
  highpassHz: 600,
  refSpeedMmS: 100,
  speedExponent: 0.6,
  pressureExponent: 1.0,
};

/**
 * Soft vinyl eraser: large compliant contact patch averages the paper tooth (low grain depth), slips
 * are wide and dull. Spacing stays random, so the classic tonal rubber squeak cannot form.
 */
export const ERASER_ON_PAPER: FrictionMaterial = {
  grainCoarseMm: 2,
  grainFineMm: 0.6,
  grainDepth: 0.35,
  slipsPerMm: 1,
  slipGain: 2.5,
  slipWidthSlowMs: 1.2,
  slipWidthFastMs: 0.6,
  noiseGain: 1,
  cutoffSlowHz: 1400,
  cutoffFastHz: 3200,
  highpassHz: 160,
  refSpeedMmS: 90,
  speedExponent: 0.8,
  pressureExponent: 1.2,
};

/** Fingertip skin on paper (smoothing a sticky note, a hand guiding a sheet): soft, breathy, low. */
export const SKIN_ON_PAPER: FrictionMaterial = {
  grainCoarseMm: 1.5,
  grainFineMm: 0.4,
  grainDepth: 0.3,
  slipsPerMm: 0.3,
  slipGain: 3,
  slipWidthSlowMs: 0.8,
  slipWidthFastMs: 0.4,
  noiseGain: 1,
  cutoffSlowHz: 1800,
  cutoffFastHz: 4500,
  highpassHz: 250,
  refSpeedMmS: 150,
  speedExponent: 0.8,
  pressureExponent: 1,
};

/** A whole sheet on a wooden desk: very light load over a big area, the sheet itself radiates (low rustle). */
export const PAPER_ON_DESK: FrictionMaterial = {
  grainCoarseMm: 6,
  grainFineMm: 1.5,
  grainDepth: 0.45,
  slipsPerMm: 0.15,
  slipGain: 3,
  slipWidthSlowMs: 1.5,
  slipWidthFastMs: 0.7,
  noiseGain: 1,
  cutoffSlowHz: 900,
  cutoffFastHz: 3000,
  highpassHz: 110,
  refSpeedMmS: 300,
  speedExponent: 0.8,
  pressureExponent: 1,
};

/** Plastic cap over a plastic barrel: hard, smooth, bright, very short. */
export const PLASTIC_ON_PLASTIC: FrictionMaterial = {
  grainCoarseMm: 0.8,
  grainFineMm: 0.2,
  grainDepth: 0.25,
  slipsPerMm: 2,
  slipGain: 4,
  slipWidthSlowMs: 0.1,
  slipWidthFastMs: 0.05,
  noiseGain: 0.7,
  cutoffSlowHz: 5000,
  cutoffFastHz: 11000,
  highpassHz: 1800,
  refSpeedMmS: 120,
  speedExponent: 0.7,
  pressureExponent: 1,
};
