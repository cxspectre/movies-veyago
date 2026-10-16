// fold.ts — pure: (spec, time) -> world matrix, corners and normal for every panel. No React, no randomness.
import {apply, applyDir, IDENTITY, mul, rotationAbout, translation, type Mat4, type Vec3} from './math';
import type {Edge, FoldKey, Panel, PopUpSpec, Rect} from './types';

export type PanelState = {
  readonly panel: Panel;
  /** Maps net coordinates (x, y, 0) to world coordinates (x, y, z up toward the viewer). */
  readonly world: Mat4;
  /** The four rect corners in world space: tl, tr, br, bl. */
  readonly corners: readonly [Vec3, Vec3, Vec3, Vec3];
  /** World unit normal of the front face. */
  readonly normal: Vec3;
  /** Current fold angle, degrees. */
  readonly angle: number;
  readonly visible: boolean;
};

const easeInOut = (u: number): number => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const SETTLE_DECAY = 6;
const SETTLE_HZ = 2.2;

/** Fold angle at time t. Keys ease in and out; a `spring` on the last key makes the paper settle with a small wobble. */
export const angleAt = (angle: Panel['angle'], t: number): number => {
  if (angle === undefined) return 0;
  if (typeof angle === 'number') return angle;
  const keys: readonly FoldKey[] = angle;
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (!first || !last) return 0;
  if (t <= first.t) return first.a;
  if (t >= last.t) {
    const prev = keys[keys.length - 2];
    if (!last.spring || !prev) return last.a;
    const tau = t - last.t;
    return last.a + last.spring * (last.a - prev.a) * Math.exp(-SETTLE_DECAY * tau) * Math.sin(2 * Math.PI * SETTLE_HZ * tau);
  }
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (a && b && t <= b.t) {
      const u = (t - a.t) / Math.max(1e-6, b.t - a.t);
      return a.a + (b.a - a.a) * easeInOut(u);
    }
  }
  return last.a;
};

/** Sugar: a panel that folds from `from` to `to` degrees between seconds `start` and `start + dur`. */
export const foldKeys = (start: number, dur: number, to: number, o: {from?: number; spring?: number} = {}): readonly FoldKey[] => [
  {t: start, a: o.from ?? 0},
  {t: start + dur, a: to, spring: o.spring ?? 0.06},
];

type Hinge = {readonly point: Vec3; readonly dir: Vec3; readonly sign: 1 | -1};

const edgeHinge = (r: Rect, edge: Edge): Hinge => {
  switch (edge) {
    case 'top':
      return {point: [r.x, r.y, 0], dir: [1, 0, 0], sign: 1};
    case 'bottom':
      return {point: [r.x, r.y + r.h, 0], dir: [1, 0, 0], sign: -1};
    case 'left':
      return {point: [r.x, r.y, 0], dir: [0, 1, 0], sign: -1};
    case 'right':
      return {point: [r.x + r.w, r.y, 0], dir: [0, 1, 0], sign: 1};
  }
};

const lineHinge = (panel: Panel): Hinge => {
  const l = panel.line;
  if (!l) throw new Error(`PopUp: panel "${panel.id}" has a parent but no hinge edge or line`);
  const dx = l.b[0] - l.a[0];
  const dy = l.b[1] - l.a[1];
  const len = Math.hypot(dx, dy) || 1;
  return {point: [l.a[0], l.a[1], 0], dir: [dx / len, dy / len, 0], sign: 1};
};

const hingeOf = (panel: Panel): Hinge => (panel.line ? lineHinge(panel) : edgeHinge(panel.rect, panel.hinge ?? 'top'));

export const clipToRectPoints = (panel: Panel): readonly (readonly [number, number])[] => {
  const {x, y, w, h} = panel.rect;
  const poly = panel.clip ?? [[0, 0], [100, 0], [100, 100], [0, 100]];
  return poly.map(([px, py]) => [x + (px / 100) * w, y + (py / 100) * h] as const);
};

const cornersOf = (m: Mat4, r: Rect): PanelState['corners'] => [
  apply(m, [r.x, r.y, 0]),
  apply(m, [r.x + r.w, r.y, 0]),
  apply(m, [r.x + r.w, r.y + r.h, 0]),
  apply(m, [r.x, r.y + r.h, 0]),
];

/** Resolves every panel's pose at time `t`. Parents must appear before their children in `spec.panels`. */
export const evaluate = (spec: PopUpSpec, t: number): readonly PanelState[] => {
  const worlds = new Map<string, Mat4>();
  const states: PanelState[] = [];
  for (const panel of spec.panels) {
    const angle = angleAt(panel.angle, t);
    let world = IDENTITY;
    if (panel.parent !== undefined) {
      const parent = worlds.get(panel.parent);
      if (!parent) throw new Error(`PopUp: panel "${panel.id}" names parent "${panel.parent}" which is not defined before it`);
      const h = hingeOf(panel);
      world = mul(parent, rotationAbout(h.point, h.dir, h.sign * angle));
    }
    worlds.set(panel.id, world);
    states.push({
      panel,
      world,
      corners: cornersOf(world, panel.rect),
      normal: applyDir(world, [0, 0, 1]),
      angle,
      visible: panel.hideBefore === undefined || t >= panel.hideBefore,
    });
  }
  return states.length === 0 || !spec.keep ? states : anchor(spec, states);
};

const anchor = (spec: PopUpSpec, states: readonly PanelState[]): readonly PanelState[] => {
  const pts = states.flatMap((s) => s.corners);
  const minZ = Math.min(...pts.map((p) => p[2]));
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const dz = spec.keep?.ground ? -minZ : 0;
  const dx = spec.keep?.centre ? spec.size.w / 2 - cx : 0;
  const dy = spec.keep?.centre ? spec.size.h / 2 - cy : 0;
  const shift = translation(dx, dy, dz);
  return states.map((s) => {
    const world = mul(shift, s.world);
    return {...s, world, corners: cornersOf(world, s.panel.rect)};
  });
};
