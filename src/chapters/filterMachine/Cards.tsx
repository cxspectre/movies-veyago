// Cards.tsx — the 24 idea cards (160 x 100, blurred titles), their stamps, and the card that makes it: it lands in the
// tray, unfolds into a 520 x 340 sheet and writes its line (BIBLE4 5.4).
import React from 'react';
import {filterMachine as M} from '../../beats4';
import {COLORS} from '../../film';
import {easeOutBack, hash01, prog, smooth, Written} from './hand';
import {cardPose, CARD, PLAN, TRAY, toRegion, type CardPlan} from './layout';

const TINTS = ['#FBF8EF', '#F7F2E4', '#FAF3E6'] as const;

/** A card at the origin of a 160 x 100 box: paper, a folded corner, a blurred title and a few lines of nothing. */
export const CardFace: React.FC<{seed: number; tint?: number; fade?: number}> = ({seed, tint = 0, fade = 1}) => (
  <g>
    <rect x={7} y={9} width={CARD.w} height={CARD.h} rx={7} fill="rgba(42,36,28,0.22)" />
    <rect x={0} y={0} width={CARD.w} height={CARD.h} rx={7} fill={TINTS[tint % 3]} stroke={COLORS.graphite} strokeOpacity={0.8} strokeWidth={2.2} />
    <g opacity={fade}>
      <path d={`M ${16 + hash01(seed) * 8} 30 L ${CARD.w - 30 - hash01(seed + 1) * 30} 31`} stroke={COLORS.graphite} strokeOpacity={0.3} strokeWidth={12} strokeLinecap="round" />
      <path d={`M 16 52 L ${CARD.w - 24 - hash01(seed + 2) * 40} 53`} stroke={COLORS.graphite} strokeOpacity={0.14} strokeWidth={5} strokeLinecap="round" />
      <path d={`M 16 66 L ${CARD.w - 40 - hash01(seed + 3) * 40} 67`} stroke={COLORS.graphite} strokeOpacity={0.14} strokeWidth={5} strokeLinecap="round" />
      <path d={`M 16 80 L ${60 + hash01(seed + 4) * 30} 81`} stroke={COLORS.graphite} strokeOpacity={0.14} strokeWidth={5} strokeLinecap="round" />
    </g>
  </g>
);

/** The small red stamp (the film's red is the accent): a 60 x 60 rounded square with a cross, pressed on with a pop. */
const Stamp: React.FC<{since: number; seed: number}> = ({since, seed}) => {
  const k = prog(since, 0, 0.16);
  const s = 1 + 0.6 * (1 - smooth(k));
  return (
    <g transform={`translate(${96 + hash01(seed) * 14} ${38 + hash01(seed + 1) * 10}) rotate(${(hash01(seed + 2) - 0.5) * 24}) scale(${s})`} opacity={Math.min(1, k * 4)}>
      <rect x={-30} y={-30} width={60} height={60} rx={11} fill="rgba(47,91,234,0.12)" stroke={COLORS.accent} strokeWidth={4.2} strokeOpacity={0.9} />
      <path d="M -14 -14 L 14 14 M 14 -14 L -14 14" stroke={COLORS.accent} strokeWidth={5.4} strokeLinecap="round" strokeOpacity={0.92} />
    </g>
  );
};

const Card: React.FC<{plan: CardPlan; t: number}> = ({plan, t}) => {
  const pose = cardPose(plan, t);
  if (!pose.visible) return null;
  const [x, y] = toRegion(pose.x, pose.y);
  return (
    <g transform={`translate(${x} ${y}) rotate(${pose.rot}) translate(${-CARD.w / 2} ${-CARD.h / 2})`}>
      <CardFace seed={plan.i * 11} tint={plan.tint} />
      {pose.stamp >= 0 ? <Stamp since={pose.stamp} seed={plan.i * 5} /> : null}
    </g>
  );
};

export const FallingCards: React.FC<{t: number}> = ({t}) => (
  <svg style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible'}}>
    {PLAN.slice(0, -1).map((p) => (
      <Card key={p.i} plan={p} t={t} />
    ))}
  </svg>
);

/** The card that passes every gate, then opens into the sheet with the line on it. */
export const BinderCard: React.FC<{t: number}> = ({t}) => {
  const last = PLAN[PLAN.length - 1] as CardPlan;
  if (t < last.release) return null;
  const u = smooth(prog(t, M.unfold.from, M.unfold.to - M.unfold.from));
  const fold = smooth(prog(t, 47.0, 0.6));
  if (t >= 47.6) return null;
  const w = CARD.w + (520 - CARD.w) * u;
  const h = CARD.h + (340 - CARD.h) * u;
  const pose = cardPose(last, t);
  const [cx, cy] = toRegion(TRAY.x, TRAY.y);
  const flying = t > 47.0;
  const sc = 1 - 0.7 * fold;
  const [px, py] = flying ? [cx, cy] : toRegion(pose.x, pose.y);
  const creases = (1 - u) * 0.4;
  return (
    <g transform={`translate(${px} ${py}) rotate(${-14 * fold}) scale(${sc}) translate(${-w / 2} ${-h / 2})`} opacity={1 - smooth(prog(t, 47.3, 0.3))}>
      {u < 0.02 ? (
        <CardFace seed={(PLAN.length - 1) * 11} tint={0} />
      ) : (
        <>
          <rect x={9} y={12} width={w} height={h} rx={9} fill="rgba(42,36,28,0.2)" />
          <rect x={0} y={0} width={w} height={h} rx={9} fill="#FBF8EF" stroke={COLORS.graphite} strokeOpacity={0.8} strokeWidth={2.6} />
          <rect x={0} y={0} width={w / 3} height={h} fill={`rgba(120,108,84,${creases})`} />
          <rect x={w / 3} y={0} width={w / 3} height={h} fill={`rgba(255,255,255,${creases * 0.5})`} />
          <rect x={(2 * w) / 3} y={0} width={w / 3} height={h} fill={`rgba(120,108,84,${creases})`} />
          <rect x={0} y={0} width={w} height={h / 2} fill={`rgba(255,255,255,${creases * 0.45})`} />
          <g opacity={1 - u}>
            <path d={`M 18 ${h * 0.3} L ${w - 36} ${h * 0.31}`} stroke={COLORS.graphite} strokeOpacity={0.3} strokeWidth={12} strokeLinecap="round" />
          </g>
          <g transform={`translate(${w / 2} ${h / 2 - 28})`}>
            <Written lines={["A binder for the one who", "holds the family's papers."]} x={0} y={0} size={44} font="Caveat" weight={500} t={t} start={M.cardText.from} dur={M.cardText.to - M.cardText.from} anchor="middle" />
          </g>
        </>
      )}
    </g>
  );
};

export {easeOutBack};
