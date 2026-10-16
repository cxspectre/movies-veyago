// PaperCard.tsx — the end card's ground: the paper itself, flat (no lamp, no sheet edge), off-white with the engine's
// paper texture at 10% tooth and a 0.10 vignette (BIBLE section 3). Normal blending only.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {COLORS} from '../../film';
import {TEXTURES, textureUrl} from '../../paper';
import {END_CARD} from './tokens';

/** The albedo carries the sheets' full tooth; laid over flat paper at this opacity it carries the card's. */
const TEXTURE_OPACITY = END_CARD.toothPercent / END_CARD.sheetToothPercent;

export const PaperCard: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{backgroundColor: COLORS.paper, overflow: 'hidden'}}>
    <AbsoluteFill
      style={{
        backgroundImage: `url(${textureUrl('paper')})`,
        backgroundSize: `${TEXTURES.paper.logical}px ${TEXTURES.paper.logical}px`,
        opacity: TEXTURE_OPACITY,
      }}
    />
    {children}
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse farthest-corner at 50% 50%, rgba(${END_CARD.vignetteRgb}, 0) ${END_CARD.vignetteClearRadius}%, rgba(${END_CARD.vignetteRgb}, ${END_CARD.vignette}) 100%)`,
        pointerEvents: 'none',
      }}
    />
  </AbsoluteFill>
);
