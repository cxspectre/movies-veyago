// Chapter.tsx — chapter 5, `researchBoard` 2:50-3:55 (BIBLE4 5.5, local 0-65): the board draws itself, four cards pin, red
// string pulls tight, the 2x2 shows the empty corner, the papers fold into six boxes and a hand truck takes them along the line.
import React from 'react';
import {ChapterShell, Super, useChapter} from '../../kit';
import {StringBoard} from './StringBoard';
import {BOARD_SUPERS, BOARD_SUPERS_TALL} from './supers';

export const Art: React.FC = () => {
  const {t, isTall} = useChapter('researchBoard');
  return (
    <>
      <StringBoard t={t} tall={isTall} />
      {(isTall ? BOARD_SUPERS_TALL : BOARD_SUPERS).map((p) => (
        <Super key={p.text} {...p} />
      ))}
    </>
  );
};

export const Overlay: React.FC = () => null;

export const Chapter: React.FC = () => <ChapterShell id="researchBoard" art={<Art />} overlay={<Overlay />} />;
