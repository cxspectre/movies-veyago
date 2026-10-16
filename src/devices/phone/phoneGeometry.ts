// phoneGeometry.ts — the phone's meshes in device units (built once, cached).
import type {BufferGeometry} from 'three';
import {EDGE_LIGHT} from '../../glass/tokens';
import type {RoundedRect} from '../../glass/edgeLightPath';
import {sideButton, type PartMesh} from '../geometry/parts';
import {haloRibbonGeometry, roundedFanGeometry, slabGeometry, slabProfile} from '../geometry/slab';
import {PHONE} from './phoneSpec';

export type PhoneGeometry = {
  body: BufferGeometry;
  bodyProfileEnd: number;
  glass: BufferGeometry;
  halo: BufferGeometry;
  buttons: readonly PartMesh[];
  plateau: {geometry: BufferGeometry; position: [number, number, number]};
};

/** Glass sits this far proud of the body's front rim (device units), so it never z-fights the rounding. */
export const GLASS_LIFT = 0.0002;

const button = (from: number, to: number, side: -1 | 1, flush = false): PartMesh => {
  const {protrusion, thickness} = PHONE.buttons;
  const y = PHONE.outline.height / 2 - ((from + to) / 2) * PHONE.outline.height;
  return sideButton(PHONE.outline, side, y, (to - from) * PHONE.outline.height, flush ? protrusion * 0.35 : protrusion, thickness);
};

const build = (): PhoneGeometry => {
  const {outline, depth, frontEdge, backEdge} = PHONE;
  const profile = slabProfile(depth, frontEdge, backEdge, 10);
  const plateauOutline: RoundedRect = {width: outline.width - 2 * PHONE.plateau.inset, height: PHONE.plateau.height, radius: PHONE.plateau.radius};
  const plateauY = outline.height / 2 - PHONE.plateau.fromTop - PHONE.plateau.height / 2;
  return {
    body: slabGeometry({outline, depth, frontEdge, backEdge, backCap: true}),
    bodyProfileEnd: profile[profile.length - 1]?.s ?? 0,
    glass: roundedFanGeometry(outline, frontEdge, depth / 2 + GLASS_LIFT),
    halo: haloRibbonGeometry(outline, EDGE_LIGHT.widthOfDeviceHeight * EDGE_LIGHT.haloExtentWidths, depth / 2 - frontEdge * 0.5),
    buttons: [
      ...PHONE.buttons.left.map(([a, b]) => button(a, b, -1)),
      ...PHONE.buttons.right.map(([a, b]) => button(a, b, 1)),
      button(PHONE.buttons.cameraControl[0], PHONE.buttons.cameraControl[1], 1, true),
    ],
    plateau: {
      geometry: slabGeometry({outline: plateauOutline, depth: PHONE.plateau.rise * 2, frontEdge: PHONE.plateau.rise * 0.9, backEdge: PHONE.plateau.rise * 0.9, perimeterSamples: 256, edgeSegments: 6, backCap: true}),
      position: [0, plateauY, -depth / 2],
    },
  };
};

let cached: PhoneGeometry | null = null;
export const phoneGeometry = (): PhoneGeometry => {
  cached = cached ?? build();
  return cached;
};
