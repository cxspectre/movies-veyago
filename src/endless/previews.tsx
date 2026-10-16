import React from 'react';
import {FORMATS, sec} from '../film';
import {MASTER4_SECONDS} from '../film4';
import type {PreviewSpec} from '../previewTypes';
import {REGIONS, SHEET} from '../sheet4';
import {FarAlpha, RegionAlpha} from './lodImages';
import {FAR_IMAGE_SCALE, IMAGE_CHAPTERS} from './lod';
import {SheetFilm} from './SheetFilm';

const FORMAT_NAMES = ['wide', 'tall'] as const;

/**
 * The endless sheet's compositions:
 *   Sheet4-wide / -tall        the sheet with placeholder chapter marks and the unbroken line, 600 s
 *   Sheet4Bounds-wide / -tall  the same with every region's bounds outlined (review)
 *   SheetRegionAlpha-<id>      one region, transparent (-> public/tex/sheet/<id>.png at scale 2)
 *   SheetFarAlpha-rough/-done  the whole sheet at 1/8 scale, transparent (-> public/tex/sheet/far-<variant>.png)
 */
export const endlessPreviews: readonly PreviewSpec[] = [
  ...FORMAT_NAMES.map((format) => ({id: `Sheet4-${format}`, component: SheetFilm, durationInFrames: sec(MASTER4_SECONDS), ...FORMATS[format]})),
  ...FORMAT_NAMES.map((format) => ({
    id: `Sheet4Bounds-${format}`,
    component: () => React.createElement(SheetFilm, {showBounds: true}),
    durationInFrames: sec(MASTER4_SECONDS),
    ...FORMATS[format],
  })),
  ...IMAGE_CHAPTERS.map((id) => ({
    id: `SheetRegionAlpha-${id}`,
    component: () => React.createElement(RegionAlpha, {id}),
    durationInFrames: 1,
    width: REGIONS[id].size[0],
    height: REGIONS[id].size[1],
  })),
  ...(['rough', 'done'] as const).map((variant) => ({
    id: `SheetFarAlpha-${variant}`,
    component: () => React.createElement(FarAlpha, {variant}),
    durationInFrames: 1,
    width: SHEET.width * FAR_IMAGE_SCALE,
    height: SHEET.height * FAR_IMAGE_SCALE,
  })),
];
