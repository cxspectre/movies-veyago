// measure.ts — DM Sans metrics from the browser's own shaping (canvas measureText), so per-letter placement keeps the
// face's kerning and tracking exactly as a single run of text would. Fonts are loaded by FilmShell before any render.

export type TypeSpec = {readonly weight: number; readonly size: number; readonly trackingEm: number; readonly family?: string};

export type WordMetrics = {
  /** Pen x of each letter's origin, relative to the run's origin (kerning + tracking included). */
  readonly letterX: readonly number[];
  /** Ink bounds of the whole run, relative to its origin (x) and baseline (y, up = negative). */
  readonly inkLeft: number;
  readonly inkRight: number;
  readonly inkTop: number;
  readonly inkBottom: number;
};

const DEFAULT_FAMILY = 'DM Sans';

const context = (spec: TypeSpec): CanvasRenderingContext2D => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('title: no 2D canvas to measure type');
  ctx.font = `${spec.weight} ${spec.size}px "${spec.family ?? DEFAULT_FAMILY}"`;
  ctx.letterSpacing = `${spec.trackingEm * spec.size}px`;
  ctx.fontKerning = 'normal';
  return ctx;
};

const cache = new Map<string, WordMetrics>();

/**
 * Letter origins: letter i starts where the run up to and including it ends, minus its own advance. The difference
 * keeps the kerning pair (i-1, i) and i tracking steps.
 */
export const measureWord = (text: string, spec: TypeSpec): WordMetrics => {
  const key = `${text}|${spec.weight}|${spec.size}|${spec.trackingEm}|${spec.family ?? DEFAULT_FAMILY}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const ctx = context(spec);
  const chars = Array.from(text);
  const letterX = chars.map((c, i) => ctx.measureText(chars.slice(0, i + 1).join('')).width - ctx.measureText(c).width);
  const whole = ctx.measureText(text);
  const metrics: WordMetrics = {
    letterX,
    inkLeft: -whole.actualBoundingBoxLeft,
    inkRight: whole.actualBoundingBoxRight,
    inkTop: -whole.actualBoundingBoxAscent,
    inkBottom: whole.actualBoundingBoxDescent,
  };
  cache.set(key, metrics);
  return metrics;
};
