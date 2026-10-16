import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COLORS, FONTS} from '../film';
import {type ChapterId, slotOf4} from '../film4';

const NAME_SIZE = 72;
const FRAME_SIZE = 36;
const SUB_SIZE = 28;

/** Placeholder chapter body: the chapter number, name and module-local frame, on paper. Works in both formats. */
export const ChapterStub: React.FC<{id: ChapterId}> = ({id}) => {
  const frame = useCurrentFrame();
  const slot = slotOf4(id);
  return (
    <AbsoluteFill
      style={{
        background: COLORS.paper,
        color: COLORS.graphite,
        fontFamily: FONTS.super,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 48,
      }}
    >
      <div style={{fontSize: SUB_SIZE, color: COLORS.graphiteSoft}}>Chapter {slot.number}</div>
      <div style={{fontSize: NAME_SIZE, fontWeight: 600}}>{slot.title}</div>
      <div style={{fontSize: FRAME_SIZE, color: COLORS.accent}}>frame {frame}</div>
    </AbsoluteFill>
  );
};
