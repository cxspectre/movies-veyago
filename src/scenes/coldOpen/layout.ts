// layout.ts — where everything in the cold open sits, per format (BIBLE 2.8 framing, 2.10 desk slots, 4.1 note).
// Desk coordinates are the wide-desk framing at scale 1.0; sheet coordinates are the V1 sheet's own 1200x850 px.
import type {FormatName} from '../../film';
import {DESK_LAYOUT, type DeskPoint, type SheetSlot} from '../../desk';
import {SKETCH_SIZE} from '../../paper';

/** The phone frame convention (BIBLE 4): the outline's vertical extent and centre, sheet px. */
const PHONE = {top: 95, bottom: 755, centre: {x: 600, y: 425}} as const;
/** BIBLE 2.8: the V1 sheet's phone outline fills this much of the frame height in the cold-open framing. */
const PHONE_FRAME_FRACTION: Record<FormatName, number> = {wide: 0.7, tall: 0.55};

/**
 * The sticky note (BIBLE 2.6 / 4.1): 320 logical px with 60 px Kalam lettering in the wide framing, at -4 deg on
 * screen, over the middle of the sketch. The note is a physical object on the sheet, so its size and its angle
 * RELATIVE TO THE SHEET are the same in both formats (the tall framing is closer, so it reads larger there).
 */
const NOTE_WIDE = {logicalSize: 320, logicalText: 60, screenRotation: -4} as const;
/** Kalam leading for the three lines (BIBLE 2.6). */
export const NOTE_LEADING = 1.05;

export type NoteGeometry = {
  /** Centre on the sheet, sheet px. */
  readonly centre: DeskPoint;
  /** Side of the square note, sheet px. */
  readonly size: number;
  /** Lettering size, sheet px. */
  readonly textSize: number;
  /** Rotation relative to the sheet, degrees. */
  readonly rotation: number;
};

export type ColdOpenLayout = {
  readonly format: FormatName;
  readonly sheet: SheetSlot;
  /** Static framing (0-28 s): desk scale and the desk point at the frame centre. */
  readonly cameraScale: number;
  readonly cameraCentre: DeskPoint;
  readonly cup: {readonly centre: DeskPoint; readonly r: number};
  readonly note: NoteGeometry;
};

const RAD = Math.PI / 180;

/** A point on a sheet (sheet px) -> desk coordinates, through the sheet's slot transform. */
export const sheetToDesk = (slot: SheetSlot, p: DeskPoint): DeskPoint => {
  const dx = (p.x - SKETCH_SIZE.width / 2) * slot.scale;
  const dy = (p.y - SKETCH_SIZE.height / 2) * slot.scale;
  const c = Math.cos(slot.rotation * RAD);
  const s = Math.sin(slot.rotation * RAD);
  return {x: slot.centre.x + dx * c - dy * s, y: slot.centre.y + dx * s + dy * c};
};

/** Desk scale that puts the phone outline at the bible's fraction of the frame height. */
const cameraScaleFor = (format: FormatName): number => {
  const layout = DESK_LAYOUT[format];
  const phoneDeskPx = (PHONE.bottom - PHONE.top) * layout.v1Sheet.scale;
  return (PHONE_FRAME_FRACTION[format] * layout.height) / phoneDeskPx;
};

/** The note is sized once, from the wide framing (sheet px), and shared by both formats. */
const noteGeometry = (): NoteGeometry => {
  const wide = DESK_LAYOUT.wide;
  const logicalPerSheetPx = wide.v1Sheet.scale * cameraScaleFor('wide');
  return {
    centre: PHONE.centre,
    size: NOTE_WIDE.logicalSize / logicalPerSheetPx,
    textSize: NOTE_WIDE.logicalText / logicalPerSheetPx,
    rotation: NOTE_WIDE.screenRotation - wide.v1Sheet.rotation,
  };
};

/**
 * In the tall framing the desk slot of the cup (420, 470) lies just outside the narrow frame; for the cold open it
 * is set down this much further in, at the frame's lower-right edge, still at the sheet's lower-right corner.
 */
const TALL_CUP_NUDGE: DeskPoint = {x: -62, y: 10};

const cupFor = (format: FormatName): ColdOpenLayout['cup'] => {
  const slot = DESK_LAYOUT[format].coffeeCup;
  const nudge = format === 'tall' ? TALL_CUP_NUDGE : {x: 0, y: 0};
  return {centre: {x: slot.centre.x + nudge.x, y: slot.centre.y + nudge.y}, r: slot.size.w / 2};
};

const build = (format: FormatName): ColdOpenLayout => {
  const sheet = DESK_LAYOUT[format].v1Sheet;
  return {
    format,
    sheet,
    cameraScale: cameraScaleFor(format),
    cameraCentre: sheetToDesk(sheet, PHONE.centre),
    cup: cupFor(format),
    note: noteGeometry(),
  };
};

export const COLD_OPEN_LAYOUT: Record<FormatName, ColdOpenLayout> = {wide: build('wide'), tall: build('tall')};

/** The note's geometry for other modules (desk, wall) that show the V1 sheet with its note: sheet px, sheet-relative. */
export const V1_NOTE: NoteGeometry = noteGeometry();
