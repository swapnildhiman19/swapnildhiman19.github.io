// Renders one toy-router trace as HTML. Used at build time (the example in the hero) and in the browser.
import { TIERS, type Trace } from './router.ts';
import { esc } from '../render/h.ts';

const fmt = (n: number) => n.toFixed(2);

export function cacheSentence(t: Trace): string {
  const { from, to, stayCost, switchCost, decision } = t.cache;
  switch (decision) {
    case 'same':
      return `already on ${TIERS[from]}, nothing to switch`;
    case 'upgrade':
      return `${TIERS[to]} is needed: upgrade from ${TIERS[from]} and rebuild the cache`;
    case 'switch':
      return `switching to ${TIERS[to]} costs ${switchCost} units, staying costs ${stayCost} → switch`;
    case 'stay':
      return `switching to ${TIERS[to]} costs ${switchCost} units, staying on ${TIERS[from]} costs ${stayCost} → stay`;
  }
}

export function traceHTML(t: Trace): string {
  const [a, b, c] = t.top;
  const intent = t.fallback
    ? `<b>${esc(t.intent)}</b> <span class="tr-badge">regex fallback</span> <span class="tr-alt">best match ${esc(a.id)} ${fmt(a.p)} &lt; 0.55</span>`
    : `<b>${esc(t.intent)}</b> <span class="tr-num">${fmt(a.p)}</span> <span class="tr-alt">${esc(b.id)} ${fmt(b.p)} · ${esc(c.id)} ${fmt(c.p)}</span>`;
  const filters = t.filters
    .map((f) => `<li><span class="tr-n">${f.n}</span> ${esc(f.name)}: ${esc(f.detail)}${f.n < 5 ? ' <span class="tr-ok">✓</span>' : ''}</li>`)
    .join('');
  return `<div class="trace" data-tier="${t.routed}">
  <p class="tr-prompt"><span class="tr-caret" aria-hidden="true">›</span> ${esc(t.prompt)}</p>
  <div class="tr-row" data-step="1"><span class="tr-k">intent</span><span class="tr-v">${intent}</span></div>
  <div class="tr-row" data-step="2"><span class="tr-k">filters</span><ol class="tr-filters">${filters}</ol></div>
  <div class="tr-row" data-step="3"><span class="tr-k">cache</span><span class="tr-v">${esc(cacheSentence(t))}</span></div>
  <div class="tr-row tr-route" data-step="4"><span class="tr-k">route</span><span class="tr-v"><b class="tier" data-tier="${t.routed}">${TIERS[t.routed]}</b> · ${t.ms} ms <span class="tr-alt">(simulated)</span></span></div>
</div>`;
}
