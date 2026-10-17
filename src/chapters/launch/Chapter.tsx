// Chapter.tsx — chapter 8, "The launch" (6:05-6:55, local 0-50; BIBLE4 §5.8, script §8).
// A paper rocket folds up on a launchpad with a DRAWN status plaque (contract 13.5) and a date that rolls; the line is
// its trail as it arcs over a drawn world map and lands on the United States, which fills; two sticky notes (the price,
// the fix); the camera zooms into the US to Dad's house, its window lit with a binder named Dad, and Maya at it.
// The map (map.ts) is built for chapter 9: the nested village sits inside the US, Europe is on the same sheet.
import React from 'react';
import {HOUSE_WALLPAPER, launch, SUPERS} from '../../beats4';
import {headAt, masterOf} from '../../endless';
import {COLORS, FONTS, FPS} from '../../film';
import {ChapterShell, Super, superFromBeat, useChapter} from '../../kit';
import {StickyNote, handLine, handPath} from '../../paper';
import {PopUp, ROCKET, RocketArt, rocketSpec} from '../../popup';
import type {Point} from '../../sheet4';
import {DadWindow, VillageHouse} from './houseArt';
import {SUPER_AT} from './layout';
import {DAD_AT, DAD_WIDTH, LANDMASSES, ORIGIN, US, VILLAGE_ORIGIN, centreOf, toRegion, type HouseDef} from './mapGeometry';

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const smooth = (x: number): number => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const win = (w: {from: number; to: number}, t: number): number => clamp01((t - w.from) / (w.to - w.from));

/** A region-local SVG layer (draws outside the region box too). */
const Layer: React.FC<{children: React.ReactNode; opacity?: number}> = ({children, opacity = 1}) => (
  <svg style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible', opacity}}>{children}</svg>
);

// The pad and the rocket

/** The pad's centre (BIBLE4 §1.2) and where it sits in the ROCKET net (pad rect centre). */
const PAD_AT: Point = [26200, 4400];
const NET_PAD: Point = [ROCKET.size.w / 2, ROCKET.data.height + ROCKET.data.pad.h / 2];
/** The rocket's base centre in the net: the hinge between the pad and the body (the flier turns about it). */
const NET_BASE: Point = [ROCKET.size.w / 2, ROCKET.data.height];
/** Wrapper-px y where the pad ends and the rocket begins on screen (the net is tilted 24 deg; measured on a still). */
const SPLIT_Y = 548;
/** The rocket alone (no pad slab): what rides the line after lift-off. Its art is the ROCKET's. */
const FLY = {...rocketSpec({...ROCKET.data, id: 'rocket-fly', pad: {w: ROCKET.data.width, h: 2}}), data: ROCKET.data};

const netBox = (left: number, top: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: 'absolute',
  left,
  top,
  width: ROCKET.size.w,
  height: ROCKET.size.h,
  ...extra,
});

/** Chapter 7's line reaches the pad at 3.0: the slab is drawn on left to right over 0.0-3.0 (a pen wipe), the body fades in over 2.5-3.0. */
const PAD_DRAW = {from: 0.0, to: 3.0};
const BODY_IN = {from: 2.5, to: 3.0};

const Pad: React.FC<{t: number; clip: boolean}> = ({t, clip}) => {
  const [x, y] = toRegion(PAD_AT);
  const drawn = win(PAD_DRAW, t);
  const body = smooth(win(BODY_IN, t));
  const net = (children: React.ReactNode, extra: React.CSSProperties) => (
    <div style={netBox(x - NET_PAD[0], y - NET_PAD[1], extra)}>
      <PopUp spec={ROCKET} time={t} view={{tilt: 24}}>
        {children}
      </PopUp>
    </div>
  );
  const slabClip = `inset(${SPLIT_Y}px ${drawn >= 1 ? -200 : `${(1 - drawn) * 100}%`}${drawn >= 1 ? 'px' : ''} -200px -200px)`;
  return (
    <>
      {net(<RocketArt spec={ROCKET} />, {clipPath: slabClip})}
      {clip || body <= 0 ? null : net(<RocketArt spec={ROCKET} />, {clipPath: `inset(-200px -200px ${ROCKET.size.h - SPLIT_Y}px -200px)`, opacity: body})}
    </>
  );
};

/** The rocket on its way: its base rides the pencil's head (the line is its trail), nose along the velocity. */
const Flier: React.FC<{t: number}> = ({t}) => {
  const {liftOff} = launch;
  if (t < liftOff.from) return null;
  const m = (s: number): Point => headAt(masterOf('launch', s));
  const head = m(t);
  const before = m(t - 0.06);
  const after = m(t + 0.06);
  const vx = after[0] - before[0];
  const vy = after[1] - before[1];
  const speed = Math.hypot(vx, vy);
  const heading = (Math.atan2(vx, -vy) * 180) / Math.PI;
  const angle = heading * smooth(speed / 14);
  const k = win({from: liftOff.from, to: liftOff.to - 0.8}, t);
  const landing = smooth((t - (liftOff.to - 0.8)) / 0.8);
  const scale = 1 - 0.6 * smooth(k) - 0.35 * landing;
  const opacity = 1 - smooth((t - liftOff.to) / 0.8);
  if (opacity <= 0.01) return null;
  const [x, y] = toRegion(head);
  return (
    <div
      style={netBox(x - NET_BASE[0], y - NET_BASE[1], {
        transformOrigin: `${NET_BASE[0]}px ${NET_BASE[1]}px`,
        transform: `rotate(${angle}deg) scale(${scale})`,
        opacity,
      })}
    >
      <PopUp spec={FLY} time={t} view={{tilt: 24}}>
        <RocketArt spec={FLY} />
      </PopUp>
    </div>
  );
};

// The status plaque (DRAWN, contract 13.5) and the date

const PLAQUE = {x: 26330, y: 4090, w: 220, h: 64} as const;
const STATUS_LINES: Record<string, readonly string[]> = {
  'Waiting for Review': ['Waiting for', 'Review'],
  'In Review': ['In Review'],
  'Ready for Distribution': ['Ready for', 'Distribution'],
};
const SNAP = 0.18;

const StatusPlaque: React.FC<{t: number}> = ({t}) => {
  const first = launch.statuses[0].at;
  const appear = smooth((t - (first - 0.6)) / 0.5);
  if (appear <= 0) return null;
  const [x, y] = toRegion([PLAQUE.x, PLAQUE.y]);
  const body = handPath([[x, y], [x + PLAQUE.w, y], [x + PLAQUE.w, y + PLAQUE.h], [x, y + PLAQUE.h], [x, y]], 21, {wobble: 1.1, smooth: 0.15});
  const tether = handLine(x, y + PLAQUE.h * 0.5, x - 46, y + PLAQUE.h * 0.5 + 18, 22);
  return (
    <Layer opacity={appear}>
      <path d={tether} fill="none" stroke={COLORS.graphite} strokeWidth={1.8} strokeOpacity={0.8} strokeLinecap="round" />
      <path d={body} fill="rgba(243,238,227,0.92)" stroke={COLORS.graphite} strokeWidth={2.4} strokeOpacity={0.9} strokeLinejoin="round" />
      {launch.statuses.map((s, i) => {
        const next = launch.statuses[i + 1];
        const a = smooth((t - s.at) / SNAP) * (next ? 1 - smooth((t - next.at) / SNAP) : 1);
        // the first status is simply there once the plaque is
        const op = i === 0 ? (next ? 1 - smooth((t - next.at) / SNAP) : 1) : a;
        const lines = STATUS_LINES[s.text] ?? [s.text];
        return (
          <text key={s.text} x={x + PLAQUE.w / 2} y={y + PLAQUE.h / 2 + (lines.length === 1 ? 8 : -3)} textAnchor="middle" fontSize={24} fontWeight={500} fill={COLORS.graphite} opacity={op} style={{fontFamily: FONTS.super}}>
            {lines.map((l, j) => (
              <tspan key={l} x={x + PLAQUE.w / 2} dy={j === 0 ? 0 : 27}>
                {l}
              </tspan>
            ))}
          </text>
        );
      })}
    </Layer>
  );
};

// The map

const Coast: React.FC<{points: readonly Point[]; seed: number; from: number; to: number; t: number}> = ({points, seed, from, to, t}) => {
  const k = clamp01((t - from) / (to - from));
  if (k <= 0) return null;
  const local = points.map(toRegion);
  const rough = handPath(local, seed + 100, {wobble: 3.2, smooth: 0.8});
  const clean = handPath(local, seed, {wobble: 1.4, smooth: 0.8});
  const dash = `${k} 1`;
  return (
    <>
      <path d={rough} fill="none" stroke="#5A5A60" strokeOpacity={0.35} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={dash} />
      <path d={clean} fill="none" stroke={COLORS.graphite} strokeOpacity={0.82} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={dash} />
    </>
  );
};

const WorldMap: React.FC<{t: number}> = ({t}) => {
  const {from, to} = launch.map;
  const xs = LANDMASSES.map((l) => centreOf(l.points)[0]);
  const x0 = Math.min(...xs);
  const span = Math.max(...xs) - x0 || 1;
  const each = 1.2;
  return (
    <Layer>
      {LANDMASSES.map((l, i) => {
        const start = from + ((xs[i] as number) - x0) / span * (to - from - each);
        return <Coast key={l.id} points={l.points} seed={l.seed} from={start} to={start + each} t={t} />;
      })}
    </Layer>
  );
};

/** The United States fills with the accent wash at 18%, traced by the pen (15.0-17.0). */
const UsFill: React.FC<{t: number}> = ({t}) => {
  const k = win(launch.usFill, t);
  if (k <= 0) return null;
  const d = handPath(US.map(toRegion), 13, {wobble: 1.4, smooth: 0.8});
  return (
    <Layer>
      <path d={d} fill={COLORS.accent} fillOpacity={0.18 * smooth((k - 0.35) / 0.65)} stroke="none" />
      <path d={d} fill="none" stroke={COLORS.accent} strokeOpacity={0.14} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${k} 1`} />
      <path d={d} fill="none" stroke={COLORS.accent} strokeOpacity={0.9} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${k} 1`} />
    </Layer>
  );
};

// The sticky notes

/** The second note's wording. The claims sheet (A16) could not confirm that version 1.1 was the price fix, so the
 *  default is the wording it allows; the film's script and beats4 say "Fixed. Version 1.1. Next day." */
export const NOTE_FIX_TEXT = 'Fixed. The next day.';
const NOTE_SIZE = 220;
const NOTE_AT: readonly Point[] = [[27500, 3150], [27750, 3400]];

const Notes: React.FC<{t: number; zoom: number}> = ({t, zoom}) => {
  const fade = 1 - smooth(win(launch.zoomIn.notesFade, t));
  if (fade <= 0) return null;
  const frame = t * FPS;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: fade}}>
      {launch.notes.map((n, i) => {
        const [x, y] = toRegion(NOTE_AT[i] as Point);
        return (
          <div key={n.press} style={{position: 'absolute', left: x - NOTE_SIZE / 2, top: y - NOTE_SIZE / 2}}>
            <StickyNote
              text={i === 0 ? n.text : NOTE_FIX_TEXT}
              size={NOTE_SIZE}
              rotate={i === 0 ? -4 : 3}
              face="kalam-700"
              ink="accent"
              textSize={30}
              pressAt={n.press * FPS}
              writeAt={n.write.from * FPS}
              writeFrames={Math.round((n.write.to - n.write.from) * FPS)}
              zoom={zoom}
              frame={frame}
            />
          </div>
        );
      })}
    </div>
  );
};

/** The pencil crosses the first note out: two graphite strokes, 4 px (26.0-26.5). */
const CrossOut: React.FC<{t: number}> = ({t}) => {
  const k = win(launch.crossOut, t);
  if (k <= 0) return null;
  const fade = 1 - smooth(win(launch.zoomIn.notesFade, t));
  const [cx, cy] = toRegion(NOTE_AT[0] as Point);
  const a = handPath([[cx - 104, cy + 70], [cx + 6, cy - 6], [cx + 108, cy - 78]], 41, {wobble: 1.2, smooth: 0.6});
  const b = handPath([[cx - 100, cy - 56], [cx + 4, cy + 12], [cx + 106, cy + 82]], 42, {wobble: 1.2, smooth: 0.6});
  return (
    <Layer opacity={fade}>
      {[a, b].map((d, i) => {
        const kk = clamp01(k * 2 - i);
        return kk > 0 ? <path key={i} d={d} fill="none" stroke={COLORS.graphite} strokeWidth={4} strokeOpacity={0.92} strokeLinecap="round" pathLength={1} strokeDasharray={`${kk} 1`} /> : null;
      })}
    </Layer>
  );
};

// Dad's house, its lit window and Maya

/** Dad's house: the same drawing and numbers chapter 9 starts from (houseArt.tsx, mapGeometry.ts), shifted from the village region into this one. */
const DAD: HouseDef = {
  id: 'dad',
  door: 'Dad',
  centre: DAD_AT,
  width: DAD_WIDTH,
  kind: 'house',
  wallpaper: HOUSE_WALLPAPER['Dad']?.hex ?? '#B4DCFE',
  popAt: launch.smallHouse.draw.from + 1.0,
};
/** Village region-local px to launch region-local px. */
const SHIFT: Point = [VILLAGE_ORIGIN[0] - ORIGIN[0], VILLAGE_ORIGIN[1] - ORIGIN[1]];

const HouseScene: React.FC<{t: number; zoom: number}> = ({t, zoom}) => {
  const draw = launch.smallHouse.draw;
  if (t < draw.from) return null;
  const lit = smooth((t - launch.smallHouse.windowLights) / 0.2);
  const [gx, gy] = toRegion([27440, 3345]);
  const ground = handLine(gx, gy, gx + 320, gy + 1, 51);
  const maya = win(launch.mayaInWindow, t);
  return (
    <>
      <Layer>
        <path d={ground} fill="none" stroke="#5A5A60" strokeOpacity={0.4} strokeWidth={1.4} strokeLinecap="round" pathLength={1} strokeDasharray={`${win(draw, t)} 1`} />
        <path d={ground} fill="none" stroke={COLORS.graphite} strokeOpacity={0.8} strokeWidth={1} strokeLinecap="round" pathLength={1} strokeDasharray={`${win(draw, t)} 1`} />
      </Layer>
      <div style={{position: 'absolute', left: SHIFT[0], top: SHIFT[1]}}>
        <VillageHouse h={DAD} t={t} />
      </div>
      <DadWindow origin={ORIGIN} lit={lit} maya={maya} zoom={zoom} />
    </>
  );
};

// Layers

export const Art: React.FC = () => {
  const {t, camera} = useChapter('launch');
  const zoom = camera.zoom;
  const flying = t >= launch.liftOff.from;
  const [sx, sy] = SUPER_AT;
  return (
    <>
      <WorldMap t={t} />
      <UsFill t={t} />
      <Pad t={t} clip={flying} />
      <StatusPlaque t={t} />
      <Flier t={t} />
      <Notes t={t} zoom={zoom} />
      <CrossOut t={t} />
      <HouseScene t={t} zoom={zoom} />
      {SUPERS.launch.map((s) => (
        <Super key={s.t} {...superFromBeat(s, {sheet: [sx, sy], align: 'centre'}, {size: 56, maxWidth: 1080})} />
      ))}
    </>
  );
};

export const Overlay: React.FC = () => null;

export const Chapter: React.FC = () => <ChapterShell id="launch" art={<Art />} overlay={<Overlay />} />;
