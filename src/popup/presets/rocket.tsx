// rocket.tsx — the rocket folds up on its launchpad (BIBLE4 5.8): pad, body with a nose and porthole, three fins.
import React from 'react';
import {Box, Drawing, Hatch, Line, Ring} from '../art';
import {foldKeys} from '../fold';
import type {Panel, PopUpSpec} from '../types';

export type RocketData = {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly fin: number;
  readonly pad: {readonly w: number; readonly h: number};
  /** Fold start times (s): pad, rocket, fins; each lasts `dur`. */
  readonly at: {readonly pad: number; readonly rocket: number; readonly fins: number; readonly dur: number};
};

export const rocketSpec = (d: RocketData): PopUpSpec & {readonly data: RocketData} => {
  const ox = d.fin;
  const padH = d.pad.h;
  const baseY = d.height;
  const {dur, ...at} = d.at;
  const fin = (id: string, edge: 'left' | 'right', sign: 1 | -1): Panel => ({
    id,
    parent: 'body',
    hinge: edge === 'left' ? 'right' : 'left',
    rect: {x: edge === 'left' ? 0 : ox + d.width, y: baseY - d.height * 0.34, w: d.fin, h: d.height * 0.34},
    clip: edge === 'left' ? [[0, 100], [100, 18], [100, 100]] : [[0, 18], [100, 100], [0, 100]],
    angle: foldKeys(at.fins, dur, sign * 62),
  });
  const panels: Panel[] = [
    {id: 'pad', rect: {x: ox - (d.pad.w - d.width) / 2, y: baseY, w: d.pad.w, h: padH}, angle: foldKeys(at.pad, dur, 0)},
    {id: 'body', parent: 'pad', hinge: 'bottom', rect: {x: ox, y: 0, w: d.width, h: d.height}, clip: [[50, 0], [100, 22], [100, 100], [0, 100], [0, 22]], angle: foldKeys(at.rocket, dur * 1.2, 88)},
    fin('finL', 'left', 1),
    fin('finR', 'right', 1),
    {id: 'finBack', parent: 'body', hinge: 'top', rect: {x: ox + d.width * 0.25, y: baseY, w: d.width * 0.5, h: padH * 0.7}, clip: [[0, 0], [100, 0], [80, 100], [20, 100]], angle: foldKeys(at.fins, dur, 40)},
  ];
  return {id: d.id, size: {w: ox * 2 + d.width, h: baseY + padH}, panels, data: d};
};

export const RocketArt: React.FC<{spec: ReturnType<typeof rocketSpec>}> = ({spec}) => {
  const d = spec.data;
  const ox = d.fin;
  const cx = ox + d.width / 2;
  const padX = ox - (d.pad.w - d.width) / 2;
  return (
    <Drawing w={spec.size.w} h={spec.size.h}>
      <Ring cx={cx} cy={d.height * 0.42} r={d.width * 0.2} seed={4} width={2.4} fill="rgba(180,220,254,0.3)" />
      <Ring cx={cx} cy={d.height * 0.42} r={d.width * 0.12} seed={5} width={1.4} />
      <Line x1={ox} y1={d.height * 0.66} x2={ox + d.width} y2={d.height * 0.66} seed={6} width={1.8} />
      <Line x1={ox} y1={d.height * 0.74} x2={ox + d.width} y2={d.height * 0.74} seed={7} width={1.4} />
      <Hatch x={ox + 6} y={d.height * 0.8} w={d.width * 0.28} h={d.height * 0.16} gap={7} seed={500} />
      <Box x={padX + 6} y={d.height + 6} w={d.pad.w - 12} h={d.pad.h - 12} seed={8} width={2.2} />
      <Line x1={padX + 20} y1={d.height + d.pad.h / 2} x2={padX + d.pad.w - 20} y2={d.height + d.pad.h / 2} seed={9} width={1.4} />
    </Drawing>
  );
};

/** Pad 0.0, rocket 1.0, fins 2.0 (BIBLE4 5.8): 160 x 520, three fins, a drawn porthole. */
export const ROCKET: ReturnType<typeof rocketSpec> = rocketSpec({
  id: 'rocket',
  width: 160,
  height: 520,
  fin: 90,
  pad: {w: 400, h: 150},
  at: {pad: 0.0, rocket: 1.0, fins: 2.0, dur: 0.9},
});
