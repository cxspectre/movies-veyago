// bubble.ts — a speech bubble drawn the way a hand draws one: one loop round a rounded box, the tail pulled out
// on the way past it, the loop running a little past where it started.
import {handPath, type XY} from '../../paper';

export type BubbleBox = {readonly x0: number; readonly y0: number; readonly x1: number; readonly y1: number};

export type BubbleOptions = {
  readonly radius: number;
  /** How far the tail reaches out of the box, px. */
  readonly tail: number;
  /** Half the width of the tail where it leaves the box, px. */
  readonly tailHalfBase: number;
  /** The point the tail leans toward (the centre of the page). */
  readonly toward: XY;
  readonly seed: number;
};

const PERIMETER_STEP = 22;
const CORNER_SAMPLES = 4;
const CLOSING_OVERSHOOT = 3;
const TAIL_SIDE = 0.7;

/** The rounded box as points, clockwise from the start of the top edge. */
const roundedBox = ({x0, y0, x1, y1}: BubbleBox, r: number): readonly XY[] => {
  const edge = (a: XY, b: XY): readonly XY[] => {
    const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / PERIMETER_STEP));
    return Array.from({length: n}, (_, i): XY => [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
  };
  const corner = (cx: number, cy: number, from: number): readonly XY[] =>
    Array.from({length: CORNER_SAMPLES}, (_, i): XY => {
      const a = ((from + (90 * i) / CORNER_SAMPLES) * Math.PI) / 180;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    });
  return [
    ...edge([x0 + r, y0], [x1 - r, y0]),
    ...corner(x1 - r, y0 + r, -90),
    ...edge([x1, y0 + r], [x1, y1 - r]),
    ...corner(x1 - r, y1 - r, 0),
    ...edge([x1 - r, y1], [x0 + r, y1]),
    ...corner(x0 + r, y1 - r, 90),
    ...edge([x0, y1 - r], [x0, y0 + r]),
    ...corner(x0 + r, y0 + r, 180),
  ];
};

/** Where the tail leaves the box: on the straight part of the edge the page centre lies beyond. */
const tailBase = (box: BubbleBox, o: BubbleOptions): {base: XY; normal: XY} => {
  const cx = (box.x0 + box.x1) / 2;
  const cy = (box.y0 + box.y1) / 2;
  const dx = o.toward[0] - cx;
  const dy = o.toward[1] - cy;
  const hw = (box.x1 - box.x0) / 2;
  const hh = (box.y1 - box.y0) / 2;
  const margin = o.radius + o.tailHalfBase;
  const clampX = (x: number): number => Math.min(box.x1 - margin, Math.max(box.x0 + margin, x));
  const clampY = (y: number): number => Math.min(box.y1 - margin, Math.max(box.y0 + margin, y));
  if (Math.abs(dx) * hh > Math.abs(dy) * hw) {
    const side = Math.sign(dx);
    // short side edges: the tail leaves from the middle, so it never crowds a corner
    return {base: [side > 0 ? box.x1 : box.x0, clampY(cy)], normal: [side, 0]};
  }
  const side = Math.sign(dy);
  return {base: [clampX(cx + (dx * hh) / Math.abs(dy)), side > 0 ? box.y1 : box.y0], normal: [0, side]};
};

/** The tail tip: out along the edge normal, leaning toward the page centre. */
const tailTip = (base: XY, normal: XY, o: BubbleOptions): XY => {
  const lx = o.toward[0] - base[0];
  const ly = o.toward[1] - base[1];
  const l = Math.hypot(lx, ly) || 1;
  const dx = normal[0] * 0.55 + (lx / l) * 0.45;
  const dy = normal[1] * 0.55 + (ly / l) * 0.45;
  const k = o.tail / (Math.hypot(dx, dy) || 1);
  return [base[0] + dx * k, base[1] + dy * k];
};

/** One loop with the tail. Returns the path and the tail tip (ticks sit beside it). */
export const bubblePath = (box: BubbleBox, o: BubbleOptions): {d: string; tip: XY} => {
  const ring = roundedBox(box, o.radius);
  const {base, normal} = tailBase(box, o);
  const tip = tailTip(base, normal, o);
  const along: XY = [-normal[1], normal[0]];
  const distance = (p: XY, q: XY): number => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const nearest = ring.reduce((best, p, i) => (distance(p, base) < distance(ring[best] as XY, base) ? i : best), 0);
  const remaining = ring.map((p, i) => ({p, i})).filter(({p}) => distance(p, base) > o.tailHalfBase + 4);
  const after = remaining.findIndex(({i}) => i > nearest);
  const index = after < 0 ? remaining.length : after;
  const prev = (remaining[index - 1] ?? remaining[remaining.length - 1])?.p ?? base;
  const a: XY = [base[0] - along[0] * o.tailHalfBase, base[1] - along[1] * o.tailHalfBase];
  const b: XY = [base[0] + along[0] * o.tailHalfBase, base[1] + along[1] * o.tailHalfBase];
  const [first, second] = distance(a, prev) < distance(b, prev) ? [a, b] : [b, a];
  const points = remaining.map(({p}) => p);
  // points part-way down each side keep the tail a crisp wedge under the path's smoothing
  const side = (p: XY): XY => [p[0] + (tip[0] - p[0]) * TAIL_SIDE, p[1] + (tip[1] - p[1]) * TAIL_SIDE];
  const loop: readonly XY[] = [...points.slice(0, index), first, side(first), tip, side(second), second, ...points.slice(index)];
  const start = loop[0] as XY;
  const closing: XY = [start[0] + PERIMETER_STEP * 0.9, start[1] + CLOSING_OVERSHOOT];
  return {d: handPath([...loop, start, closing], o.seed, {wobble: 0.9, smooth: 0.9}), tip};
};
