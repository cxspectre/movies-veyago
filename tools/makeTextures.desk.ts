// makeTextures.desk.ts — a pale, matte, white-oiled oak desktop made of glued-up strips.
// Grain runs along x. The tile wraps in both directions (strips wrap in y, every field is periodic in x).
import {fbmField, mulberry32, smoothstep} from './makeTextures.noise';
import {clamp255} from './makeTextures.paper';

/** Pale oak, light enough for warm off-white paper to sit on it clearly but never blend in. */
const OAK_LIGHT = [214, 190, 152] as const;
const OAK_DARK = [176, 146, 104] as const;

type Strip = {y0: number; y1: number; tone: number; ringFreq: number; phase: number; fleck: number};

const makeStrips = (size: number, seed: number): readonly Strip[] => {
  const rnd = mulberry32(seed);
  const widths: number[] = [];
  let total = 0;
  while (total < size) {
    const w = Math.round(380 + rnd() * 340);
    const capped = size - total - w < 300 ? size - total : w;
    widths.push(capped);
    total += capped;
  }
  return widths.map((w, i) => {
    const y0 = widths.slice(0, i).reduce((a, b) => a + b, 0);
    return {
      y0,
      y1: y0 + w,
      tone: (rnd() - 0.5) * 0.07,
      ringFreq: 1 / (14 + rnd() * 30),
      phase: rnd() * 100,
      fleck: rnd() < 0.45 ? 0.6 + rnd() * 0.4 : 0,
    };
  });
};

export const makeDesk = (size: number, seed: number): Buffer => {
  const strips = makeStrips(size, seed);
  const warp = fbmField({width: size, height: size, cellsX: 2, cellsY: 5, octaves: 4, seed: seed + 1, gain: 0.42});
  const streak = fbmField({width: size, height: size, cellsX: 3, cellsY: 260, octaves: 3, seed: seed + 2});
  const pores = fbmField({width: size, height: size, cellsX: 70, cellsY: 1500, octaves: 1, seed: seed + 3});
  const fleckN = fbmField({width: size, height: size, cellsX: 40, cellsY: 300, octaves: 2, seed: seed + 4});
  const mottle = fbmField({width: size, height: size, cellsX: 4, cellsY: 4, octaves: 4, seed: seed + 5});
  const out = Buffer.alloc(size * size * 3);
  for (const s of strips) {
    for (let y = s.y0; y < s.y1; y++) {
      const edge = Math.min(y - s.y0, s.y1 - 1 - y);
      const glue = edge < 1 ? 0.07 : edge < 2 ? 0.025 : 0;
      for (let x = 0; x < size; x++) {
        const i = y * size + x;
        const w = (warp[i] as number) - 0.5;
        const ringPos = (y - s.y0) * s.ringFreq + w * 3.2 + s.phase;
        const frac = ringPos - Math.floor(ringPos);
        // Latewood: a narrow darker band at the end of each ring, softened.
        const late = smoothstep(0.78, 0.94, frac) * (1 - smoothstep(0.95, 1, frac));
        const st = ((streak[i] as number) - 0.5) * 2;
        const pore = smoothstep(0.7, 0.86, pores[i] as number) * 0.5;
        const fleck = s.fleck * smoothstep(0.74, 0.86, fleckN[i] as number) * 0.5;
        const darkness = Math.max(0, Math.min(1, 0.2 + late * 0.3 + st * 0.2 + pore * 0.6));
        const tone = 1 + s.tone + ((mottle[i] as number) - 0.5) * 0.06 + fleck * 0.06 - glue;
        out[i * 3] = clamp255((OAK_LIGHT[0] + (OAK_DARK[0] - OAK_LIGHT[0]) * darkness) * tone);
        out[i * 3 + 1] = clamp255((OAK_LIGHT[1] + (OAK_DARK[1] - OAK_LIGHT[1]) * darkness) * tone);
        out[i * 3 + 2] = clamp255((OAK_LIGHT[2] + (OAK_DARK[2] - OAK_LIGHT[2]) * darkness) * tone);
      }
    }
  }
  return out;
};
