// light.ts — the v1 desk lamp applied to folded panels: face shading from the panel normal, and the one-sided shadow
// each standing panel throws on the page. Pure functions of the lamp (src/paper/lamp.ts), so the pop-up matches the desk.
import {lampTint, shade, type Lamp} from '../paper';
import {clipToRectPoints, type PanelState} from './fold';
import {apply, dot, type Vec3} from './math';

const RAD = Math.PI / 180;
const LIT_GAIN = 0.55;
const LIT_MAX = 0.2;
const DARK_GAIN = 0.4;
const DARK_MAX = 0.28;
/** Panels lower than this above the page throw no shadow (they ARE the page). */
const MIN_CAST_HEIGHT = 0.75;

/** Unit vector from the surface TOWARD the lamp, in page space (x right, y down, z toward the viewer). */
export const toLamp = (lamp: Lamp): Vec3 => {
  const el = lamp.elevation * RAD;
  const az = lamp.azimuth * RAD;
  return [Math.cos(az) * Math.cos(el), Math.sin(az) * Math.cos(el), Math.sin(el)];
};

/** A normal-blend overlay colour for a face with this normal (lit toward the lamp = a warm lift, away = shade). */
export const faceOverlay = (lamp: Lamp, normal: Vec3): string => {
  const l = toLamp(lamp);
  const d = dot(normal, l) - l[2]; // 0 for paper lying flat
  if (d >= 0) return lampTint(lamp, Math.min(LIT_MAX, d * LIT_GAIN));
  return shade(Math.min(DARK_MAX, -d * DARK_GAIN));
};

export type ShadowShape = {readonly id: string; readonly points: readonly (readonly [number, number])[]; readonly height: number};

/** Where a point at height z lands on the page, along the lamp's rays (away from the lamp). `reach` scales the throw. */
const castPoint = (p: Vec3, l: Vec3, reach: number): readonly [number, number] => {
  const z = Math.max(0, p[2]);
  const k = (z / l[2]) * reach;
  return [p[0] - l[0] * k, p[1] - l[1] * k];
};

/** Shadow polygons on the page for every panel that stands clear of it. */
export const shadowShapes = (states: readonly PanelState[], lamp: Lamp, reach: number): readonly ShadowShape[] => {
  const l = toLamp(lamp);
  const out: ShadowShape[] = [];
  for (const s of states) {
    if (!s.visible) continue;
    const height = Math.max(...s.corners.map((c) => c[2]));
    if (height < MIN_CAST_HEIGHT) continue;
    const points = clipToRectPoints(s.panel).map(([x, y]) => castPoint(apply(s.world, [x, y, 0]), l, reach));
    out.push({id: s.panel.id, points, height});
  }
  return out;
};
