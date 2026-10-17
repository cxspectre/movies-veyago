// Chapter.tsx — chapter 9, "The village" (6:55-8:10, local 0-75; BIBLE4 §5.9, script §9).
// The camera pulls back from Dad's house (chapter 8's small house) and the village pops up around it; dotted string
// joins the seven binders, across the paper sea to Sam's flat at Lisbon; nine visits open a front wall each; the rise
// shows Europe on chapter 8's map (circles, "112", "A4", five bubbles); a form on the green is crossed out and one
// question appears. Everything sits INSIDE chapter 8's map at the nested scale 0.25 (BIBLE4 §1.1, §8.2).
import React, {useMemo} from 'react';
import {SUPERS, village} from '../../beats4';
import {COLORS} from '../../film';
import {ChapterShell, Super, superFromBeat, useChapter} from '../../kit';
import {LineCharacter, type CharacterId, type PoseId} from '../../characters';
import {PencilCanvas, handCircle, measureHand, type XY} from '../../paper';
import {bubblePath} from '../../sketches/speech-bubbles/bubble';
import type {Point} from '../../sheet4';
import {DadWindow, VillageHouse} from '../launch/houseArt';
import {VILLAGE_ORIGIN} from '../launch/mapGeometry';
import {
  BUBBLE_FROM,
  BUBBLE_RISE,
  COUNTRIES,
  GREEN,
  HOUSES,
  MARGIN_AT,
  NEST,
  STRING_ROUTE,
  SUPER_FIVE_AT,
  VISIT,
  VISIT_PLANS,
  closeAt,
  frontKeys,
  dims,
  house,
  toRegion,
  type VisitPlan,
} from './layout';
import {FORM, chatBubbleBox, chatPage, formPage, handPage, interiorPage, type Page} from './pages';

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const smooth = (x: number): number => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};

/** An engine page placed on the sheet: `at` is its top-left in SHEET px, `scale` sheet px per page px. */
const NestedPage: React.FC<{page: Page; at: Point; scale: number; progress: number; zoom: number; opacity?: number}> = ({page, at, scale, progress, zoom, opacity = 1}) => {
  if (opacity <= 0.002) return null;
  const [x, y] = toRegion(at);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: page.width, height: page.height, transform: `scale(${scale})`, transformOrigin: '0 0', opacity}}>
      <PencilCanvas marks={page.marks} progress={progress} width={page.width} height={page.height} zoom={zoom * scale} style={{left: 0, top: 0}} />
    </div>
  );
};

/** A region-local SVG layer (draws outside the region box too: Sam, Europe, the margin). */
const Layer: React.FC<{children: React.ReactNode; opacity?: number}> = ({children, opacity = 1}) => (
  <svg style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible', opacity}}>{children}</svg>
);

// The dotted string (10.5-13.0)

const catmull = (pts: readonly Point[], step: number): readonly Point[] => {
  const out: Point[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)] as Point;
    const p1 = pts[i] as Point;
    const p2 = pts[i + 1] as Point;
    const p3 = pts[Math.min(pts.length - 1, i + 2)] as Point;
    const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 2));
    for (let k = 0; k < n; k++) {
      const u = k / n;
      const u2 = u * u;
      const u3 = u2 * u;
      const f = (a: number, b: number, c: number, d: number): number => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1] as Point);
  // resample to dots `step` apart
  const dots: Point[] = [out[0] as Point];
  let carry = 0;
  for (let i = 1; i < out.length; i++) {
    const a = out[i - 1] as Point;
    const b = out[i] as Point;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let d = step - carry;
    while (d <= len) {
      dots.push([a[0] + ((b[0] - a[0]) * d) / len, a[1] + ((b[1] - a[1]) * d) / len]);
      d += step;
    }
    carry = len - (d - step);
  }
  return dots;
};

const STRING_DOTS = catmull(STRING_ROUTE.map(toRegion), 7);

const StringDots: React.FC<{t: number}> = ({t}) => {
  const k = clamp01((t - village.string.from) / (village.string.to - village.string.from));
  if (k <= 0) return null;
  const shown = Math.floor(STRING_DOTS.length * k);
  return (
    <Layer opacity={0.85}>
      {STRING_DOTS.slice(0, shown).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.05 + ((i * 7) % 3) * 0.12} fill={COLORS.accent} />
      ))}
    </Layer>
  );
};

// The visits (13.0-50.0)

const visitEnd = (i: number): number => {
  const v = VISIT_PLANS[i] as VisitPlan;
  return closeAt(i) ?? v.open + VISIT.holdSeconds;
};

/** Where the margin note goes: beside the house on the roomier side (wide), above it (tall, the frame is narrow). */
const notePlacement = (v: VisitPlan, tall: boolean): {at: (w: number, h: number) => Point; maxWidth: number} => {
  const h = house(v.house);
  const d = dims(h);
  const half = tall ? [108, 192] : [192, 108];
  const left = h.centre[0] - h.width / 2;
  const right = h.centre[0] + h.width / 2;
  if (tall) {
    const top = h.centre[1] - d.depth * 0.46 - d.wall * 0.41 - d.roof * 0.5 - 6;
    const maxWidth = Math.min(h.width, 2 * (half[0] as number) - 40);
    const edge = 12;
    return {maxWidth, at: (w, hgt) => [Math.min(v.centre[0] + (half[0] as number) - edge - w, Math.max(v.centre[0] - (half[0] as number) + edge, v.centre[0] - w / 2)), top - hgt]};
  }
  const roomL = left - (v.centre[0] - (half[0] as number));
  const roomR = v.centre[0] + (half[0] as number) - right;
  const maxWidth = Math.max(roomL, roomR) - 10;
  const y = h.centre[1] - d.depth * 0.5 - 6;
  return {maxWidth, at: (w) => (roomR >= roomL ? [right + 4, y] : [left - 4 - w, y])};
};

/** Margin notes: Caveat 500, 44 screen px at z 5 = 8.8 sheet px = 35 page px at the nested scale. */
const NOTE_SIZE = 44 / 5 / NEST;

const VisitNote: React.FC<{v: VisitPlan; t: number; zoom: number; tall: boolean; opacity: number}> = ({v, t, zoom, tall, opacity}) => {
  const place = notePlacement(v, tall);
  const page = useMemo(
    () => handPage(`note-${v.n}`, v.note, {size: NOTE_SIZE, face: 'caveat-500', ink: 'accent', maxWidth: (place.maxWidth * 0.85) / NEST, rotate: -1.5}),
    [v.n, v.note, place.maxWidth],
  );
  const from = v.open + VISIT.noteAfter;
  if (t < from) return null;
  const at = place.at(page.width * NEST, page.height * NEST);
  return <NestedPage page={page} at={at} scale={NEST} progress={clamp01(t - from)} zoom={zoom} opacity={opacity} />;
};

/** People who carry a beat are drawn 1.3x the nested scale so the faces read. */
const PERSON = NEST * 1.3;

/** The interior page scale: the v1 page at 0.16 (BIBLE4 §5.9), smaller where the house is smaller. */
const interiorScale = (v: VisitPlan): number => {
  const h = house(v.house);
  const d = dims(h);
  return Math.min(0.16, (0.92 * h.width) / 1200, (0.95 * d.depth) / 850);
};

const Visit: React.FC<{i: number; t: number; zoom: number; tall: boolean}> = ({i, t, zoom, tall}) => {
  const v = VISIT_PLANS[i] as VisitPlan;
  const end = visitEnd(i);
  if (t < v.open || t > end + 0.45) return null;
  const opacity = 1 - smooth((t - end) / 0.4);
  const h = house(v.house);
  const d = dims(h);
  const s = interiorScale(v);
  const page = interiorPage(v.interior);
  const pw = page.width * s;
  const ph = page.height * s;
  // the page lies on the floor, centred on the visit's camera x (clamped inside the house)
  const px = Math.min(h.centre[0] + h.width / 2 - pw, Math.max(h.centre[0] - h.width / 2, v.centre[0] - pw / 2));
  const py = h.centre[1] - ph / 2 - d.depth * 0.08;
  const [mx, my] = toRegion([h.centre[0] - h.width * 0.36, h.centre[1] + d.depth * 0.5 + 6]);
  const residentY = h.centre[1] + d.depth * 0.32;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity}}>
      <NestedPage page={page} at={[px, py]} scale={s} progress={clamp01((t - v.open) / VISIT.drawSeconds)} zoom={zoom} />
      {v.residents.map((r) => {
        const [x, y] = toRegion([h.centre[0] + r.dx * h.width, residentY]);
        return (
          <LineCharacter
            key={r.character}
            character={r.character as CharacterId}
            pose={r.pose as PoseId}
            scale={PERSON}
            x={x}
            y={y}
            progress={clamp01((t - v.open) / 0.5)}
            zoom={zoom}
          />
        );
      })}
      {t >= v.open + VISIT.mayaAfter ? (
        <LineCharacter character="maya" pose="doorway" scale={PERSON} x={mx} y={my} progress={clamp01((t - v.open - VISIT.mayaAfter) / 0.5)} zoom={zoom} />
      ) : null}
      <VisitNote v={v} t={t} zoom={zoom} tall={tall} opacity={1} />
    </div>
  );
};

// The rise (50-63)

const Countries: React.FC<{t: number}> = ({t}) => {
  const {from, to} = village.countries;
  if (t < from) return null;
  const each = (to - from) / COUNTRIES.length;
  return (
    <Layer>
      {COUNTRIES.map((c, i) => {
        const k = clamp01((t - from - i * each) / each);
        if (k <= 0) return null;
        const [x, y] = toRegion(c.at);
        const d = handCircle(x, y, c.r * 1.05, c.r * 0.95, 1200 + i, {overlap: 0.12});
        return (
          <g key={c.id}>
            <path d={d} fill="none" stroke={COLORS.accent} strokeWidth={5.4} strokeOpacity={0.14} strokeLinecap="round" pathLength={1} strokeDasharray={`${k} 1`} />
            <path d={d} fill="none" stroke={COLORS.accent} strokeWidth={2.8} strokeOpacity={0.9} strokeLinecap="round" pathLength={1} strokeDasharray={`${k} 1`} />
          </g>
        );
      })}
    </Layer>
  );
};

/** "112" and "A4": Caveat 700 accent, 56 screen px at z 0.9 = 62 sheet px (pages at sheet scale). */
const MARGIN_SIZE = 62;
const MARGIN_PAGES = village.margin.labels.map((text) => handPage(`margin-${text}`, text, {size: MARGIN_SIZE, face: 'caveat-700', ink: 'accent', rotate: -6}));

const MarginLabels: React.FC<{t: number; zoom: number; tall: boolean}> = ({t, zoom, tall}) => {
  const {from, to} = village.margin;
  const each = (to - from) / MARGIN_PAGES.length;
  const pts = MARGIN_AT[tall ? 'tall' : 'wide'];
  return (
    <>
      {MARGIN_PAGES.map((p, i) => {
        const start = from + i * each;
        const at = pts[i] as Point;
        if (t < start) return null;
        const pad = MARGIN_SIZE * 0.5;
        return <NestedPage key={i} page={p} at={[at[0] - pad, at[1] - pad - MARGIN_SIZE * 0.95]} scale={1} progress={clamp01((t - start) / each)} zoom={zoom} />;
      })}
    </>
  );
};

/** Five bubbles: Patrick Hand 36 screen px at z 0.9 = 40 sheet px; each rises 60 sheet px over 2.0 s. */
const BUBBLE_TYPE = 52;
const BUBBLE_OUT = {from: 62.0, to: 62.5};

const Bubbles: React.FC<{t: number}> = ({t}) => {
  const shapes = useMemo(
    () =>
      village.bubbles.map((b, i) => {
        const from = BUBBLE_FROM[i];
        if (!from) throw new Error(`village: no bubble origin ${i}`);
        const [x, y] = toRegion(from.at);
        const w = measureHand(b.text, BUBBLE_TYPE, 'patrick-400') + 44;
        const box = {x0: x - w / 2, y0: y - 40, x1: x + w / 2, y1: y + 40};
        const shape = bubblePath(box, {radius: 28, tail: 26, tailHalfBase: 11, toward: [x - 40, y + 300] as XY, seed: 1300 + i * 7});
        return {...b, x, y, shape};
      }),
    [],
  );
  const out = 1 - smooth((t - BUBBLE_OUT.from) / (BUBBLE_OUT.to - BUBBLE_OUT.from));
  return (
    <Layer opacity={out}>
      {shapes.map((b) => {
        if (t < b.at) return null;
        const k = clamp01((t - b.at) / 2.0);
        const rise = BUBBLE_RISE * (1 - Math.pow(1 - k, 3));
        const a = smooth((t - b.at) / 0.3);
        return (
          <g key={b.text} transform={`translate(0 ${-rise})`} opacity={a}>
            <path d={b.shape.d} fill="rgba(243,238,227,0.9)" stroke={COLORS.graphite} strokeWidth={2.2} strokeOpacity={0.85} strokeLinecap="round" strokeLinejoin="round" />
            <text x={b.x} y={b.y + BUBBLE_TYPE * 0.33} textAnchor="middle" fontSize={BUBBLE_TYPE} fill={COLORS.graphite} style={{fontFamily: 'Patrick Hand'}}>
              {b.text}
            </text>
          </g>
        );
      })}
    </Layer>
  );
};

// The green (63-75)

const CHAT_BOX = chatBubbleBox(village.green.question);
const CHAT_PAGE = chatPage(village.green.question, village.green.chips);
const FORM_CENTRE: Point = [GREEN.form[0] - 15, GREEN.form[1]];

const Green: React.FC<{t: number; zoom: number; tall: boolean}> = ({t, zoom, tall}) => {
  const {form, crossOut, bubble} = village.green;
  if (t < form.from) return null;
  // the form draws 65-67 (to FORM.crossFrom), the cross-out 67.5-68 (the rest)
  const p =
    t < crossOut.from
      ? FORM.crossFrom * clamp01((t - form.from) / (form.to - form.from))
      : FORM.crossFrom + (1 - FORM.crossFrom) * clamp01((t - crossOut.from) / (crossOut.to - crossOut.from));
  const fw = FORM.w * NEST;
  const fh = FORM.h * NEST;
  // wide: beside the form; tall: the 270 sheet px column has no room beside it, so under it, centred
  const chatAt: Point = tall
    ? [FORM_CENTRE[0] - (CHAT_PAGE.width * NEST) / 2, FORM_CENTRE[1] + fh / 2 + 6]
    : [FORM_CENTRE[0] + fw / 2 + 4, GREEN.bubble[1] - CHAT_PAGE.height * NEST * 0.62];
  return (
    <>
      <NestedPage page={formPage} at={[FORM_CENTRE[0] - fw / 2, FORM_CENTRE[1] - fh / 2]} scale={NEST} progress={p} zoom={zoom} />
      {t >= bubble.from ? (
        <div
          style={{
            position: 'absolute',
            left: toRegion(chatAt)[0] + CHAT_BOX.x0 * NEST - 8,
            top: toRegion(chatAt)[1] + CHAT_BOX.y0 * NEST - 8,
            width: (CHAT_BOX.x1 - CHAT_BOX.x0) * NEST + 16,
            height: (CHAT_BOX.y1 - CHAT_BOX.y0) * NEST + 16,
            borderRadius: 14,
            background: 'rgba(243,238,227,0.96)',
            opacity: smooth((t - bubble.from) / 0.4),
          }}
        />
      ) : null}
      {t >= bubble.from ? <NestedPage page={CHAT_PAGE} at={chatAt} scale={NEST} progress={clamp01((t - bubble.from) / (bubble.to - bubble.from))} zoom={zoom} /> : null}
    </>
  );
};

// Layers

export const Art: React.FC = () => {
  const {t, camera, isTall} = useChapter('village');
  const zoom = camera.zoom;
  return (
    <>
      <StringDots t={t} />
      {HOUSES.map((h) => (
        <VillageHouse key={h.id} h={h} t={t} frontKeys={frontKeys} />
      ))}
      {/* chapter 8's lit window carries over, then dims as the village pops up around it */}
      <DadWindow origin={VILLAGE_ORIGIN} lit={1 - smooth((t - 3.0) / 2.0)} maya={1} zoom={zoom} />
      {VISIT_PLANS.map((v, i) => (
        <Visit key={v.n} i={i} t={t} zoom={zoom} tall={isTall} />
      ))}
      <Countries t={t} />
      <MarginLabels t={t} zoom={zoom} tall={isTall} />
      <Bubbles t={t} />
      <Super {...superFromBeat(SUPERS.village[1] as (typeof SUPERS.village)[number], {sheet: SUPER_FIVE_AT, align: 'centre'}, {size: 62})} />
      <Green t={t} zoom={zoom} tall={isTall} />
    </>
  );
};

/** "Version 2: a binder for everyone you call family." is written in screen space: at 0-3 s the camera is at z 4 and
 *  the bible's sheet position (baseline y 2950) is above the frame until 10 s; on paper at 56 screen px it would be
 *  2 400 px wide. */
export const Overlay: React.FC = () => {
  const {t, isTall} = useChapter('village');
  const beat = SUPERS.village[0] as (typeof SUPERS.village)[number];
  // a paper tint behind the line, so it does not fight the nameplates under it
  const a = smooth(t / 0.5) * (1 - smooth((t - (beat.t + beat.dur)) / 0.5));
  const box = isTall
    ? {left: '5%', width: '90%', top: '64.5%', height: '16%'}
    : {left: '12%', width: '76%', top: '70%', height: '13%'};
  return (
    <>
      <div style={{position: 'absolute', ...box, borderRadius: 28, background: 'rgba(243,238,227,0.94)', opacity: a}} />
      <Super {...superFromBeat(beat, {screen: 'super'})} />
    </>
  );
};

export const Chapter: React.FC = () => <ChapterShell id="village" art={<Art />} overlay={<Overlay />} />;
