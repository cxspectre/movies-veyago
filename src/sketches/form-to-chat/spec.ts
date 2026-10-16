// spec.ts — page 12, "Just ask them." (BIBLE 4.13). A form screen full of empty fields is drawn, judged and
// crossed out with one hard stroke; beside it the same screen is redrawn as a question with two answer chips.
// Every window comes from FORM_TO_CHAT_FRACTIONS in beats.ts (the page has deliberate pauses: nothing is drawn
// over 0.33-0.40, 0.47-0.53 and 0.72-0.78).
import {FORM_TO_CHAT_FRACTIONS as F} from '../../beats';
import {handLine, handPath, handRect, type LabelSpec, type SketchSpec, type StrokeSpec, type XY} from '../../paper';
import {accentLoop} from './accentLoop';
import {roundedBox} from './roundedBox';

/** Line weights (BIBLE 2.4). */
const W = {device: 3.0, ui: 2.2, title: 2.8, cross: 4.0, accent: 2.6} as const;
const TITLE_PRESSURE = 1.15;
const CROSS_PRESSURE = 1.3;

const FRAME_RADIUS = 48;
const FIELD = {x: 150, w: 260, h: 44, radius: 8, rows: [190, 260, 330, 400, 470, 540, 610]} as const;
const PLACEHOLDERS = ['Name', 'Date of birth', 'Doctor', 'Pharmacy', 'Insurer', 'Policy no.', 'Allergies'] as const;
/** Placeholders: soft enough to read as grey hint text, firm enough to stay legible at 1x (review: 26 px broke up). */
const PLACEHOLDER = {face: 'reenie-400', size: 30, inset: 14, baseline: 32, pressure: 0.95} as const;
/** Within each field's slot: the box takes the first part, the pencil lifts, the placeholder is written. */
const BOX_SHARE = 0.5;
const WRITE_FROM = 0.55;

const CHIP = {y0: 420, y1: 470, radius: 25, face: 'patrick-400', size: 30} as const;
const QUESTION = {face: 'patrick-400', size: 36, x: 800} as const;
/**
 * The accent loop round both chips (BIBLE: 300x90 at (930,445)). Squarer than an ellipse and a touch smaller so it
 * clears the pills' ends and stays ~14 px inside the chat frame's right edge (x 1080).
 */
const CIRCLE = {cx: 930, cy: 446, rx: 136, ry: 46, squareness: 3, overlapPx: 12} as const;
const NOTE = {text: 'Just ask them.', x: 520, y: 440, size: 44, rotate: -4} as const;

const lerp = (w: readonly [number, number], k: number): number => w[0] + (w[1] - w[0]) * k;

const s = (id: string, d: string, win: readonly [number, number], o: Partial<StrokeSpec> = {}): StrokeSpec => ({
  id,
  d,
  ink: 'graphite',
  width: W.ui,
  from: win[0],
  to: win[1],
  ...o,
});

const fieldSlot = (i: number): readonly [number, number] => {
  const span = (F.fields[1] - F.fields[0]) / FIELD.rows.length;
  return [F.fields[0] + i * span, F.fields[0] + (i + 1) * span];
};

const fieldStrokes: readonly StrokeSpec[] = FIELD.rows.map((y, i) => {
  const slot = fieldSlot(i);
  return s(`field-${i + 1}`, handRect(FIELD.x, y, FIELD.w, FIELD.h, 400 + i, {radius: FIELD.radius, overshoot: 6}), [slot[0], lerp(slot, BOX_SHARE)]);
});

const placeholderLabels: readonly LabelSpec[] = FIELD.rows.map((y, i) => {
  const slot = fieldSlot(i);
  return {
    id: `placeholder-${i + 1}`,
    text: PLACEHOLDERS[i] ?? '',
    x: FIELD.x + PLACEHOLDER.inset,
    y: y + PLACEHOLDER.baseline,
    size: PLACEHOLDER.size,
    ink: 'graphite',
    face: PLACEHOLDER.face,
    pressure: PLACEHOLDER.pressure,
    from: lerp(slot, WRITE_FROM),
    to: slot[1],
  };
});

/** The button: a rounded box and a short squiggle for its word, centred. */
const saveButton = (): string => {
  const squiggle: readonly XY[] = [
    [252, 707],
    [258, 699],
    [266, 709],
    [276, 700],
    [286, 709],
    [296, 700],
    [306, 708],
  ];
  return [handRect(150, 680, 260, 50, 420, {radius: 12, overshoot: 7}), handPath(squiggle, 421, {wobble: 0.6})].join(' ');
};

const pill = (x0: number, x1: number, seed: number): string => roundedBox(x0, CHIP.y0, x1 - x0, CHIP.y1 - CHIP.y0, seed, {radius: CHIP.radius, overshoot: 10});
const phoneFrame = (x: number, seed: number): string => roundedBox(x, 95, 320, 660, seed, {radius: FRAME_RADIUS, overshoot: 16, wobble: 0.7});

const strokes: readonly StrokeSpec[] = [
  s('form-frame', phoneFrame(120, 401), F.formOutline, {width: W.device, rough: true}),
  s('form-title', handLine(150, 140, 330, 140, 402, {overshoot: 3}), F.formTitle, {width: W.title, pressure: TITLE_PRESSURE}),
  ...fieldStrokes,
  s('save', saveButton(), F.saveButton),
  s('cross', handLine(130, 110, 430, 740, 430, {bow: -6, overshoot: 10, wobble: 0.4}), F.crossOut, {width: W.cross, pressure: CROSS_PRESSURE}),
  s('chat-frame', phoneFrame(760, 440), F.chatOutline, {width: W.device, rough: true}),
  s('chips-mom', pill(800, 920, 450), [F.chipMom[0], lerp(F.chipMom, 0.55)]),
  s('chips-dad', pill(940, 1060, 451), [F.chipDad[0], lerp(F.chipDad, 0.55)]),
  s('circle', accentLoop(CIRCLE, 460), F.circle, {ink: 'accent', width: W.accent}),
];

const textLabel = (id: string, text: string, x: number, y: number, win: readonly [number, number], o: Partial<LabelSpec> = {}): LabelSpec => ({
  id,
  text,
  x,
  y,
  size: QUESTION.size,
  ink: 'graphite',
  face: QUESTION.face,
  from: win[0],
  to: win[1],
  ...o,
});

const labels: readonly LabelSpec[] = [
  ...placeholderLabels,
  textLabel('question', 'Who are you', QUESTION.x, 300, [F.question[0], lerp(F.question, 0.48)]),
  textLabel('question-2', 'looking after?', QUESTION.x, 348, [lerp(F.question, 0.52), F.question[1]]),
  textLabel('chips-mom-label', 'Mom', 830, 454, [lerp(F.chipMom, 0.62), F.chipMom[1]], {size: CHIP.size, face: CHIP.face}),
  textLabel('chips-dad-label', 'Dad', 970, 454, [lerp(F.chipDad, 0.62), F.chipDad[1]], {size: CHIP.size, face: CHIP.face}),
  {id: 'note', text: NOTE.text, x: NOTE.x, y: NOTE.y, size: NOTE.size, ink: 'accent', rotate: NOTE.rotate, face: 'caveat-500', from: F.note[0], to: F.note[1]},
];

export const spec: SketchSpec = {id: 'form-to-chat', strokes, labels};
