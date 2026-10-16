// timed.ts — explicit-timing builders for the pages whose stroke-order fractions the bible fixes (BIBLE §4).
// `sequence()` spreads items by length; these pages need the director's exact windows instead.
import type {HandFaceKey, Ink, LabelSpec, StrokeSpec} from '../../paper';

/** Line weights by element class (BIBLE §2.4), sketch px. */
export const WEIGHT = {
  device: 3.0,
  box: 2.2,
  text: 1.6,
  hatch: 1.2,
  dotted: 1.6,
  tick: 3.0,
  accent: 2.6,
} as const;

/** Margin notes: Caveat 500, 44 sketch px, 36 when the note is longer than this many characters (BIBLE §2.6). */
const NOTE_SIZE = 44;
const NOTE_SIZE_LONG = 36;
const NOTE_LONG_CHARS = 26;
/** Labels inside drawings: Patrick Hand 400, 30 sketch px. */
export const LABEL_SIZE = 30;

type StrokeOptions = Partial<Omit<StrokeSpec, 'id' | 'd' | 'from' | 'to'>>;

/** A graphite stroke drawn over the window [from, to] (fractions of drawFrames). */
export const line = (id: string, d: string, from: number, to: number, o: StrokeOptions = {}): StrokeSpec => ({
  id,
  d,
  ink: 'graphite',
  width: WEIGHT.box,
  from,
  to,
  ...o,
});

/** An accent stroke (circles, arrows, marks): the film's one "yes" colour. */
export const accent = (id: string, d: string, from: number, to: number, o: StrokeOptions = {}): StrokeSpec =>
  line(id, d, from, to, {ink: 'accent', width: WEIGHT.accent, ...o});

type LabelOptions = {readonly size?: number; readonly ink?: Ink; readonly face?: HandFaceKey; readonly rotate?: number};

/** A label inside a drawing: Patrick Hand 400, graphite, upright (BIBLE §2.6). */
export const tag = (id: string, text: string, x: number, y: number, from: number, to: number, o: LabelOptions = {}): LabelSpec => ({
  id,
  text,
  x,
  y,
  size: o.size ?? LABEL_SIZE,
  ink: o.ink ?? 'graphite',
  face: o.face ?? 'patrick-400',
  rotate: o.rotate ?? 0,
  from,
  to,
});

const longestLine = (text: string): number => Math.max(...text.split('\n').map((l) => l.length));

/**
 * The page's margin note in accent Caveat 500. Size follows the bible's length rule, measured on the longest
 * written line (a note wrapped onto two short lines is lettered at the normal size).
 */
export const note = (text: string, x: number, y: number, rotate: number, from: number, to: number): LabelSpec => ({
  id: 'note',
  text,
  x,
  y,
  size: longestLine(text) > NOTE_LONG_CHARS ? NOTE_SIZE_LONG : NOTE_SIZE,
  ink: 'accent',
  face: 'caveat-500',
  rotate,
  from,
  to,
});

/** Split [from, to] into `n` equal back-to-back windows. */
export const slots = (from: number, to: number, n: number): readonly (readonly [number, number])[] =>
  Array.from({length: n}, (_, i) => [from + ((to - from) * i) / n, from + ((to - from) * (i + 1)) / n] as const);
