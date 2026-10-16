// watchGeometry.ts — the watch's meshes in device units (built once, cached).
import type {BufferGeometry} from 'three';
import {EDGE_LIGHT} from '../../glass/tokens';
import type {RoundedRect} from '../../glass/edgeLightPath';
import {remapLoop, sideButton, type PartMesh} from '../geometry/parts';
import {haloRibbonGeometry, roundedFanGeometry, slabGeometry, slabProfile} from '../geometry/slab';
import {WATCH} from './watchSpec';

export type WatchGeometry = {
  body: BufferGeometry;
  bodyProfileEnd: number;
  /** Profile ends of the crown/button and strap slabs (where their side ends and the back edge begins). */
  partProfileEnd: number;
  strapProfileEnd: number;
  glass: BufferGeometry;
  halo: BufferGeometry;
  crown: PartMesh;
  button: PartMesh;
  straps: readonly PartMesh[];
};

const GLASS_LIFT = 0.0004;
const lastS = (profile: ReturnType<typeof slabProfile>): number => profile[profile.length - 1]?.s ?? 0;
const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** The crown: a short rounded cylinder whose axis points out of the right side. */
const crown = (): PartMesh => {
  const {radius, length, y, z} = WATCH.crown;
  const outline: RoundedRect = {width: radius * 2, height: radius * 2, radius};
  const geometry = slabGeometry({outline, depth: length * 2, frontEdge: length * 0.45, backEdge: length * 0.1, perimeterSamples: 128, edgeSegments: 6, frontCap: true});
  const x = WATCH.outline.width / 2;
  // Rotated a quarter turn about y, the slab's +z (its rounded cap) faces +x.
  return {geometry: remapLoop(geometry.clone().rotateY(Math.PI / 2), WATCH.outline, [x, y]), position: [x, y, z]};
};

/** 0 at the strap's inner end (under the case), 1 at its free end, for a strap slab of half-length L. */
const alongStrap = (y: number, side: 1 | -1, halfLength: number): number => Math.max(0, Math.min(1, (side * y + halfLength) / (2 * halfLength)));

/**
 * Shapes a straight strap slab: narrows it toward the free end and curls the free end back (a parabola in z), turning
 * the normals with the surface so the studio reflection runs along it as a soft specular band.
 */
const shapeStrap = (geometry: BufferGeometry, side: 1 | -1): BufferGeometry => {
  const s = WATCH.strap;
  const pos = geometry.getAttribute('position');
  const nrm = geometry.getAttribute('normal');
  for (let i = 0; i < pos.count; i++) {
    const t = alongStrap(pos.getY(i), side, s.length);
    pos.setX(i, pos.getX(i) * (1 - s.taper * t));
    pos.setZ(i, pos.getZ(i) - s.curl * t * t);
    // dz/dy of the curl, and the normal turned about x by atan of it.
    const slope = (-s.curl * 2 * t * side) / (2 * s.length);
    const angle = Math.atan(slope);
    const ny = nrm.getY(i);
    const nz = nrm.getZ(i);
    nrm.setXYZ(i, nrm.getX(i), ny * Math.cos(angle) - nz * Math.sin(angle), ny * Math.sin(angle) + nz * Math.cos(angle));
  }
  pos.needsUpdate = true;
  nrm.needsUpdate = true;
  geometry.computeBoundingSphere();
  return geometry;
};

const strap = (side: 1 | -1): PartMesh => {
  const s = WATCH.strap;
  const outline: RoundedRect = {width: s.width, height: s.length * 2, radius: s.radius};
  const slab = slabGeometry({outline, depth: s.thickness, frontEdge: s.thickness * 0.4, backEdge: s.thickness * 0.4, perimeterSamples: 256, edgeSegments: 6, frontCap: true, backCap: true});
  const y = side * (WATCH.outline.height / 2 + s.length * 0.55);
  // The band reaches the strap as it passes the case edge the strap hangs from.
  const geometry = remapLoop(shapeStrap(slab, side), WATCH.outline, [0, y]);
  return {geometry, position: [0, y, s.z], rotation: [toRad(-side * s.tiltDeg), 0, 0]};
};

/** The strap material's lengthwise gradient (see BodyUniforms.uGrad): 0 at the inner end, 1 at the free end. */
export const strapGradient = (side: 1 | -1): [number, number] => [side / (2 * WATCH.strap.length), 0.5];

const build = (): WatchGeometry => {
  const {outline, depth, frontEdge, backEdge} = WATCH;
  const profile = slabProfile(depth, frontEdge, backEdge, 12);
  const b = WATCH.button;
  return {
    body: slabGeometry({outline, depth, frontEdge, backEdge, backCap: true, edgeSegments: 12}),
    bodyProfileEnd: profile[profile.length - 1]?.s ?? 0,
    partProfileEnd: lastS(slabProfile(WATCH.crown.length * 2, WATCH.crown.length * 0.45, WATCH.crown.length * 0.1, 6)),
    strapProfileEnd: lastS(slabProfile(WATCH.strap.thickness, WATCH.strap.thickness * 0.4, WATCH.strap.thickness * 0.4, 6)),
    glass: roundedFanGeometry(outline, frontEdge, depth / 2 + GLASS_LIFT),
    halo: haloRibbonGeometry(outline, EDGE_LIGHT.widthOfDeviceHeight * EDGE_LIGHT.haloExtentWidths, depth / 2 - frontEdge * 0.5),
    crown: crown(),
    button: sideButton(outline, 1, b.y, b.length, b.protrusion, b.thickness, b.z),
    straps: [strap(1), strap(-1)],
  };
};

let cached: WatchGeometry | null = null;
export const watchGeometry = (): WatchGeometry => {
  cached = cached ?? build();
  return cached;
};
