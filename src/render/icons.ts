// Hand-drawn line icons (24 × 24, stroke = currentColor). No brand logos anywhere on the site.
import { raw, type Raw } from './h.ts';

const svg = (d: string, extra = ''): Raw =>
  raw(`<svg class="i" viewBox="0 0 24 24" aria-hidden="true" focusable="false"${extra}>${d}</svg>`);

export const icons = {
  phone: svg('<rect x="7" y="2.5" width="10" height="19" rx="2.6"/><path d="M10.5 5h3"/><circle cx="12" cy="18.2" r=".6"/>'),
  seam: svg('<path d="M4 6c5 0 5 12 10 12M10 6c5 0 5 12 10 12"/><circle cx="12" cy="12" r="1.6"/>'),
  loop: svg('<path d="M4 12a6 6 0 0 1 10.3-4.2L16 9.5M20 12a6 6 0 0 1-10.3 4.2L8 14.5"/><path d="M16 5.5v4h-4M8 18.5v-4h4"/>'),
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  arrowUp: svg('<path d="M7 17 17 7M9 7h8v8"/>'),
  arrowDown: svg('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  back: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  download: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  mail: svg('<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>'),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'),
  moon: svg('<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>'),
  soundOn: svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
  soundOff: svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5m0-5-5 5"/>'),
  play: svg('<path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="none"/>'),
  pause: svg('<path d="M8.5 5.5v13M15.5 5.5v13"/>'),
  replay: svg('<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4v4.5H9"/>'),
  prev: svg('<path d="M15 6l-6 6 6 6"/>'),
  next: svg('<path d="M9 6l6 6-6 6"/>'),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  print: svg('<path d="M7 9V3.5h10V9M7 17H4.5V10h15v7H17M7 14h10v6.5H7z"/>'),
  doc: svg('<path d="M6 2.5h8l4 4V21.5H6z"/><path d="M14 2.5v4h4M9 12h6M9 16h6"/>'),
};
