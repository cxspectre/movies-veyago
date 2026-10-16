// Super.tsx — a super written by the pencil in the speaking voice's ink (the v1 engine's lettering, glyph by glyph), that
// then resolves in place to DM Sans, the film's super face (BIBLE4 §3, §5 preamble). Sheet supers live on the paper and
// scale with the camera; screen supers sit over the frame at a fixed size. Deterministic: a pure function of time.
import React, {useMemo} from 'react';
import {useVideoConfig} from 'remotion';
import {COLORS, FONTS} from '../film';
import type {Ink as BeatInk, Super as BeatSuper} from '../beats4';
import {INK4} from '../beats4';
import {compileSketch, label, PencilCanvas, sequence, type Ink, type SketchSpec} from '../paper';
import {measureHand, wrapHand} from '../paper/text/handLayout';
import type {Point} from '../sheet4';
import {clamp01, smoothstep, useLocalSeconds, useSheetZoom, useToLocal} from './context';

export type SuperInk = BeatInk; // 'graphite' | 'accent' | 'sepia' | 'glass'
export type SuperAlign = 'left' | 'centre';

/** Screen-space positions from BIBLE4 §5 (fractions of the frame; baseline). */
export const SCREEN_ANCHORS = {
  /** Centred screen super: 0.5 W, baseline 0.80 H (0.76 H tall), DM Sans 500 64 px wide / 52 px tall. */
  super: {x: 0.5, y: {wide: 0.8, tall: 0.76}, align: 'centre', size: {wide: 64, tall: 52}},
  /** Chapter 2's lower-third labels: 0.08 W, baseline 0.84 H (0.80 H tall), 40 px, left-aligned. */
  'lower-third': {x: 0.08, y: {wide: 0.84, tall: 0.8}, align: 'left', size: {wide: 40, tall: 40}},
  /** Glass type inside the chapter-6 screen: lower-left 0.06 W, 0.86 H, 44 px. */
  'glass-lower-left': {x: 0.06, y: {wide: 0.86, tall: 0.86}, align: 'left', size: {wide: 44, tall: 44}},
} as const;
export type ScreenAnchorName = keyof typeof SCREEN_ANCHORS;

export type SuperAnchor =
  /** A baseline point in SHEET px (the bible's numbers). Inside a ChapterShell it is converted to region-local px. */
  | {readonly sheet: Point; readonly align?: SuperAlign}
  /** A named screen position, or fractions of the frame (baseline). Render in the sheet's `overlay`. */
  | {readonly screen: ScreenAnchorName | {readonly x: number; readonly y: number; readonly align?: SuperAlign}};

export type SuperProps = {
  readonly text: string;
  readonly ink: SuperInk;
  /** Module-local seconds the pencil starts writing (or the type starts fading in, when `write` is 0). */
  readonly start: number;
  /** Seconds of handwriting. Default: 11 characters a second, clamped to 1.5-3.0 s. 0 = type only (fades in). */
  readonly write?: number;
  /** Seconds the handwriting takes to resolve into DM Sans (default 1.0). */
  readonly resolve?: number;
  /** Seconds the resolved type holds before fading out (default: forever). */
  readonly hold?: number;
  /** Fade-out seconds (default 0.5). */
  readonly fadeOut?: number;
  readonly anchor: SuperAnchor;
  /** DM Sans size: sheet px for sheet anchors (default 56), screen px for screen anchors (default per anchor). */
  readonly size?: number;
  /** Wrap width in the anchor's px (default 1000 sheet px, 0.84 W on screen). Lines break the same way in hand and type. */
  readonly maxWidth?: number;
  /** Override the clock (module-local seconds). */
  readonly time?: number;
};

/** BIBLE4 §5: handwriting is Caveat 500 at 72 px where the type is DM Sans 500 at 56 px. */
const HAND_PER_TYPE = 72 / 56;
const CHARS_PER_SECOND = 11;
const WRITE_RANGE = {min: 1.5, max: 3.0} as const;
const LINE_STEP = 1.25; // type line spacing, em
const TYPE_FADE_IN = 0.5;
const PAD_EM = 0.6; // canvas margin around the handwriting, in hand em
const SCREEN_INK_ALPHA = 0.9; // screen supers are graphite 90%
const GLASS_ALPHA = 0.92;

const INK_HEX: Record<SuperInk, string> = {graphite: COLORS.graphite, accent: COLORS.accent, sepia: INK4.sepia, glass: COLORS.glassWhite};

export const defaultWriteSeconds = (text: string): number =>
  Math.min(WRITE_RANGE.max, Math.max(WRITE_RANGE.min, Array.from(text).length / CHARS_PER_SECOND));

/** Where the super is on the module timeline: write → resolve → hold → fade. All in module-local seconds. */
export const superTiming = (p: Pick<SuperProps, 'text' | 'ink' | 'start' | 'write' | 'resolve' | 'hold' | 'fadeOut' | 'anchor'>) => {
  const writes = p.ink !== 'glass' && (p.write ?? ('sheet' in p.anchor ? defaultWriteSeconds(p.text) : 0)) > 0;
  const write = writes ? (p.write ?? defaultWriteSeconds(p.text)) : 0;
  const resolve = writes ? (p.resolve ?? 1.0) : TYPE_FADE_IN;
  const typeIn = p.start + write;
  const typeFull = typeIn + resolve;
  const fadeOut = p.fadeOut ?? 0.5;
  const out = p.hold === undefined ? Infinity : typeFull + p.hold;
  return {writes, write, resolve, typeIn, typeFull, out, end: out + fadeOut, fadeOut};
};

/**
 * A beats4 SUPERS entry as Super props: the window `t … t + dur` includes the write, the resolve and the 0.5 s fade.
 * Screen-space beats default to the centred `super` anchor and type only; sheet beats need their sheet point.
 */
export const superFromBeat = (s: BeatSuper, anchor?: SuperAnchor, extra: Partial<SuperProps> = {}): SuperProps => {
  const a: SuperAnchor = anchor ?? (s.space === 'screen' ? {screen: s.ink === 'glass' ? 'glass-lower-left' : 'super'} : {sheet: [0, 0]});
  const base = {text: s.text, ink: s.ink, start: s.t, anchor: a, ...extra};
  const t = superTiming(base);
  const fadeOut = extra.fadeOut ?? 0.5;
  return {...base, hold: Math.max(0, s.dur - (t.typeFull - s.t) - fadeOut), fadeOut};
};

/** The cue for the sound department: the pencil writing (a 'stroke'), in module-local seconds. */
export const superCues = (p: SuperProps) => {
  const t = superTiming(p);
  return t.writes ? [{kind: 'stroke' as const, t: p.start, dur: t.write, pressure: 0.9}] : [];
};

type Layout = {lines: readonly string[]; x: number; y: number; align: SuperAlign; size: number; maxWidth: number};

const handLines = (text: string, handSize: number, maxWidth: number): readonly string[] =>
  text
    .split('\n')
    .flatMap((para) => wrapHand(para, handSize, maxWidth / 1.08).split('\n'));

/** The handwriting as one engine page (labels in canvas px), plus where the canvas sits in the parent's px. */
const handPage = (lay: Layout, ink: Ink, seedText: string) => {
  const handSize = lay.size * HAND_PER_TYPE;
  const pad = handSize * PAD_EM;
  const widths = lay.lines.map((l) => measureHand(l, handSize));
  const w = Math.max(...widths, 1);
  const step = lay.size * LINE_STEP;
  const width = Math.ceil(w + pad * 2);
  const height = Math.ceil(handSize * 1.1 + step * (lay.lines.length - 1) + pad * 2);
  const left = lay.align === 'centre' ? lay.x - w / 2 - pad : lay.x - pad;
  const top = lay.y - handSize * 0.95 - pad;
  const items = lay.lines.map((line, i) => {
    const lx = lay.align === 'centre' ? pad + (w - (widths[i] as number)) / 2 : pad;
    return label(`l${i}`, line, lx, lay.y - top + i * step, {size: handSize, ink, face: 'caveat-500'});
  });
  const spec: SketchSpec = {id: `super-${seedText}`, ...sequence(items, 0, 1, 0.04)};
  return {spec, left, top, width, height};
};

const SuperBody: React.FC<{p: SuperProps; lay: Layout; local: number; zoom: number; colour: string; alpha: number}> = ({p, lay, local, zoom, colour, alpha}) => {
  const t = superTiming(p);
  const handInk: Ink = p.ink === 'glass' ? 'graphite' : p.ink;
  const layKey = JSON.stringify(lay);
  const page = useMemo(() => {
    if (!t.writes) return null;
    const hp = handPage(JSON.parse(layKey) as Layout, handInk, p.text);
    return {...hp, marks: compileSketch(hp.spec)};
  }, [t.writes, layKey, handInk, p.text]);
  if (local < p.start || local >= t.end) return null;
  const out = 1 - smoothstep((local - t.out) / t.fadeOut);
  const typeK = smoothstep((local - t.typeIn) / t.resolve);
  const handK = 1 - typeK;
  const writeK = t.write > 0 ? clamp01((local - p.start) / t.write) : 1;
  const step = lay.size * LINE_STEP;
  return (
    <>
      {page && handK * out > 0.002 ? (
        <PencilCanvas
          marks={page.marks}
          progress={writeK}
          width={page.width}
          height={page.height}
          zoom={zoom}
          style={{left: page.left, top: page.top, opacity: handK * out}}
        />
      ) : null}
      {typeK * out > 0.002 ? (
        <svg style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible', opacity: typeK * out * alpha}}>
          <text
            x={lay.x}
            y={lay.y}
            fill={colour}
            textAnchor={lay.align === 'centre' ? 'middle' : 'start'}
            style={{fontFamily: FONTS.super, fontWeight: 500, fontSize: lay.size}}
          >
            {lay.lines.map((line, i) => (
              <tspan key={i} x={lay.x} y={lay.y + i * step}>
                {line}
              </tspan>
            ))}
          </text>
        </svg>
      ) : null}
    </>
  );
};

/**
 * <Super>. Sheet anchors: put it inside the chapter's art (it lives on the paper, scales with the camera, and its
 * pencil grain follows the zoom). Screen anchors: put it in the sheet's `overlay` (fixed size, over the frame).
 */
export const Super: React.FC<SuperProps> = (p) => {
  const local = useLocalSeconds(p.time);
  const zoom = useSheetZoom();
  const toLocal = useToLocal();
  const {width, height} = useVideoConfig();
  const tall = height > width;
  const handText = p.text;
  let lay: Layout;
  if ('sheet' in p.anchor) {
    const [x, y] = toLocal(p.anchor.sheet);
    const size = p.size ?? 56;
    const maxWidth = p.maxWidth ?? 1000;
    lay = {lines: handLines(handText, size * HAND_PER_TYPE, maxWidth), x, y, align: p.anchor.align ?? 'left', size, maxWidth};
  } else {
    const a = p.anchor.screen;
    const named = typeof a === 'string' ? SCREEN_ANCHORS[a] : null;
    const fx = named ? named.x : (a as {x: number}).x;
    const fy = named ? named.y[tall ? 'tall' : 'wide'] : (a as {y: number}).y;
    const align: SuperAlign = named ? named.align : ((a as {align?: SuperAlign}).align ?? 'centre');
    const size = p.size ?? (named ? named.size[tall ? 'tall' : 'wide'] : tall ? 52 : 64);
    const maxWidth = p.maxWidth ?? width * 0.84;
    lay = {lines: handLines(handText, size * HAND_PER_TYPE, maxWidth), x: fx * width, y: fy * height, align, size, maxWidth};
    // Multi-line screen supers grow upwards so the last line keeps the anchor's baseline.
    lay = {...lay, y: lay.y - (lay.lines.length - 1) * size * LINE_STEP};
  }
  const screen = 'screen' in p.anchor;
  const colour = INK_HEX[p.ink];
  const alpha = p.ink === 'glass' ? GLASS_ALPHA : screen && p.ink === 'graphite' ? SCREEN_INK_ALPHA : 1;
  return <SuperBody p={p} lay={lay} local={local} zoom={screen ? 1 : zoom} colour={colour} alpha={alpha} />;
};
