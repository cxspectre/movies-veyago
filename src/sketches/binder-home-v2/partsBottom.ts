// partsBottom.ts — `chips-`: the HELPERS strip (the home's chips: two whole ones, the third cut by the screen edge)
// and the accent circle round them; `dock-bar-`: the floating tab bar.
import {handCircle, stroke} from '../../paper';
import {book, calendar, envelope, loopMark, page, people} from './icons';
import {MEASURED} from './measured';
import {boxOn, iconOn, letterOn, lineOn, openPillD, pillOn, toSketch, WEIGHT, type Piece} from './pen';
import {elementsOf, HOME_LAYOUT, unionRect, visibleFrame, type ScreenRect, type SketchRect} from './screen';

/** The chips' titles exactly as on the real strip, lettered at the size that spans the real glyphs. */
const CHIP_TEXT = [
  {id: 'still', text: 'Still right?', size: 13},
  {id: 'mail', text: 'Go through the mail', size: 14},
] as const;
const CHIP_ICON_RADIUS_PT = 9;
/** The accent circle runs this far outside the two chips (sketch px). */
const CIRCLE_PAD = {x: 16, y: 11} as const;

const helperChips = (): readonly ReturnType<typeof elementsOf>[number][] => {
  const chips = elementsOf('helperChip');
  if (chips.length < 3) throw new Error('binder-home-v2: the helpers strip needs at least three chips');
  return chips;
};

/** One whole chip: the pill, its icon tile with a mark in it, its title. */
const chipPieces = (i: 0 | 1): readonly Piece[] => {
  const chip = helperChips()[i];
  const m = MEASURED.helpers.chips[i];
  const t = CHIP_TEXT[i];
  if (!chip || !m) throw new Error(`binder-home-v2: no helper chip ${i}`);
  const base = `chips-${t.id}`;
  return [
    pillOn(base, chip.frame),
    boxOn(`${base}-tile`, m.icon, CHIP_ICON_RADIUS_PT, {width: 1.5}),
    iconOn(`${base}-mark`, m.icon, i === 0 ? loopMark : envelope, {width: 1.4, fit: 'inside'}),
    letterOn(`${base}-label`, t.text, m.text, t.size, {pressure: 1.05, baselinePt: m.text.y + m.text.h * 0.82}),
  ];
};

export const chipOnePieces = (): readonly Piece[] => [lineOn('chips-header', MEASURED.helpers.header, {width: 1.5, pressure: 1.0}), ...chipPieces(0)];

export const chipTwoPieces = (): readonly Piece[] => {
  const third = helperChips()[2];
  if (!third) throw new Error('binder-home-v2: no third helper chip');
  const clipped = visibleFrame(third);
  return [...chipPieces(1), {item: stroke('chips-more', openPillD(toSketch(clipped), 77), {width: WEIGHT.box}), target: {rect: clipped, fit: 'box'}}];
};

/** The two whole chips, the accent circle's subject. */
export const chipsRect = (): ScreenRect => {
  const [a, b] = helperChips();
  if (!a || !b) throw new Error('binder-home-v2: no helper chips');
  return unionRect([a.frame, b.frame]);
};

/** The accent ellipse round both chips (sketch px). */
export const circleRing = (): SketchRect & {cx: number; cy: number; rx: number; ry: number} => {
  const r = toSketch(chipsRect());
  const rx = r.w / 2 + CIRCLE_PAD.x;
  const ry = r.h / 2 + CIRCLE_PAD.y;
  return {x: r.x - CIRCLE_PAD.x, y: r.y - CIRCLE_PAD.y, w: rx * 2, h: ry * 2, cx: r.x + r.w / 2, cy: r.y + r.h / 2, rx, ry};
};

export const circlePieces = (): readonly Piece[] => {
  const c = circleRing();
  return [{item: stroke('circle', handCircle(c.cx, c.cy, c.rx, c.ry, 951, {overlap: 0.14, startAngle: -160}), {ink: 'accent', width: WEIGHT.accentCircle})}];
};

const TAB_ICONS = [book, page, calendar, people] as const;
const TAB_NAMES = ['binder', 'documents', 'deadlines', 'people'] as const;

/** The floating tab bar: its capsule, the selected tab's highlight, four icons and four labels. */
export const tabBarPieces = (): readonly Piece[] => {
  const tabs = elementsOf('tabBarTab');
  const first = tabs[0];
  if (tabs.length !== TAB_NAMES.length || !first) throw new Error('binder-home-v2: the tab bar needs four tabs');
  const {icons, labels} = MEASURED.tabBar;
  const perTab = TAB_NAMES.flatMap((name, i): readonly Piece[] => {
    const icon = icons[i];
    const text = labels[i];
    const draw = TAB_ICONS[i];
    if (!icon || !text || !draw) throw new Error(`binder-home-v2: no measured icon/label for tab ${i}`);
    return [iconOn(`dock-bar-${name}-icon`, icon, draw, {width: 1.5}), lineOn(`dock-bar-${name}-label`, text, {width: 1.4, pressure: 1.0})];
  });
  return [
    pillOn('dock-bar-capsule', HOME_LAYOUT.tabBarCapsule, {rough: true}),
    pillOn('dock-bar-selected', first.frame, {width: 1.5, pressure: 0.6}),
    ...perTab,
  ];
};
