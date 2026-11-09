// Optional sound: off by default, synthesized with Web Audio (no audio files). The choice is remembered.
import { icons } from '../render/icons.ts';

let ctx: AudioContext | null = null;
let on = false;

const KEY = 'sound';
const NOTES = [523.25, 659.25, 783.99]; // one note per model tier: C5, E5, G5

function tone(freq: number, at: number, dur = 0.16, vol = 0.05, type: OscillatorType = 'sine'): void {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(ctx.destination);
  o.start(at);
  o.stop(at + dur + 0.02);
}

export type Sound = 'tick' | 'route' | 'ok' | 'err';

export function play(name: Sound, tier = 0): void {
  if (!on || !ctx) return;
  const t = ctx.currentTime + 0.005;
  if (name === 'tick') tone(1400, t, 0.04, 0.025, 'triangle');
  if (name === 'route') { tone(NOTES[0], t, 0.12, 0.04); tone(NOTES[tier] * 2, t + 0.08, 0.22, 0.035); }
  if (name === 'ok') { tone(659.25, t, 0.14, 0.04); tone(987.77, t + 0.1, 0.26, 0.035); }
  if (name === 'err') tone(196, t, 0.18, 0.05, 'triangle');
}

export function initSound(btn: HTMLButtonElement | null): void {
  if (!btn) return;
  const render = () => {
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', `Sound effects: ${on ? 'on' : 'off'}`);
    btn.innerHTML = (on ? icons.soundOn : icons.soundOff).value;
  };
  try { on = localStorage.getItem(KEY) === 'on'; } catch { /* private mode */ }
  render();
  btn.addEventListener('click', () => {
    on = !on;
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* private mode */ }
    if (on) {
      ctx ??= new AudioContext();
      void ctx.resume();
      play('ok');
    }
    render();
  });
  // A remembered "on" still needs a gesture before audio may start.
  if (on) addEventListener('pointerdown', () => { ctx ??= new AudioContext(); void ctx.resume(); }, { once: true });
}
