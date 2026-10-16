// sheetContext.ts — what every part of the endless sheet can ask: where the camera is, how zoomed in, what time it is.
import {createContext, useContext} from 'react';
import type {FormatName} from '../film';
import type {ChapterId} from '../film4';
import {slotOf4} from '../film4';
import type {Camera, SheetRect} from './camera';
import type {Lod} from './lod';
import type {Point} from '../sheet4';

export type SheetState = {
  readonly format: FormatName;
  /** Canvas size in logical px. */
  readonly width: number;
  readonly height: number;
  /** Master seconds (0-600) of the current frame. */
  readonly masterSeconds: number;
  /** Master seconds of the sheet's own frame 0 (0 for the whole film, a chapter's start for a chapter alone). */
  readonly startSeconds: number;
  readonly camera: Camera;
  readonly viewport: SheetRect;
  readonly lod: Lod;
  readonly showBounds: boolean;
};

export const SheetContext = createContext<SheetState | null>(null);

export const useSheet = (): SheetState => {
  const state = useContext(SheetContext);
  if (!state) throw new Error('useSheet must be used inside <EndlessSheet>');
  return state;
};

export type SheetCameraView = SheetState & {
  /** Module-local seconds of `chapterId`, when one was asked for (may be negative before it starts / beyond its end after). */
  readonly localSeconds: number | undefined;
  /** Sheet px -> screen px. */
  readonly toScreen: (p: Point) => Point;
  /** Screen px per sheet px. */
  readonly zoom: number;
  readonly centre: Point;
};

/** Where the camera is for a chapter: its local time, the zoom, the LOD level and a sheet->screen mapping. */
export const useSheetCamera = (chapterId?: ChapterId): SheetCameraView => {
  const s = useSheet();
  const {camera, width, height} = s;
  return {
    ...s,
    localSeconds: chapterId ? s.masterSeconds - slotOf4(chapterId).start : undefined,
    zoom: camera.zoom,
    centre: camera.centre,
    toScreen: (p) => [width / 2 + (p[0] - camera.centre[0]) * camera.zoom, height / 2 + (p[1] - camera.centre[1]) * camera.zoom],
  };
};
