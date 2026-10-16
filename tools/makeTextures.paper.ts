// makeTextures.paper.ts — the paper tooth (graphite grain mask) and the warm off-white paper albedo.
import {cellField, equalise, fbmField, mulberry32, normalise} from './makeTextures.noise';

/** Paper tooth: a height map. Peaks (white) take graphite first; valleys only under pressure. */
export const makeTooth = (size: number, seed: number): Float32Array => {
  const fine = cellField(size, size, Math.round(size / 3.2), seed + 1);
  const mid = cellField(size, size, Math.round(size / 7.5), seed + 2);
  const soft = fbmField({width: size, height: size, cellsX: 64, cellsY: 64, octaves: 3, seed: seed + 3});
  const broad = fbmField({width: size, height: size, cellsX: 8, cellsY: 8, octaves: 3, seed: seed + 4});
  const threads = fibreField(size, makeFibres(Math.round((size * size) / 700), size, seed + 5, TOOTH_FIBRE));
  const mixed = fine.map(
    (v, i) =>
      0.42 * v +
      0.22 * (mid[i] as number) +
      0.18 * (soft[i] as number) +
      0.1 * (broad[i] as number) +
      2.2 * (threads[i] as number),
  );
  return equalise(normalise(mixed));
};

type Fibre = {x: number; y: number; angle: number; bend: number; length: number; width: number; tone: number};

type FibreLook = {minLength: number; maxLength: number; bend: number; dark: readonly [number, number]; light: readonly [number, number]};

/** Visible fibres in the paper colour: short, nearly straight, barely there (it is drawing paper, not rice paper). */
const ALBEDO_FIBRE: FibreLook = {minLength: 10, maxLength: 70, bend: 0.012, dark: [0.006, 0.012], light: [0.004, 0.009]};
/** Fibres in the tooth: raised threads that catch graphite. */
const TOOTH_FIBRE: FibreLook = {minLength: 8, maxLength: 40, bend: 0.03, dark: [0.02, 0.05], light: [0.03, 0.06]};

const makeFibres = (count: number, size: number, seed: number, look: FibreLook): readonly Fibre[] => {
  const rnd = mulberry32(seed);
  return Array.from({length: count}, () => {
    const dark = rnd() < 0.55;
    const [lo, hi] = dark ? look.dark : look.light;
    const tone = lo + rnd() * (hi - lo);
    return {
      x: rnd() * size,
      y: rnd() * size,
      angle: rnd() * Math.PI * 2,
      bend: (rnd() - 0.5) * look.bend,
      length: look.minLength + rnd() ** 2 * (look.maxLength - look.minLength),
      width: 0.45 + rnd() * 0.7,
      tone: dark ? -tone : tone,
    };
  });
};

/** Splat fibres (thin curved threads) into a tileable brightness-offset field. */
const fibreField = (size: number, fibres: readonly Fibre[]): Float32Array => {
  const out = new Float32Array(size * size);
  const wrap = (v: number): number => ((Math.round(v) % size) + size) % size;
  for (const f of fibres) {
    let x = f.x;
    let y = f.y;
    let a = f.angle;
    const steps = Math.ceil(f.length / 0.5);
    for (let s = 0; s < steps; s++) {
      const fadeEnds = Math.sin((s / steps) * Math.PI);
      const r = Math.ceil(f.width * 1.5);
      for (let oy = -r; oy <= r; oy++) {
        for (let ox = -r; ox <= r; ox++) {
          const d2 = (ox * ox + oy * oy) / (f.width * f.width);
          const w = Math.exp(-d2) * 0.18 * fadeEnds;
          const i = wrap(y + oy) * size + wrap(x + ox);
          out[i] = (out[i] as number) + f.tone * w;
        }
      }
      x += Math.cos(a) * 0.5;
      y += Math.sin(a) * 0.5;
      a += f.bend;
    }
  }
  return out.map((v) => Math.max(-0.07, Math.min(0.05, v)));
};

/** Paper colour (sRGB 0-255) — the same warm off-white as COLORS.paper, a touch brighter so lamp falloff can darken it. */
const PAPER_RGB = [245, 240, 230] as const;

export const makePaperAlbedo = (size: number, tooth: Float32Array, toothSize: number, seed: number): Buffer => {
  const mottle = fbmField({width: size, height: size, cellsX: 6, cellsY: 6, octaves: 5, seed: seed + 11});
  const cloud = fbmField({width: size, height: size, cellsX: 2, cellsY: 2, octaves: 3, seed: seed + 12});
  const fibres = fibreField(size, makeFibres(Math.round((size * size) / 900), size, seed + 13, ALBEDO_FIBRE));
  const rnd = mulberry32(seed + 14);
  const specks = Array.from({length: Math.round((size * size) / 40000)}, () => ({
    x: rnd() * size,
    y: rnd() * size,
    r: 0.5 + rnd() * 1.1,
    tone: -(0.04 + rnd() * 0.09),
  }));
  const speckField = new Float32Array(size * size);
  for (const s of specks) {
    for (let oy = -3; oy <= 3; oy++) {
      for (let ox = -3; ox <= 3; ox++) {
        const xx = (((Math.round(s.x) + ox) % size) + size) % size;
        const yy = (((Math.round(s.y) + oy) % size) + size) % size;
        const w = Math.exp(-(ox * ox + oy * oy) / (s.r * s.r));
        speckField[yy * size + xx] = (speckField[yy * size + xx] as number) + s.tone * w;
      }
    }
  }
  const toothAt = (x: number, y: number): number => tooth[(y % toothSize) * toothSize + (x % toothSize)] as number;
  const out = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      // Micro relief, lit from the upper left (the default lamp side).
      const gx = toothAt((x + 1) % size, y) - toothAt((x + size - 1) % size, y);
      const gy = toothAt(x, (y + 1) % size) - toothAt(x, (y + size - 1) % size);
      const relief = -(gx * 0.7 + gy * 0.7) * 0.03 + ((toothAt(x, y) as number) - 0.5) * 0.016;
      const m = ((mottle[i] as number) - 0.5) * 0.034 + ((cloud[i] as number) - 0.5) * 0.02;
      const k = 1 + m + relief + (fibres[i] as number) + (speckField[i] as number);
      const warm = (fibres[i] as number) < 0 ? 0.006 : 0;
      out[i * 3] = clamp255(PAPER_RGB[0] * (k + warm * 0.3));
      out[i * 3 + 1] = clamp255(PAPER_RGB[1] * k);
      out[i * 3 + 2] = clamp255(PAPER_RGB[2] * (k - warm));
    }
  }
  return out;
};

export const clamp255 = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));
