import React from 'react';
import {Sequence} from 'remotion';
import {sec} from '../../film';
import {FAMILY_SECONDS, FamilySegment} from './FamilySegment';
import {LAP_SECONDS, LapSegment} from './LapSegment';
import {PAIR_SECONDS, PairSegment} from './PairSegment';

/** The rig reel: the transition's lap (10 s), the family of devices with the flip and the pass (5 s), the pair (5 s). */
export const DEMO_SEGMENTS = [
  {name: 'lap', seconds: LAP_SECONDS, Component: LapSegment},
  {name: 'family', seconds: FAMILY_SECONDS, Component: FamilySegment},
  {name: 'pair', seconds: PAIR_SECONDS, Component: PairSegment},
] as const;

export const DEMO_FRAMES = DEMO_SEGMENTS.reduce((sum, s) => sum + sec(s.seconds), 0);

/** Frame where a segment starts in the reel. */
export const demoSegmentStart = (name: (typeof DEMO_SEGMENTS)[number]['name']): number => {
  const index = DEMO_SEGMENTS.findIndex((s) => s.name === name);
  return DEMO_SEGMENTS.slice(0, index).reduce((sum, s) => sum + sec(s.seconds), 0);
};

export const DevicesDemo: React.FC = () => (
  <>
    {DEMO_SEGMENTS.map((s) => (
      <Sequence key={s.name} from={demoSegmentStart(s.name)} durationInFrames={sec(s.seconds)} name={s.name}>
        <s.Component />
      </Sequence>
    ))}
  </>
);
