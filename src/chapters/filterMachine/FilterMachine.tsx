// FilterMachine.tsx — the paper machine of chapter 4 (BIBLE4 5.4): a hopper, a tall body, five gates with a label each, a
// slot and a paper tray. It folds up off the page (hopper 0.0, body 1.0, the gates from 2.0, the tray 3.0), each part a flat
// paper panel hinged on one edge. Plain 2D panels (a perspective rotateX), so the geometry at rest is exact: the falling
// cards in Cards.tsx are placed against these numbers. (The popup preset's body lost its lower half under the lamp from the
// front, so this chapter folds its own panels; see the report.)
import React from 'react';
import {filterMachine as M} from '../../beats4';
import {COLORS} from '../../film';
import {Box, Hatch, Line} from '../../popup';
import {easeOutBack, prog, Written} from './hand';
import {BODY, HOPPER, LIP, PLAQUE, toRegion, TRAY} from './layout';

const PAPER = '#F3EEE3';
const PANEL = '#ECE5D3';
const PERSPECTIVE = 2600;

/** A paper panel at sheet (x, y), w x h, hinged on `hinge`, standing up from `angle` degrees (85 = flat) to 0. */
const Panel: React.FC<{x: number; y: number; w: number; h: number; hinge: 'top' | 'bottom'; angle: number; shown?: boolean; children: React.ReactNode}> = ({x, y, w, h, hinge, angle, shown = true, children}) => {
  const [left, top] = toRegion(x, y);
  if (!shown) return null;
  return (
    <div style={{position: 'absolute', left, top, width: w, height: h, transformOrigin: hinge === 'top' ? '50% 0%' : '50% 100%', transform: `perspective(${PERSPECTIVE}px) rotateX(${angle}deg)`}}>
      <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {children}
      </svg>
    </div>
  );
};

/** 85 -> 0 degrees with a small settle. */
const standUp = (t: number, start: number, dur: number): number => 85 * (1 - Math.min(1.04, easeOutBack(prog(t, start, dur))));

export const FilterMachine: React.FC<{t: number}> = ({t}) => {
  const [hopperAt, bodyAt, gatesAt] = [0, 1, 2].map((i) => M.popUp.from + i) as [number, number, number];
  const bw = BODY.x1 - BODY.x0;
  const bh = BODY.y1 - BODY.y0;
  const hh = BODY.y0 - HOPPER.y0;
  const hopperA = standUp(t, hopperAt, 0.9);
  const bodyA = standUp(t, bodyAt, 0.9);
  const sx = (bw - HOPPER.wTop) / 2;
  const nx = (bw - HOPPER.wBottom) / 2;
  const shadowK = Math.min(1, prog(t, bodyAt, 0.9));
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, filter: `drop-shadow(${26 * shadowK}px ${22 * shadowK}px ${12 * shadowK}px rgba(42,36,28,0.26))`}}>
      {/* hopper (folds first, hinged on the body's top edge) */}
      <Panel x={BODY.x0} y={HOPPER.y0} w={bw} h={hh} hinge="bottom" angle={hopperA} shown={t >= hopperAt}>
        <path d={`M ${sx} 0 L ${sx + HOPPER.wTop} 0 L ${nx + HOPPER.wBottom} ${hh} L ${nx} ${hh} Z`} fill={PANEL} />
        <path d={`M ${sx} 0 L ${sx + HOPPER.wTop} 0 L ${nx + HOPPER.wBottom} ${hh} L ${nx} ${hh} Z`} fill="none" stroke={COLORS.graphite} strokeWidth={3} strokeOpacity={0.85} strokeLinejoin="round" />
        <Line x1={bw * 0.3} y1={hh * 0.45} x2={bw * 0.7} y2={hh * 0.45} seed={40} width={3.2} />
      </Panel>
      {/* body (drops from the hopper) */}
      <Panel x={BODY.x0} y={BODY.y0} w={bw} h={bh} hinge="top" angle={bodyA} shown={t >= bodyAt}>
        <rect x={0} y={0} width={bw} height={bh} fill={PANEL} />
        <Box x={6} y={6} w={bw - 12} h={bh - 12} seed={7} width={3.4} />
        <Hatch x={26} y={26} w={40} h={bh - 52} gap={14} seed={300} />
        {LIP.map((lip, i) => (
          <Line key={i} x1={14} y1={lip - BODY.y0} x2={bw - 14} y2={lip - BODY.y0 + 2} seed={10 + i} width={3} />
        ))}
        <text x={bw / 2} y={bh - 70} textAnchor="middle" fontFamily="Patrick Hand" fontSize={46} fill={COLORS.graphite} fillOpacity={0.8}>
          filter
        </text>
        {/* the exit slot at the bottom */}
        <path d={`M ${bw / 2 - 64} ${bh - 6} L ${bw / 2 - 64} ${bh + 36} L ${bw / 2 + 64} ${bh + 36} L ${bw / 2 + 64} ${bh - 6}`} fill={PANEL} stroke={COLORS.graphite} strokeWidth={3} strokeOpacity={0.85} strokeLinejoin="round" />
      </Panel>
      {/* the five gates: a ledge folds out at the lip, a label tag hangs under it */}
      {LIP.map((lip, i) => {
        const at = gatesAt + i * 0.2;
        const a = standUp(t, at, 0.65);
        const label = M.gateLabels[i];
        if (!label) return null;
        return (
          <React.Fragment key={i}>
            <Panel x={BODY.x0 - 24} y={lip - 8} w={bw + 48} h={20} hinge="top" angle={a} shown={t >= at}>
              <rect x={0} y={0} width={bw + 48} height={20} rx={4} fill={PAPER} stroke={COLORS.graphite} strokeOpacity={0.8} strokeWidth={2.4} />
            </Panel>
            <Panel x={PLAQUE.x} y={lip + PLAQUE.below} w={PLAQUE.w} h={PLAQUE.h} hinge="top" angle={a} shown={t >= at + 0.1}>
              <rect x={0} y={0} width={PLAQUE.w} height={PLAQUE.h} rx={6} fill="#FBF8EF" stroke={COLORS.graphite} strokeOpacity={0.6} strokeWidth={2} />
            </Panel>
            <svg style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible'}}>
              <Written lines={[label.text]} x={toRegion(PLAQUE.x + 22, 0)[0]} y={toRegion(0, lip + PLAQUE.below + 40)[1]} size={32} t={t} start={label.at} dur={1.5} />
            </svg>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** The tray: the back wall sits behind the landing card, the front wall in front of it. */
export const TrayBack: React.FC<{t: number}> = ({t}) => {
  const a = standUp(t, 3.0, 0.8);
  const w = TRAY.w;
  return (
    <Panel x={TRAY.x - w / 2} y={TRAY.back} w={w} h={TRAY.front - TRAY.back} hinge="bottom" angle={a} shown={t >= 3.0}>
      <rect x={0} y={0} width={w} height={TRAY.front - TRAY.back} fill={PANEL} stroke={COLORS.graphite} strokeOpacity={0.8} strokeWidth={3} />
    </Panel>
  );
};

export const TrayFront: React.FC<{t: number}> = ({t}) => {
  const a = standUp(t, 3.0, 0.8);
  const w = TRAY.w + 40;
  return (
    <Panel x={TRAY.x - w / 2} y={TRAY.front} w={w} h={100} hinge="bottom" angle={a} shown={t >= 3.0}>
      <rect x={0} y={0} width={w} height={100} fill={PAPER} stroke={COLORS.graphite} strokeOpacity={0.85} strokeWidth={3} strokeLinejoin="round" />
      <Line x1={24} y1={30} x2={w - 24} y2={31} seed={77} width={1.8} />
    </Panel>
  );
};
