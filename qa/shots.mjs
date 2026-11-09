// Screenshots of the built site. Usage: node qa/shots.mjs [baseUrl] [outDir] [paths...]
// Default: every route at 390×844, 1280×800 and 1440×900, full page, plus console errors per page.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const [base = 'http://localhost:4173', out = resolve(root, 'qa/screens'), ...only] = process.argv.slice(2);
const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const { projects } = await import('../src/data.ts');
// (GitHub Pages serves 404.html for unknown paths; the local preview does not, so the 404 page is checked by its file name)
const paths = only.length ? only : ['/', ...projects.map((p) => `/work/${p.slug}/`), '/classic/', '/404.html'];
const viewports = [
  { name: '390', width: 390, height: 844, mobile: true },
  { name: '1280', width: 1280, height: 800 },
  { name: '1440', width: 1440, height: 900 },
];

const browser = await chromium.launch({ executablePath: chrome, headless: true });
const report = [];
for (const vp of viewports) {
  mkdirSync(`${out}/${vp.name}`, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, isMobile: !!vp.mobile, hasTouch: !!vp.mobile, colorScheme: process.env.SCHEME ?? 'light' });
  for (const p of paths) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()}`));
    const res = await page.goto(base + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const name = p === '/' ? 'home' : p.replace(/^\/|\/$/g, '').replace(/\//g, '_');
    await page.screenshot({ path: `${out}/${vp.name}/${name}--fold.png` });
    // scroll through so lazy pieces and reveals run, then capture the whole page
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += vp.height * 0.7) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(140); }
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/${vp.name}/${name}--full.jpg`, fullPage: true, type: 'jpeg', quality: 70 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    report.push({ viewport: vp.name, path: p, status: res?.status(), overflowX: overflow, errors });
    await page.close();
  }
  await ctx.close();
}
await browser.close();
writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
for (const r of report) if (r.errors.length || r.overflowX > 0) console.log(r.viewport, r.path, r.status, `overflowX=${r.overflowX}`, r.errors.slice(0, 3).join(' | '));
console.log(`checked ${report.length} page views`);
