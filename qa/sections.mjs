// Element screenshots of each home-page section. Usage: node qa/sections.mjs [baseUrl] [outDir] [width] [height] [scheme]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const [base = 'http://localhost:4173', out = 'qa/sections', w = '1440', hgt = '900', scheme = 'light'] = process.argv.slice(2);
const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const mobile = Number(w) < 768;
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(hgt) }, isMobile: mobile, hasTouch: mobile, colorScheme: scheme });
await page.goto(base + '/', { waitUntil: 'networkidle' });
const sel = { stage: '.stage', work: '#work', how: '#how', ios: '#ios', journey: '#journey', more: '.more', contact: '#contact', footer: '.foot' };
for (const [name, s] of Object.entries(sel)) {
  const el = page.locator(s).first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await el.screenshot({ path: `${out}/${w}-${scheme}-${name}.png` });
}
await browser.close();
console.log('done');
