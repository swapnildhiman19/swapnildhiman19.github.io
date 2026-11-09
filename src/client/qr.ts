// The living identity QR, re-enacted: a fresh code on every visit, a sample server-driven expiry,
// an expired state with regeneration, and an expanded bottom-sheet view.
import { qrPath } from '../shared/qr.ts';
import { motion, onVisible } from './motion.ts';
import { play } from './sound.ts';

const EXPIRY = 20; // seconds, sample value

export function initQR(root: HTMLElement): void {
  const ink = root.querySelector<SVGPathElement>('.idcard__qr .qr__ink')!;
  const timer = root.querySelector<HTMLElement>('[data-qr-timer]')!;
  const ring = root.querySelector<SVGCircleElement>('.idcard__ring-fg')!;
  const expired = root.querySelector<HTMLElement>('[data-qr-expired]')!;
  const expand = root.querySelector<HTMLButtonElement>('[data-qr-expand]')!;
  const refreshBtn = root.querySelector<HTMLButtonElement>('[data-qr-refresh]')!;

  let seed = (Date.now() % 100000) + 1; // a new code on every visit
  let left = EXPIRY;
  let visible = false;
  let raf = 0;
  let last = 0;

  const paint = () => {
    const s = Math.max(0, Math.ceil(left));
    timer.textContent = left <= 0 ? 'Expired' : `Expires in 0:${String(s).padStart(2, '0')}${motion.paused ? ' · paused' : ''}`;
    ring.style.strokeDashoffset = String(100 - (left / EXPIRY) * 100);
  };

  function setSeed(next: number) {
    seed = next;
    const d = qrPath(seed);
    ink.setAttribute('d', d);
    sheet?.querySelector('.qr__ink')?.setAttribute('d', d);
  }

  function refresh() {
    root.classList.add('is-refreshing');
    setTimeout(() => {
      setSeed(seed + 1);
      root.classList.remove('is-refreshing');
    }, motion.paused ? 0 : 220);
    left = EXPIRY;
    expired.hidden = true;
    paint();
    start();
  }

  function frame(now: number) {
    raf = 0;
    const dt = Math.min(0.25, (now - (last || now)) / 1000); // delta time, so 120 Hz screens run at the same speed
    last = now;
    left -= dt;
    if (left <= 0) {
      left = 0;
      expired.hidden = false;
      paint();
      return;
    }
    paint();
    if (visible && !motion.paused && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!raf && visible && !motion.paused && !document.hidden && left > 0) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  refreshBtn.addEventListener('click', () => { refresh(); play('ok'); expand.focus(); });
  onVisible(root, (v) => { visible = v; if (v) start(); else stop(); });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  motion.on((p) => { if (p) stop(); else start(); paint(); });

  // Expanded view: a bottom sheet inside the phone.
  let sheet: HTMLElement | null = null;
  let scrim: HTMLElement | null = null;
  const close = () => {
    sheet?.classList.remove('is-open');
    scrim?.classList.remove('is-open');
    sheet?.setAttribute('inert', '');
    expand.setAttribute('aria-expanded', 'false');
    expand.focus();
  };
  expand.addEventListener('click', () => {
    if (!sheet) {
      scrim = document.createElement('div');
      scrim.className = 'sheet__scrim';
      sheet = document.createElement('div');
      sheet.className = 'sheet';
      sheet.setAttribute('role', 'dialog');
      sheet.setAttribute('aria-label', 'Expanded sample identity code');
      sheet.innerHTML = `<span class="sheet__grab" aria-hidden="true"></span>${expand.innerHTML}<p>Hold the code up to the scanner. Sample data.</p><button class="btn btn--small btn--ghost" type="button">Close</button>`;
      root.append(scrim, sheet);
      scrim.addEventListener('click', close);
      sheet.querySelector('button')!.addEventListener('click', close);
      sheet.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } if (e.key === 'Tab') { e.preventDefault(); } });
      setSeed(seed);
    }
    sheet.removeAttribute('inert');
    requestAnimationFrame(() => { sheet!.classList.add('is-open'); scrim!.classList.add('is-open'); });
    expand.setAttribute('aria-expanded', 'true');
    sheet.querySelector('button')!.focus({ preventScroll: true });
    play('tick');
  });

  setSeed(seed);
  paint();
}
