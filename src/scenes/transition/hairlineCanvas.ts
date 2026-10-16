// hairlineCanvas.ts — draws LightItems as hairlines of light on a 2D canvas (BIBLE 3 numbers via hairlineStyle).
// The context is already transformed so that drawing coordinates are SKETCH px; the caller says how those relate to
// logical px (line widths follow the transform) and how backing px relate to logical px (blur radii do not).
// Normal blending only; the glow is a blurred pass under the core, never a blend mode (CONTRACT 12.3).
// While the paper is still light (`paperHalo` > 0) every hairline also gets a darker under-halo (a tight accent
// halo and a soft dark shadow), so the light reads as a lit tube on cream instead of an erased line.
import {HAIRLINE, hairlineStyle, rgba, type HairlineInk} from '../../glass';
import type {GlyphMark, PathMark} from '../../paper';
import {indexAtTime, tipAt} from '../../paper/marks/sample';
import {metricsOf} from '../../paper/text/handLayout';
import type {LightGlyph, LightItem, LightPath} from './conversion';
import {drawHead} from './hairlineHead';
import {PAPER_HALO, type CanvasSpace} from './hairlineSpace';

export {PAPER_HALO, type CanvasSpace} from './hairlineSpace';

/** The glyph's clip runs this far above the baseline and below it (fractions of the size). */
const GLYPH_CLIP_ABOVE = 1.3;
const GLYPH_CLIP_BELOW = 0.5;
const GLYPH_CLIP_PAD = 0.2;
/** The wide pass under the core is this many core widths. */
const GLOW_PASS_WIDTHS = 2;
/** The soft shadow pass under a line is this many core widths wide (its blur does the rest). */
const SHADOW_PASS_WIDTHS = 3;

const visiblePath = (m: PathMark, local: number): Path2D | null => {
  const pts = local >= 1 ? m.pts : [...m.pts.slice(0, indexAtTime(m.pts, local) + 1), tipAt(m.pts, local).pt];
  if (pts.length < 2) return null;
  const path = new Path2D();
  pts.forEach((p, i) => (i === 0 ? path.moveTo(p.x, p.y) : path.lineTo(p.x, p.y)));
  return path;
};

type Pass = {color: string; width: number; blur: number};
type Passes = {shadow: Pass | null; halo: Pass | null; glow: Pass; core: Pass};

const passesOf = (ink: HairlineInk, level: number, alpha: number, space: CanvasSpace, widthPx?: number): Passes => {
  const s = hairlineStyle(ink, level);
  // An explicit width keeps the level's widening (level > 1 reads as brighter by being a touch wider).
  const core = widthPx === undefined ? s.core.widthPx : (widthPx * s.core.widthPx) / HAIRLINE.widthPx;
  const toSketch = 1 / space.sketchToLogical;
  const k = space.paperHalo * alpha;
  return {
    shadow: k > 0 ? {color: rgba(PAPER_HALO.shadowColor, PAPER_HALO.shadowOpacity * k), width: core * SHADOW_PASS_WIDTHS * toSketch, blur: PAPER_HALO.shadowPx * space.blurUnit} : null,
    halo: k > 0 ? {color: rgba(PAPER_HALO.haloColor, PAPER_HALO.haloOpacity * k), width: PAPER_HALO.haloPx * toSketch, blur: (PAPER_HALO.haloPx / 2) * space.blurUnit} : null,
    glow: {color: rgba(s.glow.color, s.glow.opacity * alpha), width: core * GLOW_PASS_WIDTHS * toSketch, blur: s.glow.radiusPx * space.blurUnit},
    core: {color: rgba(s.core.color, s.core.opacity * alpha), width: core * toSketch, blur: 0},
  };
};

/** Under-halo, glow and core, in that order (the ones that are null are skipped). */
const passList = (p: Passes): readonly Pass[] => [p.shadow, p.halo, p.glow, p.core].filter((pass): pass is Pass => pass !== null);

const strokePass = (ctx: CanvasRenderingContext2D, path: Path2D, p: Pass): void => {
  ctx.shadowColor = p.blur > 0 ? p.color : 'transparent';
  ctx.shadowBlur = p.blur;
  ctx.strokeStyle = p.color;
  ctx.lineWidth = p.width;
  ctx.stroke(path);
};

const drawPath = (ctx: CanvasRenderingContext2D, item: LightPath, space: CanvasSpace): void => {
  const path = visiblePath(item.m, item.local);
  if (!path) return;
  const p = passesOf(item.style.ink, item.style.level, item.style.alpha, space, item.style.widthPx);
  const first = item.m.pts[0];
  const dash = item.m.role === 'dotted' && first ? [p.core.width * 0.6, Math.max(6, first.w) * 3] : null;
  ctx.setLineDash(dash ? [...dash] : []);
  passList(p).forEach((pass) => strokePass(ctx, path, pass));
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
};

const glyphFont = (g: GlyphMark): string => {
  const f = metricsOf(g.face);
  return `${f.weight} ${g.size.toFixed(2)}px "${f.family}"`;
};

/** A text pass: the under-halo passes outline the glyph (so the halo surrounds the letter), the rest fill it. */
const textPass = (ctx: CanvasRenderingContext2D, char: string, p: Pass, outline: boolean, coreWidth: number): void => {
  ctx.shadowColor = p.blur > 0 ? p.color : 'transparent';
  ctx.shadowBlur = p.blur;
  if (outline) {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = Math.max(0, p.width - coreWidth);
    ctx.strokeText(char, 0, 0);
  } else {
    ctx.fillStyle = p.color;
    ctx.fillText(char, 0, 0);
  }
};

const drawGlyph = (ctx: CanvasRenderingContext2D, item: LightGlyph, space: CanvasSpace): void => {
  const {g, wipe} = item;
  const p = passesOf(item.style.ink, item.style.level, item.style.alpha, space);
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.rotate(g.rotate);
  if (wipe < 1) {
    const xs = g.pen.map((q) => q.x);
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const pad = g.size * GLYPH_CLIP_PAD;
    ctx.beginPath();
    ctx.rect(x0 - pad, -g.size * GLYPH_CLIP_ABOVE, (x1 - x0 + 2 * pad) * wipe, g.size * (GLYPH_CLIP_ABOVE + GLYPH_CLIP_BELOW));
    ctx.clip();
  }
  ctx.font = glyphFont(g);
  ctx.textBaseline = 'alphabetic';
  if (p.shadow) textPass(ctx, g.char, p.shadow, true, p.core.width);
  if (p.halo) textPass(ctx, g.char, p.halo, true, p.core.width);
  textPass(ctx, g.char, p.glow, false, p.core.width);
  textPass(ctx, g.char, p.core, false, p.core.width);
  ctx.restore();
};

/** Draws every item in order on a context whose transform maps sketch px to the backing store. */
export const drawLightItems = (ctx: CanvasRenderingContext2D, items: readonly LightItem[], space: CanvasSpace): void => {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const item of items) {
    if (item.kind === 'path') drawPath(ctx, item, space);
    else if (item.kind === 'glyph') drawGlyph(ctx, item, space);
    else drawHead(ctx, item, space);
  }
  ctx.restore();
};
