// Narrated diagram player: step counter, narration, play/pause, previous/next, speed, replay.
// Without scripts the full diagram and the numbered steps are already on the page; this only adds focus.
import { icons } from '../render/icons.ts';
import { onVisible, reducedMotion } from './motion.ts';

const STEP_MS = 2800;

export function initPlayer(fig: HTMLElement): void {
  const items = [...fig.querySelectorAll<HTMLLIElement>('.dgm__steps li')];
  const total = items.length;
  const count = fig.querySelector<HTMLElement>('[data-count]')!;
  const say = fig.querySelector<HTMLElement>('[data-say]')!;
  const playBtn = fig.querySelector<HTMLButtonElement>('[data-play]')!;
  const speedSel = fig.querySelector<HTMLSelectElement>('[data-speed]')!;
  const parts = [...fig.querySelectorAll<SVGGElement>('.dn, .de')];

  let i = 0;
  let playing = false;
  let timer = 0;
  let autoplayed = false;
  let visible = false;
  let speed = 1;
  try { speed = Number(localStorage.getItem('dgm-speed')) || 1; } catch { /* private mode */ }
  speedSel.value = String(speed);

  function show(n: number) {
    i = n;
    const done = n > total;
    fig.classList.toggle('is-stepping', n > 0 && !done);
    const focus = new Set(n > 0 && !done ? items[n - 1].dataset.focus!.split(' ') : []);
    parts.forEach((p) => p.classList.toggle('is-on', focus.has(p.dataset.id!)));
    items.forEach((li, k) => li.classList.toggle('is-on', k === n - 1 && !done));
    if (n === 0) { count.textContent = `Step 0 / ${total}`; say.textContent = 'Press play, or step through.'; }
    else if (done) { count.textContent = `Done`; say.textContent = 'That is the whole flow. Replay, or step through it again.'; }
    else { count.textContent = `Step ${n} / ${total}`; say.textContent = items[n - 1].textContent ?? ''; }
  }

  function setPlaying(p: boolean) {
    playing = p;
    playBtn.innerHTML = (p ? icons.pause : icons.play).value;
    playBtn.setAttribute('aria-label', p ? 'Pause' : 'Play');
    clearTimeout(timer);
    if (p) schedule();
  }
  function schedule() {
    clearTimeout(timer);
    if (!playing || !visible) return;
    timer = window.setTimeout(() => {
      if (i >= total) { show(total + 1); setPlaying(false); return; }
      show(i + 1);
      schedule();
    }, i === 0 ? 400 : STEP_MS / speed);
  }

  playBtn.addEventListener('click', () => {
    if (playing) setPlaying(false);
    else { if (i > total || i === total) show(0); setPlaying(true); }
  });
  fig.querySelector('[data-next]')!.addEventListener('click', () => { setPlaying(false); show(Math.min(total, i + 1)); });
  fig.querySelector('[data-prev]')!.addEventListener('click', () => { setPlaying(false); show(Math.max(1, Math.min(total, i) - 1)); });
  fig.querySelector('[data-replay]')!.addEventListener('click', () => { show(0); setPlaying(true); });
  speedSel.addEventListener('change', () => {
    speed = Number(speedSel.value) || 1;
    try { localStorage.setItem('dgm-speed', String(speed)); } catch { /* private mode */ }
    if (playing) schedule();
  });

  // Play once on first sight (not with reduced motion); pause while off-screen.
  onVisible(fig, (v) => {
    visible = v;
    if (v && !autoplayed && !reducedMotion()) { autoplayed = true; setPlaying(true); }
    else if (v && playing) schedule();
    else clearTimeout(timer);
  });
  show(0);
}
