// StringBoard.tsx — chapter 5's corkboard (BIBLE4 5.5): the frame draws itself, six pins go in, four cards pin one by one with a
// source label and a drawn frame, red string runs from the pins and pulls tight, a 2x2 draws itself where the strings cross, the
// papers peel off into six paper boxes, and the boxes jump onto a hand truck that rolls along the pencil line. Plain SVG in
// region px; every time comes from beats4's `researchBoard`.
import React from 'react';
import {researchBoard as M} from '../../beats4';
import {COLORS} from '../../film';
import {handCircle, handLine, handRect} from '../../paper';
import {clamp01, DrawOn, easeOutBack, hash01, Layer, prog, PushPin, smooth, Written} from '../filterMachine/hand';
import {BOX, CARD, CENTRE, CHART, COMPETITORS, GAP_CIRCLE, layoutFor, pinSecond, toRegion, TRUCK, type Layout} from './layout';
import {PAGES} from './pages';

const PAPER = '#FBF8EF';
const SHADOW = 'rgba(42,36,28,0.22)';
const r = (x: number, y: number): [number, number] => toRegion(x, y);

// The board

const Cork: React.FC<{t: number; L: Layout}> = ({t, L}) => {
  const BOARD = L.board;
  const p = prog(t, M.frame.from, M.frame.to - M.frame.from);
  const [x, y] = r(BOARD.x, BOARD.y);
  const d = React.useMemo(() => handRect(x, y, BOARD.w, BOARD.h, 41, {radius: 6}), [x, y]);
  const speckle = React.useMemo(
    () => Array.from({length: 190}, (_, i) => ({cx: x + 14 + hash01(i + 1) * (BOARD.w - 28), cy: y + 14 + hash01(i + 400) * (BOARD.h - 28), r: 1.5 + hash01(i + 900) * 3.2, o: 0.08 + hash01(i + 1300) * 0.1})),
    [x, y],
  );
  return (
    <Layer>
      <rect x={x} y={y} width={BOARD.w} height={BOARD.h} fill="rgba(176,134,86,0.13)" opacity={smooth(prog(t, 0.6, 1.8))} />
      <g opacity={smooth(prog(t, 1.0, 1.5))}>
        {speckle.map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={`rgba(120,84,48,${s.o})`} />
        ))}
      </g>
      <DrawOn d={d} p={p} width={4.2} />
    </Layer>
  );
};

// Pins and cards

const pinScale = (t: number, at: number): number => (t < at ? 0 : Math.min(1.1, easeOutBack(prog(t, at, 0.25))));

const Card: React.FC<{t: number; i: number; L: Layout}> = ({t, i, L}) => {
  const c = M.cards[i];
  const at = L.cardAt[i];
  if (!c || !at || t < c.at) return null;
  const slide = prog(t, c.at, 0.5);
  const e = 1 - (1 - slide) ** 3;
  const [x, y] = r(at[0], at[1]);
  const Page = PAGES[i] as React.FC;
  const peel = prog(t, M.peel.from + i * 0.4, 1.2);
  const content = smooth(prog(t, c.at + M.cardScreenAfter, 0.5));
  const lift = (1 - e) * 260;
  const tx = x + CARD.w / 2;
  return (
    <g transform={`translate(${tx} ${y + CARD.h / 2 + lift + peel * peel * 150}) rotate(${(1 - e) * (i % 2 ? 9 : -9) + peel * (i % 2 ? 14 : -14)}) scale(${1 - 0.55 * peel} ${1 - 0.8 * peel}) translate(${-CARD.w / 2} ${-CARD.h / 2})`} opacity={(1 - smooth(prog(t, M.peel.from + i * 0.4 + 0.5, 0.8))) * clamp01(slide * 3)}>
      <rect x={8} y={11} width={CARD.w} height={CARD.h} rx={8} fill={SHADOW} />
      <rect width={CARD.w} height={CARD.h} rx={8} fill={PAPER} stroke={COLORS.graphite} strokeOpacity={0.8} strokeWidth={2.4} />
      <Written lines={[c.label]} x={CARD.w / 2} y={52} size={44} anchor="middle" t={t} start={c.at + 0.5} dur={0.8} />
      <g transform={`translate(${CARD.frame.dx} ${CARD.frame.dy})`}>
        <clipPath id={`frame-${i}`}>
          <rect width={CARD.frame.w} height={CARD.frame.h} rx={6} />
        </clipPath>
        <g clipPath={`url(#frame-${i})`} opacity={content}>
          <Page />
        </g>
        <DrawOn d={handRect(0, 0, CARD.frame.w, CARD.frame.h, 60 + i, {radius: 6})} p={prog(t, c.at + 0.5, 0.6)} width={2.6} />
      </g>
    </g>
  );
};

const Pins: React.FC<{t: number; L: Layout}> = ({t, L}) => {
  const peelFade = 1 - smooth(prog(t, M.peel.from, 0.6));
  return (
    <Layer opacity={peelFade}>
      {L.firstPins.map(([px, py], i) => {
        const [x, y] = r(px, py);
        const card = i < 4 ? M.cards[i] : undefined;
        const press = card ? 1 + 0.3 * Math.max(0, 1 - Math.abs(t - (card.at + M.cardPinAfter)) / 0.25) : 1;
        const cardPinned = card ? t >= card.at + M.cardPinAfter : true;
        return <PushPin key={i} x={x} y={y} scale={pinScale(t, pinSecond(i)) * press * (cardPinned ? 1 : 0.9)} />;
      })}
    </Layer>
  );
};

// Red string and the 2x2

const stringPath = (from: readonly [number, number], to: readonly [number, number], sag: number): string => {
  const [ax, ay] = r(from[0], from[1]);
  const [bx, by] = r(to[0], to[1]);
  return `M ${ax} ${ay} Q ${(ax + bx) / 2} ${(ay + by) / 2 + sag} ${bx} ${by}`;
};

const Strings: React.FC<{t: number; L: Layout}> = ({t, L}) => {
  const run = prog(t, M.string.from, M.string.tight.from - M.string.from);
  const tight = smooth(prog(t, M.string.tight.from, M.string.tight.to - M.string.tight.from));
  const fade = 1 - smooth(prog(t, M.peel.from, 0.8));
  if (run <= 0) return null;
  return (
    <Layer opacity={fade}>
      {L.cardPin.map((p, i) => {
        const k = clamp01(run * 1.6 - i * 0.18);
        const sag = 90 * (1 - tight) * (i < 2 ? 1 : 0.7) * (1 - Math.abs(Math.sin(i + 1)) * 0.2);
        return <DrawOn key={i} d={stringPath(p, CENTRE, sag)} p={k} width={3.4} ink={COLORS.accent} />;
      })}
    </Layer>
  );
};

const Chart: React.FC<{t: number}> = ({t}) => {
  const {chart} = M;
  const [x0, y1] = r(CHART.x0, CHART.y1);
  const [x1, y0] = r(CHART.x1, CHART.y0);
  const axes = prog(t, chart.axes.from, chart.axes.to - chart.axes.from);
  const fade = 1 - smooth(prog(t, M.peel.from, 0.8));
  const [lx, ly] = r((CHART.x0 + CHART.x1) / 2, CHART.y1 + 36);
  const [yx, yy] = r(CHART.x0 - 26, (CHART.y0 + CHART.y1) / 2);
  const circle = prog(t, chart.circle.from, chart.circle.to - chart.circle.from);
  const [cx, cy] = r(GAP_CIRCLE.c[0], GAP_CIRCLE.c[1]);
  return (
    <Layer opacity={fade}>
      <DrawOn d={handLine(x0, y1, x1, y1, 71)} p={clamp01(axes * 2)} width={3.2} />
      <DrawOn d={handLine(x0, y1, x0, y0, 72)} p={clamp01(axes * 2 - 0.4)} width={3.2} />
      <Written lines={['Organises the family']} x={lx} y={ly} size={44} anchor="middle" t={t} start={chart.labels.from} dur={0.75} />
      <g transform={`rotate(-90 ${yx} ${yy})`}>
        <Written lines={['Handles the hard stuff']} x={yx} y={yy} size={44} anchor="middle" t={t} start={chart.labels.from + 0.75} dur={0.75} />
      </g>
      {COMPETITORS.map(([px, py], i) => {
        const [x, y] = r(px, py);
        return <PushPin key={i} x={x} y={y} r={11} fill="#B9B6AC" scale={pinScale(t, chart.dots.from + i * 0.28)} />;
      })}
      <DrawOn d={handCircle(cx, cy, GAP_CIRCLE.r, GAP_CIRCLE.r, 73)} p={circle} width={4} ink={COLORS.accent} />
    </Layer>
  );
};

// The six boxes and the hand truck

type Pt = readonly [number, number];

/** Where box k sits on the truck, as the centre of its front face (sheet px, truck at x offset 0). */
const stackSlot = (k: number): Pt => [TRUCK.x + 10, TRUCK.ground - 62 - 40 - k * 86];

const truckX = (t: number): number => TRUCK.x + 1500 * smooth(prog(t, M.roll.from, M.roll.to - M.roll.from)) - TRUCK.x;

/** A paper box: front face, tilted lid and right side, all hand-ruled; `fold` is 0-1 how far it has stood up. */
const Box: React.FC<{label: string; k: number; fold: number; labelT: number; t: number; scale?: number}> = ({label, k, fold, labelT, t, scale = 1}) => {
  const {w, h, lid} = BOX;
  const a = 85 * (1 - Math.min(1.04, easeOutBack(fold)));
  const front = (
    <g>
      <rect width={w} height={h} fill={PAPER} stroke={COLORS.graphite} strokeOpacity={0.85} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M 0 ${h * 0.18} L ${w} ${h * 0.18}`} stroke={COLORS.graphite} strokeOpacity={0.35} strokeWidth={1.6} />
      {labelT >= 0 ? <Written lines={[label]} x={w / 2} y={h * 0.62} size={28} anchor="middle" t={t} start={labelT} dur={0.6} /> : null}
    </g>
  );
  return (
    <g transform={`scale(${scale})`}>
      <g opacity={clamp01(fold * 2.5)}>
        <path d={`M ${w} 0 L ${w + 22} ${-lid * 0.6} L ${w + 22} ${h - lid * 0.6} L ${w} ${h} Z`} fill="#E4DCC8" stroke={COLORS.graphite} strokeOpacity={0.85} strokeWidth={3} strokeLinejoin="round" />
        <path d={`M 0 0 L 22 ${-lid} L ${w + 22} ${-lid} L ${w} 0 Z`} fill="#F1EBDB" stroke={COLORS.graphite} strokeOpacity={0.85} strokeWidth={3} strokeLinejoin="round" transform={`translate(0 ${-lid * (1 - fold) * 0})`} />
      </g>
      <g style={{transformOrigin: `${w / 2}px ${h}px`, transform: `perspective(1800px) rotateX(${a}deg)`}}>{front}</g>
    </g>
  );
  void k;
};

const Boxes: React.FC<{t: number; L: Layout}> = ({t, L}) => {
  const {w, h} = BOX;
  const dx = truckX(t);
  return (
    <>
      {M.boxes.map((b, k) => {
        const jumpAt = M.stack.from + k * M.stack.every;
        const row: Pt = L.boxAt(k);
        const slot = stackSlot(k);
        const s = TRUCK.stackScale;
        const jumpDur = 0.45;
        const u = prog(t, jumpAt, jumpDur);
        if (t < b.at) return null;
        const onTruck = t >= jumpAt + jumpDur;
        const fx = onTruck ? slot[0] - (w * s) / 2 + dx : row[0] + (slot[0] - (w * s) / 2 - row[0]) * u;
        const fy = onTruck ? slot[1] - (h * s) / 2 : row[1] + (slot[1] - (h * s) / 2 - row[1]) * u - 260 * Math.sin(Math.PI * u);
        const sc = onTruck ? s : 1 + (s - 1) * u;
        const [x, y] = r(fx - (onTruck ? 0 : 0), fy);
        return (
          <g key={b.label} transform={`translate(${x} ${y})`}>
            <Box label={b.label} k={k} fold={prog(t, b.at, 0.9)} labelT={b.at + 0.7} t={t} scale={sc} />
          </g>
        );
      })}
    </>
  );
};

const Truck: React.FC<{t: number}> = ({t}) => {
  const from = M.stack.from - 1.6;
  const p = prog(t, from, 1.2);
  if (p <= 0) return null;
  const dx = truckX(t);
  const [gx, gy] = r(TRUCK.x + dx, TRUCK.ground);
  const wheel = ((dx / 34) * 180) / Math.PI;
  const rail = (x: number, y1: number, y2: number, seed: number): string => handLine(x, y1, x, y2, seed);
  return (
    <g transform={`translate(${gx} ${gy})`}>
      <DrawOn d={rail(-52, -50, -600, 81)} p={p} width={5} />
      <DrawOn d={rail(-36, -50, -600, 82)} p={clamp01(p * 1.2)} width={3} />
      <DrawOn d={handLine(-130, -600, -36, -600, 83)} p={clamp01(p * 1.4 - 0.2)} width={5} />
      <DrawOn d={handLine(-52, -62, 130, -62, 84)} p={clamp01(p * 1.4 - 0.2)} width={5} />
      <DrawOn d={handLine(-36, -88, 100, -88, 85)} p={clamp01(p * 1.4 - 0.2)} width={2.4} />
      <g opacity={smooth(p)}>
        <ellipse cx={20} cy={-3} rx={44} ry={7} fill={SHADOW} />
        <g transform={`translate(8 -36) rotate(${wheel})`}>
          <circle r={36} fill={PAPER} stroke={COLORS.graphite} strokeOpacity={0.85} strokeWidth={4} />
          <circle r={7} fill={COLORS.graphite} fillOpacity={0.75} />
          <path d="M 0 -30 L 0 30 M -30 0 L 30 0" stroke={COLORS.graphite} strokeOpacity={0.5} strokeWidth={2.4} />
        </g>
      </g>
    </g>
  );
};

export const StringBoard: React.FC<{t: number; tall?: boolean}> = ({t, tall = false}) => {
  const L = layoutFor(tall);
  return (
  <>
    <Cork t={t} L={L} />
    <Strings t={t} L={L} />
    <Layer>
      {M.cards.map((_, i) => (
        <Card key={i} t={t} i={i} L={L} />
      ))}
    </Layer>
    <Chart t={t} />
    <Pins t={t} L={L} />
    <Layer>
      <Truck t={t} />
      <Boxes t={t} L={L} />
    </Layer>
  </>
  );
};
