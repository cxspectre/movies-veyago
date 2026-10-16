// NumberRoll.tsx — an odometer: every digit of `to` rolls on its own wheel from the matching digit of `from` (0 when
// there is none) and all of them land together at start + duration; everything that is not a digit ("." "(a)" "September"
// "kinds of people") stands still. DM Sans with tabular figures, in the accent by default (BIBLE4 §5.3, 5.8, 5.10).
import React from 'react';
import {COLORS, FONTS} from '../film';
import {INK4} from '../beats4';
import type {Point} from '../sheet4';
import {clamp01, easeOutCubic, smoothstep, useLocalSeconds, useToLocal} from './context';

export type NumberRollInk = 'accent' | 'graphite' | 'sepia' | 'glass';

export type NumberRollProps = {
  /** The final string, e.g. "4.3(a)", "21 September 2026", "6 kinds of people". */
  readonly to: string;
  /** Where the digits start (right-aligned digit for digit against `to`); default all zeros. */
  readonly from?: string;
  /** Module-local seconds the wheels start turning. */
  readonly start: number;
  /** Seconds until every wheel has landed (BIBLE: 1.0 for 4.3(a), 0.4 on black). */
  readonly duration: number;
  readonly ink?: NumberRollInk;
  /** DM Sans px (sheet px on paper, screen px in an overlay). */
  readonly size?: number;
  readonly weight?: 400 | 500 | 700;
  /** Baseline point. In SHEET px inside a ChapterShell (converted to region-local), else the parent's px. */
  readonly at: Point;
  readonly align?: 'left' | 'centre' | 'right';
  /** Seconds the whole number fades in, ending at `start` (default 0.3; 0 = it is simply there). */
  readonly fadeIn?: number;
  /** Seconds after landing before it fades out (default: stays). */
  readonly hold?: number;
  readonly fadeOut?: number;
  readonly time?: number;
};

const INK_HEX: Record<NumberRollInk, string> = {accent: COLORS.accent, graphite: COLORS.graphite, sepia: INK4.sepia, glass: COLORS.glassWhite};
const CELL_EM = 1.2; // wheel window height
const BASELINE_EM = 0.94; // DM Sans baseline from the top of a 1.2 em line box (ascent 0.992, descent 0.31)
const STAGGER = 0.35; // fraction of `duration` over which the wheels start, left to right
/** While a wheel turns, its digits fade toward the window's edges, like a drum seen through a slot. */
const DRUM = 'linear-gradient(to bottom, transparent 4%, black 30%, black 72%, transparent 96%)';
const DRUM_MASK: React.CSSProperties = {maskImage: DRUM, WebkitMaskImage: DRUM};
const isDigit = (ch: string): boolean => ch >= '0' && ch <= '9';

/** How many extra full turns a wheel makes: the rightmost spins most, like a real counter. */
const turnsFor = (fromRight: number): number => (fromRight === 0 ? 2 : fromRight < 3 ? 1 : 0);

/** The position of every wheel (digit units, fractional while rolling), or null for a still character. Pure. */
export const rollState = (to: string, from: string | undefined, start: number, duration: number, t: number): readonly (number | null)[] => {
  const chars = Array.from(to);
  const digitsTo = chars.filter(isDigit).length;
  const fromDigits = Array.from(from ?? '').filter(isDigit).map(Number);
  let seen = 0;
  return chars.map((ch) => {
    if (!isDigit(ch)) return null;
    const fromRight = digitsTo - 1 - seen;
    const fromLeft = seen;
    seen += 1;
    const target = Number(ch);
    const f = fromDigits[fromDigits.length - 1 - fromRight] ?? 0;
    const travel = ((target - f + 10) % 10) + 10 * turnsFor(fromRight);
    const delay = digitsTo > 1 ? (fromLeft / (digitsTo - 1)) * STAGGER * duration : 0;
    const k = easeOutCubic(clamp01((t - start - delay) / Math.max(1e-6, duration - delay)));
    return f + travel * k;
  });
};

/** The sound department's window for this roll (`odometer` is a v4 SfxName the integrator adds to cues.ts). */
export const numberRollCue = (p: Pick<NumberRollProps, 'start' | 'duration'>) => ({name: 'odometer' as const, t: p.start, dur: p.duration});

const Wheel: React.FC<{pos: number; size: number}> = ({pos, size}) => {
  const cell = size * CELL_EM;
  const base = Math.floor(pos);
  const frac = pos - base;
  const digits = [base, base + 1];
  return (
    <span style={{display: 'inline-block', position: 'relative', width: '1ch', height: cell, overflow: 'hidden', verticalAlign: 'top', ...(frac > 0.001 ? DRUM_MASK : {})}}>
      {digits.map((d, i) => (
        <span
          key={i}
          style={{position: 'absolute', left: 0, top: (i - frac) * cell, width: '1ch', height: cell, lineHeight: `${cell}px`, textAlign: 'center'}}
        >
          {((d % 10) + 10) % 10}
        </span>
      ))}
    </span>
  );
};

export const NumberRoll: React.FC<NumberRollProps> = ({to, from, start, duration, ink = 'accent', size = 64, weight = 500, at, align = 'left', fadeIn = 0.3, hold, fadeOut = 0.5, time}) => {
  const t = useLocalSeconds(time);
  const toLocal = useToLocal();
  const [x, y] = toLocal(at);
  const visibleFrom = start - fadeIn;
  const end = hold === undefined ? Infinity : start + duration + hold;
  if (t < visibleFrom || t >= end + fadeOut) return null;
  const opacity = (fadeIn > 0 ? smoothstep((t - visibleFrom) / fadeIn) : 1) * (1 - smoothstep((t - end) / fadeOut));
  const wheels = rollState(to, from, start, duration, t);
  const chars = Array.from(to);
  const cell = size * CELL_EM;
  const shift = align === 'centre' ? '-50%' : align === 'right' ? '-100%' : '0';
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y - size * BASELINE_EM,
        transform: `translateX(${shift})`,
        whiteSpace: 'pre',
        fontFamily: FONTS.super,
        fontWeight: weight,
        fontSize: size,
        lineHeight: `${cell}px`,
        height: cell,
        fontVariantNumeric: 'tabular-nums',
        color: INK_HEX[ink],
        opacity,
      }}
    >
      {chars.map((ch, i) => {
        const pos = wheels[i];
        return pos === null || pos === undefined ? (
          <span key={i} style={{display: 'inline-block', verticalAlign: 'top', height: cell}}>
            {ch}
          </span>
        ) : (
          <Wheel key={i} pos={pos} size={size} />
        );
      })}
    </div>
  );
};
