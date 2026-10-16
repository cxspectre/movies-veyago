// FilmGrain.tsx — BIBLE 2.3's film grain over the whole paper-world frame: about 2.5% luminance, ~2 px, re-seeded
// every frame (deterministically from the frame number). One tiled grayscale texture at low normal-blend opacity,
// shifted per frame: no blend modes, no per-pixel work.
import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {textureUrl} from '../../paper';

/** Opacity of the grayscale grain layer: +-2.5% luminance around the frame's own values. */
const GRAIN_OPACITY = 0.05;
/** Tile size in logical px: the tooth's 1-2 texel features become ~2 px grain. */
const GRAIN_TILE = 1100;

export const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const x = Math.floor(random(`grain-x-${frame}`) * GRAIN_TILE);
  const y = Math.floor(random(`grain-y-${frame}`) * GRAIN_TILE);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${textureUrl('tooth')})`,
        backgroundSize: `${GRAIN_TILE}px ${GRAIN_TILE}px`,
        backgroundPosition: `${-x}px ${-y}px`,
        opacity: GRAIN_OPACITY,
        pointerEvents: 'none',
      }}
    />
  );
};
