// spec.ts — page 10, country-aware binders (BIBLE 4.11): a rough map of western Europe, Britain apart, three
// interior borders, the Netherlands, Belgium, Germany and France circled (this page's four-circle exception),
// "112" and "A4" in the margin.
import {handCircle, handPath, type LabelSpec, type SketchSpec, type StrokeSpec, type XY} from '../../paper';
import {britainPoints, continentPoints, franceAlpsPoints, franceBelgiumPoints, germanyBorderPoints, lowCountriesPoints} from './geography';

/** Line weights (BIBLE 2.4): the coast is the page's big outline; borders are light interior lines. */
const W = {coast: 2.4, border: 1.6, accent: 2.6} as const;
const BORDER_PRESSURE = 0.8;

const MARGIN = {face: 'caveat-700', size: 56, rotate: -6} as const;
const NOTE = {text: 'Past one\ncountry.', x: 980, y: 640, size: 44, rotate: -2} as const;

const line = (pts: readonly XY[], seed: number, wobble = 0.9): string => handPath(pts, seed, {wobble, smooth: 0.85});

const s = (id: string, d: string, from: number, to: number, o: Partial<StrokeSpec> = {}): StrokeSpec => ({
  id,
  d,
  ink: 'graphite',
  width: W.border,
  from,
  to,
  ...o,
});

const accentCircle = (id: string, cx: number, cy: number, r: number, seed: number, from: number, to: number): StrokeSpec =>
  s(id, handCircle(cx, cy, r * 1.04, r * 0.96, seed), from, to, {ink: 'accent', width: W.accent});

const strokes: readonly StrokeSpec[] = [
  s('coast', line(continentPoints(), 101, 1.1), 0.0, 0.4, {width: W.coast, rough: true}),
  s('uk', line(britainPoints(), 102, 0.9), 0.4, 0.48, {width: W.coast, rough: true}),
  s('border-1', line(franceBelgiumPoints(), 103), 0.48, 0.515, {pressure: BORDER_PRESSURE}),
  s('border-2', line(lowCountriesPoints(), 104), 0.515, 0.545, {pressure: BORDER_PRESSURE}),
  s('border-3', [line(germanyBorderPoints(), 105), line(franceAlpsPoints(), 106)].join(' '), 0.545, 0.6, {pressure: BORDER_PRESSURE}),
  accentCircle('circle-nl', 500, 250, 45, 111, 0.62, 0.665),
  accentCircle('circle-be', 470, 335, 38, 112, 0.665, 0.71),
  accentCircle('circle-de', 700, 360, 90, 113, 0.71, 0.755),
  accentCircle('circle-fr', 420, 520, 110, 114, 0.755, 0.8),
];

const labels: readonly LabelSpec[] = [
  {id: 'label-112', text: '112', x: 1010, y: 250, ink: 'accent', ...MARGIN, from: 0.82, to: 0.9},
  {id: 'label-a4', text: 'A4', x: 1020, y: 340, ink: 'accent', ...MARGIN, from: 0.9, to: 0.95},
  {id: 'note', text: NOTE.text, x: NOTE.x, y: NOTE.y, size: NOTE.size, ink: 'accent', rotate: NOTE.rotate, face: 'caveat-500', from: 0.95, to: 1.0},
];

export const spec: SketchSpec = {id: 'europe-map', strokes, labels};
