// masterAudit.ts — the hand-off audit of the one-sheet master: for each chapter boundary, stills at end - 0.5 s, the last
// frame, the next chapter's first frame and next start + 0.5 s, in both formats, tiled into one contact sheet per boundary
// and format. Prints the seconds each still took. Also renders single timing stills with --times.
// usage: npx tsx tools/masterAudit.ts [--comp=Master4] [--out=out/review/c1] [--only=wide|tall] [--boundaries=1,2,...]
//        [--times=300,575] [--scale=1] [--gl=swangle]       (boundary n = between chapter n and chapter n+1)
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {FPS} from '../src/film';
import {SLOTS4} from '../src/film4';
import {resolveGl} from './glFlag';

const flag = (name: string): string | undefined => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const flags = process.argv.slice(2).filter((a) => a.startsWith('--'));
const list = (v: string | undefined): number[] | undefined => (v ? v.split(',').filter(Boolean).map(Number) : undefined);

const tile = (files: readonly string[], tall: boolean, out: string): void => {
  const [w, h] = tall ? [360, 640] : [640, 360];
  const inputs = files.flatMap((f) => ['-i', f]);
  const scaled = files.map((_, i) => `[${i}:v]scale=${w}:${h}[s${i}]`).join(';');
  const stack = files.map((_, i) => `[s${i}]`).join('');
  execFileSync('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', `${scaled};${stack}hstack=inputs=${files.length}[v]`, '-map', '[v]', '-frames:v', '1', out]);
};

const main = async (): Promise<void> => {
  const comp = flag('comp') ?? 'Master4';
  const outDir = path.resolve(flag('out') ?? 'out/review/c1');
  const scale = Number(flag('scale') ?? 1);
  const formats = flag('only') ? [flag('only') as string] : ['wide', 'tall'];
  const times = list(flag('times'));
  const boundaries = times ? [] : (list(flag('boundaries')) ?? SLOTS4.slice(1).map((_, i) => i + 1));
  mkdirSync(outDir, {recursive: true});
  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
  const browser = await openBrowser('chrome', {browserExecutable: process.env.FILM_BROWSER ?? null, chromiumOptions: {gl: resolveGl(flags)}});
  const still = async (composition: Awaited<ReturnType<typeof selectComposition>>, frame: number, output: string): Promise<void> => {
    const began = Date.now();
    await renderStill({composition, serveUrl, frame, output, scale, imageFormat: 'png', puppeteerInstance: browser});
    console.log('still', composition.id, `f${frame}`, `${(frame / FPS).toFixed(2)}s`, `${((Date.now() - began) / 1000).toFixed(2)}s`, output);
  };
  for (const format of formats) {
    const composition = await selectComposition({serveUrl, id: `${comp}-${format}`, puppeteerInstance: browser});
    for (const t of times ?? []) {
      await still(composition, Math.round(t * FPS), path.join(outDir, `${comp}-${format}-t${t}s@${scale}x.png`));
    }
    for (const n of boundaries) {
      const prev = SLOTS4[n - 1];
      const next = SLOTS4[n];
      if (!prev || !next) continue;
      const end = Math.round(prev.end * FPS);
      const frames = [end - FPS / 2, end - 1, end, end + FPS / 2];
      const files: string[] = [];
      for (const frame of frames) {
        const output = path.join(outDir, 'frames', `${comp}-${format}-b${n}-f${frame}.png`);
        mkdirSync(path.dirname(output), {recursive: true});
        await still(composition, frame, output);
        files.push(output);
      }
      const sheet = path.join(outDir, `boundary-${String(n).padStart(2, '0')}-${prev.id}-${next.id}-${format}.png`);
      tile(files, format === 'tall', sheet);
      console.log('sheet', sheet);
    }
  }
  await browser.close({silent: true});
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
