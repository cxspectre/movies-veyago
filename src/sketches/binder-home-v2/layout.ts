// layout.ts — binder-home-v2's interface for the transition: where each drawn group sits on the page and on the
// real screen, which stroke ids it holds, and the pixel crops of the real stills to crossfade in at that place.
//
//   import {HOME_GROUPS, groupStrokeIds, screenPointToSketch, screenRectToSketch} from '../../sketches/binder-home-v2/layout';
//
// The screen is cut into seven full-width BANDS that tile it top to bottom with no gap or overlap (cut in the
// empty space between real elements), so crossfading every band's crop covers the whole screen exactly once.
// Place a crop at its band's `bandSketch` rect (stretched: the mapping is 1.2% taller than wide, see SCREEN_SCALE).
import type {SnapGroup} from '../../beats';
import {
  drawnFrame,
  edges,
  element,
  elementsOf,
  HOME_LAYOUT,
  screenRectToPx,
  screenRectToSketch,
  unionRect,
  visibleFrame,
  type LayoutElement,
  type PxRect,
  type ScreenRect,
  type SketchRect,
} from './screen';
import {MEASURED} from './measured';
import {spec} from './spec';

export {
  HOME_LAYOUT,
  PHONE_FRAME,
  SCREEN_AREA,
  SCREEN_SCALE,
  screenPointToSketch,
  screenRectToPx,
  screenRectToSketch,
  sketchPointToScreen,
  type PxRect,
  type ScreenRect,
  type SketchRect,
} from './screen';

/** The stroke-id families of the page (CONTRACT: every id starts with its group prefix). */
export type HomeGroupFamily = 'frame' | 'tabs' | 'card' | 'deadlines' | 'dock' | 'chips';
export type HomeRegionId = 'status' | 'topBar' | 'nextUp' | 'later' | 'dock' | 'helpers' | 'tabBar';

/** Crops of one band in the three stills (3x pixels, 1206x2622). */
export type HomeCrops = {
  /** public/footage/binder-home.png (dark, clean still; = binder-home-dark-still.png). */
  readonly dark: PxRect;
  /** public/footage/binder-home-light-still.png (light, clean still, pixel-aligned with the layout). Prefer this. */
  readonly lightStill: PxRect;
  /**
   * public/footage/binder-home-light.png (the light video's poster): it has the Dynamic Island, and its scrolling
   * content sits 6 px (2 pt) higher than the layout (measured); the nav bar and the tab bar capsule do not move.
   */
  readonly light: PxRect;
};

export type HomeRegion = {
  readonly id: HomeRegionId;
  readonly family: HomeGroupFamily;
  /** Stroke/label ids in this region start with one of these (and with none of `excludePrefixes`). */
  readonly prefixes: readonly string[];
  readonly excludePrefixes: readonly string[];
  /** The snap beat that turns this region real (transition.snaps); null = never snapped (the status bar). */
  readonly snap: SnapGroup | null;
  /** The real elements it covers ("kind: label"). */
  readonly elements: readonly string[];
  /** Tight union of those elements' frames: screen points, and mapped onto the page. */
  readonly screenRect: ScreenRect;
  readonly sketchRect: SketchRect;
  /** The full-width band (screen points / page px) whose crops tile the screen. */
  readonly band: ScreenRect;
  readonly bandSketch: SketchRect;
  readonly crop: HomeCrops;
  /** Every stroke and label id of the region, in drawing order. */
  readonly strokeIds: readonly string[];
};

/** The poster's content scroll offset (px of the 3x still; measured against the light still). */
const LIGHT_POSTER_CONTENT_SHIFT_PX = -6;

/** Band edges in screen points, each in the gap between two rows of real elements. */
const BAND_EDGES = {status: 0, topBar: 58, nextUp: 119, later: 430, dock: 602, helpers: 691, tabBar: 786} as const;

const name = (e: LayoutElement): string => `${e.kind}: ${e.label}`;
const onScreen = (r: ScreenRect): ScreenRect => {
  const {wPt, hPt} = HOME_LAYOUT.screen;
  return edges(Math.max(0, r.x), Math.max(0, r.y), Math.min(wPt, r.x + r.w), Math.min(hPt, r.y + r.h));
};

const matches = (id: string, prefixes: readonly string[], exclude: readonly string[]): boolean =>
  prefixes.some((p) => id.startsWith(p)) && !exclude.some((p) => id.startsWith(p));

/** Ids of every stroke and label of the page that start with `prefix`, in drawing order (`from`). */
export const groupStrokeIds = (prefix: string): readonly string[] =>
  [...spec.strokes, ...spec.labels]
    .filter((s) => s.id.startsWith(prefix))
    .sort((a, b) => a.from - b.from)
    .map((s) => s.id);

type RegionDef = {
  id: HomeRegionId;
  family: HomeGroupFamily;
  prefixes: readonly string[];
  excludePrefixes?: readonly string[];
  snap: SnapGroup | null;
  elements: readonly {name: string; frame: ScreenRect}[];
  bandTo: number;
  lightShift: number;
};

const real = (es: readonly LayoutElement[], frameOf: (e: LayoutElement) => ScreenRect = visibleFrame) => es.map((e) => ({name: name(e), frame: frameOf(e)}));

const regionDefs = (): readonly RegionDef[] => {
  const {hPt} = HOME_LAYOUT.screen;
  const sections = elementsOf('sectionHeader');
  const section = (label: string): LayoutElement => {
    const s = sections.find((e) => e.label === label);
    if (!s) throw new Error(`binder-home-v2: no section header "${label}"`);
    return s;
  };
  return [
    {id: 'status', family: 'frame', prefixes: ['frame-status-', 'frame-island'], snap: null, bandTo: BAND_EDGES.topBar, lightShift: 0,
      elements: [{name: 'statusBar', frame: HOME_LAYOUT.statusBar}, {name: 'dynamicIsland', frame: HOME_LAYOUT.dynamicIsland}]},
    {id: 'topBar', family: 'tabs', prefixes: ['tabs-'], snap: 'tabs', bandTo: BAND_EDGES.nextUp, lightShift: 0,
      elements: real([element('binderSwitcher'), element('navTitle'), element('navButton', 'Search'), element('navButton', 'Add')], drawnFrame)},
    {id: 'nextUp', family: 'card', prefixes: ['card-'], snap: 'card', bandTo: BAND_EDGES.later, lightShift: LIGHT_POSTER_CONTENT_SHIFT_PX,
      elements: real([element('headline'), element('link'), element('nextUpCard'), ...elementsOf('nextUpAction'), element('pageIndicator')])},
    {id: 'later', family: 'deadlines', prefixes: ['deadlines-'], snap: 'deadlines', bandTo: BAND_EDGES.dock, lightShift: LIGHT_POSTER_CONTENT_SHIFT_PX,
      elements: [...real([section('LATER'), ...elementsOf('laterRow')]), {name: 'rule (measured)', frame: MEASURED.later.rule}]},
    {id: 'dock', family: 'dock', prefixes: ['dock-'], excludePrefixes: ['dock-bar-'], snap: 'deadlines', bandTo: BAND_EDGES.helpers, lightShift: LIGHT_POSTER_CONTENT_SHIFT_PX,
      elements: real(elementsOf('dockButton'))},
    {id: 'helpers', family: 'chips', prefixes: ['chips-', 'circle'], snap: 'chips', bandTo: BAND_EDGES.tabBar, lightShift: LIGHT_POSTER_CONTENT_SHIFT_PX,
      elements: real([section('HELPERS'), ...elementsOf('helperChip').filter((e) => e.onFirstScreen)])},
    {id: 'tabBar', family: 'dock', prefixes: ['dock-bar-'], snap: 'deadlines', bandTo: hPt, lightShift: 0,
      elements: [{name: 'tabBarCapsule', frame: HOME_LAYOUT.tabBarCapsule}, ...real(elementsOf('tabBarTab'))]},
  ];
};

const buildRegion = (d: RegionDef): HomeRegion => {
  const {wPt} = HOME_LAYOUT.screen;
  const screenRect = onScreen(unionRect(d.elements.map((e) => e.frame)));
  const band = edges(0, BAND_EDGES[d.id], wPt, d.bandTo);
  const exclude = d.excludePrefixes ?? [];
  return {
    id: d.id,
    family: d.family,
    prefixes: d.prefixes,
    excludePrefixes: exclude,
    snap: d.snap,
    elements: d.elements.map((e) => e.name),
    screenRect,
    sketchRect: screenRectToSketch(screenRect),
    band,
    bandSketch: screenRectToSketch(band),
    crop: {dark: screenRectToPx(band), lightStill: screenRectToPx(band), light: screenRectToPx(band, d.lightShift)},
    strokeIds: [...spec.strokes, ...spec.labels]
      .filter((s) => matches(s.id, d.prefixes, exclude))
      .sort((a, b) => a.from - b.from)
      .map((s) => s.id),
  };
};

/**
 * The page's groups as screen regions, top to bottom. Snap 1 (tabs) = topBar; snap 2 (card) = nextUp;
 * snap 3 (deadlines) = later + dock + tabBar; snap 4 (chips) = helpers. `status` never snaps (no beat for it):
 * crossfade it with the first snap or keep it lit.
 */
export const HOME_GROUPS: readonly HomeRegion[] = regionDefs().map(buildRegion);

/** The regions a snap beat turns real. */
export const regionsOfSnap = (snap: SnapGroup): readonly HomeRegion[] => HOME_GROUPS.filter((g) => g.snap === snap);

/** Strokes that belong to no region: the phone outline (it becomes the lit device edge) and the corner "2". */
export const UNREGIONED_IDS: readonly string[] = [...spec.strokes, ...spec.labels]
  .map((s) => s.id)
  .filter((id) => !HOME_GROUPS.some((g) => g.strokeIds.includes(id)));

/** Problems with the regions (empty when sound): every element inside its band, every band non-empty. */
export const validateHomeGroups = (): readonly string[] =>
  HOME_GROUPS.flatMap((g) => {
    const inBand = g.screenRect.y >= g.band.y && g.screenRect.y + g.screenRect.h <= g.band.y + g.band.h;
    return [
      ...(inBand ? [] : [`${g.id}: elements (${g.screenRect.y.toFixed(1)}-${(g.screenRect.y + g.screenRect.h).toFixed(1)} pt) leave the band`]),
      ...(g.strokeIds.length > 0 ? [] : [`${g.id}: no strokes`]),
    ];
  });
