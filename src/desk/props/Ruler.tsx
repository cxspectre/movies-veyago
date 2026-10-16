// Ruler.tsx — a 300 mm clear acrylic ruler: the desk shows through it, its edges catch the lamp, black millimetre
// ticks along the top edge with centimetre numbers. Drawn centred, its length along +x. BIBLE 520x34 (wide).
import React, {useId} from 'react';
import {DESK_PALETTE, dropShadowOf, SHADOWS} from '../palette';
import {FONTS} from '../../film';
import {PropSvg} from './Placed';

export type RulerProps = {
  readonly w?: number;
  readonly h?: number;
  readonly mm?: number;
  readonly style?: React.CSSProperties;
};

const TICK_MM = {short: 0.16, mid: 0.26, long: 0.38} as const;
/** Ink opacities and the numeral size (fraction of the ruler's height): legible at the desk's 0.8 framing. */
const TICK_INK = {short: 0.7, mid: 0.82, long: 0.92, numeral: 0.9} as const;
const NUMERAL_SIZE = 0.36;

export const Ruler: React.FC<RulerProps> = ({w = 520, h = 34, mm = 300, style}) => {
  const id = useId();
  const R = DESK_PALETTE.ruler;
  const pxPerMm = w / mm;
  const patternId = `ruler-mm-${id}`;
  const x0 = -w / 2;
  const y0 = -h / 2;
  const margin = pxPerMm * 5;
  const cm = Array.from({length: Math.floor(mm / 10) + 1}, (_, i) => i);
  return (
    <PropSvg style={{filter: dropShadowOf(SHADOWS.ruler), ...style}}>
      <defs>
        <pattern id={patternId} x={x0 + margin} y={y0} width={pxPerMm} height={h} patternUnits="userSpaceOnUse">
          <rect x={0} y={0} width={0.6} height={h * TICK_MM.short} fill={R.tick} fillOpacity={TICK_INK.short} />
        </pattern>
      </defs>
      <rect x={x0} y={y0} width={w} height={h} rx={2} fill={R.plastic} />
      <rect x={x0} y={y0} width={w} height={h} rx={2} fill="none" stroke={R.edge} strokeWidth={1} transform="translate(-0.5 -0.5)" />
      <rect x={x0} y={y0} width={w} height={h} rx={2} fill="none" stroke={R.edgeShade} strokeWidth={1} transform="translate(0.5 0.5)" />
      {/* A bevel along the top edge that catches the lamp. */}
      <rect x={x0 + 2} y={y0 + 1} width={w - 4} height={1.2} fill="#FFFFFF" fillOpacity={0.5} />
      {/* Millimetre ticks, then the half- and full-centimetre ticks and the numbers. */}
      <rect x={x0 + margin} y={y0} width={w - margin * 2 + 0.5} height={h} fill={`url(#${patternId})`} />
      {cm.map((c) => {
        const x = x0 + margin + c * 10 * pxPerMm;
        return (
          <g key={c}>
            <rect x={x - 0.45} y={y0} width={0.9} height={h * TICK_MM.long} fill={R.tick} fillOpacity={TICK_INK.long} />
            {c < mm / 10 ? <rect x={x + 5 * pxPerMm - 0.4} y={y0} width={0.8} height={h * TICK_MM.mid} fill={R.tick} fillOpacity={TICK_INK.mid} /> : null}
            <text x={x} y={y0 + h * 0.8} fontFamily={FONTS.super} fontSize={h * NUMERAL_SIZE} fill={R.tick} fillOpacity={TICK_INK.numeral} textAnchor="middle">
              {c}
            </text>
          </g>
        );
      })}
    </PropSvg>
  );
};
