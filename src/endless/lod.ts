// lod.ts — level of detail (BIBLE4 §1.6): which zoom is near / mid / far, which regions mount, which images are drawn.
import {type ChapterId, SLOTS4} from '../film4';
import {LOD, REGIONS, SHEET} from '../sheet4';
import {slotOf4} from '../film4';
import type {SheetRect} from './camera';
import {stateAt} from './timeline';

export type Lod = 'near' | 'mid' | 'far';

export const lodOf = (zoom: number): Lod => (zoom >= LOD.near ? 'near' : zoom >= LOD.far ? 'mid' : 'far');

const smooth = (t: number): number => {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};

/** How visible the far image (the glimpses, or the finished regions at 9:30) is: full below LOD.far, gone by LOD.glimpseGone. */
export const farOpacity = (zoom: number): number => 1 - smooth((zoom - LOD.far) / (LOD.glimpseGone - LOD.far));

/** The far image shows the rough glimpses until the last chapter begins (9:30), then the finished regions. */
export type FarVariant = 'rough' | 'done';
export const farVariantAt = (master: number): FarVariant => (master >= slotOf4('providedFor').start ? 'done' : 'rough');

export type RegionMode = 'culled' | 'empty' | 'live' | 'image';

const regionRect = (id: ChapterId): SheetRect => {
  const r = REGIONS[id];
  return {x0: r.centre[0] - r.size[0] / 2, y0: r.centre[1] - r.size[1] / 2, x1: r.centre[0] + r.size[0] / 2, y1: r.centre[1] + r.size[1] / 2};
};
export const regionBounds = regionRect;

/** A viewport grown by `LOD.cullMargin` of its own size on every side. */
export const grown = (v: SheetRect): SheetRect => {
  const mx = (v.x1 - v.x0) * LOD.cullMargin;
  const my = (v.y1 - v.y0) * LOD.cullMargin;
  return {x0: v.x0 - mx, y0: v.y0 - my, x1: v.x1 + mx, y1: v.y1 + my};
};

export const touches = (a: SheetRect, b: SheetRect): boolean => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

/**
 * What a region draws right now.
 *   culled  its bounds miss the grown viewport (or it has no area): nothing mounts
 *   live    the chapter is running and the zoom is near or mid: its children mount (they may read `lod`)
 *   image   the chapter is finished: its pre-rendered PNG, never the pencil canvas again (contract 12.6)
 *   empty   not started yet, or the zoom is far (the far image carries the glimpses)
 */
export const regionMode = (id: ChapterId, master: number, zoom: number, viewport: SheetRect): RegionMode => {
  if (REGIONS[id].size[0] <= 0 || !touches(regionRect(id), grown(viewport))) return 'culled';
  if (lodOf(zoom) === 'far') return 'empty';
  const state = stateAt(id, master);
  if (state === 'active') return 'live';
  return state === 'finished' ? 'image' : 'empty';
};

// Image convention: public/tex/sheet/<chapterId>.png (2x), public/tex/sheet/far-rough.png and far-done.png (1/8 scale).
export const REGION_IMAGE_SCALE = 2;
export const FAR_IMAGE_SCALE = 1 / 8;
export const regionImageFile = (id: ChapterId): string => `tex/sheet/${id}.png`;
export const farImageFile = (variant: FarVariant): string => `tex/sheet/far-${variant}.png`;
export const farImageSize = {width: SHEET.width * FAR_IMAGE_SCALE, height: SHEET.height * FAR_IMAGE_SCALE} as const;
/** Chapters that have a region image (paperToGlass has no area). */
export const IMAGE_CHAPTERS: readonly ChapterId[] = SLOTS4.map((s) => s.id).filter((id) => REGIONS[id].size[0] > 0);
