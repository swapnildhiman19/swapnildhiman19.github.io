// The page shell: <head> with SEO tags, the header, the footer.
import { h, raw, type Raw } from './h.ts';
import { icons } from './icons.ts';
import { person, site } from '../data.ts';
import { resumeLink } from './parts.ts';

export interface PageMeta {
  path: string; // e.g. "/work/token-os/"
  title: string;
  description: string;
  jsonLd?: object;
  noindex?: boolean;
  scripts?: boolean; // load the client script (default true)
  stylesheet?: string; // default main.css
  bodyClass?: string;
}

// Set the theme before first paint, and mark that JavaScript is running (so JS-only controls can show).
const PRE_PAINT = `(function(){var d=document.documentElement;d.classList.add('js');try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.dataset.theme=t}catch(e){}})();`;

export function head(m: PageMeta): Raw {
  const url = site.url + m.path;
  const og = `${site.url}/og.png`;
  return h`<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${m.title}</title>
<meta name="description" content="${m.description}" />
<link rel="canonical" href="${url}" />
<meta name="author" content="${person.name}" />
<meta name="robots" content="${m.noindex ? 'noindex' : 'index, follow, max-image-preview:large'}" />
<meta name="color-scheme" content="light dark" />
<meta name="theme-color" content="#f4f3ee" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0d0e10" media="(prefers-color-scheme: dark)" />
<meta property="og:type" content="${m.path === '/' ? 'website' : 'article'}" />
<meta property="og:site_name" content="${person.name}" />
<meta property="og:locale" content="en_US" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${m.title}" />
<meta property="og:description" content="${m.description}" />
<meta property="og:image" content="${og}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Swapnil Dhiman. Senior iOS Engineer, Applied AI. I build for two runtimes: the phone in your hand and the agent loop behind it." />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${m.title}" />
<meta name="twitter:description" content="${m.description}" />
<meta name="twitter:image" content="${og}" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="alternate" type="text/plain" href="/llms.txt" title="Plain-text summary for language models" />
${m.scripts === false ? '' : h`<script>${raw(PRE_PAINT)}</script>`}
<link rel="stylesheet" href="${m.stylesheet ?? '/src/styles/main.css'}" />
${m.scripts === false ? '' : h`<script type="module" src="/src/client/main.ts"></script>`}
${m.jsonLd ? h`<script type="application/ld+json">${raw(JSON.stringify(m.jsonLd).replace(/</g, '\\u003c'))}</script>` : ''}
</head>`;
}

const NAV = [
  ['Work', '/#work'],
  ['Demo', '/#demo'],
  ['iOS', '/#ios'],
  ['Journey', '/#journey'],
  ['Contact', '/#contact'],
];

export function header(): Raw {
  return h`<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <div class="top__in">
    <a class="brand" href="/" aria-label="${person.name}, home">
      <span class="brand__mark" aria-hidden="true">${person.initials}</span>
      <span class="brand__name">${person.name}</span>
    </a>
    <nav class="nav" aria-label="Sections">
      <ul role="list">${NAV.map(([t, href]) => h`<li><a href="${href}">${t}</a></li>`)}</ul>
    </nav>
    <div class="top__actions">
      ${resumeLink('btn btn--small btn--ghost top__resume')}
      <button class="icon-btn js-only" type="button" data-sound aria-pressed="false" aria-label="Sound effects: off">${icons.soundOff}</button>
      <button class="icon-btn js-only" type="button" data-theme-toggle aria-label="Switch to dark theme"><span class="only-light">${icons.moon}</span><span class="only-dark">${icons.sun}</span></button>
      <details class="menu">
        <summary class="icon-btn" aria-label="Menu">${icons.menu}</summary>
        <nav class="menu__panel" aria-label="Sections (menu)">
          <ul role="list">${NAV.map(([t, href]) => h`<li><a href="${href}">${t}</a></li>`)}<li><a href="/classic/">Classic view</a></li><li><a href="${site.resume}">Résumé (PDF)</a></li></ul>
        </nav>
      </details>
    </div>
  </div>
</header>`;
}

export function footer(): Raw {
  return h`<footer class="foot">
  <div class="foot__in">
    <p class="foot__name"><span class="brand__mark" aria-hidden="true">${person.initials}</span> ${person.name} · ${person.role}</p>
    <ul class="foot__links" role="list">
      <li><a href="/classic/">${icons.doc}Classic view</a></li>
      <li><a href="${site.resume}" target="_blank" rel="noopener">${icons.download}Résumé (PDF)<span class="sr-only"> (opens in a new tab)</span></a></li>
      <li><a href="/llms.txt">llms.txt</a></li>
    </ul>
    <p class="foot__note">Built with Vite and TypeScript. No trackers, no cookies, no third-party requests. Demos are toys and re-enactments with sample data. Updated ${site.updated}.</p>
  </div>
</footer>`;
}

// The classic view has no scripts, so it gets a plain header with no script-driven controls.
const plainHeader = (): Raw => h`<a class="skip" href="#main">Skip to content</a>
<header class="top top--plain"><div class="top__in"><a class="brand" href="/"><span class="brand__mark" aria-hidden="true">${person.initials}</span><span class="brand__name">${person.name}</span></a><a href="/">Full site</a></div></header>`;

export function page(m: PageMeta, body: Raw): string {
  return `<!doctype html>
<html lang="en">
${head(m)}
<body${m.bodyClass ? ` class="${m.bodyClass}"` : ''}>
${m.scripts === false ? plainHeader() : header()}
<main id="main" tabindex="-1">
${body}
</main>
${footer()}
</body>
</html>
`;
}
