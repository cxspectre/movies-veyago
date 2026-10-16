// develop.ts — turns deposit (R = graphite, G = accent, B = sepia) + paper tooth into the visible pencil layer.
// One tight pass over the pixels with lookup tables; the result is composited with normal alpha over the paper.
import {buildLut, LOOKS} from './inkLook';

let graphiteLut: Uint8Array | null = null;
let accentLut: Uint8Array | null = null;
let sepiaLut: Uint8Array | null = null;

const luts = (): {g: Uint8Array; a: Uint8Array; s: Uint8Array} => {
  graphiteLut = graphiteLut ?? buildLut(LOOKS.graphite);
  accentLut = accentLut ?? buildLut(LOOKS.accent);
  sepiaLut = sepiaLut ?? buildLut(LOOKS.sepia);
  return {g: graphiteLut, a: accentLut, s: sepiaLut};
};

type Rgb = readonly [number, number, number];

/** Write `top` (alpha byte) over `under` (alpha byte) into out[j..j+3]: the pencil laid down later sits on top. */
const writeOver = (out: Uint8ClampedArray, j: number, under: Rgb, aUnder: number, top: Rgb, aTop: number): void => {
  const ft = aTop / 255;
  const fu = (aUnder / 255) * (1 - ft);
  const total = ft + fu;
  out[j] = (top[0] * ft + under[0] * fu) / total;
  out[j + 1] = (top[1] * ft + under[1] * fu) / total;
  out[j + 2] = (top[2] * ft + under[2] * fu) / total;
  out[j + 3] = total * 255;
};

const writeFlat = (out: Uint8ClampedArray, j: number, rgb: Rgb, alpha: number): void => {
  out[j] = rgb[0];
  out[j + 1] = rgb[1];
  out[j + 2] = rgb[2];
  out[j + 3] = alpha;
};

/**
 * Write the pencil layer into `out` (RGBA, same size as `deposit`).
 * `out` is a scratch buffer owned by the caller and overwritten in full (a deliberate in-place hot loop).
 * Graphite and accent alone take exactly the v1 path; sepia (rare) is composited between them: accent over sepia over graphite.
 */
export const develop = (deposit: Uint8ClampedArray, tooth: Uint8Array, out: Uint8ClampedArray): void => {
  const {g: lutG, a: lutA, s: lutS} = luts();
  const graphite = LOOKS.graphite.rgb;
  const accent = LOOKS.accent.rgb;
  const sepia = LOOKS.sepia.rgb;
  const n = tooth.length;
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    const r = deposit[j] as number;
    const g = deposit[j + 1] as number;
    const b = deposit[j + 2] as number;
    if (r === 0 && g === 0 && b === 0) {
      out[j + 3] = 0;
      continue;
    }
    const t = tooth[i] as number;
    const aG = r === 0 ? 0 : (lutG[(r << 8) | t] as number);
    const aA = g === 0 ? 0 : (lutA[(g << 8) | t] as number);
    if (b === 0) {
      if (aA === 0) writeFlat(out, j, graphite, aG);
      else if (aG === 0) writeFlat(out, j, accent, aA);
      else writeOver(out, j, graphite, aG, accent, aA);
      continue;
    }
    const aS = lutS[(b << 8) | t] as number;
    if (aG === 0 && aA === 0) {
      writeFlat(out, j, sepia, aS);
      continue;
    }
    // Sepia over graphite first, then the accent over both.
    writeOver(out, j, graphite, aG, sepia, aS);
    if (aA !== 0) writeOver(out, j, [out[j] as number, out[j + 1] as number, out[j + 2] as number], out[j + 3] as number, accent, aA);
  }
};
