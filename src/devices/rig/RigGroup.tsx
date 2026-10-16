// RigGroup.tsx — places a rig in the stage from its Placement / Rotation, and the per-frame uniform update shared by
// every rig (edge light, glow, opacity, the 1 px line width in device pixels).
import {useFrame, useThree} from '@react-three/fiber';
import React from 'react';
import type {ShaderMaterial} from 'three';
import type {RoundedRect} from '../../glass/edgeLightPath';
import {applyEdgeLight, type EdgeUniforms} from '../materials/edgeUniforms';
import {rigEuler, rigPosition} from '../placement';
import {useStage} from '../stage/DeviceStage';
import type {RigProps} from '../types';
import {BODY} from '../../glass/tokens';

export const RigGroup: React.FC<RigProps & {children: React.ReactNode}> = ({placement, rotation, scale = 1, children}) => {
  const stage = useStage();
  const s = placement.height * scale;
  return (
    <group position={rigPosition(placement, stage)} rotation={rigEuler(rotation)} scale={[s, s, s]}>
      {children}
    </group>
  );
};

type LitMaterial = ShaderMaterial & {uniforms: EdgeUniforms & {uOpacity?: {value: number}; uLinePx?: {value: number}}};

/** Before every GL render: write the edge light, glow and opacity into each material of the rig. */
export const useRigUniforms = (materials: readonly LitMaterial[], outline: RoundedRect, props: RigProps, linePx = BODY.edgeHighlightPx): void => {
  const dpr = useThree((s) => s.viewport.dpr);
  useFrame(() => {
    materials.forEach((m) => {
      applyEdgeLight(m.uniforms, outline, props.edgeLight, props.glow ?? 1);
      if (m.uniforms.uOpacity) m.uniforms.uOpacity.value = props.opacity ?? 1;
      if (m.uniforms.uLinePx && m.uniforms.uLinePx.value !== 0) m.uniforms.uLinePx.value = linePx * dpr;
    });
  });
};
