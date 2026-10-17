// House.tsx — a village house as a pop-up net (BIBLE4 §5.9). It follows the `villageHouse` preset (src/popup:
// back and side walls with the wallpaper wash, a roof flap, a name on the door), with one change the visits need:
// the FRONT wall stands up facing the viewer with the door and the name on it, and folds open for a visit.
// (The preset lays the front out as a yard south of the floor; folded up, that face would look into the house, so
// the name would be on the inside. Here the front panel lies over the floor in the net and hinges on its south edge.)
// Authored at 4x (page px, v1 line weights) and placed at the nested scale 0.25.
import React from 'react';
import {Box, Drawing, Ink, Line, PopUp, Window, foldKeys, type Panel, type PopUpSpec} from '../../popup';
import {handRect} from '../../paper';
import {COLORS, FONTS} from '../../film';
import {AUTHOR, NEST, dims, frontKeys, toRegion, type HouseDef} from './layout';

/** Wallpaper washes are the light stop pre-multiplied over the paper at 55% (BIBLE4 §5.9). */
const WASH_ALPHA = 0.55;
export const wash = (hex: string, alpha = WASH_ALPHA): string => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

/** Door names: Patrick Hand, 40 page px (10 sheet px: 20 screen px over the whole village at z 2, 50 at a visit's z 5). */
const DOOR_TYPE = 40;
const TILT = 24;

type Net = {spec: PopUpSpec; W: number; D: number; wall: number; roof: number; ox: number; oy: number};

const netOf = (h: HouseDef): Net => {
  const d = dims(h);
  const W = h.width * AUTHOR;
  const D = d.depth * AUTHOR;
  const wall = d.wall * AUTHOR;
  const roof = d.roof * AUTHOR;
  const ox = wall;
  const oy = roof;
  const s = h.popAt;
  const dur = 0.6;
  const paper = wash(h.wallpaper);
  const panels: readonly Panel[] = [
    {id: 'floor', rect: {x: ox, y: oy + wall, w: W, h: D}},
    {id: 'back', parent: 'floor', hinge: 'bottom', rect: {x: ox, y: oy, w: W, h: wall}, angle: foldKeys(s, dur, 86), tint: paper},
    {id: 'left', parent: 'floor', hinge: 'right', rect: {x: 0, y: oy + wall, w: wall, h: D}, angle: foldKeys(s + 0.15, dur, 84), tint: paper},
    {id: 'right', parent: 'floor', hinge: 'left', rect: {x: ox + W, y: oy + wall, w: wall, h: D}, angle: foldKeys(s + 0.15, dur, 84), tint: paper},
    {id: 'roof', parent: 'back', hinge: 'bottom', rect: {x: ox, y: 0, w: W, h: roof}, angle: foldKeys(s + 0.5, dur, -22)},
    // the front: lies over the floor in the net, hinged on the floor's south edge; up = closed, ~166 = open on the ground
    {id: 'front', parent: 'floor', hinge: 'bottom', rect: {x: ox, y: oy + wall + D - wall, w: W, h: wall}, angle: frontKeys(h)},
  ];
  return {spec: {id: `village-${h.id}`, size: {w: ox * 2 + W, h: oy + wall + D}, panels}, W, D, wall, roof, ox, oy};
};

const doorWidth = (h: HouseDef, W: number): number => {
  const text = h.door.length * DOOR_TYPE * 0.42 + 36;
  return Math.max(W * (h.kind === 'kennel' ? 0.5 : 0.3), text);
};

/** The front face: windows, the door in the house's wallpaper, the name on it. */
const FrontArt: React.FC<{h: HouseDef; n: Net}> = ({h, n}) => {
  const {W, wall, ox} = n;
  const y0 = n.oy + n.D; // the front panel's top in the net (its free edge, the top of the wall once it stands)
  const dw = doorWidth(h, W);
  const dh = wall * (h.kind === 'kennel' ? 0.66 : h.kind === 'flat' ? 0.4 : 0.62);
  const dx = ox + W / 2 - dw / 2;
  const dy = y0 + wall - dh;
  const win = Math.min(W * 0.18, wall * 0.36);
  const windows: readonly (readonly [number, number])[] =
    h.kind === 'kennel'
      ? []
      : h.kind === 'flat'
        ? [[ox + W * 0.14, y0 + wall * 0.1], [ox + W * 0.86 - win, y0 + wall * 0.1], [ox + W * 0.14, y0 + wall * 0.42], [ox + W * 0.86 - win, y0 + wall * 0.42]]
        : [[ox + W * 0.1, y0 + wall * 0.26], [ox + W * 0.9 - win, y0 + wall * 0.26]];
  return (
    <Drawing w={n.spec.size.w} h={n.spec.size.h}>
      {windows.map(([x, y], i) => (
        <Window key={i} x={x} y={y} w={win} h={win * 0.9} seed={200 + i * 7} />
      ))}
      {h.kind === 'kennel' ? (
        <Ink d={`M ${dx} ${dy + dh} L ${dx} ${dy + dw * 0.5} Q ${dx + dw / 2} ${dy - dw * 0.15} ${dx + dw} ${dy + dw * 0.5} L ${dx + dw} ${dy + dh} Z`} width={2.4} fill={wash(h.wallpaper, 0.75)} />
      ) : (
        <Box x={dx} y={dy} w={dw} h={dh} seed={231} width={2.4} fill={wash(h.wallpaper, 0.75)} />
      )}
      {h.kind === 'kennel' ? null : <Ink d={`M ${dx + dw - 18} ${dy + dh * 0.58} l 5 1`} width={4} />}
      <Line x1={ox + 6} y1={y0 + wall - 3} x2={ox + W - 6} y2={y0 + wall - 3} seed={240} width={1.6} />
      <text
        x={ox + W / 2}
        y={dy + Math.min(dh * 0.42, DOOR_TYPE * 1.3)}
        textAnchor="middle"
        fontSize={DOOR_TYPE}
        fill={COLORS.graphite}
        style={{fontFamily: `Patrick Hand, ${FONTS.hand}`}}
      >
        {h.door}
      </text>
    </Drawing>
  );
};

/** Inside and roof: skirting, floorboards, shingles. Left light: the visit's page is drawn over the floor. */
const InsideArt: React.FC<{h: HouseDef; n: Net; panel: Panel['id']}> = ({n, panel}) => {
  const {W, D, wall, ox, oy, roof} = n;
  if (panel === 'back') {
    return (
      <Drawing w={n.spec.size.w} h={n.spec.size.h}>
        <Line x1={ox} y1={oy + wall * 0.86} x2={ox + W} y2={oy + wall * 0.86} seed={301} width={1.6} />
      </Drawing>
    );
  }
  if (panel === 'floor') {
    return (
      <Drawing w={n.spec.size.w} h={n.spec.size.h}>
        {[0.3, 0.6].map((k, i) => (
          <Line key={i} x1={ox + 8} y1={oy + wall + D * k} x2={ox + W - 8} y2={oy + wall + D * k} seed={310 + i} width={1} ink={COLORS.graphiteSoft} />
        ))}
      </Drawing>
    );
  }
  if (panel === 'roof') {
    return (
      <Drawing w={n.spec.size.w} h={n.spec.size.h}>
        {[0.33, 0.66].map((k, i) => (
          <Line key={i} x1={ox} y1={roof * k} x2={ox + W} y2={roof * k} seed={320 + i} width={1.4} />
        ))}
        <Ink d={handRect(ox + 2, 2, W - 4, roof - 4, 330, {radius: 2})} width={2} />
      </Drawing>
    );
  }
  return null;
};

/** One house, placed with its floor centre on `h.centre` (region-local px), from just before it pops. */
export const VillageHouse: React.FC<{h: HouseDef; t: number}> = ({h, t}) => {
  const n = React.useMemo(() => netOf(h), [h]);
  if (t < h.popAt - 0.25) return null;
  const appear = Math.min(1, (t - (h.popAt - 0.25)) / 0.25);
  const [cx, cy] = toRegion(h.centre);
  // the floor centre in net px
  const fx = n.ox + n.W / 2;
  const fy = n.oy + n.wall + n.D / 2;
  return (
    <div style={{position: 'absolute', left: cx - fx * NEST, top: cy - fy * NEST, width: n.spec.size.w, height: n.spec.size.h, transform: `scale(${NEST})`, transformOrigin: '0 0', opacity: appear}}>
      <PopUp spec={n.spec} time={t} view={{tilt: TILT}}>
        {(panel: Panel) => (panel.id === 'front' ? <FrontArt h={h} n={n} /> : <InsideArt h={h} n={n} panel={panel.id} />)}
      </PopUp>
    </div>
  );
};
