// lodImages.tsx — compositions that render the LOD images (tools/renderSheetLod.ts stills them):
//   SheetRegionAlpha-<id>   one region, region-sized, transparent; still it at --scale=2 -> public/tex/sheet/<id>.png
//   SheetFarAlpha-<variant> the whole sheet at 1/8 scale, transparent: the glimpses (rough) or, for 'done', nothing
//                           (far-done.png is composed by the tool from the region PNGs, so it always agrees with them)
// A region is the chapter's own `Art`, held on its last frame (the finished state), in a near-zoom sheet context.
import React from 'react';
import {AbsoluteFill, Freeze, useVideoConfig} from 'remotion';
import {CHAPTER_MODULES} from '../chapters/registry';
import {FPS} from '../film';
import {type ChapterId, SLOTS4, slotFrames4, slotOf4} from '../film4';
import {KitScopeContext, regionOrigin} from '../kit/context';
import {REGIONS, SHEET} from '../sheet4';
import type {SheetRect} from './camera';
import {Glimpse} from './chapterMark';
import {FAR_IMAGE_SCALE, type FarVariant, IMAGE_CHAPTERS, regionBounds} from './lod';
import {SheetContext, type SheetState} from './sheetContext';

export const RegionAlpha: React.FC<{id: ChapterId}> = ({id}) => {
  // One image serves both formats, so the art is always laid out for the wide cut (region size alone must not pick 'tall').
  const {width, height} = useVideoConfig();
  const Art = CHAPTER_MODULES[id].Art;
  const last = slotFrames4(id) - 1;
  const b = regionBounds(id);
  const viewport: SheetRect = {x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1};
  const state: SheetState = {
    format: 'wide',
    width,
    height,
    masterSeconds: slotOf4(id).start + last / FPS,
    startSeconds: slotOf4(id).start,
    camera: {centre: [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2], zoom: 1},
    viewport,
    lod: 'near',
    showBounds: false,
    regionImage: true,
  };
  return (
    <AbsoluteFill>
      <SheetContext.Provider value={state}>
        <KitScopeContext.Provider value={{chapter: id, origin: regionOrigin(id)}}>
          <Freeze frame={last}>{Art ? <Art /> : null}</Freeze>
        </KitScopeContext.Provider>
      </SheetContext.Provider>
    </AbsoluteFill>
  );
};

export const FarAlpha: React.FC<{variant: FarVariant}> = ({variant}) => (
  <AbsoluteFill>
    <div style={{position: 'absolute', left: 0, top: 0, width: SHEET.width, height: SHEET.height, transform: `scale(${FAR_IMAGE_SCALE})`, transformOrigin: '0 0'}}>
      {variant === 'rough'
        ? SLOTS4.filter((s) => IMAGE_CHAPTERS.includes(s.id)).map((s) => {
            const b = regionBounds(s.id);
            return (
              <div key={s.id} style={{position: 'absolute', left: b.x0, top: b.y0, width: REGIONS[s.id].size[0], height: REGIONS[s.id].size[1]}}>
                <Glimpse id={s.id} />
              </div>
            );
          })
        : null}
    </div>
  </AbsoluteFill>
);
