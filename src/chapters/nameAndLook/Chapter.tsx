// Chapter.tsx — chapter 6, "The name and the look" (3:55-4:50, local 0-55; BIBLE4 §5.6, script §6).
// A sheet of crossed-out names ("On Behalf" last); PROVISUM writes itself in Caveat and settles as the DM Sans 700
// logotype; the pencil draws a generic laptop whose screen shows the imagined design file (contract 13.4: a dark
// canvas of real app screens, never a tool); the camera dives in for tokens, wallpapers, the form crossed out, the
// emergency view at the largest text size and a flicker of drawn wireframes that settles on the real home screen;
// back out, the laptop folds flat.
import React, {useMemo} from 'react';
import {Img, staticFile} from 'remotion';
import {SUPERS, nameAndLook as B} from '../../beats4';
import {COLORS, FONTS} from '../../film';
import {ChapterShell, ScreenOnPaper, Super, footageClip, footageStill, superFromBeat, useChapter, type SuperProps} from '../../kit';
import {DEFAULT_LAMP, PencilCanvas, castShadow, handLine, handPath, handRect, label, measureHand, stroke, type XY} from '../../paper';
import {ClipWindow, at, clamp01, easeInOutCubic, easeOutCubic, lerp, smooth, timedPage, type Timed} from './draw';
import {
  CITY,
  CITY_GRID,
  CROSSED_NAMES,
  LAPTOP,
  LAST_NAME,
  NAMES_SHEET,
  PHONE,
  SCREEN,
  SCREEN_TL,
  SWATCH,
  TOKENS,
  WALLPAPER_SOURCE,
  WALLPAPER_TILES,
  WORD,
  WORD_PARKED,
  toRegion,
} from './layout';

const IN = B.inside;

// The names sheet (0.0-4.5; slides off 12.0-13.0 so the laptop has the paper)

const NAME = {x: 56, first: 92, step: 64, size: 40, lastSize: 36};
const NAMES_PAGE = (() => {
  const {each} = B.crossedNames;
  const items: Timed[] = CROSSED_NAMES.flatMap((name, i) => {
    const y = NAME.first + NAME.step * i;
    const w = measureHand(name, NAME.size, 'caveat-500');
    const t0 = B.crossedNames.from + i * each;
    return [
      at(label(`name-${i}`, name, NAME.x, y, {size: NAME.size, face: 'caveat-500', rotate: (i % 3) - 1}), t0, t0 + each * 0.62),
      at(stroke(`cross-${i}`, handLine(NAME.x - 12, y - 13 + (i % 2) * 3, NAME.x + w + 14, y - 15 - (i % 3) * 2, 600 + i, {bow: 2}), {width: 2.6, pressure: 1.15}), t0 + each * 0.66, t0 + each * 0.96),
    ];
  });
  items.push(at(label('on-behalf', LAST_NAME, NAME.x, NAME.first + NAME.step * CROSSED_NAMES.length + 4, {size: NAME.lastSize, face: 'patrick-400'}), B.onBehalf.from, B.onBehalf.to));
  return timedPage('names', items, NAMES_SHEET.w, NAMES_SHEET.h);
})();

const NamesSheet: React.FC<{t: number; zoom: number}> = ({t, zoom}) => {
  const {centre, w, h, rotate} = NAMES_SHEET;
  const [cx, cy] = toRegion(centre);
  const out = smooth((t - WORD_PARKED.move.from) / (WORD_PARKED.move.to - WORD_PARKED.move.from));
  if (out >= 1) return null;
  const progress = clamp01((t - NAMES_PAGE.from) / (NAMES_PAGE.to - NAMES_PAGE.from));
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - w / 2 - 260 * out,
        top: cy - h / 2,
        width: w,
        height: h,
        transform: `rotate(${rotate - 2 * out}deg)`,
        background: '#F7F3EA',
        boxShadow: castShadow(DEFAULT_LAMP, {height: 4}),
        opacity: 1 - out,
      }}
    >
      <PencilCanvas marks={NAMES_PAGE.marks} progress={progress} width={w} height={h} zoom={zoom} style={{left: 0, top: 0}} />
    </div>
  );
};

// PROVISUM (5.0-7.5), the Latin line (7.5-8.5), the logotype (9.0-11.0), parked above the laptop (12.0-13.0)

const WORD_PAD = 40;
const WORD_W = Math.ceil(measureHand(WORD.text, WORD.size, 'caveat-700')) + WORD_PAD * 2;
const LATIN_W = Math.ceil(measureHand(B.latin.text, WORD.latinSize, 'caveat-500')) + WORD_PAD * 2;
const WORD_PAGE = timedPage('provisum', [at(label('word', WORD.text, WORD_PAD, WORD.size * 1.05, {size: WORD.size, face: 'caveat-700', pressure: 1.2}), B.provisumWrites.from, B.provisumWrites.to)], WORD_W, Math.ceil(WORD.size * 1.4));
const LATIN_PAGE = timedPage('latin', [at(label('latin', B.latin.text, WORD_PAD, WORD.latinSize * 1.1, {size: WORD.latinSize, face: 'caveat-500'}), B.latin.from, B.latin.to)], LATIN_W, Math.ceil(WORD.latinSize * 1.6));

const Word: React.FC<{t: number; zoom: number}> = ({t, zoom}) => {
  const [bx, by] = WORD.centre; // baseline centre
  const lift = smooth((t - B.logotype.lift.from) / (B.logotype.lift.to - B.logotype.lift.from));
  const fade = smooth((t - B.logotype.crossfade.from) / (B.logotype.crossfade.to - B.logotype.crossfade.from));
  const park = easeInOutCubic((t - WORD_PARKED.move.from) / (WORD_PARKED.move.to - WORD_PARKED.move.from));
  // the whole group moves from its written place to the parked one (baseline centre), scaling about that point
  const [px, py] = WORD_PARKED.centre;
  const dx = (px - bx) * park;
  const dy = (py - by) * park - 20 * lift * (1 - park);
  const s = lerp(1, WORD_PARKED.scale, park);
  const [lx, ly] = toRegion([bx, by]);
  const shadow = 2 + 14 * lift * (1 - park * 0.6);
  // during the dive the tall frame (z 1.9) would still see the parked logotype above the screen: it rests unseen
  const away = smooth((t - B.dive.from) / 1.5) * (1 - smooth((t - B.pullOut.from) / 1.5));
  return (
    <div style={{position: 'absolute', left: lx, top: ly, width: 0, height: 0, transform: `translate(${dx}px, ${dy}px) scale(${s})`, transformOrigin: '0 0', opacity: 1 - away}}>
      {/* the pencil word: gains weight as it lifts (a second, offset pass), fades as the type weighs in */}
      <div style={{position: 'absolute', left: -WORD_W / 2, top: -WORD.size * 1.05, opacity: 1 - smooth(fade * 1.8), filter: lift > 0.01 ? `drop-shadow(${shadow * 0.5}px ${shadow}px ${shadow}px rgba(60,45,25,${0.18 * lift}))` : undefined}}>
        <PageOnSheetLocal page={WORD_PAGE} t={t} zoom={zoom * s} />
        {lift > 0.01 ? (
          <div style={{position: 'absolute', left: 1.5 * lift, top: 0.8 * lift, opacity: 0.85 * lift}}>
            <PageOnSheetLocal page={WORD_PAGE} t={t} zoom={zoom * s} />
          </div>
        ) : null}
      </div>
      {fade > 0.001 ? (
        <div
          style={{
            position: 'absolute',
            left: -600,
            width: 1200,
            top: -WORD.logoSize * 0.94,
            textAlign: 'center',
            fontFamily: FONTS.super,
            fontWeight: 700,
            fontSize: WORD.logoSize,
            lineHeight: 1,
            letterSpacing: '0.02em',
            color: COLORS.graphite,
            opacity: fade,
            textShadow: `0 ${4 + 6 * (1 - park)}px ${10 + 8 * (1 - park)}px rgba(60,45,25,${0.16 * (1 - park * 0.7)})`,
          }}
        >
          {WORD.text}
        </div>
      ) : null}
      <div style={{position: 'absolute', left: -LATIN_W / 2, top: WORD.latinGap - WORD.latinSize * 1.1}}>
        <PageOnSheetLocal page={LATIN_PAGE} t={t} zoom={zoom * s} />
      </div>
    </div>
  );
};

/** A timed page at its parent's (0, 0). */
const PageOnSheetLocal: React.FC<{page: typeof WORD_PAGE; t: number; zoom: number}> = ({page, t, zoom}) =>
  t < page.from ? null : <PencilCanvas marks={page.marks} progress={clamp01((t - page.from) / (page.to - page.from))} width={page.width} height={page.height} zoom={zoom} style={{left: 0, top: 0}} />;

// The design file (16.0-50.0): screen-local px (900 x 560), drawn into the laptop's screen rect

const SCREEN_BG = '#0B0B0C';
const HAIR = 'rgba(245,247,250,0.82)';
const HAIR_SOFT = 'rgba(245,247,250,0.38)';

/** "A city at night": 24 real screens in a 6 x 4 grid, lit one by one in a scatter (16.0-18.0). */
const City: React.FC<{t: number}> = ({t}) => {
  const {cols, rows, w, h, gap} = CITY_GRID;
  const gw = cols * w + (cols - 1) * gap;
  const gh = rows * h + (rows - 1) * gap;
  const x0 = (SCREEN.w - gw) / 2;
  const y0 = (SCREEN.h - gh) / 2;
  const {from, to} = B.designFileIn;
  const out = 1 - smooth((t - (B.dive.to - 0.6)) / 0.6);
  if (t < from || out <= 0) return null;
  return (
    <>
      <div style={{position: 'absolute', inset: 0, opacity: out * smooth((t - from) / (to - from)), background: 'radial-gradient(ellipse at 50% 50%, rgba(70,84,130,0.55) 0%, rgba(30,36,60,0.35) 45%, rgba(11,11,12,0) 78%)'}} />
      {CITY.map((src, i) => {
        const order = (i * 7) % CITY.length; // a scatter, like windows lighting up
        const k = smooth((t - from - (order / CITY.length) * (to - from) * 0.7) / ((to - from) * 0.3));
        if (k <= 0) return null;
        const c = i % cols;
        const r = Math.floor(i / cols);
        return (
          <Img
            key={src.id}
            src={staticFile(src.src)}
            style={{position: 'absolute', left: x0 + c * (w + gap), top: y0 + r * (h + gap), width: w, height: h, borderRadius: 5, objectFit: 'cover', opacity: k * out, boxShadow: '0 0 18px rgba(150,175,255,0.32)', filter: 'brightness(1.18)'}}
          />
        );
      })}
    </>
  );
};

/** Colour tokens, light and dark: two columns of six swatches with hairline labels (23.0-28.0). */
const Tokens: React.FC<{t: number}> = ({t}) => {
  const {from, to} = IN.tokens;
  const out = 1 - smooth((t - (to - 0.4)) / 0.4);
  if (t < from || out <= 0) return null;
  const panel = {w: 196, h: 372, y: 40};
  const cols = [
    {x: 450 - panel.w - 14, bg: TOKENS[0]?.light ?? '#F3F5F9', ink: '#111827', key: 'light' as const, name: 'Light'},
    {x: 450 + 14, bg: TOKENS[0]?.dark ?? '#0B0D12', ink: '#F3F5F9', key: 'dark' as const, name: 'Dark'},
  ];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: out}}>
      {cols.map((col, ci) => {
        const pk = smooth((t - from - ci * 0.25) / 0.5);
        return (
          <div key={col.key} style={{position: 'absolute', left: col.x, top: panel.y, width: panel.w, height: panel.h, borderRadius: 14, background: col.bg, border: `1px solid ${HAIR_SOFT}`, opacity: pk}}>
            <div style={{position: 'absolute', left: 14, top: 12, fontFamily: FONTS.super, fontWeight: 500, fontSize: 11, color: col.ink, opacity: 0.6, letterSpacing: '0.04em'}}>{col.name}</div>
            {TOKENS.map((tok, i) => {
              const k = easeOutCubic((t - from - 0.4 - i * 0.22 - ci * 0.11) / 0.3);
              return (
                <div key={tok.role} style={{position: 'absolute', left: 14, top: 36 + i * 54, width: panel.w - 28, height: 44, opacity: k, transform: `translateY(${(1 - k) * 8}px)`}}>
                  <div style={{position: 'absolute', left: 0, top: 0, width: 72, height: 44, borderRadius: 10, background: tok[col.key], border: `1px solid ${col.key === 'light' ? 'rgba(17,24,39,0.16)' : 'rgba(243,245,249,0.22)'}`}} />
                  <div style={{position: 'absolute', left: 84, top: 14, fontFamily: FONTS.super, fontSize: 12, color: col.ink, opacity: 0.78}}>{tok.role}</div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

/** One wallpaper tile from the real capture, cropped to a phone shape (the tile's middle, its full height). */
const WallpaperSwatch: React.FC<{i: number}> = ({i}) => {
  const tile = WALLPAPER_TILES[i];
  if (!tile) return null;
  const k = SWATCH.h / tile.h;
  const cx = tile.x + tile.w / 2;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: SWATCH.w, height: SWATCH.h, borderRadius: 16, overflow: 'hidden', boxShadow: '0 6px 18px rgba(0,0,0,0.45)'}}>
      <Img
        src={staticFile(WALLPAPER_SOURCE.src)}
        style={{position: 'absolute', maxWidth: 'none', width: WALLPAPER_SOURCE.width * k, height: WALLPAPER_SOURCE.height * k, left: SWATCH.w / 2 - cx * k, top: -tile.y * k}}
      />
    </div>
  );
};

/** The nine wallpapers slide past right to left (28.0-30.5), then fan out like paint swatches (30.5-32.0). */
const Wallpapers: React.FC<{t: number}> = ({t}) => {
  const {from, to, slide, fan, count} = IN.wallpapers;
  const out = 1 - smooth((t - (to - 0.4)) / 0.4);
  if (t < from || out <= 0) return null;
  const speed = 400 / 2.2; // 400 screen px/s at z 2.2
  const rowW = count * SWATCH.w + (count - 1) * SWATCH.gap;
  const travel = speed * (slide.to - slide.from);
  const shift = travel * clamp01((t - slide.from) / (slide.to - slide.from));
  const rowLeftEnd = SCREEN.w / 2 - rowW / 2; // centred once the slide ends
  const f = easeInOutCubic((t - fan.from) / (fan.to - fan.from));
  const [px, py] = SWATCH.pivot;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: out}}>
      {Array.from({length: count}, (_, i) => {
        // row: left edge x, bottom at the pivot's y; fan: the bottom centre on the pivot, turned
        const rowX = rowLeftEnd + travel - shift + i * (SWATCH.w + SWATCH.gap);
        const angle = ((i - (count - 1) / 2) / ((count - 1) / 2)) * SWATCH.fanDeg;
        const x = lerp(rowX, px - SWATCH.w / 2, f);
        const y = py - SWATCH.h;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: SWATCH.w, height: SWATCH.h, transformOrigin: '50% 100%', transform: `rotate(${angle * f}deg)`, zIndex: i}}>
            <WallpaperSwatch i={i} />
          </div>
        );
      })}
    </div>
  );
};

/** The v1 form (left frame of form-to-chat) as white hairlines, drawn 33.0-35.0; crossed out 35.0-35.5. */
const FORM_PATHS = (() => {
  const {x, y, w, h} = PHONE;
  const rows = [96, 150, 204, 258];
  const ds: string[] = [
    handRect(x, y, w, h, 2101, {radius: PHONE.r, overshoot: 2}),
    handLine(x + 18, y + 44, x + 90, y + 44.5, 2102),
    ...rows.flatMap((ry, i) => [handLine(x + 18, y + ry, x + 18 + 44 + (i % 3) * 14, y + ry + 0.4, 2110 + i), handRect(x + 18, y + ry + 9, w - 36, 26, 2120 + i, {radius: 5, overshoot: 2})]),
    handRect(x + 18, y + 312, w - 36, 30, 2130, {radius: 15, overshoot: 2}),
  ];
  return ds;
})();
const CROSS_D = handPath(
  [
    [PHONE.x - 14, PHONE.y + PHONE.h - 30],
    [PHONE.x + PHONE.w * 0.5, PHONE.y + PHONE.h * 0.46],
    [PHONE.x + PHONE.w + 16, PHONE.y + 22],
  ] as XY[],
  2140,
  {wobble: 0.5, smooth: 0.6},
);

const Form: React.FC<{t: number}> = ({t}) => {
  const {draw, crossOut, chatIn} = IN.form;
  if (t < draw.from || t >= chatIn.to) return null;
  const k = clamp01((t - draw.from) / (draw.to - draw.from));
  const c = clamp01((t - crossOut.from) / (crossOut.to - crossOut.from));
  const away = easeInOutCubic((t - chatIn.from) / (chatIn.to - chatIn.from));
  const each = 1 / FORM_PATHS.length;
  return (
    <svg width={SCREEN.w} height={SCREEN.h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', transform: `translateX(${-360 * away}px)`, opacity: 1 - away}}>
      {FORM_PATHS.map((d, i) => {
        const p = clamp01((k - i * each * 0.7) / (each * 1.6));
        return p > 0 ? <path key={i} d={d} fill="none" stroke={i < 1 ? HAIR : HAIR_SOFT} strokeWidth={i < 1 ? 1.4 : 1} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 1`} /> : null;
      })}
      {c > 0 ? (
        <>
          <path d={CROSS_D} fill="none" stroke={COLORS.accent} strokeOpacity={0.22} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={`${c} 1`} />
          <path d={CROSS_D} fill="none" stroke="#6E8BFF" strokeWidth={4.2} strokeLinecap="round" pathLength={1} strokeDasharray={`${c} 1`} />
        </>
      ) : null}
    </svg>
  );
};

const QUESTION = footageClip(IN.form.footage);
const EMERGENCY = footageClip(IN.largestText.footage);
const LARGEST = footageClip('emergency-largest-text');
const HOME = footageStill(IN.versions.footage);
const SWAP = 0.5; // the chat slides out as the emergency view slides in (37.7-38.2)

/** The real screens: the conversation (36.0-38.2), the emergency view (37.7-40.0), its largest text size (40.0-43.0). */
const Screens: React.FC<{t: number}> = ({t}) => {
  const {chatIn} = IN.form;
  const {card, snap} = IN.largestText;
  const swapFrom = card.from - SWAP * 0.6;
  const chatX = 600 * (1 - easeInOutCubic((t - chatIn.from) / (chatIn.to - chatIn.from))) - 600 * easeInOutCubic((t - swapFrom) / SWAP);
  const emX = 600 * (1 - easeInOutCubic((t - swapFrom) / SWAP));
  const pop = t >= snap ? 1 + 0.06 * (1 - easeOutCubic((t - snap) / 0.25)) : 1;
  const flash = t >= snap ? 0.35 * (1 - clamp01((t - snap) / 0.2)) : 0;
  return (
    <>
      {t >= chatIn.from && t < swapFrom + SWAP ? <ClipWindow source={QUESTION} start={chatIn.from} t={t} {...PHONE} style={{transform: `translateX(${chatX}px)`}} /> : null}
      {t >= swapFrom && t < snap ? <ClipWindow source={EMERGENCY} start={card.from} t={t} {...PHONE} style={{transform: `translateX(${emX}px)`}} /> : null}
      {t >= snap && t < IN.versions.flick.from ? (
        <>
          <ClipWindow source={LARGEST} start={snap} t={t} {...PHONE} style={{transform: `scale(${pop})`}} />
          {flash > 0 ? <div style={{position: 'absolute', left: PHONE.x, top: PHONE.y, width: PHONE.w, height: PHONE.h, borderRadius: PHONE.r, background: `rgba(245,247,250,${flash})`}} /> : null}
        </>
      ) : null}
    </>
  );
};

/** One imagined home-screen state as white hairlines (deterministic per index): header, a hero card, rows, a tab bar. */
const wireframe = (n: number): readonly {d: string; soft: boolean}[] => {
  const {x, y, w, h} = PHONE;
  const r = (k: number): number => ((n * 9301 + k * 49297) % 233280) / 233280;
  const out: {d: string; soft: boolean}[] = [{d: handRect(x, y, w, h, 3000 + n, {radius: PHONE.r, overshoot: 1.5}), soft: false}];
  const hero = 60 + r(1) * 70;
  let cy = y + 30;
  out.push({d: handLine(x + 14, cy, x + 14 + 40 + r(2) * 40, cy, 3100 + n), soft: false});
  if (r(3) > 0.4) out.push({d: handRect(x + w - 34, cy - 9, 18, 18, 3150 + n, {radius: 9}), soft: true});
  cy += 18;
  out.push({d: handRect(x + 12, cy, w - 24, hero, 3200 + n, {radius: 10 + r(4) * 6}), soft: false});
  if (r(5) > 0.3) out.push({d: handLine(x + 24, cy + 18, x + 24 + 50 + r(6) * 50, cy + 18, 3250 + n), soft: true});
  cy += hero + 12;
  const icons = r(7) > 0.45 ? 4 + Math.floor(r(8) * 2) : 0;
  if (icons) {
    const step = (w - 24) / icons;
    for (let i = 0; i < icons; i++) out.push({d: handRect(x + 12 + i * step + step / 2 - 10, cy, 20, 20, 3300 + n * 7 + i, {radius: 10}), soft: true});
    cy += 34;
  }
  const rows = 2 + Math.floor(r(9) * 4);
  for (let i = 0; i < rows && cy < y + h - 70; i++) {
    const rh = 22 + r(10 + i) * 22;
    out.push({d: handRect(x + 12, cy, w - 24, rh, 3400 + n * 11 + i, {radius: 6}), soft: true});
    cy += rh + 8;
  }
  out.push({d: handLine(x + 10, y + h - 40, x + w - 10, y + h - 40, 3500 + n), soft: true});
  for (let i = 0; i < 4 + (n % 2); i++) out.push({d: handRect(x + 18 + i * ((w - 36) / (4 + (n % 2))), y + h - 30, 12, 12, 3550 + n * 5 + i, {radius: 6}), soft: true});
  return out;
};
const WIREFRAME_COUNT = 30;

/** Version history, imagined: 30 drawn wireframes flick at 10/s (43.0-46.0) and settle on the real home (46.0). */
const Versions: React.FC<{t: number}> = ({t}) => {
  const {flick, perSecond, settle} = IN.versions;
  const frames = useMemo(() => Array.from({length: WIREFRAME_COUNT}, (_, i) => wireframe(i)), []);
  if (t < flick.from) return null;
  if (t >= settle) {
    const pop = 1 + 0.05 * (1 - easeOutCubic((t - settle) / 0.25));
    return <ClipWindow source={HOME} start={settle} t={t} {...PHONE} style={{transform: `scale(${pop})`}} />;
  }
  const n = Math.min(WIREFRAME_COUNT - 1, Math.floor((t - flick.from) * perSecond));
  const lines = frames[n] ?? [];
  return (
    <svg width={SCREEN.w} height={SCREEN.h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {lines.map((l, i) => (
        <path key={i} d={l.d} fill="none" stroke={l.soft ? HAIR_SOFT : HAIR} strokeWidth={l.soft ? 1 : 1.3} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
};

const DesignFile: React.FC<{t: number}> = ({t}) => {
  if (t < B.designFileIn.from) return null;
  const [x, y] = toRegion(SCREEN_TL);
  const inK = smooth((t - B.designFileIn.from) / 0.6);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: SCREEN.w, height: SCREEN.h, borderRadius: 6, overflow: 'hidden', background: SCREEN_BG, opacity: inK}}>
      <City t={t} />
      <Tokens t={t} />
      <Wallpapers t={t} />
      <Form t={t} />
      <Screens t={t} />
      <Versions t={t} />
    </div>
  );
};

// The laptop (draws 13.0-16.0; folds flat 53.0-55.0)

const LAPTOP_SOURCE = footageStill(IN.versions.footage); // the frame only: the design file is drawn by this chapter
const NEVER = 1e6;

const Laptop: React.FC<{t: number}> = ({t}) => {
  const {from, to} = B.fold;
  const mid = (from + to) / 2;
  const close = easeInOutCubic((t - from) / (mid - from)); // the lid closes onto the base 53.0-54.0
  const flatten = smooth((t - mid) / (to - mid)); // the drawing flattens to its outline 54.0-55.0
  const [lx, ly] = toRegion([LAPTOP.at[0] - LAPTOP.width / 2, LAPTOP.top]);
  const hinge = LAPTOP.lidH;
  const frame = <ScreenOnPaper device="laptop" source={LAPTOP_SOURCE} at={LAPTOP.at} scale={1} screenAspect={LAPTOP.aspect} drawStart={B.laptop.from} drawDuration={B.laptop.to - B.laptop.from} contentStart={NEVER} seed={61} />;
  if (t < from) {
    return (
      <>
        <DesignFile t={t} />
        {frame}
      </>
    );
  }
  // folding: the lid (and the screen with it) squashes onto the hinge line; the base stays
  const lidScale = Math.max(0.035, Math.cos((close * Math.PI) / 2));
  const clip = (top: boolean): React.CSSProperties => ({
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    clipPath: top ? `polygon(${lx - 40}px ${ly - 40}px, ${lx + LAPTOP.width + 40}px ${ly - 40}px, ${lx + LAPTOP.width + 40}px ${ly + hinge}px, ${lx - 40}px ${ly + hinge}px)` : `polygon(${lx - 40}px ${ly + hinge}px, ${lx + LAPTOP.width + 40}px ${ly + hinge}px, ${lx + LAPTOP.width + 40}px ${ly + LAPTOP.height + 40}px, ${lx - 40}px ${ly + LAPTOP.height + 40}px)`,
  });
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 2400, height: 2000, opacity: 1 - 0.45 * flatten}}>
      <div style={{...clip(true), transformOrigin: `0 ${ly + hinge}px`, transform: `scaleY(${lidScale})`}}>
        <DesignFile t={t} />
        {frame}
      </div>
      <div style={clip(false)}>{frame}</div>
    </div>
  );
};

// Layers

export const Art: React.FC = () => {
  const {t, camera} = useChapter('nameAndLook');
  const zoom = camera.zoom;
  return (
    <>
      <NamesSheet t={t} zoom={zoom} />
      <Laptop t={t} />
      <Word t={t} zoom={zoom} />
    </>
  );
};

/** The fifth super is the claims sheet's reword (B9: "dozens" cannot be verified). */
export const VERSIONS_SUPER = 'Many versions. One home screen.';
const supersInside = (tall: boolean): readonly SuperProps[] =>
  SUPERS.nameAndLook.map((s, i) => {
    // tall: below 0.74 H the frame shows paper, not the screen, so the glass type moves up into the screen
    const anchor = tall ? {screen: {x: 0.08, y: 0.735, align: 'left' as const}} : {screen: 'glass-lower-left' as const};
    const p = superFromBeat(s, anchor, tall ? {size: 40} : {});
    return i === SUPERS.nameAndLook.length - 1 ? {...p, text: VERSIONS_SUPER} : p;
  });

export const Overlay: React.FC = () => {
  const {isTall} = useChapter('nameAndLook');
  return (
    <>
      {supersInside(isTall).map((p) => (
        <Super key={p.start} {...p} />
      ))}
    </>
  );
};

export const Chapter: React.FC = () => <ChapterShell id="nameAndLook" art={<Art />} overlay={<Overlay />} />;

// for cues.ts
export const SUPERS_WIDE = supersInside(false);
