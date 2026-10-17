// CrumpleBall.tsx — a sheet carrying any SVG art crushes into an irregular paper ball, rolls a little and settles;
// UnfoldFromBall is the reverse (the ball opens flat into another drawing, its creases fading). BIBLE4 5.3.
// One flat SVG: every facet is a triangle of the mesh in crumpleMesh.ts, painted far-to-near with the art mapped onto
// it by an affine transform and clipped to it, then shaded from its 3D normal against the desk lamp. No canvas, no
// WebGL, no mix-blend-mode.
import React, {useId} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS} from '../../film';
import {DEFAULT_LAMP, lampTint, shade, shadowOffset, type Lamp} from '../../paper';
import {toLamp} from '../light';
import {dot, type Vec3} from '../math';
import {cross, crumpleMesh, posePoints, type BallTurn, type CrumpleMesh} from './crumpleMesh';

export const SHEET_PAPER = '#F8F4EA';
const BACK_PAPER = '#ECE5D5';
const DEFAULT_SEED = 'ball';
const DEFAULT_COLS = 8;
const DEFAULT_ROWS = 10;

/** One small roll of the ball after the crush: a move of (dx, dy) px over `dur` seconds. */
export type Roll = {readonly dx: number; readonly dy: number; readonly dur: number};

export const DEFAULT_ROLLS: readonly Roll[] = [
  {dx: 26, dy: 5, dur: 0.45},
  {dx: -10, dy: -2, dur: 0.35},
  {dx: 4, dy: 0, dur: 0.25},
];

/** Where the ball rests and how it is turned: hand this from a CrumpleBall to the UnfoldFromBall that follows it. */
export type BallRest = {readonly to: readonly [number, number]; readonly turns: readonly BallTurn[]};

type Shared = {
  /** Sheet size (the art is authored in this box). The ball sits relative to the box's centre. */
  readonly w: number;
  readonly h: number;
  /** Module-local seconds; defaults to frame / fps. */
  readonly time?: number;
  readonly start?: number;
  /** Seconds the crush (or the unfold) takes. Default 2. */
  readonly duration?: number;
  /** Ball radius, px. Default 0.3 x the sheet's shorter side. Use the same radius, seed, cols and rows on both sides of a hand-over. */
  readonly radius?: number;
  readonly seed?: string;
  readonly cols?: number;
  readonly rows?: number;
  readonly lamp?: Lamp;
  /** Sheet paper colour. */
  readonly paper?: string;
  /** SVG art in sheet coordinates (0..w, 0..h), e.g. paths or a <Drawing>. */
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
};

export type CrumpleBallProps = Shared & {
  /** Ball centre relative to the sheet centre, px (two sheets crushing into one ball share a point). Default [0, 0]. */
  readonly to?: readonly [number, number];
  /** Small rolls after the crush (they follow each other), then a settle. Default DEFAULT_ROLLS; [] = none. */
  readonly rolls?: readonly Roll[];
};

export type UnfoldFromBallProps = Shared & {
  /** The ball it starts as (crumpleRest(...) of the CrumpleBall before it). Default: centred, unrolled. */
  readonly from?: BallRest;
  /** Seconds the last creases take to fade once the sheet is flat. Default 1.2. */
  readonly creaseFade?: number;
};

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const easeInOut = (x: number): number => {
  const c = clamp01(x);
  return c < 0.5 ? 4 * c * c * c : 1 - (-2 * c + 2) ** 3 / 2;
};
const easeOut = (x: number): number => 1 - (1 - clamp01(x)) ** 3;
const unit = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

/** The crush itself turns the paper a little: a twist about the view axis and a tumble, both growing with the amount. */
const crushTurns = (amount: number): BallTurn[] => [
  {axis: [0, 0, 1], deg: 55 * amount},
  {axis: unit([1, 0.45, 0]), deg: 32 * amount},
];

const rollTurn = (d: readonly [number, number], radius: number): BallTurn[] => {
  const dist = Math.hypot(d[0], d[1]);
  if (dist < 1e-6) return [];
  // Rolling on the desk: the top moves with the ball, i.e. a turn about (z x motion).
  return [{axis: unit([-d[1], d[0], 0]), deg: (dist / radius) * (180 / Math.PI)}];
};

const SETTLE_HZ = 2.4;
const SETTLE_DECAY = 6;
const SETTLE_DEG = 5;

/** Ball offset and rotations at time `after` seconds past the end of the crush. */
const rollState = (after: number, rolls: readonly Roll[], to: readonly [number, number], radius: number): BallRest => {
  let x = 0;
  let y = 0;
  let clock = 0;
  let last: Roll | undefined;
  for (const r of rolls) {
    const k = easeOut((after - clock) / r.dur);
    x += r.dx * k;
    y += r.dy * k;
    clock += r.dur;
    last = r;
  }
  const turns = [...crushTurns(1), ...rollTurn([x, y], radius)];
  // The settle: the ball rocks back and forth on its dent and stops.
  const tau = after - clock;
  if (last && tau > 0) {
    const rock = SETTLE_DEG * Math.exp(-SETTLE_DECAY * tau) * Math.sin(2 * Math.PI * SETTLE_HZ * tau);
    turns.push({axis: unit([-last.dy, last.dx, 0]), deg: rock});
  }
  return {to: [to[0] + x, to[1] + y], turns};
};

/** Where a CrumpleBall comes to rest (pass it to UnfoldFromBall's `from` so the hand-over is seamless). */
export const crumpleRest = (p: Pick<CrumpleBallProps, 'w' | 'h' | 'radius' | 'to' | 'rolls'>): BallRest => {
  const radius = p.radius ?? Math.min(p.w, p.h) * 0.3;
  return rollState(1e3, p.rolls ?? DEFAULT_ROLLS, p.to ?? [0, 0], radius);
};

type Pt = readonly [number, number];

const hull = (pts: readonly Pt[]): Pt[] => {
  const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const side = (o: Pt, a: Pt, b: Pt): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Pt[] = [];
  for (const p of s) {
    while (lower.length >= 2 && side(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Pt[] = [];
  for (const p of [...s].reverse()) {
    while (upper.length >= 2 && side(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
};

const pts = (p: readonly Pt[]): string => p.map((q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`).join(' ');

type SheetProps = {
  readonly mesh: CrumpleMesh;
  readonly w: number;
  readonly h: number;
  readonly amount: number;
  /** 0..1 visibility of crease lines. */
  readonly crease: number;
  readonly radius: number;
  readonly rest: BallRest;
  readonly lamp: Lamp;
  readonly paper: string;
  readonly uid: string;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
};

/** The sheet at a given crush amount (0 = flat, 1 = ball). */
const CrumpleSheet: React.FC<SheetProps> = ({mesh, w, h, amount, crease, radius, rest, lamp, paper, uid, children, style}) => {
  const box: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: w, height: h, overflow: 'visible', ...style};
  const flat = amount <= 1e-3 && crease <= 1e-3;
  const P = flat ? [] : posePoints(mesh, {w, h, amount, radius, to: rest.to, turns: rest.turns});
  const outline: Pt[] = flat
    ? [
        [0, 0],
        [w, 0],
        [w, h],
        [0, h],
      ]
    : hull(P.map((p) => [p[0], p[1]] as const));
  const lift = 2 + radius * 0.85 * amount;
  const off = shadowOffset(lamp, lift * 0.55);
  const blur = 1.2 + amount * 5;
  const contact = shadowOffset(lamp, radius * 0.12 * amount);
  const cx = w / 2 + rest.to[0];
  const cy = h / 2 + rest.to[1];

  const shadow = (
    <>
      <filter id={`${uid}-blur`} filterUnits="userSpaceOnUse" x={-w} y={-h} width={w * 3} height={h * 3}>
        <feGaussianBlur stdDeviation={blur.toFixed(2)} />
      </filter>
      <g filter={`url(#${uid}-blur)`}>
        <polygon points={pts(outline)} transform={`translate(${off.x.toFixed(2)} ${off.y.toFixed(2)})`} fill={shade(0.2 * lamp.strength * (0.8 + amount * 0.5))} />
        {amount > 0.4 ? (
          <ellipse cx={cx + contact.x} cy={cy + contact.y + radius * 0.25} rx={radius * 0.72} ry={radius * 0.55} fill={shade(0.26 * lamp.strength * (amount - 0.4) * 1.6)} />
        ) : null}
      </g>
    </>
  );

  if (flat) {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={box}>
        {shadow}
        <rect x={0} y={0} width={w} height={h} fill={paper} />
        {children}
      </svg>
    );
  }

  const l = toLamp(lamp);
  const F = mesh.verts.map((v): Pt => [v.u * w, v.v * h]);
  const order = mesh.tris
    .map((t, i) => ({t, i, z: (P[t[0]]![2] + P[t[1]]![2] + P[t[2]]![2]) / 3}))
    .sort((a, b) => a.z - b.z || a.i - b.i);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={box}>
      <defs>
        <g id={`${uid}-art`}>{children}</g>
        {mesh.tris.map((t, i) => (
          <clipPath key={i} id={`${uid}-c${i}`} clipPathUnits="userSpaceOnUse">
            <polygon points={pts(t.map((k) => F[k]!))} />
          </clipPath>
        ))}
      </defs>
      {shadow}
      {order.map(({t, i}) => {
        const [a, b, c] = t.map((k) => P[k]!) as unknown as [Vec3, Vec3, Vec3];
        const [fa, fb, fc] = t.map((k) => F[k]!) as unknown as [Pt, Pt, Pt];
        const flatSign = Math.sign((fb[0] - fa[0]) * (fc[1] - fa[1]) - (fb[1] - fa[1]) * (fc[0] - fa[0])) || 1;
        const raw = cross([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [c[0] - a[0], c[1] - a[1], c[2] - a[2]]);
        const n = unit([raw[0] * flatSign, raw[1] * flatSign, raw[2] * flatSign]);
        const front = n[2] >= 0;
        const facing: Vec3 = front ? n : [-n[0], -n[1], -n[2]];
        const d = dot(facing, l) - l[2];
        const rim = (1 - Math.max(0, facing[2])) * 0.22 * amount;
        const light = d >= 0 ? lampTint(lamp, Math.min(0.34, d * 0.75)) : shade(Math.min(0.6, -d * 0.8 + rim));
        const screen: Pt[] = [
          [a[0], a[1]],
          [b[0], b[1]],
          [c[0], c[1]],
        ];
        // Affine map from the flat triangle (art space) to the screen triangle.
        const e1x = fb[0] - fa[0];
        const e1y = fb[1] - fa[1];
        const e2x = fc[0] - fa[0];
        const e2y = fc[1] - fa[1];
        const det = e1x * e2y - e2x * e1y;
        const s1x = b[0] - a[0];
        const s1y = b[1] - a[1];
        const s2x = c[0] - a[0];
        const s2y = c[1] - a[1];
        const ma = (s1x * e2y - s2x * e1y) / det;
        const mc = (s2x * e1x - s1x * e2x) / det;
        const mb = (s1y * e2y - s2y * e1y) / det;
        const md = (s2y * e1x - s1y * e2x) / det;
        const me = a[0] - ma * fa[0] - mc * fa[1];
        const mf = a[1] - mb * fa[0] - md * fa[1];
        const creaseAlpha = crease * (0.16 + 0.22 * ((i * 0.618) % 1));
        return (
          <g key={i}>
            <polygon points={pts(screen)} fill={front ? paper : BACK_PAPER} stroke={front ? paper : BACK_PAPER} strokeWidth={0.7} strokeLinejoin="round" />
            {front ? (
              <g transform={`matrix(${[ma, mb, mc, md, me, mf].map((v) => v.toFixed(5)).join(' ')})`}>
                <g clipPath={`url(#${uid}-c${i})`}>
                  <use href={`#${uid}-art`} />
                </g>
              </g>
            ) : null}
            <polygon
              points={pts(screen)}
              fill={light}
              stroke={COLORS.graphite}
              strokeOpacity={creaseAlpha}
              strokeWidth={0.8}
              strokeLinejoin="round"
            />
            {d >= 0 && rim > 0.01 ? <polygon points={pts(screen)} fill={shade(rim)} /> : null}
          </g>
        );
      })}
      {amount > 0.55 ? (
        <polygon points={pts(outline)} fill="none" stroke={COLORS.graphite} strokeOpacity={0.4 * (amount - 0.55) / 0.45} strokeWidth={1.4} strokeLinejoin="round" />
      ) : null}
    </svg>
  );
};

const useUid = (seed: string): string => `cb${useId().replace(/[^a-zA-Z0-9]/g, '')}${seed.replace(/[^a-zA-Z0-9]/g, '')}`;

const useTime = (time: number | undefined): number => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return time ?? frame / fps;
};

/** A sheet (any SVG art) crushes into a ball, rolls a little and settles. */
export const CrumpleBall: React.FC<CrumpleBallProps> = (p) => {
  const t = useTime(p.time);
  const seed = p.seed ?? DEFAULT_SEED;
  const uid = useUid(seed);
  const start = p.start ?? 0;
  const duration = p.duration ?? 2;
  const radius = p.radius ?? Math.min(p.w, p.h) * 0.3;
  const to = p.to ?? [0, 0];
  const amount = easeInOut((t - start) / duration);
  const after = t - start - duration;
  const rest: BallRest = after > 0 ? rollState(after, p.rolls ?? DEFAULT_ROLLS, to, radius) : {to, turns: crushTurns(amount)};
  const mesh = crumpleMesh({seed, cols: p.cols ?? DEFAULT_COLS, rows: p.rows ?? DEFAULT_ROWS});
  return (
    <div style={{position: 'relative', width: p.w, height: p.h, ...p.style}}>
      <CrumpleSheet mesh={mesh} w={p.w} h={p.h} amount={amount} crease={Math.min(1, amount * 2.2)} radius={radius} rest={rest} lamp={p.lamp ?? DEFAULT_LAMP} paper={p.paper ?? SHEET_PAPER} uid={uid}>
        {p.children}
      </CrumpleSheet>
    </div>
  );
};

/** A ball opens flat into a drawing (any SVG art); the creases linger and fade once it lies flat. */
export const UnfoldFromBall: React.FC<UnfoldFromBallProps> = (p) => {
  const t = useTime(p.time);
  const seed = p.seed ?? DEFAULT_SEED;
  const uid = useUid(seed);
  const start = p.start ?? 0;
  const duration = p.duration ?? 2;
  const radius = p.radius ?? Math.min(p.w, p.h) * 0.3;
  const rest = p.from ?? {to: [0, 0] as const, turns: crushTurns(1)};
  const amount = 1 - easeInOut((t - start) / duration);
  const residual = 0.45 * clamp01(1 - (t - start - duration) / (p.creaseFade ?? 1.2));
  const crease = Math.max(Math.min(1, amount * 2.2), residual);
  const mesh = crumpleMesh({seed, cols: p.cols ?? DEFAULT_COLS, rows: p.rows ?? DEFAULT_ROWS});
  return (
    <div style={{position: 'relative', width: p.w, height: p.h, ...p.style}}>
      <CrumpleSheet mesh={mesh} w={p.w} h={p.h} amount={amount} crease={crease} radius={radius} rest={rest} lamp={p.lamp ?? DEFAULT_LAMP} paper={p.paper ?? SHEET_PAPER} uid={uid}>
        {p.children}
      </CrumpleSheet>
    </div>
  );
};
