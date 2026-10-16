// previews.ts — review compositions for the transition (registered by src/previews.ts; never part of the film).
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {FORMATS, sec, slotFrames} from '../../film';
import type {PreviewSpec} from '../../previewTypes';
import {useFormat} from '../../useFormat';
import {GlassPhase} from './GlassPhase';
import {PaperPhase} from './PaperPhase';
import {isLifting} from './timing';

/** The module run at a time offset, so a review composition can start at the lift-off or a snap. */
const fromSecond =
  (offset: number): React.FC =>
  () => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();
    const {format, width, height} = useFormat();
    const t = offset + frame / fps;
    const size = {width, height};
    return isLifting(t)
      ? React.createElement(GlassPhase, {t, format, size})
      : React.createElement(PaperPhase, {t, format, size});
  };

const LIFT_OFF_FROM = 6.5;

export const previews: readonly PreviewSpec[] = [
  {id: 'Transition-liftoff-wide', component: fromSecond(LIFT_OFF_FROM), durationInFrames: slotFrames('transition') - sec(LIFT_OFF_FROM), ...FORMATS.wide},
  {id: 'Transition-liftoff-tall', component: fromSecond(LIFT_OFF_FROM), durationInFrames: slotFrames('transition') - sec(LIFT_OFF_FROM), ...FORMATS.tall},
];
