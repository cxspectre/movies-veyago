// SheetRegion.tsx — a chapter's place on the sheet. Mounts its children (live) only while the chapter runs and the zoom is
// near or mid; once the chapter is finished it draws the pre-rendered PNG instead and never re-runs the pencil canvas.
// Children see module-local time: they are wrapped in a <Sequence> that starts at the chapter's slot.
import React from 'react';
import {Img, Sequence, staticFile} from 'remotion';
import {sec} from '../film';
import {type ChapterId, slotFrames4, slotOf4} from '../film4';
import {REGIONS} from '../sheet4';
import {regionBounds, regionImageFile, regionMode} from './lod';
import {REGION_IMAGE_CROP} from './lodManifest';
import {useSheet} from './sheetContext';

export type SheetRegionProps = {
  readonly id: ChapterId;
  /** The chapter's live content, in region-local px (origin at the region's top-left). */
  readonly children?: React.ReactNode;
};

export const SheetRegion: React.FC<SheetRegionProps> = ({id, children}) => {
  const {masterSeconds, camera, viewport, startSeconds, showBounds} = useSheet();
  const mode = regionMode(id, masterSeconds, camera.zoom, viewport);
  if (mode === 'culled') return null;
  const b = regionBounds(id);
  const box: React.CSSProperties = {position: 'absolute', left: b.x0, top: b.y0, width: b.x1 - b.x0, height: b.y1 - b.y0};
  const bounds = showBounds ? (
    <div style={{...box, left: 0, top: 0, outline: `${6}px dashed rgba(47,91,234,0.45)`, outlineOffset: -3}} />
  ) : null;
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
  return (
    <div style={box}>
      <Sequence from={sec(slot.start - startSeconds)} durationInFrames={slotFrames4(id)} layout="none" name={id}>
        {children}
      </Sequence>
      {bounds}
    </div>
  );
};

export const regionSize = (id: ChapterId): readonly [number, number] => REGIONS[id].size;
