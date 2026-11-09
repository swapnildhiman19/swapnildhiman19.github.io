// Runs Lighthouse (desktop and mobile) on the home page and one project page and prints the four scores.
// Usage: node qa/lighthouse.mjs <path-to-lighthouse-cli> [baseUrl]
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';

const [cli, base = 'http://localhost:4173'] = process.argv.slice(2);
const env = { ...process.env, CHROME_PATH: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' };
mkdirSync('qa/lighthouse', { recursive: true });
const pages = [['/', 'home'], ['/work/wibeyconductor/', 'project']];
for (const [path, name] of pages) {
  for (const form of ['desktop', 'mobile']) {
    const out = `qa/lighthouse/${form}-${name}`;
    const args = [base + path, '--quiet', '--chrome-flags=--headless=new', '--output=json', '--output=html', `--output-path=${out}`];
    if (form === 'desktop') args.push('--preset=desktop');
    try { execFileSync(cli, args, { env, stdio: 'ignore' }); } catch { /* lighthouse exits non-zero on some warnings; the report is still written */ }
    const r = JSON.parse(readFileSync(`${out}.report.json`, 'utf8'));
    const s = Object.fromEntries(Object.entries(r.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
    const a = r.audits;
    console.log(`${form.padEnd(7)} ${name.padEnd(8)} perf ${s.performance}  a11y ${s.accessibility}  bp ${s['best-practices']}  seo ${s.seo}  | LCP ${a['largest-contentful-paint'].displayValue}  TBT ${a['total-blocking-time'].displayValue}  CLS ${a['cumulative-layout-shift'].displayValue}`);
  }
}
