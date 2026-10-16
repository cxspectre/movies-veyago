// Placed.tsx — puts a prop drawn around its own origin at a desk position with a rotation and scale.
import React from 'react';
import type {DeskPoint} from '../layout';

export type PlacedProps = {
  readonly centre: DeskPoint;
  /** Degrees, clockwise on screen. */
  readonly rotation?: number;
  readonly scale?: number;
  /** Extra offset in desk px (a scene nudging a prop). */
  readonly offset?: DeskPoint;
  readonly opacity?: number;
  readonly children?: React.ReactNode;
  readonly style?: React.CSSProperties;
};

export const Placed: React.FC<PlacedProps> = ({centre, rotation = 0, scale = 1, offset, opacity, children, style}) => (
  <div
    style={{
      position: 'absolute',
      left: centre.x + (offset?.x ?? 0),
      top: centre.y + (offset?.y ?? 0),
      width: 0,
      height: 0,
      transform: `rotate(${rotation}deg) scale(${scale})`,
      opacity,
      pointerEvents: 'none',
      ...style,
    }}
  >
    {children}
  </div>
);

/** A 0x0 SVG whose content overflows around the origin: every vector prop is drawn inside one of these. */
export const PropSvg: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', display: 'block', ...style}}>
    {children}
  </svg>
);
