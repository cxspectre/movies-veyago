// spec.ts — page 9, "Record it. Keep it on the phone." (BIBLE 4.10). A doctor's desk in side elevation, a phone
// lying on it, a sound wave above. Coordinates and stroke-order fractions are the bible's; geometry is hand-drawn.
import {handCircle, handLine, handPath, handRect, type LabelSpec, type SketchSpec, type StrokeSpec, type XY} from '../../paper';
import {hash01} from '../../paper/geometry/noise';

/** Line weights by element class (BIBLE 2.4), sketch px. */
const W = {furniture: 2.6, ui: 2.2, text: 1.6, device: 3.0, wave: 2.2, accent: 2.6} as const;

const NOTE = {text: 'Record it. Keep it on the phone.', x: 140, y: 762, size: 36, rotate: -1} as const;

const desk = (): string =>
  [
    handLine(150, 560, 1050, 560, 11, {bow: -2.5, overshoot: 6}),
    // the under-edge of the desk top: a shorter, lighter return so the line reads as a slab
    handLine(1040, 573, 166, 574, 12, {bow: 1.5, overshoot: 3}),
  ].join(' ');

const legs = (): string => [handLine(181, 575, 179, 700, 21, {bow: 1, overshoot: 3}), handLine(1019, 575, 1021, 700, 22, {bow: -1, overshoot: 3})].join(' ');

/** A simple side-view chair: a raked backrest slat, a seat slab, two splayed legs and a stretcher between them. */
const chair = (): string =>
  [
    handPath(
      [
        [253, 484],
        [247, 425],
        [239, 368],
        [242, 356],
        [252, 356],
        [258, 420],
        [265, 483],
      ],
      31,
      {wobble: 0.6, smooth: 0.7},
    ),
    handRect(240, 482, 140, 15, 32, {radius: 6, overshoot: 8}),
    handLine(256, 498, 246, 558, 33, {bow: 0.6, overshoot: 1}),
    handLine(366, 498, 375, 558, 34, {bow: -0.6, overshoot: 1}),
    handLine(252, 530, 370, 530, 35, {bow: 0.8, overshoot: 0}),
  ].join(' ');

const clipboard = (): string =>
  [
    handRect(720, 420, 180, 140, 41, {radius: 6, overshoot: 8}),
    handRect(790, 410, 40, 20, 42, {radius: 5, overshoot: 4}),
  ].join(' ');

const clipboardLines = (): string =>
  [
    handLine(742, 456, 872, 455, 51, {overshoot: 1}),
    handLine(742, 484, 860, 484, 52, {overshoot: 1}),
    handLine(742, 512, 826, 511, 53, {overshoot: 1}),
  ].join(' ');

/** The phone lying flat on the desk, seen a little from above: its face, its edge, and a record dot on the screen. */
const phone = (): string =>
  [
    handPath(
      [
        [541, 516],
        [650, 515],
        [639, 544],
        [527, 546],
        [537, 518],
        [548, 516],
      ],
      61,
      {wobble: 0.5, smooth: 0.15},
    ),
    handLine(527, 547, 526, 555, 62, {overshoot: 0, bow: 0}),
    handLine(526, 556, 638, 555, 63, {overshoot: 1, bow: 0}),
    handLine(639, 545, 638, 555, 64, {overshoot: 0, bow: 0}),
    handCircle(588, 530, 7, 5.5, 65),
  ].join(' ');

/** Two short arcs rising off the phone: it is listening (the wave above is what it hears). */
const PHONE_TOP: XY = [588, 506];
const listening = (): string =>
  [16, 30]
    .map((r, i) => {
      const pts = Array.from({length: 7}, (_, k): XY => {
        const a = ((-140 + (100 * k) / 6) * Math.PI) / 180;
        return [PHONE_TOP[0] + Math.cos(a) * r, PHONE_TOP[1] + Math.sin(a) * r * 0.8];
      });
      return handPath(pts, 66 + i, {wobble: 0.4});
    })
    .join(' ');

/** Loudness envelope of the recording: quiet at both ends, a spoken phrase in the middle (x 500-700). */
const envelope = (x: number): number => {
  const rise = Math.min(1, Math.max(0, (x - 300) / 200));
  const fall = Math.min(1, Math.max(0, (900 - x) / 200));
  const k = Math.min(rise, fall);
  return 10 + 50 * k * k * (3 - 2 * k);
};

const WAVE_HALF_CYCLES = 80; // ~40 crests
const WAVE_SEED = 71;

/** One quick zigzag from left to right; each swing's height follows the envelope, varied like syllables. */
const wave = (): string => {
  const pts = Array.from({length: WAVE_HALF_CYCLES + 1}, (_, i): XY => {
    const x = 300 + (600 * i) / WAVE_HALF_CYCLES;
    const syllable = 0.55 + 0.45 * Math.abs(Math.sin(i * 0.37 + hash01(WAVE_SEED, i) * 1.4));
    const amp = i === 0 || i === WAVE_HALF_CYCLES ? 0 : envelope(x) * syllable;
    return [x, 260 + (i % 2 === 0 ? -amp : amp)];
  });
  return handPath(pts, WAVE_SEED, {wobble: 0.8, smooth: 0.35});
};

const s = (id: string, d: string, from: number, to: number, o: Partial<StrokeSpec> = {}): StrokeSpec => ({
  id,
  d,
  ink: 'graphite',
  width: W.ui,
  from,
  to,
  ...o,
});

const strokes: readonly StrokeSpec[] = [
  s('desk', desk(), 0.0, 0.14, {width: W.furniture, rough: true}),
  s('legs', legs(), 0.14, 0.2, {width: W.furniture}),
  s('chair', chair(), 0.2, 0.34, {width: W.furniture, rough: true}),
  s('clipboard', clipboard(), 0.34, 0.42),
  s('clipboard-lines', clipboardLines(), 0.42, 0.46, {width: W.text, pressure: 0.8}),
  s('phone', phone(), 0.46, 0.54, {width: W.device}),
  s('listening', listening(), 0.54, 0.56, {width: W.ui}),
  s('wave', wave(), 0.56, 0.78, {width: W.wave}),
  s('circle', handCircle(590, 538, 72, 66, 81, {startAngle: -155}), 0.82, 0.88, {ink: 'accent', width: W.accent}),
];

const labels: readonly LabelSpec[] = [
  {id: 'note', text: NOTE.text, x: NOTE.x, y: NOTE.y, size: NOTE.size, ink: 'accent', rotate: NOTE.rotate, face: 'caveat-500', from: 0.9, to: 1.0},
];

export const spec: SketchSpec = {id: 'visit-recording', strokes, labels};
