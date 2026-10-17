// Chapter 3, "The no" (1:15-1:55, local 0-40). BIBLE4 §5.3; the script's "3. The no".
// Two rejection letters draw themselves and "Rejected" circles itself on each; 4.3(a) rolls; the letters crumple into
// one ball that opens into the engine cutaway; scissors cut the drawing in two (engine labelled keep, the old half faded and
// blurred); a calendar page drops with 21 circled; the engine is carried along the pencil line to the next region.
import React from 'react';
import {SUPERS, theNo as B} from '../../beats4';
import {COLORS} from '../../film';
import {ChapterShell, NumberRoll, Super, superFromBeat, useChapter} from '../../kit';
import {CrumpleBall, crumpleRest, PageDrop, ScissorsCut, SHEET_PAPER, UnfoldFromBall} from '../../popup';
import {EngineArt, LetterArt, OldPanelArt} from './art';
import {BALL_AT, CALENDAR, CARD, CARD_CUT, CARRY, DATE_ROLL, ENGINE, GUIDELINE_AT, LETTER, local, SPLIT, SUPER_AT, UNFOLD} from './layout';

const ID = 'theNo' as const;
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const smooth = (u: number): number => {
  const k = clamp01(u);
  return k * k * (3 - 2 * k);
};
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const SEEDS = [3, 7] as const;
/** The letters are drawn one after the other: letter i draws over [i * 1.5, i * 1.5 + 1.5]. */
const bodyOf = (i: number, t: number): number => clamp01((t - B.letters.from - i * 1.5) / 1.5);
const rejectedOf = (i: number, t: number): number => clamp01((t - B.rejected[i]!) / 0.8);
const circleOf = (i: number, t: number): number => clamp01((t - (B.circles.from + i * 0.5)) / 0.5);

const placed = (centre: readonly [number, number], w: number, h: number, extra: React.CSSProperties = {}): React.CSSProperties => {
  const [x, y] = local([centre[0], centre[1]]);
  return {position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, ...extra};
};

/** Letter i's content in the final state (what the CrumpleBall carries) or as it draws. */
const Letter: React.FC<{i: number; t: number; done?: boolean}> = ({i, t, done}) => (
  <LetterArt body={done ? 1 : bodyOf(i, t)} rejected={done ? 1 : rejectedOf(i, t)} circle={done ? 1 : circleOf(i, t)} seed={SEEDS[i]!} />
);

const Letters: React.FC<{t: number}> = ({t}) => {
  const {w, h} = LETTER;
  const k = smooth((t - B.crumple.from) / (B.crumple.to - B.crumple.from));
  if (t < B.crumple.from) {
    return (
      <>
        {LETTER.centres.map((c, i) => (
          <div
            key={i}
            style={placed(c, w, h, {
              background: SHEET_PAPER,
              borderRadius: 3,
              transform: `rotate(${LETTER.tilt[i]}deg)`,
              boxShadow: '3px 5px 9px rgba(60, 50, 30, 0.16)',
              visibility: bodyOf(i, t) > 0 ? 'visible' : 'hidden',
            })}
          >
            <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
              <Letter i={i} t={t} />
            </svg>
          </div>
        ))}
      </>
    );
  }
  if (t >= B.engineUnfolds.from) return null;
  return (
    <>
      {LETTER.centres.map((c, i) => (
        <div key={i} style={placed(c, w, h, {transform: `rotate(${lerp(LETTER.tilt[i]!, 0, k)}deg)`})}>
          <CrumpleBall w={w} h={h} time={t} start={B.crumple.from} duration={B.crumple.to - B.crumple.from} radius={LETTER.radius} to={[BALL_AT[0] - c[0], BALL_AT[1] - c[1]]}>
            <Letter i={i} t={t} done />
          </CrumpleBall>
        </div>
      ))}
    </>
  );
};

const CardArt: React.FC<{t: number}> = ({t}) => (
  <>
    <OldPanelArt t={t} w={CARD.cutX} />
    <g transform={`translate(${ENGINE.x} ${ENGINE.y})`}>
      <EngineArt t={t} />
    </g>
  </>
);

/** The ball opens into the card (13.0), then the scissors cut it (20.0-23.0) and the halves go their ways. */
const Card: React.FC<{t: number}> = ({t}) => {
  const [x, y] = local(CARD.centre);
  const unfolded = B.engineUnfolds.from + UNFOLD.duration + UNFOLD.fade;
  const carryK = smooth((t - B.carry.from) / 1.0);
  const u = clamp01((t - B.carry.from) / (B.carry.to - B.carry.from));
  const rightCentre = [CARD.cutX + (CARD.w - CARD.cutX) / 2 + SPLIT.right, CARD.h / 2] as const;
  // The right piece rides above the line's head: x follows the head, y lifts to sit 40 px above the line.
  const carryX = lerp(CARRY.from, CARRY.to, u) - CARRY.from;
  const lift = -(CARD.centre[1] - (4000 - CARRY.lift - (CARD.h * CARRY.scale) / 2)) * carryK;
  const scale = lerp(1, CARRY.scale, carryK);
  const wrap: React.CSSProperties = {
    position: 'absolute',
    left: x - CARD.w / 2,
    top: y - CARD.h / 2,
    width: CARD.w,
    height: CARD.h,
    transformOrigin: `${rightCentre[0]}px ${rightCentre[1]}px`,
    transform: `translate(${carryX}px, ${lift}px) scale(${scale})`,
  };
  if (t < B.engineUnfolds.from || t < B.crumple.to) return null;
  if (t < unfolded) {
    const rest = crumpleRest({w: LETTER.w, h: LETTER.h, radius: LETTER.radius});
    return (
      <div style={wrap}>
        <UnfoldFromBall w={CARD.w} h={CARD.h} time={t} start={B.engineUnfolds.from} duration={UNFOLD.duration} creaseFade={UNFOLD.fade} radius={LETTER.radius} from={rest}>
          <CardArt t={t} />
        </UnfoldFromBall>
      </div>
    );
  }
  return (
    <div style={wrap}>
      <ScissorsCut
        w={CARD.w}
        h={CARD.h}
        time={t}
        start={B.scissors.from}
        cut={B.scissors.to - B.scissors.from - 0.5}
        path={CARD_CUT}
        slideAt={B.split.from}
        slideDur={SPLIT.slideDur}
        fadeAt={B.split.fade.from}
        fadeDur={B.split.fade.to - B.split.fade.from}
        labelAt={B.split.keepLabelAt}
        left={{dx: SPLIT.left, fade: true}}
        right={{dx: SPLIT.right, label: 'keep'}}
        scissorsSize={300}
      >
        <CardArt t={t} />
      </ScissorsCut>
    </div>
  );
};

/** A roll is faded in over its own turn, so its zeroed wheels ("00 September 0000") are never seen at full strength. */
const Emerge: React.FC<{t: number; start: number; duration: number; children: React.ReactNode}> = ({t, start, duration, children}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, overflow: 'visible', opacity: smooth((t - start) / (duration * 0.7))}}>{children}</div>
);

export const Art: React.FC = () => {
  const {t} = useChapter(ID);
  const [cx, cy] = local(CALENDAR.centre);
  return (
    <>
      <Letters t={t} />
      <Emerge t={t} start={B.guideline.at} duration={1}>
        <NumberRoll to={B.guideline.text} start={B.guideline.at} duration={1} fadeIn={0} at={[GUIDELINE_AT[0] - 12, GUIDELINE_AT[1]]} align="right" size={64} hold={B.crumple.from - 0.5 - B.guideline.at - 1} fadeOut={0.5} />
      </Emerge>
      <GuidelineNote t={t} />
      <Card t={t} />
      <Super {...superFromBeat(SUPERS.theNo[0]!, {sheet: SUPER_AT, align: 'centre'})} />
      {t >= B.calendar.drop ? (
        <div style={{position: 'absolute', left: cx - CALENDAR.w / 2, top: cy - CALENDAR.h / 2, width: CALENDAR.w, height: CALENDAR.h}}>
          <PageDrop time={t} start={B.calendar.drop} fall={B.calendar.land - B.calendar.drop} month="September 2026" days={30} firstWeekday={1} circled={21} circleAt={B.calendar.circle} />
        </div>
      ) : null}
      <Emerge t={t} start={B.calendar.date.at} duration={1}>
        <NumberRoll to={B.calendar.date.text} start={B.calendar.date.at} duration={1} fadeIn={0} at={DATE_ROLL} align="centre" size={56} />
      </Emerge>
    </>
  );
};

/** "Design - Spam", Patrick Hand 36 graphite, written beside the roll (6.0-7.0). */
const GuidelineNote: React.FC<{t: number}> = ({t}) => {
  const p = clamp01((t - B.guideline.noteAt) / 1.0);
  if (p <= 0 || t > B.crumple.from - 0.5) return null;
  const [x, y] = local([GUIDELINE_AT[0] + 12, GUIDELINE_AT[1]]);
  return (
    <div style={{position: 'absolute', left: x, top: y - 36, height: 46, width: 300 * p, overflow: 'hidden', whiteSpace: 'nowrap', fontFamily: 'Patrick Hand, cursive', fontSize: 36, lineHeight: '46px', color: COLORS.graphite}}>
      {B.guideline.note}
    </div>
  );
};

export const Overlay: React.FC = () => null;
export const Chapter: React.FC = () => <ChapterShell id={ID} art={<Art />} overlay={<Overlay />} />;
