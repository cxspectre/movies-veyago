// hairlineHead.ts — the re-tracing head: a 14 px white dot with a #9FB4FF halo and a short comet behind it, so it
// reads on cream paper as well as in the void. On paper it also casts the same dark under-shadow as the lines
// (see hairlineCanvas.ts PAPER_HALO), so it never dissolves into the sheet. Coordinates are sketch px; sizes are
// logical px, converted through `space`.
import {HAIRLINE, rgba} from '../../glass';
import type {LightHead} from './conversion';
import {PAPER_HALO, type CanvasSpace} from './hairlineSpace';

/** The head's look (logical px). */
export const HEAD = {
  corePx: 14,
  coreColor: '#FFFFFF',
  coreOpacity: 0.95,
  haloPx: 10,
  haloColor: '#9FB4FF',
  haloOpacity: 0.4,
  cometPx: 6,
  cometOpacity: 0.7,
} as const;

const disc = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, blur: number, shadow: string): void => {
  ctx.shadowColor = shadow;
  ctx.shadowBlur = blur;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
};

/** The comet's under-shadow on paper is this much wider than the comet (logical px). */
const COMET_SHADOW_EXTRA_PX = 4;

const fadingStroke = (ctx: CanvasRenderingContext2D, path: Path2D, from: {x: number; y: number}, to: {x: number; y: number}, color: string, opacity: number, width: number): void => {
  const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
  gradient.addColorStop(0, rgba(color, opacity));
  gradient.addColorStop(1, rgba(color, 0));
  ctx.strokeStyle = gradient;
  ctx.lineWidth = width;
  ctx.stroke(path);
};

/** The comet: a stroke along the tail fading from the head's colour to nothing (over a dark fade on paper). */
const drawComet = (ctx: CanvasRenderingContext2D, item: LightHead, alpha: number, space: CanvasSpace): void => {
  const [head, ...rest] = item.tail;
  const end = rest[rest.length - 1];
  if (!head || !end || rest.length === 0) return;
  const path = new Path2D();
  path.moveTo(head.x, head.y);
  rest.forEach((p) => path.lineTo(p.x, p.y));
  const toSketch = 1 / space.sketchToLogical;
  if (space.paperHalo > 0) {
    fadingStroke(ctx, path, head, end, PAPER_HALO.shadowColor, PAPER_HALO.shadowOpacity * 2.5 * space.paperHalo * alpha, (HEAD.cometPx + COMET_SHADOW_EXTRA_PX) * toSketch);
  }
  fadingStroke(ctx, path, head, end, HEAD.coreColor, HEAD.cometOpacity * alpha, HEAD.cometPx * toSketch);
};

/** The head at HAIRLINE.headFlare brightness (the comet first, then the halo, then the core). */
export const drawHead = (ctx: CanvasRenderingContext2D, item: LightHead, space: CanvasSpace): void => {
  const alpha = Math.min(1, item.alpha * HAIRLINE.headFlare);
  const toSketch = 1 / space.sketchToLogical;
  const core = (HEAD.corePx / 2) * toSketch;
  const halo = core + HEAD.haloPx * toSketch;
  if (space.paperHalo > 0) {
    const k = space.paperHalo * alpha;
    disc(ctx, item.x, item.y, halo, rgba(PAPER_HALO.shadowColor, PAPER_HALO.shadowOpacity * 1.6 * k), PAPER_HALO.shadowPx * space.blurUnit, rgba(PAPER_HALO.shadowColor, PAPER_HALO.shadowOpacity * 1.6 * k));
  }
  drawComet(ctx, item, alpha, space);
  disc(ctx, item.x, item.y, halo, rgba(HEAD.haloColor, HEAD.haloOpacity * alpha), HEAD.haloPx * space.blurUnit, rgba(HEAD.haloColor, HEAD.haloOpacity * alpha));
  disc(ctx, item.x, item.y, core, rgba(HEAD.coreColor, HEAD.coreOpacity * alpha), 0, 'transparent');
};
