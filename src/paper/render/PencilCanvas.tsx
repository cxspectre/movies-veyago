// PencilCanvas.tsx — renders compiled marks as graphite / coloured pencil on a transparent canvas.
// One canvas layer per page: deposit (additive, offscreen) -> develop against the paper tooth -> normal alpha over the paper
// (colours are pre-multiplied against the nominal paper colour, so it reads as pencil multiplied onto paper).
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {cancelRender, continueRender, delayRender} from 'remotion';
import type {Mark} from '../marks/types';
import {loadTexture} from '../textures';
import {depositMarks} from './deposit';
import {develop} from './develop';
import {toothBuffer} from './toothBuffer';

export type PencilCanvasProps = {
  readonly marks: readonly Mark[];
  /** Page progress 0-1 (fraction of drawFrames). */
  readonly progress: number;
  /** Logical size of the drawing surface (sketch px). */
  readonly width: number;
  readonly height: number;
  /** Device px per sketch px. Defaults to the render scale (window.devicePixelRatio). */
  readonly density?: number;
  /** Extra magnification when a parent scales this page up (keeps the grain crisp in close-ups). */
  readonly zoom?: number;
  /** Shifts the paper grain (sketch px); pass the same value to <PaperSheet grainOffset>. */
  readonly grainOffset?: {x: number; y: number};
  readonly style?: React.CSSProperties;
};

const MIN_DENSITY = 0.5;
const MAX_DENSITY = 4;
const NO_OFFSET = {x: 0, y: 0};

const renderDensity = (density: number | undefined, zoom: number): number => {
  const base = density ?? (typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1);
  return Math.min(MAX_DENSITY, Math.max(MIN_DENSITY, base * zoom));
};

type Buffers = {deposit: CanvasRenderingContext2D; scratch: CanvasRenderingContext2D; image: ImageData | null};

const makeContext = (w: number, h: number, readBack: boolean): CanvasRenderingContext2D => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', {willReadFrequently: readBack});
  if (!ctx) throw new Error('Paper engine: could not create a 2D canvas context');
  return ctx;
};

const ensureBuffers = (prev: Buffers | null, w: number, h: number): Buffers => {
  if (prev && prev.deposit.canvas.width === w && prev.deposit.canvas.height === h) return prev;
  return {deposit: makeContext(w, h, true), scratch: prev?.scratch ?? makeContext(64, 64, false), image: null};
};

const loadAssets = async (): Promise<HTMLImageElement> => {
  const [img] = await Promise.all([loadTexture('tooth'), document.fonts.ready]);
  return img;
};

export const PencilCanvas: React.FC<PencilCanvasProps> = ({marks, progress, width, height, density, zoom = 1, grainOffset = NO_OFFSET, style}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buffers = useRef<Buffers | null>(null);
  const released = useRef(false);
  const [handle] = useState(() => delayRender('Paper engine: paper tooth'));
  const [tooth, setTooth] = useState<HTMLImageElement | null>(null);
  const d = renderDensity(density, zoom);
  const w = Math.max(1, Math.round(width * d));
  const h = Math.max(1, Math.round(height * d));
  const u = Math.min(1, Math.max(0, progress));

  useEffect(() => {
    loadAssets()
      .then(setTooth)
      .catch((error: unknown) => cancelRender(error instanceof Error ? error : new Error(String(error))));
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!tooth || !canvas) return;
    try {
      const out = canvas.getContext('2d', {willReadFrequently: true});
      if (!out) throw new Error('Paper engine: no 2D context on the page canvas');
      const b = ensureBuffers(buffers.current, w, h);
      depositMarks({ctx: b.deposit, scratch: b.scratch, density: d}, marks, u);
      const image = b.image ?? out.createImageData(w, h);
      develop(b.deposit.getImageData(0, 0, w, h).data, toothBuffer(tooth, w, h, d, grainOffset), image.data);
      out.putImageData(image, 0, 0);
      buffers.current = {...b, image};
    } catch (error) {
      cancelRender(error instanceof Error ? error : new Error(String(error)));
    }
    if (!released.current) {
      released.current = true;
      continueRender(handle);
    }
  }, [tooth, marks, u, w, h, d, grainOffset.x, grainOffset.y, handle]);

  return (
    <canvas
      ref={canvasRef}
      width={w}
      height={h}
      style={{position: 'absolute', left: 0, top: 0, width, height, pointerEvents: 'none', ...style}}
    />
  );
};
