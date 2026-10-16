// LayingHands.tsx — both pairs of hands laying the grid (BIBLE §2.11: A from the bottom, B from the right / the
// top-right), each trip one flat hand on top of the sheet it carries. Drawn at the tiles' scale, so a hand is the
// right size for an A3 sheet; the whole arm (forearm, elbow, upper arm widening toward the camera) runs on out of
// the frame along the forearm's own line.
import React from 'react';
import {PAIR_SIZE, SKETCH_PX_PER_MM} from '../../desk';
import {wall} from '../../beats';
import {FORMATS, type FormatName} from '../../film';
import {type ArmReach, reachMm} from './armReach';
import type {DropPlan} from './drops';
import {handFlight} from './flight';
import {tileScale} from './grid';
import {ReachingHand} from './ReachingArm';

/** Long enough to reach past the frame edge from anywhere in it at the widest the camera gets (the top of the rise). */
const layingReach = (format: FormatName, pair: 'A' | 'B'): ArmReach => {
  const {width, height} = FORMATS[format];
  return {lengthMm: reachMm(Math.hypot(width, height), tileScale(format) * wall.rise.scaleTo, SKETCH_PX_PER_MM * PAIR_SIZE[pair])};
};

export const LayingHands: React.FC<{readonly format: FormatName; readonly drops: readonly DropPlan[]; readonly t: number}> = ({format, drops, t}) => {
  const s = tileScale(format);
  const visible = drops.map((d) => ({d, h: handFlight(format, d, t)})).filter(({h}) => h.visible);
  if (visible.length === 0) return null;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transform: `scale(${s})`, transformOrigin: '0 0'}}>
      {visible.map(({d, h}) => (
        <ReachingHand
          key={d.tile}
          reach={layingReach(format, h.pair)}
          pose="lay"
          pair={h.pair}
          handed={h.handed}
          x={h.fingertips.x / s}
          y={h.fingertips.y / s}
          anchor="fingertips"
          rotation={h.rotation}
          lift={h.lift / s}
        />
      ))}
    </div>
  );
};
