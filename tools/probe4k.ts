// probe4k.ts — H3: render the heaviest master frames at scale 2 (and optionally 1) with one bundle and one browser, and report
// seconds, browser + node memory, output size and a blank-frame check for each. Stills only.
// usage: FILM_GL=swangle npx tsx tools/probe4k.ts <Master4-wide|Master4-tall> <scale> <label=frame,label=frame,...> [--out=out/review/h3]
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {resolveGl} from './glFlag';

const [compId, scaleArg, framesArg, ...flags] = process.argv.slice(2);
if (!compId || !scaleArg || !framesArg) {
  console.error('usage: tsx tools/probe4k.ts <CompositionId> <scale> <label=frame,...> [--out=dir]');
  process.exit(1);
}
const outDir = path.resolve(flags.find((f) => f.startsWith('--out='))?.slice(6) ?? 'out/review/h3');
const scale = Number(scaleArg);
mkdirSync(outDir, {recursive: true});

/** Resident set of this process and every descendant (the browser and its GPU/renderer processes), in MB. */
const treeRssMb = (): number => {
  const rows = execFileSync('ps', ['-eo', 'pid=,ppid=,rss=']).toString().trim().split('\n').map((l) => l.trim().split(/\s+/).map(Number));
  const kids = new Map<number, number[]>();
  for (const [pid = 0, ppid = 0] of rows) kids.set(ppid, [...(kids.get(ppid) ?? []), pid]);
  const rss = new Map(rows.map(([pid = 0, , r = 0]) => [pid, r]));
  const walk = (pid: number): number => (rss.get(pid) ?? 0) + (kids.get(pid) ?? []).reduce((a, k) => a + walk(k), 0);
  return Math.round(walk(process.pid) / 1024);
};

const main = async (): Promise<void> => {
  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
  const browser = await openBrowser('chrome', {chromiumOptions: {gl: resolveGl(flags)}});
  const composition = await selectComposition({serveUrl, id: compId, puppeteerInstance: browser});
  let peak = 0;
  // /usr/bin/time is not on the cloud box, so sample the process tree while a still renders.
  const sampler = setInterval(() => { peak = Math.max(peak, treeRssMb()); }, 400);
  for (const item of framesArg.split(',')) {
    const [label = '', frameText = ''] = item.split('=');
    const frame = Number(frameText);
    const output = path.join(outDir, `${compId}-s${scale}-${label}-f${frame}.png`);
    const began = Date.now();
    let status = 'ok';
    try {
      await renderStill({composition, serveUrl, frame, output, scale, puppeteerInstance: browser, imageFormat: 'png', timeoutInMilliseconds: 180000});
    } catch (error) {
      status = `FAIL ${String(error).split('\n')[0]?.slice(0, 160)}`;
    }
    const seconds = ((Date.now() - began) / 1000).toFixed(1);
    const mb = treeRssMb();
    peak = Math.max(peak, mb);
    const framePeak = peak;
    let info = '';
    if (status === 'ok') {
      const {data, info: meta} = await sharp(output).resize(64, 36, {fit: 'fill'}).raw().toBuffer({resolveWithObject: true});
      const values = Array.from(data);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const spread = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
      const full = await sharp(output).metadata();
      info = `${full.width}x${full.height} mean ${mean.toFixed(0)} sd ${spread.toFixed(1)}${spread < 2 ? ' BLANK?' : ''} ch${meta.channels}`;
    }
    console.log(`${label} f${frame} ${seconds}s rss ${mb}MB (run peak ${framePeak}MB) ${status} ${info}`);
  }
  console.log(`tree-rss peak sampled ${peak}MB`);
  clearInterval(sampler);
  await browser.close({silent: true});
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
