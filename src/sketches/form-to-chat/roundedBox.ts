// roundedBox.ts — a box with big round corners (a phone outline, a pill) drawn in one confident movement. The
// engine's handRect suits small radii; with a 48 px phone corner or a fully round pill its sides bow like a
// cushion, so this one samples true arcs, keeps the edges straight with a slight drift, and runs past its start.
import {drift, handPath, type XY} from '../../paper';

export type RoundedBoxOptions = {
  readonly radius: number;
  /** How far the closing movement runs past where it began, px. */
  readonly overshoot?: number;
  readonly wobble?: number;
};

const ARC_SAMPLES = 5;
const EDGE_STEP = 70;
const DRIFT_AMOUNT = 0.9;

const arc = (cx: number, cy: number, r: number, fromDeg: number): readonly XY[] =>
  Array.from({length: ARC_SAMPLES + 1}, (_, i): XY => {
    const a = ((fromDeg + (90 * i) / ARC_SAMPLES) * Math.PI) / 180;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });

/** Clockwise from the start of the top edge; the last point overshoots along the top edge. */
export const roundedBox = (x: number, y: number, w: number, h: number, seed: number, o: RoundedBoxOptions): string => {
  const r = Math.min(o.radius, w / 2, h / 2);
  const over = o.overshoot ?? 8;
  const corners: readonly (readonly XY[])[] = [
    arc(x + w - r, y + r, r, -90),
    arc(x + w - r, y + h - r, r, 0),
    arc(x + r, y + h - r, r, 90),
    arc(x + r, y + r, r, 180),
  ];
  const start: XY = [x + r + Math.min(6, w * 0.04), y];
  const loop = corners.reduce<readonly XY[]>((pts, c) => [...pts, ...drift([pts[pts.length - 1] as XY, c[0] as XY], seed + pts.length, EDGE_STEP, DRIFT_AMOUNT).slice(1, -1), ...c], [start]);
  const end: XY = [start[0] + over, start[1] + 0.8];
  return handPath([...loop, start, end], seed, {wobble: o.wobble ?? 0.5});
};
