// pencilState.ts — the one source of truth for where the pencil is. Hands, the cup and foley follow this.
import {clamp, easeInOut} from './geometry/noise';
import {compileSketch, markProgress} from './marks/compile';
import {markEnd, markStart, markTip} from './marks/sample';
import type {Mark} from './marks/types';
import type {Ink, SketchSpec} from './types';

export type PencilState = {
  /** Tip position in sketch px (SKETCH_SIZE space). */
  x: number;
  y: number;
  /** Direction of travel, radians (0 = moving right, +PI/2 = moving down the page). */
  angle: number;
  /** 0 when lifted, ~0.3-1.4 while drawing. */
  pressure: number;
  /** True while the tip is on the paper laying down a line or a letter. */
  drawing: boolean;
  /** Height of the tip above the paper, 0 (touching) to 1 (well clear, travelling or resting). */
  lift: number;
  /** The ink of the current (or last) movement, and its stroke/label id; null before anything is drawn. */
  ink: Ink | null;
  strokeId: string | null;
  /** 0-1: how far through the page's drawing we are. */
  progress: number;
  /** True once the last mark has finished. */
  done: boolean;
};

/** How high the tip rises when travelling between movements, relative to distance (px for a full lift). */
const LIFT_DISTANCE = 90;
const MIN_TRAVEL_LIFT = 0.18;

const lastIndexStarted = (marks: readonly Mark[], u: number): number => {
  let lo = 0;
  let hi = marks.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if ((marks[mid] as Mark).start <= u) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found;
};

const restingState = (m: Mark, u: number, before: boolean, done: boolean): PencilState => {
  const at = before ? markStart(m) : markEnd(m);
  const tip = markTip(m, before ? 0 : 1);
  return {...at, angle: tip.angle, pressure: 0, drawing: false, lift: 1, ink: before ? null : m.ink, strokeId: before ? null : m.strokeId, progress: clamp(u, 0, 1), done};
};

const travelState = (prev: Mark, next: Mark, u: number): PencilState => {
  const a = markEnd(prev);
  const b = markStart(next);
  const span = next.start - prev.end;
  const k = span > 0 ? clamp((u - prev.end) / span, 0, 1) : 1;
  const e = easeInOut(k);
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const height = Math.max(MIN_TRAVEL_LIFT, Math.min(1, dist / LIFT_DISTANCE));
  return {
    x: a.x + (b.x - a.x) * e,
    y: a.y + (b.y - a.y) * e,
    angle: dist > 0.5 ? Math.atan2(b.y - a.y, b.x - a.x) : markTip(prev, 1).angle,
    pressure: 0,
    drawing: false,
    lift: Math.sin(Math.PI * k) * height,
    ink: prev.ink,
    strokeId: prev.strokeId,
    progress: clamp(u, 0, 1),
    done: false,
  };
};

/** Pure: the pencil at `frame` (page-local) for a page drawn over `drawFrames`. */
export const getPencilState = (spec: SketchSpec, frame: number, drawFrames: number): PencilState => {
  const marks = compileSketch(spec);
  const u = drawFrames > 0 ? frame / drawFrames : 1;
  const first = marks[0];
  if (!first) return {x: 0, y: 0, angle: 0, pressure: 0, drawing: false, lift: 1, ink: null, strokeId: null, progress: 1, done: true};
  const idx = lastIndexStarted(marks, u);
  if (idx < 0) return restingState(first, u, true, false);
  // The active movement: the most recently started mark that is still running.
  const active = marks.slice(0, idx + 1).reverse().find((m) => u < m.end);
  if (active) {
    const tip = markTip(active, markProgress(active, u));
    return {...tip, drawing: true, lift: 0, ink: active.ink, strokeId: active.strokeId, progress: clamp(u, 0, 1), done: false};
  }
  const prev = marks.slice(0, idx + 1).reduce((a, m) => (m.end > a.end ? m : a));
  const next = marks[idx + 1];
  return next ? travelState(prev, next, u) : restingState(prev, u, false, true);
};
