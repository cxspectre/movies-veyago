// parts.ts — small parts that sit on a body (buttons, a crown, straps), and the aLoop remap that lets the body's
// travelling light reach them at the right moment.
import {BufferAttribute, type BufferGeometry} from 'three';
import {paramOfPoint, type RoundedRect} from '../../glass/edgeLightPath';
import {slabGeometry} from './slab';

const TAU = Math.PI * 2;

export type PartMesh = {geometry: BufferGeometry; position: [number, number, number]; rotation?: [number, number, number]};

/**
 * Re-labels a part's aLoop with the BODY outline's parameter at each vertex (offset = where the part sits, device
 * units, y up), so the band lights the part as it passes.
 */
export const remapLoop = (geometry: BufferGeometry, outline: RoundedRect, offset: readonly [number, number]): BufferGeometry => {
  const pos = geometry.getAttribute('position');
  const loop = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const u = paramOfPoint(outline, pos.getX(i) + offset[0], -(pos.getY(i) + offset[1]));
    loop[i * 2] = Math.cos(TAU * u);
    loop[i * 2 + 1] = Math.sin(TAU * u);
  }
  geometry.setAttribute('aLoop', new BufferAttribute(loop, 2));
  return geometry;
};

/**
 * A pill-shaped button on the left (-1) or right (+1) side of a body: centred `y` (device units, y up), `length` along
 * the side, sticking out by `protrusion`, `thickness` front-to-back.
 */
export const sideButton = (body: RoundedRect, side: -1 | 1, y: number, length: number, protrusion: number, thickness: number, z = 0): PartMesh => {
  const outline: RoundedRect = {width: protrusion * 4, height: length, radius: Math.min(protrusion * 2, length / 2)};
  const geometry = slabGeometry({outline, depth: thickness, frontEdge: thickness * 0.3, backEdge: thickness * 0.3, perimeterSamples: 96, edgeSegments: 4, backCap: true, frontCap: true});
  const x = side * (body.width / 2 - protrusion);
  return {geometry: remapLoop(geometry, body, [x, y]), position: [x, y, z]};
};
