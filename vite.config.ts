// Vite builds one static HTML file per route. The HTML comes from TypeScript render functions in
// src/render/, so every page (home, each /work/<slug>/, /classic/, 404) is real, crawlable HTML.
// In dev, a middleware renders the same routes on request (fresh on every reload).
import { defineConfig, type Plugin, type ViteDevServer } from 'vite';
import { resolve } from 'node:path';
import { routes as buildRoutes } from './src/render/pages.ts';
import { llms, robots, sitemap } from './src/render/seo.ts';

const root = import.meta.dirname;
const PAGES_MODULE = '/src/render/pages.ts';

function prerender(): Plugin {
  // Absolute file id → route, for the build.
  const byId = new Map(buildRoutes().map((r) => [resolve(root, r.file), r]));
  return {
    name: 'prerender-routes',
    config: () => ({
      build: { rollupOptions: { input: Object.fromEntries([...byId.keys()].map((id) => [id.slice(root.length + 1).replace(/\.html$/, ''), id])) } },
    }),
    resolveId: (id) => (byId.has(id) ? id : null),
    load: (id) => byId.get(id)?.render() ?? null,
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap() });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots() });
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llms() });
    },
    configureServer(server: ViteDevServer) {
      return () =>
        server.middlewares.use(async (req, res, next) => {
          const url = (req.url ?? '/').split('?')[0];
          const mod = (await server.ssrLoadModule(PAGES_MODULE)) as typeof import('./src/render/pages.ts');
          const seo = (await server.ssrLoadModule('/src/render/seo.ts')) as typeof import('./src/render/seo.ts');
          const text: Record<string, () => string> = { '/sitemap.xml': seo.sitemap, '/robots.txt': seo.robots, '/llms.txt': seo.llms };
          if (text[url]) { res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.end(text[url]()); return; }
          const all = mod.routes();
          const r = all.find((x) => x.path === url || x.path === `${url}/`) ;
          if (!r && /\.[a-z0-9]+$/i.test(url)) return next();
          const route = r ?? all.find((x) => x.path === '/404.html')!;
          const html = await server.transformIndexHtml(url, route.render());
          res.statusCode = r ? 200 : 404;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
        });
    },
  };
}

// Preload the fonts the first screen uses, so text does not shift when they arrive (layout shift).
function preloadFonts(): Plugin {
  const wanted = [/geist-latin-wght-normal-.*\.woff2$/, /instrument-serif-latin-400-normal-.*\.woff2$/, /instrument-serif-latin-400-italic-.*\.woff2$/];
  return {
    name: 'preload-critical-fonts',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        // the classic view uses system fonts only, so it would download these for nothing
        if (!ctx.bundle || ctx.path.includes('classic')) return [];
        const files = Object.keys(ctx.bundle).filter((f) => wanted.some((re) => re.test(f)));
        return files.map((f) => ({ tag: 'link', attrs: { rel: 'preload', href: `/${f}`, as: 'font', type: 'font/woff2', crossorigin: '' }, injectTo: 'head-prepend' as const }));
      },
    },
  };
}

export default defineConfig({
  base: '/',
  appType: 'mpa',
  plugins: [prerender(), preloadFonts()],
  // the 3D chunk (three.js and the model loader, ~180 KB gzipped) is the only big one; it loads after first paint
  build: { sourcemap: false, target: 'es2022', cssCodeSplit: true, assetsInlineLimit: 2048, chunkSizeWarningLimit: 800 },
});
