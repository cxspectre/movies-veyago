// sheetProof.ts — stills of the endless sheet at the moments that matter, with the time each one took.
// usage: npx tsx tools/sheetProof.ts [--scale=1] [--out=out/review/s1a] [--only=wide|tall] [--times=18,570,...] [--comp=Sheet4] [--gl=swangle]
// Default times: every chapter hand-off (a frame before each chapter ends and the one it starts on), 0:18 (the pull-back) and 9:30.
// FILM_GL picks the GL renderer (cloud: swangle); FILM_BROWSER a browser executable.
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {FPS} from '../src/film';
import {SLOTS4} from '../src/film4';
import {resolveGl} from './glFlag';

const flag = (name: string): string | undefined => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const flags = process.argv.slice(2).filter((a) => a.startsWith('--'));

const defaultTimes = (): readonly number[] => {
  const handoffs = SLOTS4.flatMap((s) => [s.start]);
  return [...new Set([...handoffs, 18, 22, 570, 581, 599])].sort((a, b) => a - b);
};

const main = async (): Promise<void> => {
  const scale = Number(flag('scale') ?? 1);
  const outDir = path.resolve(flag('out') ?? 'out/review/s1a');
  const comp = flag('comp') ?? 'Sheet4';
  const formats = flag('only') ? [flag('only') as string] : ['wide', 'tall'];
  const times = flag('times') ? (flag('times') as string).split(',').map(Number) : defaultTimes();
  mkdirSync(outDir, {recursive: true});
  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
  const browser = await openBrowser('chrome', {browserExecutable: process.env.FILM_BROWSER ?? null, chromiumOptions: {gl: resolveGl(flags)}});
  for (const format of formats) {
    const composition = await selectComposition({serveUrl, id: `${comp}-${format}`, puppeteerInstance: browser});
    for (const t of times) {
      const frame = Math.min(composition.durationInFrames - 1, Math.round(t * FPS));
      const output = path.join(outDir, `${comp}-${format}-${String(t).replace('.', '_')}s@${scale}x.png`);
      const started = Date.now();
      await renderStill({composition, serveUrl, frame, output, scale, imageFormat: 'png', puppeteerInstance: browser});
      console.log('proof', format, `${t}s`, `${((Date.now() - started) / 1000).toFixed(2)}s`, output);
    }
  }
  await browser.close({silent: true});
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
