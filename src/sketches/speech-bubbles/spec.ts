// spec.ts — page 11, Spanish, German, French and Dutch (BIBLE 4.12): five speech bubbles, each ticked in accent.
import {handTick, measureHand, type LabelSpec, type SketchSpec, type StrokeSpec, type XY} from '../../paper';
import {bubblePath, type BubbleBox} from './bubble';

const PAGE_CENTRE: XY = [600, 425];
const BUBBLE = {radius: 40, tail: 34, tailHalfBase: 14, width: 2.2} as const;
const WORD = {face: 'patrick-400', size: 44, capShift: 0.33} as const;
/** The tick's drawn extent relative to its anchor (handTick): left 0.36, right 0.62, height 1.0 of its size. */
const TICK = {size: 40, width: 3.0, gap: 14, left: 0.36, right: 0.62, rise: 0.48, pressure: 1.3} as const;
const NOTE = {text: 'Four more languages.', x: 120, y: 740, size: 44, rotate: -2} as const;

/** Fraction of each bubble's window spent on the loop; the word is written in the rest, after a short lift. */
const LOOP_SHARE = 0.6;
const LIFT_SHARE = 0.05;

/** Which side of the tail tip its tick sits on (chosen so the five ticks never crowd each other). */
type TickSide = 'left' | 'right' | 'above' | 'below';
type Bubble = {box: BubbleBox; word: string; window: readonly [number, number]; tick: TickSide};

const BUBBLES: readonly Bubble[] = [
  {box: {x0: 130, y0: 190, x1: 370, y1: 310}, word: 'Hello', window: [0.0, 0.14], tick: 'right'},
  {box: {x0: 525, y0: 140, x1: 755, y1: 260}, word: 'Hola', window: [0.14, 0.28], tick: 'left'},
  {box: {x0: 870, y0: 240, x1: 1090, y1: 360}, word: 'Hallo', window: [0.28, 0.42], tick: 'left'},
  {box: {x0: 290, y0: 420, x1: 550, y1: 540}, word: 'Bonjour', window: [0.42, 0.58], tick: 'above'},
  {box: {x0: 720, y0: 480, x1: 920, y1: 600}, word: 'Hoi', window: [0.58, 0.72], tick: 'below'},
];

const TICKS_FROM = 0.76;
const TICK_SPAN = 0.028;

const shapes = BUBBLES.map((b, i) => bubblePath(b.box, {...BUBBLE, toward: PAGE_CENTRE, seed: 200 + i * 7}));

/** The tick's anchor so its drawn extent sits a clear gap from the tail tip, on the chosen side. */
const tickAt = (tip: XY, side: TickSide): XY => {
  const {size, gap, left, right, rise} = TICK;
  if (side === 'right') return [tip[0] + gap + size * left, tip[1] + size * rise];
  if (side === 'left') return [tip[0] - gap - size * right, tip[1] + size * rise];
  // above sits up and to the right of the tip, below down and to the left, so neither touches the tail's edges
  if (side === 'above') return [tip[0] + size * left + gap * 0.5, tip[1] - gap * 1.5];
  return [tip[0] - size * right - gap * 0.5, tip[1] + gap * 1.5 + size];
};

const bubbleStrokes: readonly StrokeSpec[] = BUBBLES.map((b, i) => {
  const [from, to] = b.window;
  return {id: `bubble-${i + 1}`, d: (shapes[i] as {d: string}).d, ink: 'graphite', width: BUBBLE.width, from, to: from + (to - from) * LOOP_SHARE};
});

const tickStrokes: readonly StrokeSpec[] = BUBBLES.map((b, i) => {
  const [x, y] = tickAt((shapes[i] as {tip: XY}).tip, b.tick);
  const from = TICKS_FROM + i * TICK_SPAN;
  return {id: `tick-${i + 1}`, d: handTick(x, y, TICK.size, 300 + i), ink: 'accent', width: TICK.width, pressure: TICK.pressure, from, to: from + TICK_SPAN};
});

const wordLabels: readonly LabelSpec[] = BUBBLES.map((b, i) => {
  const [from, to] = b.window;
  const w = measureHand(b.word, WORD.size, WORD.face);
  return {
    id: `word-${i + 1}`,
    text: b.word,
    x: (b.box.x0 + b.box.x1) / 2 - w / 2,
    y: (b.box.y0 + b.box.y1) / 2 + WORD.size * WORD.capShift,
    size: WORD.size,
    ink: 'graphite',
    face: WORD.face,
    from: from + (to - from) * (LOOP_SHARE + LIFT_SHARE),
    to,
  };
});

const noteLabel: LabelSpec = {id: 'note', text: NOTE.text, x: NOTE.x, y: NOTE.y, size: NOTE.size, ink: 'accent', rotate: NOTE.rotate, face: 'caveat-500', from: 0.92, to: 1.0};

export const spec: SketchSpec = {id: 'speech-bubbles', strokes: [...bubbleStrokes, ...tickStrokes], labels: [...wordLabels, noteLabel]};

/** Each bubble's whole window (loop and word): its `bubble_pop` lands when the word is finished. */
export const BUBBLE_WINDOWS: readonly (readonly [number, number])[] = BUBBLES.map((b) => b.window);
