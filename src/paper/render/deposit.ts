// deposit.ts — lays every visible mark down as "deposit" into an opaque-black canvas with additive blending:
// graphite accumulates in the red channel, the accent pencil in green. develop.ts turns it into pixels.
import {SAMPLE_STEP} from '../geometry/path';
import {hash01, wobble} from '../geometry/noise';
import {markProgress} from '../marks/compile';
import {indexAtTime, tipAt} from '../marks/sample';
import type {GlyphMark, Mark, MarkPoint, PathMark} from '../marks/types';
import {metricsOf} from '../text/handLayout';
import type {Ink} from '../types';
import {DEPOSIT_UNIT} from './inkLook';

export type DepositTarget = {
  readonly ctx: CanvasRenderingContext2D;
  readonly scratch: CanvasRenderingContext2D;
  readonly density: number;
};

type Strand = {amp: number; bias: number; width: number; deposit: number; freq: number};

/** The strands one movement lays down: the main line plus fainter neighbours that drift in and out. */
const STRANDS: readonly Strand[] = [
  {amp: 0.12, bias: 0, width: 0.85, deposit: 0.85, freq: 60},
  // A wide faint halo: the soft shoulder of graphite either side of where the lead bit hardest.
  {amp: 0.1, bias: 0, width: 1.28, deposit: 0.09, freq: 80},
  {amp: 0.5, bias: 0.28, width: 0.5, deposit: 0.4, freq: 38},
  {amp: 0.65, bias: -0.32, width: 0.42, deposit: 0.28, freq: 27},
];
const CHUNK = 4;
const TIP_LEAD = 0.55;
const DOT_SPACING_MIN = 7.5;
const DOT_SPACING_PER_WIDTH = 4.4;

const channel = (ink: Ink, alpha: number): string => {
  const a = Math.max(0, Math.min(1, alpha)).toFixed(4);
  return ink === 'graphite' ? `rgba(255,0,0,${a})` : `rgba(0,255,0,${a})`;
};

const unitAlpha = (deposit: number): number => (deposit * DEPOSIT_UNIT) / 255;

const visiblePoints = (m: PathMark, local: number): readonly MarkPoint[] => {
  if (local >= 1) return m.pts;
  const i = indexAtTime(m.pts, local);
  return [...m.pts.slice(0, i + 1), tipAt(m.pts, local).pt];
};

const offsetPoint = (pts: readonly MarkPoint[], i: number, off: number): {x: number; y: number} => {
  const a = pts[Math.max(0, i - 1)] as MarkPoint;
  const b = pts[Math.min(pts.length - 1, i + 1)] as MarkPoint;
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const p = pts[i] as MarkPoint;
  return {x: p.x - ((b.y - a.y) / len) * off, y: p.y + ((b.x - a.x) / len) * off};
};

const drawStrand = (t: DepositTarget, m: PathMark, pts: readonly MarkPoint[], strand: Strand, k: number): void => {
  const {ctx, density} = t;
  const seed = m.seed + k * 977;
  const offsets = pts.map((p, i) => p.w * (strand.bias + strand.amp * wobble(seed, (i * SAMPLE_STEP) / strand.freq)));
  for (let a = 0; a < pts.length - 1; a += CHUNK) {
    const b = Math.min(pts.length - 1, a + CHUNK);
    let w = 0;
    let p = 0;
    for (let i = a; i <= b; i++) {
      w += (pts[i] as MarkPoint).w;
      p += (pts[i] as MarkPoint).p;
    }
    const n = b - a + 1;
    ctx.lineWidth = Math.max(0.35, (w / n) * strand.width * density);
    ctx.strokeStyle = channel(m.ink, unitAlpha((p / n) * strand.deposit * m.deposit));
    ctx.beginPath();
    for (let i = a; i <= b; i++) {
      const q = offsetPoint(pts, i, offsets[i] as number);
      if (i === a) ctx.moveTo(q.x * density, q.y * density);
      else ctx.lineTo(q.x * density, q.y * density);
    }
    ctx.stroke();
  }
};

const drawDots = (t: DepositTarget, m: PathMark, pts: readonly MarkPoint[]): void => {
  const {ctx, density} = t;
  const first = pts[0];
  if (!first) return;
  const every = Math.max(1, Math.round(Math.max(DOT_SPACING_MIN, first.w * DOT_SPACING_PER_WIDTH) / SAMPLE_STEP));
  ctx.lineCap = 'round';
  for (let i = 0; i < pts.length; i += every) {
    const p = pts[i] as MarkPoint;
    const q = pts[Math.min(pts.length - 1, i + 1)] as MarkPoint;
    const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const dash = Math.max(0.5, p.w * 0.45) * (0.6 + hash01(m.seed, i) * 0.8);
    ctx.lineWidth = p.w * 1.15 * density;
    ctx.strokeStyle = channel(m.ink, unitAlpha(p.p * m.deposit * (0.85 + hash01(m.seed + 1, i) * 0.35)));
    ctx.beginPath();
    ctx.moveTo(p.x * density, p.y * density);
    ctx.lineTo((p.x + ((q.x - p.x) / len) * dash) * density, (p.y + ((q.y - p.y) / len) * dash) * density);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
};

/** The fresh lead at the moving tip: a rounded, slightly heavier end where the point is pressing right now. */
const drawTip = (t: DepositTarget, m: PathMark, pts: readonly MarkPoint[]): void => {
  const tip = pts[pts.length - 1] as MarkPoint;
  const back = pts[Math.max(0, pts.length - 4)] as MarkPoint;
  const {ctx, density} = t;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(0.5, tip.w * 0.8 * density);
  ctx.strokeStyle = channel(m.ink, unitAlpha(tip.p * TIP_LEAD * m.deposit));
  ctx.beginPath();
  ctx.moveTo(back.x * density, back.y * density);
  ctx.lineTo(tip.x * density, tip.y * density);
  ctx.stroke();
  ctx.lineCap = 'butt';
};

const drawPathMark = (t: DepositTarget, m: PathMark, local: number): void => {
  const pts = visiblePoints(m, local);
  if (pts.length < 2) return;
  if (m.role === 'dotted') {
    drawDots(t, m, pts);
    return;
  }
  STRANDS.slice(0, m.strands + 1).forEach((s, k) => drawStrand(t, m, pts, s, k));
  if (local < 1) drawTip(t, m, pts);
};

const glyphFont = (g: GlyphMark, size: number): string => {
  const f = metricsOf(g.face);
  return `${f.weight} ${size.toFixed(2)}px "${f.family}"`;
};

const fillGlyph = (ctx: CanvasRenderingContext2D, g: GlyphMark, alpha: number): void => {
  ctx.font = glyphFont(g, g.size);
  ctx.fillStyle = channel(g.ink, alpha);
  ctx.fillText(g.char, 0, 0);
  // A second, fainter impression slightly off: the pencil never lands twice in the same place.
  ctx.fillStyle = channel(g.ink, alpha * 0.32);
  ctx.fillText(g.char, 0.35 + hash01(g.seed, 1) * 0.3, 0.25 - hash01(g.seed, 2) * 0.5);
};

const glyphBox = (g: GlyphMark): {x0: number; y0: number; x1: number; y1: number} => {
  const xs = g.pen.map((p) => p.x);
  const ys = g.pen.map((p) => p.y);
  const pad = g.brush + g.size * 0.15;
  return {x0: Math.min(...xs) - pad, y0: Math.min(...ys) - pad, x1: Math.max(...xs) + pad, y1: Math.max(...ys) + pad};
};

const drawGlyphMark = (t: DepositTarget, g: GlyphMark, local: number): void => {
  const {ctx, scratch, density} = t;
  const alpha = unitAlpha(g.deposit * 1.05);
  ctx.save();
  ctx.setTransform(density, 0, 0, density, 0, 0);
  ctx.translate(g.x, g.y);
  ctx.rotate(g.rotate);
  if (local >= 1) {
    fillGlyph(ctx, g, alpha);
    ctx.restore();
    return;
  }
  const box = glyphBox(g);
  const w = Math.ceil((box.x1 - box.x0) * density);
  const h = Math.ceil((box.y1 - box.y0) * density);
  if (scratch.canvas.width < w) scratch.canvas.width = w;
  if (scratch.canvas.height < h) scratch.canvas.height = h;
  scratch.setTransform(1, 0, 0, 1, 0, 0);
  scratch.globalCompositeOperation = 'source-over';
  scratch.clearRect(0, 0, scratch.canvas.width, scratch.canvas.height);
  scratch.setTransform(density, 0, 0, density, -box.x0 * density, -box.y0 * density);
  fillGlyph(scratch, g, alpha);
  scratch.globalCompositeOperation = 'destination-in';
  const i = indexAtTime(g.pen, local);
  const tip = tipAt(g.pen, local).pt;
  scratch.lineWidth = g.brush;
  scratch.lineCap = 'round';
  scratch.lineJoin = 'round';
  scratch.strokeStyle = '#fff';
  scratch.beginPath();
  g.pen.slice(0, i + 1).forEach((p, k) => (k === 0 ? scratch.moveTo(p.x, p.y) : scratch.lineTo(p.x, p.y)));
  scratch.lineTo(tip.x + 0.01, tip.y);
  scratch.stroke();
  ctx.drawImage(scratch.canvas, 0, 0, w, h, box.x0, box.y0, w / density, h / density);
  ctx.restore();
};

/** Clear the deposit canvas and lay down every mark visible at page progress u (0-1). */
export const depositMarks = (t: DepositTarget, marks: readonly Mark[], u: number): void => {
  const {ctx} = t;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';
  for (const m of marks) {
    if (m.start >= u) break;
    const local = markProgress(m, u);
    if (m.kind === 'path') drawPathMark(t, m, local);
    else drawGlyphMark(t, m, local);
  }
};
