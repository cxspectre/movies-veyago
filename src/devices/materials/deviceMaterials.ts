// deviceMaterials.ts — the three shaders every rig is made of:
//   body  — matte #0B0B0C with a soft studio reflection, the 1 px #3A3A40 edge highlight and the band on the edge;
//   glass — the front: screen (sRGB footage, unlit, exact), its rounded mask and island, black bezel glass, a 4%
//           Fresnel reflection of the studio and of the edge light;
//   halo  — the #9FB4FF halo outside the edge (additive, exactly zero at its rim). It adds colour only: the alpha
//           channel (the bloom mask, see passShaders.ts) is left as the surface below wrote it, so a halo lying over
//           another device's screen or the pass never makes that UI bloom.
import {AddEquation, Color, CustomBlending, DoubleSide, OneFactor, ZeroFactor, ShaderMaterial, Vector2, Vector4, type IUniform, type Texture} from 'three';
import {BODY, EDGE_LIGHT} from '../../glass/tokens';
import {createEdgeUniforms, linear, type EdgeUniforms} from './edgeUniforms';
import {EDGE_LIGHT_FUNCS, EDGE_LIGHT_UNIFORMS, ENV_FUNCS, SURFACE_VERT} from './glsl';

export type BodyUniforms = EdgeUniforms & {
  uBase: IUniform<Color>;
  uRough: IUniform<number>;
  uSpec: IUniform<number>;
  uHighlight: IUniform<Color>;
  uLineS: IUniform<number>;
  uLinePx: IUniform<number>;
  uFrontEdge: IUniform<number>;
  uProfileEnd: IUniform<number>;
  uBandGain: IUniform<number>;
  uOpacity: IUniform<number>;
  /** A lengthwise gradient: base = mix(uBase, uBaseB, clamp(local y * uGrad.x + uGrad.y)) (uBaseB = uBase: none). */
  uBaseB: IUniform<Color>;
  uGrad: IUniform<Vector2>;
};

const BODY_FRAG = /* glsl */ `
precision highp float;
${EDGE_LIGHT_UNIFORMS}
uniform vec3 uBase;
uniform float uRough;
uniform float uSpec;
uniform vec3 uHighlight;
uniform float uLineS;
uniform float uLinePx;
uniform float uFrontEdge;
uniform float uProfileEnd;
uniform float uBandGain;
uniform float uOpacity;
uniform vec3 uBaseB;
uniform vec2 uGrad;
varying vec2 vLoop;
varying float vProfile;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec3 vLocal;
${EDGE_LIGHT_FUNCS}
${ENV_FUNCS}
void main() {
  vec3 n = normalize(vWorldNormal);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(cameraPosition - vWorldPos);
  float ndv = max(dot(n, v), 0.0);
  vec3 r = reflect(-v, n);
  vec3 base = mix(uBase, uBaseB, clamp(vLocal.y * uGrad.x + uGrad.y, 0.0, 1.0));
  vec3 col = base + studioEnv(r, uRough) * schlick(0.04, ndv) * uSpec;
  float onRim = step(0.0, vProfile) * step(vProfile, uProfileEnd);
  float fw = max(fwidth(vProfile), 1e-7);
  float line = onRim * clamp(uLinePx * 0.5 + 0.5 - abs(vProfile - uLineS) / fw, 0.0, 1.0);
  col = mix(col, max(col, uHighlight), line);
  col *= uOpacity; // the body fades; its light does not (a device "lights in": edge light first, body second)
  float band = edgeBand(vLoop, vLocal.x, uBandWidth) * onRim * uBandGain;
  float across = gaussA(vProfile - uLineS, uFrontEdge * 1.15) + 0.32 * smoothstep(uFrontEdge * 1.2, uFrontEdge * 2.0, vProfile) * (1.0 - smoothstep(uProfileEnd - uFrontEdge * 1.5, uProfileEnd, vProfile));
  col += uCore * band * (line * 1.4 + across) * uGlow;
  gl_FragColor = vec4(col, 1.0);
}
`;

export type BodyOptions = {color?: string; rough?: number; spec?: number; frontEdge: number; profileEnd: number; bandGain?: number};

export const createBodyMaterial = (o: BodyOptions): ShaderMaterial & {uniforms: BodyUniforms} => {
  const uniforms: BodyUniforms = {
    ...createEdgeUniforms(),
    uBase: {value: linear(o.color ?? BODY.color)},
    uRough: {value: o.rough ?? 0.75},
    uSpec: {value: o.spec ?? 0.35},
    uHighlight: {value: linear(BODY.edgeHighlight)},
    uLineS: {value: (o.frontEdge * Math.PI) / 4},
    uLinePx: {value: BODY.edgeHighlightPx},
    uFrontEdge: {value: o.frontEdge},
    uProfileEnd: {value: o.profileEnd},
    uBandGain: {value: o.bandGain ?? 1},
    uOpacity: {value: 1},
    uBaseB: {value: linear(o.color ?? BODY.color)},
    uGrad: {value: new Vector2(0, 0)},
  };
  return new ShaderMaterial({vertexShader: SURFACE_VERT, fragmentShader: BODY_FRAG, uniforms, toneMapped: false}) as ShaderMaterial & {uniforms: BodyUniforms};
};

export type GlassUniforms = EdgeUniforms & {
  tScreen: IUniform<Texture | null>;
  uHasScreen: IUniform<number>;
  uScreen: IUniform<Vector4>; // centre x, centre y, half w, half h (device units, y up)
  uScreenRadius: IUniform<number>;
  uIsland: IUniform<Vector4>; // in screen uv: centre u, centre v, half u, half v
  uIslandOn: IUniform<number>;
  uScreenLevel: IUniform<number>;
  uOutline: IUniform<Vector2>; // half size of the glass outline
  uOutlineRadius: IUniform<number>;
  uReflect: IUniform<number>;
  uOpacity: IUniform<number>;
  uScreenAspect: IUniform<number>;
  uScreenBloom: IUniform<number>;
};

const GLASS_FRAG = /* glsl */ `
precision highp float;
${EDGE_LIGHT_UNIFORMS}
uniform vec2 uLightPos;
uniform sampler2D tScreen;
uniform float uHasScreen;
uniform vec4 uScreen;
uniform float uScreenRadius;
uniform vec4 uIsland;
uniform float uIslandOn;
uniform float uScreenLevel;
uniform vec2 uOutline;
uniform float uOutlineRadius;
uniform float uReflect;
uniform float uOpacity;
uniform float uScreenAspect;
uniform float uScreenBloom;
varying vec2 vLoop;
varying float vProfile;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec3 vLocal;
${EDGE_LIGHT_FUNCS}
${ENV_FUNCS}
float sdRoundRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + vec2(r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
void main() {
  vec2 p = vLocal.xy;
  vec2 sp = p - uScreen.xy;
  float sd = sdRoundRect(sp, uScreen.zw, uScreenRadius);
  float aa = max(fwidth(sd), 1e-6);
  float inside = clamp(0.5 - sd / aa, 0.0, 1.0);
  vec2 uv = sp / (2.0 * uScreen.zw) + 0.5;
  vec3 screen = uHasScreen > 0.5 ? texture2D(tScreen, uv).rgb : vec3(0.0);
  // The Dynamic Island: a black pill, in screen points converted to uv (aspect-corrected SDF).
  vec2 ip = (uv - uIsland.xy) * vec2(uScreenAspect, 1.0);
  vec2 ih = uIsland.zw * vec2(uScreenAspect, 1.0);
  float isd = sdRoundRect(ip, ih, ih.y);
  float iaa = max(fwidth(isd), 1e-6);
  float island = uIslandOn * clamp(0.5 - isd / iaa, 0.0, 1.0);
  screen *= (1.0 - island) * uScreenLevel;
  vec3 col = screen * inside;
  vec3 n = normalize(vWorldNormal);
  vec3 v = normalize(cameraPosition - vWorldPos);
  float ndv = max(dot(n, v), 0.0);
  float fres = schlick(0.04, ndv);
  vec3 r = reflect(-v, n);
  // Edge light reflected in the glass near the edge it is on.
  float od = sdRoundRect(p, uOutline, uOutlineRadius);
  float nearEdge = exp(od / (uBandWidth * 0.35));
  float d = distance(p, uLightPos);
  float travel = uTravel * exp(-d * d / (2.0 * uBandWidth * uBandWidth)) * nearEdge;
  float sweep = uSweep * bandProfile(p.x - uSweepX, uBandWidth) * nearEdge;
  vec3 edgeRefl = uCore * max(travel, sweep) * uGlow * fres;
  col += (studioEnv(r, 0.12) * fres * uReflect + edgeRefl);
  gl_FragColor = vec4(col * uOpacity, mix(1.0, uScreenBloom, inside));
}
`;

export const createGlassMaterial = (): ShaderMaterial & {uniforms: GlassUniforms} => {
  const uniforms: GlassUniforms = {
    ...createEdgeUniforms(),
    tScreen: {value: null},
    uHasScreen: {value: 0},
    uScreen: {value: new Vector4(0, 0, 0.2, 0.4)},
    uScreenRadius: {value: 0.05},
    uIsland: {value: new Vector4(0.5, 0.96, 0.15, 0.02)},
    uIslandOn: {value: 0},
    uScreenLevel: {value: 1},
    uOutline: {value: new Vector2(0.24, 0.5)},
    uOutlineRadius: {value: 0.08},
    uReflect: {value: 1},
    uOpacity: {value: 1},
    uScreenAspect: {value: 0.46},
    uScreenBloom: {value: 0},
  };
  return new ShaderMaterial({vertexShader: SURFACE_VERT, fragmentShader: GLASS_FRAG, uniforms, toneMapped: false}) as ShaderMaterial & {uniforms: GlassUniforms};
};

const HALO_VERT = /* glsl */ `
attribute vec2 aLoop;
attribute float aAcross;
varying vec2 vLoop;
varying float vAcross;
varying vec3 vLocal;
void main() {
  vLoop = aLoop;
  vAcross = aAcross;
  vLocal = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const HALO_FRAG = /* glsl */ `
precision highp float;
${EDGE_LIGHT_UNIFORMS}
uniform float uHaloOpacity;
varying vec2 vLoop;
varying float vAcross;
varying vec3 vLocal;
${EDGE_LIGHT_FUNCS}
float gaussA(float x, float s) { return exp(-x * x / (2.0 * s * s)); }
void main() {
  // A soft lobe hugging the edge: Gaussian along (about twice the band), fast exponential across, exactly 0 at the rim.
  float hw = uBandWidth * ${EDGE_LIGHT.haloExtentWidths.toFixed(1)};
  float travel = uTravel * gaussA(loopDistance(vLoop), hw * 0.42);
  float sweep = uSweep * gaussA(vLocal.x - uSweepX, hw * 0.42);
  float along = max(travel, sweep);
  float a01 = clamp(vAcross, 0.0, 1.0);
  float fall = exp(-4.5 * a01) * (1.0 - a01) * (1.0 - a01);
  float a = uHaloOpacity * along * fall * uGlow;
  gl_FragColor = vec4(uHalo * a, 1.0);
}
`;

export type HaloUniforms = EdgeUniforms & {uHaloOpacity: IUniform<number>};

export const createHaloMaterial = (): ShaderMaterial & {uniforms: HaloUniforms} => {
  const uniforms: HaloUniforms = {...createEdgeUniforms(), uHaloOpacity: {value: EDGE_LIGHT.haloOpacity}};
  return new ShaderMaterial({
    vertexShader: HALO_VERT,
    fragmentShader: HALO_FRAG,
    uniforms,
    transparent: true,
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: OneFactor,
    blendDst: OneFactor,
    blendSrcAlpha: ZeroFactor,
    blendDstAlpha: OneFactor,
    depthWrite: false,
    side: DoubleSide,
    toneMapped: false,
  }) as ShaderMaterial & {uniforms: HaloUniforms};
};
