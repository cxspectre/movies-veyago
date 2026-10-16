// path.ts — SVG path data -> evenly resampled polylines (one per subpath), pure and cached.
import {parsePath, reduceInstructions} from '@remotion/paths';

export type Pt = {readonly x: number; readonly y: number};
/** A polyline resampled at an even step; `s` is the arc length at each point. */
export type Polyline = {readonly pts: readonly Pt[]; readonly s: readonly number[]; readonly length: number; readonly closed: boolean};

/** Resample step in sketch px. Small enough for smooth pressure; large enough to stay fast. */
export const SAMPLE_STEP = 1.5;
const CURVE_FLATTEN_PX = 1.5;

const cubicAt = (p0: number, p1: number, p2: number, p3: number, t: number): number => {
  const m = 1 - t;
  return m * m * m * p0 + 3 * m * m * t * p1 + 3 * m * t * t * p2 + t * t * t * p3;
};

type Raw = {pts: Pt[]; closed: boolean};

const flattenRaw = (d: string): readonly Raw[] => {
  const instructions = reduceInstructions(parsePath(d));
  const out: Raw[] = [];
  let current: Raw | null = null;
  let cursor: Pt = {x: 0, y: 0};
  for (const ins of instructions) {
    if (ins.type === 'M') {
      current = {pts: [{x: ins.x, y: ins.y}], closed: false};
      out.push(current);
      cursor = {x: ins.x, y: ins.y};
    } else if (ins.type === 'L') {
      current?.pts.push({x: ins.x, y: ins.y});
      cursor = {x: ins.x, y: ins.y};
    } else if (ins.type === 'C') {
      const chord = Math.hypot(ins.x - cursor.x, ins.y - cursor.y);
      const ctrl =
        Math.hypot(ins.cp1x - cursor.x, ins.cp1y - cursor.y) +
        Math.hypot(ins.cp2x - ins.cp1x, ins.cp2y - ins.cp1y) +
        Math.hypot(ins.x - ins.cp2x, ins.y - ins.cp2y);
      const n = Math.max(2, Math.ceil((chord + ctrl) / 2 / CURVE_FLATTEN_PX));
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        current?.pts.push({
          x: cubicAt(cursor.x, ins.cp1x, ins.cp2x, ins.x, t),
          y: cubicAt(cursor.y, ins.cp1y, ins.cp2y, ins.y, t),
        });
      }
      cursor = {x: ins.x, y: ins.y};
    } else if (ins.type === 'Z' && current) {
      const first = current.pts[0];
      if (first) {
        current.pts.push(first);
        cursor = first;
      }
      current.closed = true;
    }
  }
  return out.filter((r) => r.pts.length > 1);
};

/** Resample a raw point list at an even arc-length step. */
export const resample = (raw: readonly Pt[], step: number = SAMPLE_STEP, closed = false): Polyline => {
  const cum = raw.reduce<number[]>((acc, p, i) => {
    const prev = raw[i - 1];
    acc.push(i === 0 || !prev ? 0 : (acc[i - 1] as number) + Math.hypot(p.x - prev.x, p.y - prev.y));
    return acc;
  }, []);
  const length = cum[cum.length - 1] ?? 0;
  const n = Math.max(1, Math.round(length / step));
  const pts: Pt[] = [];
  const s: number[] = [];
  let j = 0;
  for (let k = 0; k <= n; k++) {
    const target = (k / n) * length;
    while (j < cum.length - 2 && (cum[j + 1] as number) < target) j++;
    const a = raw[j] as Pt;
    const b = (raw[j + 1] ?? a) as Pt;
    const seg = (cum[j + 1] ?? 0) - (cum[j] ?? 0);
    const t = seg > 0 ? (target - (cum[j] as number)) / seg : 0;
    pts.push({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
    s.push(target);
  }
  return {pts, s, length, closed};
};

const cache = new Map<string, readonly Polyline[]>();

/** Flatten an SVG path into one even polyline per subpath (each M starts a new pencil movement). Cached by `d`. */
export const flattenPath = (d: string): readonly Polyline[] => {
  const hit = cache.get(d);
  if (hit) return hit;
  try {
    const result = flattenRaw(d).map((r) => resample(r.pts, SAMPLE_STEP, r.closed));
    cache.set(d, result);
    return result;
  } catch (error) {
    throw new Error(`Paper engine could not read path data "${d.slice(0, 60)}": ${String(error)}`);
  }
};

/** Total drawn length of a path (sum of its subpaths), in sketch px. */
export const pathLength = (d: string): number => flattenPath(d).reduce((a, p) => a + p.length, 0);

/** Unit tangent at point i of a polyline (central difference). */
export const tangentAt = (pts: readonly Pt[], i: number): Pt => {
  const a = pts[Math.max(0, i - 1)] as Pt;
  const b = pts[Math.min(pts.length - 1, i + 1)] as Pt;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return {x: dx / len, y: dy / len};
};

/** Turning rate (radians per px) at point i, measured over a few samples so it ignores tiny jitter. */
export const curvatureAt = (pts: readonly Pt[], i: number, reach = 3): number => {
  const a = pts[Math.max(0, i - reach)] as Pt;
  const b = pts[i] as Pt;
  const c = pts[Math.min(pts.length - 1, i + reach)] as Pt;
  const a1 = Math.atan2(b.y - a.y, b.x - a.x);
  const a2 = Math.atan2(c.y - b.y, c.x - b.x);
  let da = a2 - a1;
  while (da > Math.PI) da -= Math.PI * 2;
  while (da < -Math.PI) da += Math.PI * 2;
  const span = Math.hypot(b.x - a.x, b.y - a.y) + Math.hypot(c.x - b.x, c.y - b.y);
  return span > 0 ? Math.abs(da) / span : 0;
};
