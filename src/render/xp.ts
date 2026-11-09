// The home page's 3D experience: a sticky stage with the exploded phone, and chapters that scroll over it.
// Every chapter is real HTML, so without WebGL or JavaScript the page is a readable, ordered story
// with a still image of the exploded phone.
import { h, raw, type Raw } from './h.ts';
import { icons } from './icons.ts';
import { labels, layers, lockScreen, modelCredit, person, projects, stats, type Layer } from '../data.ts';
import { contactLinks, label, loopWindow, resumeLink } from './parts.ts';

const bySlug = new Map(projects.map((p) => [p.slug, p]));

function intro(): Raw {
  return h`<article class="chap chap--intro" data-chapter="intro" aria-labelledby="hero-name">
  <div class="panel panel--hero">
    <p class="kicker">${person.role}</p>
    <h1 id="hero-name" class="hero__name">${person.name}</h1>
    <p class="hero__where">${person.company} · ${person.location} · ${person.tenure}</p>
    <p class="tagline">${person.taglineLead} <em class="t-phone">${person.taglinePhone}</em> and <em class="t-loop">${person.taglineLoop}</em></p>
    <ul class="stats" role="list">${stats.map((s) => h`<li class="stat"><b class="stat__v">${s.value}</b><span class="stat__l">${s.label}</span></li>`)}</ul>
    <div class="cta">
      <a class="btn btn--primary" href="#layer-glass">Take it apart ${icons.arrowDown}</a>
      <a class="btn btn--ghost" href="#work">All work</a>
      ${resumeLink()}
    </div>
    ${contactLinks()}
  </div>
</article>`;
}

function overview(): Raw {
  return h`<article class="chap chap--overview" data-chapter="overview" aria-labelledby="ov-h">
  <div class="panel">
    <p class="kicker">Exploded view</p>
    <h2 id="ov-h" class="panel__title">Five layers of one phone. Four years of work.</h2>
    <p class="panel__lede">Each layer of this phone holds a part of what I build, from the pixels you tap to the agent loop the phone talks to.</p>
    <ol class="layer-index" role="list">${layers.map((l) => h`<li><a href="#layer-${l.id}"><span class="layer-index__n">${l.n}</span>${l.part}<span class="layer-index__c">${l.projects.length}</span></a></li>`)}</ol>
  </div>
</article>`;
}

function layerChapter(l: Layer): Raw {
  const rows = l.projects.map((s) => bySlug.get(s)!);
  return h`<article class="chap" data-chapter="${l.id}" id="layer-${l.id}" aria-labelledby="layer-${l.id}-h">
  <div class="panel" data-layer="${l.id}">
    <p class="kicker"><span class="panel__n">${l.n}</span> ${l.part}</p>
    <h2 id="layer-${l.id}-h" class="panel__title">${l.title}</h2>
    <p class="panel__lede">${l.lede}</p>
    <ul class="rows" role="list">${rows.map((p) => h`<li><a class="row" href="/work/${p.slug}/">
      <b class="row__v">${p.metric.value}</b>
      <span class="row__t">${p.title}${p.status ? h` <span class="badge">${p.status}</span>` : ''}${p.org === 'Personal' ? h` <span class="badge badge--personal">Personal</span>` : ''}</span>
      <span class="row__l">${p.metric.label}</span>
      <span class="row__go" aria-hidden="true">${icons.arrow}</span>
    </a></li>`)}</ul>
  </div>
</article>`;
}

function route(): Raw {
  return h`<article class="chap chap--route" data-chapter="route" id="demo" aria-labelledby="route-h">
  <div class="panel panel--wide">
    <p class="kicker">Try it · ${labels.toy.toLowerCase()}</p>
    <h2 id="route-h" class="panel__title">Send a request into the loop.</h2>
    <p class="panel__lede">Type a coding request. A toy of WibeyConductor picks a model tier, and the packet takes that lane around the loop.</p>
    ${loopWindow('xp')}
  </div>
</article>`;
}

// Label text for the 3D scene, so the client bundle doesn't need to import the whole data file.
function sceneData(): Raw {
  const partOf = { glass: 'glass', identity: 'identity', board: 'board', neural: 'neural', back: 'loop' } as const;
  const partLabels = Object.fromEntries(
    Object.entries(partOf).map(([part, id]) => {
      const l = layers.find((x) => x.id === id)!;
      return [part, { n: l.n, text: l.part, count: `${l.projects.length} project${l.projects.length > 1 ? 's' : ''}` }];
    }),
  );
  const loop = layers.find((l) => l.id === 'loop')!.projects.map((s) => bySlug.get(s)!);
  const angles = [Math.PI / 2, Math.PI, (3 * Math.PI) / 2, 0];
  const ringNodes = loop.map((p, i) => ({ label: p.title, value: p.metric.value, angle: angles[i] }));
  return raw(`<script type="application/json" id="xp-data">${JSON.stringify({ partLabels, ringNodes, lock: lockScreen }).replace(/</g, '\\u003c')}</script>`);
}

export function xpSection(): Raw {
  return h`<section class="xp" id="top" aria-label="Exploded view of my work">
  ${sceneData()}
  <div class="xp__stage" aria-hidden="true">
    <img class="xp__poster" src="/xp-poster.jpg" alt="" width="1600" height="1000" fetchpriority="high" decoding="async" />
    <canvas class="xp__gl"></canvas>
    <div class="xp__labels"></div>
    <div class="xp__vignette"></div>
  </div>
  <nav class="xp__rail js-only" aria-label="Layers">
    <ol role="list">${['intro', 'overview', ...layers.map((l) => l.id), 'route'].map((id, i) => h`<li><button type="button" data-goto="${id}" aria-label="${id === 'intro' ? 'Start' : id === 'overview' ? 'Exploded view' : id === 'route' ? 'Try the router' : layers.find((l) => l.id === id)!.part}"><span>${String(i).padStart(2, '0')}</span></button></li>`)}</ol>
  </nav>
  <div class="xp__chapters">
    ${intro()}${overview()}${layers.map(layerChapter)}${route()}
  </div>
  <div class="xp__note">${label(labels.reenacted)}<span>The screens re-enact my work with sample data. Phone model: <a href="${modelCredit.url}" rel="noopener">${modelCredit.title}</a> by ${modelCredit.author}, <a href="${modelCredit.licenseUrl}" rel="noopener license">${modelCredit.license}</a>, logo removed.</span><button class="chip-btn js-only" type="button" data-motion aria-pressed="false">${icons.pause}<span>Pause motion</span></button></div>
</section>`;
}
