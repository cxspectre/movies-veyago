import {FORMATS, sec} from '../film';
import type {PreviewSpec} from '../previewTypes';
import {KIT_DEMO_SECONDS, KitDemo} from './demo/KitDemo';

/** Kit-demo-wide / Kit-demo-tall: Super in each ink, NumberRoll, ScreenOnPaper laptop and phone (src/kit/README.md). */
export const kitPreviews: readonly PreviewSpec[] = (['wide', 'tall'] as const).map((format) => ({
  id: `Kit-demo-${format}`,
  component: KitDemo,
  durationInFrames: sec(KIT_DEMO_SECONDS),
  ...FORMATS[format],
}));
