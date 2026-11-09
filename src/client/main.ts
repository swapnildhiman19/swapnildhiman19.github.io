// Entry point. Everything here enhances HTML that is already readable; nothing is required to see the work.
import { initRouter } from './router-ui.ts';
import { initQR } from './qr.ts';
import { initSound } from './sound.ts';
import { motion, reducedMotion } from './motion.ts';
import { icons } from '../render/icons.ts';
import type { Xp } from './xp/index.ts';
import type { Trace } from '../shared/router.ts';

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

/* ── Theme: light / dark, remembered, with a short cross-fade ── */
function initTheme() {
  const btn = $<HTMLButtonElement>('[data-theme-toggle]');
  if (!btn) return;
  const root = document.documentElement;
  const sync = () => btn.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  sync();
  btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    const apply = () => {
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch { /* private mode */ }
      sync();
    };
    if (document.startViewTransition && !reducedMotion()) document.startViewTransition(apply);
    else apply();
  });
}

/* ── Header: border when scrolled, current section in the nav, mobile menu ── */
function initHeader() {
  const top = $('.top');
  if (!top) return;
  const onScroll = () => top.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menu = $<HTMLDetailsElement>('.menu');
  if (menu) {
    menu.addEventListener('click', (e) => { if ((e.target as Element).closest('a')) menu.open = false; });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.open) { menu.open = false; $<HTMLElement>('summary', menu)?.focus(); } });
    document.addEventListener('pointerdown', (e) => { if (menu.open && !menu.contains(e.target as Node)) menu.open = false; });
  }

  const links = $$<HTMLAnchorElement>('.nav a');
  const sections = links.map((a) => document.getElementById(a.hash.slice(1))).filter((s): s is HTMLElement => !!s);
  if (!sections.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.setAttribute('aria-current', String(a.hash === `#${e.target.id}`)));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => io.observe(s));
}

/* ── Reveal below-the-fold sections once ── */
function initReveal() {
  if (reducedMotion()) return;
  const els = $$('.section__head, .lane, .dgm, .ios__grid, .journey__grid, .more__block, .contact');
  els.forEach((el) => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach((el) => io.observe(el));
  document.documentElement.classList.add('reveal-ready');
}

/* ── The 3D exploded view, the toy router and the living QR ── */
const webgl = (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } })();

function initExperience() {
  const xpEl = $('.xp');
  let xp: Xp | null = null;
  const trace = (t: Trace) => [`› ${t.prompt}`, `intent  ${t.intent}${t.fallback ? ' (regex)' : ` ${t.confidence.toFixed(2)}`}`, 'filters ✓ ✓ ✓ ✓ ✓', `cache   ${t.cache.decision}`, `route   ${['fast', 'balanced', 'premium'][t.routed]} · ${t.ms} ms`];
  $$('[data-router]').forEach((r) => initRouter(r, (t) => xp?.route(t.routed, trace(t))));
  $$('[data-qr]').forEach((q) => initQR(q));
  if (!xpEl) return;

  // the header goes dark and the layer rail appears while the stage is on screen
  const top = $('.top');
  new IntersectionObserver(([e]) => {
    top?.classList.toggle('on-dark', e.isIntersecting);
    document.documentElement.classList.toggle('in-xp', e.isIntersecting);
  }, { rootMargin: '0px 0px -94% 0px' }).observe(xpEl); // a thin band at the top of the viewport, where the header is

  const btn = $<HTMLButtonElement>('[data-motion]', xpEl);
  const sync = () => {
    const p = motion.paused;
    btn?.setAttribute('aria-pressed', String(p));
    if (btn) btn.innerHTML = `${(p ? icons.play : icons.pause).value}<span>${p ? 'Resume motion' : 'Pause motion'}</span>`;
  };
  btn?.addEventListener('click', () => { motion.set(!motion.paused); sync(); });
  if (reducedMotion() && btn) btn.hidden = true;
  sync();

  // The 3D scene (and its 556 KB phone model) starts after the page has loaded, in the next idle moment,
  // so it never competes with the first paint. The still image of the phone shows until it is ready.
  const boot = () => void import('./xp/index.ts').then((m) => { xp = m.initXp(xpEl); }).catch(() => { /* the still image stays */ });
  const later = () => ('requestIdleCallback' in window ? requestIdleCallback(boot, { timeout: 1200 }) : setTimeout(boot, 200));
  if (webgl) { if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true }); }
}

/* ── Lazy pieces: diagram players and the iOS flows load when they come near ── */
function lazy(selector: string, load: () => Promise<{ init: (el: HTMLElement) => void }>) {
  const els = $$(selector);
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    void load().then((m) => m.init(e.target as HTMLElement));
  }), { rootMargin: '600px 0px' });
  els.forEach((el) => io.observe(el));
}

initTheme();
initHeader();
initSound($<HTMLButtonElement>('[data-sound]'));
initExperience();
initReveal();
lazy('[data-player]', () => import('./player.ts').then((m) => ({ init: m.initPlayer })));
lazy('[data-flows]', () => import('./flows.ts').then((m) => ({ init: m.initFlows })));
