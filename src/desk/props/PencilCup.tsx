// PencilCup.tsx — a matte charcoal stoneware cup from above, with three pencils standing tip-down and leaning on
// the rim: the graphite pencil (pink eraser end), the accent pencil and a spare. Their visible ends are the
// foreshortened bodies rising out of the cup's dark interior.
import React, {useId} from 'react';
import {blurDeviation, DESK_PALETTE, SHADOWS, shadowRgba} from '../palette';
import type {PencilKind} from './pencilArt';
import {PropSvg} from './Placed';

export type PencilCupProps = {
  /** Rim radius, px (BIBLE: 60 wide, 52 tall). */
  readonly r?: number;
  /** Which pencils stand in it (first = frontmost); omit the one in the hand. */
  readonly pencils?: readonly PencilKind[];
  readonly style?: React.CSSProperties;
};

const WALL = 0.1;
const LEAN_ANGLES = [-118, -62, 14] as const;
const P = DESK_PALETTE.pencil;

const endColours = (kind: PencilKind): {light: string; body: string; dark: string; end: string; endDark: string; ferrule: boolean} =>
  kind === 'accent'
    ? {light: P.accentLight, body: P.accentBody, dark: P.accentDark, end: P.accentDark, endDark: '#16307F', ferrule: false}
    : kind === 'graphite'
      ? {light: P.bodyLight, body: P.body, dark: P.bodyDark, end: P.eraser, endDark: P.eraserDark, ferrule: true}
      : {light: P.finelinerLight, body: P.fineliner, dark: '#141416', end: P.finelinerCap, endDark: '#1E3C9E', ferrule: false};

/** One pencil leaning out of the cup along `angle`: drawn from inside the cup to past the rim, in shade near the bottom. */
const LeaningPencil: React.FC<{kind: PencilKind; angle: number; r: number; id: string; i: number}> = ({kind, angle, r, id, i}) => {
  const c = endColours(kind);
  const w = r * 0.15;
  const from = r * 0.25;
  const to = r * 1.32;
  const endLen = r * 0.12;
  const shadeId = `${id}-shade-${i}`;
  return (
    <g transform={`rotate(${angle})`}>
      <defs>
        <linearGradient id={shadeId} gradientUnits="userSpaceOnUse" x1={from} y1={0} x2={r} y2={0}>
          <stop offset="0" stopColor="#000" stopOpacity={0.78} />
          <stop offset="0.7" stopColor="#000" stopOpacity={0.25} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* Three facets along the body, then the ferrule and the end. */}
      <rect x={from} y={-w / 2} width={to - from - endLen} height={w * 0.28} fill={c.light} />
      <rect x={from} y={-w / 2 + w * 0.28} width={to - from - endLen} height={w * 0.44} fill={c.body} />
      <rect x={from} y={w / 2 - w * 0.28} width={to - from - endLen} height={w * 0.28} fill={c.dark} />
      {c.ferrule ? (
        <>
          <rect x={to - endLen - r * 0.14} y={-w / 2} width={r * 0.14} height={w} fill={P.ferrule} />
          <rect x={to - endLen - r * 0.14} y={-w / 2} width={r * 0.14} height={w * 0.35} fill={P.ferruleLight} />
          <rect x={to - endLen - r * 0.14} y={w / 2 - w * 0.3} width={r * 0.14} height={w * 0.3} fill={P.ferruleDark} />
        </>
      ) : null}
      <rect x={to - endLen} y={-w / 2} width={endLen} height={w} rx={w * 0.3} fill={c.end} />
      <rect x={to - endLen} y={w * 0.1} width={endLen} height={w * 0.4} rx={w * 0.2} fill={c.endDark} opacity={0.8} />
      <rect x={from} y={-w / 2} width={to - from} height={w} fill={`url(#${shadeId})`} />
    </g>
  );
};

export const PencilCup: React.FC<PencilCupProps> = ({r = 60, pencils = ['graphite', 'accent', 'graphite'], style}) => {
  const id = useId();
  const K = DESK_PALETTE.pencilCup;
  const cast = SHADOWS.cup;
  const contact = SHADOWS.cupContact;
  const inner = r * (1 - WALL);
  const ids = {body: `pcup-body-${id}`, inside: `pcup-inside-${id}`};
  return (
    <PropSvg style={style}>
      <defs>
        <radialGradient id={ids.body} cx="0.36" cy="0.34" r="0.75">
          <stop offset="0" stopColor={K.rimLight} />
          <stop offset="0.6" stopColor={K.rim} />
          <stop offset="1" stopColor={K.body} />
        </radialGradient>
        <linearGradient id={ids.inside} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#141317" />
          <stop offset="0.6" stopColor={K.inside} />
          <stop offset="1" stopColor="#3B393F" />
        </linearGradient>
      </defs>
      <g style={{filter: `blur(${blurDeviation(cast.blur)}px)`}} opacity={cast.opacity}>
        <circle cx={cast.x} cy={cast.y} r={r * 0.92} fill={shadowRgba(cast.color, 1)} />
      </g>
      <g style={{filter: `blur(${blurDeviation(contact.blur)}px)`}} opacity={contact.opacity}>
        <circle cx={contact.x} cy={contact.y} r={r * 0.93} fill={shadowRgba(contact.color, 1)} />
      </g>
      <circle r={r} fill={`url(#${ids.body})`} />
      <circle r={r} fill="none" stroke="#1A191C" strokeOpacity={0.5} strokeWidth={0.8} />
      <circle r={inner} fill={`url(#${ids.inside})`} />
      <path d={`M${(-r * 0.93).toFixed(2)} ${(r * 0.1).toFixed(2)} A ${r * 0.95} ${r * 0.95} 0 0 1 ${(r * 0.1).toFixed(2)} ${(-r * 0.93).toFixed(2)}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.28} strokeWidth={r * 0.04} strokeLinecap="round" />
      {/* Pencils: their shadows fall on the rim and the desk where they stick out, then the pencils. */}
      <g style={{filter: `blur(${blurDeviation(SHADOWS.pencil.blur)}px)`}} opacity={SHADOWS.pencil.opacity * 0.8} transform={`translate(${SHADOWS.pencil.x} ${SHADOWS.pencil.y})`}>
        {pencils.map((kind, i) => (
          <g key={i} transform={`rotate(${LEAN_ANGLES[i % LEAN_ANGLES.length]})`}>
            <rect x={r * 0.98} y={-r * 0.075} width={r * 0.34} height={r * 0.15} fill={shadowRgba(SHADOWS.pencil.color, 1)} />
          </g>
        ))}
      </g>
      {pencils.map((kind, i) => (
        <LeaningPencil key={i} kind={kind} angle={LEAN_ANGLES[i % LEAN_ANGLES.length] as number} r={r} id={id} i={i} />
      ))}
    </PropSvg>
  );
};
