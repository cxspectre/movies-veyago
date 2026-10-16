// useScreenTexture.ts — a texture for a device screen, exactly in sync with Remotion's frame.
//
// * image: loaded once (delayRender), sRGB, mipmapped.
// * video: while RENDERING, each frame is fetched from Remotion's own frame server (the same source <OffthreadVideo>
//   uses), so frames are exact and deterministic; in the Studio a detached <video> is seeked instead.
// * draw:  a 2D canvas the caller draws into every frame.
// Every source can be `patch`ed: a 2D pass over the pixels before upload (the Watch's 9:41 clock).
// After the pixels are uploaded the hook renders the GL frame itself (frameloop 'never'), and only then releases its
// delayRender, so the captured frame can never show the previous frame's pixels.
import {useThree} from '@react-three/fiber';
import {useLayoutEffect, useMemo, useRef, type MutableRefObject} from 'react';
import {continueRender, delayRender, cancelRender, staticFile, useCurrentFrame, useRemotionEnvironment, useVideoConfig} from 'remotion';
import {NoReactInternals} from 'remotion/no-react';
import {CanvasTexture, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace, type Texture} from 'three';
import type {ScreenSource} from '../types';

export type ScreenPatch = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

const MAX_ANISOTROPY = 8;
const FRAME_TIMEOUT_MS = 60000;

type Surface = {canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; texture: CanvasTexture};

const createSurface = (): Surface => {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;
  const ctx = canvas.getContext('2d', {willReadFrequently: false});
  if (!ctx) throw new Error('useScreenTexture: no 2D context');
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = true;
  return {canvas, ctx, texture};
};

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'sync';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Screen image failed to load: ${url}`));
    img.src = url;
  });

const studioVideos = new Map<string, HTMLVideoElement>();
const seekStudioVideo = (src: string, time: number): Promise<HTMLVideoElement> => {
  const video = studioVideos.get(src) ?? Object.assign(document.createElement('video'), {src, muted: true, preload: 'auto', crossOrigin: 'anonymous'});
  studioVideos.set(src, video);
  return new Promise((resolve, reject) => {
    const done = (): void => resolve(video);
    video.onerror = () => reject(new Error(`Screen video failed: ${src}`));
    if (Math.abs(video.currentTime - time) < 1e-3 && video.readyState >= 2) return done();
    video.onseeked = done;
    video.currentTime = time;
  });
};

/** The clip second a video source shows at `frame`. */
export const clipTime = (source: Extract<ScreenSource, {kind: 'video'}>, frame: number, fps: number): number => {
  if (source.holdAt !== undefined) return Math.max(0, source.holdAt);
  const t = (source.startAt ?? 0) + (frame / fps) * (source.playbackRate ?? 1);
  return Math.max(0, source.endAt === undefined ? t : Math.min(source.endAt, t));
};

const blit = (s: Surface, image: CanvasImageSource, w: number, h: number, patch: ScreenPatch | undefined): void => {
  if (s.canvas.width !== w || s.canvas.height !== h) {
    s.canvas.width = w;
    s.canvas.height = h;
    s.texture.dispose(); // the GPU texture must be re-allocated at the new size
  }
  s.ctx.clearRect(0, 0, w, h);
  s.ctx.drawImage(image, 0, 0, w, h);
  patch?.(s.ctx, w, h);
  s.texture.needsUpdate = true;
};

type Fetched = {image: CanvasImageSource; w: number; h: number} | null;

const fetchPixels = async (source: ScreenSource, frame: number, fps: number, rendering: boolean): Promise<Fetched> => {
  if (source.kind === 'image') {
    const img = await loadImage(staticFile(source.src));
    return {image: img, w: img.naturalWidth, h: img.naturalHeight};
  }
  if (source.kind === 'video') {
    const time = clipTime(source, frame, fps);
    if (rendering) {
      const url = NoReactInternals.getOffthreadVideoSource({src: staticFile(source.src), currentTime: time, transparent: false, toneMapped: true});
      const img = await loadImage(url);
      return {image: img, w: img.naturalWidth, h: img.naturalHeight};
    }
    const video = await seekStudioVideo(staticFile(source.src), time);
    return {image: video, w: video.videoWidth, h: video.videoHeight};
  }
  return null;
};

/** A key that changes only when the pixels must change (images load once; videos change per frame). */
const sourceKey = (source: ScreenSource, frame: number, fps: number): string => {
  if (source.kind === 'image') return `image:${source.src}`;
  if (source.kind === 'video') return `video:${source.src}@${clipTime(source, frame, fps).toFixed(4)}`;
  if (source.kind === 'draw') return `draw@${frame}`;
  return 'none';
};

/** The screen's texture and whether it holds pixels yet (read `ready.current` inside useFrame). */
export type ScreenTexture = {texture: Texture; ready: MutableRefObject<boolean>};

export const useScreenTexture = (source: ScreenSource, patch?: ScreenPatch): ScreenTexture => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {isRendering} = useRemotionEnvironment();
  const gl = useThree((s) => s.gl);
  const advance = useThree((s) => s.advance);
  const surface = useMemo(createSurface, []);
  const ready = useRef(false);
  const key = sourceKey(source, frame, fps);

  useLayoutEffect(() => {
    if (source.kind === 'none') {
      ready.current = false;
      return undefined;
    }
    surface.texture.anisotropy = Math.min(MAX_ANISOTROPY, gl.capabilities.getMaxAnisotropy());
    if (source.kind === 'draw') {
      if (surface.canvas.width !== source.width || surface.canvas.height !== source.height) {
        surface.canvas.width = source.width;
        surface.canvas.height = source.height;
        surface.texture.dispose();
      }
      source.draw(surface.ctx, frame);
      patch?.(surface.ctx, source.width, source.height);
      surface.texture.needsUpdate = true;
      ready.current = true;
      return undefined;
    }
    let cancelled = false;
    const handle = delayRender(`screen pixels ${key}`, {timeoutInMilliseconds: FRAME_TIMEOUT_MS});
    fetchPixels(source, frame, fps, isRendering)
      .then((px) => {
        if (cancelled || !px) return;
        blit(surface, px.image, px.w, px.h, patch);
        ready.current = true;
        if (isRendering) advance(performance.now());
      })
      .then(() => continueRender(handle))
      .catch((error: unknown) => {
        cancelRender(error instanceof Error ? error : new Error(String(error)));
      });
    return () => {
      cancelled = true;
      continueRender(handle);
    };
    // `key` captures every input that changes the pixels.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return {texture: surface.texture, ready};
};
