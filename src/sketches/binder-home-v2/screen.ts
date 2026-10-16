// screen.ts — the real binder home (public/footage/binder-home.layout.json) and the mapping from its screen points
// to the sketch page. Everything binder-home-v2 draws is placed through these functions, so the drawing sits on
// the real layout and the transition can crossfade real pixels in at exactly the drawn place.
import LAYOUT_JSON from '../../../public/footage/binder-home.layout.json';

// ---- types ---------------------------------------------------------------------------------------------------

/** A rectangle in screen points (origin top-left of the capture's screen). */
export type ScreenRect = {readonly x: number; readonly y: number; readonly w: number; readonly h: number};
/** A rectangle in sketch px (the 1200x850 page). */
export type SketchRect = ScreenRect;
/** A rectangle in image pixels of a 3x still (binder-home.png etc.). */
export type PxRect = ScreenRect;
export type Point = {readonly x: number; readonly y: number};

export type LayoutElement = {
  readonly kind: string;
  readonly label: string;
  readonly id: string | null;
  readonly frame: ScreenRect;
  readonly clippedFrame: ScreenRect | null;
  readonly onFirstScreen: boolean;
  readonly fullyVisible: boolean;
  readonly texts: readonly ({readonly text: string} & ScreenRect)[];
  readonly glassFrame?: ScreenRect;
};

export type HomeLayout = {
  readonly screen: {readonly wPt: number; readonly hPt: number; readonly scale: number; readonly wPx: number; readonly hPx: number};
  readonly statusBar: ScreenRect;
  readonly dynamicIsland: ScreenRect;
  readonly tabBarCapsule: ScreenRect;
  readonly elements: readonly LayoutElement[];
};

export const HOME_LAYOUT: HomeLayout = LAYOUT_JSON as HomeLayout;

// ---- the phone frame convention (BIBLE §4) --------------------------------------------------------------------

/** The phone's outline on the page, sketch px (BIBLE §4 "phone frame convention"). */
export const PHONE_FRAME: SketchRect & {readonly radius: number} = {x: 440, y: 95, w: 320, h: 660, radius: 48};
/** The screen area inside it: (452,107)-(748,743), sketch px. */
export const SCREEN_AREA: SketchRect = {x: 452, y: 107, w: 296, h: 636};

/**
 * Sketch px per screen point on each axis (BIBLE §4.14 mapping). Not uniform: 296/402 = 0.7363 across,
 * 636/874 = 0.7277 down (1.2% stretch). Real pixels must be stretched into SCREEN_AREA the same way to land.
 */
export const SCREEN_SCALE = {
  x: SCREEN_AREA.w / HOME_LAYOUT.screen.wPt,
  y: SCREEN_AREA.h / HOME_LAYOUT.screen.hPt,
} as const;

// ---- mapping ---------------------------------------------------------------------------------------------------

/** Screen points -> sketch px: X = 452 + x * 296 / W_pt, Y = 107 + y * 636 / H_pt. */
export const screenPointToSketch = (x: number, y: number): Point => ({
  x: SCREEN_AREA.x + x * SCREEN_SCALE.x,
  y: SCREEN_AREA.y + y * SCREEN_SCALE.y,
});

/** Sketch px -> screen points (the inverse). */
export const sketchPointToScreen = (x: number, y: number): Point => ({
  x: (x - SCREEN_AREA.x) / SCREEN_SCALE.x,
  y: (y - SCREEN_AREA.y) / SCREEN_SCALE.y,
});

export const screenRectToSketch = (r: ScreenRect): SketchRect => {
  const p = screenPointToSketch(r.x, r.y);
  return {x: p.x, y: p.y, w: r.w * SCREEN_SCALE.x, h: r.h * SCREEN_SCALE.y};
};

/** Screen points -> pixels of a 3x still, rounded outward to whole pixels and clamped to the image. */
export const screenRectToPx = (r: ScreenRect, shiftPx = 0): PxRect => {
  const {scale, wPx, hPx} = HOME_LAYOUT.screen;
  const x0 = Math.max(0, Math.floor(r.x * scale));
  const y0 = Math.max(0, Math.floor(r.y * scale + shiftPx));
  const x1 = Math.min(wPx, Math.ceil((r.x + r.w) * scale));
  const y1 = Math.min(hPx, Math.ceil((r.y + r.h) * scale + shiftPx));
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
};

/** The smallest rect holding all of `rects`. */
export const unionRect = (rects: readonly ScreenRect[]): ScreenRect => {
  if (rects.length === 0) throw new Error('binder-home-v2: unionRect needs at least one rect');
  const x0 = Math.min(...rects.map((r) => r.x));
  const y0 = Math.min(...rects.map((r) => r.y));
  const x1 = Math.max(...rects.map((r) => r.x + r.w));
  const y1 = Math.max(...rects.map((r) => r.y + r.h));
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
};

/** A rect from its edges. */
export const edges = (x0: number, y0: number, x1: number, y1: number): ScreenRect => ({x: x0, y: y0, w: x1 - x0, h: y1 - y0});

// ---- element lookup ------------------------------------------------------------------------------------------

/** The real element of this kind (and label), or a thrown error: the drawing must never guess a frame. */
export const element = (kind: string, label?: string): LayoutElement => {
  const found = HOME_LAYOUT.elements.find((e) => e.kind === kind && (label === undefined || e.label === label));
  if (!found) throw new Error(`binder-home-v2: no '${kind}'${label ? ` "${label}"` : ''} in binder-home.layout.json`);
  return found;
};

/** All real elements of a kind, in the JSON's order (top to bottom, left to right). */
export const elementsOf = (kind: string): readonly LayoutElement[] => HOME_LAYOUT.elements.filter((e) => e.kind === kind);

/** The frame as seen on the first screen (clipped at the screen edge), or the frame itself. */
export const visibleFrame = (e: LayoutElement): ScreenRect => e.clippedFrame ?? e.frame;

/** The drawn bounds of an element: its Liquid Glass shape when it has one, else its frame. */
export const drawnFrame = (e: LayoutElement): ScreenRect => e.glassFrame ?? visibleFrame(e);

/** The text frame with this text inside an element. */
export const textFrame = (e: LayoutElement, text: string): ScreenRect => {
  const t = e.texts.find((tx) => tx.text === text);
  if (!t) throw new Error(`binder-home-v2: no text "${text}" in '${e.kind}' "${e.label}"`);
  return t;
};
