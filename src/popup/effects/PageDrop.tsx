// PageDrop.tsx — a calendar page drops onto the desk with a small bounce and settle, then one date is circled in
// accent (BIBLE4 5.3, 28.0-31.5). Leaves an anchor for a NumberRoll (built separately) under or beside the page.
// The page is SVG; its shadow is the desk lamp's layered box-shadow, longer and softer while the page is in the air.
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS} from '../../film';
import {castShadow, DEFAULT_LAMP, handCircle, handLine, type Lamp} from '../../paper';
import {Ink} from '../art';
import {SHEET_PAPER} from './CrumpleBall';

export type PageDropProps = {
  /** Page size. Default 520 x 600 (BIBLE4 5.3). */
  readonly w?: number;
  readonly h?: number;
  readonly time?: number;
  /** The drop starts; it lands `fall` seconds later (the paper_drop cue). */
  readonly start?: number;
  /** Seconds in the air. Default 0.45. */
  readonly fall?: number;
  /** Title, e.g. "September 2026" (a CLAIMS row for anything shown). */
  readonly month: string;
  /** Days in the month. */
  readonly days: number;
  /** Weekday of the 1st, 0 = Monday. */
  readonly firstWeekday: number;
  /** The date circled in accent, and when the circle draws (0.5 s). */
  readonly circled?: number;
  readonly circleAt?: number;
  /** Resting rotation, degrees. Default -1.5. */
  readonly rotate?: number;
  readonly lamp?: Lamp;
  /** Where the NumberRoll goes (page coordinates). Default: centred 50 px under the page. */
  readonly anchorAt?: {readonly x: number; readonly y: number};
  /** Rendered at the anchor (centred on it): the NumberRoll, owned by the chapter. */
  readonly anchor?: React.ReactNode;
  readonly style?: React.CSSProperties;
};

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DROP = 260;
const BOUNCE_PX = 16;
const BOUNCE_S = 0.42;
const START_HEIGHT = 140;

/** The anchor point for a NumberRoll under a page of this size (page coordinates). */
export const pageDropAnchor = (w = 520, h = 600): {x: number; y: number} => ({x: w / 2, y: h + 50});

/** Height above the desk (px) and screen offset at `tau` seconds after the drop starts. */
const flight = (tau: number, fall: number): {height: number; y: number; tilt: number} => {
  if (tau < fall) {
    const k = clamp01(tau / fall);
    const left = 1 - k * k; // gravity: slow at the top, fast at the bottom
    return {height: START_HEIGHT * left, y: -DROP * left, tilt: -4 * left};
  }
  const b = tau - fall;
  // Two small bounces, each lower and shorter, then still.
  const first = BOUNCE_S;
  const second = BOUNCE_S * 0.6;
  let lift = 0;
  if (b < first) lift = BOUNCE_PX * Math.sin((Math.PI * b) / first);
  else if (b < first + second) lift = BOUNCE_PX * 0.3 * Math.sin((Math.PI * (b - first)) / second);
  const wobble = 2.2 * Math.exp(-5 * b) * Math.sin(2 * Math.PI * 1.8 * b);
  return {height: lift * 0.6, y: -lift, tilt: wobble};
};

export const PageDrop: React.FC<PageDropProps> = (p) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = p.time ?? frame / fps;
  const w = p.w ?? 520;
  const h = p.h ?? 600;
  const start = p.start ?? 0;
  const fall = p.fall ?? 0.45;
  const lamp = p.lamp ?? DEFAULT_LAMP;
  const tau = t - start;
  const anchorAt = p.anchorAt ?? pageDropAnchor(w, h);
  if (tau < 0) {
    return <div style={{position: 'relative', width: w, height: h, ...p.style}} />;
  }
  const {height, y, tilt} = flight(tau, fall);
  const scale = 1 + height / 1400;
  const appear = clamp01(tau / 0.12);

  const head = h * 0.2;
  const gridTop = head + h * 0.1;
  const gridH = h - gridTop - h * 0.05;
  const rows = Math.ceil((p.firstWeekday + p.days) / 7);
  const cw = (w - w * 0.1) / 7;
  const ch = gridH / rows;
  const gx = w * 0.05;
  const cell = (day: number): {x: number; y: number} => {
    const k = p.firstWeekday + day - 1;
    return {x: gx + (k % 7) * cw + cw / 2, y: gridTop + Math.floor(k / 7) * ch + ch / 2};
  };
  const circleK = p.circled !== undefined && p.circleAt !== undefined ? clamp01((t - p.circleAt) / 0.5) : 0;
  const ring = p.circled !== undefined ? cell(p.circled) : undefined;
  const numSize = Math.round(Math.min(cw, ch) * 0.42);

  return (
    <div style={{position: 'relative', width: w, height: h, ...p.style}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: appear,
          transformOrigin: '50% 50%',
          transform: `translateY(${y.toFixed(2)}px) rotate(${((p.rotate ?? -1.5) + tilt).toFixed(3)}deg) scale(${scale.toFixed(4)})`,
          boxShadow: castShadow(lamp, {height: 2 + height}),
          background: SHEET_PAPER,
        }}
      >
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {/* the torn perforation along the top and two binding holes */}
          {Array.from({length: Math.floor(w / 14)}, (_, i) => (
            <circle key={i} cx={7 + i * 14} cy={6} r={1.6} fill="rgba(42,42,45,0.28)" />
          ))}
          <circle cx={w * 0.25} cy={22} r={7} fill="rgba(42,42,45,0.12)" stroke="rgba(42,42,45,0.4)" strokeWidth={1.2} />
          <circle cx={w * 0.75} cy={22} r={7} fill="rgba(42,42,45,0.12)" stroke="rgba(42,42,45,0.4)" strokeWidth={1.2} />
          <text x={w / 2} y={head * 0.82} textAnchor="middle" fontFamily="Patrick Hand" fontSize={Math.round(head * 0.42)} fill={COLORS.graphite}>
            {p.month}
          </text>
          <Ink d={handLine(gx, head + 2, w - gx, head + 2, 7)} width={2} />
          {WEEKDAYS.map((d, i) => (
            <text key={i} x={gx + i * cw + cw / 2} y={head + h * 0.072} textAnchor="middle" fontFamily="Patrick Hand" fontSize={Math.round(numSize * 0.85)} fill={COLORS.graphiteSoft}>
              {d}
            </text>
          ))}
          {Array.from({length: rows + 1}, (_, r) => (
            <Ink key={`r${r}`} d={handLine(gx, gridTop + r * ch, w - gx, gridTop + r * ch, 40 + r)} width={1} ink={COLORS.graphiteSoft} />
          ))}
          {Array.from({length: 8}, (_, c) => (
            <Ink key={`c${c}`} d={handLine(gx + c * cw, gridTop, gx + c * cw, gridTop + rows * ch, 60 + c)} width={1} ink={COLORS.graphiteSoft} />
          ))}
          {Array.from({length: p.days}, (_, i) => {
            const c = cell(i + 1);
            return (
              <text key={i} x={c.x} y={c.y + numSize * 0.36} textAnchor="middle" fontFamily="Patrick Hand" fontSize={numSize} fill={COLORS.graphite}>
                {i + 1}
              </text>
            );
          })}
          {ring && circleK > 0 ? (
            <path
              d={handCircle(ring.x, ring.y, Math.min(cw, ch) * 0.55, Math.min(cw, ch) * 0.48, 97)}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={(1 - circleK).toFixed(4)}
              fill="none"
              stroke={COLORS.accent}
              strokeWidth={3.2}
              strokeLinecap="round"
            />
          ) : null}
        </svg>
      </div>
      <div data-anchor="number-roll" style={{position: 'absolute', left: anchorAt.x, top: anchorAt.y, transform: 'translate(-50%, -50%)'}}>
        {p.anchor}
      </div>
    </div>
  );
};
