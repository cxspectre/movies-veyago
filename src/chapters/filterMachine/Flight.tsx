// Flight.tsx — the card folded into a paper plane, flying home to Maya's house, and Maya looking up (BIBLE4 5.4, 47.0-50.5).
// This lives in the chapter's OVERLAY (screen space, placed with camera.toScreen): the house is 7000 sheet px from the machine,
// so the machine's region is culled long before the plane arrives. Maya is a small sepia figure at her table.
import React from 'react';
import {filterMachine as M} from '../../beats4';
import {COLORS} from '../../film';
import {LineCharacter} from '../../characters';
import {useChapter} from '../../kit';
import type {Point} from '../../sheet4';
import {clamp01, prog, smooth} from './hand';
import {TRAY} from './layout';

/** Where Maya sits (the sheet px of her ground point) and the plane's landing spot above the house. */
export const MAYA_AT: Point = [5400, 4250];
export const PLANE_END: Point = [5480, 3930];

const planeAt = (t: number): {p: Point; angle: number; u: number} => {
  const f = M.flyHome;
  const at = (tt: number): {p: Point; u: number} => {
    const u = smooth(smooth(prog(tt, f.from, f.to - f.from)));
    const x = TRAY.x + (PLANE_END[0] - TRAY.x) * u;
    const y = TRAY.y + (PLANE_END[1] - TRAY.y) * u - 620 * Math.sin(Math.PI * Math.min(1, u ** 0.7));
    return {p: [x, y], u};
  };
  const a = at(t);
  const b = at(t + 0.04);
  return {...a, angle: (Math.atan2(b.p[1] - a.p[1], b.p[0] - a.p[0]) * 180) / Math.PI};
};

/** A top-view paper plane, nose to the right, about 260 sheet px long. */
const Plane: React.FC = () => (
  <g>
    <path d="M -20 -4 L 150 0 L -60 66 L -86 50 Z" fill="rgba(42,36,28,0.2)" transform="translate(12 18)" />
    <path d="M -90 -58 L 150 0 L -34 -8 Z" fill="#FBF8EF" stroke={COLORS.graphite} strokeWidth={2.4} strokeOpacity={0.85} strokeLinejoin="round" />
    <path d="M -90 58 L 150 0 L -34 8 Z" fill="#E4DCC8" stroke={COLORS.graphite} strokeWidth={2.4} strokeOpacity={0.85} strokeLinejoin="round" />
    <path d="M -34 -8 L 150 0 L -34 8 L -64 0 Z" fill="#F3EEE3" stroke={COLORS.graphite} strokeWidth={2.4} strokeOpacity={0.85} strokeLinejoin="round" />
  </g>
);

export const Flight: React.FC = () => {
  const {t, camera} = useChapter('filterMachine');
  const {toScreen, zoom} = camera;
  const f = M.flyHome;
  const planeOn = t >= f.from + 0.3 && t < M.mayaLooksUp.to + 0.4;
  const plane = planeAt(t);
  const fadeOut = 1 - smooth(prog(t, M.mayaLooksUp.from, 0.5));
  const [sx, sy] = toScreen(plane.p);
  const [mx, my] = toScreen(MAYA_AT);
  const mayaDraw = clamp01((t - (M.mayaLooksUp.from - 1.2)) / 0.8);
  const swap = clamp01((t - M.mayaLooksUp.from) / (M.mayaLooksUp.to - M.mayaLooksUp.from));
  return (
    <>
      {planeOn ? (
        <svg style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible'}}>
          <g transform={`translate(${sx} ${sy}) rotate(${plane.angle}) scale(${zoom * 1.1})`} opacity={fadeOut * smooth(prog(t, f.from + 0.3, 0.2))}>
            <Plane />
          </g>
        </svg>
      ) : null}
      {t >= M.mayaLooksUp.from - 1.2 && t < M.leap.to ? (
        <div style={{position: 'absolute', left: mx, top: my, width: 1, height: 1, transform: `scale(${zoom})`, transformOrigin: '0 0'}}>
          <LineCharacter
            character="maya"
            pose={swap > 0 ? 'look-up' : 'sit-A'}
            swapFrom={swap > 0 ? 'sit-A' : undefined}
            swapProgress={swap > 0 ? swap : undefined}
            x={0}
            y={0}
            scale={0.8}
            progress={mayaDraw}
            zoom={zoom}
          />
        </div>
      ) : null}
    </>
  );
};
