// The route table. Each route becomes a static HTML file at build time (and is served the same way in dev).
import { h } from './h.ts';
import { page } from './layout.ts';
import { homeBody } from './home.ts';
import { projectBody } from './project.ts';
import { classicBody } from './classic.ts';
import { personLd, projectLd } from './seo.ts';
import { person, projects, site } from '../data.ts';

export interface Route {
  path: string; // URL path
  file: string; // output file, relative to dist/
  render: () => string;
}

export function routes(): Route[] {
  return [
    {
      path: '/',
      file: 'index.html',
      render: () => page({ path: '/', title: site.title, description: site.description, jsonLd: personLd(), bodyClass: 'home' }, homeBody()),
    },
    ...projects.map((p) => ({
      path: `/work/${p.slug}/`,
      file: `work/${p.slug}/index.html`,
      render: () =>
        page(
          { path: `/work/${p.slug}/`, title: `${p.title} · ${person.name}`, description: `${p.oneLiner} ${p.metric.value} ${p.metric.label}.`, jsonLd: projectLd(p), bodyClass: 'project' },
          projectBody(p),
        ),
    })),
    {
      path: '/classic/',
      file: 'classic/index.html',
      render: () =>
        page(
          { path: '/classic/', title: `${person.name} · Classic view`, description: `Plain, printable version of ${person.name}'s portfolio.`, scripts: false, stylesheet: '/src/styles/classic.css', bodyClass: 'classic-page' },
          classicBody(),
        ),
    },
    {
      path: '/404.html',
      file: '404.html',
      render: () =>
        page(
          { path: '/404.html', title: `Page not found · ${person.name}`, description: 'This page does not exist.', noindex: true, bodyClass: 'notfound' },
          h`<section class="section nf"><p class="kicker">404 · not found</p><h1 class="section__title">That page isn’t here.</h1><p class="section__lede">The link may be old or mistyped. Everything is one click away:</p><ul class="links" role="list"><li><a href="/">Home</a></li><li><a href="/#work">All work</a></li><li><a href="/classic/">Classic view</a></li><li><a href="mailto:${person.email}">${person.email}</a></li></ul></section>`,
        ),
    },
  ];
}
