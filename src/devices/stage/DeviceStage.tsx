// DeviceStage.tsx — one <ThreeCanvas> in the black void that every rig renders into.
// Put several rigs in ONE stage when they share a shot (they then share perspective, bloom and light).
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import React, {createContext, useContext, useLayoutEffect} from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {NoToneMapping, type PerspectiveCamera} from 'three';
import {VOID} from '../../glass/tokens';
import {cameraClip, cameraDistance, DEFAULT_FOV_DEG, effectiveFov, type StageSize} from './camera';
import {Composer, DEFAULT_BLOOM, type BloomSettings} from './Composer';

export type StageInfo = StageSize & {fov: number; distance: number};
const StageContext = createContext<StageInfo | null>(null);

/** The stage the rig is in (size in logical px, FOV, camera distance). Throws outside a <DeviceStage>. */
export const useStage = (): StageInfo => {
  const stage = useContext(StageContext);
  if (!stage) throw new Error('Device rigs must be rendered inside <DeviceStage>.');
  return stage;
};

const StageCamera: React.FC<{stage: StageInfo}> = ({stage}) => {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  useLayoutEffect(() => {
    const {near, far} = cameraClip(stage.distance);
    camera.fov = effectiveFov(stage.fov);
    camera.aspect = stage.width / stage.height;
    camera.near = near;
    camera.far = far;
    camera.position.set(0, 0, stage.distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  });
  return null;
};

export type DeviceStageProps = {
  /** Vertical field of view in degrees; ~0 is flat (the drawing), 28 is the film's perspective. */
  fov?: number;
  /** Bloom settings (BIBLE: threshold 0.6, radius 12 px, intensity 0.35), or false for none. */
  bloom?: Partial<BloomSettings> | false;
  children?: React.ReactNode;
  /** Extra DOM layered over the canvas (same size), e.g. 2D hairlines warped onto a screen. */
  overlay?: React.ReactNode;
};

export const DeviceStage: React.FC<DeviceStageProps> = ({fov = DEFAULT_FOV_DEG, bloom, children, overlay}) => {
  const {width, height} = useVideoConfig();
  const stage: StageInfo = {width, height, fov, distance: cameraDistance(fov, height)};
  const bloomSettings = bloom === false ? null : {...DEFAULT_BLOOM, ...bloom};
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  return (
    <AbsoluteFill style={{backgroundColor: VOID}}>
      <ThreeCanvas
        width={width}
        height={height}
        dpr={dpr}
        flat
        gl={{antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance', toneMapping: NoToneMapping}}
        camera={{fov: effectiveFov(fov), position: [0, 0, stage.distance], near: 1, far: stage.distance * 2}}
        onCreated={(state) => state.gl.setClearColor(VOID, 1)}
      >
        <StageContext.Provider value={stage}>
          <StageCamera stage={stage} />
          <Composer bloom={bloomSettings} />
          {children}
        </StageContext.Provider>
      </ThreeCanvas>
      {overlay ? <AbsoluteFill>{overlay}</AbsoluteFill> : null}
    </AbsoluteFill>
  );
};
