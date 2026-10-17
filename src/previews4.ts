import React from 'react';
import {FORMATS, sec} from './film';
import {MASTER4_SECONDS, SLOTS4, slotFrames4} from './film4';
import {CHAPTER_MODULES, CHAPTERS} from './chapters/registry';
import {MasterFilm4, MasterFilm4Series} from './MasterFilm4';
import type {PreviewSpec} from './previewTypes';
import {characterPreviews} from './characters/previews';
import {endlessPreviews} from './endless/previews';
import {popupPreviews} from './popup/previews';
import {kitPreviews} from './kit/previews';
import {effectsPreviews} from './popup/effects/previews';

const FORMAT_NAMES = ['wide', 'tall'] as const;

/**
 * The v4 compositions, registered through src/previews.ts:
 *   Master4-wide / -tall            the 10:00 master: one sheet, one line, one camera (src/MasterFilm4.tsx)
 *   Master4-series-wide / -tall     the old back-to-back master (each chapter alone, for debugging)
 *   Master4Bounds-wide / -tall      the one-sheet master with every region outlined
 *   Chapter-<id>-wide / -tall       each chapter alone (module-local frames)
 *   CharacterSheet-wide, Maya-poses-wide   the line characters' style test (src/characters/previews.ts)
 *   Sheet4-wide / -tall, SheetRegionAlpha-<id>, SheetFarAlpha-<variant>   the endless sheet (src/endless)
 *   anything a chapter folder exports as `previews` (src/chapters/<id>/index.ts): chapter owners never edit this file
 */
export const previews4: readonly PreviewSpec[] = [
  ...endlessPreviews,
  ...popupPreviews,
  ...kitPreviews,
  ...effectsPreviews,
  ...FORMAT_NAMES.map((format) => ({
    id: `Master4-${format}`,
    component: MasterFilm4,
    durationInFrames: sec(MASTER4_SECONDS),
    ...FORMATS[format],
  })),
  // C1: the back-to-back debug master and the bounds view of the one-sheet master.
  ...FORMAT_NAMES.flatMap((format) => [
    {id: `Master4-series-${format}`, component: MasterFilm4Series, durationInFrames: sec(MASTER4_SECONDS), ...FORMATS[format]},
    {id: `Master4Bounds-${format}`, component: () => React.createElement(MasterFilm4, {showBounds: true}), durationInFrames: sec(MASTER4_SECONDS), ...FORMATS[format]},
  ]),
  ...characterPreviews,
  ...SLOTS4.flatMap((slot) =>
    FORMAT_NAMES.map((format) => ({
      id: `Chapter-${slot.id}-${format}`,
      component: CHAPTERS[slot.id],
      durationInFrames: slotFrames4(slot.id),
      ...FORMATS[format],
    })),
  ),
  ...Object.values(CHAPTER_MODULES).flatMap((m) => m.previews ?? []),
];
