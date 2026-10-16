// machine.tsx — the filter machine folds up from the page (BIBLE4 5.4): hopper, body (a box), five gates, tray.
import React from 'react';
import {COLORS} from '../../film';
import {Box, Drawing, Hatch, Line, Ring} from '../art';
import {foldKeys} from '../fold';
import type {Panel, PopUpSpec} from '../types';

export type MachineData = {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly gates: number;
  readonly hopper: number;
  readonly tray: number;
  /** Fold start times (s): hopper, body, gates, tray; each fold lasts `dur`. */
  readonly at: {readonly hopper: number; readonly body: number; readonly gates: number; readonly tray: number; readonly dur: number};
};

export const machineSpec = (d: MachineData): PopUpSpec & {readonly data: MachineData} => {
  const side = d.depth;
  const ox = side;
  const oy = d.hopper;
  const baseY = oy + d.height;
  const gateH = 30;
  const gap = (d.height - 80) / d.gates;
  const {dur, ...at} = d.at;
  const panels: Panel[] = [
    {id: 'base', rect: {x: ox, y: baseY, w: d.width, h: d.depth}},
    {id: 'body', parent: 'base', hinge: 'bottom', rect: {x: ox, y: oy, w: d.width, h: d.height}, angle: foldKeys(at.body, dur, 88)},
    {id: 'sideL', parent: 'body', hinge: 'right', rect: {x: 0, y: oy, w: d.depth, h: d.height}, angle: foldKeys(at.body + 0.25, dur, -88)},
    {id: 'sideR', parent: 'body', hinge: 'left', rect: {x: ox + d.width, y: oy, w: d.depth, h: d.height}, angle: foldKeys(at.body + 0.25, dur, -88)},
    {id: 'hopper', parent: 'body', hinge: 'bottom', rect: {x: ox + d.width * 0.12, y: 0, w: d.width * 0.76, h: d.hopper}, clip: [[0, 0], [100, 0], [78, 100], [22, 100]], angle: foldKeys(at.hopper, dur, -8)},
    {id: 'tray', parent: 'base', hinge: 'top', rect: {x: ox + d.width * 0.1, y: baseY + d.depth, w: d.width * 0.8, h: d.tray}, angle: foldKeys(at.tray, dur, 22)},
  ];
  for (let i = 0; i < d.gates; i++) {
    panels.push({
      id: `gate${i}`,
      parent: 'body',
      hinge: 'top',
      rect: {x: ox + d.width * 0.08, y: oy + 50 + i * gap, w: d.width * 0.84, h: gateH},
      angle: foldKeys(at.gates + i * 0.2, dur * 0.7, 74),
      hideBefore: at.gates + i * 0.2,
    });
  }
  return {id: d.id, size: {w: ox * 2 + d.width, h: baseY + d.depth + d.tray}, panels, data: d};
};

export const MachineArt: React.FC<{spec: ReturnType<typeof machineSpec>}> = ({spec}) => {
  const d = spec.data;
  const ox = d.depth;
  const oy = d.hopper;
  const gap = (d.height - 80) / d.gates;
  return (
    <Drawing w={spec.size.w} h={spec.size.h}>
      <Box x={ox + 8} y={oy + 8} w={d.width - 16} h={d.height - 16} seed={7} width={2.4} />
      {Array.from({length: d.gates}, (_, i) => (
        <React.Fragment key={i}>
          <Line x1={ox + 8} y1={oy + 50 + i * gap + 34} x2={ox + d.width - 8} y2={oy + 50 + i * gap + 34} seed={10 + i} width={1.6} />
          <Ring cx={ox + d.width - 36} cy={oy + 50 + i * gap + gap * 0.5 + 12} r={12} seed={20 + i} width={1.6} />
        </React.Fragment>
      ))}
      <Hatch x={ox + 18} y={oy + 18} w={26} h={d.height - 36} gap={8} seed={300} />
      <Line x1={ox + d.width * 0.3} y1={d.hopper * 0.5} x2={ox + d.width * 0.7} y2={d.hopper * 0.5} seed={40} width={1.8} />
      <text x={ox + d.width / 2} y={oy + d.height - 24} textAnchor="middle" fontFamily="Patrick Hand" fontSize={26} fill={COLORS.graphite}>
        filter
      </text>
    </Drawing>
  );
};

/** Hopper 0.0, body 1.0, five gates 2.0, tray 3.0 (BIBLE4 5.4). */
export const FILTER_MACHINE: ReturnType<typeof machineSpec> = machineSpec({
  id: 'filterMachine',
  width: 300,
  height: 640,
  depth: 170,
  gates: 5,
  hopper: 110,
  tray: 90,
  at: {hopper: 0.0, body: 1.0, gates: 2.0, tray: 3.0, dur: 0.9},
});
