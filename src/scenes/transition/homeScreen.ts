// homeScreen.ts — the phone's screen for the glass world: binder-home.png loaded once and patched
// (homeStillPatch.ts), handed to the rig as a `draw` source so the same pixels serve the transition's snaps, the
// family of devices and the pair. The render waits for it (delayRender); scenes show the void until it is here.
import {useEffect, useRef, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';
import {SCREEN_PX, type ScreenSource} from '../../devices';
import {patchHomeStill} from './homeStillPatch';

export const BINDER_HOME_STILL = 'footage/binder-home.png';

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`homeScreen: could not load ${src}`));
    img.src = staticFile(src);
  });

const patched = (img: HTMLImageElement): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('homeScreen: no 2D context');
  ctx.drawImage(img, 0, 0);
  patchHomeStill(ctx);
  return canvas;
};

const ready = new Map<string, HTMLCanvasElement>();
const loading = new Map<string, Promise<HTMLCanvasElement>>();

/** The patched still, once per page (every scene of the master shares it). */
const loadPatchedStill = (src: string): Promise<HTMLCanvasElement> => {
  const pending = loading.get(src);
  if (pending) return pending;
  const p = loadImage(src).then((img) => {
    const canvas = patched(img);
    ready.set(src, canvas);
    return canvas;
  });
  loading.set(src, p);
  return p;
};

/**
 * The patched binder-home still as a canvas, or null until it has loaded. The render is held meanwhile, and the
 * hold is released only AFTER the commit that mounts the stage with the still: Remotion reports "ready" the
 * moment no handle is pending, so releasing it in the load callback (before React re-rendered) let a frame be
 * captured before the stage, its GL frame and the rigs' own texture loads (each with their own handle) existed.
 */
export const useHomeStill = (): HTMLCanvasElement | null => {
  const [still, setStill] = useState<HTMLCanvasElement | null>(() => ready.get(BINDER_HOME_STILL) ?? null);
  const [handle] = useState<number | null>(() => (ready.has(BINDER_HOME_STILL) ? null : delayRender(`homeScreen: ${BINDER_HOME_STILL}`)));
  const released = useRef(false);
  useEffect(() => {
    if (still) return undefined;
    let cancelled = false;
    loadPatchedStill(BINDER_HOME_STILL)
      .then((canvas) => {
        if (!cancelled) setStill(canvas);
      })
      .catch((error: unknown) => cancelRender(error instanceof Error ? error : new Error(String(error))));
    return () => {
      cancelled = true;
    };
  }, [still]);
  useEffect(() => {
    // Runs after the commit in which the stage mounted with the still (its layout effects have already run).
    if (still && handle !== null && !released.current) {
      released.current = true;
      continueRender(handle);
    }
  }, [still, handle]);
  useEffect(
    () => () => {
      if (handle !== null && !released.current) {
        released.current = true;
        continueRender(handle);
      }
    },
    [handle],
  );
  return still;
};

/** The rig's screen source showing the patched still (the still's own pixels, 1206 x 2622). */
export const homeScreenSource = (still: HTMLCanvasElement): ScreenSource => ({
  kind: 'draw',
  width: SCREEN_PX.width,
  height: SCREEN_PX.height,
  draw: (ctx) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(still, 0, 0, SCREEN_PX.width, SCREEN_PX.height);
  },
});
