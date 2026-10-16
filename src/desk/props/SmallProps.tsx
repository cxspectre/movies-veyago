// SmallProps.tsx — the eraser, the sticky-note pad and the face-down phone: flat things with the table's shadows.
import React, {useId} from 'react';
import {DESK_PALETTE, dropShadowOf, liftedShadow, SHADOWS} from '../palette';
import {PropSvg} from './Placed';

type SizeProps = {readonly w?: number; readonly h?: number; readonly style?: React.CSSProperties};

/** A white vinyl eraser, slightly used at one end. Centred; BIBLE 60x24. */
export const Eraser: React.FC<SizeProps> = ({w = 60, h = 24, style}) => {
  const id = useId();
  const E = DESK_PALETTE.eraser;
  const grad = `eraser-${id}`;
  const smudge = `eraser-smudge-${id}`;
  return (
    <PropSvg style={{filter: dropShadowOf(SHADOWS.eraser), ...style}}>
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FBFAF7" />
          <stop offset="0.6" stopColor={E.rubber} />
          <stop offset="1" stopColor={E.rubberShade} />
        </linearGradient>
        <radialGradient id={smudge} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={E.smudge} stopOpacity={0.5} />
          <stop offset="1" stopColor={E.smudge} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.18} fill={`url(#${grad})`} />
      {/* The side faces catch a sliver of shade on the lower right. */}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.18} fill="none" stroke={E.rubberShade} strokeWidth={1.2} strokeOpacity={0.6} transform="translate(0.6 0.8)" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.18} fill="none" stroke="#FFFFFF" strokeWidth={0.8} strokeOpacity={0.6} transform="translate(-0.4 -0.5)" />
      <ellipse cx={w * 0.34} cy={0} rx={w * 0.16} ry={h * 0.46} fill={`url(#${smudge})`} />
    </PropSvg>
  );
};

/** A pad of sticky notes (BIBLE 110x110): the top note's face and the pad's lip on its lower and right edges. */
export const StickyPad: React.FC<SizeProps & {readonly thickness?: number}> = ({w = 110, h = 110, thickness = 4, style}) => {
  const shadow = liftedShadow(SHADOWS.sticky, {height: thickness});
  const lip = Math.max(2, thickness * 0.8);
  return (
    <PropSvg style={{filter: dropShadowOf(shadow), ...style}}>
      <rect x={-w / 2 + lip} y={-h / 2 + lip} width={w} height={h} fill={DESK_PALETTE.stickyLip} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={DESK_PALETTE.stickyFace} />
      {/* The adhesive strip along the top shows as a faintly deeper band; the lamp lifts the upper left. */}
      <rect x={-w / 2} y={-h / 2} width={w} height={h * 0.16} fill="#000" fillOpacity={0.035} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="none" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={1} transform="translate(-0.4 -0.4)" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="none" stroke={DESK_PALETTE.stickyLip} strokeOpacity={0.7} strokeWidth={1} transform="translate(0.5 0.5)" />
    </PropSvg>
  );
};

/** A generic phone lying face down: matte dark back, a slim metal rim, a soft camera plateau, no badge. BIBLE 78x160. */
export const FaceDownPhone: React.FC<SizeProps> = ({w = 78, h = 160, style}) => {
  const id = useId();
  const P = DESK_PALETTE.phone;
  const grad = `phone-back-${id}`;
  const plateau = `phone-plateau-${id}`;
  const r = w * 0.18;
  const pw = w * 0.4;
  const px = -w / 2 + w * 0.1;
  const py = -h / 2 + w * 0.1;
  return (
    <PropSvg style={{filter: dropShadowOf(SHADOWS.phone), ...style}}>
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.backLight} />
          <stop offset="0.45" stopColor={P.back} />
          <stop offset="1" stopColor="#262930" />
        </linearGradient>
        <linearGradient id={plateau} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4C515A" />
          <stop offset="1" stopColor={P.plateau} />
        </linearGradient>
      </defs>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} fill={`url(#${grad})`} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} fill="none" stroke={P.rim} strokeWidth={1.4} strokeOpacity={0.9} />
      <rect x={-w / 2 + 1.4} y={-h / 2 + 1.4} width={w - 2.8} height={h - 2.8} rx={r - 1.2} fill="none" stroke="#1C1F24" strokeWidth={0.8} strokeOpacity={0.7} />
      {/* A raised plateau in the top-left corner, its upper-left edge lit, its lower-right in shade; two quiet lenses. */}
      <rect x={px + 0.8} y={py + 1} width={pw} height={pw} rx={pw * 0.28} fill="#1A1D22" fillOpacity={0.7} />
      <rect x={px} y={py} width={pw} height={pw} rx={pw * 0.28} fill={`url(#${plateau})`} />
      <rect x={px} y={py} width={pw} height={pw} rx={pw * 0.28} fill="none" stroke="#7A808A" strokeWidth={0.7} strokeOpacity={0.55} transform="translate(-0.3 -0.3)" />
      <circle cx={px + pw * 0.32} cy={py + pw * 0.32} r={pw * 0.16} fill={P.lens} />
      <circle cx={px + pw * 0.32} cy={py + pw * 0.68} r={pw * 0.16} fill={P.lens} />
      <circle cx={px + pw * 0.28} cy={py + pw * 0.28} r={pw * 0.035} fill="#FFFFFF" fillOpacity={0.5} />
      <circle cx={px + pw * 0.28} cy={py + pw * 0.64} r={pw * 0.035} fill="#FFFFFF" fillOpacity={0.5} />
    </PropSvg>
  );
};
