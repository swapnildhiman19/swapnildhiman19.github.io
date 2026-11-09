// Shared motion state: the visitor's reduced-motion setting and the stage's "Pause motion" button.
type Listener = (paused: boolean) => void;

const listeners = new Set<Listener>();
let userPaused = false;

export const reducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

export const motion = {
  get paused(): boolean {
    return userPaused || reducedMotion();
  },
  set(paused: boolean): void {
    userPaused = paused;
    listeners.forEach((fn) => fn(this.paused));
  },
  on(fn: Listener): void {
    listeners.add(fn);
  },
};

export const wait = (ms: number): Promise<void> => new Promise((ok) => setTimeout(ok, reducedMotion() ? 0 : ms));

/** Calls `fn(visible)` when the element enters or leaves the viewport (with a margin). */
export function onVisible(el: Element, fn: (visible: boolean) => void, rootMargin = '0px'): void {
  new IntersectionObserver(([e]) => fn(e.isIntersecting), { rootMargin }).observe(el);
}
