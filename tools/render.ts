// render.ts — resumable chunked render of one composition to an H.264 file.
// usage: npx tsx tools/render.ts <CompositionId> --out=out/name.mp4 [--scale=2] [--chunk=300 | --slots | --slots4] [--force] [--crf=14] [--concurrency=4] [--gl=swangle|angle|egl|vulkan|default]
// FILM_GL sets the default renderer (angle); --gl overrides it.
// Chunks land in out/chunks/<CompositionId>-s<scale>/; unchanged chunks are skipped, so re-rendering one changed module is cheap.
import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {resolveGl} from './glFlag';
import {SLOTS, sec} from '../src/film';
import {SLOTS4} from '../src/film4';

const [compId, ...flags] = process.argv.slice(2);
if (!compId) {
  console.error('usage: tsx tools/render.ts <CompositionId> --out=path.mp4 [--scale=2] [--chunk=300|--slots] [--force]');
  process.exit(1);
}
const flag = (name: string): string | undefined => flags.find((f) => f.startsWith(`--${name}=`))?.split('=')[1];
const has = (name: string): boolean => flags.includes(`--${name}`);

type Range = {from: number; to: number; name: string};

const chunkRanges = (total: number): Range[] => {
  if (has('slots4')) {
    return SLOTS4.map((s) => ({from: sec(s.start), to: Math.min(sec(s.end) - 1, total - 1), name: s.id}));
  }
  if (has('slots')) {
    return SLOTS.map((s) => ({from: sec(s.start), to: Math.min(sec(s.end) - 1, total - 1), name: s.id}));
  }
  const size = Number(flag('chunk') ?? 300);
  const ranges: Range[] = [];
  for (let from = 0; from < total; from += size) {
    ranges.push({from, to: Math.min(from + size - 1, total - 1), name: `f${String(from).padStart(5, '0')}`});
  }
  return ranges;
};

const main = async (): Promise<void> => {
  const scale = Number(flag('scale') ?? 2);
  const crf = Number(flag('crf') ?? 14);
  const concurrency = Number(flag('concurrency') ?? 4);
  const out = path.resolve(flag('out') ?? `out/${compId}.mp4`);
  const chunkDir = path.resolve('out/chunks', `${compId}-s${scale}`);
  mkdirSync(chunkDir, {recursive: true});
  mkdirSync(path.dirname(out), {recursive: true});

  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
  const browser = await openBrowser('chrome', {chromiumOptions: {gl: resolveGl(flags)}});
  const composition = await selectComposition({serveUrl, id: compId, puppeteerInstance: browser});
  const ranges = chunkRanges(composition.durationInFrames);
  const parts: string[] = [];

  for (const range of ranges) {
    const part = path.join(chunkDir, `${range.name}.mp4`);
    parts.push(part);
    if (existsSync(part) && !has('force')) {
      console.log(`skip ${range.name} (exists)`);
      continue;
    }
    console.log(`render ${range.name} frames ${range.from}-${range.to}`);
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: part,
      frameRange: [range.from, range.to],
      scale,
      crf,
      concurrency,
      muted: true,
      pixelFormat: 'yuv420p',
      colorSpace: 'bt709',
      imageFormat: 'jpeg',
      jpegQuality: 95,
      puppeteerInstance: browser,
      overwrite: true,
    });
  }
  await browser.close({silent: true});

  const list = path.join(chunkDir, 'concat.txt');
  writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n'));
  if (existsSync(out)) rmSync(out);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out]);
  console.log('wrote', out);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
