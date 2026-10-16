// page.tsx — the Sketch component every page in this kit exports: its spec drawn by the graphite engine.
import React from 'react';
import {GraphiteSketch, type GraphiteSketchProps, type SketchProps, type SketchSpec} from '../../paper';

/** Optional pass-throughs a scene may give a page (a frozen frame, the parent's zoom, the sheet's grain offset). */
export type PageProps = SketchProps & Partial<Pick<GraphiteSketchProps, 'frame' | 'zoom' | 'density' | 'grainOffset'>>;

/** A page component for `spec`: draws itself over `drawFrames`, then holds. */
export const pageComponent = (spec: SketchSpec): React.FC<PageProps> => {
  const Page: React.FC<PageProps> = ({drawFrames, frame, zoom, density, grainOffset}) => (
    <GraphiteSketch spec={spec} drawFrames={drawFrames} frame={frame} zoom={zoom} density={density} grainOffset={grainOffset} />
  );
  Page.displayName = `Sketch(${spec.id})`;
  return Page;
};

/** Fails loudly at module load if a page breaks its own rules (stroke cap, unique ids, windows inside 0-1). */
export const checkSpec = (spec: SketchSpec, maxStrokes: number): SketchSpec => {
  const ids = [...spec.strokes.map((s) => s.id), ...spec.labels.map((l) => l.id)];
  const duplicate = ids.find((id, i) => ids.indexOf(id) !== i);
  if (duplicate) throw new Error(`${spec.id}: duplicate stroke/label id "${duplicate}"`);
  if (spec.strokes.length > maxStrokes) throw new Error(`${spec.id}: ${spec.strokes.length} strokes, cap is ${maxStrokes}`);
  const bad = [...spec.strokes, ...spec.labels].find((s) => s.from < 0 || s.to > 1 || s.to <= s.from);
  if (bad) throw new Error(`${spec.id}: "${bad.id}" has a bad window ${bad.from}-${bad.to}`);
  return spec;
};

/** Stroke caps (BIBLE §4 and the role brief): pages 5-9 draw in 1.5 s on the desk, page 4 in 2 s. */
export const STROKE_CAP_FAST = 16;
export const STROKE_CAP = 30;
