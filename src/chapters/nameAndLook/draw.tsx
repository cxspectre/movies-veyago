// draw.tsx — small helpers chapters 6 and 7 share: an engine page whose strokes are timed in module-local SECONDS
// (so every window comes straight from beats4), placed on the sheet by its top-left in SHEET px; a region-local SVG
// layer; a phone-shaped clip window for the screens inside the design file. Engine pages stay small (one per drawing),
// so the pencil canvases stay cheap at the dive's zoom.
import React from 'react';
import {Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useIsNear, useToLocal, type ScreenSource} from '../../kit';
import {PencilCanvas, compileSketch, type LabelSpec, type Mark, type StrokeSpec, type Untimed} from '../../paper';
import type {Point} from '../../sheet4';

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
export const smooth = (x: number): number => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
export const easeInOutCubic = (x: number): number => {
  const u = clamp01(x);
  return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
};
export const easeOutCubic = (x: number): number => 1 - (1 - clamp01(x)) ** 3;
export const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;

/** An item and the module-local seconds it draws over. */
export type Timed = {readonly item: Untimed; readonly from: number; readonly to: number};
export const at = (item: Untimed, from: number, to: number): Timed => ({item, from, to});

export type TimedPage = {readonly marks: readonly Mark[]; readonly width: number; readonly height: number; readonly from: number; readonly to: number};

/** Compile items timed in seconds into one page whose progress runs from the first start to the last end. */
export const timedPage = (id: string, items: readonly Timed[], width: number, height: number): TimedPage => {
  const from = Math.min(...items.map((i) => i.from));
  const to = Math.max(...items.map((i) => i.to));
  const span = Math.max(1e-6, to - from);
  const strokes: StrokeSpec[] = [];
  const labels: LabelSpec[] = [];
  items.forEach(({item, from: a, to: b}) => {
    const {kind, ...rest} = item;
    const timing = {from: (a - from) / span, to: (b - from) / span};
    if (kind === 'stroke') strokes.push({...(rest as Omit<StrokeSpec, 'from' | 'to'>), ...timing});
    else labels.push({...(rest as Omit<LabelSpec, 'from' | 'to'>), ...timing});
  });
  return {marks: compileSketch({id, strokes, labels}), width, height, from, to};
};

/** A timed page on the sheet: `topLeft` in SHEET px; `scale` sheet px per page px. Hidden before its first stroke. */
export const PageOnSheet: React.FC<{page: TimedPage; topLeft: Point; t: number; zoom: number; scale?: number; opacity?: number; style?: React.CSSProperties}> = ({
  page,
  topLeft,
  t,
  zoom,
  scale = 1,
  opacity = 1,
  style,
}) => {
  const toLocal = useToLocal();
  if (t < page.from || opacity <= 0.002) return null;
  const [x, y] = toLocal(topLeft);
  const progress = clamp01((t - page.from) / (page.to - page.from));
  return (
    <div style={{position: 'absolute', left: x, top: y, width: page.width, height: page.height, transform: scale === 1 ? undefined : `scale(${scale})`, transformOrigin: '0 0', opacity, ...style}}>
      <PencilCanvas marks={page.marks} progress={progress} width={page.width} height={page.height} zoom={zoom * scale} style={{left: 0, top: 0}} />
    </div>
  );
};

/** A region-local SVG layer that may draw anywhere (no clipping box). */
export const Layer: React.FC<{children: React.ReactNode; opacity?: number}> = ({children, opacity = 1}) => (
  <svg style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible', opacity}}>{children}</svg>
);

/**
 * A real clip (or still) in a rounded phone-shaped window, in its parent's px. The clip's second `playFrom` (default
 * the manifest's hotStart) shows at module second `start`. Video decodes only when the sheet is near; else the poster.
 */
export const ClipWindow: React.FC<{source: ScreenSource; start: number; t: number; x: number; y: number; w: number; h: number; radius?: number; playFrom?: number; style?: React.CSSProperties}> = ({
  source,
  start,
  t,
  x,
  y,
  w,
  h,
  radius = 22,
  playFrom,
  style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const near = useIsNear();
  const media: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: w, height: h, objectFit: 'cover', maxWidth: 'none', display: 'block'};
  const seqFrom = frame + Math.round((start - t) * fps);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: radius, overflow: 'hidden', background: '#0B0B0C', ...style}}>
      {source.kind === 'still' ? (
        <Img src={staticFile(source.src)} style={media} />
      ) : near ? (
        <Sequence from={seqFrom} layout="none" name={`clip-${source.id}`}>
          <OffthreadVideo src={staticFile(source.src)} trimBefore={Math.round((playFrom ?? source.hotStart) * fps)} muted style={media} />
        </Sequence>
      ) : (
        <Img src={staticFile(source.poster)} style={media} />
      )}
    </div>
  );
};
