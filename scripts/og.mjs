// Generates public/og.png (1200×630) and public/apple-touch-icon.png (180×180) with headless Chrome.
// Run: npm run og   (needs Google Chrome installed; set CHROME_PATH to override the location)
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const font = (p) => `data:font/woff2;base64,${readFileSync(resolve(root, 'node_modules', p)).toString('base64')}`;
const faces = `
@font-face { font-family: G; src: url(${font('@fontsource-variable/geist/files/geist-latin-wght-normal.woff2')}); font-weight: 100 900; }
@font-face { font-family: GM; src: url(${font('@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2')}); font-weight: 100 900; }
@font-face { font-family: S; src: url(${font('@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2')}); font-style: italic; }
@font-face { font-family: S; src: url(${font('@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2')}); }`;
const favicon = readFileSync(resolve(root, 'public/favicon.svg'), 'utf8');
// The terminal in the image shows the toy router's real output for the site's first example.
const { route, newSession, EXAMPLES, TIERS } = await import('../src/shared/router.ts');
const ex = route(EXAMPLES[0], newSession());
const cacheLine = ex.cache.decision === 'stay' ? `stay on ${TIERS[ex.routed]}` : `${ex.cache.decision} → ${TIERS[ex.routed]}`;

const og = `<!doctype html><html><head><style>${faces}
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; background: #0d0e10; color: #ecedee; font-family: G; position: relative; overflow: hidden; }
.glow { position: absolute; inset: -40% -10% auto auto; width: 900px; height: 900px; background: radial-gradient(closest-side, rgb(170 166 255 / .16), transparent 70%); }
.glow2 { position: absolute; right: -160px; bottom: -380px; width: 760px; height: 760px; background: radial-gradient(closest-side, rgb(94 224 143 / .13), transparent 70%); }
.wrap { position: absolute; inset: 60px 64px 96px 72px; display: grid; grid-template-columns: 1fr 470px; gap: 40px; align-items: center; }
.right { position: relative; }
.k { font: 500 20px/1 GM; letter-spacing: .08em; text-transform: uppercase; color: #969ba3; }
h1 { font-size: 92px; line-height: .95; font-weight: 680; letter-spacing: -.045em; margin: 18px 0 18px; }
.t { font: 400 42px/1.12 S; max-width: 19ch; }
.t em { font-style: italic; } .p { color: #aaa6ff; } .l { color: #5ee08f; }
.u { position: absolute; left: 72px; bottom: 44px; font: 500 20px/1 GM; color: #969ba3; display: flex; gap: 14px; align-items: center; }
.u svg { width: 30px; height: 30px; }
.term { margin-left: 70px; background: #0a0b0c; border: 1px solid #24262b; border-radius: 18px; padding: 20px 22px 20px 92px; font: 400 17px/1.75 GM; color: #e8e9eb; box-shadow: 0 30px 80px -30px #000; }
.term .d { color: #9095a0; } .term .g { color: #5ee08f; } .term .v { color: #b4b0ff; background: #22204a; padding: 0 6px; border-radius: 4px; }
.phone { position: absolute; left: 0; top: 50%; translate: 0 -50%; width: 134px; height: 272px; border-radius: 22px; background: linear-gradient(150deg,#34363c,#0f1013); padding: 6px; box-shadow: 0 20px 50px -20px #000; }
.scr { width: 100%; height: 100%; border-radius: 17px; background: #131417; display: grid; place-items: center; }
.qr { width: 82px; height: 82px; background: #fff; border-radius: 6px; padding: 6px; display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; }
.qr i { background: #111; border-radius: 1px; } .qr i:nth-child(3n) { background: transparent; } .qr i:nth-child(7n+2) { background: #111; }
</style></head><body><div class="glow"></div><div class="glow2"></div>
<div class="wrap"><div><p class="k">Senior iOS Engineer · Applied AI</p><h1>Swapnil<br>Dhiman</h1>
<p class="t">I build for two runtimes: <em class="p">the phone in your hand</em> and <em class="l">the agent loop behind it.</em></p></div>
<div class="right"><div class="term"><div class="d">agent loop · toy router</div><div><span class="g">›</span> ${ex.prompt}</div><div><span class="d">intent&nbsp;</span> ${ex.intent} <span class="g">${ex.confidence.toFixed(2)}</span></div><div><span class="d">filters</span> 1 2 3 4 5 <span class="g">✓</span></div><div><span class="d">cache&nbsp;&nbsp;</span> ${cacheLine}</div><div><span class="d">route&nbsp;&nbsp;</span> <span class="v">${TIERS[ex.routed]}</span> · ${ex.ms} ms</div></div>
<div class="phone"><div class="scr"><div class="qr">${'<i></i>'.repeat(49)}</div></div></div></div></div>
<p class="u">${favicon}swapnildhiman19.github.io · Walmart Global Tech · Bengaluru</p>
</body></html>`;

const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(og);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: resolve(root, 'public/og.png') });
await page.setViewportSize({ width: 180, height: 180 });
await page.setContent(`<body style="margin:0;background:#141518">${favicon.replace('<svg ', '<svg width="180" height="180" ')}</body>`);
await page.screenshot({ path: resolve(root, 'public/apple-touch-icon.png') });
await browser.close();
console.log('wrote public/og.png and public/apple-touch-icon.png');
