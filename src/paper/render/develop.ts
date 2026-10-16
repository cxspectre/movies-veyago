// develop.ts — turns deposit (R = graphite, G = accent) + paper tooth into the visible pencil layer.
// One tight pass over the pixels with lookup tables; the result is composited with normal alpha over the paper.
import {buildLut, LOOKS} from './inkLook';

let graphiteLut: Uint8Array | null = null;
let accentLut: Uint8Array | null = null;

const luts = (): {g: Uint8Array; a: Uint8Array} => {
  graphiteLut = graphiteLut ?? buildLut(LOOKS.graphite);
  accentLut = accentLut ?? buildLut(LOOKS.accent);
  return {g: graphiteLut, a: accentLut};
};

/**
 * Write the pencil layer into `out` (RGBA, same size as `deposit`).
 * `out` is a scratch buffer owned by the caller and overwritten in full (a deliberate in-place hot loop).
 */
export const develop = (deposit: Uint8ClampedArray, tooth: Uint8Array, out: Uint8ClampedArray): void => {
  const {g: lutG, a: lutA} = luts();
  const [gr, gg, gb] = LOOKS.graphite.rgb;
  const [ar, ag, ab] = LOOKS.accent.rgb;
  const n = tooth.length;
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    const r = deposit[j] as number;
    const g = deposit[j + 1] as number;
    if (r === 0 && g === 0) {
      out[j + 3] = 0;
      continue;
    }
    const t = tooth[i] as number;
    const aG = r === 0 ? 0 : (lutG[(r << 8) | t] as number);
    const aA = g === 0 ? 0 : (lutA[(g << 8) | t] as number);
    if (aA === 0) {
      out[j] = gr;
      out[j + 1] = gg;
      out[j + 2] = gb;
      out[j + 3] = aG;
    } else if (aG === 0) {
      out[j] = ar;
      out[j + 1] = ag;
      out[j + 2] = ab;
      out[j + 3] = aA;
    } else {
      // Accent pencil over graphite.
      const fa = aA / 255;
      const fg = (aG / 255) * (1 - fa);
      const total = fa + fg;
      out[j] = (ar * fa + gr * fg) / total;
      out[j + 1] = (ag * fa + gg * fg) / total;
      out[j + 2] = (ab * fa + gb * fg) / total;
      out[j + 3] = total * 255;
    }
  }
};
