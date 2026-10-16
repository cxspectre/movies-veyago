// HandDrawing.tsx — turns a HandPose into pixels: one silhouette shadow, a single continuous 2.2 px contour around
// the union of palm, fingers and forearm (stroke pass under, fill pass over), flat tone, one shade on the sides that
// face away from the lamp and between the fingers, a 2 px highlight on the index finger. Three tone levels, no nails.
// Pure: the same props always draw the same pixels.
import React, {useMemo} from 'react';
import {blurDeviation, DESK_PALETTE, liftedShadow, SHADOW_DIR, SHADOWS, shadowRgba, SKETCH_PX_PER_MM} from '../palette';
import {add, awaySide, catmullRom, len, norm, outlineOf, polyPath, type Pt, ribbonOf, shadeBands, litEdge, sub, smooth01} from './geometry';
import type {DigitName, DigitPose, HandPose} from './poses';
import {type DigitArt, type Forearm, foldCrescent, forearmOf, jointCreases, overlapContour, polygonBand, webFiller} from './handShading';

export type Handedness = 'right' | 'left';

export type HandPlacement = {
  /** Where `anchor` (or the hand frame's origin) lands, parent px. */
  readonly x: number;
  readonly y: number;
  /** A name from the pose's anchors (e.g. 'pinch', 'indexTip', 'palm'). */
  readonly anchor?: string;
  /** Degrees, clockwise on screen; 0 = fingers pointing up the screen. */
  readonly rotation?: number;
  readonly handed?: Handedness;
  /** Scale of the drawing: px per mm (default the sketch's 2.857). */
  readonly pxPerMm?: number;
  /** Pair A = 1; pair B is a little smaller. */
  readonly size?: number;
  /** How far the forearm runs toward the frame edge, mm (default 1200: past any frame edge). */
  readonly forearmMm?: number;
  /** Degrees the forearm bends on its way out, positive toward the little-finger side (default 6). */
  readonly forearmBend?: number;
  /** Height above the paper, px: the shadow drifts away and softens. */
  readonly lift?: number;
  readonly shadow?: boolean;
  /** Contour width, px in the hand's space (BIBLE: 2.2). */
  readonly contour?: number;
};

export type HandDrawingProps = HandPlacement & {
  readonly pose: HandPose;
  /** Drawn between the hand and the redrawn finger caps (the pencil it holds). */
  readonly held?: React.ReactNode;
  /** The fallback look: only the cast shadow (plus `held`), no hand. */
  readonly shadowOnly?: boolean;
  readonly style?: React.CSSProperties;
};

const RAD = Math.PI / 180;
const SPINE_SAMPLES = 10;
const BAND = {depth: 0.36, gamma: 1, from: 0.3};
const FOLD_FEATHER = 3.2;
const FOLD_OPACITY = 0.72;
const WEB_RADIUS_MM = 6;
const PALM_BAND_MM = 8;
const HIGHLIGHT_INSET = 1.8;
const SHADE_FEATHER = 2.2;
const SHADE_OPACITY = 0.9;
const WRIST_EXCLUDE_MM = 88;
const HIGHLIGHT_OPACITY = 0.38;
/** The contour is heavier on the side that turns away from the lamp: a second stroke, shifted a little. */
const CONTOUR_SHIFT = {x: 0.9, y: 1.1};
const CONTOUR_LIT_FRACTION = 0.72;
const CREASE_WIDTH = 1.1;
const CREASE_OPACITY = 0.32;
/** Long enough to leave any frame at the smallest scale the kit is drawn at (200 px past the edge at 1080p). */
const DEFAULT_FOREARM_MM = 1200;
const KNUCKLE_END_WIDTH = 0.92;
/** The line that separates a finger lying over its neighbour, relative to the contour. */
const OVERLAP_WIDTH = 0.7;
const OVERLAP_OPACITY = 0.6;
/** A tight shadow under the fingers and palm where they touch the paper; it fades as the hand lifts. */
const CONTACT = {x: 3, y: 4, blur: 8, opacity: 0.2, fadePx: 6};

type Shape = {readonly d: string};
type Built = {
  readonly shapes: readonly Shape[];
  /** The fingers and palm only (what touches the paper). */
  readonly contact: readonly Shape[];
  readonly digits: readonly DigitArt[];
  readonly palm: readonly Pt[];
  readonly forearm: Forearm;
  /** The dip of every web (where the shade pools). */
  readonly webs: readonly Pt[];
  readonly k: number;
  readonly away: Pt;
};

/** Build a transform from the hand frame (mm) to parent px. */
const transformer = (p: HandPlacement, pose: HandPose): ((q: Pt) => Pt) => {
  const k = (p.pxPerMm ?? SKETCH_PX_PER_MM) * (p.size ?? 1);
  const mirror = p.handed === 'left' ? -1 : 1;
  const rot = (p.rotation ?? 0) * RAD;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const local = (q: Pt): Pt => ({x: (q.x * mirror * c - q.y * s) * k, y: (q.x * mirror * s + q.y * c) * k});
  const anchor = p.anchor ? (pose.anchors[p.anchor] ?? {x: 0, y: 0}) : {x: 0, y: 0};
  const a = local(anchor);
  const origin = {x: p.x - a.x, y: p.y - a.y};
  return (q) => add(origin, local(q));
};

/**
 * How a finger's width runs from the knuckle (0) to the tip (1), as a fraction of the way from the base width to
 * the tip width: a slight waist at the middle joint, a soft pad, then the last stretch tapers into the round tip.
 */
const fingerProfile = (t: number, knuckle: boolean): number => {
  if (knuckle) return smooth01(t * 1.6);
  const waist = 0.12 * Math.sin(Math.PI * Math.min(1, t / 0.9));
  const taper = smooth01((t - 0.78) / 0.22);
  return Math.min(1.25, t * 0.55 + waist + taper * 0.55);
};

const digitArt = (name: DigitName, d: DigitPose, toPx: (q: Pt) => Pt, k: number): DigitArt => {
  const joints = d.joints.map(toPx);
  const spine = catmullRom(joints, SPINE_SAMPLES);
  const total = joints.slice(1).reduce((acc, j, i) => acc + len(sub(j, joints[i] as Pt)), 0);
  const rootLen = len(sub(joints[1] as Pt, joints[0] as Pt));
  const uMcp = rootLen / Math.max(1e-6, total);
  const base = d.width[0] * k;
  const tip = (d.knuckleEnd ? d.width[0] * KNUCKLE_END_WIDTH : d.width[1]) * k;
  const widthAt = (u: number): number => {
    const t = Math.min(1, Math.max(0, (u - uMcp) / Math.max(1e-6, 1 - uMcp)));
    return base + (tip - base) * fingerProfile(t, d.knuckleEnd === true);
  };
  const rib = ribbonOf(spine, widthAt);
  const out = outlineOf(rib);
  let cap: DigitArt['cap'];
  if (d.capFrom !== undefined && d.capFrom < joints.length - 1) {
    const capLen = joints.slice(1, d.capFrom + 1).reduce((acc, j, i) => acc + len(sub(j, joints[i] as Pt)), 0);
    const uCap = capLen / Math.max(1e-6, total);
    const from = rib.u.findIndex((u) => u >= uCap);
    const capSpine = rib.spine.slice(Math.max(0, from));
    const capRib = ribbonOf(capSpine, (u) => widthAt(uCap + u * (1 - uCap)));
    cap = {rib: capRib, out: outlineOf(capRib)};
  }
  return {name, rib, out, uMcp, total, fold: d.knuckleEnd === true, highlight: d.highlight === true, ...(cap ? {cap} : {})};
};

const build = (p: HandDrawingProps): Built => {
  const toPx = transformer(p, p.pose);
  const k = (p.pxPerMm ?? SKETCH_PX_PER_MM) * (p.size ?? 1);
  const palm = p.pose.palm.map(toPx);
  const dir = norm(sub(toPx(p.pose.forearm), toPx({x: 0, y: 0})));
  const forearm = forearmOf({wrist: [toPx(p.pose.wrist[0]), toPx(p.pose.wrist[1])], dir, lengthMm: p.forearmMm ?? DEFAULT_FOREARM_MM, k, ...(p.forearmBend === undefined ? {} : {bendDeg: p.forearmBend})});
  const digits = p.pose.digits.map(([name, d]) => digitArt(name, d, toPx, k));
  const webs = p.pose.webs.map((w) => webFiller(w, digits, k)).filter((w): w is {d: string; dip: Pt} => w !== null);
  const contact: Shape[] = [...digits.map((d) => ({d: d.out.closed})), ...webs.map((w) => ({d: w.d})), {d: polyPath(palm, true)}];
  const shapes: Shape[] = [{d: polyPath(forearm.polygon, true)}, ...contact];
  return {shapes, contact, digits, palm, forearm, webs: webs.map((w) => w.dip), k, away: {x: SHADOW_DIR.x, y: SHADOW_DIR.y}};
};

const Shapes: React.FC<{shapes: readonly Shape[]; fill: string; stroke?: string; strokeWidth?: number}> = ({shapes, fill, stroke, strokeWidth}) => (
  <>
    {shapes.map((s, i) => (
      <path key={i} d={s.d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    ))}
  </>
);

const layer: React.CSSProperties = {position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'};

export const HandDrawing: React.FC<HandDrawingProps> = (p) => {
  const built = useMemo(() => build(p), [p]);
  const H = DESK_PALETTE.hand;
  const contour = p.contour ?? 2.2;
  const shadow = liftedShadow(SHADOWS.hands, {height: p.lift ?? 0});
  const bandDepth = BAND.depth;
  const folds = useMemo(() => built.digits.filter((d) => d.fold).map(foldCrescent), [built]);
  const shadeShapes = useMemo(() => {
    const out: string[] = [];
    for (const d of built.digits) {
      out.push(...shadeBands(d.rib, d.out, built.away, {...BAND, depth: bandDepth, from: d.uMcp + 0.12}));
    }
    const palmMm = p.pose.palm;
    out.push(polygonBand(built.palm, built.away, PALM_BAND_MM * built.k, 1.2, (i) => ((palmMm[i]?.y ?? 0) > WRIST_EXCLUDE_MM ? 0 : 1)));
    out.push(...shadeBands(built.forearm.rib, built.forearm.out, built.away, {depth: 0.22, gamma: 1.2, from: 0.001, tip: false}));
    return out;
  }, [built, bandDepth]);
  const creases = useMemo(() => built.digits.flatMap((d) => jointCreases(d, p.pose, built.k)), [built, p.pose]);
  const overlaps = useMemo(() => built.digits.flatMap((d, i) => built.digits.slice(0, i).flatMap((lower) => overlapContour(d, lower))), [built]);
  const contactFade = 1 / (1 + (p.lift ?? 0) / CONTACT.fadePx);
  const highlights = useMemo(
    () =>
      built.digits
        .filter((d) => d.highlight)
        .map((d) => polyPath(litEdge(d.rib, d.out, built.away, HIGHLIGHT_INSET, d.uMcp + 0.1, 0.94))),
    [built],
  );
  const caps = built.digits.filter((d): d is DigitArt & {cap: NonNullable<DigitArt['cap']>} => d.cap !== undefined);
  const webR = WEB_RADIUS_MM * built.k;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, ...p.style}}>
      <svg width={1} height={1} style={layer}>
        <defs>
          <radialGradient id="desk-hand-web">
            <stop offset="0" stopColor={H.shade} stopOpacity={0.85} />
            <stop offset="0.55" stopColor={H.shade} stopOpacity={0.35} />
            <stop offset="1" stopColor={H.shade} stopOpacity={0} />
          </radialGradient>
        </defs>
        {p.shadow === false ? null : (
          <>
            <g style={{filter: `blur(${blurDeviation(shadow.blur)}px)`, opacity: shadow.opacity}} transform={`translate(${shadow.x.toFixed(2)} ${shadow.y.toFixed(2)})`}>
              <Shapes shapes={built.shapes} fill={shadowRgba(shadow.color, 1)} />
            </g>
            <g style={{filter: `blur(${blurDeviation(CONTACT.blur)}px)`, opacity: CONTACT.opacity * contactFade}} transform={`translate(${CONTACT.x} ${CONTACT.y})`}>
              <Shapes shapes={built.contact} fill={shadowRgba(shadow.color, 1)} />
            </g>
          </>
        )}
        {p.shadowOnly ? null : (
          <>
            <g opacity={H.lineOpacity}>
              <Shapes shapes={built.shapes} fill={H.line} stroke={H.line} strokeWidth={contour * 2 * CONTOUR_LIT_FRACTION} />
              <g transform={`translate(${CONTOUR_SHIFT.x} ${CONTOUR_SHIFT.y})`}>
                <Shapes shapes={built.shapes} fill={H.line} stroke={H.line} strokeWidth={contour * 2 * CONTOUR_LIT_FRACTION} />
              </g>
            </g>
            <Shapes shapes={built.shapes} fill={H.tone} />
            <g fill="none" stroke={H.line} strokeOpacity={CREASE_OPACITY} strokeWidth={CREASE_WIDTH} strokeLinecap="round">
              {creases.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            <g fill={H.shade} style={{filter: `blur(${SHADE_FEATHER}px)`}}>
              {shadeShapes.map((d, i) => (
                <path key={i} d={d} />
              ))}
              {built.webs.map((w, i) => (
                <circle key={`w${i}`} cx={w.x} cy={w.y} r={webR} fill="url(#desk-hand-web)" />
              ))}
            </g>
            <g fill={H.shade} opacity={FOLD_OPACITY} style={{filter: `blur(${FOLD_FEATHER}px)`}}>
              {folds.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            <g fill="none" stroke={H.line} strokeOpacity={H.lineOpacity * OVERLAP_OPACITY} strokeWidth={contour * OVERLAP_WIDTH} strokeLinecap="round" strokeLinejoin="round">
              {overlaps.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            <g fill="none" stroke={H.highlight} strokeOpacity={HIGHLIGHT_OPACITY} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              {highlights.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
          </>
        )}
      </svg>
      {p.held}
      {caps.length > 0 && !p.shadowOnly ? (
        <svg width={1} height={1} style={layer}>
          {caps.map((d) => {
            const bands = shadeBands(d.cap.rib, d.cap.out, built.away, {...BAND, depth: bandDepth, from: 0.01});
            const litSide: 1 | -1 = awaySide(d.rib, built.away) === 1 ? -1 : 1;
            const hl = d.highlight ? polyPath(litEdge(d.cap.rib, d.cap.out, built.away, HIGHLIGHT_INSET, 0.05, 0.94, litSide)) : null;
            return (
              <g key={d.name}>
                <path d={d.cap.out.open} fill="none" stroke={H.line} strokeOpacity={H.lineOpacity} strokeWidth={contour * 2} strokeLinejoin="round" strokeLinecap="round" />
                <path d={d.cap.out.closed} fill={H.tone} />
                <g fill={H.shade} opacity={SHADE_OPACITY} style={{filter: `blur(${SHADE_FEATHER}px)`}}>
                  {bands.map((b, i) => (
                    <path key={i} d={b} />
                  ))}
                </g>
                {hl ? <path d={hl} fill="none" stroke={H.highlight} strokeOpacity={HIGHLIGHT_OPACITY} strokeWidth={2} strokeLinecap="round" /> : null}
              </g>
            );
          })}
        </svg>
      ) : null}
    </div>
  );
};

/** Where a pose's anchor lands for a placement (pure; for scene owners who need the pencil tip or a fingertip in px). */
export const handAnchorPx = (p: HandPlacement, pose: HandPose, anchor: string): Pt => transformer(p, pose)(pose.anchors[anchor] ?? {x: 0, y: 0});

/** The hand frame's unit vectors in parent px for a placement (forearm direction etc.). */
export const handDirectionPx = (p: HandPlacement, pose: HandPose, v: Pt): Pt => {
  const t = transformer(p, pose);
  const o = t({x: 0, y: 0});
  return norm(sub(t(v), o));
};

export const smoothLift = (lift01: number): number => smooth01(lift01);
