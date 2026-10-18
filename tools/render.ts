// render.ts — resumable chunked render of one composition to an H.264 file.
// usage: npx tsx tools/render.ts <CompositionId> --out=out/name.mp4 [--scale=2] [--chunk=300 | --slots | --slots4] [--force] [--only=name,name] [--timeout=120 (seconds per frame)] [--crf=14] [--concurrency=4] [--gl=swangle|angle|egl|vulkan|default]
// FILM_GL sets the default renderer (angle); --gl overrides it.
// Chunks land in out/chunks/<CompositionId>-s<scale>-crf<crf>/ and are written as .partial.mp4, renamed when whole.
// A chunk that exists with the right frame count is skipped (resume after a crash); --force redoes all. A changed chapter needs --force or that chunk file deleted.
import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {resolveGl} from './glFlag';
import {chunkRanges, tilingProblems} from './renderRanges';

const [compId, ...flags] = process.argv.slice(2);
if (!compId) {
  console.error('usage: tsx tools/render.ts <CompositionId> --out=path.mp4 [--scale=2] [--chunk=300|--slots] [--force]');
  process.exit(1);
}
const flag = (name: string): string | undefined => flags.find((f) => f.startsWith(`--${name}=`))?.split('=')[1];
const has = (name: string): boolean => flags.includes(`--${name}`);

/** Frames in a finished mp4 (from the container, no decode); null if the file is unreadable. */
const framesIn = (file: string): number | null => {
  try {
    const text = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_packets', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', file]).toString().trim();
    return Number(text) || null;
  } catch {
    return null;
  }
};

const main = async (): Promise<void> => {
  const scale = Number(flag('scale') ?? 2);
  const crf = Number(flag('crf') ?? 14);
  const concurrency = Number(flag('concurrency') ?? 4);
  // Per-frame delayRender limit. Remotion's 30 s default is too tight for a cold video seek in the 4K glass chapter on a slow box.
  const timeoutInMilliseconds = Number(flag('timeout') ?? 120) * 1000;
  const only = flag('only')?.split(',');
  const out = path.resolve(flag('out') ?? `out/${compId}.mp4`);
  // The dir carries scale and crf: a chunk rendered at another setting must never be reused or mixed into the concat.
  const chunkDir = path.resolve('out/chunks', `${compId}-s${scale}-crf${crf}`);
  mkdirSync(chunkDir, {recursive: true});
  mkdirSync(path.dirname(out), {recursive: true});

  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
  const browser = await openBrowser('chrome', {chromiumOptions: {gl: resolveGl(flags)}});
  const composition = await selectComposition({serveUrl, id: compId, puppeteerInstance: browser});
  const ranges = chunkRanges(composition.durationInFrames, {slots4: has('slots4'), slots: has('slots'), chunk: Number(flag('chunk') ?? 300)});
  const problems = tilingProblems(ranges, composition.durationInFrames);
  if (problems.length > 0) throw new Error(`chunk ranges do not tile ${compId}:\n${problems.join('\n')}`);
  const parts: string[] = [];

  for (const range of ranges) {
    const part = path.join(chunkDir, `${range.name}.mp4`);
    parts.push(part);
    if (only && !only.includes(range.name)) {
      if (!existsSync(part)) console.log(`not rendered ${range.name} (--only)`);
      continue;
    }
    const expected = range.to - range.from + 1;
    if (existsSync(part) && !has('force')) {
      if (framesIn(part) === expected) {
        console.log(`skip ${range.name} (exists, ${expected} frames)`);
        continue;
      }
      console.log(`redo ${range.name}: existing file does not hold ${expected} frames`);
    }
    console.log(`render ${range.name} frames ${range.from}-${range.to}`);
    // Written beside the final name and renamed when whole, so a crash mid-chunk never leaves a file that looks finished.
    const partial = path.join(chunkDir, `${range.name}.partial.mp4`);
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: partial,
      frameRange: [range.from, range.to],
      scale,
      crf,
      concurrency,
      timeoutInMilliseconds,
      muted: true,
      pixelFormat: 'yuv420p',
      colorSpace: 'bt709',
      imageFormat: 'jpeg',
      jpegQuality: 95,
      puppeteerInstance: browser,
      overwrite: true,
    });
    const got = framesIn(partial);
    if (got !== expected) throw new Error(`${range.name}: rendered ${got} frames, expected ${expected}`);
    renameSync(partial, part);
  }
  await browser.close({silent: true});

  const missing = parts.filter((p) => !existsSync(p));
  if (missing.length > 0) {
    console.log(`${missing.length} chunk(s) missing, no concat yet: ${missing.map((p) => path.basename(p)).join(' ')}`);
    return;
  }
  const list = path.join(chunkDir, 'concat.txt');
  writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n'));
  if (existsSync(out)) rmSync(out);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out]);
  const total = framesIn(out);
  if (total !== composition.durationInFrames) throw new Error(`${out} holds ${total} frames, expected ${composition.durationInFrames}`);
  console.log('wrote', out, `(${total} frames)`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
