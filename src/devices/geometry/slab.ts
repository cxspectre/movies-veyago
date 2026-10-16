// slab.ts — geometry builders for device bodies: a rounded-rect outline swept with a rounded cross-section, flat
// caps, and the edge-light halo ribbon. Device units: y UP in 3D; the outline maths (src/glass) is y down, so y is
// negated here. Every vertex carries `aLoop` = (cos, sin) of 2π·u, u the clockwise perimeter parameter from the
// top-left corner, so shaders can measure arc distance to the travelling light without a seam.
import {BufferAttribute, BufferGeometry} from 'three';
import {samplePerimeter, type RoundedRect} from '../../glass/edgeLightPath';

export type SlabSpec = {
  outline: RoundedRect;
  depth: number;
  /** Radius of the rounding where the side meets the front / the back. */
  frontEdge: number;
  backEdge: number;
  perimeterSamples?: number;
  edgeSegments?: number;
  backCap?: boolean;
  frontCap?: boolean;
};

type ProfilePoint = {o: number; z: number; no: number; nz: number; s: number};

const TAU = Math.PI * 2;
const DEFAULT_PERIMETER_SAMPLES = 720;
const DEFAULT_EDGE_SEGMENTS = 10;

/** The cross-section from the front cap's rim (s = 0) round the front edge, down the side, round the back edge. */
export const slabProfile = (depth: number, fe: number, be: number, segments: number): readonly ProfilePoint[] => {
  const front = Array.from({length: segments + 1}, (_, k) => {
    const t = ((k / segments) * Math.PI) / 2;
    return {o: -fe + fe * Math.sin(t), z: depth / 2 - fe + fe * Math.cos(t), no: Math.sin(t), nz: Math.cos(t)};
  });
  const back = Array.from({length: segments + 1}, (_, k) => {
    const t = Math.PI / 2 + ((k / segments) * Math.PI) / 2;
    return {o: -be + be * Math.sin(t), z: -depth / 2 + be + be * Math.cos(t), no: Math.sin(t), nz: Math.cos(t)};
  });
  const raw = [...front, ...back];
  return raw.reduce<ProfilePoint[]>((acc, p, i) => {
    const prev = acc[i - 1];
    const s = prev ? prev.s + Math.hypot(p.o - prev.o, p.z - prev.z) : 0;
    return [...acc, {...p, s}];
  }, []);
};

/** Arc-length position of the front edge's 45° line on the profile (where the 1 px highlight sits). */
export const frontEdgeLine = (fe: number): number => (fe * Math.PI) / 4;

type Buffers = {pos: number[]; nrm: number[]; loop: number[]; prof: number[]; idx: number[]};

const pushVertex = (b: Buffers, p: readonly [number, number, number], n: readonly [number, number, number], u: number, s: number): number => {
  b.pos.push(...p);
  b.nrm.push(...n);
  b.loop.push(Math.cos(TAU * u), Math.sin(TAU * u));
  b.prof.push(s);
  return b.pos.length / 3 - 1;
};

const sweep = (b: Buffers, spec: SlabSpec, samples: number, profile: readonly ProfilePoint[]): void => {
  const ring = samplePerimeter(spec.outline, samples);
  const base = b.pos.length / 3;
  ring.forEach((p) =>
    profile.forEach((q) =>
      pushVertex(b, [p.x + p.nx * q.o, -(p.y + p.ny * q.o), q.z], [p.nx * q.no, -p.ny * q.no, q.nz], p.u, q.s),
    ),
  );
  const rows = profile.length;
  for (let i = 0; i < samples; i++) {
    const i1 = (i + 1) % samples;
    for (let j = 0; j < rows - 1; j++) {
      const a = base + i * rows + j;
      const b1 = base + i1 * rows + j;
      const c = base + i * rows + j + 1;
      const d = base + i1 * rows + j + 1;
      b.idx.push(a, b1, c, b1, d, c);
    }
  }
};

const cap = (b: Buffers, outline: RoundedRect, inset: number, z: number, facing: 1 | -1, samples: number, s: number): void => {
  const ring = samplePerimeter(outline, samples);
  const centre = pushVertex(b, [0, 0, z], [0, 0, facing], 0, s);
  const first = b.pos.length / 3;
  ring.forEach((p) => pushVertex(b, [p.x - p.nx * inset, -(p.y - p.ny * inset), z], [0, 0, facing], p.u, s));
  for (let i = 0; i < samples; i++) {
    const r0 = first + i;
    const r1 = first + ((i + 1) % samples);
    if (facing === 1) b.idx.push(centre, r1, r0);
    else b.idx.push(centre, r0, r1);
  }
};

const toGeometry = (b: Buffers): BufferGeometry => {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(b.pos), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(b.nrm), 3));
  g.setAttribute('aLoop', new BufferAttribute(new Float32Array(b.loop), 2));
  g.setAttribute('aProfile', new BufferAttribute(new Float32Array(b.prof), 1));
  g.setIndex(b.idx);
  g.computeBoundingSphere();
  return g;
};

/**
 * A rounded slab centred on the origin, front face toward +z. `aProfile` is the cross-section arc length from the front
 * rim (caps carry -1 for the front and a large value for the back so shaders can tell them apart).
 */
export const slabGeometry = (spec: SlabSpec): BufferGeometry => {
  const samples = spec.perimeterSamples ?? DEFAULT_PERIMETER_SAMPLES;
  const profile = slabProfile(spec.depth, spec.frontEdge, spec.backEdge, spec.edgeSegments ?? DEFAULT_EDGE_SEGMENTS);
  const buffers: Buffers = {pos: [], nrm: [], loop: [], prof: [], idx: []};
  sweep(buffers, spec, samples, profile);
  const last = profile[profile.length - 1];
  if (spec.frontCap) cap(buffers, spec.outline, spec.frontEdge, spec.depth / 2, 1, samples, -1);
  if (spec.backCap) cap(buffers, spec.outline, spec.backEdge, -spec.depth / 2, -1, samples, (last?.s ?? 0) + 1);
  return toGeometry(buffers);
};

/** A flat rounded-rect fan at height z, facing +z (the front glass). `aLoop` is set; `aProfile` is 0. */
export const roundedFanGeometry = (outline: RoundedRect, inset: number, z: number, samples = DEFAULT_PERIMETER_SAMPLES): BufferGeometry => {
  const buffers: Buffers = {pos: [], nrm: [], loop: [], prof: [], idx: []};
  cap(buffers, outline, inset, z, 1, samples, 0);
  return toGeometry(buffers);
};

/**
 * The halo ribbon: from the outline (offset 0) out to `extent`, in the plane z. `aAcross` is 0 at the edge and 1 at
 * the outer rim, where the halo is exactly zero.
 */
export const haloRibbonGeometry = (outline: RoundedRect, extent: number, z: number, samples = DEFAULT_PERIMETER_SAMPLES): BufferGeometry => {
  const ring = samplePerimeter(outline, samples);
  const pos: number[] = [];
  const loop: number[] = [];
  const across: number[] = [];
  ring.forEach((p) =>
    [0, 1].forEach((k) => {
      pos.push(p.x + p.nx * extent * k, -(p.y + p.ny * extent * k), z);
      loop.push(Math.cos(TAU * p.u), Math.sin(TAU * p.u));
      across.push(k);
    }),
  );
  const idx: number[] = [];
  for (let i = 0; i < samples; i++) {
    const i1 = (i + 1) % samples;
    const a = i * 2;
    const b = i1 * 2;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('aLoop', new BufferAttribute(new Float32Array(loop), 2));
  g.setAttribute('aAcross', new BufferAttribute(new Float32Array(across), 1));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
};
