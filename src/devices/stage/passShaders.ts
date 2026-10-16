// passShaders.ts — the post chain: bright-pass, separable Gaussian, composite + sRGB encode.
// Everything is rendered linear into half-float targets; the composite is the only place that encodes to sRGB, so
// screen footage comes out with its source values (no tone mapping, no dithering, no grain).

export const FULLSCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const SRGB = /* glsl */ `
vec3 encodeSRGB(vec3 linear) {
  vec3 c = max(linear, vec3(0.0));
  vec3 lo = c * 12.92;
  vec3 hi = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
  return mix(lo, hi, step(vec3(0.0031308), c));
}
`;

/** Bright pass: keeps what is brighter than the threshold (in display terms), exactly zero below it. */
export const BRIGHT_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tScene;
uniform vec2 uTexel;
uniform float uThreshold;
varying vec2 vUv;
${SRGB}
// The scene's alpha is a bloom mask: lights and bodies write 1, screen pixels write the rig's screenBloom (0 by
// default: UI on glass stays crisp).
vec3 bright(vec2 uv) {
  vec4 s = texture2D(tScene, uv);
  vec3 c = s.rgb * clamp(s.a, 0.0, 1.0);
  float lum = dot(encodeSRGB(c), vec3(0.2126, 0.7152, 0.0722));
  return c * (max(lum - uThreshold, 0.0) / max(lum, 1e-4));
}
void main() {
  // 4-tap box downsample (the target is half resolution).
  vec2 o = uTexel * 0.5;
  vec3 sum = bright(vUv + vec2(-o.x, -o.y)) + bright(vUv + vec2(o.x, -o.y)) + bright(vUv + vec2(-o.x, o.y)) + bright(vUv + vec2(o.x, o.y));
  gl_FragColor = vec4(sum * 0.25, 1.0);
}
`;

export const MAX_BLUR_TAPS = 64;

/** One axis of a Gaussian with finite support (3 sigma), normalised so its weights sum to 1. */
export const BLUR_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tInput;
uniform vec2 uDirection; // texel step along the blur axis
uniform float uSigma;    // in texels of this target
varying vec2 vUv;
void main() {
  int taps = int(min(ceil(uSigma * 3.0), ${MAX_BLUR_TAPS}.0));
  float norm = 1.0;
  vec3 sum = texture2D(tInput, vUv).rgb;
  float twoSigma2 = 2.0 * uSigma * uSigma;
  for (int i = 1; i <= ${MAX_BLUR_TAPS}; i++) {
    if (i > taps) break;
    float w = exp(-float(i * i) / twoSigma2);
    vec2 d = uDirection * float(i);
    sum += (texture2D(tInput, vUv + d).rgb + texture2D(tInput, vUv - d).rgb) * w;
    norm += 2.0 * w;
  }
  gl_FragColor = vec4(sum / norm, 1.0);
}
`;

export const COMPOSITE_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform float uIntensity;
varying vec2 vUv;
${SRGB}
void main() {
  vec3 c = texture2D(tScene, vUv).rgb + texture2D(tBloom, vUv).rgb * uIntensity;
  gl_FragColor = vec4(clamp(encodeSRGB(c), 0.0, 1.0), 1.0);
}
`;
