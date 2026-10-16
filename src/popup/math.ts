// math.ts — just enough 4x4 matrix algebra for hinged panels (column-major, CSS matrix3d order).
export type Vec3 = readonly [number, number, number];
export type Mat4 = readonly number[]; // 16 numbers, column-major

const n = (m: readonly number[], i: number): number => m[i] ?? 0;

export const IDENTITY: Mat4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** a * b (apply b first, then a). */
export const mul = (a: Mat4, b: Mat4): Mat4 => {
  const out: number[] = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += n(a, k * 4 + r) * n(b, c * 4 + k);
      out[c * 4 + r] = s;
    }
  }
  return out;
};

export const translation = (x: number, y: number, z = 0): Mat4 => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];

/** Rotation by `deg` about the axis direction `d` (unit) through point `p` (Rodrigues). */
export const rotationAbout = (p: Vec3, d: Vec3, deg: number): Mat4 => {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const t = 1 - c;
  const [x, y, z] = d;
  const r: Mat4 = [
    t * x * x + c, t * x * y + s * z, t * x * z - s * y, 0,
    t * x * y - s * z, t * y * y + c, t * y * z + s * x, 0,
    t * x * z + s * y, t * y * z - s * x, t * z * z + c, 0,
    0, 0, 0, 1,
  ];
  return mul(mul(translation(p[0], p[1], p[2]), r), translation(-p[0], -p[1], -p[2]));
};

export const apply = (m: Mat4, v: Vec3): Vec3 => [
  n(m, 0) * v[0] + n(m, 4) * v[1] + n(m, 8) * v[2] + n(m, 12),
  n(m, 1) * v[0] + n(m, 5) * v[1] + n(m, 9) * v[2] + n(m, 13),
  n(m, 2) * v[0] + n(m, 6) * v[1] + n(m, 10) * v[2] + n(m, 14),
];

/** Rotates a direction (ignores translation). */
export const applyDir = (m: Mat4, v: Vec3): Vec3 => [
  n(m, 0) * v[0] + n(m, 4) * v[1] + n(m, 8) * v[2],
  n(m, 1) * v[0] + n(m, 5) * v[1] + n(m, 9) * v[2],
  n(m, 2) * v[0] + n(m, 6) * v[1] + n(m, 10) * v[2],
];

export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export const matrix3d = (m: Mat4): string => `matrix3d(${m.map((n) => (Math.abs(n) < 1e-9 ? 0 : n).toFixed(6)).join(',')})`;
