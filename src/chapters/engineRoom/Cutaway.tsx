// Cutaway.tsx — the big phone of chapter 7 as a technical cutaway (BIBLE4 §5.7): the outline is drawn (0.0-3.0), the
// front face peels open on a hinge at its left edge (rotateY 0 → -85°, 3.0-6.0), the floor lines and labels draw;
// at the end the face folds back (72.0-73.5) and the whole drawing flattens to its outline (73.5-75.0). The rooms
// are children: they sit behind the face and fade with the flatten.
import React from 'react';
import {engineRoom as B} from '../../beats4';
import {COLORS} from '../../film';
import {DEFAULT_LAMP, castShadow, handLine, handRect} from '../../paper';
import {Layer, clamp01, easeInOutCubic, smooth} from '../nameAndLook/draw';
import {FLOOR_LABELS, FLOOR_Y, LABEL_X, PHONE, PHONE_TL, REGION_SIZE, toRegion} from './layout';

/**
 * The outline as SVG, not a pencil page: at the overview zoom (0.45) a 3 px engine line develops below the paper's
 * tooth and vanishes; this one keeps at least 1.4 screen px (BIBLE4 §1.1: never thinner than 1 screen px).
 */
const OUTLINE_ROUGH = handRect(0, 0, PHONE.w, PHONE.h, 7002, {radius: PHONE.r, overshoot: 14});
const OUTLINE_CLEAN = handRect(0, 0, PHONE.w, PHONE.h, 7001, {radius: PHONE.r, overshoot: 10});
const Outline: React.FC<{t: number; zoom: number}> = ({t, zoom}) => {
  const k = clamp01((t - B.outline.from) / (B.outline.to - B.outline.from));
  if (k <= 0) return null;
  const [x, y] = toRegion(PHONE_TL);
  const w = Math.max(3, 1.4 / zoom);
  return (
    <svg style={{position: 'absolute', left: x, top: y, width: 1, height: 1, overflow: 'visible'}}>
      <path d={OUTLINE_ROUGH} fill="none" stroke={COLORS.graphiteSoft} strokeOpacity={0.35} strokeWidth={w * 0.8} strokeLinecap="round" pathLength={1} strokeDasharray={`${clamp01(k * 1.4)} 1`} />
      <path d={OUTLINE_CLEAN} fill="none" stroke={COLORS.graphite} strokeOpacity={0.88} strokeWidth={w} strokeLinecap="round" pathLength={1} strokeDasharray={`${clamp01(k * 1.15 - 0.15)} 1`} />
    </svg>
  );
};

/** The face's own drawing: the screen inset and the island, light graphite (SVG; it rides the 3D panel). */
const FACE_LINES = [
  handRect(46, 46, PHONE.w - 92, PHONE.h - 92, 7010, {radius: PHONE.r - 40, overshoot: 4}),
  handRect(PHONE.w / 2 - 110, 78, 220, 56, 7011, {radius: 28, overshoot: 3}),
];

const peelAngle = (t: number): number => {
  const open = easeInOutCubic((t - B.slice.from) / (B.slice.to - B.slice.from - 0.5));
  const close = easeInOutCubic((t - B.close.fold.from) / (B.close.fold.to - B.close.fold.from));
  return -85 * open * (1 - close);
};

const Face: React.FC<{t: number}> = ({t}) => {
  if (t < B.outline.to - 0.5) return null;
  const [x, y] = toRegion(PHONE_TL);
  const angle = peelAngle(t);
  const appear = smooth((t - (B.outline.to - 0.5)) / 0.5);
  const gone = smooth((t - B.close.flatten.from) / (B.close.flatten.to - B.close.flatten.from));
  const lift = Math.min(1, Math.abs(angle) / 30);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: PHONE.w, height: PHONE.h, perspective: 2600, perspectiveOrigin: '0 50%'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: PHONE.r,
          background: `rgb(${247 - 30 * lift}, ${243 - 30 * lift}, ${234 - 28 * lift})`,
          transformOrigin: '0 50%',
          transform: `rotateY(${angle}deg)`,
          boxShadow: lift > 0.02 ? castShadow(DEFAULT_LAMP, {height: 8 + 30 * lift}) : 'none',
          // seen edge-on once open: it goes as it passes -55° (and comes back as it closes)
          opacity: appear * (1 - gone) * (1 - smooth((Math.abs(angle) - 55) / 25)),
        }}
      >
        <svg width={PHONE.w} height={PHONE.h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {FACE_LINES.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={COLORS.graphite} strokeOpacity={0.55} strokeWidth={2} strokeLinecap="round" />
          ))}
        </svg>
      </div>
    </div>
  );
};

const FloorLines: React.FC<{t: number}> = ({t}) => {
  const k = clamp01((t - 4.5) / 1.0);
  const lk = clamp01((t - 5.0) / 1.0);
  if (k <= 0) return null;
  const [x0] = toRegion([PHONE_TL[0], 0]);
  return (
    <Layer>
      {FLOOR_Y.map((sy, i) => {
        const [, y] = toRegion([0, sy]);
        return <path key={i} d={handLine(x0 + 6, y, x0 + PHONE.w - 6, y + 1, 7020 + i, {bow: 2})} fill="none" stroke={COLORS.graphite} strokeOpacity={0.8} strokeWidth={2.4} strokeLinecap="round" pathLength={1} strokeDasharray={`${k} 1`} />;
      })}
      {FLOOR_LABELS.map((l, i) => {
        const [lx, ly] = toRegion([LABEL_X, l.y]);
        const a = smooth((lk - i * 0.25) / 0.4);
        return a > 0 ? (
          <text key={l.text} x={lx} y={ly} textAnchor="end" fontSize={30} fill={COLORS.graphite} opacity={a * 0.9} style={{fontFamily: 'Patrick Hand'}}>
            {l.text}
          </text>
        ) : null;
      })}
    </Layer>
  );
};

/** The cutaway: outline, rooms (children), floor lines, the peeling face on top. */
export const Cutaway: React.FC<{t: number; zoom: number; children: React.ReactNode}> = ({t, zoom, children}) => {
  const flatten = smooth((t - B.close.flatten.from) / (B.close.flatten.to - B.close.flatten.from));
  const inside = smooth((t - B.slice.from) / 0.8);
  return (
    <>
      <Outline t={t} zoom={zoom} />
      <div style={{position: 'absolute', left: 0, top: 0, width: REGION_SIZE.w, height: REGION_SIZE.h, opacity: inside * (1 - 0.72 * flatten)}}>
        <FloorLines t={t} />
        {children}
      </div>
      <Face t={t} />
    </>
  );
};
