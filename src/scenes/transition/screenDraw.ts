// screenDraw.ts — what the rig's screen shows between the lift-off and the last snap: black glass, then band by
// band the real pixels of binder-home.png crossfading in at their exact mapped places (BIBLE 5.5), scaling
// 1.03 -> 1.00. Bands tile the screen (sketches/binder-home-v2/layout.ts), so when every band has landed the whole
// still is on the glass. Drawn into the rig's `draw` screen source (1206 x 2622 px, the still's own pixels).
import {HOME_GROUPS, HOME_LAYOUT} from '../../sketches/binder-home-v2/layout';
import {snapState, STATUS_SNAP} from './timing';

export {BINDER_HOME_STILL} from './homeScreen';

const BLACK = '#000000';

/** The Dynamic Island, drawn as the bands around it turn real (the clean still has none; the rig's own pill takes over). */
const drawIsland = (ctx: CanvasRenderingContext2D, alpha: number): void => {
  const {scale} = HOME_LAYOUT.screen;
  const i = HOME_LAYOUT.dynamicIsland;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = BLACK;
  const path = new Path2D();
  path.roundRect(i.x * scale, i.y * scale, i.w * scale, i.h * scale, (i.h * scale) / 2);
  ctx.fill(path);
};

export const drawScreenBands = (ctx: CanvasRenderingContext2D, still: CanvasImageSource, t: number): void => {
  const {wPx, hPx} = HOME_LAYOUT.screen;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, wPx, hPx);
  for (const region of HOME_GROUPS) {
    const s = snapState(t, region.snap ?? STATUS_SNAP);
    if (s.pixelAlpha <= 0) continue;
    const c = region.crop.dark;
    const cx = c.x + c.w / 2;
    const cy = c.y + c.h / 2;
    const k = s.pixelScale;
    ctx.globalAlpha = s.pixelAlpha;
    ctx.drawImage(still, c.x, c.y, c.w, c.h, cx - (c.w * k) / 2, cy - (c.h * k) / 2, c.w * k, c.h * k);
  }
  const status = snapState(t, STATUS_SNAP);
  if (status.pixelAlpha > 0) drawIsland(ctx, status.pixelAlpha);
  ctx.globalAlpha = 1;
};
