// stroke.ts — continuous drawing: a graphite pencil or a fine pen on paper over a wooden desk.
//
// Recipe: hand-gesture speed curve (chained minimum-jerk sub-movements) + slight pressure wobble ->
// friction source (tooth texture over position, stick-slip micro-releases, speed-dependent brightness)
// -> paper-on-desk body EQ -> a soft tip-landing contact -> raised-cosine start/stop -> small room.

import {SR} from '../core/constants';
import {fadeInOut} from '../core/envelope';
import {applyChain, lowShelf, peaking, type Biquad} from '../core/filters';
import {contactForce, modalBank, type Mode} from '../core/modal';
import type {Rng} from '../core/rng';
import {clamp, mixMono, multiply, peakAbs, type Mono} from '../core/signal';
import type {Voice} from '../core/voice';
import {frictionSource, type FrictionMaterial} from './friction';
import {drawingSpeed, PEN_STYLE, PENCIL_STYLE, wobblyPressure, type DrawingStyle} from './gesture';
import {FINE_PEN_ON_PAPER, GRAPHITE_ON_PAPER} from './materials';

export type StrokeTool = 'pencil' | 'pen';
export type StrokeParams = {
  readonly dur: number;
  readonly pressure?: number;
  readonly tool?: StrokeTool;
  /** Multiplies the hand's speed (analysis and special moments; cues leave it at 1). */
  readonly speedScale?: number;
  readonly pan?: number;
};

export const STROKE_MIN_SEC = 0.15;
export const STROKE_MAX_SEC = 5;
export const DEFAULT_PRESSURE = 0.6;

type ToolSpec = {
  readonly material: FrictionMaterial;
  readonly style: DrawingStyle;
  readonly body: readonly Biquad[];
  readonly landingTau: number;
  readonly landingModes: readonly Mode[];
  readonly landingLevel: number;
  readonly attackSec: number;
  readonly releaseSec: number;
};

/** The desk under the sheet is the soundboard (warmth ~600 Hz); the sheet's own crispness lives at 2-6 kHz. */
export const PENCIL_BODY: readonly Biquad[] = [lowShelf(300, -4), peaking(600, 0.8, 2), peaking(2200, 1, 3), peaking(5500, 1.4, 2)];

const TOOLS: Record<StrokeTool, ToolSpec> = {
  pencil: {
    material: GRAPHITE_ON_PAPER,
    style: PENCIL_STYLE,
    body: PENCIL_BODY,
    landingTau: 0.0004,
    landingModes: [
      {freq: 650, t60: 0.03, amp: 1},
      {freq: 1500, t60: 0.022, amp: 0.6},
      {freq: 3100, t60: 0.012, amp: 0.35},
    ],
    landingLevel: 0.22,
    attackSec: 0.018,
    releaseSec: 0.035,
  },
  pen: {
    material: FINE_PEN_ON_PAPER,
    style: PEN_STYLE,
    body: [lowShelf(1000, -3), peaking(4500, 1.2, 2)],
    landingTau: 0.00025,
    landingModes: [
      {freq: 900, t60: 0.02, amp: 0.6},
      {freq: 2600, t60: 0.015, amp: 1},
      {freq: 5200, t60: 0.01, amp: 0.4},
    ],
    landingLevel: 0.12,
    attackSec: 0.012,
    releaseSec: 0.03,
  },
};

const PRESSURE_WOBBLE = 0.12;
const PAN_SPREAD = 0.15;
const PAN_DRIFT = 0.06;

function landing(n: number, spec: ToolSpec, pressure: number): Mono {
  const force = contactForce(n, [{at: 0, impulse: pressure, tau: spec.landingTau}]);
  return modalBank(force, spec.landingModes);
}

export function strokeVoice(params: StrokeParams, rng: Rng): Voice {
  const dur = clamp(params.dur, STROKE_MIN_SEC, STROKE_MAX_SEC);
  const spec = TOOLS[params.tool ?? 'pencil'];
  const p = clamp(params.pressure ?? DEFAULT_PRESSURE, 0.05, 1);
  const n = Math.round(dur * SR);
  const speed = drawingSpeed(dur, spec.style, rng.fork('gesture'), params.speedScale ?? 1);
  const pressure = wobblyPressure(n, p, PRESSURE_WOBBLE, rng.fork('pressure'));
  const raw = applyChain(frictionSource(speed, pressure, spec.material, rng.fork('friction')), spec.body);
  const body = multiply(raw, fadeInOut(n, Math.min(spec.attackSec, dur * 0.25), Math.min(spec.releaseSec, dur * 0.3)));
  const land = landing(n, spec, p);
  // not every line starts with a tap: the tip often lands while already moving
  const landGain = (spec.landingLevel * rng.fork('landing').uniform(0.2, 1) * peakAbs(body)) / Math.max(peakAbs(land), 1e-12);
  const shaped = mixMono(n, [{sig: body}, {sig: land, gain: landGain}]);
  const panRng = rng.fork('pan');
  const base = params.pan ?? panRng.uniform(-PAN_SPREAD, PAN_SPREAD);
  const drift = panRng.uniform(-PAN_DRIFT, PAN_DRIFT);
  const pan = Float64Array.from({length: n}, (_, i) => clamp(base + drift * (i / n), -1, 1));
  return {mono: shaped, pan, space: 'desk', syncSample: 0};
}
