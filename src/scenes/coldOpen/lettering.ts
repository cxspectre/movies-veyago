// lettering.ts — "What are we still missing?" lettered on the sticky note (BIBLE 2.6): Kalam 700, accent, three
// centred lines at leading 1.05, written left to right at 8 characters a second with two short line breaks, so the
// 26 characters fill the 4.0 s lettering window. A SketchSpec in the note's own px, so the pen hand can follow it.
import {coldOpen} from '../../beats';
import {FPS} from '../../film';
import {measureHand, type LabelSpec, type SketchSpec} from '../../paper';
import {NOTE_LEADING, type NoteGeometry} from './layout';

const FACE = 'kalam-700' as const;
const LINES = ['What are', 'we still', 'missing?'] as const;
/** BIBLE 2.6: the sticky note is written at 8 characters a second. */
const CHARS_PER_SECOND = 8;
/** The pen arrives and touches down a moment after the window opens. */
const LEAD_IN_SECONDS = 0.1;
/** Where the first baseline sits relative to the optical centre of the three-line block (em). */
const CAP_HEIGHT_EM = 0.72;
/** Small fixed horizontal offsets per line (a hand never centres exactly), px at the note's scale. */
const LINE_SHIFT = [-3, 4, -1] as const;
const PRESSURE = 1.1;

if (LINES.join(' ') !== coldOpen.lettering.text) {
  throw new Error(`coldOpen lettering lines do not spell "${coldOpen.lettering.text}"`);
}

export const LETTERING_SECONDS = coldOpen.lettering.to - coldOpen.lettering.from;
export const LETTERING_FRAMES = Math.round(LETTERING_SECONDS * FPS);

/** Characters written per line (the space before a line break is "written" as the pen travels back). */
const charsOf = (i: number): number => (LINES[i] as string).length + (i < LINES.length - 1 ? 1 : 0);

const totalChars = (): number => LINES.reduce((sum, _, i) => sum + charsOf(i), 0);

/** The two line breaks share what is left of the window after the characters (and the lead-in). */
const breakSeconds = (): number => (LETTERING_SECONDS - LEAD_IN_SECONDS - totalChars() / CHARS_PER_SECOND) / (LINES.length - 1);

const lineWindow = (i: number): {from: number; to: number} => {
  const before = LINES.slice(0, i).reduce((sum, _, j) => sum + charsOf(j) / CHARS_PER_SECOND, 0);
  const start = LEAD_IN_SECONDS + before + i * breakSeconds();
  const end = start + (LINES[i] as string).length / CHARS_PER_SECOND;
  return {from: start / LETTERING_SECONDS, to: end / LETTERING_SECONDS};
};

/** The lettering, laid out on a note of the given geometry (note px, origin top-left). */
export const letteringSpec = (note: NoteGeometry): SketchSpec => {
  const lineH = note.textSize * NOTE_LEADING;
  const firstBaseline = (note.size - LINES.length * lineH) / 2 + note.textSize * CAP_HEIGHT_EM;
  const labels: LabelSpec[] = LINES.map((text, i) => ({
    id: `question-${i + 1}`,
    text,
    x: (note.size - measureHand(text, note.textSize, FACE)) / 2 + (LINE_SHIFT[i] ?? 0),
    y: firstBaseline + i * lineH,
    size: note.textSize,
    ink: 'accent',
    face: FACE,
    pressure: PRESSURE,
    ...lineWindow(i),
  }));
  return {id: 'cold-open-question', strokes: [], labels};
};
