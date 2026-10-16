// Composer.tsx — takes over R3F's render: scene -> 4x MSAA half-float target -> bloom -> sRGB composite.
// Runs inside <ThreeCanvas> as a priority-1 useFrame, so R3F's own render is skipped. Works in Remotion's headless
// Chrome with the ANGLE backend (WebGL2: multisampled float targets, derivatives); see README "Bloom".
import {useFrame, useThree} from '@react-three/fiber';
import React, {useEffect, useMemo} from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  HalfFloatType,
  LinearFilter,
  Mesh,
  OrthographicCamera,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
  type WebGLRenderer,
} from 'three';
import {BLOOM} from '../../glass/tokens';
import {createPassMaterials, type PassMaterials} from './passMaterials';

export type BloomSettings = {threshold: number; radiusPx: number; intensity: number};
export const DEFAULT_BLOOM: BloomSettings = {...BLOOM};
const MSAA_SAMPLES = 4;
/** Sigma of the Gaussian, as a fraction of the bloom radius (the radius is ~2 sigma). */
const SIGMA_OF_RADIUS = 0.5;

const fullscreenTriangle = (): BufferGeometry => {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  return geometry;
};

const makeTarget = (width: number, height: number, samples: number): WebGLRenderTarget =>
  new WebGLRenderTarget(width, height, {
    type: HalfFloatType,
    format: RGBAFormat,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    depthBuffer: samples > 0,
    samples,
  });

type Pipeline = {
  scene: WebGLRenderTarget;
  a: WebGLRenderTarget;
  b: WebGLRenderTarget;
  quad: Mesh;
  quadScene: Scene;
  quadCamera: OrthographicCamera;
  materials: PassMaterials;
  size: Vector2;
};

const createPipeline = (): Pipeline => {
  const materials = createPassMaterials();
  const quad = new Mesh(fullscreenTriangle(), materials.composite);
  quad.frustumCulled = false;
  const quadScene = new Scene();
  quadScene.add(quad);
  return {
    scene: makeTarget(1, 1, MSAA_SAMPLES),
    a: makeTarget(1, 1, 0),
    b: makeTarget(1, 1, 0),
    quad,
    quadScene,
    quadCamera: new OrthographicCamera(-1, 1, 1, -1, 0, 1),
    materials,
    size: new Vector2(),
  };
};

const resize = (p: Pipeline, gl: WebGLRenderer): {w: number; h: number} => {
  const size = gl.getDrawingBufferSize(p.size);
  const w = Math.max(1, Math.floor(size.x));
  const h = Math.max(1, Math.floor(size.y));
  if (p.scene.width !== w || p.scene.height !== h) {
    p.scene.setSize(w, h);
    p.a.setSize(Math.ceil(w / 2), Math.ceil(h / 2));
    p.b.setSize(Math.ceil(w / 2), Math.ceil(h / 2));
  }
  return {w, h};
};

const runPass = (p: Pipeline, gl: WebGLRenderer, material: ShaderMaterial, target: WebGLRenderTarget | null): void => {
  p.quad.material = material;
  gl.setRenderTarget(target);
  gl.render(p.quadScene, p.quadCamera);
};

const renderFrame = (p: Pipeline, gl: WebGLRenderer, scene: Scene, camera: Parameters<WebGLRenderer['render']>[1], bloom: BloomSettings | null, dpr: number): void => {
  const {w, h} = resize(p, gl);
  gl.setRenderTarget(p.scene);
  gl.clear(true, true, true);
  gl.render(scene, camera);
  const {bright, blur, composite} = p.materials;
  if (bloom && bloom.intensity > 0) {
    bright.uniforms.tScene.value = p.scene.texture;
    bright.uniforms.uTexel.value.set(1 / w, 1 / h);
    bright.uniforms.uThreshold.value = bloom.threshold;
    runPass(p, gl, bright, p.a);
    // Sigma in half-resolution texels: logical px * device px per logical px / 2.
    const sigma = Math.max(0.5, (bloom.radiusPx * SIGMA_OF_RADIUS * dpr) / 2);
    blur.uniforms.uSigma.value = sigma;
    blur.uniforms.tInput.value = p.a.texture;
    blur.uniforms.uDirection.value.set(1 / p.a.width, 0);
    runPass(p, gl, blur, p.b);
    blur.uniforms.tInput.value = p.b.texture;
    blur.uniforms.uDirection.value.set(0, 1 / p.b.height);
    runPass(p, gl, blur, p.a);
  }
  composite.uniforms.tScene.value = p.scene.texture;
  composite.uniforms.tBloom.value = p.a.texture;
  composite.uniforms.uIntensity.value = bloom ? bloom.intensity : 0;
  runPass(p, gl, composite, null);
};

/** Mount once inside the canvas. `bloom: null` keeps the linear pipeline and the sRGB encode, without bloom. */
export const Composer: React.FC<{bloom: BloomSettings | null}> = ({bloom}) => {
  const gl = useThree((s) => s.gl);
  const pipeline = useMemo(createPipeline, []);
  useEffect(
    () => () => {
      pipeline.scene.dispose();
      pipeline.a.dispose();
      pipeline.b.dispose();
      [pipeline.materials.bright, pipeline.materials.blur, pipeline.materials.composite].forEach((m) => m.dispose());
    },
    [pipeline],
  );
  useFrame((state) => {
    // A cleared bloom target keeps the composite exact when bloom is off.
    if (!bloom || bloom.intensity <= 0) {
      gl.setRenderTarget(pipeline.a);
      gl.clear(true, false, false);
    }
    renderFrame(pipeline, gl, state.scene, state.camera, bloom, state.viewport.dpr);
  }, 1);
  return null;
};
