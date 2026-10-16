// glsl.ts — shared shader chunks: the edge-light band (same profile as src/glass/edgeLightPath.ts), the procedural
// studio environment (soft strips; the void itself stays black because only surfaces sample it) and Fresnel.

export const EDGE_LIGHT_UNIFORMS = /* glsl */ `
uniform float uLoopLen;      // perimeter length, device units
uniform vec2 uLightDir;      // (cos, sin) of 2*pi*position
uniform float uBandWidth;    // device units (0.07 = 7% of the device height)
uniform float uTravel;       // travelling band intensity
uniform float uSweepX;       // local x of the sweep band (device units)
uniform float uSweep;        // sweep band intensity
uniform float uGlow;         // overall device light level (1 = 100%)
uniform vec3 uCore;          // linear core colour
uniform vec3 uHalo;          // linear halo colour
`;

export const EDGE_LIGHT_FUNCS = /* glsl */ `
float bandProfile(float d, float w) {
  float ad = abs(d);
  if (ad >= w * 2.5) return 0.0;
  float halfCore = w * 0.2;
  float sigma = w * 0.15;
  float x = max(ad - halfCore, 0.0);
  return exp(-x * x / (2.0 * sigma * sigma));
}
float loopDistance(vec2 loop) {
  vec2 l = normalize(loop);
  float a = atan(l.x * uLightDir.y - l.y * uLightDir.x, dot(l, uLightDir));
  return abs(a) / 6.28318530718 * uLoopLen;
}
// Band brightness at a perimeter point (loop) whose local x is lx, for a band of width w.
float edgeBand(vec2 loop, float lx, float w) {
  float travel = uTravel * bandProfile(loopDistance(loop), w);
  float sweep = uSweep * bandProfile(lx - uSweepX, w);
  return max(travel, sweep);
}
`;

export const ENV_FUNCS = /* glsl */ `
float gaussA(float x, float s) { return exp(-x * x / (2.0 * s * s)); }
// A dark studio: a soft overhead box, a tall key strip front-left, a fill strip front-right and two rim strips behind.
// soft 0 = polished, 1 = matte. Returns linear radiance.
vec3 studioEnv(vec3 r, float soft) {
  float az = atan(r.x, r.z);           // 0 = toward the camera
  float el = asin(clamp(r.y, -1.0, 1.0));
  float spread = mix(0.06, 0.45, soft);
  float tall = smoothstep(-0.55 - soft, -0.2, el) * (1.0 - smoothstep(0.75, 1.1 + soft, el));
  float key = gaussA(az + 0.95, spread) * tall;
  float fill = gaussA(az - 1.05, spread * 1.3) * tall * 0.45;
  float rimL = gaussA(az + 2.6, spread * 1.4) * tall * 0.55;
  float rimR = gaussA(az - 2.7, spread * 1.4) * tall * 0.4;
  float top = smoothstep(0.55 - 0.4 * soft, 1.2, el) * 0.5;
  return vec3(0.93, 0.95, 1.0) * (key + fill + rimL + rimR + top);
}
float schlick(float f0, float ndv) {
  float k = pow(1.0 - clamp(ndv, 0.0, 1.0), 5.0);
  return f0 + (1.0 - f0) * k;
}
`;

/** Varyings every lit device surface passes from its vertex shader. */
export const SURFACE_VERT = /* glsl */ `
attribute vec2 aLoop;
attribute float aProfile;
varying vec2 vLoop;
varying float vProfile;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec3 vLocal;
void main() {
  vLoop = aLoop;
  vProfile = aProfile;
  vLocal = position;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPos = world.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;
