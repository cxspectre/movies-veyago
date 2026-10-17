// VillageLight.tsx — 0.0-10.0 (BIBLE4 §5.10): the village's strokes turn to light in stroke order (0.4 s each, spread over
// 0.0-5.0), lift off as hairlines (7.0-8.0, 120 screen px, keynote) and are re-traced as the phone's outline (8.0-10.0).
import React, {useMemo} from 'react';
import {paperToGlass as P} from '../../beats4';
import {HAIRLINE, ease, freshLevel, hairlineGlowFilter, hairlineSvgStroke, mix, windowProgress} from '../../glass';
import {basePlacement, type Size} from './motion';
import {phoneArc, resample, villageStrokes, type XY} from './village';
import type {FormatName} from '../../film';

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const LIFT_PX = 120;
const POINTS = 28;
const RETRACE = 1.2;
const RETRACE_SPREAD = 0.8;

type Props = {t: number; format: FormatName; size: Size; toScreen: (p: XY) => XY};

export const VillageLight: React.FC<Props> = ({t, format, size, toScreen}) => {
  const strokes = useMemo(() => villageStrokes().map((s) => ({id: s.id, pts: s.pts.map((p) => toScreen(p))})), [toScreen]);
  if (t >= P.foldIntoPhone.to) return null;
  const K = strokes.length;
  const lift = ease('keynote', windowProgress(P.housesLift, t));
  const phone = basePlacement(format, size);
  const centre: XY = [phone.x * size.width, phone.y * size.height];
  const fadeOut = 1 - windowProgress({from: 8.7, to: 9.7}, t, 'easeInOutSine');
  return (
    <svg width={size.width} height={size.height} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {strokes.map((s, i) => {
        const start = (i / Math.max(1, K - 1)) * (P.lightCatch.to - P.lightCatch.from - P.lightCatch.perStrokeSeconds);
        const drawn = clamp01((t - P.lightCatch.from - start) / P.lightCatch.perStrokeSeconds);
        if (drawn <= 0) return null;
        const morphFrom = P.foldIntoPhone.from + (i / Math.max(1, K - 1)) * RETRACE_SPREAD;
        const m = ease('keynote', clamp01((t - morphFrom) / RETRACE));
        const raised = s.pts.map(([x, y]): XY => [x, y - LIFT_PX * lift]);
        const pts: XY[] = m > 0 ? resample(raised, POINTS).map((p, n): XY => {
          const target = phoneArc(i, K, POINTS, centre, phone.height)[n] as XY;
          return [mix(p[0], target[0], m), mix(p[1], target[1], m)];
        }) : raised;
        // the freshly converted flare, and the re-tracing head's brighter level while the stroke arrives
        const level = Math.max(freshLevel(t - P.lightCatch.from - start), 1 + (HAIRLINE.headFlare - 1) * Math.sin(Math.PI * m));
        const stroke = hairlineSvgStroke('graphite', level, 1);
        const d = `M ${pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' L ')}`;
        return (
          <path key={s.id} d={d} pathLength={1} strokeDasharray={`${drawn} 1`} opacity={fadeOut} style={{filter: hairlineGlowFilter('graphite', level, 1)}} {...stroke} />
        );
      })}
    </svg>
  );
};
