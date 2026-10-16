// EffectsDemo.tsx — proof compositions for the chapter 3 paper effects: a "Rejected" letter crumples into a ball that
// rolls, settles and unfolds into the engine cutaway; scissors cut a card in two (keep / fade); a calendar page drops.
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FPS} from '../../../film';
import {PaperSheet} from '../../../paper';
import {Box, Line, Ring, Scribble} from '../../art';
import {CrumpleBall, crumpleRest, UnfoldFromBall} from '../CrumpleBall';
import {PageDrop} from '../PageDrop';
import {ScissorsCut} from '../ScissorsCut';

export const EFFECTS_DEMO_FRAMES = 8 * FPS;

const LETTER = {w: 460, h: 600};
const ENGINE = {w: 560, h: 340};
const CARD = {w: 640, h: 320};
const BALL_R = 120;
const CRUMPLE_AT = 0.3;
const UNFOLD_AT = 4.2;

/** The rejection letter: header, scribbled body, "Rejected" circled in accent. */
const RejectedLetter: React.FC = () => {
  const {w, h} = LETTER;
  return (
    <>
      <Line x1={w * 0.1} y1={h * 0.1} x2={w * 0.55} y2={h * 0.1} seed={3} width={2.6} />
      <Line x1={w * 0.1} y1={h * 0.15} x2={w * 0.34} y2={h * 0.15} seed={4} width={1.6} />
      <Scribble x={w * 0.1} y={h * 0.26} w={w * 0.8} rows={6} gap={h * 0.06} seed={20} />
      <text x={w * 0.5} y={h * 0.78} textAnchor="middle" fontFamily="Patrick Hand" fontSize={48} fill={COLORS.graphite}>
        Rejected
      </text>
      <Ring cx={w * 0.5} cy={h * 0.76} r={95} seed={8} width={3} ink={COLORS.accent} />
    </>
  );
};

const GEARS = [
  {cx: 0.2, cy: 0.42, label: 'storage'},
  {cx: 0.4, cy: 0.62, label: 'sync'},
  {cx: 0.6, cy: 0.42, label: 'reminders'},
  {cx: 0.8, cy: 0.62, label: 'export'},
];

/** The engine cutaway: a block with four labelled gears, in a box of w x h. */
const Engine: React.FC<{x: number; y: number; w: number; h: number}> = ({x, y, w, h}) => (
  <>
    <Box x={x + w * 0.04} y={y + h * 0.1} w={w * 0.92} h={h * 0.8} seed={5} width={2.6} />
    {GEARS.map((g, i) => (
      <React.Fragment key={g.label}>
        <Ring cx={x + w * g.cx} cy={y + h * g.cy} r={h * 0.15} seed={40 + i} width={2.2} fill="rgba(47,91,234,0.08)" />
        <Ring cx={x + w * g.cx} cy={y + h * g.cy} r={h * 0.045} seed={50 + i} width={1.6} />
        <text x={x + w * g.cx} y={y + h * g.cy + (i % 2 ? h * 0.27 : -h * 0.2)} textAnchor="middle" fontFamily="Patrick Hand" fontSize={Math.round(h * 0.08)} fill={COLORS.graphite}>
          {g.label}
        </text>
      </React.Fragment>
    ))}
  </>
);

/** The card the scissors cut: the old name, idea and purpose (scribbles) on the left, the engine on the right. */
const CardArt: React.FC = () => (
  <>
    <Scribble x={30} y={110} w={240} rows={3} gap={50} seed={70} />
    <Engine x={CARD.w / 2 + 6} y={40} w={CARD.w / 2 - 20} h={CARD.h - 80} />
  </>
);

const CUT_PATH = [
  [320, 0],
  [318, 110],
  [323, 210],
  [320, 320],
] as const;

type Slot = {readonly x: number; readonly y: number; readonly scale: number};
const LAYOUT: Record<'wide' | 'tall', {crumple: Slot; scissors: Slot; page: Slot}> = {
  wide: {
    crumple: {x: 70, y: 220, scale: 0.8},
    scissors: {x: 690, y: 400, scale: 0.72},
    page: {x: 1450, y: 170, scale: 0.72},
  },
  tall: {
    crumple: {x: 330, y: 80, scale: 0.9},
    scissors: {x: 220, y: 860, scale: 0.95},
    page: {x: 320, y: 1330, scale: 0.7},
  },
};

const placed = (s: Slot, w: number, h: number): React.CSSProperties => ({
  position: 'absolute',
  left: s.x,
  top: s.y,
  width: w,
  height: h,
  transformOrigin: '0 0',
  transform: `scale(${s.scale})`,
});

const REST = crumpleRest({w: LETTER.w, h: LETTER.h, radius: BALL_R});

export const EffectsDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const t = frame / FPS;
  const slots = LAYOUT[width > height ? 'wide' : 'tall'];
  return (
    <AbsoluteFill>
      <PaperSheet width={width} height={height} curl={0} falloff={0.04}>
        <div style={placed(slots.crumple, LETTER.w, LETTER.h)}>
          {t < UNFOLD_AT ? (
            <CrumpleBall w={LETTER.w} h={LETTER.h} time={t} start={CRUMPLE_AT} duration={2} radius={BALL_R}>
              <RejectedLetter />
            </CrumpleBall>
          ) : (
            // Same seed, mesh and radius, centred on the same point: the ball hands over without a jump.
            <UnfoldFromBall w={ENGINE.w} h={ENGINE.h} time={t} start={UNFOLD_AT} duration={2} radius={BALL_R} from={REST} style={{position: 'absolute', left: (LETTER.w - ENGINE.w) / 2, top: (LETTER.h - ENGINE.h) / 2}}>
              <Engine x={0} y={0} w={ENGINE.w} h={ENGINE.h} />
            </UnfoldFromBall>
          )}
        </div>
        <div style={placed(slots.scissors, CARD.w, CARD.h)}>
          <ScissorsCut w={CARD.w} h={CARD.h} time={t} start={0.5} cut={2.5} path={CUT_PATH} left={{dx: -220, fade: true}} right={{dx: 160, label: 'keep'}} scissorsSize={260}>
            <CardArt />
          </ScissorsCut>
        </div>
        <div style={placed(slots.page, 520, 600)}>
          <PageDrop
            time={t}
            start={2.0}
            month="September 2026"
            days={30}
            firstWeekday={1}
            circled={21}
            circleAt={3.2}
            anchor={
              <div style={{width: 360, height: 70, border: `2px dashed ${COLORS.graphiteSoft}`, opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Patrick Hand', fontSize: 24, color: COLORS.graphiteSoft}}>
                NumberRoll anchor
              </div>
            }
          />
        </div>
      </PaperSheet>
    </AbsoluteFill>
  );
};
