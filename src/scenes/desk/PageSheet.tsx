// PageSheet.tsx — one A3 sheet on the desk: the paper (engine PaperSheet) and what is on it. A page being drawn runs
// the engine (the sketch's own component inside a <Sequence> from its drawStart); a finished page is its static
// PNG (public/tex/pages, CONTRACT §12.6); a page still sliding in is blank paper.
import React from 'react';
import {Img, Sequence, staticFile} from 'remotion';
import {DESK_LAMP, SheetAt} from '../../desk';
import {PaperSheet, SKETCH_SIZE} from '../../paper';
import {hash01} from '../../paper/geometry/noise';
import {SKETCHES, type SketchId} from '../../sketches/registry';
import type {SheetPose} from './sheets';

export type PageContent = {readonly kind: 'blank'} | {readonly kind: 'live'; readonly fromFrame: number; readonly drawFrames: number} | {readonly kind: 'still'};

const CURL = {min: 0.12, max: 0.34, liftedEvery: 10, lifted: 0.6, seed: 2207} as const;
const fill: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: SKETCH_SIZE.width, height: SKETCH_SIZE.height};

/** The page's own corner curl (seeded; one sheet in ten has its corner clearly lifted, BIBLE §2.3). */
const curlOf = (index: number): number =>
  index % CURL.liftedEvery === CURL.liftedEvery - 1 ? CURL.lifted : CURL.min + (CURL.max - CURL.min) * hash01(CURL.seed, index);

export const pageStill = (id: SketchId): string => staticFile(`tex/pages/${id}.png`);

const Content: React.FC<{id: SketchId; content: PageContent}> = ({id, content}) => {
  if (content.kind === 'blank') return null;
  if (content.kind === 'still') return <Img src={pageStill(id)} style={fill} />;
  const {Sketch} = SKETCHES[id];
  return (
    <Sequence from={content.fromFrame} layout="none" name={`draw ${id}`}>
      <div style={fill}>
        <Sketch drawFrames={content.drawFrames} />
      </div>
    </Sequence>
  );
};

export const PageSheet: React.FC<{id: SketchId; index: number; pose: SheetPose; content: PageContent; children?: React.ReactNode}> = ({id, index, pose, content, children}) => (
  <SheetAt centre={pose.centre} scale={pose.scale} rotation={pose.rotation}>
    <PaperSheet lamp={DESK_LAMP} lift={pose.lift} curl={curlOf(index)}>
      <Content id={id} content={content} />
    </PaperSheet>
    {children}
  </SheetAt>
);
