// village.ts — the village as hairline strokes in SCREEN px (BIBLE4 §5.10, 0.0-10.0): every house's front elevation (body,
// roof, door, window) from chapter 9's layout, in the order the strokes turn to light, and the way each stroke is
// re-traced as a stretch of the phone's outline. Chapter 9's popup houses are nets, not strokes, so this is a copy of
// their outline drawn straight from `HOUSES` (reported in README.md); the paper beneath is the real village.
import {BODY_W} from './phoneOutline';
import {HOUSES, dims, type HouseDef} from '../village/layout';
import {pointAt} from '../../glass/edgeLightPath';
import {PHONE} from '../../devices';

export type XY = readonly [number, number];
export type Stroke = {readonly id: string; readonly pts: readonly XY[]};

const rect = (x0: number, y0: number, x1: number, y1: number): XY[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];

/** One house as strokes in SHEET px (a front elevation standing on the floor's south edge). */
export const houseStrokes = (h: HouseDef): readonly Stroke[] => {
  const d = dims(h);
  const [cx, cy] = h.centre;
  const W = h.width;
  const base = cy + d.depth * 0.35;
  const top = base - d.wall;
  const left = cx - W / 2;
  const right = cx + W / 2;
  const out: Stroke[] = [{id: `${h.id}-body`, pts: rect(left, top, right, base)}];
  if (h.kind === 'flat') {
    out.push({id: `${h.id}-parapet`, pts: [[left - 6, top], [right + 6, top]]});
    for (let i = 0; i < 3; i++) {
      const wx = left + W * (0.14 + i * 0.3);
      out.push({id: `${h.id}-win${i}`, pts: rect(wx, top + d.wall * 0.2, wx + W * 0.2, top + d.wall * 0.55)});
    }
    return out;
  }
  const over = W * 0.06;
  out.push({id: `${h.id}-roof`, pts: [[left - over, top], [cx, top - d.roof * 2.2], [right + over, top]]});
  const dw = W * (h.kind === 'kennel' ? 0.36 : 0.2);
  const dh = d.wall * (h.kind === 'kennel' ? 0.7 : 0.7);
  out.push({id: `${h.id}-door`, pts: rect(cx - dw / 2 - (h.kind === 'kennel' ? 0 : W * 0.12), base - dh, cx + dw / 2 - (h.kind === 'kennel' ? 0 : W * 0.12), base)});
  if (h.kind === 'house') {
    const wx = cx + W * 0.1;
    const wy = top + d.wall * 0.22;
    const ws = W * 0.2;
    out.push({id: `${h.id}-win`, pts: rect(wx, wy, wx + ws, wy + ws)});
    out.push({id: `${h.id}-mullion`, pts: [[wx + ws / 2, wy], [wx + ws / 2, wy + ws]]});
    out.push({id: `${h.id}-sill`, pts: [[wx, wy + ws / 2], [wx + ws, wy + ws / 2]]});
  }
  return out;
};

/** Every stroke of the village, back row first (the order of `HOUSES`), in SHEET px. */
export const villageStrokes = (): readonly Stroke[] => HOUSES.flatMap(houseStrokes);

/** `n` points along a polyline at equal arc length. */
export const resample = (pts: readonly XY[], n: number): XY[] => {
  const seg: number[] = [0];
  for (let i = 1; i < pts.length; i++) seg.push((seg[i - 1] as number) + Math.hypot((pts[i] as XY)[0] - (pts[i - 1] as XY)[0], (pts[i] as XY)[1] - (pts[i - 1] as XY)[1]));
  const total = seg[seg.length - 1] as number;
  const out: XY[] = [];
  let j = 1;
  for (let k = 0; k < n; k++) {
    const s = (total * k) / Math.max(1, n - 1);
    while (j < pts.length - 1 && (seg[j] as number) < s) j++;
    const a = pts[j - 1] as XY;
    const b = pts[j] as XY;
    const span = (seg[j] as number) - (seg[j - 1] as number) || 1;
    const u = Math.min(1, Math.max(0, (s - (seg[j - 1] as number)) / span));
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  return out;
};

/** The phone's outline as screen px points for stroke `k` of `count`: its own stretch of the perimeter. */
export const phoneArc = (k: number, count: number, n: number, centre: XY, height: number): XY[] => {
  const rectOutline = {...PHONE.outline};
  const out: XY[] = [];
  for (let i = 0; i < n; i++) {
    const u = (k + i / Math.max(1, n - 1)) / count;
    const p = pointAt(rectOutline, u);
    out.push([centre[0] + p.x * height, centre[1] + p.y * height]);
  }
  return out;
};

export {BODY_W};
