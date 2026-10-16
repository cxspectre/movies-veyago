// CardFlip.tsx — the emergency card lifting off the phone's dock, flipping about its long axis and landing on the Watch
// face (BIBLE 5.7; timing in cardFlipMath FLIGHT_PHASES). A plane with a rounded-rect SDF (so the disc can grow into a card and the card into the Watch
// screen), the card art on its front and the Watch's own card screen on its back. Render inside <DeviceStage>.
import {useFrame} from '@react-three/fiber';
import React, {useEffect, useMemo, useRef} from 'react';
import {AddEquation, CustomBlending, DoubleSide, OneFactor, OneMinusSrcAlphaFactor, PlaneGeometry, ZeroFactor, ShaderMaterial, Vector2, Vector3, type Mesh, type IUniform, type Texture} from 'three';
import {ENV_FUNCS} from '../materials/glsl';
import {linear} from '../materials/edgeUniforms';
import {patchWatchClock} from '../screen/watchClockPatch';
import {useScreenTexture} from '../screen/useScreenTexture';
import type {ScreenSource} from '../types';
import {cardFlight, type FlightSpec} from './cardFlipMath';
import {FLIP_CARD} from './passSpec';

export type CardFlipProps = FlightSpec & {
  /** Seconds since the hit (module-local seconds minus familyOfDevices.flip.from). */
  t: number;
  front?: string;
  back?: ScreenSource;
  /** Paint 9:41 on the back (it is the Watch screen). */
  patchBackClock?: boolean;
};

const VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPos = world.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * vec3(0.0, 0.0, 1.0));
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tFront;
uniform sampler2D tBack;
uniform float uHasFront;
uniform float uHasBack;
uniform vec2 uSize;        // px
uniform float uRadius;     // px
uniform vec2 uFrontAspect; // texture w/h, current w/h
uniform vec2 uBackAspect;
uniform float uFrontArt;
uniform vec3 uRed;
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
${ENV_FUNCS}
float sdRoundRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + vec2(r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
// Cover-fit uv for a texture of aspect a.x shown on a face of aspect a.y.
vec2 cover(vec2 uv, vec2 a) {
  vec2 s = a.x > a.y ? vec2(a.y / a.x, 1.0) : vec2(1.0, a.x / a.y);
  return (uv - 0.5) * s + 0.5;
}
// Contain-fit uv (the art whole, centred; outside it the card's red shows).
vec2 contain(vec2 uv, vec2 a) {
  vec2 s = a.x > a.y ? vec2(1.0, a.x / a.y) : vec2(a.y / a.x, 1.0);
  return (uv - 0.5) * s + 0.5;
}
// The front art over the card red: contain-fit, its own transparent corners showing the red.
vec3 frontArt(vec2 uv) {
  vec2 fuv = contain(uv, uFrontAspect);
  float inArt = step(0.0, fuv.x) * step(fuv.x, 1.0) * step(0.0, fuv.y) * step(fuv.y, 1.0);
  vec4 art = texture2D(tFront, clamp(fuv, 0.0, 1.0));
  return mix(uRed, art.rgb, art.a * inArt);
}
void main() {
  vec2 p = (vUv - 0.5) * uSize;
  float sd = sdRoundRect(p, uSize * 0.5, uRadius);
  float cov = clamp(0.5 - sd / max(fwidth(sd), 1e-4), 0.0, 1.0);
  if (cov <= 0.0) discard;
  vec3 col;
  vec3 n = normalize(vWorldNormal);
  if (gl_FrontFacing) {
    vec3 art = uHasFront > 0.5 ? frontArt(vUv) : uRed;
    col = mix(uRed, art, uFrontArt);
  } else {
    n = -n;
    vec2 buv = vec2(vUv.x, 1.0 - vUv.y);
    col = uHasBack > 0.5 ? texture2D(tBack, cover(buv, uBackAspect)).rgb : uRed;
  }
  vec3 v = normalize(cameraPosition - vWorldPos);
  col += studioEnv(reflect(-v, n), 0.25) * schlick(0.04, max(dot(n, v), 0.0)) * 0.8;
  // Colour is premultiplied by coverage; alpha is the coverage that the blend uses to CLEAR the bloom mask under the
  // card (see createMaterial), so its printed type stays crisp.
  gl_FragColor = vec4(col * cov, cov);
}
`;

type FlipUniforms = {
  tFront: IUniform<Texture | null>;
  tBack: IUniform<Texture | null>;
  uHasFront: IUniform<number>;
  uHasBack: IUniform<number>;
  uSize: IUniform<Vector2>;
  uRadius: IUniform<number>;
  uFrontAspect: IUniform<Vector2>;
  uBackAspect: IUniform<Vector2>;
  uFrontArt: IUniform<number>;
  uRed: IUniform<ReturnType<typeof linear>>;
};

const createMaterial = (): ShaderMaterial & {uniforms: FlipUniforms} => {
  const uniforms: FlipUniforms = {
    tFront: {value: null},
    tBack: {value: null},
    uHasFront: {value: 0},
    uHasBack: {value: 0},
    uSize: {value: new Vector2(1, 1)},
    uRadius: {value: 0},
    uFrontAspect: {value: new Vector2(1, 1)},
    uBackAspect: {value: new Vector2(1, 1)},
    uFrontArt: {value: 0},
    uRed: {value: linear(FLIP_CARD.red)},
  };
  // Premultiplied coverage over the scene (the anti-aliased rim blends, the rest is opaque). The alpha channel is the
  // bloom mask: the card leaves 0 where it covers (dst.a * (1 - coverage)), like a screen. It is drawn last and never
  // depth-tested, so no bezel or body ever clips it on its way from the phone to the Watch.
  return new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    side: DoubleSide,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: OneFactor,
    blendDst: OneMinusSrcAlphaFactor,
    blendSrcAlpha: ZeroFactor,
    blendDstAlpha: OneMinusSrcAlphaFactor,
    toneMapped: false,
  }) as ShaderMaterial & {uniforms: FlipUniforms};
};

/** After every rig part and halo. */
const CARD_RENDER_ORDER = 100;

const aspectOf = (t: Texture): number => {
  const img = t.image as {width?: number; height?: number} | undefined;
  return img?.width && img?.height ? img.width / img.height : 1;
};

export const CardFlip: React.FC<CardFlipProps> = (props) => {
  const {t, front = FLIP_CARD.front, back = {kind: 'image', src: FLIP_CARD.back}, patchBackClock = true} = props;
  const mesh = useRef<Mesh>(null);
  const geometry = useMemo(() => new PlaneGeometry(1, 1), []);
  const material = useMemo(createMaterial, []);
  const frontTex = useScreenTexture({kind: 'image', src: front});
  const backTex = useScreenTexture(back, patchBackClock ? patchWatchClock : undefined);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const s = cardFlight(props, t);
    m.visible = s.visible;
    m.position.copy(s.position);
    m.quaternion.copy(s.rotation);
    m.scale.copy(new Vector3(s.width, s.height, 1));
    const u = material.uniforms;
    u.uSize.value.set(s.width, s.height);
    u.uRadius.value = Math.min(s.radius, Math.min(s.width, s.height) / 2);
    u.uFrontArt.value = s.frontArt;
    u.tFront.value = frontTex.ready.current ? frontTex.texture : null;
    u.uHasFront.value = frontTex.ready.current ? 1 : 0;
    u.tBack.value = backTex.ready.current ? backTex.texture : null;
    u.uHasBack.value = backTex.ready.current ? 1 : 0;
    u.uFrontAspect.value.set(aspectOf(frontTex.texture), s.width / s.height);
    u.uBackAspect.value.set(aspectOf(backTex.texture), s.width / s.height);
  });
  return <mesh ref={mesh} geometry={geometry} material={material} renderOrder={CARD_RENDER_ORDER} />;
};
