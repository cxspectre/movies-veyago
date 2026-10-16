import {FORMATS} from '../film';
import type {PreviewSpec} from '../previewTypes';
import {POPUP_DEMO_FRAMES, PopUpDemo} from './demo/PopUpDemo';

/** Registered through src/previews4.ts. Proof compositions for the pop-up paper component. */
export const popupPreviews: readonly PreviewSpec[] = [
  {id: 'PopUp-demo-wide', component: PopUpDemo, durationInFrames: POPUP_DEMO_FRAMES, ...FORMATS.wide},
  {id: 'PopUp-demo-tall', component: PopUpDemo, durationInFrames: POPUP_DEMO_FRAMES, ...FORMATS.tall},
];
