// LineCharacter.tsx — a character drawn by the pencil engine as one continuous line (BIBLE4 §4), with its own
// small canvas placed at the figure's ground point. Draw-on by `progress`; pose swaps as a flipbook redraw via
// `swapFrom` + `swapProgress`; the figure boils unless `boil` is 0.
import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {compileSketch, PencilCanvas, type Ink} from '../paper';
import {BOIL, boundsOf, drawOnSpec, placeFigure, swapSpec, translateSpec} from './figure';
import type {CharacterId, PoseId} from './types';

export type LineCharacterProps = {
  readonly character: CharacterId;
  readonly pose: PoseId;
  /** Draw-on progress 0-1 (default 1: fully drawn). Ignored during a swap. */
  readonly progress?: number;
  /** Flipbook swap from this pose into `pose`, at `swapProgress` 0-1 over SWAP.frames. */
  readonly swapFrom?: PoseId;
  readonly swapProgress?: number;
  /** Default: the design's ink (sepia for Maya, graphite for the family). */
  readonly ink?: Ink;
  /** 1 = design-sheet size. */
  readonly scale?: number;
  /** Ground point in the parent's px. */
  readonly x?: number;
  readonly y?: number;
  /** Boil amplitude in px (default 0.5; 3 for the storm; 0 to hold still). */
  readonly boil?: number;
  /** Rough pass under the first draw (default true); pass false once the character has swapped poses. */
  readonly rough?: boolean;
  readonly frame?: number;
  /** Engine: parent magnification (keeps grain crisp) and device px per sheet px. */
  readonly zoom?: number;
  readonly density?: number;
  readonly grainOffset?: {x: number; y: number};
  readonly style?: React.CSSProperties;
};

const MARGIN = 14;

export const LineCharacter: React.FC<LineCharacterProps> = ({character, pose, progress = 1, swapFrom, swapProgress = 0, ink, scale = 1, x = 0, y = 0, boil = BOIL.px, rough = true, frame, zoom, density, grainOffset, style}) => {
  const current = useCurrentFrame();
  const bucket = Math.floor((frame ?? current) / BOIL.everyFrames);
  const swapping = swapFrom !== undefined && swapFrom !== pose;
  const page = useMemo(() => {
    const o = {x, y, scale, ink, boil, boilBucket: bucket, rough};
    const placed = swapping ? [placeFigure(character, swapFrom, o), placeFigure(character, pose, o)] : [placeFigure(character, pose, o)];
    const bounds = boundsOf(placed, MARGIN + boil);
    const built = swapping ? swapSpec(character, swapFrom, pose, swapProgress, o) : {...drawOnSpec(character, pose, o), progress};
    const local = translateSpec(built, -bounds.x0, -bounds.y0);
    return {bounds, marks: compileSketch(local), progress: built.progress};
  }, [character, pose, swapFrom, swapping, swapProgress, ink, scale, x, y, boil, bucket, rough, progress]);
  const {bounds} = page;
  return (
    <PencilCanvas
      marks={page.marks}
      progress={page.progress}
      width={Math.ceil(bounds.x1 - bounds.x0)}
      height={Math.ceil(bounds.y1 - bounds.y0)}
      density={density}
      zoom={zoom}
      grainOffset={grainOffset}
      style={{left: bounds.x0, top: bounds.y0, ...style}}
    />
  );
};
