import React from 'react';
import type {PreviewSpec} from '../previewTypes';
import {FORMATS, sec} from '../film';
import {ColourCheck} from './demos/ColourCheck';
import {DEMO_FRAMES, DevicesDemo} from './demos/DevicesDemo';
import {LookDev, LOOKDEV_POSES} from './demos/LookDev';
import {PhoneDemo} from './demos/PhoneDemo';
import {ScreenDrawDemo} from './demos/ScreenDrawDemo';

/** Registered automatically by src/previews.ts. Add this area's demo and review compositions here. */
export const devicePreviews: readonly PreviewSpec[] = [
  {id: 'Devices-demo-wide', component: DevicesDemo, durationInFrames: DEMO_FRAMES, ...FORMATS.wide},
  {id: 'Devices-demo-tall', component: DevicesDemo, durationInFrames: DEMO_FRAMES, ...FORMATS.tall},
  {id: 'Devices-phone-still-wide', component: () => React.createElement(PhoneDemo, {source: 'still'}), durationInFrames: sec(8), ...FORMATS.wide},
  {id: 'Devices-phone-video-wide', component: () => React.createElement(PhoneDemo, {source: 'video'}), durationInFrames: sec(6), ...FORMATS.wide},
  {id: 'Devices-lookdev-watch-wide', component: () => React.createElement(LookDev, {device: 'watch'}), durationInFrames: LOOKDEV_POSES.length, ...FORMATS.wide},
  {id: 'Devices-lookdev-wide', component: LookDev, durationInFrames: LOOKDEV_POSES.length, ...FORMATS.wide},
  {id: 'Devices-colour-check-wide', component: ColourCheck, durationInFrames: 1, ...FORMATS.wide},
  {id: 'Devices-screen-draw-wide', component: ScreenDrawDemo, durationInFrames: sec(3), ...FORMATS.wide},
];
