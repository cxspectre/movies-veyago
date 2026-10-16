// end.ts — the state the desk module leaves at 1:20 (its last frame), for the wall module to start from (BIBLE §2.8:
// the 1:20 cut keeps the 1.45 framing on the work area): the camera, the finished form page on the work area, the
// eleven pages on the stack (bottom to top), the V1 sheet, and pair A's pencil (sketch px of the work sheet).
import {DESK_LAYOUT, type DeskCamera, type PencilKind, type PencilRig, type SheetSlot} from '../../desk';
import type {FormatName} from '../../film';
import type {SketchId} from '../../sketches/registry';
import {deskEndCamera} from './camera';
import {handAAt} from './pencilA';
import {sheetsAt, type SheetPose} from './sheets';
import {frameOf, MODULE_SECONDS, PAGES} from './timing';

export type DeskEndState = {
  readonly camera: DeskCamera;
  readonly work: {readonly id: SketchId; readonly pose: SheetPose};
  readonly stack: readonly {readonly id: SketchId; readonly pose: SheetPose}[];
  readonly v1Sheet: SheetSlot;
  readonly handA: {readonly rig: PencilRig; readonly kind: PencilKind};
};

/** The last frame of the module (frame 1349 of 1350). */
const LAST_FRAME = frameOf(MODULE_SECONDS) - 1;

export const DESK_END = (format: FormatName): DeskEndState => {
  const t = LAST_FRAME / 30;
  const sheets = sheetsAt(format, t).map((s) => ({id: PAGES[s.index]?.id ?? 'form-to-chat', role: s.role, pose: s.pose}));
  const work = sheets.find((s) => s.role === 'work');
  if (!work) throw new Error('desk: no page on the work area at the end');
  const a = handAAt(LAST_FRAME);
  return {
    camera: deskEndCamera(format),
    work: {id: work.id, pose: work.pose},
    stack: sheets.filter((s) => s.role === 'stack').map((s) => ({id: s.id, pose: s.pose})),
    v1Sheet: DESK_LAYOUT[format].v1Sheet,
    handA: {rig: a.rig, kind: a.kind},
  };
};
