// pages.tsx — page images the wall needs beyond the sketches' own: the V1 sheet WITH its sticky note (BIBLE §4.1:
// "the sheet, note and all, is tile 1 of the wall"). `tools/renderPages.ts` stills it to public/tex/pages.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {DESK_LAMP, DESK_PALETTE} from '../../desk';
import {SKETCH_SIZE, StickyNote} from '../../paper';
import {SKETCHES} from '../../sketches/registry';
import {coldOpen} from '../../beats';

/** BIBLE §4.1 / §2.6: the note over (600,425), -4°, 320 logical px at the cold open's framing (outline at 70% of 1080). */
const COLD_OPEN_OUTLINE_FRACTION = 0.7;
const WIDE_HEIGHT = 1080;
const OUTLINE_H = 660;
const NOTE_LOGICAL = 320;
const coldOpenPageScale = (COLD_OPEN_OUTLINE_FRACTION * WIDE_HEIGHT) / OUTLINE_H;
export const V1_NOTE = {
  centre: {x: 600, y: 425},
  size: NOTE_LOGICAL / coldOpenPageScale,
  rotate: -4,
  /** Kalam 700 at 60 logical px on a 320 px note. */
  textSize: (60 / NOTE_LOGICAL) * (NOTE_LOGICAL / coldOpenPageScale),
  text: coldOpen.lettering.text,
} as const;

/** Frames the V1 page takes to finish in this still composition. */
const V1_DRAW_FRAMES = 30;
/** The note is pressed and smoothed long before the still frame. */
const NOTE_PRESSED_AT = -90;

export const V1WithNote: React.FC = () => {
  const {Sketch} = SKETCHES['v1-home'];
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, width: SKETCH_SIZE.width, height: SKETCH_SIZE.height}}>
        <Sketch drawFrames={V1_DRAW_FRAMES} />
        <div style={{position: 'absolute', left: V1_NOTE.centre.x - V1_NOTE.size / 2, top: V1_NOTE.centre.y - V1_NOTE.size / 2}}>
          <StickyNote
            text={V1_NOTE.text}
            pressAt={NOTE_PRESSED_AT}
            size={V1_NOTE.size}
            rotate={V1_NOTE.rotate}
            face="kalam-700"
            textSize={V1_NOTE.textSize}
            color={DESK_PALETTE.stickyFace}
            lamp={DESK_LAMP}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
