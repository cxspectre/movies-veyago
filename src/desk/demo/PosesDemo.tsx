// PosesDemo.tsx — the hand poses on paper for review: `Hands-poses-wide` (all poses, small) and `Hands-closeup-wide`
// (the two hero poses, grip and rest, at the film's own scale).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {COLORS} from '../../film';
import {Pencil} from '../props/Pencil';
import {Hand} from '../hands/Hand';
import {POSES, type PoseName} from '../hands/poses';
import {PENCIL_GEOMETRY} from '../props/pencilArt';
import {SKETCH_PX_PER_MM} from '../palette';

const SHOWN: readonly PoseName[] = ['reach', 'grip', 'rest', 'steady', 'slide', 'lay', 'smooth', 'cupHold'];
const COLUMN = 240;
const ROTATION = -18;
const SMALL = 0.62;

export const POSES_DEMO_FRAMES = 30;

/** The pencil a grip pose holds, placed from the pose's pinch anchor. */
const gripPencil = (x: number, y: number, rotation: number, pxPerMm: number): React.ReactNode => {
  const pose = POSES.grip;
  if (!pose.pencil) return null;
  const g = PENCIL_GEOMETRY.graphite;
  const yaw = (Math.atan2(pose.pencil.dir.y, pose.pencil.dir.x) * 180) / Math.PI + rotation;
  const back = g.pinch * Math.cos((pose.pencil.tiltDeg * Math.PI) / 180) * pxPerMm;
  const tip = {x: x - Math.cos((yaw * Math.PI) / 180) * back, y: y - Math.sin((yaw * Math.PI) / 180) * back};
  return <Pencil x={tip.x} y={tip.y} yaw={yaw} tilt={pose.pencil.tiltDeg} shadow="held" pxPerMm={pxPerMm} />;
};

const Label: React.FC<{x: number; y: number; text: string}> = ({x, y, text}) => (
  <div style={{position: 'absolute', left: x - 100, top: y, width: 200, textAlign: 'center', fontFamily: 'DM Sans', fontSize: 22, color: COLORS.graphite}}>{text}</div>
);

export const PosesDemo: React.FC = () => (
  <AbsoluteFill style={{background: COLORS.paper}}>
    {SHOWN.map((name, i) => {
      const x = 120 + i * COLUMN;
      const y = 560;
      const pxPerMm = SKETCH_PX_PER_MM * SMALL;
      const anchor = name === 'grip' ? 'pinch' : 'palm';
      return (
        <React.Fragment key={name}>
          <Hand pose={name} x={x} y={y} anchor={anchor} rotation={ROTATION} pxPerMm={pxPerMm} held={name === 'grip' ? gripPencil(x, y, ROTATION, pxPerMm) : undefined} />
          <Label x={x} y={40} text={POSES[name].id} />
        </React.Fragment>
      );
    })}
  </AbsoluteFill>
);

const CLOSE: readonly {pose: PoseName; x: number; y: number; rotation: number; handed: 'right' | 'left'}[] = [
  {pose: 'grip', x: 520, y: 520, rotation: -22, handed: 'right'},
  {pose: 'rest', x: 1250, y: 420, rotation: -12, handed: 'right'},
  {pose: 'steady', x: 1750, y: 560, rotation: 14, handed: 'left'},
];

export const PosesCloseup: React.FC = () => (
  <AbsoluteFill style={{background: COLORS.paper}}>
    {CLOSE.map((c) => (
      <Hand
        key={c.pose}
        pose={c.pose}
        x={c.x}
        y={c.y}
        anchor={c.pose === 'grip' ? 'pinch' : 'palm'}
        rotation={c.rotation}
        handed={c.handed}
        held={c.pose === 'grip' ? gripPencil(c.x, c.y, c.rotation, SKETCH_PX_PER_MM) : undefined}
      />
    ))}
  </AbsoluteFill>
);
