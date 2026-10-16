// index.ts — the paper engine's public API. Import from 'src/paper' (or '../../paper' from a sketch folder).

// Data model (shared)
export * from './types';

// Renderers
export {GraphiteSketch, type GraphiteSketchProps} from './GraphiteSketch';
export {LightSketch, type LightOrder, type LightSketchProps} from './LightSketch';
export {PencilCanvas, type PencilCanvasProps} from './render/PencilCanvas';

// Paper world
export {PaperSheet, type Corner, type PaperSheetProps} from './PaperSheet';
export {DeskSurface, type DeskSurfaceProps} from './DeskSurface';
export {StickyNote, STICKY_COLOR, type StickyNoteProps} from './sticky/StickyNote';
export {stickyCues, stickyState, STICKY_DEFAULTS, type StickyState, type StickyTiming} from './sticky/stickyState';
export {EraserCrumbs, scatterCrumbs, type Crumb, type CrumbArea, type EraserCrumbsProps} from './EraserCrumbs';

// Light and shadow
export {awayFromLampAngle, castShadow, DEFAULT_LAMP, type Lamp, lampFalloff, lampTint, lampVector, shade, shadowOffset, type ShadowOptions} from './lamp';
export {loadTexture, TEXTURES, textureUrl, type TextureName} from './textures';

// Followers: hands, cup, foley
export {getPencilState, type PencilState} from './pencilState';
export {offsetCues, strokeCues} from './strokeCues';
export {compileSketch, markProgress} from './marks/compile';
export type {GlyphMark, Mark, MarkPoint, PathMark, PathRole} from './marks/types';

// Authoring toolkit
export {drift, handPath, handPolyline, jitter, type HandPathOptions, type XY} from './hand/handPath';
export {
  handArrow,
  handCheck,
  handCircle,
  handCross,
  handDottedLine,
  handLine,
  handRect,
  handRectStrokes,
  handTick,
  handTickMarks,
  handUnderline,
  type ArrowOptions,
  type CircleOptions,
  type LineOptions,
  type RectOptions,
} from './hand/shapes';
export {label, sequence, stroke, type Untimed, type UntimedLabel, type UntimedStroke} from './hand/schedule';
export {measureHand, wrapHand, LINE_HEIGHT} from './text/handLayout';
export {flattenPath, pathLength} from './geometry/path';
export {seedOf} from './geometry/noise';
