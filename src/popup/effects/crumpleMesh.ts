// crumpleMesh.ts — pure geometry for the crumpled ball (BIBLE4 5.3). A sheet is a jittered grid of triangles; every
// vertex has a flat home on the sheet and a home on an irregular, dented ball (the sheet wraps the sphere through an
// octahedral map, so the middle of the sheet faces the viewer and the corners meet behind). One 0..1 amount moves
// every vertex between its two homes on its own staggered schedule, with a wrinkle that peaks mid-crush.
// Deterministic: seeded hashes only.
import {hash01, seedOf} from '../../paper/geometry/noise';
import {dot, type Vec3} from '../math';

export const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

export type MeshVertex = {
  /** Position on the sheet, 0..1 of its width and height. */
  readonly u: number;
  readonly v: number;
  /** Unit direction on the ball. */
  readonly dir: Vec3;
  /** Radius multiplier on the ball (bumps and dents make the silhouette irregular). */
  readonly k: number;
  /** Share of the crush that passes before this vertex starts to move. */
  readonly delay: number;
  /** Mid-crush wrinkle direction (px per px of sheet size). */
  readonly wrinkle: Vec3;
};

export type CrumpleMesh = {readonly verts: readonly MeshVertex[]; readonly tris: readonly (readonly [number, number, number])[]};

export type MeshOptions = {readonly seed: string; readonly cols: number; readonly rows: number};

const MAX_DELAY = 0.38;
const JITTER = 0.32;

const norm = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

/** Octahedral map: the square [-1,1]^2 onto the unit sphere, centre -> front pole (+z), corners -> back pole. */
const octahedral = (x: number, y: number): Vec3 => {
  const z = 1 - Math.abs(x) - Math.abs(y);
  if (z >= 0) return norm([x, y, z]);
  return norm([(1 - Math.abs(y)) * Math.sign(x || 1), (1 - Math.abs(x)) * Math.sign(y || 1), z]);
};

const cache = new Map<string, CrumpleMesh>();

export const crumpleMesh = ({seed, cols, rows}: MeshOptions): CrumpleMesh => {
  const key = `${seed}|${cols}|${rows}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const s = seedOf(seed);
  const r = (i: number, j: number, salt: number): number => hash01(s + salt * 7919, i * 131 + j);
  const verts: MeshVertex[] = [];
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const edgeX = i === 0 || i === cols;
      const edgeY = j === 0 || j === rows;
      const u = (i + (edgeX ? 0 : (r(i, j, 1) - 0.5) * 2 * JITTER)) / cols;
      const v = (j + (edgeY ? 0 : (r(i, j, 2) - 0.5) * 2 * JITTER)) / rows;
      const dir = octahedral(u * 2 - 1, v * 2 - 1);
      // Mostly bumps, a quarter of the vertices dented in: the creases of a hand-crushed ball.
      const dent = r(i, j, 3) < 0.26;
      const k = dent ? 0.74 + r(i, j, 4) * 0.12 : 0.92 + r(i, j, 4) * 0.22;
      // The rim of the sheet goes first (hands push the edges in), the middle last.
      const centre = Math.max(Math.abs(u * 2 - 1), Math.abs(v * 2 - 1));
      const delay = MAX_DELAY * (0.55 * (1 - centre) + 0.45 * r(i, j, 5));
      const wrinkle: Vec3 = [(r(i, j, 6) - 0.5) * 0.14, (r(i, j, 7) - 0.5) * 0.14, (r(i, j, 8) - 0.5) * 0.5];
      verts.push({u, v, dir, k, delay, wrinkle});
    }
  }
  const id = (i: number, j: number): number => j * (cols + 1) + i;
  const tris: [number, number, number][] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = id(i, j);
      const b = id(i + 1, j);
      const c = id(i + 1, j + 1);
      const d = id(i, j + 1);
      if (r(i, j, 9) < 0.5) tris.push([a, b, c], [a, c, d]);
      else tris.push([a, b, d], [b, c, d]);
    }
  }
  const mesh = {verts, tris};
  cache.set(key, mesh);
  return mesh;
};

const smooth = (x: number): number => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

/** Rotation by `deg` about the unit axis `a` (Rodrigues), applied to v. */
export const rotate = (v: Vec3, a: Vec3, deg: number): Vec3 => {
  const t = (deg * Math.PI) / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  const k = dot(a, v) * (1 - c);
  const x = cross(a, v);
  return [v[0] * c + x[0] * s + a[0] * k, v[1] * c + x[1] * s + a[1] * k, v[2] * c + x[2] * s + a[2] * k];
};

export type BallTurn = {readonly axis: Vec3; readonly deg: number};

export type PoseInput = {
  readonly w: number;
  readonly h: number;
  /** 0 = flat sheet, 1 = ball. */
  readonly amount: number;
  readonly radius: number;
  /** Where the ball's centre sits relative to the sheet's centre, px. */
  readonly to: readonly [number, number];
  /** Rotations of the ball (applied in order): the crush twist, then the rolls. */
  readonly turns: readonly BallTurn[];
};

/** Page-space positions (x right, y down, z toward the viewer; origin = top-left of the sheet box). */
export const posePoints = (mesh: CrumpleMesh, p: PoseInput): readonly Vec3[] => {
  const size = Math.min(p.w, p.h);
  return mesh.verts.map((vx) => {
    const flat: Vec3 = [vx.u * p.w, vx.v * p.h, 0];
    let ball: Vec3 = [vx.dir[0] * vx.k * p.radius, vx.dir[1] * vx.k * p.radius, vx.dir[2] * vx.k * p.radius];
    for (const t of p.turns) ball = rotate(ball, t.axis, t.deg);
    // The ball rests on the page: lift it by its radius so the back pole sits on the paper.
    const bx = p.w / 2 + p.to[0] + ball[0];
    const by = p.h / 2 + p.to[1] + ball[1];
    const bz = ball[2] + p.radius;
    const q = smooth((p.amount - vx.delay) / (1 - MAX_DELAY));
    const e = 1 - (1 - q) * (1 - q);
    const wr = Math.sin(Math.PI * q) * size;
    return [
      flat[0] + (bx - flat[0]) * e + vx.wrinkle[0] * wr,
      flat[1] + (by - flat[1]) * e + vx.wrinkle[1] * wr,
      flat[2] + (bz - flat[2]) * e + Math.abs(vx.wrinkle[2]) * wr * 0.6,
    ];
  });
};
