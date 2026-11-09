// Screenshots of every chapter of the 3D experience (real WebGL, GPU flags on).
// Usage: node qa/xp.mjs [baseUrl] [outDir] [width] [height] [--poster]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const poster = process.argv.includes('--poster');
const [base = 'http://localhost:4173', out = 'qa/xp', w = '1440', hgt = '900'] = args;
const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
mkdirSync(poster ? dirname(resolve(out)) : out, { recursive: true });
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--enable-gpu', '--use-angle=metal', '--ignore-gpu-blocklist'] });
const mobile = Number(w) < 768;
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(hgt) }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: poster ? 1 : 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.waitForSelector('.xp.gl-ready', { timeout: 15000 }).catch(() => errors.push('gl-ready never set'));
if (poster) {
  // the still image used before WebGL is ready, and without JavaScript: the intro pose, without the text
  await page.addStyleTag({ content: '.xp__chapters, .xp__note, .top, .xp__rail, .xp__labels { visibility: hidden !important }' });
  await page.waitForTimeout(2500);
  await page.locator('.xp__stage').screenshot({ path: resolve(out), type: 'jpeg', quality: 78 });
  await browser.close();
  console.log('poster written', errors.join(' | '));
  process.exit(0);
}
const chapters = await page.$$eval('[data-chapter]', (els) => els.map((e) => e.dataset.chapter));
for (const c of chapters) {
  await page.evaluate((id) => {
    const el = document.querySelector(`[data-chapter="${id}"]`);
    const r = el.getBoundingClientRect();
    scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight / 2);
  }, c);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${out}/${w}-${c}.png` });
}
if (!mobile) {
  // route a prompt and catch the packet mid-flight
  const input = page.locator('.xp [data-router] input');
  await input.fill('design a token exchange flow for account linking');
  await input.press('Enter');
  await page.waitForTimeout(1900);
  await page.screenshot({ path: `${out}/${w}-route-packet.png` });
}
console.log(chapters.join(', '));
console.log(errors.length ? `errors: ${errors.join(' | ')}` : 'no console errors');
await browser.close();
