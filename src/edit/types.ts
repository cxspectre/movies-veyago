// types.ts — the cut-down player's public types. Scene owners import `EditableSceneProps` from 'src/edit' when
// they want to behave differently inside a cut-down (see README.md, "EditableScene").
import type React from 'react';
import type {EditProps, EditSegment, Edl} from '../edits';
import type {FormatName, ModuleId} from '../film';

/** One EDL segment placed on the edit's own timeline (frames are edit frames, seconds are edit seconds). */
export type PlacedSegment = {
  index: number;
  segment: EditSegment;
  module: ModuleId;
  /** Edit frame of the segment's first frame, and its length in frames (from edits.ts `segmentFrames`). */
  startFrame: number;
  durationFrames: number;
  /** Module-local frame the segment starts on (the negative <Sequence from> offset). */
  moduleFromFrame: number;
  /** Edit seconds. */
  start: number;
  end: number;
  /** Master seconds of the slice (slot start + module-local from/to). */
  masterFrom: number;
  masterTo: number;
  /** The slice lies inside a window the beat sheet declares pure black: the player draws #000, not the scene. */
  black: boolean;
};

/**
 * Props a scene's optional `EditableScene` export receives inside a cut-down. Inside it `useCurrentFrame()` is the
 * MODULE-LOCAL frame, exactly as for the plain `Scene` (the player applies the negative offset), so a scene can
 * reuse its whole frame -> state mapping and only read these props to adapt (e.g. keep the sticky note clear of a
 * caption, or skip a slide-in in a half-second montage slice).
 */
export type EditableSceneProps = {
  edlId: Edl['id'];
  format: FormatName;
  segmentIndex: number;
  /** Module-local seconds the slice covers. */
  from: number;
  to: number;
  /** The segment's EditProps from src/edits.ts (music, vo, captions, captionTone, sfxAt, and any later prop). */
  props: EditProps | undefined;
  /** A burned-in caption is drawn over this segment: keep the caption band clear (`CAPTION_BAND` in captionLayout.ts). */
  captioned: boolean;
};

export type EditableScene = React.FC<EditableSceneProps>;
