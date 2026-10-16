// CentreSheet.tsx — the one page on the wall that runs the pencil engine: binder-home-v2, drawn live on the clock
// of <Sequence from={wall.centreSheet.sequenceFrom}> (page frame = module frame - sequenceFrom, passed explicitly so
// review stills of any wall frame draw the same page) with drawFrames `wall.centreSheet.drawFrames` (BIBLE §4.14).
// It arrives drawn to its base (the "2" done) and pair A's hand draws the two chips and their circle during the push.
import React from 'react';
import {wall} from '../../beats';
import {PAIR_SIZE, presenceAt, presenceOffset, SheetAt, SKETCH_PX_PER_MM, type DeskCamera, DESK_LAMP} from '../../desk';
import {FORMATS, FPS, type FormatName} from '../../film';
import {GraphiteSketch} from '../../paper';
import {spec} from '../../sketches/binder-home-v2';
import {type ArmReach, exitFromDown, reachMm} from './armReach';
import {centreSlot, tileScale} from './grid';
import {ReachingPencilHand} from './ReachingPencilHand';
import {SheetOnDesk} from './SheetOnDesk';
import type {SheetFlight} from './flight';

const CS = wall.centreSheet;
/** The sheet is never shown less drawn than its base: it is carried in finished up to the corner "2". */
const BASE_DONE_FRAME = Math.ceil(CS.baseDoneFraction * CS.drawFrames);
/** Zoom is quantised so the engine's canvas is not re-allocated on every frame of the push. */
const ZOOM_STEP = 0.25;

/** Pair A's pencil hand: in before the chips start, out by `handClearBy` (module-local seconds). */
const HAND_IN = {from: CS.chipsDrawn.from - 0.8, to: CS.chipsDrawn.from - 0.05};
const HAND_OUT = {from: CS.chipsDrawn.to + 0.05, to: CS.handClearBy};
/** How far (sketch px) the hand sits beyond the bottom edge when out: clear of the frame even at the top of the rise. */
const HAND_TRAVEL = 2800;
/**
 * The arm leaves the frame this way (degrees right of straight down): tall, toward the bottom-right corner, right of
 * the face-down phone, over one corner of the map; wide, nearly straight down past the speech bubbles.
 */
const ARM_EXIT_DEG: Record<FormatName, number> = {wide: 20, tall: 46};

/** The arm, long enough to leave the frame at the widest the camera gets (the top of the rise). */
const armReach = (format: FormatName): ArmReach => {
  const {width, height} = FORMATS[format];
  return {exit: exitFromDown(ARM_EXIT_DEG[format]), lengthMm: reachMm(Math.hypot(width, height), tileScale(format) * wall.rise.scaleTo, SKETCH_PX_PER_MM * PAIR_SIZE.A)};
};

export const engineZoom = (format: FormatName, cam: DeskCamera): number => Math.max(ZOOM_STEP, Math.ceil((tileScale(format) * cam.scale) / ZOOM_STEP) * ZOOM_STEP);

/** The page's own frame at module frame `frame`. */
export const pageFrame = (frame: number): number => frame - CS.sequenceFrom;

/** The centre sheet itself, wherever its flight has it. */
export const CentreSheet: React.FC<{readonly format: FormatName; readonly flight: SheetFlight; readonly zoom: number; readonly frame: number}> = ({format, flight, zoom, frame}) => (
  <SheetOnDesk centre={flight.centre} rotation={flight.rotation} scale={tileScale(format)} height={flight.height} lamp={DESK_LAMP}>
    <GraphiteSketch spec={spec} drawFrames={CS.drawFrames} frame={Math.max(pageFrame(frame), BASE_DONE_FRAME)} zoom={zoom} />
  </SheetOnDesk>
);

const PencilHandOnPage: React.FC<{readonly format: FormatName; readonly t: number; readonly frame: number}> = ({format, t, frame}) => {
  const k = presenceAt(t, {enter: HAND_IN, exit: HAND_OUT, easeIn: 'easeOutCubic', easeOut: 'easeInOutSine'});
  if (k <= 0) return null;
  const off = presenceOffset(k, HAND_TRAVEL, 'bottom');
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transform: `translate(${off.x.toFixed(2)}px, ${off.y.toFixed(2)}px)`}}>
      <ReachingPencilHand reach={armReach(format)} spec={spec} drawFrames={CS.drawFrames} frame={pageFrame(frame)} pair="A" />
    </div>
  );
};

/** Pair A drawing the chips: in sketch px of the landed centre sheet, above everything else. */
export const CentreSheetHand: React.FC<{readonly format: FormatName; readonly frame: number}> = ({format, frame}) => {
  const t = frame / FPS;
  if (t < HAND_IN.from || t > HAND_OUT.to) return null;
  const slot = centreSlot(format);
  return (
    <SheetAt centre={slot.centre} scale={tileScale(format)} rotation={0}>
      <PencilHandOnPage format={format} t={t} frame={frame} />
    </SheetAt>
  );
};
