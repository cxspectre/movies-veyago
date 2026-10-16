// Scene.tsx — realThing (2:04-2:20, shot 18): nine hard cuts of genuine footage on the beat, in the order of the pages
// (BIBLE 6.2). The 2.0 s cuts are the phone in the void, the 1.5 s cuts full-bleed crops; the Watch cut is the watch rig,
// tight. Every cut time comes from FEATURE_CUTS (beats.ts); the clip windows and framings are in plan.ts.
import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {DeviceStage} from '../../devices';
import {sec} from '../../film';
import {VOID} from '../../glass';
import {BleedCut} from './BleedCut';
import {CUTS, cutAt} from './plan';
import {VoidDevice} from './VoidDevice';

const BLEED_CUTS = CUTS.filter((c) => c.shot === 'bleed');

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cut = cutAt(frame / fps);
  return (
    <AbsoluteFill style={{backgroundColor: VOID}}>
      {/* One stage for the whole module (no WebGL context per cut); it holds nothing during a bleed cut. */}
      <DeviceStage>{cut.shot === 'bleed' ? null : <VoidDevice key={cut.n} cut={cut} />}</DeviceStage>
      {BLEED_CUTS.map((c) => (
        <Sequence key={c.n} from={sec(c.start)} durationInFrames={sec(c.end) - sec(c.start)} name={`cut ${c.n} · ${c.clip.id}`}>
          <BleedCut cut={c} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
