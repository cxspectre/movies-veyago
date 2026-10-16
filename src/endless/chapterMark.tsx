// chapterMark.tsx — the placeholder chapter marks: a number and a title, hand-lettered by the engine at each region, and the
// rough "glimpse" of the chapter's hero shape the far view shows before the real chapter exists. Stand-ins until the chapter
// owners replace them; the same code makes the region PNGs and the far images, so every LOD level agrees.
import React, {useContext, useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {FPS} from '../film';
import {type ChapterId, slotOf4} from '../film4';
import {handLine, handRect, label, measureHand, sequence, stroke} from '../paper';
import {compileSketch} from '../paper/marks/compile';
import {PencilCanvas} from '../paper/render/PencilCanvas';
import type {SketchSpec} from '../paper/types';
import {REGIONS} from '../sheet4';
import {SheetContext} from './sheetContext';

/** The mark's drawing surface in mark px, and where it sits (its top-left) in sheet px. */
export const MARK_BOX = {width: 1400, height: 520} as const;
const NUMBER_SIZE = 220;
const TITLE_SIZE = 100;
/** The mark's top edge on the sheet, per chapter: above the line by default, clear of each chapter's own art. */
const MARK_TOP: Partial<Record<ChapterId, number>> & {default: number} = {default: 3450, filterMachine: 2300, engineRoom: 2300, launch: 4550, village: 3150};
/** Nested chapters draw at this fraction of the sheet scale (BIBLE4 §1.1). */
const MARK_SCALE: Partial<Record<ChapterId, number>> = {village: 0.25};
/** Draws in over these chapter-local seconds. */
export const MARK_DRAW = {from: 0.5, to: 3.5} as const;

export const markScale = (id: ChapterId): number => MARK_SCALE[id] ?? 1;
/** Top-left of the mark box in region-local px. */
export const markOrigin = (id: ChapterId): {x: number; y: number} => {
  const r = REGIONS[id];
  const k = markScale(id);
  return {x: (r.size[0] - MARK_BOX.width * k) / 2, y: (MARK_TOP[id] ?? MARK_TOP.default) - (r.centre[1] - r.size[1] / 2)};
};

const specCache = new Map<ChapterId, SketchSpec>();

/** The number and title as engine strokes and labels (mark px). */
export const markSpec = (id: ChapterId): SketchSpec => {
  const hit = specCache.get(id);
  if (hit) return hit;
  const slot = slotOf4(id);
  const title = slot.title;
  const titleWidth = measureHand(title, TITLE_SIZE);
  const numberText = String(slot.number);
  const numberWidth = measureHand(numberText, NUMBER_SIZE, 'caveat-700');
  const cx = MARK_BOX.width / 2;
  const items = [
    label('number', numberText, cx - numberWidth / 2, 230, {size: NUMBER_SIZE, ink: 'accent', face: 'caveat-700'}),
    label('title', title, cx - titleWidth / 2, 390, {size: TITLE_SIZE}),
    stroke('underline', handLine(cx - titleWidth / 2 - 10, 425, cx + titleWidth / 2 + 10, 421, slot.number), {width: 3, pressure: 0.8}),
  ];
  const spec: SketchSpec = {id: `mark-${id}`, ...sequence(items, 0, 1)};
  specCache.set(id, spec);
  return spec;
};

/** The glimpse: the chapter's hero shape as one rough pass, drawn heavy enough to register at 1/8 scale. */
export const glimpseSpec = (id: ChapterId): SketchSpec => {
  const r = REGIONS[id];
  const w = Math.min(r.size[0] * 0.55, 1400);
  const h = Math.min(r.size[1] * 0.5, 1500);
  const x = (r.size[0] - w) / 2;
  const y = (r.size[1] - h) / 2;
  const slot = slotOf4(id);
  return {id: `glimpse-${id}`, ...sequence([stroke('hero', handRect(x, y, w, h, slot.number + 40), {width: 22, rough: true, pressure: 0.6})], 0, 1)};
};

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** The placeholder mark, drawn by the engine as the chapter runs (or finished, for the images). Place it inside a region. */
export const ChapterMark: React.FC<{id: ChapterId; finished?: boolean}> = ({id, finished = false}) => {
  const frame = useCurrentFrame();
  const zoom = useContext(SheetContext)?.camera.zoom ?? 1;
  const marks = useMemo(() => compileSketch(markSpec(id)), [id]);
  const k = markScale(id);
  const o = markOrigin(id);
  const u = finished ? 1 : clamp((frame / FPS - MARK_DRAW.from) / (MARK_DRAW.to - MARK_DRAW.from), 0, 1);
  return (
    <div style={{position: 'absolute', left: o.x, top: o.y, width: MARK_BOX.width, height: MARK_BOX.height, transform: `scale(${k})`, transformOrigin: '0 0'}}>
      <PencilCanvas marks={marks} progress={u} width={MARK_BOX.width} height={MARK_BOX.height} zoom={clamp(zoom * k, 0.5, 1.5)} />
    </div>
  );
};

/** The glimpse of a region, region-local, for the far image. */
export const Glimpse: React.FC<{id: ChapterId}> = ({id}) => {
  const marks = useMemo(() => compileSketch(glimpseSpec(id)), [id]);
  const r = REGIONS[id];
  return <PencilCanvas marks={marks} progress={1} width={r.size[0]} height={r.size[1]} density={0.5} />;
};
