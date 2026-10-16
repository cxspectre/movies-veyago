// previews.ts — review compositions (registered by src/previews.ts; never part of the film).
import {FORMATS, sec, slotFrames} from '../../film';
import type {PreviewSpec} from '../../previewTypes';
import {Scene} from './Scene';

/** One frame past the slot: the hard stop's own frame must be pure black (BIBLE 5.10, 7.2). */
export const previews: readonly PreviewSpec[] = [
  {id: 'Family-hardstop-wide', component: Scene, durationInFrames: slotFrames('familyOfDevices') + sec(1), ...FORMATS.wide},
  {id: 'Family-hardstop-tall', component: Scene, durationInFrames: slotFrames('familyOfDevices') + sec(1), ...FORMATS.tall},
];
