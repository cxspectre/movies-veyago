// fills.ts — geometry for hatching (parallel flicks clipped to a closed region) and scribbles (loops along a path).
import {hashSigned, wobble} from '../geometry/noise';
import {type Polyline, type Pt, resample, tangentAt} from '../geometry/path';

export const DEFAULT_HATCH_ANGLE = -55;
export const DEFAULT_HATCH_GAP = 6;
export const DEFAULT_SCRIBBLE_SIZE = 7;

const HATCH_GAP_JITTER = 0.18;
const HATCH_ANGLE_JITTER = 0.035; // radians
const MIN_HATCH = 2.5;

type Edge = {a: Pt; b: Pt};

const edgesOf = (polys: readonly Polyline[]): readonly Edge[] =>
  polys.flatMap((poly) => {
    const pts = poly.pts;
    const closing = pts.length > 2 ? [{a: pts[pts.length - 1] as Pt, b: pts[0] as Pt}] : [];
    return [...pts.slice(1).map((b, i) => ({a: pts[i] as Pt, b})), ...closing];
  });

const crossings = (edges: readonly Edge[], n: Pt, d: Pt, c: number): readonly number[] =>
  edges
    .flatMap(({a, b}) => {
      const ca = a.x * n.x + a.y * n.y;
      const cb = b.x * n.x + b.y * n.y;
      if ((ca - c) * (cb - c) >= 0 || ca === cb) return [];
      const t = (c - ca) / (cb - ca);
      const px = a.x + (b.x - a.x) * t;
      const py = a.y + (b.y - a.y) * t;
      return [px * d.x + py * d.y];
    })
    .sort((p, q) => p - q);

/** Parallel hatch flicks filling the closed region(s), alternating direction like a quick hand. */
export const hatchLines = (polys: readonly Polyline[], angleDeg: number, gap: number, seed: number): readonly Polyline[] => {
  const a = (angleDeg * Math.PI) / 180;
  const d = {x: Math.cos(a), y: Math.sin(a)};
  const n = {x: -d.y, y: d.x};
  const edges = edgesOf(polys);
  const cs = polys.flatMap((p) => p.pts.map((pt) => pt.x * n.x + pt.y * n.y));
  if (cs.length === 0) return [];
  const lo = Math.min(...cs);
  const hi = Math.max(...cs);
  const count = Math.max(1, Math.floor((hi - lo) / gap));
  return Array.from({length: count}, (_, i) => lo + (i + 0.5) * gap + hashSigned(seed, i) * gap * HATCH_GAP_JITTER)
    .flatMap((c, i) => {
      const xs = crossings(edges, n, d, c);
      return Array.from({length: Math.floor(xs.length / 2)}, (_, k) => {
        const u0 = (xs[k * 2] as number) + 1 + hashSigned(seed + 7, i * 8 + k) * 1.8;
        const u1 = (xs[k * 2 + 1] as number) - 1 + hashSigned(seed + 9, i * 8 + k) * 2.2;
        return {u0, u1, c, i, k};
      });
    })
    .filter((h) => h.u1 - h.u0 > MIN_HATCH)
    .map((h, idx) => {
      const tilt = hashSigned(seed + 11, idx) * HATCH_ANGLE_JITTER;
      const mid = (h.u0 + h.u1) / 2;
      const half = (h.u1 - h.u0) / 2;
      const end = (sign: number): Pt => ({
        x: n.x * (h.c + sign * half * tilt) + d.x * (mid + sign * half),
        y: n.y * (h.c + sign * half * tilt) + d.y * (mid + sign * half),
      });
      const [p0, p1] = idx % 2 === 0 ? [end(-1), end(1)] : [end(1), end(-1)];
      return resample([p0, p1]);
    });
};

const pointAtS = (poly: Polyline, s: number): {pt: Pt; i: number} => {
  const step = poly.length / Math.max(1, poly.pts.length - 1);
  const i = Math.min(poly.pts.length - 1, Math.max(0, Math.round(s / (step || 1))));
  return {pt: poly.pts[i] as Pt, i};
};

/** A loopy scribble travelling along each polyline (the hand filling or scrubbing out along a path). */
export const scribbleAlong = (poly: Polyline, size: number, seed: number): Polyline => {
  const pitch = size * 1.3;
  const steps = Math.max(8, Math.ceil(poly.length / 0.6));
  let phase = 0;
  const pts = Array.from({length: steps + 1}, (_, k) => {
    const s = (k / steps) * poly.length;
    const {pt, i} = pointAtS(poly, s);
    const tan = tangentAt(poly.pts, i);
    // The loops speed up, slow down, swell and lean as the hand scrubs along.
    phase += ((2 * Math.PI * (poly.length / steps)) / pitch) * (1 + 0.45 * wobble(seed + 5, s / 22));
    const amp = size * (0.8 + 0.35 * wobble(seed, s / 26));
    const along = amp * (0.5 + 0.25 * wobble(seed + 9, s / 40)) * Math.cos(phase) + amp * 0.35 * Math.sin(phase);
    const across = amp * Math.sin(phase) + size * 0.25 * wobble(seed + 13, s / 70);
    return {x: pt.x + tan.x * along - tan.y * across, y: pt.y + tan.y * along + tan.x * across};
  });
  return resample(pts);
};
