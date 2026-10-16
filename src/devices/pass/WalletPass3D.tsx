// WalletPass3D.tsx — the reconstructed Wallet pass as a thin rounded card with real thickness, its art on the front
// (unlit, exact pixels), a deep red back and rim, and the same edge light as the devices. Render inside <DeviceStage>.
import {useFrame} from '@react-three/fiber';
import React, {useEffect, useMemo} from 'react';
import {EDGE_LIGHT} from '../../glass/tokens';
import {haloRibbonGeometry, roundedFanGeometry, slabGeometry, slabProfile} from '../geometry/slab';
import {linear} from '../materials/edgeUniforms';
import {createBodyMaterial, createGlassMaterial, createHaloMaterial} from '../materials/deviceMaterials';
import {setupGlass} from '../rig/glassSetup';
import {RigGroup, useRigUniforms} from '../rig/RigGroup';
import {useScreenTexture} from '../screen/useScreenTexture';
import type {RigProps} from '../types';
import {PASS} from './passSpec';

export type WalletPass3DProps = RigProps & {
  /** The art on the front (default the reconstruction). */
  art?: string;
  /** Sheen of the card's surface (the studio reflection), 0..1. */
  sheen?: number;
};

const FACE_LIFT = 0.0003;
const DEFAULT_SHEEN = 0.6;

const build = () => {
  const {outline, depth, edge} = PASS;
  const profile = slabProfile(depth, edge, edge, 6);
  return {
    body: slabGeometry({outline, depth, frontEdge: edge, backEdge: edge, backCap: true, edgeSegments: 6, perimeterSamples: 512}),
    profileEnd: profile[profile.length - 1]?.s ?? 0,
    face: roundedFanGeometry(outline, edge, depth / 2 + FACE_LIFT, 512),
    halo: haloRibbonGeometry(outline, EDGE_LIGHT.widthOfDeviceHeight * EDGE_LIGHT.haloExtentWidths, depth / 2, 512),
  };
};
let cached: ReturnType<typeof build> | null = null;
const passGeometry = (): ReturnType<typeof build> => {
  cached = cached ?? build();
  return cached;
};

export const WalletPass3D: React.FC<WalletPass3DProps> = (props) => {
  const {art = PASS.art, sheen = DEFAULT_SHEEN} = props;
  const g = passGeometry();
  const mats = useMemo(() => {
    // Rim and back share one deep red; the 1 px edge line is a lighter red on a red card.
    const body = createBodyMaterial({color: PASS.back, frontEdge: PASS.edge, profileEnd: g.profileEnd, rough: 0.55, spec: 0.55});
    body.uniforms.uHighlight.value = linear(PASS.rimHighlight);
    const face = createGlassMaterial();
    // The art spans the whole card with the pass's own corners; the rim's rounding wraps its outermost pixels.
    setupGlass(face.uniforms, PASS.outline, PASS.edge, {width: PASS.outline.width, height: PASS.outline.height, radius: PASS.outline.radius, centreY: 0});
    const halo = createHaloMaterial();
    return {body, face, halo, all: [body, face, halo]};
  }, [g.profileEnd]);
  const tex = useScreenTexture({kind: 'image', src: art});
  useRigUniforms(mats.all, PASS.outline, props);
  useFrame(() => {
    const u = mats.face.uniforms;
    u.tScreen.value = tex.ready.current ? tex.texture : null;
    u.uHasScreen.value = tex.ready.current ? 1 : 0;
    u.uReflect.value = sheen;
  });
  useEffect(() => () => mats.all.forEach((m) => m.dispose()), [mats]);
  return (
    <RigGroup {...props}>
      <mesh geometry={g.body} material={mats.body} />
      <mesh geometry={g.face} material={mats.face} />
      <mesh geometry={g.halo} material={mats.halo} renderOrder={10} />
    </RigGroup>
  );
};
