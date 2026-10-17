// Chapter.tsx — chapter 4, `filterMachine` 1:55-2:50 (BIBLE4 5.4, local 0-55): a paper machine folds up, 24 idea cards rain
// into its hopper and meet five gates (a label writes itself at each; most cards are stopped with a small red stamp), one card
// makes it into the tray and opens into the line the whole film hangs on, then folds into a plane and flies home to Maya.
import React from 'react';
import {ChapterShell, useChapter} from '../../kit';
import {BinderCard, FallingCards} from './Cards';
import {FilterMachine, TrayBack, TrayFront} from './FilterMachine';
import {Flight} from './Flight';

export const Art: React.FC = () => {
  const {t} = useChapter('filterMachine');
  return (
    <>
      <FilterMachine t={t} />
      <TrayBack t={t} />
      <FallingCards t={t} />
      <svg style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible'}}>
        <BinderCard t={t} />
      </svg>
      <TrayFront t={t} />
    </>
  );
};

export const Overlay: React.FC = () => <Flight />;

export const Chapter: React.FC = () => <ChapterShell id="filterMachine" art={<Art />} overlay={<Overlay />} />;
