// Scene.tsx — module `desk` (0:35-1:20, shots 5-9): the sketching session. The cut to the wide desk with the V1
// sheet and its note, pair B bringing the first sheet, the push onto the work area, twelve pages slid in, drawn by
// pair A on the page's own schedule and pushed up-left onto the stack, and the form page's three gestures under the
// 1.25 -> 1.45 push. Ends on `DESK_END_CAMERA` with the form page finished on the work area.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {DESK_LAYOUT, DeskStage, Hand, PencilHand, SheetAt, type DeskCamera} from '../../desk';
import type {FormatName} from '../../film';
import {useFormat} from '../../useFormat';
import {cameraAt} from './camera';
import {B_TRAVEL, gripFor, handBAt} from './handB';
import {cupPencilsFor, handAAt, type HandAState} from './pencilA';
import {PageSheet, type PageContent} from './PageSheet';
import {sheetsAt, type SheetState} from './sheets';
import {frameOf, PAGES} from './timing';
import {V1Sheet} from './V1Sheet';

/**
 * Props drawn over the sheets. The face-down phone lies UNDER them here: every sheet slides in from its side of the
 * desk and passes over the phone's edge (paper rides over a phone; it cannot slide under one).
 */
const OVER_SHEETS = ['coffeeCup', 'pencilCup'] as const;
/** Below this a hand is off the desk: do not draw it at all. */
const PRESENT = 0.002;

const contentOf = (s: SheetState, t: number): PageContent => {
  const page = PAGES[s.index];
  if (!page || s.role === 'stack' || s.role === 'leaving') return {kind: 'still'};
  return t >= page.drawStart ? {kind: 'live', fromFrame: frameOf(page.drawStart), drawFrames: page.drawFrames} : {kind: 'blank'};
};

const HandA: React.FC<{format: FormatName; a: HandAState}> = ({format, a}) => {
  if (a.presence <= PRESENT) return null;
  const work = DESK_LAYOUT[format].activeSheet;
  return (
    <SheetAt centre={work.centre} scale={work.scale} rotation={work.rotation}>
      <PencilHand rig={a.rig} kind={a.kind} />
    </SheetAt>
  );
};

const HandB: React.FC<{format: FormatName; t: number}> = ({format, t}) => {
  const b = handBAt(format, t);
  if (!b || b.presence <= PRESENT) return null;
  const grip = gripFor(format, b.page);
  return (
    <SheetAt centre={b.sheet.centre} scale={b.sheet.scale} rotation={b.sheet.rotation}>
      <Hand pose="slide" pair="B" x={grip.at.x} y={grip.at.y} anchor="palm" rotation={grip.rotation} presence={b.presence} enterFrom={grip.edge} travel={B_TRAVEL} lift={b.lift} />
    </SheetAt>
  );
};

const Sheets: React.FC<{format: FormatName; t: number; camera: DeskCamera}> = ({format, t, camera}) => (
  <>
    <V1Sheet format={format} zoom={camera.scale} />
    {sheetsAt(format, t).map((s) => {
      const page = PAGES[s.index];
      return page ? <PageSheet key={page.id} id={page.id} index={s.index} pose={s.pose} content={contentOf(s, t)} /> : null;
    })}
  </>
);

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const {format} = useFormat();
  const t = frame / 30;
  const camera = cameraAt(format, t);
  const a = handAAt(frame);
  const hands = (
    <>
      <HandA format={format} a={a} />
      <HandB format={format} t={t} />
    </>
  );
  return (
    <DeskStage format={format} camera={camera} cupPencils={cupPencilsFor(a.kind)} over={OVER_SHEETS} above={hands}>
      <Sheets format={format} t={t} camera={camera} />
    </DeskStage>
  );
};
