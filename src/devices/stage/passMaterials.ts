import {ShaderMaterial, Vector2, type IUniform, type Texture} from 'three';
import {BLUR_FRAG, BRIGHT_FRAG, COMPOSITE_FRAG, FULLSCREEN_VERT} from './passShaders';

type Typed<U> = ShaderMaterial & {uniforms: U};
export type BrightUniforms = {tScene: IUniform<Texture | null>; uTexel: IUniform<Vector2>; uThreshold: IUniform<number>};
export type BlurUniforms = {tInput: IUniform<Texture | null>; uDirection: IUniform<Vector2>; uSigma: IUniform<number>};
export type CompositeUniforms = {tScene: IUniform<Texture | null>; tBloom: IUniform<Texture | null>; uIntensity: IUniform<number>};
export type PassMaterials = {bright: Typed<BrightUniforms>; blur: Typed<BlurUniforms>; composite: Typed<CompositeUniforms>};

const pass = <U extends Record<string, IUniform>>(fragmentShader: string, uniforms: U): Typed<U> =>
  new ShaderMaterial({vertexShader: FULLSCREEN_VERT, fragmentShader, uniforms, depthTest: false, depthWrite: false, toneMapped: false}) as Typed<U>;

/** Fresh materials for the post chain (one set per stage). */
export const createPassMaterials = (): PassMaterials => ({
  bright: pass<BrightUniforms>(BRIGHT_FRAG, {tScene: {value: null}, uTexel: {value: new Vector2()}, uThreshold: {value: 0.6}}),
  blur: pass<BlurUniforms>(BLUR_FRAG, {tInput: {value: null}, uDirection: {value: new Vector2()}, uSigma: {value: 1}}),
  composite: pass<CompositeUniforms>(COMPOSITE_FRAG, {tScene: {value: null}, tBloom: {value: null}, uIntensity: {value: 0}}),
});
