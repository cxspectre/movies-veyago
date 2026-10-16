// makeTextures.ts — generates every texture the paper engine uses, deterministically, into public/tex/,
// and the hand-lettering glyph metrics into src/paper/text/handMetrics.ts.
//
//   cd Film && npx tsx tools/makeTextures.ts            (all)
//   cd Film && npx tsx tools/makeTextures.ts paper desk (a subset: tooth | paper | desk | fonts)
//
// Texel density: 2 texels per logical px (1 texel per device px at the 4K --scale=2 render).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {makeDesk} from './makeTextures.desk';
import {fontMetricsSource} from './makeTextures.fonts';
import {makePaperAlbedo, makeTooth} from './makeTextures.paper';

const ROOT = path.resolve(__dirname, '..');
const TEX_DIR = path.join(ROOT, 'public', 'tex');
const FONTS_DIR = path.join(ROOT, 'public', 'fonts');
const METRICS_FILE = path.join(ROOT, 'src', 'paper', 'text', 'handMetrics.ts');

/** Sizes in texels. Keep in sync with TEXTURES in src/paper/textures.ts (logical size = texels / 2). */
const TOOTH_SIZE = 1024;
const PAPER_SIZE = 2048;
const DESK_SIZE = 4096;
const SEED = 20261015;

const writeGray = async (file: string, field: Float32Array, size: number): Promise<void> => {
  const buf = Buffer.from(Uint8Array.from(field, (v) => Math.round(v * 255)));
  await sharp(buf, {raw: {width: size, height: size, channels: 1}}).png({compressionLevel: 9}).toFile(file);
};

const writeRgb = async (file: string, buf: Buffer, size: number, quality: number): Promise<void> => {
  await sharp(buf, {raw: {width: size, height: size, channels: 3}}).webp({quality, effort: 5}).toFile(file);
};

const step = async (name: string, run: () => Promise<void>): Promise<void> => {
  const t0 = performance.now();
  await run();
  process.stdout.write(`${name}: ${((performance.now() - t0) / 1000).toFixed(1)} s\n`);
};

const main = async (): Promise<void> => {
  const wanted = new Set(process.argv.slice(2));
  const want = (k: string): boolean => wanted.size === 0 || wanted.has(k);
  fs.mkdirSync(TEX_DIR, {recursive: true});
  const tooth = makeTooth(TOOTH_SIZE, SEED);
  if (want('tooth')) await step('paper-tooth.png', () => writeGray(path.join(TEX_DIR, 'paper-tooth.png'), tooth, TOOTH_SIZE));
  if (want('paper')) {
    await step('paper-albedo.webp', () =>
      writeRgb(path.join(TEX_DIR, 'paper-albedo.webp'), makePaperAlbedo(PAPER_SIZE, tooth, TOOTH_SIZE, SEED + 100), PAPER_SIZE, 90),
    );
  }
  if (want('desk')) {
    await step('desk-oak.webp', () => writeRgb(path.join(TEX_DIR, 'desk-oak.webp'), makeDesk(DESK_SIZE, SEED + 200), DESK_SIZE, 86));
  }
  if (want('fonts')) {
    await step('handMetrics.ts', async () => {
      fs.mkdirSync(path.dirname(METRICS_FILE), {recursive: true});
      fs.writeFileSync(METRICS_FILE, fontMetricsSource(FONTS_DIR));
    });
  }
};

main().catch((error: unknown) => {
  process.stderr.write(`makeTextures failed: ${String(error)}\n`);
  process.exit(1);
});
