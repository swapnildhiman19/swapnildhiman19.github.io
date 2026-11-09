// Textures for the inside of the phone, drawn in code: the logic board, the chip's die and a soft glow.
// (The live screen is in screens.ts.)

const MONO = 'ui-monospace, "SF Mono", "Geist Mono Variable", Menlo, monospace';

export function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

/** A dark, dense logic board: fine traces, pads and silkscreen marks (no real part numbers). */
export function boardTexture(): HTMLCanvasElement {
  const [c, g] = canvas(1024, 768);
  const base = g.createLinearGradient(0, 0, 1024, 768);
  base.addColorStop(0, '#0c1322');
  base.addColorStop(1, '#070b14');
  g.fillStyle = base;
  g.fillRect(0, 0, 1024, 768);
  const rnd = mulberry(17);
  g.lineCap = 'round';
  for (let i = 0; i < 220; i++) {
    let x = rnd() * 1024, y = rnd() * 768;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 3; k++) {
      if (rnd() < 0.5) x += (rnd() - 0.5) * 220; else y += (rnd() - 0.5) * 160;
      g.lineTo(x, y);
    }
    g.strokeStyle = `rgba(206,164,86,${0.12 + rnd() * 0.22})`;
    g.lineWidth = 1 + rnd() * 1.6;
    g.stroke();
  }
  // pads and vias
  for (let i = 0; i < 420; i++) {
    const x = rnd() * 1024, y = rnd() * 768;
    g.fillStyle = rnd() < 0.6 ? 'rgba(214,182,110,.55)' : 'rgba(190,196,206,.5)';
    if (rnd() < 0.5) g.fillRect(x, y, 3 + rnd() * 6, 2 + rnd() * 3);
    else { g.beginPath(); g.arc(x, y, 1.6 + rnd() * 1.6, 0, Math.PI * 2); g.fill(); }
  }
  // silkscreen outlines
  g.strokeStyle = 'rgba(230,234,240,.18)';
  g.lineWidth = 1.5;
  for (let i = 0; i < 18; i++) g.strokeRect(rnd() * 900, rnd() * 680, 30 + rnd() * 90, 20 + rnd() * 60);
  g.fillStyle = 'rgba(230,234,240,.28)';
  g.font = `600 16px ${MONO}`;
  g.fillText('SD-26 · LOGIC', 40, 736);
  return c;
}

/**
 * The chip's die, seen from above: CPU and GPU cores, a cache grid, the Neural Engine (amber, top right)
 * and the Secure Enclave (indigo, bottom left). The glowing plates in phone.ts sit over those two regions.
 */
export function dieTexture(): HTMLCanvasElement {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#121318';
  g.fillRect(0, 0, 256, 256);
  const block = (x: number, y: number, w: number, h: number, fill: string, line = 'rgba(255,255,255,.12)') => {
    g.fillStyle = fill; g.fillRect(x, y, w, h);
    g.strokeStyle = line; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  };
  // CPU: two big cores, four small
  block(14, 14, 46, 52, '#2a2d36'); block(64, 14, 46, 52, '#2a2d36');
  for (let i = 0; i < 4; i++) block(14 + i * 24, 72, 20, 24, '#23262e');
  // GPU cores
  for (let i = 0; i < 6; i++) block(14 + (i % 3) * 32, 108 + Math.floor(i / 3) * 34, 28, 30, '#1f2a33');
  // cache
  for (let y = 0; y < 5; y++) for (let x = 0; x < 6; x++) block(120 + x * 9, 130 + y * 9, 8, 8, '#1a1c22', 'rgba(255,255,255,.06)');
  // Neural Engine: 16 cells
  block(118, 20, 138 - 16, 98, 'rgba(255,165,58,.12)', 'rgba(255,165,58,.5)');
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) block(124 + x * 28, 26 + y * 22, 24, 18, 'rgba(255,165,58,.35)', 'rgba(255,190,110,.6)');
  // Secure Enclave
  block(10, 182, 80, 64, 'rgba(143,138,255,.18)', 'rgba(170,166,255,.6)');
  block(30, 198, 40, 32, 'rgba(143,138,255,.45)', 'rgba(200,198,255,.7)');
  // media and I/O blocks
  block(100, 182, 70, 64, '#20232b'); block(176, 182, 70, 64, '#1c1f26');
  block(176, 130, 70, 44, '#22252d');
  return c;
}

export function glowTexture(): HTMLCanvasElement {
  const [c, g] = canvas(128, 128);
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return c;
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
