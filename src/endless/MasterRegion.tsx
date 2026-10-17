// MasterRegion.tsx — a chapter's place on the sheet in the single-sheet master (Master4). Like <SheetRegion>, but a
// finished chapter whose region image is not final yet stays as its own art FROZEN on its last frame (time and frame both
// held), so the camera passing over it sees the real drawing, not the placeholder PNG. Once a chapter's RegionAlpha draws
// its finished state and tools/renderSheetLod.ts has been re-run, add its id to FINAL_REGION_IMAGES: the image takes over
// and the pencil canvas never re-runs (contract 12.6).
import React from 'react';
import {Freeze, Img, Sequence, staticFile} from 'remotion';
import {FPS, sec} from '../film';
import {type ChapterId, slotFrames4, slotOf4} from '../film4';
import {LOD, REGIONS} from '../sheet4';
import {farOpacity, grown, regionBounds, regionImageFile, touches} from './lod';
import {REGION_IMAGE_CROP} from './lodManifest';
import {SheetContext, useSheet} from './sheetContext';
import {stateAt} from './timeline';

/** Chapters whose public/tex/sheet/<id>.png shows the finished chapter (its Art held on its last frame; docs/v4/LOD.md).
 * `line` has none (it draws nothing on paper: the pencil line itself is live) and `paperToGlass` has no region. */
export const FINAL_REGION_IMAGES: ReadonlySet<ChapterId> = new Set<ChapterId>([
  'mayasHouse', 'theNo', 'filterMachine', 'researchBoard', 'nameAndLook', 'engineRoom', 'launch', 'village', 'providedFor',
]);

/** Below this zoom a finished region is not mounted (the far image carries it). */
export const FROZEN_MIN_ZOOM = LOD.far;

export type MasterRegionMode = 'culled' | 'empty' | 'live' | 'frozen' | 'image';

export const masterRegionMode = (id: ChapterId, master: number, zoom: number, viewport: Parameters<typeof grown>[0]): MasterRegionMode => {
  if (REGIONS[id].size[0] <= 0 || !touches(regionBounds(id), grown(viewport))) return 'culled';
  const state = stateAt(id, master);
  if (state === 'future') return 'empty';
  if (state === 'active') return zoom >= LOD.far ? 'live' : 'empty';
  if (FINAL_REGION_IMAGES.has(id)) return zoom >= LOD.far ? 'image' : 'empty';
  return zoom >= FROZEN_MIN_ZOOM ? 'frozen' : 'empty';
};

export type MasterRegionProps = {
  readonly id: ChapterId;
  /** The chapter's art, in region-local px (wrap it in the kit scope before passing it in). */
  readonly children?: React.ReactNode;
};

export const MasterRegion: React.FC<MasterRegionProps> = ({id, children}) => {
  const sheet = useSheet();
  const {masterSeconds, camera, viewport, startSeconds, showBounds} = sheet;
  const mode = masterRegionMode(id, masterSeconds, camera.zoom, viewport);
  if (mode === 'culled') return null;
  const b = regionBounds(id);
  // Fade out as the far image fades in (zoom 0.30 -> 0.15), so the pull-backs do not drop a region in one frame.
  const fade = 1 - farOpacity(camera.zoom);
  const box: React.CSSProperties = {position: 'absolute', left: b.x0, top: b.y0, width: b.x1 - b.x0, height: b.y1 - b.y0, ...(fade < 1 ? {opacity: fade} : {})};
  const bounds = showBounds ? <div style={{...box, left: 0, top: 0, outline: '6px dashed rgba(47,91,234,0.45)', outlineOffset: -3}} /> : null;
  if (mode === 'empty') return bounds ? <div style={box}>{bounds}</div> : null;
  if (mode === 'image') {
    const crop = REGION_IMAGE_CROP[id] ?? {x: 0, y: 0, w: b.x1 - b.x0, h: b.y1 - b.y0};
    return (
      <div style={box}>
        <Img src={staticFile(regionImageFile(id))} style={{position: 'absolute', left: crop.x, top: crop.y, width: crop.w, height: crop.h, display: 'block', maxWidth: 'none'}} />
        {bounds}
      </div>
    );
  }
  const slot = slotOf4(id);
  const frames = slotFrames4(id);
  if (mode === 'live') {
    return (
      <div style={box}>
        <Sequence from={sec(slot.start - startSeconds)} durationInFrames={frames} layout="none" name={id}>
          {children}
        </Sequence>
        {bounds}
      </div>
    );
  }
  // frozen: the chapter's last frame. Kit pieces read master time from the sheet, so hold that too; the camera stays live.
  const lastFrame = frames - 1;
  const held = {...sheet, masterSeconds: slot.start + lastFrame / FPS};
  return (
    <div style={box}>
      <SheetContext.Provider value={held}>
        <Sequence from={sec(slot.start - startSeconds)} layout="none" name={`${id} (held)`}>
          <Freeze frame={lastFrame}>{children}</Freeze>
        </Sequence>
      </SheetContext.Provider>
      {bounds}
    </div>
  );
};
