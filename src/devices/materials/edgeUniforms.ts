// edgeUniforms.ts — the uniforms every rig material shares for the travelling light, and how props map onto them.
import {Color, Vector2, type IUniform} from 'three';
import {EDGE_LIGHT} from '../../glass/tokens';
import {perimeterLength, pointAt, wrap01, type RoundedRect} from '../../glass/edgeLightPath';
import type {EdgeLight} from '../types';

export type EdgeUniforms = {
  uLoopLen: IUniform<number>;
  uLightDir: IUniform<Vector2>;
  uLightPos: IUniform<Vector2>;
  uBandWidth: IUniform<number>;
  uTravel: IUniform<number>;
  uSweepX: IUniform<number>;
  uSweep: IUniform<number>;
  uGlow: IUniform<number>;
  uCore: IUniform<Color>;
  uHalo: IUniform<Color>;
};

/** sRGB hex -> linear Color (three's Color.set() converts sRGB to the linear working space). */
export const linear = (hex: string): Color => new Color().set(hex);

export const createEdgeUniforms = (): EdgeUniforms => ({
  uLoopLen: {value: 1},
  uLightDir: {value: new Vector2(1, 0)},
  uLightPos: {value: new Vector2()},
  uBandWidth: {value: EDGE_LIGHT.widthOfDeviceHeight},
  uTravel: {value: 0},
  uSweepX: {value: 0},
  uSweep: {value: 0},
  uGlow: {value: 1},
  uCore: {value: linear(EDGE_LIGHT.core)},
  uHalo: {value: linear(EDGE_LIGHT.halo)},
});

/**
 * Writes the edge light state into the shared uniforms. `outline` is the body outline in device units (height 1).
 * The sweep's x is given 0..1 across the device's width (0 = left edge, 1 = right edge), so a scene can run one
 * sweep across several devices with `sweepAcross()`.
 */
export const applyEdgeLight = (u: EdgeUniforms, outline: RoundedRect, light: EdgeLight | undefined, glow: number): EdgeUniforms => {
  const position = wrap01(light?.position ?? 0);
  const point = pointAt(outline, position);
  u.uLoopLen.value = perimeterLength(outline);
  u.uLightDir.value.set(Math.cos(2 * Math.PI * position), Math.sin(2 * Math.PI * position));
  u.uLightPos.value.set(point.x, -point.y);
  u.uBandWidth.value = (light?.width ?? EDGE_LIGHT.widthOfDeviceHeight) * 1;
  u.uTravel.value = light?.intensity ?? 0;
  u.uSweep.value = light?.sweep?.intensity ?? 0;
  u.uSweepX.value = ((light?.sweep?.x ?? 0.5) - 0.5) * outline.width;
  u.uGlow.value = glow;
  return u;
};
