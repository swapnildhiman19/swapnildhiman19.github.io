// Starts the 3D experience on the home page and connects it to the page: chapters, the layer rail,
// the "Pause motion" button and the toy router.
import { createXp, type Chapter, type RingNode } from './scene.ts';
import type { PartId } from './phone.ts';
import type { LockContent } from './screens.ts';
import { motion, reducedMotion } from '../motion.ts';
import { play } from '../sound.ts';

export interface Xp { route(tier: number, trace: string[]): void }

export function initXp(section: HTMLElement): Xp | null {
  const canvas = section.querySelector<HTMLCanvasElement>('.xp__gl');
  const stage = section.querySelector<HTMLElement>('.xp__stage');
  const labels = section.querySelector<HTMLElement>('.xp__labels');
  const dataEl = section.querySelector('#xp-data');
  if (!canvas || !stage || !labels || !dataEl) return null;
  const data = JSON.parse(dataEl.textContent ?? '{}') as { partLabels: Partial<Record<PartId, { n: string; text: string; count: string }>>; ringNodes: RingNode[]; lock: LockContent };
  const chapters = [...section.querySelectorAll<HTMLElement>('[data-chapter]')];
  const rail = [...section.querySelectorAll<HTMLButtonElement>('[data-goto]')];

  // the model loads first, so the scene arrives a moment after the page; until then the still image shows
  let api: Awaited<ReturnType<typeof createXp>> | null = null;
  createXp({
      stage,
      canvas,
      chapters,
      labels,
      partLabels: data.partLabels,
      ringNodes: data.ringNodes,
      lock: data.lock,
      reduced: reducedMotion(),
      paused: () => motion.paused,
      onChapter: (c: Chapter) => {
        section.dataset.active = c;
        rail.forEach((b) => b.setAttribute('aria-current', String(b.dataset.goto === c)));
        play('tick');
      },
      onReady: () => section.classList.add('gl-ready'),
    })
    .then((a) => { api = a; })
    .catch(() => { /* no WebGL, or the model failed to load: the still image stays */ });

  rail.forEach((b) => b.addEventListener('click', () => {
    section.querySelector(`[data-chapter="${b.dataset.goto}"]`)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
  }));
  return { route: (tier, trace) => api?.route(tier, trace) };
}
