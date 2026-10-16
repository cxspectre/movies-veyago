// QuestionNote.tsx — the sticky note of shot 4 and pair B's hands on it: carried in, pressed at 27.0, smoothed flat
// on the chord at 28.0, then lettered "What are we still missing?" with the accent fineliner, 28.5-32.5.
// Sheet px (render inside the V1 sheet's SheetAt, after the PaperSheet so the carried note is never clipped).
import React, {useMemo} from 'react';
import {DESK_LAMP, DESK_PALETTE, Hand, PencilHand} from '../../desk';
import {compileSketch, PencilCanvas, StickyNote} from '../../paper';
import {FPS} from '../../film';
import type {ColdOpenLayout} from './layout';
import {LETTERING_FRAMES, LETTERING_SECONDS, letteringSpec} from './lettering';
import {carryOffset, noteState, PAIR_B_DIR, penPresence, penTravel, smoothHandPresence, smoothPad, stickyTiming} from './noteMotion';
import {NOTE, PEN} from './timing';

/** Pair B's hand angles in the note's own frame (0 = fingers up the screen), per format. */
const SMOOTH_ROTATION = {wide: -76, tall: -128} as const;
/** The fineliner's back end points this way while writing (degrees, screen; a right hand from the right). */
const PEN_YAW = {wide: 24, tall: 4} as const;

const NoteFrame: React.FC<{size: number; rotation: number; children: React.ReactNode}> = ({size, rotation, children}) => (
  <div style={{position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, transform: `rotate(${rotation}deg)`}}>{children}</div>
);

const Lettering: React.FC<{t: number; layout: ColdOpenLayout; zoom: number}> = ({t, layout, zoom}) => {
  const spec = useMemo(() => letteringSpec(layout.note), [layout.note]);
  const marks = useMemo(() => compileSketch(spec), [spec]);
  if (t < PEN.write.from) return null;
  const progress = (t - PEN.write.from) / LETTERING_SECONDS;
  return <PencilCanvas marks={marks} progress={progress} width={layout.note.size} height={layout.note.size} zoom={zoom} />;
};

const SmoothingHand: React.FC<{t: number; layout: ColdOpenLayout}> = ({t, layout}) => {
  const presence = smoothHandPresence(t);
  if (t < NOTE.carry.from || presence <= 0) return null;
  const pad = smoothPad(t, layout.note.size);
  return (
    <Hand
      pose="smooth"
      pair="B"
      x={pad.x}
      y={pad.y}
      anchor="pad"
      rotation={SMOOTH_ROTATION[layout.format]}
      lift={noteState(t).height}
      presence={presence}
      enterFrom={PAIR_B_DIR[layout.format]}
      travel={penTravel(layout)}
    />
  );
};

const PenHand: React.FC<{t: number; layout: ColdOpenLayout}> = ({t, layout}) => {
  const spec = useMemo(() => letteringSpec(layout.note), [layout.note]);
  const presence = penPresence(t);
  if (t < PEN.in.from || presence <= 0) return null;
  const d = PAIR_B_DIR[layout.format];
  const away = (1 - presence) * penTravel(layout);
  return (
    <PencilHand
      spec={spec}
      drawFrames={LETTERING_FRAMES}
      frame={(t - PEN.write.from) * FPS}
      kind="finelinerUncapped"
      pair="B"
      follow={{yawBase: PEN_YAW[layout.format], seed: 23}}
      style={{transform: `translate(${(d.x * away).toFixed(2)}px, ${(d.y * away).toFixed(2)}px)`}}
    />
  );
};

export const QuestionNote: React.FC<{t: number; layout: ColdOpenLayout; zoom: number}> = ({t, layout, zoom}) => {
  const {note} = layout;
  if (t < NOTE.carry.from) return null;
  const carry = carryOffset(t, layout);
  return (
    <div style={{position: 'absolute', left: note.centre.x + carry.x, top: note.centre.y + carry.y, width: 0, height: 0}}>
      <div style={{position: 'absolute', left: -note.size / 2, top: -note.size / 2}}>
        <StickyNote
          text=""
          size={note.size}
          rotate={note.rotation}
          lamp={DESK_LAMP}
          color={DESK_PALETTE.stickyFace}
          frame={t * FPS}
          zoom={zoom}
          {...stickyTiming}
        />
      </div>
      <NoteFrame size={note.size} rotation={note.rotation}>
        <Lettering t={t} layout={layout} zoom={zoom} />
        <SmoothingHand t={t} layout={layout} />
        <PenHand t={t} layout={layout} />
      </NoteFrame>
    </div>
  );
};
