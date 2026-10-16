// EndlessSheet.tsx — one canvas at sheet coordinates (SHEET, 40 000 x 8 000 logical px) with paper that never ends and a
// camera that applies the CameraKey timeline to the whole sheet. Chapters are <SheetRegion>s placed at REGIONS; only the
// regions the viewport (grown by 20%) touches mount. Everything that is not paper-bound (the pencil line, supers) goes in
// `overlay` and is drawn in screen space over the sheet.
import React from 'react';
import {Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FPS} from '../film';
import {type ChapterId, slotOf4} from '../film4';
import {DEFAULT_LAMP, lampFalloff} from '../paper/lamp';
import {TEXTURES, textureUrl} from '../paper/textures';
import {SHEET} from '../sheet4';
import {useFormat} from '../useFormat';
import {cameraAt, sheetOrigin, viewportOf} from './camera';
import {farImageFile, farOpacity, farVariantAt, lodOf} from './lod';
import {SheetContext, type SheetState} from './sheetContext';

export type EndlessSheetProps = {
  /** The regions (<SheetRegion>), drawn in sheet space under the camera. */
  readonly children?: React.ReactNode;
  /** Screen-space layers over the sheet: the PencilLine, screen supers. */
  readonly overlay?: React.ReactNode;
  /** Master seconds of this component's frame 0. Default 0 (the whole film). */
  readonly startSeconds?: number;
  /** Alternative to startSeconds: this chapter's start. For a chapter alone (module-local frames). */
  readonly chapterId?: ChapterId;
  /** Outline every region's bounds (review stills). */
  readonly showBounds?: boolean;
};

/** The albedo's mean colour: what the paper is when its texture is too small to see. */
const PAPER_MEAN = 'rgb(246, 241, 231)';
const TEXTURE_FADE = {sharp: 420, gone: 160} as const; // tile size on screen (px) at which the fibre fades out

const smooth = (t: number): number => {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};

const PaperLayer: React.FC<{zoom: number; origin: readonly [number, number]}> = ({zoom, origin}) => {
  const tile = TEXTURES.paper.logical * zoom;
  const fibre = smooth((tile - TEXTURE_FADE.gone) / (TEXTURE_FADE.sharp - TEXTURE_FADE.gone));
  const mod = (v: number): number => ((v % tile) + tile) % tile;
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: PAPER_MEAN}} />
      {fibre > 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: fibre,
            backgroundImage: `url(${textureUrl('paper')})`,
            backgroundSize: `${tile}px ${tile}px`,
            backgroundPosition: `${mod(origin[0])}px ${mod(origin[1])}px`,
          }}
        />
      ) : null}
    </>
  );
};

/** The far image: the glimpses (rough hero shapes) until 9:30, the finished regions after. Full below LOD.far, gone by 0.3. */
const FarLayer: React.FC<{master: number; zoom: number}> = ({master, zoom}) => {
  const opacity = farOpacity(zoom);
  if (opacity <= 0.001) return null;
  return (
    <Img
      src={staticFile(farImageFile(farVariantAt(master)))}
      style={{position: 'absolute', left: 0, top: 0, width: SHEET.width, height: SHEET.height, opacity, maxWidth: 'none'}}
    />
  );
};

export const EndlessSheet: React.FC<EndlessSheetProps> = ({children, overlay, startSeconds = 0, chapterId, showBounds = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {format, width, height} = useFormat();
  const start = chapterId ? slotOf4(chapterId).start : startSeconds;
  const masterSeconds = start + frame / (fps || FPS);
  const camera = cameraAt(format, masterSeconds);
  const state: SheetState = {
    format,
    width,
    height,
    masterSeconds,
    startSeconds: start,
    camera,
    viewport: viewportOf(camera, width, height),
    lod: lodOf(camera.zoom),
    showBounds,
  };
  const origin = sheetOrigin(camera, width, height);
  return (
    <SheetContext.Provider value={state}>
      <div style={{position: 'absolute', inset: 0, width, height, overflow: 'hidden', background: PAPER_MEAN}}>
        <PaperLayer zoom={camera.zoom} origin={origin} />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            transform: `translate(${origin[0]}px, ${origin[1]}px) scale(${camera.zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <FarLayer master={masterSeconds} zoom={camera.zoom} />
          {children}
        </div>
        {/* The lamp stays where it is while the paper moves under it: a faint falloff, in screen space. */}
        <div style={{position: 'absolute', inset: 0, background: lampFalloff(DEFAULT_LAMP, 0.05), pointerEvents: 'none'}} />
        {overlay}
      </div>
    </SheetContext.Provider>
  );
};
