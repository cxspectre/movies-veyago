// watchClockPatch.ts — the Watch captures show the real time (10:15); the film's devices all read 9:41.
// A black patch (sampled from the frame, so it matches the video's own black exactly) plus 9:41 in DM Sans of the same
// digit height, right-aligned on the old digits' baseline (CONTRACT 12.2).
import {WATCH_CLOCK, WATCH_SCREEN_PX} from '../watch/watchSpec';
import type {ScreenPatch} from './useScreenTexture';

export const patchWatchClock: ScreenPatch = (ctx, width, height) => {
  const sx = width / WATCH_SCREEN_PX.width;
  const sy = height / WATCH_SCREEN_PX.height;
  const c = WATCH_CLOCK;
  const sample = ctx.getImageData(Math.round(c.sample.x * sx), Math.round(c.sample.y * sy), 1, 1).data;
  ctx.save();
  ctx.fillStyle = `rgb(${sample[0] ?? 0}, ${sample[1] ?? 0}, ${sample[2] ?? 0})`;
  ctx.fillRect(c.cover.x * sx, c.cover.y * sy, c.cover.w * sx, c.cover.h * sy);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `${c.weight} ${c.fontSize * sy}px "DM Sans"`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(c.text, c.right * sx, c.baseline * sy);
  ctx.restore();
};
