// DockStarPatch.tsx — the dock's Emergency circle (the real pixels of the still, star and all) pinned onto the
// glass over the place the card lifts from, so the handoff frame matches the transition's last frame exactly and
// the star fades out as the card grows under it instead of vanishing on frame 0. DOM over the stage (no bloom; the
// screen's UI has none either).
import React from 'react';
import {staticFile} from 'remotion';
import {DOCK_EMERGENCY_PT, localToWorld, PHONE, projectToFrame, quadTransform, SCREEN_PT, screenPointToLocal, type Placement, type Rotation} from '../../devices';
import {BINDER_HOME_STILL} from '../transition/homeScreen';
import type {Size} from './layout';

export type DockStarPatchProps = {
  readonly placement: Placement;
  readonly rotation: Rotation;
  readonly fov: number;
  readonly size: Size;
  readonly alpha: number;
};

/** Just above the glass, in device units, so the patch sits where the card's start does. */
const GLASS_LIFT = 0.002;

type Pt = [number, number];

export const DockStarPatch: React.FC<DockStarPatchProps> = ({placement, rotation, fov, size, alpha}) => {
  if (alpha <= 0) return null;
  const d = DOCK_EMERGENCY_PT.diameter;
  const x0 = DOCK_EMERGENCY_PT.x - d / 2;
  const y0 = DOCK_EMERGENCY_PT.y - d / 2;
  const corner = (xPt: number, yPt: number): Pt => {
    const [lx, ly] = screenPointToLocal(xPt, yPt);
    const world = localToWorld({placement, rotation}, size, [lx, ly, PHONE.depth / 2 + GLASS_LIFT]);
    return projectToFrame(world, {...size, fov});
  };
  const quad: readonly [Pt, Pt, Pt, Pt] = [corner(x0, y0), corner(x0 + d, y0), corner(x0 + d, y0 + d), corner(x0, y0 + d)];
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: d,
        height: d,
        borderRadius: '50%',
        backgroundImage: `url(${staticFile(BINDER_HOME_STILL)})`,
        backgroundSize: `${SCREEN_PT.width}px ${SCREEN_PT.height}px`,
        backgroundPosition: `${-x0}px ${-y0}px`,
        transform: quadTransform(d, d, quad),
        transformOrigin: '0 0',
        opacity: alpha,
        pointerEvents: 'none',
      }}
    />
  );
};
