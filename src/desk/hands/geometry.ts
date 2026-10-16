// geometry.ts — pure vector helpers the hands are drawn with: smooth spines, tapered outlines, shade bands.
// Everything is in whatever px space the caller has already transformed its points into (screen space, so the
// lighting side of each finger is computed from the real on-screen direction).

export type Pt = {readonly x: number; readonly y: number};

export const pt = (x: number, y: number): Pt => ({x, y});
export const add = (a: Pt, b: Pt): Pt => ({x: a.x + b.x, y: a.y + b.y});
export const sub = (a: Pt, b: Pt): Pt => ({x: a.x - b.x, y: a.y - b.y});
export const mul = (a: Pt, k: number): Pt => ({x: a.x * k, y: a.y * k});
export const dot = (a: Pt, b: Pt): number => a.x * b.x + a.y * b.y;
export const len = (a: Pt): number => Math.hypot(a.x, a.y);
export const norm = (a: Pt): Pt => {
  const l = len(a);
  return l > 1e-9 ? {x: a.x / l, y: a.y / l} : {x: 1, y: 0};
};
/** Left-hand normal in a y-down screen space (rotates the tangent 90° counter-clockwise on screen). */
export const perp = (a: Pt): Pt => ({x: a.y, y: -a.x});
export const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
export const rotate = (a: Pt, rad: number): Pt => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return {x: a.x * c - a.y * s, y: a.x * s + a.y * c};
};
export const smooth01 = (t: number): number => {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};

const fmt = (n: number): string => n.toFixed(2);

/** A polyline (or polygon) as SVG path data. */
export const polyPath = (points: readonly Pt[], closed = false): string => {
  if (points.length === 0) return '';
  const body = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${fmt(p.x)} ${fmt(p.y)}`).join(' ');
  return closed ? `${body} Z` : body;
};

/** Catmull-Rom spline through the points, `per` samples per segment (end points included). */
export const catmullRom = (points: readonly Pt[], per = 12, closed = false): Pt[] => {
  const n = points.length;
  if (n < 2) return [...points];
  const at = (i: number): Pt => {
    if (closed) return points[((i % n) + n) % n] as Pt;
    return points[Math.min(n - 1, Math.max(0, i))] as Pt;
  };
  const out: Pt[] = [];
  const segments = closed ? n : n - 1;
  for (let s = 0; s < segments; s++) {
    const p0 = at(s - 1);
    const p1 = at(s);
    const p2 = at(s + 1);
    const p3 = at(s + 2);
    const last = s === segments - 1 && !closed;
    for (let k = 0; k < per + (last ? 1 : 0); k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  return out;
};

export type Ribbon = {
  /** Spine samples. */
  readonly spine: readonly Pt[];
  /** Unit normals (left of travel) per sample. */
  readonly normals: readonly Pt[];
  /** Full width per sample. */
  readonly widths: readonly number[];
  /** Arc-length fraction per sample, 0-1. */
  readonly u: readonly number[];
};

/** Tangent normals and arc-length fractions along a sampled spine. */
export const ribbonOf = (spine: readonly Pt[], widthAt: (u: number) => number): Ribbon => {
  const n = spine.length;
  const cum: number[] = [0];
  for (let i = 1; i < n; i++) cum.push((cum[i - 1] as number) + len(sub(spine[i] as Pt, spine[i - 1] as Pt)));
  const total = Math.max(1e-6, cum[n - 1] as number);
  const u = cum.map((c) => c / total);
  const normals = spine.map((_, i) => {
    const a = spine[Math.max(0, i - 1)] as Pt;
    const b = spine[Math.min(n - 1, i + 1)] as Pt;
    return perp(norm(sub(b, a)));
  });
  return {spine, normals, widths: u.map(widthAt), u};
};

/** Points around a rounded end: from the left edge over the tip to the right edge (half circle, `steps` points). */
export const roundEnd = (centre: Pt, normal: Pt, forward: Pt, r: number, steps = 10): Pt[] =>
  Array.from({length: steps + 1}, (_, k) => {
    const a = (k / steps) * Math.PI;
    return add(centre, add(mul(normal, r * Math.cos(a)), mul(forward, r * Math.sin(a))));
  });

export type Outline = {
  readonly left: readonly Pt[];
  readonly right: readonly Pt[];
  readonly tip: readonly Pt[];
  /** Closed path: left edge, round tip, right edge back, straight across the base. */
  readonly closed: string;
  /** Open path: the same without the base edge (for pieces drawn over something they hold). */
  readonly open: string;
};

/** The outline of a tapered ribbon with a round tip. */
export const outlineOf = (rib: Ribbon, tipRoundness = 1): Outline => {
  const n = rib.spine.length;
  const left = rib.spine.map((p, i) => add(p, mul(rib.normals[i] as Pt, (rib.widths[i] as number) / 2)));
  const right = rib.spine.map((p, i) => sub(p, mul(rib.normals[i] as Pt, (rib.widths[i] as number) / 2)));
  const last = rib.spine[n - 1] as Pt;
  const prev = rib.spine[Math.max(0, n - 2)] as Pt;
  const forward = norm(sub(last, prev));
  const r = (rib.widths[n - 1] as number) / 2;
  const tipCentre = sub(last, mul(forward, r * (1 - tipRoundness)));
  const tip = roundEnd(tipCentre, rib.normals[n - 1] as Pt, forward, r).map((p) => (tipRoundness < 1 ? add(p, mul(forward, 0)) : p));
  const rightBack = [...right].reverse();
  const open = `${polyPath(left)} ${polyPath(tip).replace(/^M/, 'L')} ${polyPath(rightBack).replace(/^M/, 'L')}`;
  return {left, right, tip, closed: `${open} Z`, open};
};

export type BandOptions = {
  /** Fraction of the width the band takes at full exposure. */
  readonly depth: number;
  /** Softens the band's dependence on the light angle (1 = linear). */
  readonly gamma: number;
  /** Band fades in over this u range at the base (hidden under the palm anyway). */
  readonly from: number;
  /** Shade the round tip too (default). False for a ribbon whose far end is cut off (the forearm leaving the frame). */
  readonly tip?: boolean;
};

/** Distance from a point to a segment. */
export const distToSegment = (p: Pt, a: Pt, b: Pt): number => {
  const ab = sub(b, a);
  const l2 = dot(ab, ab);
  const t = l2 > 1e-9 ? Math.min(1, Math.max(0, dot(sub(p, a), ab) / l2)) : 0;
  return len(sub(p, add(a, mul(ab, t))));
};

/** Whether a point lies inside a ribbon (within half its width of the spine). */
export const insideRibbon = (p: Pt, rib: Ribbon, tolerance = 0): boolean => {
  const n = rib.spine.length;
  for (let i = 0; i < n - 1; i++) {
    const half = Math.max(rib.widths[i] as number, rib.widths[i + 1] as number) / 2 + tolerance;
    if (distToSegment(p, rib.spine[i] as Pt, rib.spine[i + 1] as Pt) <= half) return true;
  }
  return false;
};

/**
 * The shade on the side of a ribbon that faces away from the lamp, as a closed polygon per side, plus the far
 * side of the round tip. `away` is the unit direction shadows travel. Pure; returns 0-2 polygons.
 */
export const shadeBands = (rib: Ribbon, out: Outline, away: Pt, o: BandOptions): string[] => {
  const bands: string[] = [];
  const n = rib.spine.length;
  for (const side of [1, -1] as const) {
    const edge = side === 1 ? out.left : out.right;
    const exposure = rib.normals.map((nm) => Math.max(0, dot(mul(nm, side), away)) ** o.gamma);
    if (Math.max(...exposure) < 0.08) continue;
    const inner = rib.spine.map((p, i) => {
      const k = exposure[i] as number;
      const fade = smooth01((rib.u[i] as number) / Math.max(1e-6, o.from));
      return add(p, mul(rib.normals[i] as Pt, side * ((rib.widths[i] as number) / 2) * (1 - o.depth * k * fade)));
    });
    if (o.tip === false) {
      bands.push(polyPath([...edge, ...[...inner].reverse()], true));
      continue;
    }
    // Around the tip: the half of the round end on this side, with the band thinning to nothing at the apex.
    const tipPts = side === 1 ? out.tip.slice(0, Math.ceil(out.tip.length / 2)) : [...out.tip].reverse().slice(0, Math.ceil(out.tip.length / 2));
    const tipCentre = rib.spine[n - 1] as Pt;
    const tipExposure = exposure[n - 1] as number;
    const tipInner = tipPts.map((p, i) => {
      const k = 1 - i / Math.max(1, tipPts.length - 1);
      const radial = sub(p, tipCentre);
      const exposed = Math.max(0, dot(norm(radial), away)) ** o.gamma;
      return add(tipCentre, mul(radial, 1 - o.depth * Math.max(tipExposure * k, exposed * 0.9)));
    });
    const outer = [...edge, ...tipPts];
    const innerAll = [...inner, ...tipInner].reverse();
    bands.push(polyPath([...outer, ...innerAll], true));
  }
  return bands;
};

/** The lit edge of a ribbon (for the index finger's highlight): the side facing the lamp, inset a little. */
export const litEdge = (rib: Ribbon, out: Outline, away: Pt, inset: number, from: number, to: number, forcedSide?: 1 | -1): Pt[] => {
  const n = rib.spine.length;
  const side = forcedSide ?? (awaySide(rib, away) === 1 ? -1 : 1);
  const edge = side === 1 ? out.left : out.right;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const u = rib.u[i] as number;
    if (u < from || u > to) continue;
    pts.push(sub(edge[i] as Pt, mul(rib.normals[i] as Pt, side * inset)));
  }
  return pts;
};

/** Which side of the ribbon faces away from the lamp on average (+1 = left edge, -1 = right edge). */
export const awaySide = (rib: Ribbon, away: Pt): 1 | -1 => {
  const avg = rib.normals.reduce((a, b) => add(a, b), pt(0, 0));
  return dot(avg, away) >= 0 ? 1 : -1;
};
