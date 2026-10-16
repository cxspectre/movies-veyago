import {FORMATS} from '../film';
import type {PreviewSpec} from '../previewTypes';
import {DESK_KIT_FRAMES, DeskKitDemo} from './demo/DeskKitDemo';
import {HANDS_DEMO_FRAMES, HandsDemo, HandsShadowsDemo} from './demo/HandsDemo';
import {POSES_DEMO_FRAMES, PosesCloseup, PosesDemo} from './demo/PosesDemo';

/** Registered automatically by src/previews.ts. The desk kit's demo and review compositions. */
export const deskPreviews: readonly PreviewSpec[] = [
  {id: 'Desk-kit-wide', component: DeskKitDemo, durationInFrames: DESK_KIT_FRAMES, ...FORMATS.wide},
  {id: 'Desk-kit-tall', component: DeskKitDemo, durationInFrames: DESK_KIT_FRAMES, ...FORMATS.tall},
  {id: 'Hands-demo-wide', component: HandsDemo, durationInFrames: HANDS_DEMO_FRAMES, ...FORMATS.wide},
  {id: 'Hands-demo-tall', component: HandsDemo, durationInFrames: HANDS_DEMO_FRAMES, ...FORMATS.tall},
  {id: 'Hands-shadows-wide', component: HandsShadowsDemo, durationInFrames: HANDS_DEMO_FRAMES, ...FORMATS.wide},
  {id: 'Hands-poses-wide', component: PosesDemo, durationInFrames: POSES_DEMO_FRAMES, ...FORMATS.wide},
  {id: 'Hands-closeup-wide', component: PosesCloseup, durationInFrames: POSES_DEMO_FRAMES, ...FORMATS.wide},
];
