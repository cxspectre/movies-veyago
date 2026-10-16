// LineCanvas.tsx — one pencil canvas for the line: deposit -> develop against the paper tooth -> normal alpha.
// The same three steps as the engine's PencilCanvas (deposit.ts, develop.ts, toothBuffer.ts are the engine's own), with
// two additions the endless sheet needs: the tooth is anchored to the SHEET, so the grain travels with the paper when the
// camera moves, and an optional recolour for sepia (the engine only knows graphite and accent until S1-B lands).
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {cancelRender, continueRender, delayRender} from 'remotion';
import type {Mark} from '../paper/marks/types';
import {depositMarks} from '../paper/render/deposit';
import {develop} from '../paper/render/develop';
import {toothBuffer} from '../paper/render/toothBuffer';
import {loadTexture} from '../paper/textures';
import type {Box} from './lineMarks';

export type LineCanvasProps = {
  readonly marks: readonly Mark[];
  readonly progress: number;
  /** Screen-px box this canvas covers. */
  readonly box: Box;
  /** Tooth scale: logical px per screen px is 1/toothZoom (the canvas works in tooth-logical px). */
  readonly toothZoom: number;
  /** Screen px of the sheet origin, to anchor the grain to the paper. */
  readonly origin: readonly [number, number];
  /** Replace the colour of every drawn pixel (alpha unchanged), as rgb. Used for sepia. */
  readonly recolour?: readonly [number, number, number];
};

type Buffers = {deposit: CanvasRenderingContext2D; scratch: CanvasRenderingContext2D; image: ImageData | null};

const context = (w: number, h: number, readBack: boolean): CanvasRenderingContext2D => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', {willReadFrequently: readBack});
  if (!ctx) throw new Error('Endless sheet: could not create a 2D canvas context');
  return ctx;
};

const ensure = (prev: Buffers | null, w: number, h: number): Buffers =>
  prev && prev.deposit.canvas.width === w && prev.deposit.canvas.height === h
    ? prev
    : {deposit: context(w, h, true), scratch: prev?.scratch ?? context(64, 64, false), image: null};

const recolourPixels = (data: Uint8ClampedArray, rgb: readonly [number, number, number]): void => {
  for (let j = 0; j < data.length; j += 4) {
    if (data[j + 3] === 0) continue;
    data[j] = rgb[0];
    data[j + 1] = rgb[1];
    data[j + 2] = rgb[2];
  }
};

export const LineCanvas: React.FC<LineCanvasProps> = ({marks, progress, box, toothZoom: tz, origin, recolour}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const buffers = useRef<Buffers | null>(null);
  const released = useRef(false);
  const [handle] = useState(() => delayRender('Endless sheet: paper tooth'));
  const [tooth, setTooth] = useState<HTMLImageElement | null>(null);
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  const density = Math.max(0.5, tz * dpr);
  const logicalW = box.w / tz;
  const logicalH = box.h / tz;
  const w = Math.max(1, Math.round(logicalW * density));
  const h = Math.max(1, Math.round(logicalH * density));
  const grain = {x: (box.x - origin[0]) / tz, y: (box.y - origin[1]) / tz};

  useEffect(() => {
    Promise.all([loadTexture('tooth'), document.fonts.ready])
      .then(([img]) => setTooth(img))
      .catch((error: unknown) => cancelRender(error instanceof Error ? error : new Error(String(error))));
  }, []);

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!tooth || !canvas) return;
    try {
      const out = canvas.getContext('2d', {willReadFrequently: true});
      if (!out) throw new Error('Endless sheet: no 2D context on the line canvas');
      const b = ensure(buffers.current, w, h);
      depositMarks({ctx: b.deposit, scratch: b.scratch, density}, marks, progress);
      const image = b.image ?? out.createImageData(w, h);
      develop(b.deposit.getImageData(0, 0, w, h).data, toothBuffer(tooth, w, h, density, grain), image.data);
      if (recolour) recolourPixels(image.data, recolour);
      out.putImageData(image, 0, 0);
      buffers.current = {...b, image};
    } catch (error) {
      cancelRender(error instanceof Error ? error : new Error(String(error)));
    }
    if (!released.current) {
      released.current = true;
      continueRender(handle);
    }
  }, [tooth, marks, progress, w, h, density, grain.x, grain.y, recolour, handle]);

  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      style={{position: 'absolute', left: box.x, top: box.y, width: logicalW, height: logicalH, transform: `scale(${tz})`, transformOrigin: '0 0', pointerEvents: 'none'}}
    />
  );
};
