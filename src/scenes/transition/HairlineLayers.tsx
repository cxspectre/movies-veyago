// HairlineLayers.tsx — the DOM canvases that carry the light. `PhoneHairlines` is a canvas in screen-point space
// pinned onto the glass with a homography (so the same drawing sits on the paper, then on the turning phone);
// `PageHairlines` is a frame-sized canvas in page space for what lies outside the phone (the corner "2").
import React, {useLayoutEffect, useRef} from 'react';
import {SCREEN_AREA, SCREEN_SCALE} from '../../sketches/binder-home-v2/layout';
import type {LightItem} from './conversion';
import {OVERLAY_RECT, overlayTransform, ptToLogical, type PageTransform, type Pose, type Size, type Stretch} from './geometry';
import {drawLightItems, type CanvasSpace} from './hairlineCanvas';

export const useDpr = (): number => (typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1);

const canvasStyle: React.CSSProperties = {position: 'absolute', left: 0, top: 0, pointerEvents: 'none', transformOrigin: '0 0'};

type Paint = (ctx: CanvasRenderingContext2D, backing: Size) => void;

/** A canvas that repaints synchronously every frame (fonts are loaded by FilmShell before any frame renders). */
const PaintedCanvas: React.FC<{css: Size; backing: Size; transform?: string; opacity?: number; paint: Paint}> = ({css, backing, transform, opacity = 1, paint}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paint(ctx, {width: canvas.width, height: canvas.height});
  });
  return (
    <canvas
      ref={ref}
      width={backing.width}
      height={backing.height}
      style={{...canvasStyle, width: css.width, height: css.height, transform, opacity}}
    />
  );
};

export type PhoneHairlinesProps = {
  readonly items: readonly LightItem[];
  readonly pose: Pose;
  readonly size: Size;
  readonly stretch: Stretch;
  /** 0..1 of the paper under-halo (0 in the void; PaperPhase passes paperHaloLevel). */
  readonly paperHalo?: number;
};

/** The hairlines inside the phone outline, drawn in screen points and pinned onto the glass. */
export const PhoneHairlines: React.FC<PhoneHairlinesProps> = ({items, pose, size, stretch, paperHalo = 0}) => {
  const dpr = useDpr();
  const perPt = ptToLogical(pose) * dpr;
  const backing = {width: Math.ceil(OVERLAY_RECT.w * perPt), height: Math.ceil(OVERLAY_RECT.h * perPt)};
  const paint: Paint = (ctx, b) => {
    const bx = b.width / OVERLAY_RECT.w;
    const by = b.height / OVERLAY_RECT.h;
    // sketch px -> screen points -> backing px, in one transform
    ctx.setTransform(bx / SCREEN_SCALE.x, 0, 0, by / SCREEN_SCALE.y, -(SCREEN_AREA.x / SCREEN_SCALE.x + OVERLAY_RECT.x) * bx, -(SCREEN_AREA.y / SCREEN_SCALE.y + OVERLAY_RECT.y) * by);
    const space: CanvasSpace = {sketchToLogical: ptToLogical(pose) / SCREEN_SCALE.x, blurUnit: dpr, paperHalo};
    drawLightItems(ctx, items, space);
  };
  return <PaintedCanvas css={{width: OVERLAY_RECT.w, height: OVERLAY_RECT.h}} backing={backing} transform={overlayTransform(pose, size, stretch)} paint={paint} />;
};

export type PageHairlinesProps = {
  readonly items: readonly LightItem[];
  readonly page: PageTransform;
  readonly size: Size;
  readonly opacity: number;
  readonly paperHalo?: number;
};

/** Hairlines outside the phone, in page space over the whole frame. */
export const PageHairlines: React.FC<PageHairlinesProps> = ({items, page, size, opacity, paperHalo = 0}) => {
  const dpr = useDpr();
  const paint: Paint = (ctx) => {
    ctx.setTransform(page.scale * dpr, 0, 0, page.scale * dpr, page.left * dpr, page.top * dpr);
    drawLightItems(ctx, items, {sketchToLogical: page.scale, blurUnit: dpr, paperHalo});
  };
  return <PaintedCanvas css={size} backing={{width: Math.ceil(size.width * dpr), height: Math.ceil(size.height * dpr)}} opacity={opacity} paint={paint} />;
};

