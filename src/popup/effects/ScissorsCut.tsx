// ScissorsCut.tsx — drawn paper scissors enter, snip along a path and cut a drawing in two; the halves slide apart,
// one gets a written label ("keep"), the other fades and blurs away (BIBLE4 5.3, 20.0-27.0). Each half is a piece of
// paper with its own lamp shadow. SVG plus CSS opacity/blur filters; no mix-blend-mode.
import React, {useId} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS} from '../../film';
import {DEFAULT_LAMP, handCircle, handPath, shade, shadowOffset, type Lamp, type XY} from '../../paper';
import {Ink} from '../art';
import {SHEET_PAPER} from './CrumpleBall';

export type Half = {
  /** Where this half slides to, px. */
  readonly dx: number;
  readonly dy?: number;
  /** A word written in accent above the half once it has slid (e.g. "keep"). */
  readonly label?: string;
  /** Fade this half out with a growing blur (the old name, idea and purpose). */
  readonly fade?: boolean;
};

export type ScissorsCutProps = {
  /** Size of the drawing (the art is authored in this box). */
  readonly w: number;
  readonly h: number;
  /** The cut, top edge to bottom edge, in drawing coordinates (y must increase). Default: straight down the middle. */
  readonly path?: readonly XY[];
  /** The piece left of the cut and the piece right of it. */
  readonly left?: Half;
  readonly right?: Half;
  readonly time?: number;
  /** The scissors enter (0.5 s), then cut. */
  readonly start?: number;
  /** Seconds of cutting. Default 2.5. */
  readonly cut?: number;
  readonly snips?: number;
  /** When the halves start to slide apart. Default: 0.5 s after the cut ends. */
  readonly slideAt?: number;
  readonly slideDur?: number;
  /** When the fading half starts to fade. Default: 0.5 s after the slide starts. */
  readonly fadeAt?: number;
  readonly fadeDur?: number;
  /** Blur of the fading half at the end, px. Default 12. */
  readonly blur?: number;
  /** When the label writes itself. Default: 0.5 s after the slide ends. */
  readonly labelAt?: number;
  /** Overall length of the scissors, px. Default 300. */
  readonly scissorsSize?: number;
  readonly lamp?: Lamp;
  readonly paper?: string;
  /** SVG art in drawing coordinates. */
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
};

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const ease = (x: number): number => {
  const c = clamp01(x);
  return c < 0.5 ? 4 * c * c * c : 1 - (-2 * c + 2) ** 3 / 2;
};
const easeOut = (x: number): number => 1 - (1 - clamp01(x)) ** 3;
const f = (v: number): string => v.toFixed(2);
const pts = (p: readonly XY[]): string => p.map((q) => `${f(q[0])},${f(q[1])}`).join(' ');

/** Point and direction (deg, 0 = +x) at share s (0..1) of a polyline's length. */
const along = (path: readonly XY[], s: number): {p: XY; deg: number} => {
  const lens = path.slice(1).map((q, i) => Math.hypot(q[0] - path[i]![0], q[1] - path[i]![1]));
  const total = lens.reduce((a, b) => a + b, 0);
  let left = clamp01(s) * total;
  for (let i = 0; i < lens.length; i++) {
    const a = path[i]!;
    const b = path[i + 1]!;
    const len = lens[i]!;
    if (left <= len || i === lens.length - 1) {
      const k = len > 0 ? Math.min(1, left / len) : 0;
      return {p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], deg: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI};
    }
    left -= len;
  }
  return {p: path[0]!, deg: 90};
};

/** The polyline up to share s. */
const upTo = (path: readonly XY[], s: number): XY[] => {
  const end = along(path, s).p;
  const lens = path.slice(1).map((q, i) => Math.hypot(q[0] - path[i]![0], q[1] - path[i]![1]));
  const total = lens.reduce((a, b) => a + b, 0);
  const out: XY[] = [path[0]!];
  let acc = 0;
  for (let i = 0; i < lens.length; i++) {
    acc += lens[i]!;
    if (acc >= clamp01(s) * total) break;
    out.push(path[i + 1]!);
  }
  out.push(end);
  return out;
};

const ARM_SEED = [11, 23] as const;

/**
 * The scissors in their own frame: pivot at the origin, blades pointing along +x. `open` is the angle between the blades.
 * Each arm is one blade plus the handle ring on the other side of the pivot, drawn as a paper cut-out in pencil.
 */
const ScissorsShape: React.FC<{size: number; open: number; silhouette?: string}> = ({size, open, silhouette}) => {
  const blade = size * 0.52;
  const ringR = size * 0.11;
  const ringAt = size * 0.3;
  const arm = (side: 1 | -1): React.ReactNode => {
    const seed = ARM_SEED[side === 1 ? 0 : 1];
    const outline: XY[] = [
      [-size * 0.05, side * size * 0.02],
      [blade * 0.25, side * size * 0.045],
      [blade * 0.7, side * size * 0.03],
      [blade, side * size * 0.004],
      [blade * 0.7, -side * size * 0.004],
      [blade * 0.2, -side * size * 0.006],
      [-ringAt + ringR * 0.6, -side * ringR * 1.1],
      [-ringAt + ringR * 0.2, -side * ringR * 0.55],
      [-size * 0.05, side * size * 0.02],
    ];
    const ring = handCircle(-ringAt, -side * ringR * 1.25, ringR, ringR * 0.82, seed + 3);
    const hole = handCircle(-ringAt, -side * ringR * 1.25, ringR * 0.58, ringR * 0.42, seed + 4);
    const blades = handPath(outline, seed, {wobble: 0.5});
    if (silhouette) {
      return (
        <g transform={`rotate(${f((side * open) / 2)})`} fill={silhouette}>
          <path d={`${ring} ${hole}`} fillRule="evenodd" />
          <path d={blades} />
        </g>
      );
    }
    return (
      <g transform={`rotate(${f((side * open) / 2)})`}>
        <path d={`${ring} ${hole}`} fill={SHEET_PAPER} fillRule="evenodd" />
        <Ink d={ring} width={2} />
        <Ink d={hole} width={1.6} />
        <Ink d={blades} width={2} fill={SHEET_PAPER} />
        <Ink d={handPath([[blade * 0.18, side * size * 0.012], [blade * 0.8, side * size * 0.008]], seed + 5, {wobble: 0.3})} width={1} ink={COLORS.graphiteSoft} />
      </g>
    );
  };
  return (
    <>
      {arm(-1)}
      {arm(1)}
      <circle r={size * 0.016} fill={silhouette ?? COLORS.graphite} />
    </>
  );
};

const OPEN_DEG = 34;
const OPEN_SHARE = 0.35;

export const ScissorsCut: React.FC<ScissorsCutProps> = (p) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = p.time ?? frame / fps;
  const uid = `sc${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const {w, h} = p;
  const lamp = p.lamp ?? DEFAULT_LAMP;
  const paper = p.paper ?? SHEET_PAPER;
  const path = p.path ?? ([[w / 2, 0], [w / 2, h]] as const);
  const left = p.left ?? {dx: -400, fade: true};
  const right = p.right ?? {dx: 300, label: 'keep'};
  const start = p.start ?? 0;
  const cutStart = start + 0.5;
  const cutDur = p.cut ?? 2.5;
  const cutEnd = cutStart + cutDur;
  const snips = p.snips ?? 3;
  const slideAt = p.slideAt ?? cutEnd + 0.5;
  const slideDur = p.slideDur ?? 1;
  const fadeAt = p.fadeAt ?? slideAt + 0.5;
  const fadeDur = p.fadeDur ?? 2;
  const labelAt = p.labelAt ?? slideAt + slideDur + 0.5;
  const size = p.scissorsSize ?? 300;

  // Snips: each one opens, then closes while the scissors advance one step.
  const c = clamp01((t - cutStart) / cutDur) * snips;
  const i = Math.min(snips - 1, Math.floor(c));
  const ph = t >= cutEnd ? 1 : c - i;
  const closing = clamp01((ph - OPEN_SHARE) / (1 - OPEN_SHARE));
  const progress = t < cutStart ? 0 : (i + ease(closing)) / snips;
  const open = t < cutStart ? OPEN_DEG * easeOut((t - start) / 0.5) : t >= cutEnd ? 0 : ph < OPEN_SHARE ? OPEN_DEG * easeOut(ph / OPEN_SHARE) : OPEN_DEG * (1 - ease(closing));
  const at = along(path, progress);
  const first = along(path, 0);
  // Enter along the path's direction from beyond its start; leave the same way past its end.
  const enterK = 1 - easeOut((t - start) / 0.5);
  const leaveK = easeOut((t - cutEnd) / 0.5);
  const rad = (at.deg * Math.PI) / 180;
  const back = size * 0.9;
  const sx = (t < cutStart ? first.p[0] - Math.cos(rad) * back * enterK : at.p[0]) + Math.cos(rad) * size * 0.8 * leaveK;
  const sy = (t < cutStart ? first.p[1] - Math.sin(rad) * back * enterK : at.p[1]) + Math.sin(rad) * size * 0.8 * leaveK;
  const scissorsAlpha = t < start ? 0 : clamp01((t - start) / 0.25) * (1 - clamp01((t - cutEnd - 0.2) / 0.4));

  const slide = ease((t - slideAt) / slideDur);
  const lifting = Math.sin(Math.PI * clamp01((t - slideAt) / slideDur));
  const separated = t >= slideAt;
  const fadeK = clamp01((t - fadeAt) / fadeDur);

  const top = path[0]!;
  const bottom = path[path.length - 1]!;
  const leftPoly: XY[] = [[0, 0], [top[0], 0], ...path, [bottom[0], h], [0, h]];
  const rightPoly: XY[] = [[w, 0], [top[0], 0], ...path, [bottom[0], h], [w, h]];

  const shadowFor = (poly: readonly XY[], key: string): React.ReactNode => {
    const height = 3 + lifting * 9;
    const o = shadowOffset(lamp, height);
    return (
      <polygon key={key} points={pts(poly)} transform={`translate(${f(o.x)} ${f(o.y)})`} fill={shade(0.22 * lamp.strength)} filter={`url(#${uid}-sh)`} />
    );
  };

  const piece = (poly: readonly XY[], half: Half, side: string): React.ReactNode => {
    const dx = half.dx * slide;
    const dy = (half.dy ?? 0) * slide;
    const fading = half.fade ? fadeK : 0;
    const label = half.label ? clamp01((t - labelAt) / 0.6) : 0;
    const xs = poly.map((q) => q[0]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    return (
      <div
        key={side}
        style={{position: 'absolute', left: 0, top: 0, width: w, height: h, transform: `translate(${f(dx)}px, ${f(dy)}px)`, opacity: 1 - fading, filter: fading > 0 ? `blur(${f((p.blur ?? 12) * fading)}px)` : undefined}}
      >
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {shadowFor(poly, 'shadow')}
          <clipPath id={`${uid}-${side}`} clipPathUnits="userSpaceOnUse">
            <polygon points={pts(poly)} />
          </clipPath>
          <polygon points={pts(poly)} fill={paper} stroke={COLORS.graphiteSoft} strokeOpacity={0.35} strokeWidth={1} strokeLinejoin="round" />
          <g clipPath={`url(#${uid}-${side})`}>
            <use href={`#${uid}-art`} />
          </g>
          {half.label && label > 0 ? (
            <g>
              <clipPath id={`${uid}-${side}-lb`} clipPathUnits="userSpaceOnUse">
                <rect x={cx - 90} y={-110} width={180 * label} height={120} />
              </clipPath>
              <text x={cx} y={-26} textAnchor="middle" fontFamily="Caveat" fontWeight={700} fontSize={56} fill={COLORS.accent} clipPath={`url(#${uid}-${side}-lb)`}>
                {half.label}
              </text>
            </g>
          ) : null}
        </svg>
      </div>
    );
  };

  return (
    <div style={{position: 'relative', width: w, height: h, ...p.style}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <g id={`${uid}-art`}>{p.children}</g>
          <filter id={`${uid}-sh`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={f(2 + lifting * 3)} />
          </filter>
          <filter id={`${uid}-ssh`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={3} />
          </filter>
        </defs>
      </svg>
      {separated ? (
        <>
          {piece(leftPoly, left, 'l')}
          {piece(rightPoly, right, 'r')}
        </>
      ) : (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {shadowFor([[0, 0], [w, 0], [w, h], [0, h]], 'whole')}
          <rect width={w} height={h} fill={paper} stroke={COLORS.graphiteSoft} strokeOpacity={0.35} strokeWidth={1} />
          <use href={`#${uid}-art`} />
          {progress > 0 ? <polyline points={pts(upTo(path, progress))} fill="none" stroke={COLORS.graphite} strokeOpacity={0.7} strokeWidth={1.6} strokeLinecap="round" /> : null}
        </svg>
      )}
      {scissorsAlpha > 0 ? (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: scissorsAlpha}}>
          {(() => {
            const o = shadowOffset(lamp, 16);
            return (
              <g transform={`translate(${f(sx + o.x)} ${f(sy + o.y)}) rotate(${f(at.deg)})`} filter={`url(#${uid}-ssh)`} opacity={0.22 * lamp.strength}>
                <ScissorsShape size={size} open={open} silhouette={shade(1)} />
              </g>
            );
          })()}
          <g transform={`translate(${f(sx)} ${f(sy)}) rotate(${f(at.deg)})`}>
            <ScissorsShape size={size} open={open} />
          </g>
        </svg>
      ) : null}
    </div>
  );
};
