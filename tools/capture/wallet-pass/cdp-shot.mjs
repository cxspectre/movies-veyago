// cdp-shot.mjs <page.html> <out.png> <width> <height> <scale>
// Screenshots a local page with Remotion's bundled chrome-headless-shell over the DevTools
// protocol (its --screenshot flag does not write a file on this machine). Node 22 WebSocket.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CHROME = join(HERE, '../../../node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell');
const PORT = 9333;
const [page, out, width, height, scale] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function targetSocket() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const tab = list.find((t) => t.type === 'page');
      if (tab) return tab.webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('headless shell did not start');
}

function client(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const waiting = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id); }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const n = ++id;
    waiting.set(n, (msg) => (msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)));
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  return new Promise((resolve) => { ws.onopen = () => resolve({ send, close: () => ws.close() }); });
}

async function main() {
  const chrome = spawn(CHROME, [`--remote-debugging-port=${PORT}`, '--no-sandbox', '--disable-gpu', '--use-mock-keychain',
    '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
  try {
    const cdp = await client(await targetSocket());
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: +width, height: +height, deviceScaleFactor: +scale, mobile: false });
    await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
    await cdp.send('Page.enable');
    await cdp.send('Page.navigate', { url: `file://${page}` });
    await sleep(1500);
    await cdp.send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => true)', awaitPromise: true });
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(out, Buffer.from(shot.data, 'base64'));
    cdp.close();
    console.log(out);
  } finally {
    chrome.kill();
  }
}

main().catch((error) => { console.error('cdp-shot failed:', error.message); process.exit(1); });
