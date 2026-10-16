// CoffeeCup.tsx — a white ceramic cup of black coffee seen from directly above: rim, inner wall lit on the far
// side, the coffee's dark surface with the lamp's reflection, a handle; the table's cast shadow plus a tight contact
// shadow under the base. `setDown` 0-1 lowers it onto the desk: the shadow converges and sharpens as it lands.
import React, {useId} from 'react';
import {blurDeviation, DESK_PALETTE, liftedShadow, SHADOWS, shadowRgba} from '../palette';
import {PropSvg} from './Placed';

export type CoffeeCupProps = {
  /** Rim radius, px (BIBLE: 70 wide, 62 tall). */
  readonly r?: number;
  /** Where the handle points, degrees clockwise from +x. */
  readonly handleAngle?: number;
  /** 0 = held well above the desk, 1 = resting on it. Default 1. */
  readonly setDown?: number;
  /** How high it starts, px, at setDown 0. */
  readonly liftHeight?: number;
  readonly style?: React.CSSProperties;
};

const WALL = 0.11;
const COFFEE = 0.8;
const BASE = 0.86;
const HANDLE_REACH = 0.52;
const HANDLE_WIDTH = 0.2;
const LIFT_HEIGHT = 60;

export type CupSetDownState = {readonly height: number; readonly scale: number};

/** Pure: height above the desk and on-screen scale for a set-down progress (0 up .. 1 down), eased to land softly. */
export const cupSetDownState = (progress: number, liftHeight = LIFT_HEIGHT): CupSetDownState => {
  const k = Math.min(1, Math.max(0, progress));
  const eased = 1 - (1 - k) ** 3;
  const height = liftHeight * (1 - eased);
  return {height, scale: 1 + height * 0.0012};
};

export const CoffeeCup: React.FC<CoffeeCupProps> = ({r = 70, handleAngle = 12, setDown = 1, liftHeight = LIFT_HEIGHT, style}) => {
  const id = useId();
  const C = DESK_PALETTE.cup;
  const state = cupSetDownState(setDown, liftHeight);
  const cast = liftedShadow(SHADOWS.cup, {height: state.height});
  const contact = liftedShadow(SHADOWS.cupContact, {height: state.height, opacityScale: 1 / (1 + state.height / 12)});
  const inner = r * (1 - WALL);
  const coffee = r * COFFEE;
  const hx = Math.cos((handleAngle * Math.PI) / 180);
  const hy = Math.sin((handleAngle * Math.PI) / 180);
  // From directly above a handle is a bar: the loop's plane is vertical, so only its top shows.
  const handle = `M${(r * 0.9 * hx).toFixed(2)} ${(r * 0.9 * hy).toFixed(2)} L${(r * (1 + HANDLE_REACH) * hx).toFixed(2)} ${(r * (1 + HANDLE_REACH) * hy).toFixed(2)}`;
  const ids = {body: `cup-body-${id}`, rim: `cup-rim-${id}`, wall: `cup-wall-${id}`, coffee: `cup-coffee-${id}`, gleam: `cup-gleam-${id}`};
  return (
    <PropSvg style={style}>
      <defs>
        <radialGradient id={ids.body} cx="0.36" cy="0.34" r="0.75">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.55" stopColor={C.ceramic} />
          <stop offset="1" stopColor={C.ceramicShade} />
        </radialGradient>
        <linearGradient id={ids.wall} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B9B1A5" />
          <stop offset="0.5" stopColor="#D6CFC3" />
          <stop offset="1" stopColor="#F4F0E8" />
        </linearGradient>
        <radialGradient id={ids.coffee} cx="0.34" cy="0.32" r="0.8">
          <stop offset="0" stopColor={C.coffeeLight} />
          <stop offset="0.35" stopColor={C.coffee} />
          <stop offset="1" stopColor="#2A1810" />
        </radialGradient>
        <radialGradient id={ids.gleam} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF4E4" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FFF4E4" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* Cast shadow of the base and the handle, then the tight contact ring. */}
      <g style={{filter: `blur(${blurDeviation(cast.blur)}px)`}} opacity={cast.opacity} fill={shadowRgba(cast.color, 1)}>
        <circle cx={cast.x} cy={cast.y} r={r * BASE} />
        <path d={handle} transform={`translate(${cast.x} ${cast.y})`} fill="none" stroke={shadowRgba(cast.color, 1)} strokeWidth={r * HANDLE_WIDTH} strokeLinecap="round" />
      </g>
      <g style={{filter: `blur(${blurDeviation(contact.blur)}px)`}} opacity={contact.opacity}>
        <circle cx={contact.x} cy={contact.y} r={r * BASE + 1} fill={shadowRgba(contact.color, 1)} />
      </g>
      <g transform={`scale(${state.scale.toFixed(4)})`}>
        {/* Handle (under the rim's edge): a rounded bar, its top lit, its lower-right edge in shade. */}
        <path d={handle} fill="none" stroke={DESK_PALETTE.graphite} strokeOpacity={0.3} strokeWidth={r * HANDLE_WIDTH + 1.6} strokeLinecap="round" />
        <path d={handle} fill="none" stroke={C.ceramicShade} strokeWidth={r * HANDLE_WIDTH} strokeLinecap="round" />
        <path d={handle} fill="none" stroke={C.ceramic} strokeWidth={r * HANDLE_WIDTH * 0.66} strokeLinecap="round" transform="translate(-1 -1.2)" />
        <path d={handle} fill="none" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={r * HANDLE_WIDTH * 0.2} strokeLinecap="round" transform="translate(-2 -2.4)" />
        {/* Body and rim. */}
        <circle r={r} fill={`url(#${ids.body})`} />
        <circle r={r} fill="none" stroke={DESK_PALETTE.graphite} strokeOpacity={0.32} strokeWidth={1} />
        <circle r={inner} fill={`url(#${ids.wall})`} />
        <circle r={inner} fill="none" stroke={DESK_PALETTE.graphite} strokeOpacity={0.22} strokeWidth={0.8} />
        {/* The rim's top catches the lamp on the upper left. */}
        <path d={`M${(-r * 0.93).toFixed(2)} ${(r * 0.1).toFixed(2)} A ${r * 0.94} ${r * 0.94} 0 0 1 ${(r * 0.1).toFixed(2)} ${(-r * 0.93).toFixed(2)}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.75} strokeWidth={r * 0.045} strokeLinecap="round" />
        {/* Coffee, its meniscus and the lamp's reflection. */}
        <circle r={coffee} fill={`url(#${ids.coffee})`} />
        <circle r={coffee - 0.6} fill="none" stroke="#6A4A34" strokeOpacity={0.45} strokeWidth={1} />
        <ellipse cx={-coffee * 0.42} cy={-coffee * 0.44} rx={coffee * 0.26} ry={coffee * 0.2} fill={`url(#${ids.gleam})`} transform={`rotate(-30 ${-coffee * 0.42} ${-coffee * 0.44})`} />
      </g>
    </PropSvg>
  );
};
