// The phone's live screen, drawn in code to real iOS measurements: a 440 × 956 point screen
// (the 6.9-inch iPhone), drawn at 1.5 px per point (1.2 on small screens, to keep texture uploads cheap).
// Colours are the iOS system colours; on Apple devices the font is the system font itself.
// Every icon and glyph here is my own drawing; no Apple artwork.
import { qrMatrix, QR_SIZE } from '../../shared/qr.ts';

export type ScreenId = 'lock' | 'qr' | 'identity' | 'board' | 'neural' | 'loop';

export interface LockContent {
  widgets: { k: string; v: string }[];
  notes: { app: string; icon: Glyph; title: string; body: string }[];
}

export interface ScreenState {
  id: ScreenId;
  t: number; // seconds since this screen appeared
  qrSeed: number;
  qrLeft: number; // seconds until the sample code expires
  trace: string[]; // lines for the loop screen
  lock: LockContent;
}

export const PT_W = 440;
export const PT_H = 956;
const SCALE = typeof innerWidth === 'number' && innerWidth < 760 ? 1.2 : 1.5;
export const SCREEN_W = Math.round(PT_W * SCALE);
export const SCREEN_H = Math.round(PT_H * SCALE);

const SF = '-apple-system, BlinkMacSystemFont, "Geist Variable", system-ui, sans-serif';
const MONO = 'ui-monospace, "SF Mono", "Geist Mono Variable", Menlo, monospace';

// iOS system colours (light / dark)
const L = { label: '#000', sec: 'rgba(60,60,67,.6)', ter: 'rgba(60,60,67,.3)', sep: 'rgba(60,60,67,.18)', bg: '#F2F2F7', card: '#FFF', fill: '#E9E9EB' };
const D = { label: '#FFF', sec: 'rgba(235,235,245,.6)', ter: 'rgba(235,235,245,.3)', sep: 'rgba(84,84,88,.6)', bg: '#000', card: '#1C1C1E', fill: '#2C2C2E' };
const C = { indigo: '#5856D6', indigoD: '#5E5CE6', green: '#34C759', greenD: '#30D158', orange: '#FF9500', orangeD: '#FF9F0A', blue: '#007AFF', red: '#FF3B30', teal: '#30B0C7', pink: '#FF2D55' };

type G = CanvasRenderingContext2D;

/** How often (seconds) a screen needs redrawing while it is showing. */
export function redrawEvery(s: ScreenState): number {
  if (s.id === 'lock') return s.t < 2.6 ? 1 / 30 : 1;
  if (s.id === 'qr') return 0.25;
  if (s.id === 'neural') return 1 / 15;
  if (s.id === 'identity' || s.id === 'board') return 1 / 12;
  return 1 / 8;
}

// The 3D model's Dynamic Island sits 21 pt from the top of the glass (a little lower than a real
// phone's 11 pt), so the status bar is centred on it.
const ISLAND = { x: 159, y: 21, w: 122, h: 37 };
const BAR_DY = ISLAND.y + ISLAND.h / 2 - 29.5;

/** Draw a screen. `island` paints the Dynamic Island too (off when the 3D model brings its own). */
export function drawScreen(g: G, s: ScreenState, island = true) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, SCREEN_W, SCREEN_H);
  g.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  g.textBaseline = 'alphabetic';
  if (s.id === 'lock') lockScreen(g, s);
  else if (s.id === 'qr') qrScreen(g, s);
  else if (s.id === 'identity') identityScreen(g, s);
  else if (s.id === 'board') boardScreen(g, s);
  else if (s.id === 'neural') neuralScreen(g, s);
  else loopScreen(g, s);
  if (island) fillRR(g, ISLAND.x, ISLAND.y, ISLAND.w, ISLAND.h, ISLAND.h / 2, '#000');
}

/* ───────── helpers ───────── */

function rr(g: G, x: number, y: number, w: number, h: number, r: number | number[]) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}
function fillRR(g: G, x: number, y: number, w: number, h: number, r: number | number[], color: string | CanvasGradient) {
  rr(g, x, y, w, h, r);
  g.fillStyle = color;
  g.fill();
}
function text(g: G, s: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left') {
  g.font = font;
  g.fillStyle = color;
  g.textAlign = align;
  g.fillText(s, x, y);
  g.textAlign = 'left';
}
function lines(g: G, s: string, w: number, max = 9): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of s.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (g.measureText(test).width > w && line) { out.push(line); line = word; } else line = test;
  }
  if (line) out.push(line);
  if (out.length > max) { out.length = max; out[max - 1] = `${out[max - 1].replace(/\s+\S*$/, '')}…`; }
  return out;
}
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);

const hourCycle = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hourCycle;
const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
function clock(): string {
  const d = new Date();
  let h = d.getHours();
  if (hourCycle === 'h11' || hourCycle === 'h12') h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function statusBar(g: G, dark: boolean, showTime = true) {
  g.save();
  g.translate(0, BAR_DY);
  drawStatus(g, dark, showTime);
  g.restore();
}

function drawStatus(g: G, dark: boolean, showTime: boolean) {
  const c = dark ? '#fff' : '#000';
  if (showTime) text(g, clock(), 74, 36, `600 17px ${SF}`, c, 'center');
  g.fillStyle = c;
  for (let i = 0; i < 4; i++) { const h = 4.2 + i * 2.5; rr(g, 309 + i * 4.6, 35 - h, 3.1, h, 1); g.fill(); }
  // wi-fi: a small fan and two arcs
  const wx = 343, wy = 34.5;
  g.beginPath(); g.moveTo(wx, wy); g.arc(wx, wy, 3.8, -Math.PI * 0.75, -Math.PI * 0.25); g.closePath(); g.fill();
  g.strokeStyle = c; g.lineWidth = 2.1; g.lineCap = 'round';
  for (const r of [7.1, 10.6]) { g.beginPath(); g.arc(wx, wy, r, -Math.PI * 0.75 + 0.08, -Math.PI * 0.25 - 0.08); g.stroke(); }
  // battery
  g.globalAlpha = 0.38; g.lineWidth = 1; rr(g, 359.5, 24.5, 25, 12, 4); g.stroke(); rr(g, 385.6, 28.5, 1.6, 4.2, 0.8); g.fill(); g.globalAlpha = 1;
  fillRR(g, 361.5, 26.5, 17.5, 8, 2.4, c);
}

function homeBar(g: G, dark: boolean) {
  fillRR(g, 153, 940, 134, 5, 2.5, dark ? '#fff' : '#000');
}

function sample(g: G, dark: boolean, y: number) {
  text(g, 'Illustration with sample data', PT_W / 2, y, `500 11px ${SF}`, dark ? D.ter : L.ter, 'center');
}

/* ───────── icons (my own glyphs, drawn in a 24-unit box centred on 0,0) ───────── */

export type Glyph = 'trophy' | 'qr' | 'plane' | 'wave' | 'loop' | 'key' | 'bag' | 'house' | 'box' | 'person' | 'back' | 'photo' | 'stack' | 'bell' | 'card' | 'layers' | 'puzzle' | 'lock' | 'check' | 'dots';

const TINT: Partial<Record<Glyph, [string, string]>> = {
  trophy: ['#FFC94A', '#FF8A00'], qr: ['#8E8BFF', '#4A43D6'], plane: ['#64D2FF', '#0A84FF'], wave: ['#FFB340', '#FF6A00'],
  loop: ['#6EF0A0', '#1FA85A'], key: ['#8E8BFF', '#4A43D6'],
};

function glyph(g: G, kind: Glyph, cx: number, cy: number, size: number, color: string) {
  g.save();
  g.translate(cx, cy);
  g.scale(size / 24, size / 24);
  g.strokeStyle = g.fillStyle = color;
  g.lineWidth = 2;
  g.lineCap = g.lineJoin = 'round';
  const P = new Path2D();
  switch (kind) {
    case 'trophy':
      g.beginPath(); g.moveTo(-6, -8); g.lineTo(6, -8); g.lineTo(6, -2); g.quadraticCurveTo(6, 4, 0, 4); g.quadraticCurveTo(-6, 4, -6, -2); g.closePath(); g.fill();
      g.beginPath(); g.arc(-6, -4, 3, Math.PI * 0.5, Math.PI * 1.5); g.moveTo(6, -7); g.arc(6, -4, 3, -Math.PI * 0.5, Math.PI * 0.5); g.stroke();
      g.fillRect(-1.2, 4, 2.4, 3.5); rr(g, -5, 7.5, 10, 2.6, 1); g.fill();
      break;
    case 'qr':
      for (const [x, y] of [[-9, -9], [3, -9], [-9, 3]]) { g.lineWidth = 1.8; rr(g, x, y, 6, 6, 1.2); g.stroke(); g.fillRect(x + 2, y + 2, 2, 2); }
      for (const [x, y] of [[4, 4], [8, 4], [4, 8], [8, 8], [6, 6]]) g.fillRect(x - 1, y - 1, 2, 2);
      break;
    case 'plane':
      g.beginPath(); g.moveTo(-9, -1); g.lineTo(9, -8); g.lineTo(3, 9); g.lineTo(0, 2); g.closePath(); g.fill();
      break;
    case 'wave':
      [-8, -4, 0, 4, 8].forEach((x, i) => { const h = [6, 12, 16, 10, 5][i]; rr(g, x - 1.2, -h / 2, 2.4, h, 1.2); g.fill(); });
      break;
    case 'loop':
      g.beginPath(); g.arc(0, 0, 7.5, 0.5, Math.PI * 2 - 0.3); g.stroke();
      g.beginPath(); g.moveTo(9.5, -6.5); g.lineTo(7.2, -1.4); g.lineTo(2.8, -4.6); g.stroke();
      break;
    case 'key':
      g.beginPath(); g.arc(-4, -3, 4.5, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(-1, 0.5); g.lineTo(8, 9); g.moveTo(4.5, 5.5); g.lineTo(2.5, 7.5); g.moveTo(7, 8); g.lineTo(5.2, 9.8); g.stroke();
      break;
    case 'bag':
      rr(g, -7.5, -3, 15, 12, 2.5); g.fill();
      g.beginPath(); g.arc(0, -3, 4, Math.PI, 0); g.stroke();
      break;
    case 'house':
      g.beginPath(); g.moveTo(-8, -1); g.lineTo(0, -8); g.lineTo(8, -1); g.stroke();
      rr(g, -6, -1.5, 12, 9.5, 1.5); g.stroke();
      break;
    case 'box':
      g.beginPath(); g.moveTo(0, -8); g.lineTo(8, -4); g.lineTo(8, 5); g.lineTo(0, 9); g.lineTo(-8, 5); g.lineTo(-8, -4); g.closePath(); g.moveTo(-8, -4); g.lineTo(0, 0); g.lineTo(8, -4); g.moveTo(0, 0); g.lineTo(0, 9); g.stroke();
      break;
    case 'person':
      g.beginPath(); g.arc(0, -4, 3.8, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(-7.5, 8.5); g.quadraticCurveTo(-7, 1.5, 0, 1.5); g.quadraticCurveTo(7, 1.5, 7.5, 8.5); g.stroke();
      break;
    case 'back':
      g.beginPath(); g.moveTo(-3, -7); g.lineTo(-8, -2.5); g.lineTo(-3, 2); g.moveTo(-8, -2.5); g.lineTo(3, -2.5); g.quadraticCurveTo(8, -2.5, 8, 2.5); g.quadraticCurveTo(8, 7.5, 3, 7.5); g.lineTo(-2, 7.5); g.stroke();
      break;
    case 'photo':
      rr(g, -8.5, -6.5, 17, 13, 2.5); g.stroke();
      g.beginPath(); g.moveTo(-6, 4); g.lineTo(-1.5, -1); g.lineTo(2, 2.5); g.lineTo(4, 0.5); g.lineTo(6.5, 4); g.stroke();
      break;
    case 'stack':
      rr(g, -4.5, -7, 9, 14, 1.8); g.fill(); g.globalAlpha = 0.6; rr(g, -9, -5, 3, 10, 1.2); g.fill(); rr(g, 6, -5, 3, 10, 1.2); g.fill(); g.globalAlpha = 1;
      break;
    case 'bell':
      g.beginPath(); g.moveTo(-6.5, 4.5); g.lineTo(-6.5, -1); g.quadraticCurveTo(-6.5, -7.5, 0, -7.5); g.quadraticCurveTo(6.5, -7.5, 6.5, -1); g.lineTo(6.5, 4.5); g.lineTo(8, 6); g.lineTo(-8, 6); g.closePath(); g.fill();
      g.beginPath(); g.arc(0, 7.5, 2.2, 0, Math.PI); g.fill();
      break;
    case 'card':
      rr(g, -9, -6, 18, 12, 2.2); g.stroke(); g.fillRect(-9, -2.5, 18, 2.6);
      break;
    case 'layers':
      for (const y of [4, 0, -4]) { g.beginPath(); g.moveTo(-8, y); g.lineTo(0, y - 4); g.lineTo(8, y); g.lineTo(0, y + 4); g.closePath(); g.globalAlpha = y === -4 ? 1 : 0.55; g.fill(); }
      g.globalAlpha = 1;
      break;
    case 'puzzle':
      P.moveTo(-7, -7); P.lineTo(-2, -7); P.arc(0, -7, 2.2, Math.PI, 0); P.lineTo(7, -7); P.lineTo(7, -2); P.arc(7, 0, 2.2, -Math.PI / 2, Math.PI / 2); P.lineTo(7, 7); P.lineTo(-7, 7); P.closePath();
      g.fill(P);
      break;
    case 'lock':
      rr(g, -6, -1, 12, 9, 2); g.fill();
      g.beginPath(); g.arc(0, -2, 4, Math.PI, 0); g.lineTo(4, -1); g.moveTo(-4, -1); g.lineTo(-4, -2); g.stroke();
      break;
    case 'check':
      g.lineWidth = 2.6; g.beginPath(); g.moveTo(-6, 0); g.lineTo(-2, 4.5); g.lineTo(7, -5); g.stroke();
      break;
    case 'dots':
      for (const x of [-6, 0, 6]) { g.beginPath(); g.arc(x, 0, 1.8, 0, Math.PI * 2); g.fill(); }
      break;
  }
  g.restore();
}

/** An app icon: a rounded square with a gradient (or a flat colour) and a white glyph. */
function appIcon(g: G, kind: Glyph, x: number, y: number, size: number, flat?: string) {
  const [a, b] = TINT[kind] ?? [flat ?? C.indigo, flat ?? C.indigo];
  const grad = g.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, flat ?? a);
  grad.addColorStop(1, flat ?? b);
  fillRR(g, x, y, size, size, size * 0.225, grad);
  glyph(g, kind, x + size / 2, y + size / 2, size * 0.62, '#fff');
}

function chevron(g: G, x: number, y: number, color: string) {
  g.strokeStyle = color; g.lineWidth = 2; g.lineCap = g.lineJoin = 'round';
  g.beginPath(); g.moveTo(x, y - 5.5); g.lineTo(x + 5, y); g.lineTo(x, y + 5.5); g.stroke();
}

function toggle(g: G, x: number, y: number, on: number) {
  fillRR(g, x, y, 51, 31, 15.5, '#E9E9EA');
  g.globalAlpha = on;
  fillRR(g, x, y, 51, 31, 15.5, C.green);
  g.globalAlpha = 1;
  g.save();
  g.shadowColor = 'rgba(0,0,0,.18)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
  g.beginPath(); g.arc(x + 15.5 + on * 20, y + 15.5, 13.5, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
  g.restore();
}

/** A grouped-inset list (the iOS Settings look). */
function list(g: G, y: number, rows: { icon: Glyph; color: string; label: string; detail?: string; toggle?: number }[], dark = false) {
  const T = dark ? D : L;
  fillRR(g, 16, y, 408, rows.length * 52, 12, T.card);
  rows.forEach((r, i) => {
    const ry = y + i * 52;
    appIcon(g, r.icon, 32, ry + 11.5, 29, r.color);
    text(g, r.label, 75, ry + 32, `400 17px ${SF}`, T.label);
    if (r.toggle !== undefined) toggle(g, 357, ry + 10.5, r.toggle);
    else {
      if (r.detail) text(g, r.detail, 392, ry + 32, `400 17px ${SF}`, T.sec, 'right');
      chevron(g, 402, ry + 26, T.ter);
    }
    if (i < rows.length - 1) { g.fillStyle = T.sep; g.fillRect(75, ry + 51.5, 349, 0.6); }
  });
}

function largeTitle(g: G, title: string, sub: string, dark: boolean) {
  text(g, title, 20, 142, `700 34px ${SF}`, dark ? D.label : L.label);
  text(g, sub, 20, 168, `400 15px ${SF}`, dark ? D.sec : L.sec);
}

/** A round glass button in the top-right corner (the iOS 26 toolbar look). */
function cornerButton(g: G, dark: boolean) {
  g.beginPath(); g.arc(400, 84, 18, 0, Math.PI * 2); g.fillStyle = dark ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.9)'; g.fill();
  g.strokeStyle = dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'; g.lineWidth = 0.8; g.stroke();
  glyph(g, 'dots', 400, 84, 22, dark ? '#fff' : '#000');
}

/* ───────── the wallpaper (my own, generated) ───────── */

let wall: HTMLCanvasElement | null = null;
function wallpaper(): HTMLCanvasElement {
  if (wall) return wall;
  const c = document.createElement('canvas');
  c.width = SCREEN_W;
  c.height = SCREEN_H;
  const g = c.getContext('2d')!;
  g.scale(SCALE, SCALE);
  const base = g.createLinearGradient(0, 0, 0, PT_H);
  base.addColorStop(0, '#050816');
  base.addColorStop(0.5, '#140f33');
  base.addColorStop(1, '#22101d');
  g.fillStyle = base;
  g.fillRect(0, 0, PT_W, PT_H);
  const blob = (x: number, y: number, r: number, col: string) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, PT_W, PT_H);
  };
  g.globalCompositeOperation = 'lighter';
  blob(40, 780, 440, 'rgba(255,124,52,0.55)');
  blob(420, 560, 380, 'rgba(104,84,255,0.55)');
  blob(240, 120, 330, 'rgba(36,112,255,0.28)');
  blob(430, 960, 320, 'rgba(255,64,128,0.32)');
  // silky bands, each drawn as soft layers
  for (let i = 0; i < 4; i++) {
    const y0 = 420 + i * 92;
    for (let k = 0; k < 8; k++) {
      g.beginPath();
      g.moveTo(-40, y0);
      g.bezierCurveTo(120, y0 - 190, 300, y0 + 170, 480, y0 - 70);
      g.lineWidth = (60 - i * 8) * (1 - k / 8);
      g.strokeStyle = `rgba(255,${170 + i * 18},${150 + i * 20},${0.012 + i * 0.004})`;
      g.stroke();
    }
  }
  g.globalCompositeOperation = 'source-over';
  wall = c;
  return c;
}

/* ───────── screens ───────── */

function lockScreen(g: G, s: ScreenState) {
  g.drawImage(wallpaper(), 0, 0, PT_W, PT_H);
  statusBar(g, true, false);
  glyph(g, 'lock', PT_W / 2, 76, 15, 'rgba(255,255,255,.9)');
  text(g, dateFmt.format(new Date()), PT_W / 2, 120, `600 20px ${SF}`, 'rgba(255,255,255,.86)', 'center');
  g.letterSpacing = '-2px';
  text(g, clock(), PT_W / 2, 224, `700 104px ${SF}`, 'rgba(255,255,255,.95)', 'center');
  g.letterSpacing = '0px';

  s.lock.widgets.slice(0, 2).forEach((w, i) => {
    const x = 36 + i * 188, y = 254;
    fillRR(g, x, y, 180, 64, 18, 'rgba(255,255,255,.15)');
    text(g, w.k.toUpperCase(), x + 14, y + 25, `600 12px ${SF}`, 'rgba(255,255,255,.66)');
    text(g, w.v, x + 14, y + 50, `700 19px ${SF}`, '#fff');
  });

  // notifications, stacked up from the bottom; they slide in when the screen first appears
  g.font = `400 15px ${SF}`;
  const items = s.lock.notes.map((n) => {
    const body = lines(g, n.body, 322, 2);
    return { n, body, h: 34 + body.length * 19 + 13, y: 0 };
  });
  let y = 820;
  for (let i = items.length - 1; i >= 0; i--) { y -= items[i].h; items[i].y = y; y -= 8; }
  const when = ['now', '1h ago', '2h ago', 'Yesterday'];
  items.forEach((it, i) => {
    const k = ease((s.t - 0.2 - i * 0.26) / 0.6);
    if (k <= 0) return;
    g.globalAlpha = k;
    const yy = it.y + (1 - k) * 34;
    fillRR(g, 14, yy, 412, it.h, 22, 'rgba(255,255,255,.19)');
    appIcon(g, it.n.icon, 28, yy + 13, 38);
    text(g, it.n.title, 78, yy + 31, `600 15px ${SF}`, '#fff');
    text(g, when[i] ?? '', 412, yy + 31, `400 13px ${SF}`, 'rgba(255,255,255,.6)', 'right');
    it.body.forEach((l, j) => text(g, l, 78, yy + 31 + 19 * (j + 1), `400 15px ${SF}`, 'rgba(255,255,255,.86)'));
    g.globalAlpha = 1;
  });

  // flashlight and camera buttons
  for (const [x, kind] of [[72, 'torch'], [368, 'camera']] as const) {
    g.beginPath(); g.arc(x, 878, 25, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,.17)'; g.fill();
    g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 2; g.lineJoin = 'round';
    if (kind === 'torch') {
      g.beginPath(); g.moveTo(x - 6, 866); g.lineTo(x + 6, 866); g.lineTo(x + 6, 870); g.lineTo(x + 3.5, 875); g.lineTo(x + 3.5, 890); g.lineTo(x - 3.5, 890); g.lineTo(x - 3.5, 875); g.lineTo(x - 6, 870); g.closePath(); g.stroke();
      g.beginPath(); g.arc(x, 880, 1.6, 0, Math.PI * 2); g.fill();
    } else {
      rr(g, x - 10, 871, 20, 15, 3.5); g.stroke();
      g.beginPath(); g.arc(x, 878.5, 4.2, 0, Math.PI * 2); g.stroke();
      rr(g, x - 4, 868, 8, 3, 1); g.fill();
    }
  }
  homeBar(g, true);
}

function qrScreen(g: G, s: ScreenState) {
  g.fillStyle = L.bg;
  g.fillRect(0, 0, PT_W, PT_H);
  statusBar(g, false);
  cornerButton(g, false);
  largeTitle(g, 'Omni ID', 'Show this code at pickup', false);

  // the identity card
  g.save();
  g.shadowColor = 'rgba(0,0,0,.07)'; g.shadowBlur = 24; g.shadowOffsetY = 6;
  fillRR(g, 16, 188, 408, 456, 26, L.card);
  g.restore();
  appIcon(g, 'qr', 34, 206, 34);
  text(g, 'Sample Customer', 80, 222, `600 17px ${SF}`, L.label);
  text(g, 'Store pickup', 80, 241, `400 13px ${SF}`, L.sec);
  fillRR(g, 340, 212, 68, 24, 12, 'rgba(88,86,214,.12)');
  text(g, 'SAMPLE', 374, 228, `600 11px ${SF}`, C.indigo, 'center');

  const size = 272, qx = (PT_W - size) / 2, qy = 264;
  const m = qrMatrix(s.qrSeed), cell = size / QR_SIZE;
  g.fillStyle = s.qrLeft <= 0 ? '#C7C7CC' : '#111114';
  m.forEach((row, y) => row.forEach((on, x) => { if (on) g.fillRect(qx + x * cell, qy + y * cell, cell + 0.35, cell + 0.35); }));

  // countdown
  const left = Math.max(0, s.qrLeft);
  const label = s.qrLeft <= 0 ? 'Refreshing…' : `Refreshes in 0:${String(Math.ceil(left)).padStart(2, '0')}`;
  g.font = `500 16px ${SF}`;
  const tw = g.measureText(label).width;
  const rx = PT_W / 2 - (tw + 30) / 2 + 11;
  g.lineWidth = 3.5; g.lineCap = 'round';
  g.strokeStyle = '#E5E5EA'; g.beginPath(); g.arc(rx, 590, 10, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = C.indigo; g.beginPath(); g.arc(rx, 590, 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (left / 20)); g.stroke();
  text(g, label, rx + 19, 596, `500 16px ${SF}`, L.label);

  list(g, 664, [
    { icon: 'bag', color: C.green, label: 'Order ready for pickup', detail: 'Ready' },
    { icon: 'key', color: C.indigo, label: 'Signed in with passkey', detail: 'On' },
    { icon: 'back', color: C.orange, label: 'Returns at the counter' },
  ]);
  sample(g, false, 838);

  // floating tab bar (the iOS 26 look)
  g.save();
  g.shadowColor = 'rgba(0,0,0,.12)'; g.shadowBlur = 20; g.shadowOffsetY = 4;
  fillRR(g, 22, 856, 396, 62, 31, 'rgba(255,255,255,.92)');
  g.restore();
  const tabs: [Glyph, string][] = [['house', 'Home'], ['box', 'Orders'], ['qr', 'ID'], ['person', 'Account']];
  tabs.forEach(([icon, name], i) => {
    const cx = 22 + 99 * i + 49.5;
    const on = i === 2;
    if (on) fillRR(g, cx - 44, 860, 88, 54, 27, 'rgba(88,86,214,.12)');
    glyph(g, icon, cx, 878, 22, on ? C.indigo : '#3C3C43');
    text(g, name, cx, 904, `600 10px ${SF}`, on ? C.indigo : '#3C3C43', 'center');
  });
  homeBar(g, false);
}

function identityScreen(g: G, s: ScreenState) {
  // the page underneath, dimmed by the sheet
  g.fillStyle = L.bg;
  g.fillRect(0, 0, PT_W, PT_H);
  statusBar(g, false);
  largeTitle(g, 'Account', 'Signed in', false);
  fillRR(g, 16, 192, 408, 104, 12, L.card);
  fillRR(g, 16, 312, 408, 52, 12, L.card);
  g.fillStyle = 'rgba(0,0,0,.34)';
  g.fillRect(0, 0, PT_W, PT_H);

  // the sheet
  const top = 318;
  fillRR(g, 0, top, PT_W, PT_H - top, [38, 38, 0, 0], L.card);
  fillRR(g, 202, top + 7, 36, 5, 2.5, '#D1D1D6');
  g.beginPath(); g.arc(398, top + 40, 15, 0, Math.PI * 2); g.fillStyle = L.fill; g.fill();
  g.strokeStyle = '#8E8E93'; g.lineWidth = 2.2; g.lineCap = 'round';
  g.beginPath(); g.moveTo(393, top + 35); g.lineTo(403, top + 45); g.moveTo(403, top + 35); g.lineTo(393, top + 45); g.stroke();

  text(g, 'Merge your accounts', 24, top + 82, `700 26px ${SF}`, L.label);
  g.font = `400 16px ${SF}`;
  lines(g, 'We found two accounts with the same email. Keep your orders, addresses and cards in one.', 392).forEach((l, i) => text(g, l, 24, top + 112 + i * 22, `400 16px ${SF}`, 'rgba(60,60,67,.75)'));

  // the two accounts
  const ay = top + 170;
  fillRR(g, 20, ay, 400, 132, 14, L.bg);
  const accounts: [string, string, string][] = [['US account', 's•••@example.com', '#5E5CE6'], ['Mexico account', 's•••@example.com', '#FF9F0A']];
  accounts.forEach(([name, mail, col], i) => {
    const y = ay + i * 66;
    const grad = g.createLinearGradient(36, y + 13, 76, y + 53);
    grad.addColorStop(0, col); grad.addColorStop(1, '#1C1C1E');
    g.beginPath(); g.arc(56, y + 33, 20, 0, Math.PI * 2); g.fillStyle = grad; g.fill();
    text(g, 'SC', 56, y + 38, `600 14px ${SF}`, '#fff', 'center');
    text(g, name, 88, y + 30, `600 16px ${SF}`, L.label);
    text(g, mail, 88, y + 49, `400 13px ${SF}`, L.sec);
    if (i === 0) { g.fillStyle = L.sep; g.fillRect(88, y + 65.5, 316, 0.6); }
  });
  // a merge bracket on the right
  g.strokeStyle = C.indigo; g.lineWidth = 2; g.lineCap = 'round';
  g.beginPath(); g.moveTo(376, ay + 33); g.lineTo(392, ay + 33); g.lineTo(392, ay + 99); g.lineTo(376, ay + 99); g.moveTo(392, ay + 66); g.lineTo(402, ay + 66); g.stroke();

  glyph(g, 'key', 34, top + 340, 16, L.sec);
  text(g, 'Confirm with your passkey. No password, no code.', 50, top + 345, `400 14px ${SF}`, L.sec);

  // the button runs a little loop: idle, confirming, merged
  const cyc = s.t % 6;
  const by = top + 372;
  if (cyc < 2.6) {
    fillRR(g, 20, by, 400, 52, 26, '#1C1C1E');
    glyph(g, 'key', 132, by + 26, 18, '#fff');
    text(g, 'Merge with passkey', 230, by + 32, `600 17px ${SF}`, '#fff', 'center');
  } else if (cyc < 3.6) {
    fillRR(g, 20, by, 400, 52, 26, '#1C1C1E');
    const a = s.t * 7;
    g.strokeStyle = '#fff'; g.lineWidth = 2.6; g.lineCap = 'round';
    g.beginPath(); g.arc(220, by + 26, 10, a, a + Math.PI * 1.4); g.stroke();
  } else {
    fillRR(g, 20, by, 400, 52, 26, C.green);
    glyph(g, 'check', 146, by + 26, 18, '#fff');
    text(g, 'Accounts merged', 232, by + 32, `600 17px ${SF}`, '#fff', 'center');
  }
  text(g, 'Not now', PT_W / 2, by + 90, `400 17px ${SF}`, C.indigo, 'center');
  sample(g, false, 912);
  homeBar(g, false);
}

function boardScreen(g: G, s: ScreenState) {
  g.fillStyle = L.bg;
  g.fillRect(0, 0, PT_W, PT_H);
  statusBar(g, false);
  cornerButton(g, false);
  largeTitle(g, 'Modules', 'Home page, built from plugins', false);

  // release-time card
  fillRR(g, 16, 190, 408, 112, 16, L.card);
  text(g, 'Release time', 34, 220, `500 15px ${SF}`, L.sec);
  text(g, '−45%', 34, 270, `700 42px ${SF}`, C.green);
  const bars = [62, 58, 55, 44, 38, 34, 30];
  bars.forEach((h, i) => {
    const x = 262 + i * 20;
    fillRR(g, x, 284 - h, 12, h, 4, i < 3 ? '#D1D1D6' : C.green);
  });

  text(g, 'HOME PAGE', 36, 336, `400 13px ${SF}`, L.sec);
  // the reminder switch flips every 1.8 s
  const flip = Math.floor(s.t / 1.8) % 2 === 1;
  const p = ease((s.t % 1.8) / 0.3);
  const reminder = flip ? p : 1 - p;
  list(g, 346, [
    { icon: 'photo', color: C.blue, label: 'Hero banner', toggle: 1 },
    { icon: 'stack', color: C.orange, label: 'Deals carousel', toggle: 1 },
    { icon: 'bell', color: C.red, label: 'Pickup reminder', toggle: reminder },
    { icon: 'card', color: C.indigo, label: 'Membership card', toggle: 1 },
  ]);
  text(g, 'ARCHITECTURE', 36, 584, `400 13px ${SF}`, L.sec);
  list(g, 594, [
    { icon: 'layers', color: C.teal, label: 'MVVM + Coordinator', detail: '−30% bugs' },
    { icon: 'puzzle', color: C.pink, label: 'Plugin registry', detail: 'Tempo' },
  ]);
  sample(g, false, 738);
  homeBar(g, false);
}

function neuralScreen(g: G, s: ScreenState) {
  g.fillStyle = D.bg;
  g.fillRect(0, 0, PT_W, PT_H);
  statusBar(g, true);
  largeTitle(g, 'VoiceNote', 'Runs on this phone', true);

  const t = s.t % 12;
  fillRR(g, 16, 190, 408, 330, 26, D.card);
  const secs = Math.floor(t), tenths = Math.floor((t % 1) * 10);
  text(g, `00:${String(secs).padStart(2, '0')}.${tenths}`, PT_W / 2, 262, `300 50px ${SF}`, '#fff', 'center');
  const n = 44, bw = 4, gap = (368 - n * bw) / (n - 1);
  for (let i = 0; i < n; i++) {
    const a = 0.18 + 0.82 * Math.abs(Math.sin(s.t * 3.1 + i * 0.5) * Math.cos(s.t * 1.6 + i * 0.23));
    const h = 6 + a * 90;
    fillRR(g, 36 + i * (bw + gap), 360 - h / 2, bw, h, 2, i > n * 0.82 ? 'rgba(255,159,10,.35)' : C.orangeD);
  }
  // stop button
  g.beginPath(); g.arc(PT_W / 2, 462, 32, 0, Math.PI * 2); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3.5; g.stroke();
  fillRR(g, PT_W / 2 - 13, 449, 26, 26, 6, C.orangeD);

  // transcript, word by word
  const words = '“Remind me to ship the merge preview on Friday.”'.split(' ');
  const shown = Math.min(words.length, Math.floor(Math.max(0, t - 0.6) * 3));
  fillRR(g, 16, 536, 408, 96, 20, D.card);
  text(g, 'TRANSCRIPT', 34, 562, `600 12px ${SF}`, D.sec);
  g.font = `400 17px ${SF}`;
  lines(g, words.slice(0, shown).join(' '), 372).forEach((l, i) => text(g, l, 34, 590 + i * 23, `400 17px ${SF}`, '#fff'));

  if (t > 4.2) {
    const k = ease((t - 4.2) / 0.5);
    g.globalAlpha = k;
    const y = 648 + (1 - k) * 16;
    fillRR(g, 16, y, 408, 76, 20, D.card);
    g.beginPath(); g.arc(46, y + 38, 11, 0, Math.PI * 2); g.strokeStyle = C.orangeD; g.lineWidth = 2; g.stroke();
    text(g, 'Ship the merge preview', 70, y + 34, `600 17px ${SF}`, '#fff');
    text(g, 'Friday · filed as a to-do', 70, y + 55, `400 14px ${SF}`, D.sec);
    g.globalAlpha = 1;
  }
  fillRR(g, PT_W / 2 - 92, 752, 184, 34, 17, 'rgba(48,209,88,.14)');
  glyph(g, 'lock', PT_W / 2 - 66, 769, 13, C.greenD);
  text(g, '0 network calls', PT_W / 2 + 10, 774, `600 14px ${SF}`, C.greenD, 'center');
  sample(g, true, 820);
  homeBar(g, true);
}

function loopScreen(g: G, s: ScreenState) {
  g.fillStyle = D.bg;
  g.fillRect(0, 0, PT_W, PT_H);
  statusBar(g, true);
  text(g, 'Conductor', 20, 142, `700 34px ${SF}`, '#fff');
  g.font = `700 34px ${SF}`;
  const tw = g.measureText('Conductor').width;
  fillRR(g, 30 + tw, 117, 44, 22, 11, D.fill);
  text(g, 'TOY', 52 + tw, 132, `700 11px ${SF}`, C.orangeD, 'center');
  text(g, 'Picks a model tier for each turn', 20, 168, `400 15px ${SF}`, D.sec);

  const tr = s.trace.length ? s.trace : ['› rename this view model', 'intent  rename 0.65', 'filters ✓ ✓ ✓ ✓ ✓', 'cache   stay on balanced', 'route   balanced · 57 ms'];
  const shown = Math.min(tr.length, Math.floor(s.t * 2.4) + 1);
  fillRR(g, 16, 190, 408, 540, 22, D.card);
  let y = 230;
  g.font = `500 15px ${MONO}`;
  tr.slice(0, shown).forEach((l, i) => {
    const col = l.startsWith('›') ? C.greenD : i === tr.length - 1 ? '#B4B0FF' : 'rgba(255,255,255,.88)';
    for (const ln of lines(g, l, 368, 3)) { text(g, ln, 36, y, `500 15px ${MONO}`, col); y += 22; }
    y += 12;
  });
  if (Math.floor(s.t * 2) % 2 === 0) fillRR(g, 36, y - 16, 9, 18, 1.5, C.greenD);

  const last = tr[tr.length - 1] ?? '';
  const tiers: [string, string][] = [['fast', C.greenD], ['balanced', '#B4B0FF'], ['premium', C.orangeD]];
  let x = 16;
  tiers.forEach(([name, col]) => {
    g.font = `600 14px ${SF}`;
    const w = g.measureText(name).width + 28;
    const on = shown === tr.length && last.includes(name);
    fillRR(g, x, 748, w, 32, 16, on ? col : D.fill);
    text(g, name, x + w / 2, 769, `600 14px ${SF}`, on ? '#000' : D.sec, 'center');
    x += w + 8;
  });
  sample(g, true, 812);
  homeBar(g, true);
}
