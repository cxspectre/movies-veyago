// ScreenOnPaper.tsx — a laptop or a phone drawn by the pencil (the engine's hand shapes, with their wobble and a rough
// first pass), with a real clip or a still masked inside its screen. The clip decodes only while the region is near
// (BIBLE4 §1.6); at mid and far zoom the screen shows the clip's poster. The laptop is generic: no logo, no notch.
import React, {useMemo} from 'react';
import {Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {compileSketch, handCircle, handLine, handRect, PencilCanvas, sequence, stroke, type Ink, type SketchSpec, type Untimed} from '../paper';
import {translateSpec} from '../characters/figure';
import type {Point} from '../sheet4';
import {clamp01, smoothstep, useIsNear, useLocalSeconds, useSheetZoom, useToLocal} from './context';
import type {ScreenSource} from './footage';

export type Device = 'laptop' | 'phone';
export type ScreenFit = 'cover' | 'contain';

export type ScreenOnPaperProps = {
  readonly device: Device;
  readonly source: ScreenSource;
  /** The device's centre. In SHEET px inside a ChapterShell (converted to region-local), else the parent's px. */
  readonly at: Point;
  /** 1 = a phone 200 px wide (BIBLE4 §5.7's drawn phone) / a laptop 1080 px wide at the base (§5.6). */
  readonly scale?: number;
  /** Module-local seconds the pencil starts drawing the frame, and how long it takes (default 1.5 s). */
  readonly drawStart?: number;
  readonly drawDuration?: number;
  /** When the screen content fades in (default: as the frame finishes), and over how long (default 0.5 s). */
  readonly contentStart?: number;
  readonly contentFade?: number;
  /** Clip second shown at `contentStart` (default the manifest's hotStart). */
  readonly playFrom?: number;
  /** Decode video only when true. Default: the sheet's LOD is near (true outside the sheet). */
  readonly near?: boolean;
  /** Default: phone 'cover' (clips are the phone's own aspect), laptop 'contain' on the dark screen. */
  readonly fit?: ScreenFit;
  /** Laptop screen aspect, width / height (default 16 / 10). The phone always takes the source's aspect. */
  readonly screenAspect?: number;
  /** Screen colour behind the content (default the imagined design file's #0B0B0C, contract 13.4). */
  readonly screenColour?: string;
  readonly ink?: Ink;
  readonly seed?: number;
  readonly time?: number;
};

const SCREEN_DARK = '#0B0B0C';
const PAD = 16; // canvas margin around the drawing (rough passes and overshoots)

type Rect = {x: number; y: number; w: number; h: number; r: number};
export type DeviceGeometry = {width: number; height: number; screen: Rect; items: readonly Untimed[]};

/** The device drawing in its own px (origin top-left of its bounding box), at `scale`. Pure. */
export const deviceGeometry = (device: Device, source: ScreenSource, scale: number, aspect: number, ink: Ink, seed: number): DeviceGeometry => {
  const s = scale;
  if (device === 'phone') {
    const bezel = Math.max(5, 8 * s);
    const sw = 184 * s;
    const sh = (sw * source.height) / source.width;
    const bw = sw + bezel * 2;
    const bh = sh + bezel * 2;
    const items: Untimed[] = [
      stroke('body', handRect(0, 0, bw, bh, seed, {radius: 30 * s, overshoot: 6}), {ink, width: 2.2, rough: true}),
      stroke('screen', handRect(bezel, bezel, sw, sh, seed + 1, {radius: 24 * s, overshoot: 3}), {ink, width: 1.4, pressure: 0.75}),
      stroke('power', handLine(bw + 2.5, bh * 0.22, bw + 2.5, bh * 0.31, seed + 2), {ink, width: 2.2}),
      stroke('volume', `${handLine(-2.5, bh * 0.2, -2.5, bh * 0.25, seed + 3)} ${handLine(-2.5, bh * 0.28, -2.5, bh * 0.36, seed + 4)}`, {ink, width: 2.2}),
    ];
    return {width: bw, height: bh, screen: {x: bezel, y: bezel, w: sw, h: sh, r: 24 * s}, items};
  }
  const sw = 900 * s;
  const sh = sw / aspect;
  const side = 34 * s;
  const topB = 30 * s;
  const bottomB = 40 * s;
  const lidW = sw + side * 2;
  const lidH = sh + topB + bottomB;
  const baseW = 1080 * s;
  const baseH = Math.max(14, 34 * s);
  const lidX = (baseW - lidW) / 2;
  const notch = 140 * s;
  const items: Untimed[] = [
    stroke('lid', handRect(lidX, 0, lidW, lidH, seed, {radius: 18 * s, overshoot: 7}), {ink, width: 2.2, rough: true}),
    stroke('screen', handRect(lidX + side, topB, sw, sh, seed + 1, {radius: 6 * s, overshoot: 4}), {ink, width: 1.4, pressure: 0.75}),
    stroke('camera', handCircle(baseW / 2, topB / 2, 3.5 * s + 1, 3.5 * s + 1, seed + 2), {ink, width: 1.2, pressure: 0.7}),
    stroke('base', handRect(0, lidH, baseW, baseH, seed + 3, {radius: 10 * s, overshoot: 7}), {ink, width: 2.2, rough: true}),
    stroke('notch', handLine(baseW / 2 - notch / 2, lidH + baseH * 0.38, baseW / 2 + notch / 2, lidH + baseH * 0.38, seed + 4, {bow: 4 * s}), {ink, width: 1.4, pressure: 0.6}),
  ];
  return {width: baseW, height: lidH + baseH, screen: {x: lidX + side, y: topB, w: sw, h: sh, r: 6 * s}, items};
};

/** Content box inside the screen (explicit px, so nothing depends on object-fit). */
const fitBox = (screen: Rect, w: number, h: number, fit: ScreenFit): {left: number; top: number; width: number; height: number} => {
  const k = fit === 'cover' ? Math.max(screen.w / w, screen.h / h) : Math.min(screen.w / w, screen.h / h);
  const width = w * k;
  const height = h * k;
  return {left: (screen.w - width) / 2, top: (screen.h - height) / 2, width, height};
};

export const ScreenOnPaper: React.FC<ScreenOnPaperProps> = ({
  device,
  source,
  at,
  scale = 1,
  drawStart = 0,
  drawDuration = 1.5,
  contentStart,
  contentFade = 0.5,
  playFrom,
  near,
  fit,
  screenAspect = 16 / 10,
  screenColour = SCREEN_DARK,
  ink = 'graphite',
  seed = 7,
  time,
}) => {
  const t = useLocalSeconds(time);
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const zoom = useSheetZoom();
  const isNear = useIsNear();
  const toLocal = useToLocal();
  const geo = useMemo(() => deviceGeometry(device, source, scale, screenAspect, ink, seed), [device, source, scale, screenAspect, ink, seed]);
  const marks = useMemo(() => {
    const spec: SketchSpec = {id: `screen-${device}-${seed}`, ...sequence(geo.items, 0, 1, 0.08)};
    return compileSketch(translateSpec(spec, PAD, PAD));
  }, [geo, device, seed]);
  if (t < drawStart) return null;
  const [cx, cy] = toLocal(at);
  const left = cx - geo.width / 2;
  const top = cy - geo.height / 2;
  const drawK = clamp01((t - drawStart) / drawDuration);
  const showAt = contentStart ?? drawStart + drawDuration;
  const contentK = smoothstep((t - showAt) / contentFade);
  const live = (near ?? isNear) && source.kind === 'video';
  const box = fitBox(geo.screen, source.width, source.height, fit ?? (device === 'phone' ? 'cover' : 'contain'));
  const media: React.CSSProperties = {position: 'absolute', left: box.left, top: box.top, width: box.width, height: box.height, maxWidth: 'none', display: 'block'};
  // Frames from now until the content starts, in this component's own frame count (works in a region or an overlay).
  const seqFrom = frame + Math.round((showAt - t) * fps);
  return (
    <div style={{position: 'absolute', left, top, width: geo.width, height: geo.height}}>
      {contentK > 0.001 ? (
        <div
          style={{
            position: 'absolute',
            left: geo.screen.x,
            top: geo.screen.y,
            width: geo.screen.w,
            height: geo.screen.h,
            borderRadius: geo.screen.r,
            overflow: 'hidden',
            background: screenColour,
            opacity: contentK,
          }}
        >
          {source.kind === 'still' ? (
            <Img src={staticFile(source.src)} style={media} />
          ) : live ? (
            <Sequence from={seqFrom} layout="none" name={`screen-${source.id}`}>
              <OffthreadVideo src={staticFile(source.src)} trimBefore={Math.round((playFrom ?? source.hotStart) * fps)} muted style={media} />
            </Sequence>
          ) : (
            <Img src={staticFile(source.poster)} style={media} />
          )}
        </div>
      ) : null}
      <PencilCanvas marks={marks} progress={drawK} width={geo.width + PAD * 2} height={geo.height + PAD * 2} zoom={zoom} style={{left: -PAD, top: -PAD}} />
    </div>
  );
};
