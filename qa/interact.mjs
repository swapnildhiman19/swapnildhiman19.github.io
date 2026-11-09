// Drives every interactive element with real input events and records what happened.
// Usage: node qa/interact.mjs [baseUrl] [outDir]
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const [base = 'http://localhost:4173', out = 'qa/interact'] = process.argv.slice(2);
const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--enable-gpu', '--use-angle=metal', '--ignore-gpu-blocklist'] });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`); };

async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  return { ctx, page, errors };
}

/* 1. Router toy, desktop */
{
  const { ctx, page, errors } = await newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.xp.gl-ready', { timeout: 15000 }).catch(() => {});
  check('3D: scene renders and replaces the still image', await page.locator('.xp.gl-ready').count() === 1);
  // scroll through every chapter and check the rail follows
  for (const c of ['overview', 'glass', 'identity', 'neural', 'board', 'loop']) {
    await page.evaluate((id) => { const el = document.querySelector(`article[data-chapter="${id}"]`); const r = el.getBoundingClientRect(); scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight / 2); }, c);
    await page.waitForTimeout(700);
    check(`3D: chapter "${c}" becomes active`, (await page.evaluate(() => document.querySelector('.xp').dataset.active)) === c);
  }
  check('3D: part labels shown in the loop chapter', await page.locator('.xl.is-on').count() >= 4);
  await page.locator('[data-goto="identity"]').click();
  await page.waitForTimeout(1600);
  check('3D: rail button jumps to its chapter', (await page.evaluate(() => document.querySelector('.xp').dataset.active)) === 'identity');
  await page.locator('.xp [data-motion]').click();
  check('3D: pause motion toggles', (await page.locator('.xp [data-motion]').getAttribute('aria-pressed')) === 'true');
  await page.locator('.xp [data-motion]').click();
  const term = page.locator('.xp [data-router]');
  await term.locator('input').click();
  await page.keyboard.type('design a token exchange flow for account linking');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1600);
  const lastTier = await term.locator('.trace').last().getAttribute('data-tier');
  check('router: typed prompt routes to premium (design intent floor)', lastTier === '2', `tier=${lastTier}`);
  const summary = await term.locator('[data-summary]').textContent();
  check('router: screen-reader summary announced', /Routed to premium/.test(summary ?? ''), summary?.slice(0, 60));
  check('router: session turn advanced', (await term.locator('[data-turn]').textContent()) === '5');
  await term.locator('[data-example-btn]').nth(1).click();
  await page.waitForTimeout(1600);
  const t2 = term.locator('.trace').last();
  check('router: example button runs a trace', (await t2.locator('.tr-prompt').textContent())?.includes('checkout crashing'));
  await term.locator('input').fill('hmm');
  await term.locator('button[type=submit]').click();
  await page.waitForTimeout(1600);
  check('router: low-confidence prompt uses the regex fallback', await term.locator('.trace').last().locator('.tr-badge').count() === 1);
  for (let i = 0; i < 3; i++) await term.locator('[data-redo]').click();
  check('router: redo is capped at 3 per session', await term.locator('[data-redo]').isDisabled());
  check('router: keeps at most 4 traces', (await term.locator('.trace').count()) <= 4);
  await page.screenshot({ path: `${out}/router-after.png` });
  // the living QR re-enactment lives on the Omni ID page
  await page.goto(base + '/work/omni-id/', { waitUntil: 'networkidle' });
  await page.locator('[data-qr]').scrollIntoViewIfNeeded();
  // QR expand + Escape returns focus
  await page.locator('[data-qr-expand]').first().click();
  await page.waitForTimeout(500);
  check('qr: expanded sheet opens', await page.locator('.sheet.is-open').count() === 1);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  check('qr: Escape closes the sheet', await page.locator('.sheet.is-open').count() === 0);
  check('qr: focus returns to the code', await page.evaluate(() => document.activeElement?.hasAttribute('data-qr-expand')));
  // QR expiry (sample 20 s) then refresh
  await page.waitForTimeout(21000);
  check('qr: code expires after the sample expiry', await page.locator('[data-qr-expired]').first().isVisible());
  const before = await page.locator('.idcard__qr .qr__ink').first().getAttribute('d');
  await page.locator('[data-qr-refresh]').first().click();
  await page.waitForTimeout(500);
  const after = await page.locator('.idcard__qr .qr__ink').first().getAttribute('d');
  check('qr: refresh shows a new code', before !== after && !(await page.locator('[data-qr-expired]').first().isVisible()));
  // theme + sound
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  const t0 = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.locator('[data-theme-toggle]').click();
  await page.waitForTimeout(500);
  const t1 = await page.evaluate(() => document.documentElement.dataset.theme);
  check('theme: toggle switches theme', t0 !== t1, `${t0} → ${t1}`);
  await page.reload({ waitUntil: 'networkidle' });
  check('theme: choice remembered after reload', (await page.evaluate(() => document.documentElement.dataset.theme)) === t1);
  await page.locator('[data-theme-toggle]').click();
  check('sound: off by default', (await page.locator('[data-sound]').getAttribute('aria-pressed')) === 'false');
  await page.locator('[data-sound]').click();
  check('sound: toggle turns it on', (await page.locator('[data-sound]').getAttribute('aria-pressed')) === 'true');
  await page.locator('[data-sound]').click();
  check('no console errors (home, desktop)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* 2. Diagram player */
{
  const { ctx, page, errors } = await newPage();
  await page.goto(base + '/work/token-os/', { waitUntil: 'networkidle' });
  const fig = page.locator('[data-player]');
  await fig.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await fig.locator('[data-play]').click(); // pause the autoplay
  await fig.locator('[data-replay]').click();
  await fig.locator('[data-play]').click(); // pause
  await fig.locator('[data-next]').click();
  await fig.locator('[data-next]').click();
  check('player: next steps forward', (await fig.locator('[data-count]').textContent())?.startsWith('Step 2'), await fig.locator('[data-count]').textContent());
  await fig.locator('[data-prev]').click();
  check('player: previous steps back', (await fig.locator('[data-count]').textContent())?.startsWith('Step 1'));
  check('player: focused node highlighted', await fig.locator('.dn.is-on').count() > 0);
  await fig.locator('[data-speed]').selectOption('2');
  await fig.locator('[data-play]').click();
  await page.waitForTimeout(1600);
  check('player: plays at 2× speed', (await fig.locator('[data-count]').textContent())?.startsWith('Step 2') || (await fig.locator('[data-count]').textContent())?.startsWith('Step 3'), await fig.locator('[data-count]').textContent());
  await page.screenshot({ path: `${out}/player.png` });
  check('no console errors (project page)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* 3. iOS flows on a phone-sized screen with touch */
{
  const { ctx, page, errors } = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  const ios = page.locator('[data-flows]');
  await ios.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await ios.locator('[data-flow-screen] [data-go]').tap();
  await ios.locator('.otp input').first().tap();
  await page.keyboard.type('111111');
  await ios.locator('[data-verify]').tap();
  check('otp: wrong code shows an error', /doesn’t match/.test((await ios.locator('[data-err]').textContent()) ?? ''));
  await ios.locator('.otp input').first().tap();
  for (let k = 0; k < 6; k++) await ios.locator('.otp input').nth(k).fill('');
  await ios.locator('.otp input').first().tap();
  await page.keyboard.type('246810');
  await ios.locator('[data-verify]').tap();
  await ios.locator('[data-flow-screen]', { hasText: 'one sign-in' }).waitFor({ timeout: 5000 }).catch(() => {});
  const otpText = ((await ios.locator('[data-flow-screen]').innerText()) ?? '').replace(/\s+/g, ' ');
  const otpVals = await ios.locator('.otp input').evaluateAll((els) => els.map((e) => e.value).join('')).catch(() => '');
  check('otp: right code links accounts (low risk)', /one sign-in/.test(otpText), `${otpVals} | ${otpText.slice(-70)}`);
  await ios.locator('[data-risk="high"]').tap();
  await ios.locator('[data-flow-screen] [data-go]').tap();
  await ios.locator('.otp input').first().tap();
  await page.keyboard.type('246810');
  await ios.locator('[data-verify]').tap();
  check('otp: high risk adds a step-up', /One more check/.test((await ios.locator('[data-flow-screen]').textContent()) ?? ''));
  await ios.locator('.otp input').first().tap();
  await page.keyboard.type('135790');
  await ios.locator('[data-verify]').tap();
  await page.waitForTimeout(1500);
  check('otp: step-up then success', /one sign-in/.test((await ios.locator('[data-flow-screen]').textContent()) ?? ''));
  await ios.locator('[data-flow-tab="merge"]').tap();
  await ios.locator('[data-flow-screen] [data-go]').tap();
  await ios.locator('.otp input').first().tap();
  await page.keyboard.type('135790');
  await ios.locator('[data-verify]').tap();
  check('merge: preview shows after email step-up', /Merge preview/.test((await ios.locator('[data-flow-screen]').textContent()) ?? ''));
  await ios.locator('[data-merge]').tap();
  await page.waitForTimeout(1500);
  check('merge: success after token exchange', /all your history/.test((await ios.locator('[data-flow-screen]').textContent()) ?? ''));
  await ios.screenshot({ path: `${out}/merge-done-390.png` });
  // mobile menu
  await page.evaluate(() => scrollTo(0, 0));
  await page.locator('.menu summary').tap();
  check('menu: opens on tap', await page.locator('.menu[open]').count() === 1);
  await page.locator('.menu__panel a[href="/#journey"]').tap();
  await page.waitForTimeout(800);
  check('menu: closes after choosing a link', await page.locator('.menu[open]').count() === 0);
  check('no console errors (home, phone)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* 4. Keyboard only */
{
  const { ctx, page } = await newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  check('keyboard: first Tab reaches the skip link', (await page.evaluate(() => document.activeElement?.textContent)) === 'Skip to content');
  await page.keyboard.press('Enter');
  const seen = new Set();
  let visibleRings = 0;
  const noRing = [];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      return { tag: el.tagName, text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30), ring: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 };
    });
    if (info) { seen.add(`${info.tag}:${info.text}`); if (info.ring) visibleRings++; else noRing.push(`${info.tag}:${info.text}`); }
  }
  check('keyboard: 60 tabs move through distinct controls', seen.size > 40, `${seen.size} distinct`);
  check('keyboard: focused controls show a focus ring', visibleRings >= 55, `${visibleRings}/60${noRing.length ? `; without an outline: ${noRing.join(', ')}` : ''}`);
  await ctx.close();
}

/* 5. JavaScript off */
{
  const { ctx, page } = await newPage({ javaScriptEnabled: false });
  await page.goto(base + '/', { waitUntil: 'load' });
  const text = await page.locator('main').innerText();
  check('no-JS: name, numbers and all project titles are in the HTML', ['Swapnil Dhiman', 'Top 20', '10M+', 'WibeyConductor', 'Bodega identity account merge', 'VoiceNote'].every((s) => text.includes(s)));
  check('no-JS: toy example trace is in the page', await page.locator('.xp .trace').count() === 1);
  check('no-JS: the still image of the phone is shown', await page.locator('.xp__poster').isVisible());
  check('no-JS: JS-only controls are hidden', !(await page.locator('[data-theme-toggle]').isVisible()) && (await page.locator('.xp [data-form]').count()) === 1 && !(await page.locator('.xp [data-form]').isVisible()));
  await page.screenshot({ path: `${out}/nojs-home.png`, fullPage: false });
  await page.goto(base + '/work/enterprise-brain/', { waitUntil: 'load' });
  check('no-JS: project page has diagram and steps', (await page.locator('.dgm__svg').count()) === 1 && (await page.locator('.dgm__steps li').count()) === 7);
  await page.goto(base + '/classic/', { waitUntil: 'load' });
  check('no-JS: classic view lists all 17 projects', (await page.locator('.c-proj').count()) === 17);
  await ctx.close();
}

/* 6. Reduced motion */
{
  const { ctx, page, errors } = await newPage({ reducedMotion: 'reduce' });
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  check('reduced motion: sections are not hidden for reveal', await page.evaluate(() => !document.documentElement.classList.contains('reveal-ready')));
  check('reduced motion: pause button hidden (nothing moves on its own)', !(await page.locator('.xp [data-motion]').isVisible()));
  const term = page.locator('.xp [data-router]');
  await term.locator('input').fill('rename the user id variable');
  await term.locator('input').press('Enter');
  await page.waitForTimeout(150);
  check('reduced motion: trace appears at once', (await term.locator('.trace').last().locator('.tr-row.is-pending').count()) === 0);
  await page.locator('#how').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  check('reduced motion: diagram does not autoplay', (await page.locator('#how [data-count]').textContent())?.startsWith('Step 0'));
  check('no console errors (reduced motion)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* 7. Deep links and 404 */
{
  const { ctx, page } = await newPage();
  const r1 = await page.goto(base + '/work/wibeyconductor/');
  check('deep link /work/wibeyconductor/ returns 200', r1?.status() === 200);
  // GitHub Pages serves 404.html for unknown paths; the local preview server does not, so check the file itself here
  await page.goto(base + '/404.html');
  check('404 page renders', /isn’t here/.test(await page.locator('h1').textContent() ?? ''));
  check('404 page is noindex', (await page.locator('meta[name=robots]').getAttribute('content')) === 'noindex');
  for (const f of ['/sitemap.xml', '/robots.txt', '/llms.txt', '/og.png', '/favicon.svg', '/Swapnil_Dhiman_Senior_iOS_AI_Engineer.pdf']) {
    const r = await page.request.get(base + f);
    check(`asset ${f} is served`, r.status() === 200);
  }
  await ctx.close();
}

await browser.close();
writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exitCode = failed.length ? 1 : 0;
