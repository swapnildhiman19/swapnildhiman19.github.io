// The agent-loop window: type a request, watch the toy WibeyConductor decide, line by line.
import { commit, MAX_ESCALATIONS, newSession, redo, route, TIERS, type Trace } from '../shared/router.ts';
import { traceHTML } from '../shared/trace-html.ts';
import { reducedMotion, wait } from './motion.ts';
import { play } from './sound.ts';

const KEEP = 4; // traces kept in the log

export function initRouter(root: HTMLElement, onRoute?: (t: Trace) => void): void {
  const log = root.querySelector<HTMLElement>('[data-log]')!;
  const form = root.querySelector<HTMLFormElement>('[data-form]')!;
  const input = form.querySelector<HTMLInputElement>('input')!;
  const go = form.querySelector<HTMLButtonElement>('button')!;
  const summary = root.querySelector<HTMLElement>('[data-summary]')!;
  const redoBtn = root.querySelector<HTMLButtonElement>('[data-redo]');
  const state = {
    turn: root.querySelector<HTMLElement>('[data-turn]')!,
    tier: root.querySelector<HTMLElement>('[data-tier-now]')!,
    cached: root.querySelector<HTMLElement>('[data-cached]')!,
  };

  // The static example already in the log is this session's previous turn.
  let last = route(root.dataset.example ?? '', newSession());
  let session = commit(newSession(), last);
  let busy = false;

  const showState = () => {
    state.turn.textContent = String(session.turn);
    state.tier.textContent = TIERS[session.tier];
    state.cached.textContent = `${session.cachedK}K`;
  };

  const note = (text: string) => {
    const p = document.createElement('p');
    p.className = 'tr-note tr-alt';
    p.textContent = text;
    log.append(p);
    log.scrollTo({ top: log.scrollHeight, behavior: reducedMotion() ? 'auto' : 'smooth' });
  };

  async function run(prompt: string) {
    const text = prompt.trim().slice(0, 160);
    if (!text || busy) return;
    busy = true;
    go.disabled = true;
    const t = route(text, session);
    session = commit(session, t);
    last = t;
    const holder = document.createElement('div');
    holder.innerHTML = traceHTML(t);
    const el = holder.firstElementChild as HTMLElement;
    const rows = [...el.querySelectorAll<HTMLElement>('.tr-row')];
    if (!reducedMotion()) rows.forEach((r) => r.classList.add('is-pending'));
    log.append(el);
    while (log.querySelectorAll('.trace').length > KEEP) log.querySelector('.trace')?.remove();
    log.scrollTo({ top: log.scrollHeight, behavior: reducedMotion() ? 'auto' : 'smooth' });
    for (const r of rows) {
      await wait(260);
      r.classList.remove('is-pending');
      play('tick');
    }
    log.scrollTo({ top: log.scrollHeight, behavior: reducedMotion() ? 'auto' : 'smooth' });
    summary.textContent =
      `Routed to ${TIERS[t.routed]} in ${t.ms} milliseconds (simulated). Intent: ${t.intent}` +
      (t.fallback ? ', chosen by the regex fallback.' : `, confidence ${t.confidence.toFixed(2)}.`) +
      ` Cache decision: ${t.cache.decision}.`;
    showState();
    play('route', t.routed);
    onRoute?.(t);
    if (redoBtn && session.escalations.length < MAX_ESCALATIONS) redoBtn.disabled = false;
    go.disabled = false;
    busy = false;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    void run(input.value);
    input.value = '';
  });
  root.querySelectorAll<HTMLButtonElement>('[data-example-btn]').forEach((b) =>
    b.addEventListener('click', () => void run(b.textContent ?? '')),
  );
  redoBtn?.addEventListener('click', () => {
    const r = redo(session, last.intent);
    session = r.session;
    if (r.accepted) {
      note(`↺ redo noted: "${last.intent}" escalates for the next turns (${session.escalations.length} of ${MAX_ESCALATIONS} this session, 8-turn half-life)`);
      summary.textContent = `Redo noted. The ${last.intent} intent escalates next time.`;
    }
    if (session.escalations.length >= MAX_ESCALATIONS) {
      redoBtn.disabled = true;
      if (!r.accepted) note('escalation limit reached: 3 per session');
    }
  });
  showState();
}
