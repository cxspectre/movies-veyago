// FamilyTabsPage.tsx — the page plus its erase moment. The engine cannot lift graphite, so (the bible's fallback)
// the ghost tab lives on its own layer: drawn light, then rubbed out left to right by a soft wipe that leaves 10%
// behind, while the eraser's crumbs appear and stay for the life of the page (and on the wall).
import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {EraserCrumbs, GraphiteSketch} from '../../paper';
import {clamp} from '../../paper/geometry/noise';
import {SKETCH_SIZE, type SketchSpec, type StrokeSpec} from '../../paper/types';
import {CRUMBS, FAMILY_TABS_FRACTIONS} from './layout';

/** What survives of the ghost after rubbing, relative to how it was drawn (35% -> 10%). */
const GHOST_RESIDUE = 0.1 / 0.35;
/** The eraser's sweep across the ghost, in sketch px (a little wider than the ghost box). */
const WIPE = {from: 286, to: 436, soft: 14} as const;

const layer: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: SKETCH_SIZE.width, height: SKETCH_SIZE.height};

/** Ease the wipe like a hand rubbing: quick start, slowing as it finishes the last corner. */
const easeOut = (t: number): number => 1 - (1 - t) ** 2;

export const FamilyTabsPage: React.FC<{spec: SketchSpec; ghost: StrokeSpec; drawFrames: number}> = ({spec, ghost, drawFrames}) => {
  const frame = useCurrentFrame();
  const ghostSpec = useMemo<SketchSpec>(() => ({id: `${spec.id}-ghost`, strokes: [ghost], labels: []}), [spec.id, ghost]);
  const u = drawFrames > 0 ? frame / drawFrames : 1;
  const [e0, e1] = FAMILY_TABS_FRACTIONS.erase;
  const wipe = easeOut(clamp((u - e0) / (e1 - e0), 0, 1));
  const edge = WIPE.from + (WIPE.to - WIPE.from) * wipe;
  const mask = `linear-gradient(90deg, rgba(0,0,0,${GHOST_RESIDUE.toFixed(3)}) ${(edge - WIPE.soft).toFixed(1)}px, #000 ${(edge + WIPE.soft).toFixed(1)}px)`;
  return (
    <div style={layer}>
      <div style={{...layer, WebkitMaskImage: mask, maskImage: mask}}>
        <GraphiteSketch spec={ghostSpec} drawFrames={drawFrames} />
      </div>
      <GraphiteSketch spec={spec} drawFrames={drawFrames} />
      <EraserCrumbs area={CRUMBS.area} seed={CRUMBS.seed} count={CRUMBS.count} scale={CRUMBS.scale} amount={wipe} />
    </div>
  );
};
