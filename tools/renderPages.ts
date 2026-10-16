// renderPages.ts — render every sketch's FINISHED state to a transparent 2x PNG: public/tex/pages/<id>.png.
// Held pages (stacks on the desk, the wall's tiles) draw these images instead of re-running the pencil canvas.
// usage: npx tsx tools/renderPages.ts [sketch-id ...]   (no ids = all sketches in src/sketches/registry.ts + EXTRA_PAGES;
//        'v1-home-note' renders the wall's V1 tile; re-render it whenever v1-home changes)
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {mkdirSync, readFileSync} from 'node:fs';
import path from 'node:path';

const FINISHED_FRAME = 59;
const SCALE = 2;
/** Pages other than the sketches themselves: [composition id, file name]. The V1 sheet with its sticky note is the
 * wall's tile 1 (src/scenes/wall/pages.tsx, registered by the wall's previews). Rendered when no ids are given. */
const EXTRA_PAGES: readonly (readonly [string, string])[] = [['WallPage-v1-home-note', 'v1-home-note']];

const idsFromRegistry = (): string[] => {
  const source = readFileSync(path.resolve('src/sketches/registry.ts'), 'utf8');
  const list = /SKETCH_IDS[^=]*=\s*\[([^\]]*)\]/.exec(source)?.[1] ?? '';
  return [...list.matchAll(/'([^']+)'/g)].map((m) => m[1] as string);
};

const main = async (): Promise<void> => {
  const requested = process.argv.slice(2);
  const extraFiles = EXTRA_PAGES.map(([, file]) => file);
  const ids = requested.length > 0 ? requested.filter((id) => !extraFiles.includes(id)) : idsFromRegistry();
  const outDir = path.resolve('public/tex/pages');
  mkdirSync(outDir, {recursive: true});
  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
  const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
  for (const id of ids) {
    const composition = await selectComposition({serveUrl, id: `SketchAlpha-${id}`, puppeteerInstance: browser});
    const output = path.join(outDir, `${id}.png`);
    await renderStill({composition, serveUrl, frame: FINISHED_FRAME, output, scale: SCALE, imageFormat: 'png', puppeteerInstance: browser});
    console.log('page', output);
  }
  const extras = requested.length > 0 ? EXTRA_PAGES.filter(([, file]) => requested.includes(file)) : EXTRA_PAGES;
  for (const [id, file] of extras) {
    const composition = await selectComposition({serveUrl, id, puppeteerInstance: browser});
    const output = path.join(outDir, `${file}.png`);
    await renderStill({composition, serveUrl, frame: FINISHED_FRAME, output, scale: SCALE, imageFormat: 'png', puppeteerInstance: browser});
    console.log('page', output);
  }
  await browser.close({silent: true});
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
