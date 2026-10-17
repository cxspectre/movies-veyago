// Invite.tsx — 60.0-68.0 (BIBLE4 §5.10): Maya drawn in light beside the phone, the tap, the hairline paper plane that
// leaves her hand, and the drawn notification card on the far phone. All screen space, over the stage.
import React, {useMemo} from 'react';
import {COLORS, FONTS, type FormatName} from '../../film';
import {LineCharacter} from '../../characters';
import {BLOOM, ease, hairlineGlowFilter, mix, rgba, windowProgress} from '../../glass';
import {paperToGlass as P} from '../../beats4';
import {INVITE, type Size} from './motion';

/** Maya is the paper's sepia; in the void she is drawn in light (the engine's graphite, turned to glassWhite). */
const LIGHT_FILTER = `invert(1) brightness(1.25) drop-shadow(0 0 ${BLOOM.radiusPx / 2}px rgba(159,180,255,0.45))`;
const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

export const mayaHand = (format: FormatName, size: Size): [number, number] => {
  const m = INVITE[format].maya;
  return [m.x * size.width + (format === 'tall' ? 0.05 : 0.07) * size.height, (m.y - m.height * 0.62) * size.height];
};
export const farPhoneTop = (format: FormatName, size: Size): [number, number] => {
  const f = INVITE[format].far;
  return [f.x * size.width, (f.y - f.height / 2) * size.height];
};

export const MayaInLight: React.FC<{t: number; format: FormatName; size: Size}> = ({t, format, size}) => {
  const m = INVITE[format].maya;
  const draw = windowProgress(P.invite.mayaIn, t, 'easeInOutSine');
  if (draw <= 0) return null;
  const scale = (m.height * size.height) / 420;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: size.width, height: size.height, filter: LIGHT_FILTER}}>
      <LineCharacter character="maya" pose="tap" ink="graphite" x={m.x * size.width} y={m.y * size.height} scale={scale} progress={draw} boil={0} rough={false} />
    </div>
  );
};

/** A hairline paper plane (a delta wing and its fold line), pointing along +x, about 1 unit long. */
const PLANE: readonly (readonly [number, number][])[] = [
  [[1, 0], [-0.7, -0.45], [-0.45, 0], [-0.7, 0.45], [1, 0]],
  [[1, 0], [-0.45, 0]],
  [[-0.45, 0], [-0.7, 0.12]],
];

export const PaperPlane: React.FC<{t: number; format: FormatName; size: Size}> = ({t, format, size}) => {
  const k = clamp01((t - P.invite.plane) / (P.invite.farPhoneLights - P.invite.plane));
  if (t < P.invite.plane || k >= 1) return null;
  const [x0, y0] = mayaHand(format, size);
  const [x1, y1] = farPhoneTop(format, size);
  const e = ease('easeInOutSine', k);
  const lift = (format === 'tall' ? 0.05 : 0.14) * size.height;
  // wide: an arc over the top; tall: the phone is in the way of a straight drop, so the plane swings out to the right around it
  const arc = (u: number): [number, number] =>
    format === 'tall'
      ? [mix(x0, x1, u) + Math.sin(Math.PI * u) * 0.36 * size.width, mix(y0, y1, u)]
      : [mix(x0, x1, u), mix(y0, y1, u) - Math.sin(Math.PI * u) * lift];
  const [px, py] = arc(e);
  const [qx, qy] = arc(Math.min(1, e + 0.01));
  const angle = (Math.atan2(qy - py, qx - px) * 180) / Math.PI;
  const unit = mix(70, 34, e);
  // a short trail of fading dashes behind it
  const trail = Array.from({length: 9}, (_, i) => {
    const u = Math.max(0, e - (i + 1) * 0.035);
    const [tx, ty] = arc(u);
    return {tx, ty, a: 0.5 * (1 - i / 9)};
  });
  const style = hairlineGlowFilter('graphite', 1, 1);
  return (
    <svg width={size.width} height={size.height} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {trail.map((d, i) => (
        <circle key={i} cx={d.tx} cy={d.ty} r={2} fill={rgba(COLORS.glassWhite, d.a)} />
      ))}
      <g transform={`translate(${px} ${py}) rotate(${angle}) scale(${unit})`} style={{filter: style}}>
        {PLANE.map((pts, i) => (
          <polyline key={i} points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={COLORS.glassWhite} strokeOpacity={0.95} strokeWidth={1.5 / unit} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </g>
    </svg>
  );
};

/** The far phone's lit lock screen: a drawn gradient with a faint banner slot where the card lands (no words on it). */
export const FarScreen: React.FC<{t: number; format: FormatName; size: Size}> = ({t, format, size}) => {
  const k = ease('easeInOutSine', (t - (P.invite.farPhoneLights - 0.5)) / 0.5);
  if (k <= 0) return null;
  const f = INVITE[format].far;
  const h = f.height * size.height;
  const w = h * 0.479 * 0.9;
  return (
    <div
      style={{
        position: 'absolute',
        left: f.x * size.width - w / 2,
        top: f.y * size.height - (h * 0.94) / 2,
        width: w,
        height: h * 0.94,
        borderRadius: w * 0.13,
        background: 'linear-gradient(170deg, rgba(60,78,150,0.9) 0%, rgba(24,30,64,0.95) 55%, rgba(12,14,28,0.98) 100%)',
        opacity: k,
        boxShadow: `inset 0 0 ${w * 0.15}px rgba(159,180,255,0.25)`,
      }}
    />
  );
};

/** The drawn notification card over the far phone: glass type on a hairline-edged card. */
export const NotificationCard: React.FC<{t: number; format: FormatName; size: Size}> = ({t, format, size}) => {
  const k = ease('easeInOutSine', (t - P.invite.farPhoneLights) / 0.6);
  if (k <= 0) return null;
  const [cx, top] = farPhoneTop(format, size);
  const w = (format === 'tall' ? 0.7 : 0.25) * size.width;
  const h = (format === 'tall' ? 0.06 : 0.115) * size.height;
  const fontSize = format === 'tall' ? 34 : 34;
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - w / 2,
        top: top + 0.06 * (INVITE[format].far.height * size.height) + (1 - k) * 14,
        width: w,
        height: h,
        borderRadius: 22,
        border: `1.5px solid ${rgba(COLORS.glassWhite, 0.55 * k)}`,
        background: rgba('#0B0B0C', 0.9 * k),
        boxShadow: `0 0 ${BLOOM.radiusPx}px ${rgba('#9FB4FF', 0.3 * k)}`,
        opacity: k,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONTS.super,
        fontWeight: 500,
        fontSize,
        color: rgba(COLORS.glassWhite, 0.92),
      }}
    >
      {P.invite.card}
    </div>
  );
};

export const useInviteHand = (format: FormatName, size: Size): [number, number] => useMemo(() => mayaHand(format, size), [format, size]);
