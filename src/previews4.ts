import {FORMATS, sec} from './film';
import {MASTER4_SECONDS, SLOTS4, slotFrames4} from './film4';
import {CHAPTERS} from './chapters/registry';
import {MasterFilm4} from './MasterFilm4';
import type {PreviewSpec} from './previewTypes';
import {endlessPreviews} from './endless/previews';
import {popupPreviews} from './popup/previews';

const FORMAT_NAMES = ['wide', 'tall'] as const;

/**
 * The v4 compositions, registered through src/previews.ts:
 *   Master4-wide / -tall            the 10:00 master
 *   Chapter-<id>-wide / -tall       each chapter alone (module-local frames)
 *   Sheet4-wide / -tall, SheetRegionAlpha-<id>, SheetFarAlpha-<variant>   the endless sheet (src/endless)
 */
export const previews4: readonly PreviewSpec[] = [
  ...endlessPreviews,
  ...popupPreviews,
  ...FORMAT_NAMES.map((format) => ({
    id: `Master4-${format}`,
    component: MasterFilm4,
    durationInFrames: sec(MASTER4_SECONDS),
    ...FORMATS[format],
  })),
  ...SLOTS4.flatMap((slot) =>
    FORMAT_NAMES.map((format) => ({
      id: `Chapter-${slot.id}-${format}`,
      component: CHAPTERS[slot.id],
      durationInFrames: slotFrames4(slot.id),
      ...FORMATS[format],
    })),
  ),
];
