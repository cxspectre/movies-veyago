// Chapter.tsx — chapter 1, `line` 0:00-0:30 (BIBLE4 §5.1). The art is almost nothing: the line is the chapter. It draws the
// super's baseline, the four sketches and the corner on its own (geometry.ts); here live the handwriting that rides above it,
// the opening black, and the screen super at the pull-back.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {line, SUPERS} from '../../beats4';
import {ChapterShell, Super, superFromBeat, useChapter} from '../../kit';
import {lineGeometry} from './geometry';

/** Baseline and left edge of "Every app starts as a line." (BIBLE4 §5.1): above the line, which rises to y 3910 to carry it. */
const SUPER_AT = [290, 3880] as const;

const [superOne, superTwo] = SUPERS.line;
if (!superOne || !superTwo) throw new Error('line: two supers expected');

/** The handwriting takes the whole 3 s the line spends under it (1.5-4.5), not the kit's 11-characters-a-second default. */
const SUPER_WRITE = line.superWrite.to - line.superWrite.from;

export const Art: React.FC = () => (
  <Super {...superFromBeat(superOne, {sheet: [SUPER_AT[0], SUPER_AT[1]], align: 'left'}, {write: SUPER_WRITE})} />
);

/** Black until the paper is there under the lamp (0.5): a cut, no warm-up. */
const Black: React.FC = () => {
  const {t} = useChapter('line');
  return t < line.black.to ? <AbsoluteFill style={{background: '#000'}} /> : null;
};

export const Overlay: React.FC = () => (
  <>
    <Super {...superFromBeat(superTwo, {screen: 'super'})} />
    <Black />
  </>
);

export const Chapter: React.FC = () => <ChapterShell id="line" art={<Art />} overlay={<Overlay />} line={{geometry: lineGeometry()}} />;
