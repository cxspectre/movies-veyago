// VillageLight.tsx — 0.0-10.0 (BIBLE4 §5.10): the village's strokes turn to light in stroke order (0.4 s each, spread over
// 0.0-5.0), lift off as hairlines (7.0-8.0, 120 screen px, keynote) and are re-traced as the phone's outline (8.0-10.0).
import React, {useMemo} from 'react';
import {paperToGlass as P} from '../../beats4';
import {HAIRLINE, ease, freshLevel, hairlineGlowFilter, hairlineSvgStroke, mix, windowProgress} from '../../glass';
import {basePlacement, type Size} from './motion';
import {pointAt} from '../../glass/edgeLightPath';
import {PHONE} from '../../devices';
import {villageStrokes, type XY} from './village';
import type {FormatName} from '../../film';

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const LIFT_PX = 120;
const RETRACE = 1.3;
const RETRACE_SPREAD = 0.5;
const OUTLINE_POINTS = 160;

type Props = {t: number; format: FormatName; size: Size; toScreen: (p: XY) => XY};

export const VillageLight: React.FC<Props> = ({t, format, size, toScreen}) => {
  // one entry per house: its strokes in screen px and its bounding box
  const houses = useMemo(() => {
    const byHouse = new Map<string, {id: string; pts: XY[]}[]>();
    villageStrokes().forEach((s) => {
      const key = s.id.slice(0, s.id.lastIndexOf('-'));
      const list = byHouse.get(key) ?? [];
      list.push({id: s.id, pts: s.pts.map((p) => toScreen(p))});
      byHouse.set(key, list);
    });
    return [...byHouse.values()].map((strokes) => {
      const all = strokes.flatMap((s) => s.pts);
      const xs = all.map((p) => p[0]);
      const ys = all.map((p) => p[1]);
      return {strokes, box: {x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys)}};
    });
  }, [toScreen]);
  const outline = useMemo(() => Array.from({length: OUTLINE_POINTS + 1}, (_, i) => pointAt({...PHONE.outline}, i / OUTLINE_POINTS)), []);
  if (t >= P.foldIntoPhone.to) return null;
  const K = houses.reduce((n, h) => n + h.strokes.length, 0);
  const lift = ease('keynote', windowProgress(P.housesLift, t));
  const phone = basePlacement(format, size);
  const cx = phone.x * size.width;
  const cy = phone.y * size.height;
  const fadeOut = 1 - windowProgress({from: 9.2, to: 9.9}, t, 'easeInOutSine');
  const outlineDraw = ease('easeInOutSine', windowProgress({from: 8.4, to: 10.0}, t));
  const half = {w: (PHONE.outline.width * phone.height) / 2, h: phone.height / 2};
  let n = 0;
  return (
    <svg width={size.width} height={size.height} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {houses.map((house, hi) => {
        const morphFrom = P.foldIntoPhone.from + (hi / Math.max(1, houses.length - 1)) * RETRACE_SPREAD;
        const m = ease('keynote', clamp01((t - morphFrom) / RETRACE));
        const b = house.box;
        const bw = b.x1 - b.x0 || 1;
        const bh = b.y1 - b.y0 || 1;
        const bcx = (b.x0 + b.x1) / 2;
        const bcy = (b.y0 + b.y1) / 2 - LIFT_PX * lift;
        return house.strokes.map((s) => {
          const i = n++;
          const start = (i / Math.max(1, K - 1)) * (P.lightCatch.to - P.lightCatch.from - P.lightCatch.perStrokeSeconds);
          const drawn = clamp01((t - P.lightCatch.from - start) / P.lightCatch.perStrokeSeconds);
          if (drawn <= 0) return null;
          const pts = s.pts.map(([x, y]): XY => {
            const rx = x - (b.x0 + b.x1) / 2;
            const ry = y - (b.y0 + b.y1) / 2;
            const sx = mix(1, (half.w * 2) / bw, m);
            const sy = mix(1, (half.h * 2) / bh, m);
            return [mix(bcx, cx, m) + rx * sx, mix(bcy, cy, m) + ry * sy];
          });
          const level = Math.max(freshLevel(t - P.lightCatch.from - start), 1 + (HAIRLINE.headFlare - 1) * Math.sin(Math.PI * m));
          const stroke = hairlineSvgStroke('graphite', level, 1);
          const d = `M ${pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' L ')}`;
          return <path key={s.id} d={d} pathLength={1} strokeDasharray={`${drawn} 1`} opacity={fadeOut} style={{filter: hairlineGlowFilter('graphite', level, 1)}} {...stroke} />;
        });
      })}
      {outlineDraw > 0 ? (
        <path
          d={`M ${outline.map((p) => `${(cx + p.x * phone.height).toFixed(2)} ${(cy + p.y * phone.height).toFixed(2)}`).join(' L ')} Z`}
          pathLength={1}
          strokeDasharray={`${outlineDraw} 1`}
          style={{filter: hairlineGlowFilter('graphite', 1, 1)}}
          {...hairlineSvgStroke('graphite', 1 + (HAIRLINE.headFlare - 1) * Math.sin(Math.PI * outlineDraw), 1)}
        />
      ) : null}
    </svg>
  );
};
