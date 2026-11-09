// A QR-*looking* pattern for the re-enactment. It has real finder, timing and alignment patterns,
// but the data modules are random from a seed, so it does not scan. It is sample data, on purpose.

const SIZE = 25; // a version-2 QR grid

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function qrMatrix(seed: number): boolean[][] {
  const m: (boolean | null)[][] = Array.from({ length: SIZE }, () => Array<boolean | null>(SIZE).fill(null));
  const finder = (r: number, c: number) => {
    for (let y = -1; y <= 7; y++)
      for (let x = -1; x <= 7; x++) {
        const rr = r + y, cc = c + x;
        if (rr < 0 || cc < 0 || rr >= SIZE || cc >= SIZE) continue;
        const ring = Math.max(Math.abs(y - 3), Math.abs(x - 3));
        m[rr][cc] = y >= 0 && y <= 6 && x >= 0 && x <= 6 && ring !== 2 && ring !== 4 ? true : false;
        if (ring === 3) m[rr][cc] = true;
        if (y === -1 || y === 7 || x === -1 || x === 7) m[rr][cc] = false;
      }
  };
  finder(0, 0);
  finder(0, SIZE - 7);
  finder(SIZE - 7, 0);
  for (let i = 8; i < SIZE - 8; i++) {
    m[6][i] = i % 2 === 0;
    m[i][6] = i % 2 === 0;
  }
  for (let y = -2; y <= 2; y++)
    for (let x = -2; x <= 2; x++) m[18 + y][18 + x] = Math.max(Math.abs(x), Math.abs(y)) !== 1;
  const rnd = mulberry32(seed);
  return m.map((row) => row.map((v) => (v === null ? rnd() < 0.5 : v)));
}

/** One SVG path for all dark modules, in a 0..25 coordinate space. */
export function qrPath(seed: number): string {
  const m = qrMatrix(seed);
  let d = '';
  m.forEach((row, y) => row.forEach((on, x) => { if (on) d += `M${x} ${y}h1v1h-1z`; }));
  return d;
}

export const QR_SIZE = SIZE;
