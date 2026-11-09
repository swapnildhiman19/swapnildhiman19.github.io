// Builds public/models/phone.glb from the downloaded source model.
//
// Source: "iPhone 16 Pro Max" by MajdyModels, CC BY 4.0
//   https://sketchfab.com/3d-models/iphone-16-pro-max-41a071ae12794b668502f58d1e0fd1a3
// Download the GLB (4k textures) from that page into assets-src/iphone_16_pro_max.glb, then run:
//   npm run model
//
// Changes made here (the CC BY licence asks us to say what changed):
//   - the Apple logo on the back is removed (no Apple marks on this site)
//   - the wallpaper on the screen is removed; the site draws its own screens on it at runtime
//   - textures are shrunk to 1024 px WebP and the geometry is compressed (meshopt), for a fast page
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, textureCompress } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import { mkdirSync, statSync } from 'node:fs';

const SRC = 'assets-src/iphone_16_pro_max.glb';
const OUT = 'public/models/phone.glb';

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(SRC);
const root = doc.getRoot();

// The back glass has a logo-shaped hole that the logo mesh fills. Give the logo the back glass's own
// material, so the patch is flush and invisible, then drop the logo material.
const backGlass = root.listMaterials().find((m) => /^basecolor/i.test(m.getName()));
if (!backGlass) throw new Error('back glass material not found');
let logo = 0;
for (const mesh of root.listMeshes()) {
  for (const p of mesh.listPrimitives()) {
    if (/apple/i.test(p.getMaterial()?.getName() ?? '')) { p.setMaterial(backGlass); logo++; }
  }
}
for (const m of root.listMaterials()) {
  if (/apple/i.test(m.getName())) m.dispose();
  if (/^screen/i.test(m.getName())) { m.setBaseColorTexture(null); m.setName('screen'); }
}
for (const n of root.listNodes()) n.setName(n.getName().replace(/apple[ _]?logo/i, 'back_patch'));
for (const m of root.listMeshes()) m.setName(m.getName().replace(/apple[ _]?logo/i, 'back_patch'));
if (logo !== 1) throw new Error(`expected to cover 1 logo, covered ${logo}`);

await doc.transform(
  prune(),
  dedup(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 88 }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);

mkdirSync('public/models', { recursive: true });
await io.write(OUT, doc);
const tex = root.listTextures().map((t) => `${t.getName() || 'texture'} ${t.getSize()?.join('×')} ${(t.getImage()?.byteLength / 1024).toFixed(0)} KB`);
console.log(`wrote ${OUT}: ${(statSync(OUT).size / 1024).toFixed(0)} KB (source ${(statSync(SRC).size / 1024).toFixed(0)} KB)`);
console.log(`logos covered: ${logo}; textures: ${tex.join(' · ')}`);
