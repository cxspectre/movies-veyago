// Pencil.tsx — the graphite pencil, the accent pencil and the fineliner, top-down, with the tip as the anchor.
// Lying flat it throws the table's shadow (BIBLE §2.1); held at an angle the shadow diverges from the tip with the
// tool's height, so the tip's shadow stays at the contact point. Author in mm; `pxPerMm` scales it (default: the
// sketch's 2.857, i.e. place it in sketch px inside the same transform as the PaperSheet).
import React, {useId} from 'react';
import {blurDeviation, DESK_PALETTE, liftedShadow, REACH_PER_PX, SHADOW_DIR, type ShadowEntry, SHADOWS, shadowRgba, SKETCH_PX_PER_MM} from '../palette';
import {type PencilKind, pencilArt, PENCIL_GEOMETRY} from './pencilArt';

export type PencilShadowMode = 'lying' | 'held' | 'none';

export type PencilProps = {
  readonly kind?: PencilKind;
  /** Tip position, parent px. */
  readonly x: number;
  readonly y: number;
  /** Direction from the tip toward the back end, degrees (0 = +x, positive = clockwise on screen). */
  readonly yaw: number;
  /** Angle to the paper, degrees (0 = lying flat; 55 in the hand). Foreshortens the body from above. */
  readonly tilt?: number;
  readonly pxPerMm?: number;
  readonly shadow?: PencilShadowMode;
  /** Height of the tip above the paper, px (hover at the end of the film; the lift between strokes). */
  readonly hover?: number;
  /** Draw only this axial range, mm from the tip (for layering a held pencil under and over the fingers). */
  readonly clip?: readonly [number, number];
  /** Stylised reach of the held pencil's shadow (1 = physically exact at 38°, which is very long). */
  readonly heldShadowReach?: number;
  /** The table entry a 'lying' shadow uses (default `SHADOWS.pencil`; a tighter one for a piece lying on a hand). */
  readonly shadowEntry?: ShadowEntry;
  readonly opacity?: number;
  readonly style?: React.CSSProperties;
};

const RAD = Math.PI / 180;
const HELD_SHADOW_REACH = 0.3;
const HELD_SHADOW_BLUR = 10;
const CLIP_HALF = 24;

const fmt = (n: number): string => n.toFixed(3);

/** The art of a pencil in mm, tip at the origin, along +x. Shared with the hands. */
export const PencilBody: React.FC<{kind: PencilKind; tilt: number}> = ({kind, tilt}) => {
  const art = pencilArt(kind);
  const d = PENCIL_GEOMETRY[kind].diameter;
  const squeeze = Math.cos(tilt * RAD);
  return (
    <g transform={`scale(${fmt(squeeze)} 1)`}>
      {art.polys.map((p, i) => (
        <polygon key={`p${i}`} points={p.points.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(' ')} fill={p.fill} fillOpacity={p.opacity ?? 1} />
      ))}
      {art.bands.map((b, i) => (
        <rect key={`b${i}`} x={b.x0} y={(b.top * d) / 2} width={b.x1 - b.x0} height={((b.bottom - b.top) * d) / 2} fill={b.fill} fillOpacity={b.opacity ?? 1} />
      ))}
      {art.lines.map((l, i) => (
        <line key={`l${i}`} x1={l.x0} y1={l.y0} x2={l.x1} y2={l.y1} stroke={l.stroke} strokeWidth={l.width} strokeOpacity={l.opacity} strokeLinecap="round" />
      ))}
    </g>
  );
};

const silhouettePoints = (kind: PencilKind): readonly (readonly [number, number])[] => pencilArt(kind).silhouette;

/** A held pencil's shadow polygon, in parent px: every silhouette point displaced by the table offset plus its own height. */
const heldShadowPath = (p: Required<Pick<PencilProps, 'x' | 'y' | 'yaw' | 'tilt' | 'pxPerMm' | 'hover' | 'heldShadowReach'>> & {kind: PencilKind}): string => {
  const base = SHADOWS.pencil;
  const c = Math.cos(p.yaw * RAD);
  const s = Math.sin(p.yaw * RAD);
  const squeeze = Math.cos(p.tilt * RAD);
  const rise = Math.sin(p.tilt * RAD);
  const pts = silhouettePoints(p.kind).map(([mx, my]) => {
    const ax = mx * squeeze * p.pxPerMm;
    const ay = my * p.pxPerMm;
    const height = mx * rise * p.pxPerMm + p.hover;
    const reach = height * REACH_PER_PX * p.heldShadowReach;
    const sx = p.x + ax * c - ay * s + base.x + SHADOW_DIR.x * reach;
    const sy = p.y + ax * s + ay * c + base.y + SHADOW_DIR.y * reach;
    return `${fmt(sx)} ${fmt(sy)}`;
  });
  return `M${pts.join(' L')} Z`;
};

export const Pencil: React.FC<PencilProps> = ({
  kind = 'graphite',
  x,
  y,
  yaw,
  tilt = 0,
  pxPerMm = SKETCH_PX_PER_MM,
  shadow = 'lying',
  hover = 0,
  clip,
  heldShadowReach = HELD_SHADOW_REACH,
  shadowEntry = SHADOWS.pencil,
  opacity = 1,
  style,
}) => {
  const id = useId();
  const g = PENCIL_GEOMETRY[kind];
  const clipId = `pencil-clip-${id}`;
  const gradId = `pencil-shade-${id}`;
  const place = `translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(yaw)}) scale(${fmt(pxPerMm)})`;
  const lying = liftedShadow(shadowEntry, {height: hover});
  const sil = silhouettePoints(kind)
    .map(([mx, my]) => `${fmt(mx)} ${fmt(my)}`)
    .join(' L');
  const squeeze = Math.cos(tilt * RAD);
  const clipRect = clip ? {x: clip[0] * squeeze, w: (clip[1] - clip[0]) * squeeze} : null;
  const backEnd = {x: x + Math.cos(yaw * RAD) * g.length * squeeze * pxPerMm, y: y + Math.sin(yaw * RAD) * g.length * squeeze * pxPerMm};
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', opacity, ...style}}>
      <defs>
        {clipRect ? (
          <clipPath id={clipId}>
            <rect x={clipRect.x} y={-CLIP_HALF} width={clipRect.w} height={CLIP_HALF * 2} />
          </clipPath>
        ) : null}
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={x} y1={y} x2={backEnd.x} y2={backEnd.y}>
          <stop offset="0" stopColor={shadowRgba(SHADOWS.pencil.color, SHADOWS.pencil.opacity)} />
          <stop offset="0.45" stopColor={shadowRgba(SHADOWS.pencil.color, SHADOWS.pencil.opacity * 0.6)} />
          <stop offset="1" stopColor={shadowRgba(SHADOWS.pencil.color, 0)} />
        </linearGradient>
      </defs>
      {shadow === 'lying' ? (
        <g style={{filter: `blur(${blurDeviation(lying.blur)}px)`}}>
          <g transform={`translate(${fmt(lying.x)} ${fmt(lying.y)}) ${place} scale(${fmt(squeeze)} 1)`} clipPath={clipRect ? `url(#${clipId})` : undefined}>
            <path d={`M${sil} Z`} fill={shadowRgba(lying.color, lying.opacity)} />
          </g>
        </g>
      ) : null}
      {shadow === 'held' ? (
        <g style={{filter: `blur(${blurDeviation(HELD_SHADOW_BLUR)}px)`}}>
          <path d={heldShadowPath({x, y, yaw, tilt, pxPerMm, hover, heldShadowReach, kind})} fill={`url(#${gradId})`} />
        </g>
      ) : null}
      <g transform={place} clipPath={clipRect ? `url(#${clipId})` : undefined}>
        <PencilBody kind={kind} tilt={tilt} />
      </g>
    </svg>
  );
};

/** The darker tone a pencil lying in the cup shows (for the pencil cup's foreshortened ends). */
export const PENCIL_END_COLOURS: Record<PencilKind, {body: string; end: string}> = {
  graphite: {body: DESK_PALETTE.pencil.body, end: DESK_PALETTE.pencil.eraser},
  accent: {body: DESK_PALETTE.pencil.accentBody, end: DESK_PALETTE.pencil.accentDark},
  fineliner: {body: DESK_PALETTE.pencil.fineliner, end: DESK_PALETTE.pencil.finelinerCap},
  finelinerUncapped: {body: DESK_PALETTE.pencil.fineliner, end: DESK_PALETTE.pencil.finelinerCap},
};
