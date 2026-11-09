// Prints the layout shifts Lighthouse recorded for a report. Usage: node qa/cls.mjs qa/lighthouse/mobile-home.report.json
import { readFileSync } from 'node:fs';

const r = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const items = r.audits['layout-shifts']?.details?.items ?? [];
for (const i of items) console.log(i.score?.toFixed(4), i.node?.selector ?? '', '|', (i.node?.snippet ?? '').slice(0, 120));
for (const i of items) for (const s of i.subItems?.items ?? []) console.log('   cause:', s.cause ?? JSON.stringify(s).slice(0, 120));
