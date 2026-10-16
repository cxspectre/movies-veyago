import {FORMATS} from '../../film';
import type {PreviewSpec} from '../../previewTypes';
import {EFFECTS_DEMO_FRAMES, EffectsDemo} from './demo/EffectsDemo';

/** Registered through src/previews4.ts. Proof compositions for the chapter 3 paper effects (A3). */
export const effectsPreviews: readonly PreviewSpec[] = [
  {id: 'Effects-demo-wide', component: EffectsDemo, durationInFrames: EFFECTS_DEMO_FRAMES, ...FORMATS.wide},
  {id: 'Effects-demo-tall', component: EffectsDemo, durationInFrames: EFFECTS_DEMO_FRAMES, ...FORMATS.tall},
];
