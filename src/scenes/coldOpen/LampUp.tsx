// LampUp.tsx — the tungsten lamp warming up (coldOpen.lampUp): everything in frame is exposed by the lamp's
// intensity, the light starts amber and cools to the lamp's own colour, and while it is low it pools on the
// drawing (the lamp "finds" the phone). Normal blending only: a colour-matrix filter on the whole stage
// (applied in sRGB, so 5% intensity reads as nearly black) plus a normal-alpha pool overlay. At full intensity
// nothing is applied.
import React from 'react';
import {AbsoluteFill} from 'remotion';

/** How far the amber shift goes at zero intensity (green and blue gains are reduced by these). */
const AMBER = {green: 0.3, blue: 0.62} as const;
const AMBER_CURVE = 1.5;
/** Extra darkness at the frame edges while the lamp is low (opacity at intensity 0). */
const POOL_DARKNESS = 0.55;
/** The pool's bright centre leans toward the lamp (upper left), % of the frame. */
const POOL_CENTRE = {x: 46, y: 44} as const;
const FULL = 0.999;

export type LampGains = {readonly r: number; readonly g: number; readonly b: number};

/** Pure: per-channel gains for a lamp intensity 0-1 (1 = neutral, the lamp at full). */
export const lampGains = (intensity: number): LampGains => {
  const i = Math.min(1, Math.max(0, intensity));
  const warm = (1 - i) ** AMBER_CURVE;
  return {r: i, g: i * (1 - AMBER.green * warm), b: i * (1 - AMBER.blue * warm)};
};

const matrix = (g: LampGains): string => `${g.r} 0 0 0 0  0 ${g.g} 0 0 0  0 0 ${g.b} 0 0  0 0 0 1 0`;

export const LampUp: React.FC<{intensity: number; id: string; children: React.ReactNode}> = ({intensity, id, children}) => {
  if (intensity >= FULL) return <AbsoluteFill>{children}</AbsoluteFill>;
  const pool = POOL_DARKNESS * (1 - intensity);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
        <filter id={id} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
          <feColorMatrix type="matrix" values={matrix(lampGains(intensity))} />
        </filter>
      </svg>
      <AbsoluteFill style={{filter: `url(#${id})`}}>
        {children}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 62% 70% at ${POOL_CENTRE.x}% ${POOL_CENTRE.y}%, rgba(0,0,0,0) 0%, rgba(0,0,0,${(pool * 0.35).toFixed(3)}) 55%, rgba(0,0,0,${pool.toFixed(3)}) 100%)`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
