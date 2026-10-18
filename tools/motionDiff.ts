// motionDiff.ts — motion QA without video (QA2): render short runs of frames of one composition (one bundle, one
// browser), then measure how much changes between neighbours. Ratio = share of pixels whose largest channel difference
// exceeds the threshold (default 12/255, above paper grain), so 0 means "nothing moved".
// usage: npx tsx tools/motionDiff.ts <CompositionId> <scale> "<label:f,f,f;label:f,f;...>" [--out=out/review/f1] [--threshold=12] [--sheet]
//        npx tsx tools/motionDiff.ts --compare a.png b.png   (ratio, plus the whole-frame shift that best explains the change)
// Writes PNGs to <out>/<comp>/<label>/fNNNNN.png and appends one JSON line per pair to <out>/<comp>.jsonl.
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import {appendFileSync, mkdirSync} from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {resolveGl} from './glFlag';

const args = process.argv.slice(2);
const compare = args[0] === '--compare';
const flags = args.filter((a) => a.startsWith('--'));
const flag = (name: string): string | undefined => flags.find((f) => f.startsWith(`--${name}=`))?.split('=')[1];
const outRoot = path.resolve(flag('out') ?? 'out/review/f1');
const threshold = Number(flag('threshold') ?? 12);

const raw = (file: string, grey = false) => (grey ? sharp(file).greyscale() : sharp(file).removeAlpha()).raw().toBuffer({resolveWithObject: true});

/** Share of pixels that changed by more than the threshold, plus the bounding box of the change. */
export const diffRatio = async (a: string, b: string, thr: number): Promise<{ratio: number; box: string}> => {
  const [ra, rb] = await Promise.all([raw(a), raw(b)]);
  const {width, height} = ra.info;
  let changed = 0;
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let i = 0, p = 0; i < ra.data.length; i += 3, p++) {
    const d = Math.max(Math.abs(ra.data[i]! - rb.data[i]!), Math.abs(ra.data[i + 1]! - rb.data[i + 1]!), Math.abs(ra.data[i + 2]! - rb.data[i + 2]!));
    if (d > thr) {
      changed++;
      const x = p % width, y = Math.floor(p / width);
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
  }
  return {ratio: changed / (width * height), box: x1 < 0 ? '-' : `${x0},${y0}-${x1},${y1} of ${width}x${height}`};
};

/** The whole-picture shift (px, within +-8) that best maps a onto b: a non-zero answer with a large ratio is a jump, not motion. */
export const bestShift = async (a: string, b: string): Promise<[number, number]> => {
  const [A, B] = await Promise.all([raw(a, true), raw(b, true)]);
  const {width: w, height: h} = A.info;
  let best: [number, number, number] = [0, 0, Infinity];
  for (let dy = -8; dy <= 8; dy++) {
    for (let dx = -8; dx <= 8; dx++) {
      let s = 0;
      for (let y = 10; y < h - 10; y += 2) for (let x = 10; x < w - 10; x += 2) s += (A.data[y * w + x]! - B.data[(y + dy) * w + x + dx]!) ** 2;
      if (s < best[2]) best = [dx, dy, s];
    }
  }
  return [best[0], best[1]];
};

const renderRuns = async (compId: string, scale: number, groupsArg: string): Promise<void> => {
  const groups = groupsArg.split(';').filter(Boolean).map((g) => {
    const [label = 'run', frames = ''] = g.split(':');
    return {label, frames: frames.split(',').map((f) => Number(f.trim()))};
  });
  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
  const browser = await openBrowser('chrome', {browserExecutable: process.env.FILM_BROWSER ?? null, chromiumOptions: {gl: resolveGl(flags)}});
  const composition = await selectComposition({serveUrl, id: compId, puppeteerInstance: browser});
  const log = path.join(outRoot, `${compId}.jsonl`);
  mkdirSync(outRoot, {recursive: true});
  let total = 0, count = 0;
  for (const {label, frames} of groups) {
    const dir = path.join(outRoot, compId, label);
    mkdirSync(dir, {recursive: true});
    const files: string[] = [];
    for (const frame of frames) {
      const output = path.join(dir, `f${String(frame).padStart(5, '0')}.png`);
      const began = Date.now();
      await renderStill({composition, serveUrl, frame, output, scale, puppeteerInstance: browser, imageFormat: 'png'});
      total += Date.now() - began;
      count++;
      files.push(output);
    }
    for (let i = 1; i < files.length; i++) {
      const [a, b] = [frames[i - 1]!, frames[i]!];
      const {ratio, box} = await diffRatio(files[i - 1]!, files[i]!, threshold);
      appendFileSync(log, `${JSON.stringify({comp: compId, label, a, b, sec: +(a / 30).toFixed(2), ratio: +ratio.toFixed(4), box})}\n`);
      console.log(`${label}\t${a}->${b}\t${(a / 30).toFixed(2)}s\t${(ratio * 100).toFixed(2)}%\t${box}`);
    }
    if (flags.includes('--sheet') && files.length > 1) {
      const inputs = files.flatMap((f) => ['-i', f]);
      const filter = `${files.map((_, i) => `[${i}:v]`).join('')}hstack=inputs=${files.length}[v]`;
      execFileSync('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', filter, '-map', '[v]', '-frames:v', '1', path.join(dir, 'sheet.png')]);
    }
  }
  await browser.close({silent: true});
  console.log(`stills ${count}, ${(total / count / 1000).toFixed(2)} s per still`);
};

const main = async (): Promise<void> => {
  const [first, second, third] = args.filter((a) => !a.startsWith('--'));
  if (compare) {
    if (!first || !second) throw new Error('usage: tsx tools/motionDiff.ts --compare a.png b.png');
    const {ratio, box} = await diffRatio(first, second, threshold);
    console.log(`${(ratio * 100).toFixed(2)}%\t${box}\tshift ${(await bestShift(first, second)).join(',')}`);
    return;
  }
  if (!first || !second || !third) throw new Error('usage: tsx tools/motionDiff.ts <CompositionId> <scale> "<label:f,f;label:f,f>" [--out=dir] [--threshold=12] [--sheet]');
  await renderRuns(first, Number(second), third);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
