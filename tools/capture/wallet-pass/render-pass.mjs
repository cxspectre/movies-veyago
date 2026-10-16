// Renders public/footage/wallet-pass.pass.json (built by build-pass.mjs from the production
// pass code) into a front-of-pass PNG at 3x, laid out like Wallet's generic pass template:
// logo + logoText top left, header field top right, primary field, the 90 pt thumbnail beside
// it, then the secondary and auxiliary rows. Wallet draws passes in SF Pro; the film may not use
// Apple typefaces, so this render sets DM Sans (public/fonts) in its place. Run:
//   node tools/capture/wallet-pass/render-pass.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FILM = join(HERE, '..', '..', '..');
const FOOTAGE = join(FILM, 'public', 'footage');
const SCRATCH = '/tmp/pv-film-pass';
// Pass size in points on a 402 pt wide iPhone (16 pt margins each side), and its corner radius.
const PASS = { width: 370, height: 300, radius: 14, padding: 14, scale: 3 };

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function field(f, extraClass = '') {
  const align = f.textAlignment === 'PKTextAlignmentRight' ? ' right' : '';
  return `<div class="field ${extraClass}${align}">${f.label ? `<div class="label">${esc(f.label)}</div>` : ''}<div class="value">${esc(f.value)}</div></div>`;
}

function html(pass) {
  const g = pass.generic;
  const rgb = (s) => s.replace(/\s+/g, '');
  const thumb = pass._film?.thumbnail;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'DM Sans'; font-weight: 400; src: url('file://${FILM}/public/fonts/dm-sans-latin-400-normal.woff2'); }
@font-face { font-family: 'DM Sans'; font-weight: 500; src: url('file://${FILM}/public/fonts/dm-sans-latin-500-normal.woff2'); }
@font-face { font-family: 'DM Sans'; font-weight: 700; src: url('file://${FILM}/public/fonts/dm-sans-latin-700-normal.woff2'); }
html, body { margin: 0; background: transparent; }
.pass { box-sizing: border-box; width: ${PASS.width}px; height: ${PASS.height}px; border-radius: ${PASS.radius}px;
  padding: ${PASS.padding}px; background: ${rgb(pass.backgroundColor)}; color: ${rgb(pass.foregroundColor)};
  font-family: 'DM Sans'; position: relative; overflow: hidden; }
.label { color: ${rgb(pass.labelColor)}; font-size: 11px; font-weight: 700; letter-spacing: .02em; text-transform: uppercase; }
.value { font-size: 17px; font-weight: 400; margin-top: 2px; white-space: nowrap; }
.top { display: flex; justify-content: space-between; align-items: flex-start; height: 34px; }
.logo { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 500; }
.logo img { width: 30px; height: 30px; }
.header { text-align: right; } .header .value { font-size: 17px; font-weight: 500; }
.primary { margin-top: 26px; display: flex; justify-content: space-between; }
.primary > div > .field > .value { font-size: 24px; font-weight: 500; }
.thumb { width: 90px; height: 90px; }
.row { display: flex; justify-content: space-between; margin-top: 14px; }
.right { text-align: right; }
</style></head><body><div class="pass">
<div class="top"><div class="logo"><img src="file://${FOOTAGE}/wallet-pass-art/logo@3x.png">${esc(pass.logoText)}</div>
<div class="header">${g.headerFields.map((f) => field(f)).join('')}</div></div>
<div class="primary"><div>${g.primaryFields.map((f) => field(f)).join('')}
<div class="row">${g.secondaryFields.map((f) => field(f)).join('')}</div></div>
${thumb ? `<img class="thumb" src="file://${FOOTAGE}/wallet-pass-art/thumbnail@3x.png">` : ''}</div>
<div class="row">${g.auxiliaryFields.map((f) => field(f)).join('')}</div>
</div></body></html>`;
}

function main() {
  const pass = JSON.parse(readFileSync(join(FOOTAGE, 'wallet-pass.pass.json'), 'utf8'));
  mkdirSync(SCRATCH, { recursive: true });
  const page = join(SCRATCH, 'pass.html');
  writeFileSync(page, html(pass));
  const out = join(FOOTAGE, 'wallet-pass.png');
  execFileSync(process.execPath, [join(HERE, 'cdp-shot.mjs'), page, out, String(PASS.width), String(PASS.height),
    String(PASS.scale)], { stdio: 'inherit' });
}

try {
  main();
} catch (error) {
  console.error('render-pass failed:', error.message);
  process.exit(1);
}
