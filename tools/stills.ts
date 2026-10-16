// stills.ts — render many stills of one composition with a single bundle + browser, then tile a contact sheet.
// usage: npx tsx tools/stills.ts <CompositionId> <scale> <frame,frame,...> [--sheet=out/sheet.png] [--cols=4] [--gl=swangle|angle|egl|vulkan|default]
// FILM_GL sets the default renderer (angle); --gl overrides it.
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {resolveGl} from './glFlag';

const [compId, scaleArg, framesArg, ...flags] = process.argv.slice(2);
if (!compId || !scaleArg || !framesArg) {
  console.error('usage: tsx tools/stills.ts <CompositionId> <scale> <frame,frame,...> [--sheet=path] [--cols=4]');
  process.exit(1);
}
const flag = (name: string): string | undefined => flags.find((f) => f.startsWith(`--${name}=`))?.split('=')[1];
const scale = Number(scaleArg);
const frames = framesArg.split(',').map((f) => Number(f.trim()));
const outDir = path.resolve('out/stills', compId);
mkdirSync(outDir, {recursive: true});

const main = async (): Promise<void> => {
  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
  const browser = await openBrowser('chrome', {chromiumOptions: {gl: resolveGl(flags)}});
  const composition = await selectComposition({serveUrl, id: compId, puppeteerInstance: browser});
  const files: string[] = [];
  for (const frame of frames) {
    const output = path.join(outDir, `f${String(frame).padStart(5, '0')}.png`);
    await renderStill({composition, serveUrl, frame, output, scale, puppeteerInstance: browser, imageFormat: 'png'});
    files.push(output);
    console.log('still', output);
  }
  await browser.close({silent: true});
  const sheet = flag('sheet');
  if (sheet) {
    const cols = Number(flag('cols') ?? 4);
    const rows = Math.ceil(files.length / cols);
    const inputs = files.flatMap((f) => ['-i', f]);
    // Tiles fit a 640 px box in the composition's own aspect (640x360 wide, 360x640 tall), so tall sheets don't overlap.
    const tall = composition.height > composition.width;
    const tileW = tall ? Math.round((640 * composition.width) / composition.height / 2) * 2 : 640;
    const tileH = tall ? 640 : Math.round((640 * composition.height) / composition.width / 2) * 2;
    const scaleFilter = files.map((_, i) => `[${i}:v]scale=${tileW}:${tileH}[s${i}]`).join(';');
    const layout = files.map((_, i) => `${(i % cols) * tileW}_${Math.floor(i / cols) * tileH}`).join('|');
    const stack = files.map((_, i) => `[s${i}]`).join('');
    const filter = `${scaleFilter};${stack}xstack=inputs=${files.length}:layout=${layout}[v]`;
    mkdirSync(path.dirname(path.resolve(sheet)), {recursive: true});
    execFileSync('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', filter, '-map', '[v]', '-frames:v', '1', sheet]);
    console.log('sheet', sheet, `${cols}x${rows}`);
  }
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
