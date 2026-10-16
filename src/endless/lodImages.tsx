// lodImages.tsx — compositions that render the LOD images (tools/renderSheetLod.ts stills them):
//   SheetRegionAlpha-<id>   one region, region-sized, transparent; still it at --scale=2 -> public/tex/sheet/<id>.png
//   SheetFarAlpha-<variant> the whole sheet at 1/8 scale, transparent: the glimpses (rough) or the finished regions (done)
// Today they draw the placeholder marks; chapter owners swap in their finished chapters.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {type ChapterId, SLOTS4} from '../film4';
import {REGIONS, SHEET} from '../sheet4';
import {ChapterMark, Glimpse} from './chapterMark';
import {FAR_IMAGE_SCALE, type FarVariant, IMAGE_CHAPTERS, regionBounds} from './lod';

export const RegionAlpha: React.FC<{id: ChapterId}> = ({id}) => (
  <AbsoluteFill>
    <ChapterMark id={id} finished />
  </AbsoluteFill>
);

export const FarAlpha: React.FC<{variant: FarVariant}> = ({variant}) => (
  <AbsoluteFill>
    <div style={{position: 'absolute', left: 0, top: 0, width: SHEET.width, height: SHEET.height, transform: `scale(${FAR_IMAGE_SCALE})`, transformOrigin: '0 0'}}>
      {SLOTS4.filter((s) => IMAGE_CHAPTERS.includes(s.id)).map((s) => {
        const b = regionBounds(s.id);
        return (
          <div key={s.id} style={{position: 'absolute', left: b.x0, top: b.y0, width: REGIONS[s.id].size[0], height: REGIONS[s.id].size[1]}}>
            {variant === 'rough' ? <Glimpse id={s.id} /> : <ChapterMark id={s.id} finished />}
          </div>
        );
      })}
    </div>
  </AbsoluteFill>
);
