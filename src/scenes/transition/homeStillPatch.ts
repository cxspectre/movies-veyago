// homeStillPatch.ts — the binder-home still as the film shows it: the sample data's three real business names in
// the Later list become fictional items (CONTRACT 12.1: never hero real businesses), and the content that shows
// around and through the floating tab bar is painted out (it read as a rendering error at 4K). Works on the
// still's own pixels (3x, 1206 x 2622). Every patch is pre-blended at 1.00 alpha, so the glass's bloom mask and the
// rig's exact-pixel screen are untouched. The sketch draws these rows as plain lines, so the one rule holds.
import {FONTS} from '../../film';
import {HOME_LAYOUT} from '../../sketches/binder-home-v2/layout';
import {elementsOf, type ScreenRect} from '../../sketches/binder-home-v2/screen';

/** Fictional Later items, one per real row (a bill, a bill, an expiring document), plain and warm. */
export const LATER_LABELS: readonly string[] = ['Internet bill', 'Electricity bill', 'Car registration'];

/** The real rows' type, measured on the still: 17 pt labels, baseline 14.4 pt under the text frame's top, #F3F5F9. */
const ROW_TEXT = {fontPt: 17, baselineFromTopPt: 14.4, color: '#F3F5F9', weight: 400} as const;
/** The patch over a row's name: from just left of the text to the clear right part of the row (points). */
const ROW_PATCH = {left: 100, right: 300, padPt: 3} as const;

/** The band under the helper chips: a flat colour on the still (12, 20, 34 everywhere outside the tab bar). */
const BOTTOM_BAND = {fromPt: 770, color: '#0C1422'} as const;
/**
 * Inside the glass capsule the content behind it shows through blurred; it is damped toward the capsule's own fill.
 * Icons, labels and the badge are preserved by a luminance key and a chroma key; the selected tab's pill is left
 * alone (its fill would otherwise read as ghost).
 */
const CAPSULE = {
  /** The capsule's own fill on a row is this percentile of the row's pixels by luminance (ghost and content are brighter). */
  fillPercentile: 0.1,
  /**
   * Pixels darker than `ghostLum` are the capsule itself or ghost (measured: ghost letters reach lum 85-125, the fill
   * 50-62), brighter than `contentLum` are icons and labels (255).
   */
  ghostLum: 125,
  contentLum: 180,
  /** Coloured pixels (the badge, the selected icon) are content whatever their luminance. */
  chromaFrom: 40,
  chromaTo: 80,
  /** How far ghost-level pixels move toward the capsule's own fill. */
  damp: 0.85,
  /** The selected tab (its pill is the first tab's frame). */
  selectedTab: 'Binder',
} as const;

const {scale} = HOME_LAYOUT.screen;
const px = (pt: number): number => Math.round(pt * scale);

const luminance = (r: number, g: number, b: number): number => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const smoothstep = (a: number, b: number, v: number): number => {
  const k = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/** Fills a rect with the still's own gradient: each column interpolated from the clean line above to the one below. */
const fillFromNeighbours = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void => {
  const above = ctx.getImageData(x, y - 1, w, 1).data;
  const below = ctx.getImageData(x, y + h, w, 1).data;
  const out = ctx.createImageData(w, h);
  for (let row = 0; row < h; row += 1) {
    const f = (row + 0.5) / h;
    for (let col = 0; col < w; col += 1) {
      const i = col * 4;
      const o = (row * w + col) * 4;
      out.data[o] = above[i]! + (below[i]! - above[i]!) * f;
      out.data[o + 1] = above[i + 1]! + (below[i + 1]! - above[i + 1]!) * f;
      out.data[o + 2] = above[i + 2]! + (below[i + 2]! - above[i + 2]!) * f;
      out.data[o + 3] = 255;
    }
  }
  ctx.putImageData(out, x, y);
};

const nameTextOf = (row: {readonly texts: readonly {readonly text: string; readonly x: number; readonly y: number; readonly w: number; readonly h: number}[]}): ScreenRect | null => {
  // The row's texts are the date, then the name.
  const name = row.texts[1];
  return name ? {x: name.x, y: name.y, w: name.w, h: name.h} : null;
};

/** Replaces each Later row's name with its fictional label, in the row's own gradient. */
const patchLaterRows = (ctx: CanvasRenderingContext2D): void => {
  const rows = elementsOf('laterRow');
  if (rows.length !== LATER_LABELS.length) throw new Error(`homeStillPatch: ${rows.length} Later rows for ${LATER_LABELS.length} labels`);
  ctx.font = `${ROW_TEXT.weight} ${ROW_TEXT.fontPt * scale}px ${FONTS.super}`;
  ctx.fillStyle = ROW_TEXT.color;
  ctx.textBaseline = 'alphabetic';
  rows.forEach((row, i) => {
    const text = nameTextOf(row);
    const label = LATER_LABELS[i];
    if (!text || !label) throw new Error(`homeStillPatch: Later row ${i} has no name text`);
    const top = px(text.y - ROW_PATCH.padPt);
    const bottom = px(text.y + text.h + ROW_PATCH.padPt);
    fillFromNeighbours(ctx, px(ROW_PATCH.left), top, px(ROW_PATCH.right) - px(ROW_PATCH.left), bottom - top);
    ctx.fillText(label, px(text.x), px(text.y + ROW_TEXT.baselineFromTopPt));
  });
};

const capsulePath = (c: ScreenRect): Path2D => {
  const path = new Path2D();
  path.roundRect(px(c.x), px(c.y), px(c.w), px(c.h), px(c.h) / 2);
  return path;
};

/** Paints the band under the helper chips flat, around the tab bar capsule. */
const clearBottomBand = (ctx: CanvasRenderingContext2D): void => {
  const {wPt, hPt} = HOME_LAYOUT.screen;
  const band = new Path2D();
  band.rect(0, px(BOTTOM_BAND.fromPt), px(wPt), px(hPt) - px(BOTTOM_BAND.fromPt));
  band.addPath(capsulePath(HOME_LAYOUT.tabBarCapsule));
  ctx.save();
  ctx.clip(band, 'evenodd');
  ctx.fillStyle = BOTTOM_BAND.color;
  ctx.fillRect(0, px(BOTTOM_BAND.fromPt), px(wPt), px(hPt) - px(BOTTOM_BAND.fromPt));
  ctx.restore();
};

/** Whether (x, y) lies inside a pill (a rect with fully rounded ends), all in the same pixel space. */
const insidePill = (x: number, y: number, rect: {x: number; y: number; w: number; h: number}): boolean => {
  const r = rect.h / 2;
  const cx = Math.max(rect.x + r, Math.min(rect.x + rect.w - r, x));
  return Math.hypot(x - cx, y - (rect.y + r)) <= r;
};

/** 0 for ghost-level pixels, 1 for content (bright, or coloured). */
const contentKey = (r: number, g: number, b: number): number => {
  const lum = smoothstep(CAPSULE.ghostLum, CAPSULE.contentLum, luminance(r, g, b));
  const chroma = smoothstep(CAPSULE.chromaFrom, CAPSULE.chromaTo, Math.max(r, g, b) - Math.min(r, g, b));
  return Math.max(lum, chroma);
};

/** Damps what shows through the capsule toward the capsule's own fill (sampled per row on a clean column). */
const dampCapsuleGhost = (ctx: CanvasRenderingContext2D): void => {
  const c = HOME_LAYOUT.tabBarCapsule;
  const x = px(c.x);
  const y = px(c.y);
  const w = px(c.w);
  const h = px(c.h);
  const selected = elementsOf('tabBarTab').find((e) => e.label === CAPSULE.selectedTab);
  if (!selected) throw new Error(`homeStillPatch: no "${CAPSULE.selectedTab}" tab in the layout`);
  const pill = {x: px(selected.frame.x), y: px(selected.frame.y), w: px(selected.frame.w), h: px(selected.frame.h)};
  const capsule = {x: 0, y: 0, w, h};
  const img = ctx.getImageData(x, y, w, h);
  const d = img.data;
  const inside = (row: number, col: number): boolean => insidePill(col + 0.5, row + 0.5, capsule) && !insidePill(x + col + 0.5, y + row + 0.5, pill);
  for (let row = 0; row < h; row += 1) {
    const fill = rowFill(d, w, row, inside);
    if (!fill) continue;
    for (let col = 0; col < w; col += 1) {
      // Inside the capsule only (its corners were painted by clearBottomBand), and not the selected tab's pill.
      if (!inside(row, col)) continue;
      const o = (row * w + col) * 4;
      const a = CAPSULE.damp * (1 - contentKey(d[o]!, d[o + 1]!, d[o + 2]!));
      d[o] = d[o]! + (fill[0] - d[o]!) * a;
      d[o + 1] = d[o + 1]! + (fill[1] - d[o + 1]!) * a;
      d[o + 2] = d[o + 2]! + (fill[2] - d[o + 2]!) * a;
    }
  }
  ctx.putImageData(img, x, y);
};

/** The capsule's own colour on a row: the `fillPercentile` darkest pixel of the row inside the capsule. */
const rowFill = (d: Uint8ClampedArray, w: number, row: number, inside: (row: number, col: number) => boolean): readonly [number, number, number] | null => {
  const pixels: {lum: number; rgb: readonly [number, number, number]}[] = [];
  for (let col = 0; col < w; col += 1) {
    if (!inside(row, col)) continue;
    const o = (row * w + col) * 4;
    const rgb = [d[o]!, d[o + 1]!, d[o + 2]!] as const;
    pixels.push({lum: luminance(rgb[0], rgb[1], rgb[2]), rgb});
  }
  if (pixels.length === 0) return null;
  const sorted = [...pixels].sort((a, b) => a.lum - b.lum);
  return sorted[Math.floor(CAPSULE.fillPercentile * (sorted.length - 1))]?.rgb ?? null;
};

/** Applies every patch to a context holding the still at its own pixel size. */
export const patchHomeStill = (ctx: CanvasRenderingContext2D): void => {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  patchLaterRows(ctx);
  clearBottomBand(ctx);
  dampCapsuleGhost(ctx);
  ctx.restore();
};
