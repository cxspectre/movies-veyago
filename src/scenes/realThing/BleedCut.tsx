// BleedCut.tsx — a full-bleed cut: the footage fills the frame (cover x 1.06, the focus centred, a 2% drift).
// Render inside the cut's own <Sequence>, so frame 0 here is the cut's first frame.
import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {VOID} from '../../glass';
import {useFormat} from '../../useFormat';
import {footagePath} from './footage';
import {bleedLayout} from './motion';
import type {PlannedCut} from './plan';

export const BleedCut: React.FC<{cut: PlannedCut}> = ({cut}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const {format} = useFormat();
  const layout = bleedLayout(cut, cut.start + frame / fps, format, width, height);
  return (
    <AbsoluteFill style={{backgroundColor: VOID, overflow: 'hidden'}}>
      <OffthreadVideo
        src={staticFile(footagePath(cut.clip))}
        trimBefore={Math.round(cut.clipStart * fps)}
        muted
        style={{position: 'absolute', left: layout.left, top: layout.top, width: layout.width, height: layout.height, maxWidth: 'none'}}
      />
    </AbsoluteFill>
  );
};
