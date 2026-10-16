// context.ts — what every kit piece asks: which chapter it is in (so it can turn the bible's SHEET coordinates into
// region-local px), what module-local second it is, and how far the camera is zoomed in (to keep pencil grain crisp).
import {createContext, useContext} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {SheetContext} from '../endless/sheetContext';
import {type ChapterId, slotOf4} from '../film4';
import {REGIONS, type Point} from '../sheet4';

export type KitScope = {
  /** The chapter this subtree belongs to (module-local time comes from its slot). */
  readonly chapter?: ChapterId;
  /** Sheet px of this subtree's (0, 0). A region's top-left inside <SheetRegion>; [0, 0] in screen space. */
  readonly origin: Point;
};

export const KitScopeContext = createContext<KitScope>({origin: [0, 0]});

/** The top-left of a chapter's region in sheet px: what <SheetRegion> uses as its children's (0, 0). */
export const regionOrigin = (id: ChapterId): Point => {
  const r = REGIONS[id];
  return [r.centre[0] - r.size[0] / 2, r.centre[1] - r.size[1] / 2];
};

/** Sheet px -> the current subtree's px (identity outside a chapter region). */
export const useToLocal = (): ((p: Point) => Point) => {
  const {origin} = useContext(KitScopeContext);
  return (p) => [p[0] - origin[0], p[1] - origin[1]];
};

/**
 * Module-local seconds, wherever the caller sits: inside a <SheetRegion> (whose frame is already module-local) or in
 * the sheet's screen-space overlay (whose frame is master-relative). With a sheet and a chapter in scope it is
 * master seconds minus the chapter's start; otherwise frame / fps.
 */
export const useLocalSeconds = (override?: number): number => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sheet = useContext(SheetContext);
  const {chapter} = useContext(KitScopeContext);
  if (override !== undefined) return override;
  if (sheet && chapter) return sheet.masterSeconds - slotOf4(chapter).start;
  return frame / fps;
};

/** The camera zoom (screen px per sheet px), 1 outside the sheet. Pass it to the engine so grain stays pencil-sized. */
export const useSheetZoom = (): number => useContext(SheetContext)?.camera.zoom ?? 1;

/** True when the live engine may run here (zoom ≥ LOD.near, or no sheet at all). Screens decode video only then. */
export const useIsNear = (): boolean => {
  const sheet = useContext(SheetContext);
  return sheet ? sheet.lod === 'near' : true;
};

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
export const smoothstep = (v: number): number => {
  const k = clamp01(v);
  return k * k * (3 - 2 * k);
};
export const easeOutCubic = (v: number): number => 1 - (1 - clamp01(v)) ** 3;
