// PencilLine.tsx — the unbroken line: ONE path through all eleven regions, revealed by master time, the pencil tip leading.
// Drawn in screen space over the sheet at a constant 3 px (2 tall, never under 1.5) whatever the zoom: the pencil does not
// change, the paper gets far away. Only the visible stretch is rebuilt per frame, with the v1 pencil physics.
import React, {useMemo} from 'react';
import {LINE_WIDTH} from '../sheet4';
import {sheetOrigin} from './camera';
import {LineCanvas} from './LineCanvas';
import {SEPIA_ON_PAPER, type LineInk, voiceInkAt} from './inks';
import {filmLine, type LineGeometry} from './lineGeometry';
import {buildLineMarks} from './lineMarks';
import {useSheet} from './sheetContext';

export type PencilLineProps = {
  /** The line's geometry; default is the film's, built from LINE_ANCHORS. Chapter 1 passes its own with the detours in. */
  readonly geometry?: LineGeometry;
  /** Ink as a function of the master time the length was drawn. Default: the ink of the voice speaking (BIBLE4 §3). */
  readonly inkAt?: (masterSeconds: number) => LineInk;
};

const TOOTH_ZOOM = {min: 0.5, max: 1.5} as const;
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export const PencilLine: React.FC<PencilLineProps> = ({geometry, inkAt = voiceInkAt}) => {
  const {format, width, height, camera, masterSeconds} = useSheet();
  const g = geometry ?? filmLine();
  const lineWidth = LINE_WIDTH[format];
  const toothZoom = clamp(camera.zoom, TOOTH_ZOOM.min, TOOTH_ZOOM.max);
  const result = useMemo(
    () => buildLineMarks({geometry: g, camera, width, height, masterSeconds, lineWidth, toothZoom, inkAt}),
    [g, camera, width, height, masterSeconds, lineWidth, toothZoom, inkAt],
  );
  const origin = sheetOrigin(camera, width, height);
  if (!result.box) return null;
  return (
    <>
      {result.layers.map((layer) => (
        <LineCanvas
          key={layer.kind}
          marks={layer.marks}
          progress={result.progress}
          box={result.box as NonNullable<typeof result.box>}
          toothZoom={toothZoom}
          origin={origin}
          recolour={layer.kind === 'sepia' ? SEPIA_ON_PAPER : undefined}
        />
      ))}
    </>
  );
};
