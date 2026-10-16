// SheetFilm.tsx — the endless sheet with placeholder chapter marks and the unbroken line, for the whole 600 s.
// Registered as Sheet4-wide / Sheet4-tall. The real film replaces <ChapterMark> with each chapter's own component.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SLOTS4} from '../film4';
import {ChapterMark} from './chapterMark';
import {EndlessSheet} from './EndlessSheet';
import {PencilLine} from './PencilLine';
import {SheetRegion} from './SheetRegion';

export const SheetFilm: React.FC<{showBounds?: boolean}> = ({showBounds = false}) => (
  <AbsoluteFill>
    <EndlessSheet overlay={<PencilLine />} showBounds={showBounds}>
      {SLOTS4.map((slot) => (
        <SheetRegion key={slot.id} id={slot.id}>
          <ChapterMark id={slot.id} />
        </SheetRegion>
      ))}
    </EndlessSheet>
  </AbsoluteFill>
);
