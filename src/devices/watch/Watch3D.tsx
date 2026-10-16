// Watch3D.tsx — the un-badged smartwatch: rounded-square case, crown, side button, strap stubs, the Watch footage on
// its screen with the clock patched to 9:41, and the same edge light as the phone. Render inside <DeviceStage>.
import {useFrame} from '@react-three/fiber';
import React, {useEffect, useMemo} from 'react';
import {createBodyMaterial, createGlassMaterial, createHaloMaterial} from '../materials/deviceMaterials';
import {linear} from '../materials/edgeUniforms';
import {setupGlass} from '../rig/glassSetup';
import {RigGroup, useRigUniforms} from '../rig/RigGroup';
import {patchWatchClock} from '../screen/watchClockPatch';
import {useScreenTexture} from '../screen/useScreenTexture';
import type {RigProps, ScreenSource} from '../types';
import {strapGradient, watchGeometry} from './watchGeometry';
import {WATCH} from './watchSpec';

export type Watch3DProps = RigProps & {
  screen?: ScreenSource;
  /** Paint 9:41 over the capture's real clock (default true; turn off for sources without a clock). */
  patchClock?: boolean;
  screenLevel?: number;
  screenBloom?: number;
};

/** The strap runs from a hair lighter where it leaves the case to the body black at its free end. */
const STRAP_COLOR = {inner: '#101012', free: '#0B0B0C'} as const;
const STRAP_BAND_GAIN = 0.7;

const createStrapMaterial = (side: 1 | -1, profileEnd: number) => {
  const m = createBodyMaterial({color: STRAP_COLOR.inner, frontEdge: WATCH.strap.thickness * 0.4, profileEnd, bandGain: STRAP_BAND_GAIN, rough: 0.42, spec: 0.95});
  m.uniforms.uBaseB.value = linear(STRAP_COLOR.free);
  m.uniforms.uGrad.value.set(...strapGradient(side));
  return m;
};

const useMaterials = () =>
  useMemo(() => {
    const g = watchGeometry();
    // The case takes the phone's material and its 1 px #3A3A40 line; crown and button carry the same line.
    const body = createBodyMaterial({frontEdge: WATCH.frontEdge, profileEnd: g.bodyProfileEnd});
    const part = createBodyMaterial({frontEdge: WATCH.crown.length * 0.45, profileEnd: g.partProfileEnd, bandGain: 0.9, rough: 0.45, spec: 0.8});
    const straps = [createStrapMaterial(1, g.strapProfileEnd), createStrapMaterial(-1, g.strapProfileEnd)] as const;
    const glass = createGlassMaterial();
    setupGlass(glass.uniforms, WATCH.outline, WATCH.frontEdge, WATCH.screen);
    const halo = createHaloMaterial();
    return {body, part, straps, glass, halo, all: [body, part, ...straps, glass, halo]};
  }, []);

export const Watch3D: React.FC<Watch3DProps> = (props) => {
  const {screen = {kind: 'none'}, patchClock = true, screenLevel = 1, screenBloom = 0} = props;
  const g = watchGeometry();
  const mats = useMaterials();
  const tex = useScreenTexture(screen, patchClock ? patchWatchClock : undefined);
  useRigUniforms(mats.all, WATCH.outline, props);
  useFrame(() => {
    const u = mats.glass.uniforms;
    u.tScreen.value = tex.ready.current ? tex.texture : null;
    u.uHasScreen.value = tex.ready.current ? 1 : 0;
    u.uScreenLevel.value = screenLevel;
    u.uScreenBloom.value = screenBloom;
  });
  useEffect(() => () => mats.all.forEach((m) => m.dispose()), [mats]);
  return (
    <RigGroup {...props}>
      <mesh geometry={g.body} material={mats.body} />
      <mesh geometry={g.glass} material={mats.glass} />
      <mesh geometry={g.crown.geometry} material={mats.part} position={g.crown.position} />
      <mesh geometry={g.button.geometry} material={mats.part} position={g.button.position} />
      {g.straps.map((s, i) => (
        <mesh key={i} geometry={s.geometry} material={mats.straps[i]} position={s.position} rotation={s.rotation} />
      ))}
      <mesh geometry={g.halo} material={mats.halo} renderOrder={10} />
    </RigGroup>
  );
};
