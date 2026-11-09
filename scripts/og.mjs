// Generates public/og.png (1200×630, the link-preview image) and public/apple-touch-icon.png (180×180).
// The preview shows the real 3D phone, photographed from the running site in its opening pose, beside the
// name and tagline. The lock screen's clock is pinned to 9:41 so the image doesn't carry the time it was made.
//
// Run: npm run build && npm run preview   (in one terminal)
//      npm run og [baseUrl]               (default http://localhost:4173; needs Google Chrome, CHROME_PATH to override)
//      npm run og -- --keep-shot          also writes the raw phone shot to qa/og-phone.png, to check the framing
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const base = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'http://localhost:4173';
const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const font = (p) => `data:font/woff2;base64,${readFileSync(resolve(root, 'node_modules', p)).toString('base64')}`;
const faces = `
@font-face { font-family: G; src: url(${font('@fontsource-variable/geist/files/geist-latin-wght-normal.woff2')}); font-weight: 100 900; }
@font-face { font-family: GM; src: url(${font('@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2')}); font-weight: 100 900; }
@font-face { font-family: S; src: url(${font('@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2')}); font-style: italic; }
@font-face { font-family: S; src: url(${font('@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2')}); }`;
const favicon = readFileSync(resolve(root, 'public/favicon.svg'), 'utf8');

const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--enable-gpu', '--use-angle=metal', '--ignore-gpu-blocklist'] });

// 1. Photograph the phone: opening pose, page text hidden, clock pinned to 9:41.
const shotPage = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await shotPage.clock.setFixedTime(new Date(2026, 8, 8, 9, 41));
await shotPage.goto(`${base}/`, { waitUntil: 'networkidle' });
await shotPage.waitForSelector('.xp.gl-ready', { timeout: 30000 });
await shotPage.addStyleTag({ content: '.xp__chapters, .xp__note, .top, .xp__rail, .xp__labels { visibility: hidden !important }' });
await shotPage.waitForTimeout(5000); // the phone turns round to face the camera and the notifications slide in
const png = await shotPage.locator('.xp__stage').screenshot();
if (process.argv.includes('--keep-shot')) writeFileSync(resolve(root, 'qa/og-phone.png'), png);
const phone = `data:image/png;base64,${png.toString('base64')}`;

// 2. Compose the card. The shot is 2880 × 1800 with the phone centred near (2205, 910). Scaled to 46 % and
//    shifted, the phone lands in the right half of the card; a mask fades the shot's background into the card.
const og = `<!doctype html><html><head><style>${faces}
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; background: radial-gradient(55% 90% at 80% 50%, #15163a 0%, #0b0c18 48%, #07080a 78%); color: #ecedee; font-family: G; position: relative; overflow: hidden; }
.phone { position: absolute; width: 1325px; height: 828px; left: -84px; top: -101px;
  -webkit-mask-image: radial-gradient(ellipse 22% 50% at 76.5% 50.6%, #000 72%, transparent 100%);
          mask-image: radial-gradient(ellipse 22% 50% at 76.5% 50.6%, #000 72%, transparent 100%); }
.text { position: absolute; left: 72px; top: 50%; transform: translateY(-54%); width: 600px; }
.k { font: 500 19px/1 GM; letter-spacing: .1em; text-transform: uppercase; color: #969ba3; }
h1 { font-size: 96px; line-height: .94; font-weight: 680; letter-spacing: -.045em; margin: 20px 0 22px; }
.t { font: 400 40px/1.12 S; max-width: 16ch; }
.t em { font-style: italic; } .p { color: #aaa6ff; } .l { color: #5ee08f; }
.u { position: absolute; left: 72px; bottom: 44px; font: 500 19px/1 GM; color: #969ba3; display: flex; gap: 14px; align-items: center; }
.u svg { width: 30px; height: 30px; }
</style></head><body>
<img class="phone" src="${phone}" alt="">
<div class="text"><p class="k">Senior iOS Engineer · Applied AI</p><h1>Swapnil<br>Dhiman</h1>
<p class="t">I build for two runtimes: <em class="p">the phone in your hand</em> and <em class="l">the agent loop behind it.</em></p></div>
<p class="u">${favicon}swapnildhiman19.github.io · Walmart Global Tech · Bengaluru</p>
</body></html>`;

const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(og);
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => [...document.images].every((i) => i.complete));
await page.screenshot({ path: resolve(root, 'public/og.png') });
await page.setViewportSize({ width: 180, height: 180 });
await page.setContent(`<body style="margin:0;background:#141518">${favicon.replace('<svg ', '<svg width="180" height="180" ')}</body>`);
await page.screenshot({ path: resolve(root, 'public/apple-touch-icon.png') });
await browser.close();
console.log('wrote public/og.png and public/apple-touch-icon.png');
