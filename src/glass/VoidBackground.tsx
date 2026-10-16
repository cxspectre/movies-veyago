import React from 'react';
import {AbsoluteFill} from 'remotion';
import {VOID} from './tokens';

/** The glass world's backdrop: pure #000000, no vignette, no noise, no grain (BIBLE section 3). */
export const VoidBackground: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{backgroundColor: VOID}}>{children}</AbsoluteFill>
);
