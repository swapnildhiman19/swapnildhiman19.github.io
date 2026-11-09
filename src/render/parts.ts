// Reusable pieces of markup: device frame, sample QR card, the agent-loop window, diagrams, cards.
import { h, raw, type Raw } from './h.ts';
import { icons } from './icons.ts';
import { labels, lanes, person, site, type Diagram, type DiagramNode, type Project } from '../data.ts';
import { qrPath, QR_SIZE } from '../shared/qr.ts';
import { commit, newSession, route, TIERS, EXAMPLES } from '../shared/router.ts';
import { traceHTML } from '../shared/trace-html.ts';

export const label = (text: string): Raw => h`<span class="label"><span class="label__dot" aria-hidden="true"></span>${text}</span>`;

export const chips = (items: string[], cls = 'chips'): Raw => h`<ul class="${cls}" role="list">${items.map((s) => h`<li>${s}</li>`)}</ul>`;

export const ext = (href: string, text: string): Raw =>
  h`<a href="${href}" rel="noopener" target="_blank">${text}<span class="sr-only"> (opens in a new tab)</span>${icons.arrowUp}</a>`;

export const resumeLink = (cls = 'btn btn--ghost'): Raw =>
  h`<a class="${cls}" href="${site.resume}" target="_blank" rel="noopener">${icons.download}<span>Résumé <span class="muted">(PDF)</span></span><span class="sr-only"> (opens in a new tab)</span></a>`;

export const contactLinks = (): Raw => h`<ul class="links" role="list">
  <li><a href="mailto:${person.email}">${icons.mail}<span>${person.email}</span></a></li>
  <li>${ext(person.linkedin, 'LinkedIn')}</li>
  <li>${ext(person.github, 'GitHub')}</li>
</ul>`;

/* ───────── The phone ───────── */

export function device(screen: Raw, caption: Raw | string, cls = ''): Raw {
  return h`<figure class="device ${cls}">
  <div class="device__body">
    <span class="device__btn device__btn--a" aria-hidden="true"></span><span class="device__btn device__btn--b" aria-hidden="true"></span>
    <div class="device__screen">
      <div class="device__status" aria-hidden="true"><span>10:24</span><span class="device__cam"></span><span class="device__sig"></span></div>
      ${screen}
    </div>
  </div>
  ${caption ? h`<figcaption class="device__cap">${caption}</figcaption>` : ''}
</figure>`;
}

export const qrSvg = (seed: number): Raw =>
  raw(`<svg class="qr" viewBox="-2 -2 ${QR_SIZE + 4} ${QR_SIZE + 4}" role="img" aria-label="Sample identity code (a pattern, not scannable)"><rect x="-2" y="-2" width="${QR_SIZE + 4}" height="${QR_SIZE + 4}" rx="2" class="qr__bg"/><path class="qr__ink" d="${qrPath(seed)}"/></svg>`);

export function qrScreen(seed = 7): Raw {
  return h`<div class="app app--qr" data-qr data-seed="${seed}">
  <div class="app__head"><span class="app__title">Account</span><span class="app__chip">Canada + US</span></div>
  <div class="idcard">
    <p class="idcard__k">Your identity code</p>
    <p class="idcard__name">Sample Customer</p>
    <button class="idcard__qr" type="button" data-qr-expand aria-expanded="false" aria-label="Expand the sample identity code">${qrSvg(seed)}</button>
    <div class="idcard__expired" data-qr-expired hidden>
      <p>Code expired</p>
      <button class="btn btn--small" type="button" data-qr-refresh>Refresh code</button>
    </div>
    <p class="idcard__timer"><span class="idcard__ring" aria-hidden="true"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.5"/><circle class="idcard__ring-fg" cx="18" cy="18" r="15.5" pathLength="100"/></svg></span><span data-qr-timer>Refreshes on every visit</span></p>
  </div>
  <p class="app__foot">Show this code at pickup</p>
</div>`;
}

/* ───────── The agent loop (toy WibeyConductor) ───────── */

export function loopWindow(idSuffix = 'hero'): Raw {
  // The example is turn 3; the header shows the session state after it, exactly as the browser will.
  const example = route(EXAMPLES[0], newSession());
  const session = commit(newSession(), example);
  return h`<section class="term" aria-labelledby="term-title-${idSuffix}" data-router data-example="${EXAMPLES[0]}">
  <header class="term__bar">
    <span class="term__title" id="term-title-${idSuffix}">agent loop <span class="term__dim">· WibeyConductor, toy</span></span>
    <span class="term__state" aria-label="Toy session state">turn <b data-turn>${session.turn}</b> · on <b data-tier-now>${TIERS[session.tier]}</b> · <b data-cached>${session.cachedK}K</b> cached</span>
  </header>
  <div class="term__log" data-log>${raw(traceHTML(example))}</div>
  <p class="sr-only" aria-live="polite" data-summary></p>
  <form class="term__form js-only" data-form>
    <label class="sr-only" for="prompt-${idSuffix}">A coding request for the toy router</label>
    <span class="tr-caret" aria-hidden="true">›</span>
    <input id="prompt-${idSuffix}" name="prompt" type="text" autocomplete="off" spellcheck="false" maxlength="160" placeholder="Type a coding request…" />
    <button class="term__go" type="submit">Route ${icons.arrow}</button>
  </form>
  <div class="term__examples js-only" role="group" aria-label="Example requests">
    ${EXAMPLES.map((e) => h`<button type="button" data-example-btn>${e}</button>`)}
  </div>
  <footer class="term__foot">
    ${label(labels.toy)}
    <span class="term__foot-actions"><button class="term__link js-only" type="button" data-redo>Redo last turn</button><a class="term__link" href="/work/wibeyconductor/">How the real one works</a></span>
  </footer>
</section>`;
}

/* ───────── Diagrams: static SVG + steps, enhanced into a narrated player ───────── */

const NODE_H = 64;

// Join two boxes side to side when they are more apart horizontally than vertically, else top to bottom.
function anchor(a: DiagramNode, b: DiagramNode): [number, number, number, number, boolean] {
  const gap = (a0: number, a1: number, b0: number, b1: number) => (b0 >= a1 ? b0 - a1 : a0 >= b1 ? a0 - b1 : -1);
  const hGap = gap(a.x, a.x + a.w, b.x, b.x + b.w);
  const vGap = gap(a.y, a.y + NODE_H, b.y, b.y + NODE_H);
  const ay = a.y + NODE_H / 2, by = b.y + NODE_H / 2;
  if (hGap >= 0 && hGap >= vGap) return b.x > a.x ? [a.x + a.w, ay, b.x, by, true] : [a.x, ay, b.x + b.w, by, true];
  const ax = a.x + a.w / 2, bx = b.x + b.w / 2;
  return b.y > a.y ? [ax, a.y + NODE_H, bx, b.y, false] : [ax, a.y, bx, b.y + NODE_H, false];
}

export function diagramSvg(key: string, d: Diagram): Raw {
  const byId = new Map(d.nodes.map((n) => [n.id, n]));
  const edges = d.edges.map((e) => {
    const a = byId.get(e.from)!, b = byId.get(e.to)!;
    const [x1, y1, x2, y2, horiz] = anchor(a, b);
    const k = horiz ? Math.max(30, Math.abs(x2 - x1) / 2) : Math.max(24, Math.abs(y2 - y1) / 2);
    const path = horiz
      ? `M${x1} ${y1} C${x1 + Math.sign(x2 - x1) * k} ${y1} ${x2 - Math.sign(x2 - x1) * k} ${y2} ${x2} ${y2}`
      : `M${x1} ${y1} C${x1} ${y1 + Math.sign(y2 - y1) * k} ${x2} ${y2 - Math.sign(y2 - y1) * k} ${x2} ${y2}`;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return h`<g class="de${e.dashed ? ' de--dashed' : ''}" data-id="${e.from}>${e.to}">
      <path d="${path}" marker-end="url(#ah-${key})"/>${e.label ? h`<text x="${mx + 8}" y="${my - 8}">${e.label}</text>` : ''}
    </g>`;
  });
  const nodes = d.nodes.map(
    (n) => h`<g class="dn" data-id="${n.id}" data-tone="${n.tone ?? 'plain'}">
      <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${NODE_H}" rx="12"/>
      <text class="dn__l" x="${n.x + 16}" y="${n.y + (n.sub ? 27 : 38)}">${n.label}</text>
      ${n.sub ? h`<text class="dn__s" x="${n.x + 16}" y="${n.y + 48}">${n.sub}</text>` : ''}
    </g>`,
  );
  return h`<svg class="dgm__svg" viewBox="0 0 1000 ${d.height}" role="img" aria-labelledby="dgm-${key}-t">
    <title id="dgm-${key}-t">${d.title}</title>
    <defs><marker id="ah-${key}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="ah" d="M0 0 10 5 0 10z"/></marker></defs>
    ${edges}${nodes}
  </svg>`;
}

export function diagram(key: string, d: Diagram): Raw {
  return h`<figure class="dgm" data-player="${key}" aria-labelledby="dgm-${key}-cap">
  <figcaption class="dgm__cap" id="dgm-${key}-cap">${d.title}</figcaption>
  <div class="dgm__canvas">${diagramSvg(key, d)}</div>
  <div class="dgm__bar js-only">
    <p class="dgm__say"><span class="dgm__n" data-count>Step 0 / ${d.steps.length}</span> <span data-say aria-live="polite">Press play, or step through.</span></p>
    <div class="dgm__ctl" role="group" aria-label="Diagram controls">
      <button type="button" class="icon-btn" data-prev aria-label="Previous step">${icons.prev}</button>
      <button type="button" class="icon-btn icon-btn--main" data-play aria-label="Play">${icons.play}</button>
      <button type="button" class="icon-btn" data-next aria-label="Next step">${icons.next}</button>
      <label class="dgm__speed"><span class="sr-only">Speed</span><select data-speed><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label>
      <button type="button" class="icon-btn" data-replay aria-label="Replay from the start">${icons.replay}</button>
    </div>
  </div>
  <ol class="dgm__steps">${d.steps.map((s, i) => h`<li data-step="${i + 1}" data-focus="${s.focus.join(' ')}">${s.text}</li>`)}</ol>
</figure>`;
}

export const flowList = (steps: string[]): Raw =>
  h`<ol class="flow" role="list">${steps.map((s, i) => h`<li><span class="flow__n">${i + 1}</span>${s}</li>`)}</ol>`;

/* ───────── Cards ───────── */

export const laneIcon = (lane: Project['lane']): Raw => icons[lane];

export function projectCard(p: Project): Raw {
  return h`<li class="pc" data-lane="${p.lane}">
  <a class="pc__link" href="/work/${p.slug}/">
    <span class="pc__metric"><b>${p.metric.value}</b><span>${p.metric.label}</span></span>
    <span class="pc__title">${p.title}${p.status ? h` <span class="badge">${p.status}</span>` : ''}</span>
    <span class="pc__one">${p.oneLiner}</span>
    <span class="pc__meta"><span class="org" data-org="${p.org}">${p.org}</span> · ${p.kicker}</span>
  </a>
</li>`;
}

export const laneHead = (lane: Project['lane'], count: number): Raw => h`<header class="lane__head">
  <h3 class="lane__name">${laneIcon(lane)}${lanes[lane].name} <span class="lane__count">${count}</span></h3>
  <p class="lane__blurb">${lanes[lane].blurb}</p>
</header>`;
