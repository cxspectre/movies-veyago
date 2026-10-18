// Thumb.tsx — the publish kit's thumbnails and covers (docs/v4/PUBLISH.md). Drawn from the film's own parts: the paper
// colour, the hand-drawn path engine (src/paper handPath), the graphite pencil of the desk, the village wallpaper colours
// and the end card's type (DM Sans 700 title). Heavier pencil than the film (about 14 px) so it still reads at 160 px wide.
// The only words are the title "Provisum 2" (CLAIMS G2/G38); no first-app name, no Apple logo, no app screens.
import React from 'react';
import {COLORS, FONTS} from '../film';
import {HOUSE_WALLPAPER} from '../beats4';
import {Pencil} from '../desk';
import {handPath} from '../paper';
import type {XY} from '../paper';
import type {PreviewSpec} from '../previewTypes';

export type ThumbVariant = 'a' | 'b' | 'c';
type Dim = {w: number; h: number; tall: boolean};
const WIDE: Dim = {w: 1280, h: 720, tall: false};
const TALL: Dim = {w: 1080, h: 1920, tall: true};

const PENCIL_W = 14;
const ACCENT = COLORS.accent;
const INK = COLORS.graphite;

const Stroke: React.FC<{pts: readonly XY[]; seed: number; width?: number; color?: string; closed?: boolean; fill?: string; wobble?: number; smooth?: number}> = ({pts, seed, width = PENCIL_W, color = INK, closed, fill = 'none', wobble = 2.5, smooth}) => (
  <path d={handPath(pts, seed, {wobble, closed, smooth})} fill={fill} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
);

/** Paper with the one-sided lamp falling off to the edges: the film's paper colour, flat, no texture file needed. */
const PaperBg: React.FC<Dim> = ({w, h}) => (
  <>
    <rect width={w} height={h} fill={COLORS.paper} />
    <rect width={w} height={h} fill="url(#lamp)" />
  </>
);

const Defs: React.FC<Dim> = ({w, h}) => (
  <defs>
    <radialGradient id="lamp" cx="38%" cy="32%" r="85%">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.45} />
      <stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0} />
      <stop offset="1" stopColor={COLORS.paperShade} stopOpacity={0.9} />
    </radialGradient>
    <clipPath id="frame"><rect width={w} height={h} /></clipPath>
  </defs>
);

/** "Provisum 2" in the end card's type (DM Sans 700, -0.02em). */
const Title: React.FC<{x: number; y: number; size: number; anchor?: 'start' | 'middle'}> = ({x, y, size, anchor = 'middle'}) => (
  <text x={x} y={y} textAnchor={anchor} fill={INK} fontFamily={FONTS.super} fontWeight={700} fontSize={size} letterSpacing="-0.02em">
    Provisum 2
  </text>
);

/** One pencil line that wanders and loops, the way chapter 1's line does. `rise` shifts it. */
const wander = (d: Dim, y0: number, amp: number): XY[] => {
  const n = 9;
  return Array.from({length: n}, (_, i) => [(i / (n - 1)) * d.w * 1.02 - d.w * 0.01, y0 + Math.sin(i * 1.55 + 0.4) * amp + (i % 2 ? -amp * 0.25 : amp * 0.2)] as XY);
};

/** A gabled house in front elevation with a lit window, as chapter 2's net draws it. */
const House: React.FC<{x: number; y: number; w: number; h: number; seed: number; wall?: string; lit?: boolean; width?: number}> = ({x, y, w, h, seed, wall, lit, width = PENCIL_W}) => {
  const roofH = h * 0.38;
  const body: XY[] = [[x, y + roofH], [x + w / 2, y], [x + w, y + roofH], [x + w, y + h], [x, y + h], [x, y + roofH]];
  return (
    <g>
      {wall ? <path d={`M ${x} ${y + roofH} L ${x + w / 2} ${y} L ${x + w} ${y + roofH} L ${x + w} ${y + h} L ${x} ${y + h} Z`} fill={wall} opacity={0.85} /> : null}
      <Stroke pts={body} seed={seed} width={width} wobble={2.5} smooth={0.12} />
      <rect x={x + w * 0.2} y={y + roofH + h * 0.12} width={w * 0.24} height={h * 0.24} fill={lit ? '#FFE9A8' : 'none'} />
      <Stroke pts={[[x + w * 0.2, y + roofH + h * 0.12], [x + w * 0.44, y + roofH + h * 0.12], [x + w * 0.44, y + roofH + h * 0.36], [x + w * 0.2, y + roofH + h * 0.36]]} seed={seed + 1} width={width * 0.6} closed wobble={1.2} smooth={0.1} />
      <Stroke pts={[[x + w * 0.62, y + h], [x + w * 0.62, y + roofH + h * 0.2], [x + w * 0.82, y + roofH + h * 0.2], [x + w * 0.82, y + h]]} seed={seed + 2} width={width * 0.6} wobble={1.2} smooth={0.1} />
    </g>
  );
};

/** a: the pencil line. One long line across the paper, a graphite pencil setting it down, the title. */
const ArtA: React.FC<Dim> = (d) => {
  const y0 = d.tall ? d.h * 0.2 : d.h * 0.2;
  const line = wander(d, y0, d.tall ? 70 : 46);
  const tip: XY = [d.w * (d.tall ? 0.4 : 0.66), d.tall ? d.h * 0.2 + 110 : d.h * 0.2 + 70];
  const ts = d.tall ? 190 : 200;
  return (
    <>
      <Stroke pts={line} seed={11} width={PENCIL_W + 2} />
      <Stroke pts={[[d.w * 0.06, d.h * 0.88], [d.w * 0.3, d.h * 0.9], [d.w * 0.6, d.h * 0.875], [d.w * 0.94, d.h * 0.9]]} seed={14} width={PENCIL_W - 4} color={ACCENT} />
      <Pencil kind="graphite" x={tip[0]} y={tip[1]} yaw={d.tall ? -35 : -28} pxPerMm={d.tall ? 3.4 : 4.4} shadow="lying" />
      <Title x={d.w / 2} y={d.tall ? d.h * 0.5 : d.h * 0.69} size={ts} />
    </>
  );
};

/** b: Maya's house with one window lit, and the line that drew it still trailing off the roof. */
const ArtB: React.FC<Dim> = (d) => {
  const hw = d.tall ? 700 : 560;
  const hh = d.tall ? 600 : 440;
  const x = d.tall ? (d.w - hw) / 2 : d.w * 0.5 - hw / 2 + 120;
  const y = d.tall ? d.h * 0.2 : d.h * 0.1;
  return (
    <>
      <Stroke pts={[[0, y + hh + 20], [x - 40, y + hh * 0.9], [x - 10, y + hh]]} seed={21} width={PENCIL_W - 2} wobble={4} />
      <House x={x} y={y} w={hw} h={hh} seed={22} wall={HOUSE_WALLPAPER.Maya?.hex} lit />
      <Stroke pts={[[x + hw * 0.7, y + hh * 0.06], [x + hw * 0.7, y - 90], [x + hw * 0.55, y - 120]]} seed={25} width={PENCIL_W - 4} color={ACCENT} />
      <Stroke pts={[[x - 60, y + hh + 10], [x + hw + 80, y + hh + 6]]} seed={26} width={PENCIL_W - 2} />
      {d.tall ? <Title x={d.w / 2} y={d.h * 0.63} size={190} /> : <Title x={d.w * 0.04} y={d.h * 0.93} size={150} anchor="start" />}
    </>
  );
};

/** c: the village. Seven houses in the leading wallpaper colours, one line joining them, the title below. */
const ArtC: React.FC<Dim> = (d) => {
  const names = ['Dad', 'Leo', 'Mia', 'Maya', 'Jonas', 'Biscuit', 'Sam'] as const;
  const cols = d.tall ? 2 : 4;
  const cw = d.tall ? 400 : 255;
  const ch = d.tall ? 290 : 185;
  const gx = d.tall ? 70 : 54;
  const gy = d.tall ? 90 : 56;
  const rows = Math.ceil(names.length / cols);
  const gridW = cols * cw + (cols - 1) * gx;
  const top = d.tall ? d.h * 0.1 : d.h * 0.07;
  const left = (d.w - gridW) / 2;
  const at = (i: number) => ({x: left + (i % cols) * (cw + gx) + (rows > 1 && Math.floor(i / cols) === rows - 1 && names.length % cols ? ((cols - (names.length % cols)) * (cw + gx)) / 2 : 0), y: top + Math.floor(i / cols) * (ch + gy)});
  const titleY = d.tall ? d.h * 0.945 : d.h * 0.93;
  return (
    <>
            {names.map((n, i) => (
        <House key={n} x={at(i).x} y={at(i).y} w={cw} h={ch} seed={40 + i * 5} wall={HOUSE_WALLPAPER[n]?.hex} width={PENCIL_W - 3} lit={n === 'Maya'} />
      ))}
      <Stroke pts={[[d.w * 0.06, titleY - (d.tall ? 200 : 140)], [d.w * 0.5, titleY - (d.tall ? 190 : 134)], [d.w * 0.94, titleY - (d.tall ? 200 : 140)]]} seed={33} width={PENCIL_W - 6} color={ACCENT} wobble={3} />
      <Title x={d.w / 2} y={titleY} size={d.tall ? 190 : 150} />
    </>
  );
};

const ARTS: Record<ThumbVariant, React.FC<Dim>> = {a: ArtA, b: ArtB, c: ArtC};

export const Thumb: React.FC<{variant: ThumbVariant; tall?: boolean}> = ({variant, tall = false}) => {
  const d = tall ? TALL : WIDE;
  const Art = ARTS[variant];
  return (
    <svg width={d.w} height={d.h} viewBox={`0 0 ${d.w} ${d.h}`} style={{display: 'block', background: COLORS.paper}}>
      <Defs {...d} />
      <PaperBg {...d} />
      <g clipPath="url(#frame)"><Art {...d} /></g>
    </svg>
  );
};

const VARIANTS: readonly ThumbVariant[] = ['a', 'b', 'c'];

/** `Thumb-wide-a|b|c` (1280x720) and `Cover-tall-a|b|c` (1080x1920): single-frame stills. */
export const thumbPreviews: readonly PreviewSpec[] = [
  ...VARIANTS.map((v) => ({id: `Thumb-wide-${v}`, component: () => React.createElement(Thumb, {variant: v}), durationInFrames: 1, width: WIDE.w, height: WIDE.h})),
  ...VARIANTS.map((v) => ({id: `Cover-tall-${v}`, component: () => React.createElement(Thumb, {variant: v, tall: true}), durationInFrames: 1, width: TALL.w, height: TALL.h})),
];
