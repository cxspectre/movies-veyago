// handLayout.ts — lays out hand-lettering glyph by glyph (with the small irregularities of a real hand) and
// plans the pen's path and pacing through each glyph. Pure: uses generated metrics, never the DOM.
import {hash01, hashSigned, seedOf} from '../geometry/noise';
import type {MarkPoint, GlyphMark} from '../marks/types';
import type {HandFaceKey, Ink, LabelSpec} from '../types';
import {type FaceMetrics, type GlyphMetric, HAND_METRICS} from './handMetrics';

export const DEFAULT_FACE: Record<Ink, HandFaceKey> = {graphite: 'caveat-500', accent: 'caveat-500', sepia: 'caveat-500'};
export const LINE_HEIGHT = 1.12;

const SIZE_JITTER = 0.035;
const ROT_JITTER = 0.028; // radians
const BASELINE_JITTER = 0.025; // em
const TRACK_JITTER = 0.018; // em
const DRIFT = 0.012; // radians: a line of handwriting rarely stays level
const SPACE_PAUSE = 0.45; // em-equivalent of time for the pen to lift between words
const LINE_PAUSE = 0.9;
const GLYPH_EFFORT = 0.16; // em-equivalent: every glyph costs some time regardless of width
const SWEEP_EM = 0.17; // width of one up/down pen sweep inside a glyph
const FALLBACK: GlyphMetric = [0.45, 0.04, 0.42, 0, 0.4];

export const faceOf = (label: LabelSpec): HandFaceKey => label.face ?? DEFAULT_FACE[label.ink];
export const metricsOf = (face: HandFaceKey): FaceMetrics => HAND_METRICS[face];
const glyphMetric = (m: FaceMetrics, ch: string): GlyphMetric => m.glyphs[ch] ?? m.glyphs['?'] ?? FALLBACK;

/** Width of a single line of text in px, without jitter (for layout decisions like wrapping and centring). */
export const measureHand = (text: string, size: number, face: HandFaceKey = 'caveat-500'): number => {
  const m = metricsOf(face);
  return Array.from(text).reduce((w, ch) => w + glyphMetric(m, ch)[0] * size, 0);
};

/** Greedy word wrap to a maximum width; returns lines joined with '\n'. */
export const wrapHand = (text: string, size: number, maxWidth: number, face: HandFaceKey = 'caveat-500'): string =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .reduce<string[]>((lines, word) => {
      const last = lines[lines.length - 1];
      if (last !== undefined && measureHand(`${last} ${word}`, size, face) <= maxWidth) {
        return [...lines.slice(0, -1), `${last} ${word}`];
      }
      return [...lines, word];
    }, [])
    .join('\n');

/** The pen's zigzag through a glyph's box, in glyph-local px (y down), starting top-left like most letters. */
const penPath = (g: GlyphMetric, size: number): {pen: readonly Omit<MarkPoint, 't'>[]; brush: number} => {
  const [, xMin, xMax, yMin, yMax] = g;
  const left = xMin * size;
  const right = Math.max(xMax * size, left + 1);
  const top = -yMax * size;
  const bottom = -yMin * size;
  const sweeps = Math.max(2, Math.round((right - left) / (SWEEP_EM * size)));
  const step = (right - left) / sweeps;
  const pts = Array.from({length: sweeps + 1}, (_, i) => ({
    x: left + i * step,
    y: i % 2 === 0 ? top : bottom,
    w: 1,
    p: 1,
  }));
  return {pen: pts, brush: step * 2.1 + size * 0.06};
};

const timePen = (pen: readonly Omit<MarkPoint, 't'>[]): readonly MarkPoint[] => {
  const cum = pen.reduce<number[]>((acc, p, i) => {
    const prev = pen[i - 1];
    acc.push(prev ? (acc[i - 1] as number) + Math.hypot(p.x - prev.x, p.y - prev.y) : 0);
    return acc;
  }, []);
  const total = cum[cum.length - 1] || 1;
  return pen.map((p, i) => ({...p, t: (cum[i] as number) / total}));
};

type Placed = {ch: string; x: number; y: number; size: number; rot: number; cost: number; word: number; g: GlyphMetric};

const placeGlyphs = (label: LabelSpec, m: FaceMetrics, seed: number): readonly Placed[] => {
  const rot0 = ((label.rotate ?? 0) * Math.PI) / 180;
  const cos = Math.cos(rot0);
  const sin = Math.sin(rot0);
  const drift = hashSigned(seed, 999) * DRIFT;
  const out: Placed[] = [];
  let word = 0;
  label.text.split('\n').forEach((line, li) => {
    let pen = 0;
    Array.from(line).forEach((ch, ci) => {
      const k = li * 1000 + ci;
      const g = glyphMetric(m, ch);
      const size = label.size * (1 + hashSigned(seed + 1, k) * SIZE_JITTER);
      if (ch === ' ') {
        word += 1;
        out.push({ch, x: 0, y: 0, size, rot: 0, cost: SPACE_PAUSE, word, g});
        pen += g[0] * label.size;
        return;
      }
      const lx = pen;
      const ly = li * LINE_HEIGHT * label.size + pen * Math.tan(drift) + hashSigned(seed + 2, k) * BASELINE_JITTER * label.size;
      out.push({
        ch,
        x: label.x + lx * cos - ly * sin,
        y: label.y + lx * sin + ly * cos,
        size,
        rot: rot0 + drift + hashSigned(seed + 3, k) * ROT_JITTER,
        cost: (g[2] - g[1]) * (0.9 + hash01(seed + 4, k) * 0.35) + GLYPH_EFFORT + (ci === 0 && li > 0 ? LINE_PAUSE : 0),
        word,
        g,
      });
      pen += (g[0] + hashSigned(seed + 5, k) * TRACK_JITTER) * size;
    });
    word += 1;
  });
  return out;
};

/** Compile a label into timed glyph marks spread over its [from, to] window. */
export const labelMarks = (label: LabelSpec): readonly GlyphMark[] => {
  const seed = seedOf(label.id);
  const face = faceOf(label);
  const placed = placeGlyphs(label, metricsOf(face), seed);
  const total = placed.reduce((a, p) => a + p.cost, 0) || 1;
  const from = Math.min(label.from, label.to);
  const span = Math.max(label.from, label.to) - from;
  let acc = 0;
  return placed.flatMap((p, i) => {
    const start = from + (acc / total) * span;
    acc += p.cost;
    if (p.ch === ' ') return [];
    const {pen, brush} = penPath(p.g, p.size);
    return [
      {
        kind: 'glyph' as const,
        strokeId: label.id,
        ink: label.ink,
        seed: seed + i * 7,
        char: p.ch,
        face,
        x: p.x,
        y: p.y,
        size: p.size,
        rotate: p.rot,
        deposit: (label.pressure ?? 1) * (0.9 + hash01(seed + 6, i) * 0.2),
        pen: timePen(pen),
        brush,
        start,
        end: from + (acc / total) * span,
        word: p.word,
        order: i,
      },
    ];
  });
};
