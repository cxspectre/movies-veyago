// DeskSurface.tsx — the full-frame pale oak desk under a one-sided daylight lamp, with falloff and a faint vignette.
// Children are laid ON the desk and share its light (falloff + vignette sit above them).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {DEFAULT_LAMP, type Lamp, lampTint, lampVector, shade} from './lamp';
import {TEXTURES, textureUrl} from './textures';

export type DeskSurfaceProps = {
  readonly lamp?: Lamp;
  /** Scale of the wood texture (1 = the desk as seen in the wide desk shot; >1 when the camera is closer). */
  readonly textureScale?: number;
  /** Pan of the wood under the camera, logical px (for camera moves). */
  readonly pan?: {x: number; y: number};
  /** Light falloff away from the lamp (opacity of warm shade at the far side), 0-1. Default 0.22. */
  readonly falloff?: number;
  /** Vignette darkness, 0-1. Default 0.22. */
  readonly vignette?: number;
  readonly style?: React.CSSProperties;
  readonly children?: React.ReactNode;
};

const overlay: React.CSSProperties = {position: 'absolute', inset: 0, pointerEvents: 'none'};

/** Where the lamp's hot spot sits, in % of the frame (off-frame on the lamp side). */
const hotSpot = (lamp: Lamp): {x: number; y: number} => {
  const v = lampVector(lamp);
  return {x: 50 + v.x * 62, y: 50 + v.y * 70};
};

export const DeskSurface: React.FC<DeskSurfaceProps> = ({
  lamp = DEFAULT_LAMP,
  textureScale = 1,
  pan = {x: 0, y: 0},
  falloff = 0.22,
  vignette = 0.22,
  style,
  children,
}) => {
  const tile = TEXTURES.desk.logical * textureScale;
  const hs = hotSpot(lamp);
  return (
    <AbsoluteFill style={{backgroundColor: '#CDB48F', overflow: 'hidden', isolation: 'isolate', ...style}}>
      <AbsoluteFill
        style={{
          backgroundImage: `url(${textureUrl('desk')})`,
          backgroundSize: `${tile}px ${tile}px`,
          backgroundPosition: `${-pan.x}px ${-pan.y}px`,
        }}
      />
      {children}
      <div
        style={{
          ...overlay,
          background: `radial-gradient(ellipse 125% 120% at ${hs.x}% ${hs.y}%, ${shade(0)} 0%, ${shade(0)} 22%, ${shade(falloff * 0.5)} 62%, ${shade(falloff)} 100%)`,
        }}
      />
      <div
        style={{
          ...overlay,
          background: `radial-gradient(ellipse 90% 90% at ${hs.x}% ${hs.y}%, ${lampTint(lamp, 0.1)} 0%, ${lampTint(lamp, 0)} 70%)`,
        }}
      />
      <div
        style={{
          ...overlay,
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, ${shade(0)} 55%, ${shade(vignette)} 120%)`,
        }}
      />
    </AbsoluteFill>
  );
};
