// lineMarks.ts — the visible part of the unbroken line as engine marks, in canvas-local logical px, rebuilt per frame.
// The pencil physics are the v1 engine's: pressure and width factors come from `shapeMark` (via the geometry), strands,
// halo and the fresh lead at the tip from `depositMarks`. What is new is only the sampling: the line is resampled to
// ~1.5 SCREEN px at the current zoom, so a 41 000 px line costs ~1 500 points at the far view and the same at 5x.
import type {Mark, MarkPoint, PathMark} from '../paper/marks/types';
import {seedOf} from '../paper/geometry/noise';
import {LINE_WIDTH} from '../sheet4';
import {type Camera} from './camera';
import type {LineInk} from './inks';
import {arcAt, type LineGeometry, pointAtArc, timeAtArc} from './lineGeometry';

export type Box = {readonly x: number; readonly y: number; readonly w: number; readonly h: number};

/** One canvas per layer: graphite and accent share one (the engine has a channel for each), sepia has its own. */
export type LineLayer = {readonly kind: 'pencil' | 'sepia'; readonly marks: readonly Mark[]};
export type LineMarkResult = {
  readonly layers: readonly LineLayer[];
  /** Screen-px box that holds every mark (clipped to the canvas), or null when nothing is visible. */
  readonly box: Box | null;
  /** Page progress to hand the canvas: marks are complete at any u >= HEAD_PROGRESS, the head mark is at exactly this. */
  readonly progress: number;
  readonly head: {readonly x: number; readonly y: number} | null;
};

/** Target spacing of the samples on screen. */
const SCREEN_STEP = 1.5;
/** Pieces start on a multiple of this many samples so the pencil's strand wobble keeps its place as the camera moves. */
const ALIGN = 64;
/** Half-length, in screen px, of the crossfade where one voice's ink takes over from another (40 px in all). */
const INK_FADE_HALF = 20;
const CHUNK = 256;
const PAD = 48;
/** The head mark is drawn up to this fraction of its own timeline; every finished mark ends before it. */
export const HEAD_PROGRESS = 0.5;
const DONE_END = HEAD_PROGRESS / 2;

type Chunks = {readonly x0: Float32Array; readonly y0: Float32Array; readonly x1: Float32Array; readonly y1: Float32Array};
const chunkCache = new WeakMap<LineGeometry, Chunks>();

const chunksOf = (g: LineGeometry): Chunks => {
  const hit = chunkCache.get(g);
  if (hit) return hit;
  const n = Math.ceil(g.s.length / CHUNK);
  const c: Chunks = {x0: new Float32Array(n), y0: new Float32Array(n), x1: new Float32Array(n), y1: new Float32Array(n)};
  for (let k = 0; k < n; k++) {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (let i = k * CHUNK; i <= Math.min(g.s.length - 1, (k + 1) * CHUNK); i++) {
      x0 = Math.min(x0, g.x[i] as number);
      x1 = Math.max(x1, g.x[i] as number);
      y0 = Math.min(y0, g.y[i] as number);
      y1 = Math.max(y1, g.y[i] as number);
    }
    c.x0[k] = x0;
    c.y0[k] = y0;
    c.x1[k] = x1;
    c.y1[k] = y1;
  }
  chunkCache.set(g, c);
  return c;
};

/** Arc-length ranges [a0, a1] of the line that are inside the (padded) viewport and already drawn. */
const visibleRanges = (g: LineGeometry, view: {x0: number; y0: number; x1: number; y1: number}, head: number): readonly [number, number][] => {
  const c = chunksOf(g);
  const out: [number, number][] = [];
  for (let k = 0; k < c.x0.length; k++) {
    const a0 = k * CHUNK * (g.s[1] as number);
    if (a0 > head) break;
    const hit = (c.x1[k] as number) >= view.x0 && (c.x0[k] as number) <= view.x1 && (c.y1[k] as number) >= view.y0 && (c.y0[k] as number) <= view.y1;
    if (!hit) continue;
    const a1 = Math.min(head, (k + 1) * CHUNK * (g.s[1] as number));
    const last = out[out.length - 1];
    if (last && a0 <= last[1] + 1e-6) last[1] = a1;
    else out.push([a0, a1]);
  }
  return out;
};

type Sample = {arc: number; sx: number; sy: number; p: number; wf: number; ink: LineInk};

const sampleRange = (g: LineGeometry, camera: Camera, width: number, height: number, range: readonly [number, number], ds: number, head: number, inkAt: (t: number) => LineInk): Sample[] => {
  const k0 = Math.floor(Math.ceil(range[0] / ds) / ALIGN) * ALIGN;
  const k1 = Math.floor(range[1] / ds);
  const arcs: number[] = [];
  for (let k = Math.max(0, k0); k <= k1; k++) arcs.push(k * ds);
  if (Math.abs(range[1] - head) < 1e-6 && (arcs[arcs.length - 1] ?? -1) < head - 1e-4) arcs.push(head);
  return arcs.map((arc) => {
    const q = pointAtArc(g, arc);
    return {
      arc,
      sx: width / 2 + (q.x - camera.centre[0]) * camera.zoom,
      sy: height / 2 + (q.y - camera.centre[1]) * camera.zoom,
      p: q.p,
      wf: q.wf,
      ink: inkAt(timeAtArc(g, arc)),
    };
  });
};

type Run = {ink: LineInk; i0: number; i1: number};
const inkRuns = (samples: readonly Sample[]): Run[] =>
  samples.reduce<Run[]>((runs, s, i) => {
    const last = runs[runs.length - 1];
    if (last && last.ink === s.ink) last.i1 = i;
    else runs.push({ink: s.ink, i0: i, i1: i});
    return runs;
  }, []);

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

export type LineMarkOptions = {
  readonly geometry: LineGeometry;
  readonly camera: Camera;
  readonly width: number;
  readonly height: number;
  readonly masterSeconds: number;
  readonly lineWidth: number;
  readonly toothZoom: number;
  readonly inkAt: (master: number) => LineInk;
};

/** Everything the canvas needs to draw the line at this instant. Pure. */
export const buildLineMarks = (o: LineMarkOptions): LineMarkResult => {
  const {geometry: g, camera, width, height, toothZoom: tz} = o;
  const head = arcAt(g, o.masterSeconds);
  const drawn = head > 0 ? head : o.masterSeconds >= 0.5 ? 1 : 0;
  if (drawn <= 0) return {layers: [], box: null, progress: HEAD_PROGRESS, head: null};
  const ds = SCREEN_STEP / camera.zoom;
  const pad = PAD / camera.zoom;
  const view = {
    x0: camera.centre[0] - width / 2 / camera.zoom - pad,
    x1: camera.centre[0] + width / 2 / camera.zoom + pad,
    y0: camera.centre[1] - height / 2 / camera.zoom - pad,
    y1: camera.centre[1] + height / 2 / camera.zoom + pad,
  };
  const pieces = visibleRanges(g, view, drawn).map((r) => sampleRange(g, camera, width, height, r, ds, drawn, o.inkAt)).filter((s) => s.length > 1);
  if (pieces.length === 0) return {layers: [], box: null, progress: HEAD_PROGRESS, head: null};

  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const piece of pieces) {
    for (const s of piece) {
      x0 = Math.min(x0, s.sx);
      x1 = Math.max(x1, s.sx);
      y0 = Math.min(y0, s.sy);
      y1 = Math.max(y1, s.sy);
    }
  }
  const margin = o.lineWidth * 3 + 4;
  const bx = Math.max(0, Math.floor(x0 - margin));
  const by = Math.max(0, Math.floor(y0 - margin));
  const box: Box = {x: bx, y: by, w: Math.max(1, Math.min(width, Math.ceil(x1 + margin)) - bx), h: Math.max(1, Math.min(height, Math.ceil(y1 + margin)) - by)};

  const fadeSamples = Math.max(2, Math.round(INK_FADE_HALF / SCREEN_STEP));
  const byLayer = new Map<LineLayer['kind'], Mark[]>();
  let order = 0;
  pieces.forEach((piece) => {
    const runs = inkRuns(piece);
    runs.forEach((run, ri) => {
      const hasPrev = ri > 0;
      const hasNext = ri < runs.length - 1;
      const a = Math.max(0, run.i0 - (hasPrev ? fadeSamples : 0));
      const b = Math.min(piece.length - 1, run.i1 + (hasNext ? fadeSamples : 0));
      const isHead = ri === runs.length - 1 && Math.abs((piece[piece.length - 1] as Sample).arc - drawn) < 1e-3;
      const count = b - a + 1;
      if (count < 2) return;
      const pts: MarkPoint[] = [];
      for (let i = a; i <= b; i++) {
        const s = piece[i] as Sample;
        const up = hasPrev ? clamp01((i - (run.i0 - fadeSamples)) / (2 * fadeSamples)) : 1;
        const down = hasNext ? clamp01((run.i1 + fadeSamples - i) / (2 * fadeSamples)) : 1;
        const weight = Math.min(up, down);
        const wScreen = Math.max(LINE_WIDTH.minimum, o.lineWidth * s.wf);
        pts.push({
          x: (s.sx - box.x) / tz,
          y: (s.sy - box.y) / tz,
          w: wScreen / tz,
          p: s.p * weight,
          t: (isHead ? HEAD_PROGRESS : DONE_END * 2) * ((i - a) / (count - 1)),
        });
      }
      const mark: PathMark = {
        kind: 'path',
        strokeId: `line-${(piece[0] as Sample).arc.toFixed(0)}-${run.ink}`,
        ink: run.ink === 'accent' ? 'accent' : 'graphite',
        role: 'clean',
        seed: seedOf(`line-${Math.round((piece[a] as Sample).arc / ds / ALIGN)}-${run.ink}`),
        pts,
        length: count * SCREEN_STEP,
        strands: 3,
        deposit: 1,
        start: 0,
        end: isHead ? 1 : DONE_END,
        order: order++,
      };
      const kind = run.ink === 'sepia' ? 'sepia' : 'pencil';
      byLayer.set(kind, [...(byLayer.get(kind) ?? []), mark]);
    });
  });
  const lastPiece = pieces[pieces.length - 1] as Sample[];
  const tip = lastPiece[lastPiece.length - 1] as Sample;
  return {
    layers: [...byLayer.entries()].map(([kind, marks]) => ({kind, marks})),
    box,
    progress: HEAD_PROGRESS,
    head: {x: tip.sx, y: tip.sy},
  };
};
