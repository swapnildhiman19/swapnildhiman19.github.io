// Addresses for public files that other sites cache by URL. LinkedIn, for example, keeps a link-preview
// image for as long as its address stays the same, so the address carries a short fingerprint of the file:
// change og.png and the address changes with it. Runs at build time (Node), from the project root.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { site } from '../data.ts';

function versioned(file: string): string {
  const path = resolve(process.cwd(), 'public', file);
  if (!existsSync(path)) return `${site.url}/${file}`;
  const v = createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 8);
  return `${site.url}/${file}?v=${v}`;
}

export const ogImage = versioned('og.png');
