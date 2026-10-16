// Phone3D.tsx — the un-badged phone: matte body, 1 px edge highlight, side buttons, soft back plateau, front glass
// with the screen at the captures' exact aspect and corner radius, an optional Dynamic Island, the travelling edge
// light and its halo. Render inside <DeviceStage>.
import {useFrame} from '@react-three/fiber';
import React, {useEffect, useMemo} from 'react';
import {createBodyMaterial, createGlassMaterial, createHaloMaterial} from '../materials/deviceMaterials';
import {setupGlass} from '../rig/glassSetup';
import {RigGroup, useRigUniforms} from '../rig/RigGroup';
import {useScreenTexture} from '../screen/useScreenTexture';
import type {RigProps, ScreenSource} from '../types';
import {phoneGeometry} from './phoneGeometry';
import {PHONE, SCREEN_PT} from './phoneSpec';

export type Phone3DProps = RigProps & {
  screen?: ScreenSource;
  /** Draw the Dynamic Island pill (the clean stills need it; the videos already contain it). */
  island?: boolean;
  /** Screen brightness multiplier (1 = the footage's own pixels). */
  screenLevel?: number;
  /** How much the screen's bright UI feeds the bloom (0 = none, the default: UI stays crisp; 1 = like a light). */
  screenBloom?: number;
};

const PLATEAU_COLOR = '#0E0E10';
const BUTTON_BAND_GAIN = 0.8;

const useMaterials = () =>
  useMemo(() => {
    const g = phoneGeometry();
    const body = createBodyMaterial({frontEdge: PHONE.frontEdge, profileEnd: g.bodyProfileEnd});
    const button = createBodyMaterial({frontEdge: PHONE.buttons.thickness * 0.3, profileEnd: 1, bandGain: BUTTON_BAND_GAIN, rough: 0.5, spec: 0.8});
    button.uniforms.uLinePx.value = 0;
    const plateau = createBodyMaterial({color: PLATEAU_COLOR, frontEdge: PHONE.plateau.rise, profileEnd: 1, bandGain: 0, rough: 0.6});
    plateau.uniforms.uLinePx.value = 0;
    const glass = createGlassMaterial();
    const halo = createHaloMaterial();
    setupGlass(glass.uniforms, PHONE.outline, PHONE.frontEdge, PHONE.screen);
    const is = PHONE.islandPt;
    glass.uniforms.uIsland.value.set((is.x + is.w / 2) / SCREEN_PT.width, 1 - (is.y + is.h / 2) / SCREEN_PT.height, is.w / 2 / SCREEN_PT.width, is.h / 2 / SCREEN_PT.height);
    return {body, button, plateau, glass, halo, all: [body, button, plateau, glass, halo]};
  }, []);

export const Phone3D: React.FC<Phone3DProps> = (props) => {
  const {screen = {kind: 'none'}, island = false, screenLevel = 1, screenBloom = 0} = props;
  const g = phoneGeometry();
  const mats = useMaterials();
  const tex = useScreenTexture(screen);
  useRigUniforms(mats.all, PHONE.outline, props);
  useFrame(() => {
    const u = mats.glass.uniforms;
    u.tScreen.value = tex.ready.current ? tex.texture : null;
    u.uHasScreen.value = tex.ready.current ? 1 : 0;
    u.uIslandOn.value = island ? 1 : 0;
    u.uScreenLevel.value = screenLevel;
    u.uScreenBloom.value = screenBloom;
  });
  useEffect(() => () => mats.all.forEach((m) => m.dispose()), [mats]);
  return (
    <RigGroup {...props}>
      <mesh geometry={g.body} material={mats.body} />
      <mesh geometry={g.glass} material={mats.glass} />
      {g.buttons.map((b, i) => (
        <mesh key={i} geometry={b.geometry} material={mats.button} position={b.position} />
      ))}
      <mesh geometry={g.plateau.geometry} material={mats.plateau} position={g.plateau.position} />
      <mesh geometry={g.halo} material={mats.halo} renderOrder={10} />
    </RigGroup>
  );
};
