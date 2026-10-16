// partsTop.ts — the phone, its status bar, and the top bar (binder switcher, "Mom", Search, Add).
import {seedOf, stroke} from '../../paper';
import {ellipseRegion, battery, chevronDown, magnifier, plus, roundRectRegion, signalBars, wifiArcs} from './icons';
import {MEASURED} from './measured';
import {circleOn, hatchOn, iconOn, letterOn, pillOn, roundRectD, toSketch, WEIGHT, type Piece} from './pen';
import {drawnFrame, edges, element, HOME_LAYOUT, PHONE_FRAME, sketchPointToScreen, type ScreenRect} from './screen';

/** Lettering sizes (sketch px) chosen so the hand's glyph run spans the real one (see alignment.ts). */
const SIZE = {statusTime: 17, title: 17} as const;
const PHONE_SEED = seedOf('frame-phone');

/** The phone outline expressed in screen points (it lies outside the screen: negative / beyond W, H). */
const phoneInPoints = (): ScreenRect => {
  const a = sketchPointToScreen(PHONE_FRAME.x, PHONE_FRAME.y);
  const b = sketchPointToScreen(PHONE_FRAME.x + PHONE_FRAME.w, PHONE_FRAME.y + PHONE_FRAME.h);
  return edges(a.x, a.y, b.x, b.y);
};

/** `frame-`: the phone frame convention (rough), the Dynamic Island and the status bar. */
export const framePieces = (): readonly Piece[] => {
  const island = HOME_LAYOUT.dynamicIsland;
  const {status} = MEASURED;
  return [
    {
      item: stroke('frame-phone', roundRectD(PHONE_FRAME, PHONE_FRAME.radius, PHONE_SEED, 10), {width: WEIGHT.device, rough: true}),
      target: {rect: phoneInPoints(), fit: 'box'},
    },
    pillOn('frame-island', island, {width: 2.0}),
    hatchOn('frame-island-fill', roundRectRegion(toSketch(island), toSketch(island).h / 2), {hatchGap: 2.2, pressure: 0.9}),
    letterOn('frame-status-time', '9:41', status.time, SIZE.statusTime, {pressure: 1.05}),
    iconOn('frame-status-signal', status.signal, signalBars, {width: 1.9}),
    iconOn('frame-status-wifi', status.wifi, wifiArcs, {width: 1.3}),
    iconOn('frame-status-battery', status.battery, battery, {width: 1.4}),
  ];
};

/** `tabs-`: the top bar. The binder switcher (avatar + chevron) is the 1.2 home's "row of binders". */
export const topBarPieces = (): readonly Piece[] => {
  const switcher = element('binderSwitcher');
  const search = element('navButton', 'Search');
  const add = element('navButton', 'Add');
  const avatar = switcher.texts[0];
  if (!avatar) throw new Error('binder-home-v2: the binder switcher has no avatar text frame');
  const {topBar} = MEASURED;
  return [
    pillOn('tabs-switcher', drawnFrame(switcher)),
    circleOn('tabs-avatar', avatar, {width: 1.8}),
    iconOn('tabs-chevron', topBar.chevron, chevronDown, {width: 1.8}),
    letterOn('tabs-title', 'Mom', topBar.title, SIZE.title, {pressure: 1.15}),
    circleOn('tabs-search', drawnFrame(search)),
    iconOn('tabs-search-glass', topBar.magnifier, magnifier, {width: 1.8}),
    circleOn('tabs-add', drawnFrame(add)),
    hatchOn('tabs-add-fill', ellipseRegion(toSketch(drawnFrame(add))), {hatchGap: 3.6, pressure: 0.55}),
    iconOn('tabs-add-plus', topBar.plus, plus, {width: 2.0}),
  ];
};
