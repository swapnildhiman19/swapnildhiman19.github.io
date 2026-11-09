// One page per project, at /work/<slug>/.
import { h, type Raw } from './h.ts';
import { icons } from './icons.ts';
import { diagrams, labels, lanes, person, projects, type Project } from '../data.ts';
import { chips, device, diagram, flowList, label, laneIcon, loopWindow, qrScreen } from './parts.ts';

function demo(p: Project): Raw | '' {
  if (p.demo === 'router')
    return h`<section class="pg__block pg__demo" aria-labelledby="demo-h">
      <h2 class="pg__h" id="demo-h">Try the toy</h2>
      <p class="pg__lede">Type a coding request. The toy shows the same four decisions the real router makes. ${label(labels.toy)}</p>
      <div class="pg__term">${loopWindow('page')}</div>
    </section>`;
  if (p.demo === 'qr')
    return h`<section class="pg__block pg__demo" aria-labelledby="demo-h">
      <h2 class="pg__h" id="demo-h">Re-enacted</h2>
      <div class="pg__phone">${device(qrScreen(11), label(labels.reenacted))}</div>
    </section>`;
  return '';
}

export function projectBody(p: Project): Raw {
  const i = projects.indexOf(p);
  const prev = projects[(i - 1 + projects.length) % projects.length];
  const next = projects[(i + 1) % projects.length];
  const metrics = [p.metric, ...(p.extraMetrics ?? [])];
  return h`<article class="pg" data-lane="${p.lane}">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/#work">${icons.back}All work</a><span aria-hidden="true">/</span><span>${lanes[p.lane].name}</span></nav>
  <header class="pg__head">
    <p class="kicker pg__kicker">${laneIcon(p.lane)}<span class="org" data-org="${p.org}">${p.org}</span> · ${p.kicker}${p.status ? h` <span class="badge">${p.status}</span>` : ''}</p>
    <h1 class="pg__title">${p.title}</h1>
    <ul class="pg__metrics" role="list">${metrics.map((m) => h`<li><b>${m.value}</b><span>${m.label}</span></li>`)}</ul>
    <p class="pg__one">${p.oneLiner}</p>
    ${p.credit ? h`<p class="pg__credit">${p.credit}</p>` : ''}
  </header>

  <div class="pg__body">
    <section class="pg__block pg__row" aria-labelledby="what-h">
      <h2 class="pg__h" id="what-h">What I did</h2>
      <ul class="pg__list">${p.what.map((t) => h`<li>${t}</li>`)}</ul>
    </section>
    <section class="pg__block pg__row" aria-labelledby="how-h">
      <h2 class="pg__h" id="how-h">How it works</h2>
      <div>${p.flow ? flowList(p.flow) : ''}<ul class="pg__list">${p.how.map((t) => h`<li>${t}</li>`)}</ul></div>
    </section>
    ${p.diagram ? h`<section class="pg__block" aria-label="Step-by-step diagram">${diagram(p.diagram, diagrams[p.diagram])}</section>` : ''}
    <section class="pg__block pg__row" aria-labelledby="result-h">
      <h2 class="pg__h" id="result-h">Result</h2>
      <p class="pg__result">${p.result}</p>
    </section>
    <section class="pg__block pg__row" aria-labelledby="stack-h">
      <h2 class="pg__h" id="stack-h">Stack</h2>
      ${chips(p.stack)}
    </section>
    ${demo(p)}
  </div>

  <nav class="pg__nav" aria-label="More projects">
    <a class="pg__nav-a" href="/work/${prev.slug}/" rel="prev"><span class="muted">${icons.prev} Previous</span><b>${prev.title}</b></a>
    <a class="pg__nav-a pg__nav-a--next" href="/work/${next.slug}/" rel="next"><span class="muted">Next ${icons.next}</span><b>${next.title}</b></a>
  </nav>
  <p class="pg__contact">Questions about ${p.title}? <a href="mailto:${person.email}?subject=${encodeURIComponent(p.title)}">Email me</a> or <a href="/#work">see all work</a>.</p>
</article>`;
}
