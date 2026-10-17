// TitleType.tsx — "Provisum" letter by letter and the subline, DM Sans on glass (BIBLE section 3 and 6.1), as SVG
// text so baselines are exact and the type stays vector-sharp at 4K. A faint bloom (BLOOM in the glass kit) sits
// under the bright type, the way everything lit in the void blooms.
import React from 'react';
import {FONTS} from '../../../film';
import {BLOOM, GLASS_TYPE, rgba} from '../../../glass';
import type {WordMetrics} from './measure';
import {letterState} from './timing';

type Role = (typeof GLASS_TYPE)['title'];

const textProps = (role: Role, size: number) => ({
  fontFamily: FONTS.super,
  fontWeight: role.weight,
  fontSize: size,
  letterSpacing: `${role.trackingEm}em`,
  style: {fontKerning: 'normal' as const},
});

/** The bloom: a blurred copy of the type at the kit's intensity (std dev = half the bloom radius). */
export const BloomFilter: React.FC<{id: string}> = ({id}) => (
  <filter id={id} x="-20%" y="-60%" width="140%" height="220%" colorInterpolationFilters="sRGB">
    <feGaussianBlur stdDeviation={BLOOM.radiusPx / 2} />
  </filter>
);

export type WordProps = {
  readonly text: string;
  readonly metrics: WordMetrics;
  readonly size: number;
  readonly x: number;
  readonly baseline: number;
  readonly t: number;
  readonly bloomId: string;
};

const Letters: React.FC<Omit<WordProps, 'bloomId'>> = ({text, metrics, size, x, baseline, t}) => {
  const role = GLASS_TYPE.title;
  return (
    <>
      {Array.from(text).map((c, i) => {
        const s = letterState(i, t);
        if (s.opacity <= 0) return null;
        return (
          <text key={i} x={x + (metrics.letterX[i] ?? 0)} y={baseline + s.rise} fill={role.color} fillOpacity={s.opacity * role.opacity} {...textProps(role, size)}>
            {c}
          </text>
        );
      })}
    </>
  );
};

/** "Provisum", each letter fading up from a 6 px drop on its own stagger. */
export const TitleWord: React.FC<WordProps> = ({bloomId, ...rest}) => (
  <g>
    <g opacity={BLOOM.intensity} filter={`url(#${bloomId})`}>
      <Letters {...rest} />
    </g>
    <Letters {...rest} />
  </g>
);

export type SublineProps = {readonly text: string; readonly size: number; readonly opacity: number; readonly centreX: number; readonly baseline: number; readonly fade: number};

/** "A binder for your whole family.", centred under the title. */
export const Subline: React.FC<SublineProps> = ({text, size, opacity, centreX, baseline, fade}) => {
  if (fade <= 0) return null;
  const role = GLASS_TYPE.subline;
  return (
    <text x={centreX} y={baseline} textAnchor="middle" fill={rgba(role.color, opacity * fade)} {...textProps(role, size)}>
      {text}
    </text>
  );
};
