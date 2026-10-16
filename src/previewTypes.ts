import type React from 'react';

/** A standalone composition an owner registers for stills and review, without touching Root.tsx. */
export type PreviewSpec = {
  id: string;
  component: React.ComponentType;
  durationInFrames: number;
  width: number;
  height: number;
  fps?: number;
};
