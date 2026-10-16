// EndCheck.tsx — review aid: the wall's LAST frame with the transition's opening framing drawn over it (the drawn
// phone outline at 78% / 62% of the frame height, centred on transition.handoff.phoneCentre; and the page box the
// transition places). If the pencil outline sits inside the dashed box, the cut at 1:31 is seamless.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {COLORS, FONTS, slotFrames} from '../../film';
import {SKETCH_SIZE} from '../../paper';
import {PHONE_FRAME} from '../../sketches/binder-home-v2/screen';
import {useFormat} from '../../useFormat';
import {wallEndFraming} from './camera';
import {WallStage} from './Scene';

const box = (x: number, y: number, w: number, h: number, dash: string): React.CSSProperties => ({
  position: 'absolute',
  left: x,
  top: y,
  width: w,
  height: h,
  border: `2px ${dash} ${COLORS.accent}`,
  boxSizing: 'border-box',
});

export const WallEndCheck: React.FC = () => {
  const {format} = useFormat();
  const end = wallEndFraming(format);
  const s = end.pageScale;
  const c = end.outlineCentre;
  const outline = {w: PHONE_FRAME.w * s, h: PHONE_FRAME.h * s};
  const page = {w: SKETCH_SIZE.width * s, h: SKETCH_SIZE.height * s};
  return (
    <AbsoluteFill>
      <WallStage format={format} frame={slotFrames('wall') - 1} />
      <div style={box(c.x - outline.w / 2, c.y - outline.h / 2, outline.w, outline.h, 'dashed')} />
      <div style={box(c.x - page.w / 2, c.y - page.h / 2, page.w, page.h, 'dotted')} />
      <div style={{position: 'absolute', left: 24, top: 24, fontFamily: FONTS.super, fontSize: 22, color: COLORS.accent}}>
        transition opening: outline {Math.round(outline.h)} px tall at ({Math.round(c.x)}, {Math.round(c.y)}), page scale {s.toFixed(4)}
      </div>
    </AbsoluteFill>
  );
};

/** One frame is the whole check. */
export const END_CHECK_FRAMES = 1;
