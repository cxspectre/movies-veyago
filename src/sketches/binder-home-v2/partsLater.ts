// partsLater.ts — `deadlines-`: the LATER header, its three date rows and the rule under them;
// `dock-`: the five round buttons (Emergency first) with their labels.
import {label} from '../../paper';
import {asterisk, ellipseRegion, people, threeDots, trayUp} from './icons';
import {MEASURED} from './measured';
import {circleOn, hatchOn, iconOn, lineOn, toSketch, WEIGHT, type Piece} from './pen';
import {elementsOf, type ScreenRect} from './screen';

const BILLS_SIGN_SIZE = 15;
const BILLS_RING_INSET_PT = 1.5;

export const laterPieces = (): readonly Piece[] => {
  const l = MEASURED.later;
  const rows = l.rows.flatMap((row, i): readonly Piece[] => [
    // the first date is bold on the real screen
    lineOn(`deadlines-date-${i + 1}`, row.date, i === 0 ? {width: 2.0, pressure: 1.05} : {pressure: 1.1}),
    lineOn(`deadlines-name-${i + 1}`, row.name, {pressure: 1.15}),
  ]);
  return [lineOn('deadlines-header', l.header, {width: 1.5, pressure: 1.0}), ...rows, lineOn('deadlines-rule', l.rule, {width: 1.3, pressure: 0.8})];
};

/** The 52 pt circle at the top centre of a dock button's frame. */
const dockCircle = (frame: ScreenRect): ScreenRect => {
  const d = MEASURED.dock.circleDiameter;
  return {x: frame.x + frame.w / 2 - d / 2, y: frame.y, w: d, h: d};
};

const DOCK_NAMES = ['emergency', 'family', 'bills', 'packets', 'more'] as const;

const iconPiece = (i: number, icon: ScreenRect): readonly Piece[] => {
  const id = `dock-${DOCK_NAMES[i]}-icon`;
  if (i === 0) return [iconOn(id, icon, asterisk, {width: 2.4, pressure: 1.15})];
  if (i === 1) return [iconOn(id, icon, people, {width: 1.6})];
  if (i === 3) return [iconOn(id, icon, trayUp, {width: 1.6})];
  if (i === 4) return [iconOn(id, icon, threeDots, {width: 2.2})];
  // Bills: a small dark disc with a "$" in it
  const ring = {x: icon.x + BILLS_RING_INSET_PT, y: icon.y + BILLS_RING_INSET_PT, w: icon.w - 2 * BILLS_RING_INSET_PT, h: icon.h - 2 * BILLS_RING_INSET_PT};
  const r = toSketch(icon);
  return [
    circleOn(`${id}-ring`, ring, {width: 1.5}),
    {item: label(`${id}-sign`, '$', r.x + r.w / 2 - BILLS_SIGN_SIZE * 0.25, r.y + r.h / 2 + BILLS_SIGN_SIZE * 0.33, {size: BILLS_SIGN_SIZE, face: 'patrick-400'})},
  ];
};

export const dockPieces = (): readonly Piece[] => {
  const buttons = elementsOf('dockButton');
  if (buttons.length !== DOCK_NAMES.length) throw new Error(`binder-home-v2: expected ${DOCK_NAMES.length} dock buttons, the layout has ${buttons.length}`);
  const {icons, labels} = MEASURED.dock;
  return buttons.flatMap((b, i): readonly Piece[] => {
    const name = DOCK_NAMES[i];
    const circle = dockCircle(b.frame);
    const icon = icons[i];
    const text = labels[i];
    if (!icon || !text) throw new Error(`binder-home-v2: no measured icon/label for dock button ${i}`);
    return [
      circleOn(`dock-${name}`, circle, {width: WEIGHT.box}),
      ...(i === 0 ? [hatchOn('dock-emergency-fill', ellipseRegion(toSketch(circle)), {hatchGap: 3.4, pressure: 0.6})] : []),
      ...iconPiece(i, icon),
      lineOn(`dock-${name}-label`, text, {width: 1.5, pressure: 1.0}),
    ];
  });
};
