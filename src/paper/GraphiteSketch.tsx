// GraphiteSketch.tsx — a hand-drawn page (SketchSpec) drawing itself in graphite and accent pencil on SKETCH_SIZE.
// Transparent: put it inside <PaperSheet> (or any paper) — it multiplies onto whatever is underneath.
import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {compileSketch} from './marks/compile';
import {PencilCanvas} from './render/PencilCanvas';
import {SKETCH_SIZE, type SketchSpec} from './types';

export type GraphiteSketchProps = {
  readonly spec: SketchSpec;
  /** Frames the page takes to draw itself from frame 0; it holds the finished drawing afterwards. */
  readonly drawFrames: number;
  /** Override the frame (defaults to useCurrentFrame()). Useful to freeze a page or run it from a parent clock. */
  readonly frame?: number;
  /** Device px per sketch px (defaults to the render scale). */
  readonly density?: number;
  /** How much a parent scales this page up on screen (keeps grain crisp in close-ups). Default 1. */
  readonly zoom?: number;
  /** Paper grain offset in sketch px; match <PaperSheet grainOffset> so graphite sits on the visible tooth. */
  readonly grainOffset?: {x: number; y: number};
  readonly style?: React.CSSProperties;
};

export const GraphiteSketch: React.FC<GraphiteSketchProps> = ({spec, drawFrames, frame, density, zoom, grainOffset, style}) => {
  const current = useCurrentFrame();
  const marks = useMemo(() => compileSketch(spec), [spec]);
  const f = frame ?? current;
  const progress = drawFrames > 0 ? f / drawFrames : 1;
  return (
    <PencilCanvas
      marks={marks}
      progress={progress}
      width={SKETCH_SIZE.width}
      height={SKETCH_SIZE.height}
      density={density}
      zoom={zoom}
      grainOffset={grainOffset}
      style={style}
    />
  );
};
