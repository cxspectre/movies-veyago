// Chapter.tsx — chapter 7, "The engine room" (4:50-6:05, local 0-75; BIBLE4 §5.7, script §7).
// A big phone outline sliced open as a cutaway with three floors. Code: a drawn laptop with a DRAWN Xcode navigator
// (no recording exists yet; contract 13.5 allows only real recordings, so nothing pretends to be one) whose seven
// groups pop out as paper tabs and pin to the margin. The data: a paper Binder strung to the six boxes, six
// silhouettes, a paper train whose three carriages merge onto one track. The vault: a server drawn and erased, a
// pipe to "Your own iCloud", two phones, a safe the emergency card slides into. Back on top: the tests, the
// Simulator. The cutaway closes like a book.
import React, {useMemo} from 'react';
import {SUPERS, engineRoom as B} from '../../beats4';
import {COLORS, FONTS} from '../../film';
import {ChapterShell, NumberRoll, ScreenOnPaper, Super, footageClip, footageStill, superFromBeat, useChapter, type SuperProps} from '../../kit';
import {LineCharacter, type CharacterId} from '../../characters';
import {DEFAULT_LAMP, EraserCrumbs, castShadow, handCircle, handLine, handPath, handRect, handTick, label, stroke, type XY} from '../../paper';
import type {Point} from '../../sheet4';
import {Layer, PageOnSheet, at, clamp01, easeInOutCubic, easeOutCubic, lerp, smooth, timedPage, type Timed} from '../nameAndLook/draw';
import {Cutaway} from './Cutaway';
import {
  BELL_AT,
  BINDER,
  BOX,
  BOXES,
  CARD,
  CARRIAGE,
  CLOUD,
  LAPTOP,
  PHONES,
  PIPE,
  SAFE,
  SERVER,
  SILHOUETTE,
  SIM_AT,
  SMALL_PHONE,
  SUPER_MIDDLE_AT,
  SUPER_ROOMS_AT,
  SUPER_VAULT_AT,
  TAB,
  TEST_COUNT_PLACEHOLDER,
  TEST_ROLL_AT,
  TRACKS,
  VAULT_SUPER_TEXT,
  toRegion,
} from './layout';

const NEVER = 1e6;
const tabTime = (i: number): number => B.tabs.first + i * B.tabs.every;

// Top floor: the laptop and its drawn navigator (8.0-), the tests (64.0-69.0)

const NAV = {w: 150, row: 21, top: 30, font: 11};
const XC_BG = '#1E1E21';
const XC_SIDEBAR = '#262629';
const XC_TEXT = 'rgba(235,235,240,0.86)';
const XC_DIM = 'rgba(235,235,240,0.32)';
const TICK_GREEN = '#34C759';

/** A row's top in screen-local px: the project, its Features group, then the seven groups indented. */
const navRowTop = (i: number): number => NAV.top + (i + 2) * NAV.row;

const Navigator: React.FC<{t: number}> = ({t}) => {
  const lit = B.tabs.names.findIndex((_, i) => t >= tabTime(i) - TAB.fly - 0.25 && t < tabTime(i) + 0.2);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: NAV.w, height: '100%', background: XC_SIDEBAR, fontFamily: FONTS.super, fontSize: NAV.font, color: XC_TEXT}}>
      {[{name: 'Provisum', depth: 0}, {name: 'Features', depth: 1}, ...B.tabs.names.map((name) => ({name, depth: 2}))].map((r, i) => {
        const g = i - 2;
        return (
          <div key={r.name} style={{position: 'absolute', left: 0, top: NAV.top + i * NAV.row, width: NAV.w, height: NAV.row, background: g === lit ? 'rgba(110,139,255,0.45)' : 'none'}}>
            <span style={{position: 'absolute', left: 8 + r.depth * 12, top: 4, width: 7, height: 7, borderRight: `1.2px solid ${XC_DIM}`, borderBottom: `1.2px solid ${XC_DIM}`, transform: 'rotate(45deg)'}} />
            <span style={{position: 'absolute', left: 20 + r.depth * 12, top: 5, width: 13, height: 10, borderRadius: 2, border: '1.2px solid #7FA7F5'}} />
            <span style={{position: 'absolute', left: 39 + r.depth * 12, top: 3}}>{r.name}</span>
          </div>
        );
      })}
    </div>
  );
};

/** Hairline "code" in the editor area: grey bars of seeded widths (drawn, wordless). */
const Editor: React.FC = () => {
  const bars = useMemo(() => Array.from({length: 18}, (_, i) => ({indent: [0, 1, 1, 2, 2, 1, 0][i % 7] as number, w: 40 + ((i * 53) % 150), accent: i % 5 === 2})), []);
  return (
    <div style={{position: 'absolute', left: NAV.w + 1, top: 0, right: 0, bottom: 0, background: XC_BG}}>
      {bars.map((b, i) => (
        <div key={i} style={{position: 'absolute', left: 18 + b.indent * 14, top: 22 + i * 14, width: b.w, height: 4, borderRadius: 2, background: b.accent ? 'rgba(252,95,163,0.55)' : 'rgba(235,235,240,0.2)'}} />
      ))}
    </div>
  );
};

/** The test run: a column of green ticks scrolls in the navigator; at 69.0 a wordless green badge (see report). */
const Tests: React.FC<{t: number}> = ({t}) => {
  const {from, to, buildSucceeded} = B.tests;
  const k = clamp01((t - from) / (to - from));
  const rows = 40;
  const shown = Math.floor(k * rows);
  const scroll = Math.max(0, shown - 10) * NAV.row;
  const badge = easeOutCubic((t - buildSucceeded) / 0.3);
  return (
    <>
      <div style={{position: 'absolute', left: 0, top: 0, width: NAV.w, height: '100%', background: XC_SIDEBAR, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: NAV.top - scroll, width: NAV.w}}>
          {Array.from({length: shown}, (_, i) => (
            <div key={i} style={{position: 'absolute', left: 0, top: i * NAV.row, width: NAV.w, height: NAV.row}}>
              <span style={{position: 'absolute', left: 10, top: 4, width: 13, height: 13, borderRadius: 7, background: TICK_GREEN}} />
              <span style={{position: 'absolute', left: 14, top: 6, width: 4, height: 7, borderRight: '1.6px solid #fff', borderBottom: '1.6px solid #fff', transform: 'rotate(40deg)'}} />
              <span style={{position: 'absolute', left: 32, top: 8, width: 50 + ((i * 37) % 60), height: 4, borderRadius: 2, background: 'rgba(235,235,240,0.3)'}} />
            </div>
          ))}
        </div>
      </div>
      {badge > 0 ? (
        <div style={{position: 'absolute', left: NAV.w + (LAPTOP.screen.w - NAV.w) / 2 - 34, top: LAPTOP.screen.h / 2 - 34, width: 68, height: 68, borderRadius: 34, background: TICK_GREEN, opacity: badge, transform: `scale(${0.7 + 0.3 * badge})`}}>
          <span style={{position: 'absolute', left: 25, top: 14, width: 14, height: 28, borderRight: '5px solid #fff', borderBottom: '5px solid #fff', transform: 'rotate(40deg)'}} />
        </div>
      ) : null}
    </>
  );
};

const XcodeScreen: React.FC<{t: number}> = ({t}) => {
  if (t < B.top.xcodeIn) return null;
  const [x, y] = toRegion([LAPTOP.screen.x, LAPTOP.screen.y]);
  const testing = t >= B.tests.from;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: LAPTOP.screen.w, height: LAPTOP.screen.h, overflow: 'hidden', borderRadius: 4, background: XC_BG, opacity: smooth((t - B.top.xcodeIn) / 0.5)}}>
      <Editor />
      {testing ? <Tests t={t} /> : <Navigator t={t} />}
    </div>
  );
};

const LAPTOP_SOURCE = footageStill('binder-home-dark'); // the frame only; the screen is drawn here

const TopFloor: React.FC<{t: number}> = ({t}) => (
  <>
    <XcodeScreen t={t} />
    <ScreenOnPaper device="laptop" source={LAPTOP_SOURCE} at={LAPTOP.at} scale={LAPTOP.scale} drawStart={B.top.laptop.from} drawDuration={B.top.laptop.to - B.top.laptop.from} contentStart={NEVER} seed={71} />
    <NumberRoll to={TEST_COUNT_PLACEHOLDER} start={B.tests.from} duration={B.tests.to - B.tests.from} at={TEST_ROLL_AT} align="centre" size={64} ink="accent" />
    <TestPlaceholderTag t={t} />
    <ScreenOnPaper device="phone" source={footageClip(B.simulator.footage)} at={SIM_AT} scale={1} drawStart={B.simulator.from} drawDuration={1} />
  </>
);

/** A drawn tag that says the number is a placeholder, so nobody ships it by accident. */
const TestPlaceholderTag: React.FC<{t: number}> = ({t}) => {
  if (t < B.tests.from) return null;
  const [x, y] = toRegion([TEST_ROLL_AT[0] + 90, TEST_ROLL_AT[1] - 30]);
  return (
    <div style={{position: 'absolute', left: x, top: y, padding: '2px 8px', border: `1.5px dashed ${COLORS.graphiteSoft}`, borderRadius: 4, fontFamily: FONTS.super, fontSize: 18, color: COLORS.graphiteSoft, opacity: smooth((t - B.tests.from) / 0.5)}}>
      placeholder: the release-day test count
    </div>
  );
};

/** One paper tab: pops out of its navigator row, flies to the margin, pins (Patrick Hand 26, an accent pin). */
const Tabs: React.FC<{t: number}> = ({t}) => (
  <>
    {B.tabs.names.map((name, i) => {
      const pin = tabTime(i);
      const start = pin - TAB.fly;
      if (t < start) return null;
      const k = easeInOutCubic((t - start) / TAB.fly);
      const from: Point = [LAPTOP.screen.x + NAV.w * 0.55, LAPTOP.screen.y + navRowTop(i) + NAV.row / 2];
      const to: Point = [TAB.x, TAB.y0 + TAB.step * i];
      const [fx, fy] = toRegion(from);
      const [tx, ty] = toRegion(to);
      const x = lerp(fx, tx, k);
      const y = lerp(fy, ty, k) - Math.sin(k * Math.PI) * 60;
      const s = lerp(0.35, 1, easeOutCubic(k * 1.6));
      const pinned = t >= pin;
      const press = pinned ? 1 - easeOutCubic((t - pin) / 0.2) : 0;
      return (
        <div
          key={name}
          style={{
            position: 'absolute',
            left: x - TAB.w / 2,
            top: y - TAB.h / 2,
            width: TAB.w,
            height: TAB.h,
            transform: `scale(${s * (1 + 0.04 * press)}) rotate(${((i % 3) - 1) * 1.5 * k}deg)`,
            background: '#F7F3EA',
            borderRadius: '4px 10px 10px 4px',
            border: `1.5px solid rgba(42,42,45,0.7)`,
            boxShadow: castShadow(DEFAULT_LAMP, {height: pinned ? 3 : 3 + 20 * Math.sin(k * Math.PI)}),
            fontFamily: 'Patrick Hand',
            fontSize: 26,
            lineHeight: `${TAB.h}px`,
            paddingLeft: 30,
            color: COLORS.graphite,
            boxSizing: 'border-box',
          }}
        >
          {name}
          {pinned ? <span style={{position: 'absolute', left: 9, top: TAB.h / 2 - 6, width: 12, height: 12, borderRadius: 6, background: COLORS.accent, boxShadow: '1px 2px 2px rgba(0,0,0,0.25)'}} /> : null}
        </div>
      );
    })}
  </>
);

// Middle floor: the Binder (18.0), the boxes, the strings (19.0-22.0), the silhouettes (23.0-28.0), the train

const BOXES_PAGE = (() => {
  const pad = 20;
  const x0 = Math.min(...BOXES.map((b) => b.at[0])) - BOX.w / 2 - pad;
  const y0 = Math.min(...BOXES.map((b) => b.at[1])) - BOX.h / 2 - pad;
  const x1 = Math.max(...BOXES.map((b) => b.at[0])) + BOX.w / 2 + pad;
  const y1 = Math.max(...BOXES.map((b) => b.at[1])) + BOX.h / 2 + pad;
  const items: Timed[] = BOXES.flatMap((b, i) => {
    const cx = b.at[0] - x0;
    const cy = b.at[1] - y0;
    const t0 = B.middle.binder + 0.15 + i * 0.12;
    return [
      at(stroke(`box-${i}`, handRect(cx - BOX.w / 2, cy - BOX.h / 2, BOX.w, BOX.h, 7100 + i, {radius: 6}), {width: 2.2, rough: true}), t0, t0 + 0.4),
      at(label(`box-${i}-label`, b.label, cx - BOX.w / 2 + 12, cy + 9, {size: b.label.length > 10 ? 22 : 26, face: 'patrick-400'}), t0 + 0.3, t0 + 0.8),
    ];
  });
  return {page: timedPage('boxes', items, x1 - x0, y1 - y0), topLeft: [x0, y0] as Point};
})();

const Binder: React.FC<{t: number}> = ({t}) => {
  if (t < B.middle.binder) return null;
  const k = easeOutCubic((t - B.middle.binder) / 0.5);
  const [x, y] = toRegion([BINDER.centre[0] - BINDER.w / 2, BINDER.centre[1] - BINDER.h / 2]);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: BINDER.w, height: BINDER.h, perspective: 900}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: '50% 100%',
          transform: `rotateX(${80 * (1 - k)}deg)`,
          background: '#F7F3EA',
          border: `2.4px solid ${COLORS.graphite}`,
          borderRadius: 8,
          boxShadow: castShadow(DEFAULT_LAMP, {height: 6 + 18 * (1 - k)}),
        }}
      >
        {[0.3, 0.5, 0.7].map((f) => (
          <span key={f} style={{position: 'absolute', left: 14, top: BINDER.h * f - 7, width: 14, height: 14, borderRadius: 7, border: `2px solid ${COLORS.graphite}`}} />
        ))}
        <div style={{position: 'absolute', left: 0, right: 0, top: BINDER.h / 2 - 22, textAlign: 'center', fontFamily: 'Patrick Hand', fontSize: 30, color: COLORS.graphite}}>Binder</div>
      </div>
    </div>
  );
};

const Strings: React.FC<{t: number}> = ({t}) => {
  const {from, to} = B.middle.strings;
  if (t < from) return null;
  const each = (to - from) / BOXES.length;
  const [bx, by] = toRegion(BINDER.centre);
  return (
    <Layer>
      {BOXES.map((b, i) => {
        const k = clamp01((t - from - i * each) / each);
        if (k <= 0) return null;
        const [ex, ey] = toRegion(b.at);
        // from the Binder's edge to the box's near edge, with a little sag
        const sx = bx + Math.sign(ex - bx) * (Math.abs(ex - bx) > 1 ? BINDER.w * 0.42 : 0);
        const sy = by + Math.sign(ey - by) * BINDER.h * 0.45;
        const tx = ex - Math.sign(ex - bx) * (Math.abs(ex - bx) > 1 ? BOX.w * 0.35 : 0);
        const ty = ey - Math.sign(ey - by) * BOX.h * 0.5;
        const d = handPath([[sx, sy], [(sx + tx) / 2, (sy + ty) / 2 + 12], [tx, ty]] as XY[], 7200 + i, {wobble: 0.4, smooth: 0.7});
        return (
          <g key={b.label}>
            <path d={d} fill="none" stroke={COLORS.accent} strokeWidth={2.4} strokeOpacity={0.9} strokeLinecap="round" pathLength={1} strokeDasharray={`${k} 1`} />
            {k >= 1 ? <circle cx={tx} cy={ty} r={4.5} fill={COLORS.accent} /> : null}
          </g>
        );
      })}
    </Layer>
  );
};

const WHO: Record<(typeof B.middle.silhouettes.names)[number], CharacterId> = {Dad: 'dad', Mia: 'mia', Maya: 'maya', Jonas: 'jonas', Sam: 'sam', Biscuit: 'biscuit'};

const Silhouettes: React.FC<{t: number; zoom: number}> = ({t, zoom}) => {
  const {first, every, names} = B.middle.silhouettes;
  return (
    <>
      {names.map((n, i) => {
        const t0 = first + i * every;
        if (t < t0) return null;
        const [x, y] = toRegion([SILHOUETTE.x0 + i * SILHOUETTE.step, SILHOUETTE.ground]);
        const character = WHO[n];
        return <LineCharacter key={n} character={character} pose="stand" scale={character === 'biscuit' ? SILHOUETTE.petScale : SILHOUETTE.scale} x={x} y={y} progress={clamp01((t - t0) / 0.8)} zoom={zoom} boil={0.3} />;
      })}
    </>
  );
};

/** Track y at a sheet x for track k (fans into the main line between mergeFrom and merge). */
const trackY = (k: number, x: number): number => lerp(TRACKS.ys[k] as number, TRACKS.main, smooth((x - TRACKS.mergeFrom) / (TRACKS.merge - TRACKS.mergeFrom)));
const trackD = (k: number): string => {
  const pts: XY[] = [];
  for (let x = TRACKS.x0; x <= TRACKS.merge + 10; x += 20) pts.push(toRegion([x, trackY(k, x)]) as XY);
  return handPath(pts, 7300 + k, {wobble: 0.3, smooth: 0.8});
};
const TRACK_PATHS = [0, 1, 2].map(trackD);
const MAIN_D = (() => {
  const [a, ay] = toRegion([TRACKS.merge, TRACKS.main]);
  const [b] = toRegion([TRACKS.end, TRACKS.main]);
  return handLine(a, ay, b, ay + 1, 7310);
})();
const SLEEPERS = (() => {
  const out: string[] = [];
  for (let x = TRACKS.merge + 20; x < TRACKS.end; x += 34) {
    const [lx, ly] = toRegion([x, TRACKS.main]);
    out.push(handLine(lx - 4, ly - 7, lx + 4, ly + 7, 7320 + x));
  }
  return out.join(' ');
})();

/** Carriage centre x at t (pass the merge point at its merge time; line up at the end of the run). */
const carriageX = (k: number, t: number): number => {
  const {run} = B.train;
  const m = B.train.merges[k] as number;
  const xf = CARRIAGE.finals[k] as number;
  const xm = TRACKS.merge + 40;
  if (t <= run.from) return CARRIAGE.start;
  if (t <= m) return lerp(CARRIAGE.start, xm, (t - run.from) / (m - run.from));
  return lerp(xm, xf, easeOutCubic((t - m) / (run.to - 0.5 - m)));
};

/** The three carriages' little drawings (passport, envelope, clock) in carriage-local px (120 x 70). */
const CARRIAGE_ART: readonly string[] = [
  [handRect(40, 10, 40, 50, 7400, {radius: 3}), handCircle(60, 32, 9, 9, 7401)].join(' '),
  [handRect(32, 16, 56, 38, 7410, {radius: 2}), handPath([[32, 18], [60, 38], [88, 18]], 7411, {wobble: 0.3})].join(' '),
  [handCircle(60, 35, 21, 21, 7420, {overlap: 0.1}), handLine(60, 35, 60, 22, 7421), handLine(60, 35, 70, 40, 7422)].join(' '),
];

const Train: React.FC<{t: number}> = ({t}) => {
  const {tracks, ticks, billTick, bell} = B.train;
  if (t < tracks.from) return null;
  const tk = clamp01((t - tracks.from) / (tracks.to - tracks.from));
  const draw = clamp01((t - tracks.from - 0.5) / 1.5);
  const ring = t >= bell.from && t < bell.to ? Math.sin((t - bell.from) * 30) * 14 * (1 - (t - bell.from)) : 0;
  const [bx, by] = toRegion(BELL_AT);
  return (
    <Layer>
      {TRACK_PATHS.map((d, k) => (
        <path key={k} d={d} fill="none" stroke={COLORS.graphite} strokeOpacity={0.8} strokeWidth={2} strokeLinecap="round" pathLength={1} strokeDasharray={`${tk} 1`} />
      ))}
      <path d={MAIN_D} fill="none" stroke={COLORS.graphite} strokeOpacity={0.85} strokeWidth={2.2} strokeLinecap="round" pathLength={1} strokeDasharray={`${tk} 1`} />
      {tk >= 1 ? <path d={SLEEPERS} fill="none" stroke={COLORS.graphite} strokeOpacity={0.5} strokeWidth={1.4} /> : null}
      {[0, 1, 2].map((k) => {
        const cx = carriageX(k, t);
        const [x, y] = toRegion([cx - CARRIAGE.w / 2, trackY(k, cx) - CARRIAGE.h - 4]);
        const body = handRect(0, 0, CARRIAGE.w, CARRIAGE.h, 7430 + k, {radius: 8, overshoot: 3});
        const wheels = [handCircle(26, CARRIAGE.h + 2, 7, 7, 7440 + k), handCircle(CARRIAGE.w - 26, CARRIAGE.h + 2, 7, 7, 7450 + k)].join(' ');
        return (
          <g key={k} transform={`translate(${x} ${y})`}>
            <path d={body} fill="#F7F3EA" fillOpacity={0.9} stroke={COLORS.graphite} strokeWidth={2.2} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 1`} />
            <path d={CARRIAGE_ART[k]} fill="none" stroke={COLORS.graphite} strokeWidth={1.6} strokeOpacity={draw} strokeLinecap="round" />
            <path d={wheels} fill="none" stroke={COLORS.graphite} strokeWidth={1.8} strokeOpacity={draw} />
          </g>
        );
      })}
      {t >= bell.from - 0.5 ? (
        <g transform={`translate(${bx} ${by}) rotate(${ring})`} opacity={smooth((t - bell.from + 0.5) / 0.4)}>
          <path d={`${handPath([[-16, 14], [-12, -6], [0, -16], [12, -6], [16, 14], [-16, 14]] as XY[], 7460, {wobble: 0.3})} ${handLine(0, -16, 0, -26, 7461)}`} fill="none" stroke={COLORS.graphite} strokeWidth={2} />
          <circle cx={0} cy={18} r={3.5} fill={COLORS.graphite} />
        </g>
      ) : null}
      <ReminderTicks t={t} from={ticks.from} to={ticks.to} billAt={billTick} />
    </Layer>
  );
};

/** 9 · 6 · 3 over the passport carriage (36.5-38.5); one tick over the bill (38.5), with the claims sheet's reword. */
export const BILL_REMINDER = '3 days before, and on the day';
const ReminderTicks: React.FC<{t: number; from: number; to: number; billAt: number}> = ({t, from, to, billAt}) => {
  if (t < from) return null;
  const marks = ['9', '6', '3'];
  const each = (to - from) / marks.length;
  const [px, py] = toRegion([CARRIAGE.finals[0], TRACKS.main - CARRIAGE.h - 40]);
  const [bx, by] = toRegion([CARRIAGE.finals[1], TRACKS.main + 52]);
  return (
    <>
      {marks.map((m, i) => {
        const k = clamp01((t - from - i * each) / (each * 0.6));
        if (k <= 0) return null;
        const x = px - 48 + i * 48;
        return (
          <g key={m}>
            <path d={handTick(x - 8, py - 6, 16, 7500 + i)} fill="none" stroke={COLORS.accent} strokeWidth={3} strokeLinecap="round" pathLength={1} strokeDasharray={`${k} 1`} />
            <text x={x + 8} y={py} fontSize={26} fill={COLORS.accent} opacity={k} style={{fontFamily: 'Patrick Hand'}}>
              {m}
            </text>
          </g>
        );
      })}
      {t >= billAt ? (
        <g opacity={smooth((t - billAt) / 0.3)}>
          <path d={handTick(bx - 120, by - 6, 16, 7510)} fill="none" stroke={COLORS.accent} strokeWidth={3} strokeLinecap="round" />
          <text x={bx - 96} y={by} fontSize={26} fill={COLORS.accent} style={{fontFamily: 'Patrick Hand'}}>
            {BILL_REMINDER}
          </text>
        </g>
      ) : null}
    </>
  );
};

// The vault and below: the server drawn and erased, pipe, cloud, phones, strings; the safe

const SERVER_PAGE = (() => {
  const pad = 20;
  const {w, h} = SERVER;
  const items: Timed[] = [
    at(stroke('server', handRect(pad, pad, w, h, 7600, {radius: 8}), {width: 2.6, rough: true}), 44.0, 44.7),
    ...[0, 1, 2].map((i) => at(stroke(`slot-${i}`, `${handLine(pad + 24, pad + 50 + i * 40, pad + w - 60, pad + 50 + i * 40, 7610 + i)} ${handCircle(pad + w - 34, pad + 50 + i * 40, 5, 5, 7620 + i)}`, {width: 1.8}), 44.5 + i * 0.12, 44.75 + i * 0.12)),
    at(label('server-label', SERVER.label, pad + 18, pad + h - 22, {size: 28, face: 'patrick-400'}), 44.9, 45.5),
  ];
  return timedPage('server', items, w + pad * 2, h + pad * 2);
})();

const Server: React.FC<{t: number; zoom: number}> = ({t, zoom}) => {
  const {draw, erase} = B.vault.server;
  if (t < draw.from) return null;
  const e = clamp01((t - erase.from) / (erase.to - erase.from));
  const pad = 20;
  const topLeft: Point = [SERVER.centre[0] - SERVER.w / 2 - pad, SERVER.centre[1] - SERVER.h / 2 - pad];
  const [cx, cy] = toRegion([SERVER.centre[0] - SERVER.w / 2, SERVER.centre[1] + SERVER.h / 2 - 10]);
  // the eraser sweeps left to right; behind its edge nothing is left
  const edge = -10 + e * 120;
  const mask = `linear-gradient(90deg, transparent ${edge}%, black ${edge + 10}%)`;
  return (
    <>
      {e < 1 ? <PageOnSheet page={SERVER_PAGE} topLeft={topLeft} t={t} zoom={zoom} style={e > 0 ? {maskImage: mask, WebkitMaskImage: mask} : undefined} /> : null}
      {e > 0 ? <EraserCrumbs area={{x: cx, y: cy, w: SERVER.w, h: 40}} seed={77} count={8} amount={e} /> : null}
    </>
  );
};

/** A bumpy hand-drawn cloud in local px around (cx, cy). */
const cloudPath = (cx: number, cy: number, w: number, h: number): string => {
  const pts: XY[] = [];
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const bump = 1 + 0.12 * Math.abs(Math.sin(a * 3.5));
    pts.push([cx + Math.cos(a) * (w / 2) * bump, cy + Math.sin(a) * (h / 2) * bump * (Math.sin(a) > 0 ? 0.8 : 1)]);
  }
  return handPath(pts, 7700, {wobble: 0.6, smooth: 0.8});
};

const Below: React.FC<{t: number}> = ({t}) => {
  const {pipe, cloud, phones, strings} = B.vault;
  if (t < pipe) return null;
  const pk = clamp01((t - pipe) / 0.5);
  const ck = clamp01((t - cloud.from) / (cloud.to - cloud.from));
  const [cx, cy] = toRegion(CLOUD.centre);
  const [px, p0] = toRegion([PIPE.x, PIPE.from]);
  const [, p1] = toRegion([PIPE.x, PIPE.to]);
  return (
    <Layer>
      {[-9, 9].map((dx) => (
        <path key={dx} d={handLine(px + dx, p0, px + dx, p1, 7710 + dx)} fill="none" stroke={COLORS.graphite} strokeWidth={2.2} strokeLinecap="round" pathLength={1} strokeDasharray={`${pk} 1`} />
      ))}
      {ck > 0 ? (
        <>
          <path d={cloudPath(cx, cy, CLOUD.w, CLOUD.h)} fill="none" stroke={COLORS.graphite} strokeWidth={2.6} strokeLinecap="round" pathLength={1} strokeDasharray={`${ck} 1`} />
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize={28} fill={COLORS.graphite} opacity={smooth((ck - 0.6) / 0.4)} style={{fontFamily: 'Patrick Hand'}}>
            {CLOUD.label}
          </text>
        </>
      ) : null}
      {PHONES.map((p, i) => {
        const k = clamp01((t - phones.from - i * 0.5) / ((phones.to - phones.from) * 0.6));
        if (k <= 0) return null;
        const [x, y] = toRegion(p.centre);
        const [sx, sy] = [x - SMALL_PHONE.w / 2, y - SMALL_PHONE.h / 2];
        const sk = clamp01((t - strings.from - i * 0.3) / ((strings.to - strings.from) * 0.7));
        const from: XY = [cx + Math.sign(x - cx) * CLOUD.w * 0.36, cy + CLOUD.h * 0.25];
        const to: XY = [x, sy - 10];
        return (
          <g key={p.label}>
            <path d={handRect(sx, sy, SMALL_PHONE.w, SMALL_PHONE.h, 7720 + i, {radius: 18})} fill="none" stroke={COLORS.graphite} strokeWidth={2.4} strokeLinecap="round" pathLength={1} strokeDasharray={`${k} 1`} />
            <path d={handRect(sx + 9, sy + 9, SMALL_PHONE.w - 18, SMALL_PHONE.h - 18, 7730 + i, {radius: 12})} fill="none" stroke={COLORS.graphite} strokeWidth={1.3} strokeOpacity={0.6 * k} />
            <text x={x} y={sy + SMALL_PHONE.h + 40} textAnchor="middle" fontSize={28} fill={COLORS.graphite} opacity={smooth((k - 0.5) / 0.5)} style={{fontFamily: 'Patrick Hand'}}>
              {p.label}
            </text>
            {dots(from, to, 22)
              .slice(0, Math.floor(sk * 22))
              .map(([dx, dy], j) => (
                <circle key={j} cx={dx} cy={dy} r={2.6} fill={COLORS.accent} opacity={0.9} />
              ))}
          </g>
        );
      })}
    </Layer>
  );
};

/** Dots along a sagging string from a to b (a quadratic), for the dotted strings cloud → phones. */
const dots = (a: XY, b: XY, n: number): readonly XY[] => {
  const c: XY = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 30];
  return Array.from({length: n}, (_, i) => {
    const u = (i + 0.5) / n;
    return [(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]] as XY;
  });
};

const SAFE_PAGE = (() => {
  const pad = 20;
  const {w, h} = SAFE;
  const {from, to} = B.vault.safe.draw;
  const items: Timed[] = [
    at(stroke('body', handRect(pad, pad, w, h, 7800, {radius: 10}), {width: 2.8, rough: true}), from, from + 0.7),
    at(stroke('opening', handRect(pad + 24, pad + 24, w - 48, h - 48, 7801, {radius: 6}), {width: 1.8}), from + 0.6, from + 1.1),
    at(stroke('feet', `${handLine(pad + 20, pad + h + 8, pad + 50, pad + h + 8, 7802)} ${handLine(pad + w - 50, pad + h + 8, pad + w - 20, pad + h + 8, 7803)}`, {width: 2.2}), from + 1.1, to),
  ];
  return timedPage('safe', items, w + pad * 2, h + pad * 2 + 12);
})();

const Safe: React.FC<{t: number; zoom: number}> = ({t, zoom}) => {
  const {draw, cardIn, padlock} = B.vault.safe;
  if (t < draw.from) return null;
  const pad = 20;
  const [sx, sy] = toRegion([SAFE.centre[0] - SAFE.w / 2, SAFE.centre[1] - SAFE.h / 2]);
  const cardK = easeInOutCubic((t - cardIn.from) / (cardIn.to - cardIn.from));
  const [fx, fy] = toRegion(CARD.from);
  const [tx, ty] = toRegion(SAFE.centre);
  const doorK = easeInOutCubic((t - cardIn.to) / (padlock - cardIn.to));
  const lockK = t >= padlock ? 1 : 0;
  const drop = t >= padlock ? 10 * (1 - easeOutCubic((t - padlock) / 0.15)) : 10;
  const ow = SAFE.w - 48;
  const oh = SAFE.h - 48;
  return (
    <>
      <PageOnSheet page={SAFE_PAGE} topLeft={[SAFE.centre[0] - SAFE.w / 2 - pad, SAFE.centre[1] - SAFE.h / 2 - pad]} t={t} zoom={zoom} />
      {t >= cardIn.from ? (
        <div
          style={{
            position: 'absolute',
            left: lerp(fx, tx, cardK) - CARD.w / 2,
            top: lerp(fy, ty, cardK) - CARD.h / 2,
            width: CARD.w,
            height: CARD.h,
            transform: `scale(${lerp(1, 0.82, cardK)})`,
            background: '#F7F3EA',
            border: `2px solid ${COLORS.graphite}`,
            borderRadius: 10,
            boxShadow: castShadow(DEFAULT_LAMP, {height: 4 + 10 * Math.sin(cardK * Math.PI)}),
          }}
        >
          <span style={{position: 'absolute', left: CARD.w / 2 - 18, top: CARD.h / 2 - 3, width: 36, height: 6, background: COLORS.graphite, borderRadius: 2}} />
          <span style={{position: 'absolute', left: CARD.w / 2 - 3, top: CARD.h / 2 - 18, width: 6, height: 36, background: COLORS.graphite, borderRadius: 2}} />
        </div>
      ) : null}
      {doorK > 0 ? (
        <div style={{position: 'absolute', left: sx + 24, top: sy + 24, width: ow, height: oh, perspective: 700}}>
          <div style={{position: 'absolute', inset: 0, transformOrigin: '0 50%', transform: `rotateY(${-100 * (1 - doorK)}deg)`, background: '#EFE9DC', border: `2.4px solid ${COLORS.graphite}`, borderRadius: 6}}>
            <span style={{position: 'absolute', left: ow / 2 - 26, top: oh / 2 - 26, width: 52, height: 52, borderRadius: 26, border: `2.4px solid ${COLORS.graphite}`}} />
            <span style={{position: 'absolute', left: ow / 2 - 2, top: oh / 2 - 22, width: 4, height: 16, background: COLORS.graphite}} />
          </div>
        </div>
      ) : null}
      {lockK ? (
        <svg style={{position: 'absolute', left: sx + SAFE.w - 70, top: sy + SAFE.h / 2 - 30 - drop, width: 60, height: 70, overflow: 'visible'}}>
          <path d={handPath([[14, 32], [14, 16], [22, 6], [38, 6], [46, 16], [46, 32]] as XY[], 7810, {wobble: 0.3, smooth: 0.8})} fill="none" stroke={COLORS.graphite} strokeWidth={4} strokeLinecap="round" />
          <path d={handRect(6, 30, 48, 36, 7811, {radius: 6})} fill="#F7F3EA" stroke={COLORS.graphite} strokeWidth={3} />
          <circle cx={30} cy={46} r={4} fill={COLORS.graphite} />
        </svg>
      ) : null}
    </>
  );
};

// Layers

const supers = (): readonly SuperProps[] => {
  const [rooms, person, dates, vault] = SUPERS.engineRoom;
  if (!rooms || !person || !dates || !vault) throw new Error('engineRoom: four supers expected');
  return [
    superFromBeat(rooms, {sheet: SUPER_ROOMS_AT, align: 'centre'}),
    superFromBeat(person, {sheet: SUPER_MIDDLE_AT, align: 'centre'}),
    superFromBeat(dates, {sheet: SUPER_MIDDLE_AT, align: 'centre'}),
    {...superFromBeat(vault, {sheet: SUPER_VAULT_AT, align: 'centre'}), text: VAULT_SUPER_TEXT},
  ];
};
export const SUPER_PROPS = supers();

export const Art: React.FC = () => {
  const {t, camera} = useChapter('engineRoom');
  const zoom = camera.zoom;
  return (
    <>
      <Cutaway t={t} zoom={zoom}>
        <TopFloor t={t} />
        <BoxesPage t={t} zoom={zoom} />
        <Strings t={t} />
        <Binder t={t} />
        <Silhouettes t={t} zoom={zoom} />
        <Train t={t} />
        <Safe t={t} zoom={zoom} />
        <Server t={t} zoom={zoom} />
        <Below t={t} />
        <Tabs t={t} />
        {SUPER_PROPS.map((p) => (
          <Super key={p.start} {...p} />
        ))}
      </Cutaway>
    </>
  );
};

const BoxesPage: React.FC<{t: number; zoom: number}> = ({t, zoom}) => <PageOnSheet page={BOXES_PAGE.page} topLeft={BOXES_PAGE.topLeft} t={t} zoom={zoom} />;

export const Overlay: React.FC = () => null;

export const Chapter: React.FC = () => <ChapterShell id="engineRoom" art={<Art />} overlay={<Overlay />} />;
