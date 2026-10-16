// WarmGrade.tsx — the warmer light of back-to-desk (BIBLE §2.1): lamp #FFE2B8 pooling from the upper left, the
// whole frame graded +6% warmer, the vignette down to 0.12. Normal-blend overlays only (CONTRACT §12.3).
import React from 'react';
import {AbsoluteFill} from 'remotion';

/** Vignette darkness in back-to-desk (0.18 elsewhere on paper). */
export const WARM_VIGNETTE = 0.12;
/** The +6% warmth: a warm wash over the whole frame. */
const WARMTH = 0.06;
const WARM_RGB = '255, 196, 128';
/** The lamp's own colour pooling where it is strongest (upper left), fading across the desk. */
const LAMP_RGB = '255, 226, 184';
const LAMP_POOL = 0.1;

export const WarmGrade: React.FC = () => (
  <>
    <AbsoluteFill style={{background: `radial-gradient(ellipse 95% 95% at 12% 8%, rgba(${LAMP_RGB},${LAMP_POOL}) 0%, rgba(${LAMP_RGB},${(LAMP_POOL * 0.4).toFixed(3)}) 45%, rgba(${LAMP_RGB},0) 85%)`}} />
    <AbsoluteFill style={{backgroundColor: `rgba(${WARM_RGB},${WARMTH})`}} />
  </>
);
