// Scene.tsx — module `transition` (1:31-1:48, local 0-17; shots 12-13; BIBLE 5). The language changes here: the
// centre sheet's graphite catches light stroke by stroke while the paper fades to nothing (PaperPhase), then at 7.0
// the lit drawing lifts off into the phone and snaps into the real interface on the beats (GlassPhase). Every time
// comes from `transition` in beats.ts; the hairline overlay is the same canvas in both phases.
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {useFormat} from '../../useFormat';
import {GlassPhase} from './GlassPhase';
import {PaperPhase} from './PaperPhase';
import {isLifting} from './timing';

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {format, width, height} = useFormat();
  const t = frame / fps;
  const size = {width, height};
  return isLifting(t) ? <GlassPhase t={t} format={format} size={size} /> : <PaperPhase t={t} format={format} size={size} />;
};
