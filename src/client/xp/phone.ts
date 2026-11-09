// The phone: a real-looking iPhone model, taken apart into layers that can fly apart.
//
// The outside is "iPhone 16 Pro Max" by MajdyModels (CC BY 4.0), with the Apple logo and wallpaper
// removed (see scripts/phone-model.mjs). The inside (logic board, chip, battery) is my own geometry.
// Front to back: cover glass, display, the chip's Secure Enclave and Neural Engine, the logic board
// (held by the frame), the battery, the back glass with the cameras.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { boardTexture, dieTexture, glowTexture } from './textures.ts';

export const PHONE_H = 1.6;
export const PHONE_W = 0.77;
const MODEL_URL = '/models/phone.glb';

export type PartId = 'glass' | 'display' | 'identity' | 'neural' | 'board' | 'battery' | 'back';

export interface Part {
  id: PartId;
  group: THREE.Group;
  base: number; // z when assembled
  spread: number; // extra z when fully exploded
  mats: { m: THREE.Material; o: number; t: boolean }[]; // materials, their full opacity, and whether they are see-through anyway
  emissive?: THREE.MeshStandardMaterial;
  anchor: THREE.Vector3; // label anchor, in part space
}

const SPREAD: Record<PartId, number> = { glass: 0.7, display: 0.44, identity: 0.2, neural: 0.26, board: 0, battery: -0.16, back: -0.56 };

// Which layer each piece of the model belongs to, by its node name.
function partOf(name: string): PartId {
  if (/^(Cube014_glass|Cube016_glass)/.test(name)) return 'glass';
  if (/^(Cube014_screen|Cube014_black|Cube016_black|Sphere013|Circle013)/.test(name)) return 'display';
  if (/^(Cube014_basecolor|Cube014_back_patch|Plane011|Plane012|Cylinder01[89]|Cylinder02[012]|len|Circle01[012]|Sphere01[012])/.test(name)) return 'back';
  return 'board'; // the titanium frame, buttons, port and grilles
}

/** Tune a model material for this scene. Glass becomes reflections only: no costly transmission pass. */
function tune(src: THREE.Material, mesh: THREE.Mesh): THREE.Material {
  const m = src.clone() as THREE.MeshPhysicalMaterial;
  const name = src.name;
  if (/glass/i.test(name) && !/lensinglass/i.test(name)) {
    m.transmission = 0;
    m.color.setRGB(0, 0, 0);
    m.opacity = 1;
    m.transparent = true;
    m.blending = THREE.AdditiveBlending;
    m.depthWrite = false;
    m.roughness = 0.03;
    m.envMapIntensity = 0.7; // enough to read as glass, not so much that it washes out the screen
  } else if (/^basecolor/i.test(name)) {
    // the back is frosted glass; the camera plateau is polished
    const plateau = mesh.name.startsWith('Plane011');
    m.roughness = plateau ? 0.12 : 0.42;
    m.clearcoat = plateau ? 1 : 0.35;
    m.clearcoatRoughness = plateau ? 0.05 : 0.3;
    m.side = THREE.DoubleSide;
  } else if (/metalframe/i.test(name)) {
    m.metalness = 1;
    m.roughness = 0.22;
    m.envMapIntensity = 1.25;
    m.side = THREE.DoubleSide;
  } else if (/lensinglass/i.test(name)) {
    m.roughness = 0.02;
    m.envMapIntensity = 1.6;
  }
  return m;
}

/**
 * Give the screen fresh texture coordinates: the drawn screen stretched over the glass, seen from the
 * front (top-left of the drawing at the top-left of the glass). Uses the screen's position in phone space.
 */
function screenUV(mesh: THREE.Mesh) {
  const pos = mesh.geometry.attributes.position;
  const p = new THREE.Vector3();
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < pos.count; i++) pts.push(p.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrix).clone());
  const box = new THREE.Box3().setFromPoints(pts);
  const uv = new Float32Array(pos.count * 2);
  pts.forEach((q, i) => {
    uv[i * 2] = (q.x - box.min.x) / (box.max.x - box.min.x);
    uv[i * 2 + 1] = (box.max.y - q.y) / (box.max.y - box.min.y); // the texture is not flipped, so v runs top to bottom
  });
  mesh.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

export async function loadPhone(screen: THREE.Texture) {
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(MODEL_URL);
  const root = new THREE.Group();
  const model = gltf.scene;
  model.rotation.y = Math.PI / 2; // the model's screen faces -x; ours faces +z
  root.add(model);
  root.updateMatrixWorld(true);
  const frame = model.getObjectByName('Cube014_metalframe002_0') ?? model;
  const box = new THREE.Box3().setFromObject(frame);
  const s = PHONE_H / (box.max.y - box.min.y);
  model.scale.multiplyScalar(s);
  root.updateMatrixWorld(true);
  const centre = new THREE.Box3().setFromObject(frame).getCenter(new THREE.Vector3());
  model.position.sub(centre);
  root.updateMatrixWorld(true);

  const parts: Part[] = [];
  const groups = {} as Record<PartId, THREE.Group>;
  const mk = (id: PartId, anchor: [number, number, number]) => {
    const group = new THREE.Group();
    root.add(group);
    groups[id] = group;
    parts.push({ id, group, base: 0, spread: SPREAD[id], mats: [], anchor: new THREE.Vector3(...anchor) });
  };
  mk('glass', [-PHONE_W / 2, 0.45, 0.05]);
  mk('display', [PHONE_W / 2 - 0.02, 0.2, 0.04]);
  mk('identity', [-0.147, 0.425, 0.012]);
  mk('neural', [-0.055, 0.52, 0.012]);
  mk('board', [-0.28, 0.66, 0]);
  mk('battery', [-0.3, -0.4, -0.01]);
  mk('back', [-PHONE_W / 2, -0.45, -0.04]);
  const part = (id: PartId) => parts.find((p) => p.id === id)!;

  // move every model piece into its layer, keeping where it sits
  const meshes: THREE.Mesh[] = [];
  model.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh); });
  for (const mesh of meshes) {
    const id = partOf(mesh.name);
    groups[id].attach(mesh);
    if (mesh.name.startsWith('Cube014_screen')) {
      screenUV(mesh);
      mesh.material = new THREE.MeshBasicMaterial({ map: screen, toneMapped: false, side: THREE.DoubleSide });
    } else {
      mesh.material = tune(mesh.material as THREE.Material, mesh);
    }
  }
  root.remove(model);

  // ── the inside, my own: logic board with the chip, and the battery
  const board = groups.board;
  const boardTex = new THREE.CanvasTexture(boardTexture());
  boardTex.colorSpace = THREE.SRGBColorSpace;
  boardTex.anisotropy = 4;
  const pcbMat = new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.6, metalness: 0.2 });
  const pcb = new THREE.Mesh(new RoundedBoxGeometry(0.66, 0.5, 0.008, 3, 0.02), pcbMat);
  pcb.position.set(0.0, 0.48, -0.012);
  const shieldMat = new THREE.MeshStandardMaterial({ color: 0xb9bcc2, roughness: 0.34, metalness: 1 });
  const chipMat = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.42, metalness: 0.3 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd9a548, roughness: 0.3, metalness: 1 });
  const box3 = new THREE.BoxGeometry(1, 1, 1);
  const place = (mat: THREE.Material, spots: [number, number, number, number, number][]) => {
    const im = new THREE.InstancedMesh(box3, mat, spots.length);
    const m4 = new THREE.Matrix4();
    spots.forEach(([x, y, w, h, d], i) => im.setMatrixAt(i, m4.compose(new THREE.Vector3(x, y, -0.008 + d / 2), new THREE.Quaternion(), new THREE.Vector3(w, h, d))));
    board.add(im);
    return im;
  };
  place(shieldMat, [[0.2, 0.62, 0.2, 0.16, 0.012], [0.2, 0.37, 0.18, 0.2, 0.01], [-0.25, 0.31, 0.12, 0.14, 0.009]]);
  place(chipMat, [[-0.26, 0.58, 0.08, 0.06, 0.006], [-0.25, 0.68, 0.06, 0.04, 0.005], [0.03, 0.29, 0.07, 0.05, 0.005], [-0.12, 0.27, 0.05, 0.04, 0.005]]);
  place(goldMat, [[0.0, 0.7, 0.14, 0.02, 0.004], [0.3, 0.27, 0.03, 0.08, 0.004]]);
  // the chip package
  const pkg = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.22, 0.012, 2, 0.012), new THREE.MeshStandardMaterial({ color: 0x1b1c20, roughness: 0.3, metalness: 0.6 }));
  pkg.position.set(-0.06, 0.47, -0.002);
  const dieTex = new THREE.CanvasTexture(dieTexture());
  dieTex.colorSpace = THREE.SRGBColorSpace;
  const dieMat = new THREE.MeshStandardMaterial({ map: dieTex, roughness: 0.25, metalness: 0.5, emissive: 0xffffff, emissiveMap: dieTex, emissiveIntensity: 0.35 });
  const die = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18), dieMat);
  die.position.set(-0.06, 0.47, 0.0045);
  board.add(pcb, pkg, die);
  // antenna bands on the frame; they light up when the phone talks to the loop
  const antMat = new THREE.MeshBasicMaterial({ color: 0x5ee08f, opacity: 0, transparent: true, toneMapped: false, depthWrite: false });
  for (const [x, y, w, h] of [[0, PHONE_H / 2 + 0.003, 0.3, 0.007], [-PHONE_W / 2 - 0.003, 0.5, 0.007, 0.14], [PHONE_W / 2 + 0.003, 0.5, 0.007, 0.14], [0, -PHONE_H / 2 - 0.003, 0.3, 0.007]] as const) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.07), antMat);
    a.position.set(x, y, 0);
    board.add(a);
  }
  board.userData.antenna = antMat;

  // Secure Enclave and Neural Engine: two regions of the chip (bottom left and top right of the die),
  // as glowing plates that lift off it, each with a soft halo so they read from across the room
  const glow = new THREE.CanvasTexture(glowTexture());
  const plate = (id: PartId, w: number, h: number, x: number, y: number, color: number, emissive: number) => {
    const mat = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 1.8, roughness: 0.35 });
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.007, 2, 0.007), mat);
    mesh.position.set(x, y, 0.009);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: emissive, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.scale.setScalar(Math.max(w, h) * 5);
    halo.position.set(x, y, 0.016);
    groups[id].add(mesh, halo);
    return mat;
  };
  part('identity').emissive = plate('identity', 0.064, 0.05, -0.115, 0.425, 0x1c1a40, 0x8f8aff);
  part('neural').emissive = plate('neural', 0.09, 0.068, -0.01, 0.52, 0x2a1c08, 0xffa53a);

  const batMat = new THREE.MeshStandardMaterial({ color: 0x24262c, roughness: 0.5, metalness: 0.35 });
  const bat = new THREE.Mesh(new RoundedBoxGeometry(0.64, 0.92, 0.026, 3, 0.04), batMat);
  bat.position.set(0, -0.3, -0.016);
  groups.battery.add(bat);

  // collect materials (cloned per layer, so each layer can fade on its own)
  for (const p of parts) {
    const seen = new Set<THREE.Material>();
    p.group.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (!mat || seen.has(mat)) return;
      seen.add(mat);
      p.mats.push({ m: mat, o: (mat as THREE.Material & { opacity: number }).opacity ?? 1, t: mat.transparent });
    });
  }
  return { root, parts };
}
