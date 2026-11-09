// The exploded-view scene. Scroll position picks a pose per chapter; the scene eases toward it.
// Rendering runs only while the stage is on screen and the tab is visible. All motion is delta-time based.
import * as THREE from 'three';
import { loadPhone, PHONE_H, type PartId } from './phone.ts';
import { drawScreen, redrawEvery, SCREEN_H, SCREEN_W, type LockContent, type ScreenId, type ScreenState } from './screens.ts';
import { glowTexture } from './textures.ts';

export type Chapter = 'intro' | 'overview' | 'glass' | 'identity' | 'board' | 'neural' | 'loop' | 'route';

interface Pose { rx: number; ry: number; explode: number; cam: [number, number, number]; look: [number, number, number]; ring: number; tiers: number }

// Desktop poses: the phone sits on the right, panels on the left.
const POSES: Record<Chapter, Pose> = {
  intro: { rx: 0.08, ry: -0.5, explode: 0, cam: [0, 0.12, 4.15], look: [-0.92, 0.02, 0], ring: 0, tiers: 0 },
  overview: { rx: -0.42, ry: 0.72, explode: 1, cam: [0.35, 0.35, 6.0], look: [-1.3, 0.1, 0], ring: 0, tiers: 0 },
  glass: { rx: -0.36, ry: 0.64, explode: 1, cam: [0.6, 0.5, 5.4], look: [-1.0, 0.35, 0.35], ring: 0, tiers: 0 },
  identity: { rx: -0.3, ry: 0.98, explode: 1.3, cam: [0.3, 0.4, 5.0], look: [-1.0, 0.22, 0], ring: 0, tiers: 0 },
  board: { rx: -0.3, ry: 0.8, explode: 1, cam: [0.25, 0.4, 4.9], look: [-0.95, 0.22, 0], ring: 0, tiers: 0 },
  neural: { rx: -0.22, ry: 1.04, explode: 1.35, cam: [0.2, 0.55, 4.8], look: [-0.98, 0.28, 0], ring: 0, tiers: 0 },
  loop: { rx: 0.16, ry: Math.PI - 0.55, explode: 0.14, cam: [0, 0.9, 6.9], look: [-1.25, 0.45, -0.7], ring: 1, tiers: 0.35 },
  route: { rx: 0.12, ry: Math.PI - 0.4, explode: 0.06, cam: [0.2, 1.05, 6.6], look: [-1.55, 0.5, -0.7], ring: 1, tiers: 1 },
};

const FOCUS: Record<Chapter, PartId[] | null> = {
  intro: null, overview: null, glass: ['glass', 'display'], identity: ['identity'], board: ['board'], neural: ['neural'], loop: ['back', 'board'], route: null,
};
// How faint the parts out of focus get (default 0.14). In the chip chapters the display stays half
// visible, so its app reads like an x-ray over the glowing chip, and the board holding the chip stays solid.
const DIM: Partial<Record<Chapter, Partial<Record<PartId, number>>>> = {
  identity: { display: 0.85, board: 1, battery: 0.35 },
  neural: { display: 0.85, board: 1, battery: 0.35 },
  board: { display: 0.4, battery: 0.6 },
};
const SCREEN: Record<Chapter, ScreenId> = { intro: 'lock', overview: 'lock', glass: 'qr', identity: 'identity', board: 'board', neural: 'neural', loop: 'loop', route: 'loop' };
const PART_TO_CHAPTER: Record<PartId, Chapter> = { glass: 'glass', display: 'glass', identity: 'identity', neural: 'neural', board: 'board', battery: 'board', back: 'loop' };

const TIER_COLORS = [0x5ee08f, 0xb4b0ff, 0xf5a524];
const TIER_R = [1.25, 1.55, 1.85];
const RING_POS = new THREE.Vector3(0, 0.35, -1.9);

export interface RingNode { label: string; value: string; angle: number }

export interface XpOptions {
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  chapters: HTMLElement[];
  labels: HTMLElement;
  partLabels: Partial<Record<PartId, { n: string; text: string; count: string }>>;
  ringNodes: RingNode[];
  lock: LockContent;
  reduced: boolean;
  paused: () => boolean; // the visitor's "Pause motion" button
  onChapter: (c: Chapter) => void;
  onReady: () => void;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (e0: number, e1: number, x: number) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

/**
 * A photo studio for reflections: a dark room with a big soft key light, two tall strip lights that
 * draw the bright lines down the titanium edges, a top light and a warm fill.
 */
function studio(): THREE.Scene {
  const s = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ color: 0x050506, side: THREE.BackSide }));
  s.add(room);
  const panel = (w: number, h: number, pos: [number, number, number], rgb: [number, number, number]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...rgb), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  panel(7, 4, [-6, 5, 6], [5, 5, 5.2]); // key softbox, upper left front
  panel(1.2, 10, [7, 0, 3], [6, 6, 6.4]); // strip, right
  panel(1.2, 10, [-7, 0, -3], [4, 4, 4.4]); // strip, left back
  panel(8, 8, [0, 9, 0], [1.6, 1.6, 1.7]); // top
  panel(6, 3, [3, -4, 6], [1.8, 1.25, 0.85]); // warm fill from below
  panel(5, 5, [0, 2, -8], [1.4, 1.5, 2.2]); // cool light behind, for the back of the phone
  return s;
}

export async function createXp(o: XpOptions) {
  const renderer = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07080a);
  scene.fog = new THREE.Fog(0x07080a, 7, 14);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studio(), 0.02).texture;
  pmrem.dispose();
  scene.environmentIntensity = 0.9;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 40);
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(-3, 4, 5);
  const rim = new THREE.DirectionalLight(0x8f9bff, 1.6);
  rim.position.set(4, 1.5, -3);
  const top = new THREE.DirectionalLight(0xdfe6ff, 1.2);
  top.position.set(0.5, 4, -4); // lights the back of the phone when it turns round to face the loop
  scene.add(key, rim, top, new THREE.AmbientLight(0xffffff, 0.1));

  // ── the live screen
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = SCREEN_W;
  screenCanvas.height = SCREEN_H;
  const sg = screenCanvas.getContext('2d')!;
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = 4;
  screenTex.flipY = false; // the model's screen uses glTF texture coordinates
  const screen: ScreenState = { id: 'lock', t: 0, qrSeed: (Date.now() % 9999) + 1, qrLeft: 20, trace: [], lock: o.lock };
  let screenDirty = true;
  let screenTimer = 0;

  // ── the phone
  const { root: phone, parts } = await loadPhone(screenTex);
  scene.add(phone);
  const antenna = parts.find((p) => p.id === 'board')!.group.userData.antenna as THREE.MeshBasicMaterial;
  const chips = parts.filter((p) => p.id === 'neural' || p.id === 'identity');

  // halo behind the phone and a soft shadow under it
  const glowTex = new THREE.CanvasTexture(glowTexture());
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x3c3f7a, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(5.2, 5.2, 1);
  halo.position.set(0, 0.1, -2.6);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshBasicMaterial({ map: glowTex, color: 0x000000, transparent: true, opacity: 0.8, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -PHONE_H / 2 - 0.32, 0);
  scene.add(halo, shadow);

  // dust in the air
  const dustN = 220;
  const dustPos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) { dustPos[i * 3] = (Math.random() - 0.5) * 9; dustPos[i * 3 + 1] = (Math.random() - 0.5) * 5; dustPos[i * 3 + 2] = -Math.random() * 6 + 1; }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.02, color: 0x9aa3b8, transparent: true, opacity: 0.5, depthWrite: false, sizeAttenuation: true }));
  scene.add(dust);

  // ── the agent loop behind the phone: three tier rings, particles, project nodes, a beam, a packet
  const ring = new THREE.Group();
  ring.position.copy(RING_POS);
  ring.rotation.x = -1.18;
  const ringMats = TIER_R.map((r, i) => {
    const m = new THREE.MeshBasicMaterial({ color: TIER_COLORS[i], transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
    ring.add(new THREE.Mesh(new THREE.TorusGeometry(r, i === 1 ? 0.007 : 0.0045, 6, 256), m));
    return m;
  });
  const pN = 540;
  const pRing = new Float32Array(pN), pPhase = new Float32Array(pN), pSpeed = new Float32Array(pN), pPos = new Float32Array(pN * 3);
  for (let i = 0; i < pN; i++) { pRing[i] = i % 3; pPhase[i] = Math.random() * Math.PI * 2; pSpeed[i] = (0.12 + Math.random() * 0.25) * (i % 3 === 1 ? 1 : 0.7); }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('aRing', new THREE.BufferAttribute(pRing, 1));
  pGeo.setAttribute('aPhase', new THREE.BufferAttribute(pPhase, 1));
  pGeo.setAttribute('aSpeed', new THREE.BufferAttribute(pSpeed, 1));
  const pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uRing: { value: 0 }, uTiers: { value: 0 }, uPx: { value: 1 }, uR: { value: TIER_R }, uC: { value: TIER_COLORS.map((c) => new THREE.Color(c)) } },
    vertexShader: `attribute float aRing; attribute float aPhase; attribute float aSpeed; uniform float uTime, uRing, uTiers, uPx; uniform float uR[3]; uniform vec3 uC[3]; varying vec3 vC; varying float vA;
      void main(){ int k = int(aRing); float r = uR[0]; vec3 c = uC[0]; if (k == 1) { r = uR[1]; c = uC[1]; } if (k == 2) { r = uR[2]; c = uC[2]; }
        float a = aPhase + uTime * aSpeed; vec3 p = vec3(cos(a) * r, sin(a) * r, 0.0);
        vC = c; vA = uRing * (k == 1 ? 1.0 : uTiers) * (0.45 + 0.55 * sin(a * 3.0 + aPhase) * 0.5 + 0.275);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = uPx * 0.032 / -mv.z; }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * vA; gl_FragColor = vec4(vC * a, a); }`,
  });
  const ringPoints = new THREE.Points(pGeo, pMat);
  ringPoints.frustumCulled = false;
  ring.add(ringPoints);
  const nodeMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xc8ffd9, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const nodes = o.ringNodes.map((n) => {
    const s = new THREE.Sprite(nodeMat);
    s.scale.setScalar(0.26);
    s.position.set(Math.cos(n.angle) * TIER_R[1], Math.sin(n.angle) * TIER_R[1], 0);
    ring.add(s);
    return s;
  });
  scene.add(ring);
  const beamGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const beamMat = new THREE.LineBasicMaterial({ color: 0x5ee08f, transparent: true, opacity: 0 });
  const beam = new THREE.Line(beamGeo, beamMat);
  beam.frustumCulled = false;
  scene.add(beam);
  const packet = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  packet.scale.setScalar(0.32);
  scene.add(packet);
  const pk = { active: false, t: 0, tier: 1 };

  // ── labels (DOM, positioned from 3D anchors)
  const svgNS = 'http://www.w3.org/2000/svg';
  const lines = document.createElementNS(svgNS, 'svg');
  lines.setAttribute('class', 'xp__lines');
  o.labels.append(lines);
  // part labels sit in a tidy column left of the phone (slot = row); ring and tier labels sit beside their anchor
  type Lbl = { el: HTMLElement; line: SVGLineElement; dot: SVGCircleElement; world: () => THREE.Vector3; show: (c: Chapter) => boolean; dx: number; dy: number; slot?: number; w: number };
  const lbls: Lbl[] = [];
  let slots = 0;
  const mkLabel = (html: string, world: () => THREE.Vector3, show: (c: Chapter) => boolean, dx: number, dy: number, cls = '', slot?: number) => {
    const el = document.createElement('div');
    el.className = `xl ${cls}`;
    el.innerHTML = html;
    o.labels.append(el);
    const line = document.createElementNS(svgNS, 'line');
    const dot = document.createElementNS(svgNS, 'circle');
    dot.setAttribute('r', '3');
    lines.append(line, dot);
    lbls.push({ el, line, dot, world, show, dx, dy, slot, w: 0 });
  };
  const tmp = new THREE.Vector3();
  for (const p of parts) {
    const info = o.partLabels[p.id];
    if (!info) continue;
    const chapter = PART_TO_CHAPTER[p.id];
    mkLabel(`<span class="xl__n">${info.n}</span><b>${info.text}</b><small>${info.count}</small>`, () => p.group.localToWorld(tmp.copy(p.anchor)), (c) => c === 'overview' || c === chapter, 70, -46, '', slots++);
  }
  o.ringNodes.forEach((n, i) => mkLabel(`<b>${n.label}</b><small>${n.value}</small>`, () => nodes[i].getWorldPosition(tmp), (c) => c === 'loop', i % 2 ? -150 : 40, i < 2 ? -40 : 30, 'xl--ring'));
  const tierAngle = -Math.PI / 2 - 0.95; // the near, lower-left part of the rings, clear of the phone and the panel
  ['fast', 'balanced', 'premium'].forEach((t, i) => mkLabel(`<b>${t}</b>`, () => ring.localToWorld(tmp.set(Math.cos(tierAngle) * TIER_R[i], Math.sin(tierAngle) * TIER_R[i], 0)), (c) => c === 'route', -96, -6 + i * 8, `xl--tier xl--t${i}`));

  // ── interaction: tilt toward the pointer, drag to spin, hover a layer to pick it
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  // on arrival the phone starts facing away and turns round to show its screen
  const spin = { off: o.reduced ? 0 : -Math.PI * 1.1, vel: 0, dragging: false, lastX: 0, lastT: 0 };
  if (o.reduced) screen.t = 30; // final states, no slide-ins
  const ray = new THREE.Raycaster();
  let hovered: PartId | null = null;
  o.stage.addEventListener('pointermove', (e) => {
    const r = o.stage.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (spin.dragging) {
      const now = performance.now();
      const dx = e.clientX - spin.lastX;
      spin.off += dx * 0.01;
      spin.vel = (dx * 0.01) / Math.max(0.008, (now - spin.lastT) / 1000);
      spin.lastX = e.clientX;
      spin.lastT = now;
    }
  });
  o.stage.addEventListener('pointerdown', (e) => {
    if (hovered && chapter === 'overview') return;
    spin.dragging = true;
    spin.lastX = e.clientX;
    spin.lastT = performance.now();
    o.stage.setPointerCapture(e.pointerId);
    o.stage.classList.add('is-dragging');
  });
  const endDrag = () => { spin.dragging = false; o.stage.classList.remove('is-dragging'); };
  o.stage.addEventListener('pointerup', endDrag);
  o.stage.addEventListener('pointercancel', endDrag);
  o.stage.addEventListener('click', () => {
    if (!hovered || chapter !== 'overview') return;
    document.querySelector(`#layer-${PART_TO_CHAPTER[hovered]}`)?.scrollIntoView({ behavior: o.reduced ? 'auto' : 'smooth', block: 'center' });
  });

  // ── scroll → pose
  let centers: number[] = [];
  const ids = o.chapters.map((c) => c.dataset.chapter as Chapter);
  const measure = () => { centers = o.chapters.map((c) => { const r = c.getBoundingClientRect(); return r.top + scrollY + r.height / 2; }); };
  let mobile = false;
  const resize = () => {
    const w = o.stage.clientWidth, h = o.stage.clientHeight;
    mobile = w / h < 0.9;
    const dpr = Math.min(devicePixelRatio || 1, mobile ? 1.6 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    pMat.uniforms.uPx.value = dpr * h * 0.5;
    lines.setAttribute('viewBox', `0 0 ${w} ${h}`);
    measure();
  };
  new ResizeObserver(resize).observe(o.stage);
  new ResizeObserver(measure).observe(o.chapters[0].parentElement!);
  addEventListener('load', measure);
  resize();

  const target: Pose = structuredClone(POSES.intro);
  const cur: Pose = structuredClone(POSES.intro);
  const focusAmt = new Map(parts.map((p) => [p.id, 1]));
  let chapter: Chapter = 'intro';

  function poseFromScroll() {
    const line = scrollY + innerHeight * 0.5;
    let i = 0;
    while (i < centers.length - 1 && line > centers[i + 1]) i++;
    const a = ids[i], b = ids[Math.min(i + 1, ids.length - 1)];
    const t = centers.length > 1 && line > centers[i] ? Math.min(1, (line - centers[i]) / (centers[i + 1] - centers[i] || 1)) : 0;
    const k = o.reduced ? (t > 0.5 ? 1 : 0) : smooth(0.18, 0.82, t);
    const A = POSES[a], B = POSES[b];
    target.rx = lerp(A.rx, B.rx, k); target.ry = lerp(A.ry, B.ry, k); target.explode = lerp(A.explode, B.explode, k);
    target.ring = lerp(A.ring, B.ring, k); target.tiers = lerp(A.tiers, B.tiers, k);
    for (let j = 0; j < 3; j++) { target.cam[j] = lerp(A.cam[j], B.cam[j], k); target.look[j] = lerp(A.look[j], B.look[j], k); }
    const next = t < 0.5 ? a : b;
    if (next !== chapter) {
      chapter = next;
      o.onChapter(chapter);
      if (SCREEN[chapter] !== screen.id) { screen.id = SCREEN[chapter]; screen.t = o.reduced ? 30 : 0; screenDirty = true; }
    }
  }

  // ── frame
  let raf = 0, last = 0, visible = true, time = 0, ready = false;
  const look = new THREE.Vector3();
  const v = new THREE.Vector3();
  const ant = new THREE.Vector3();
  const n0 = new THREE.Vector3();
  const board = parts.find((p) => p.id === 'board')!.group;
  function frame(now: number) {
    raf = 0;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    const still = o.reduced || o.paused();
    time += still ? 0 : dt;
    poseFromScroll();
    const k = o.reduced ? 1 : 1 - Math.exp(-dt * 4.2);
    cur.rx = lerp(cur.rx, target.rx, k); cur.ry = lerp(cur.ry, target.ry, k); cur.explode = lerp(cur.explode, target.explode, k);
    cur.ring = lerp(cur.ring, target.ring, k); cur.tiers = lerp(cur.tiers, target.tiers, k);
    for (let j = 0; j < 3; j++) { cur.cam[j] = lerp(cur.cam[j], target.cam[j], k); cur.look[j] = lerp(cur.look[j], target.look[j], k); }

    // pointer tilt and spin with inertia that springs back
    const pk1 = 1 - Math.exp(-dt * 3);
    pointer.x = lerp(pointer.x, fine ? pointer.tx : 0, pk1);
    pointer.y = lerp(pointer.y, fine ? pointer.ty : 0, pk1);
    if (!spin.dragging) {
      spin.off += spin.vel * dt;
      spin.vel *= Math.exp(-dt * 2.5);
      spin.off *= Math.exp(-dt * (Math.abs(spin.vel) < 0.3 ? 1.6 : 0.2));
    }
    const sway = still || chapter !== 'intro' ? 0 : Math.sin(time * 0.6) * 0.06;
    phone.rotation.set(cur.rx + pointer.y * 0.07, cur.ry + sway + spin.off + pointer.x * 0.12, 0);
    phone.position.y = still ? 0 : Math.sin(time * 0.9) * 0.025;

    // layers: spread, focus, glow
    const focus = hovered && chapter === 'overview' ? [hovered] : FOCUS[chapter];
    for (const p of parts) {
      const on = !focus || focus.includes(p.id) || (p.id === 'display' && focus.includes('glass'));
      const f = lerp(focusAmt.get(p.id)!, on ? 1 : (DIM[chapter]?.[p.id] ?? 0.14), k);
      focusAmt.set(p.id, f);
      p.group.position.z = p.base + p.spread * cur.explode + (on && focus ? 0.06 * cur.explode : 0);
      for (const x of p.mats) {
        const m = x.m as THREE.Material & { opacity: number };
        m.opacity = x.o * f;
        // solid parts draw as solid (correct depth, no see-through frame) unless they are fading
        const see = x.t || f < 0.995;
        if (m.transparent !== see) { m.transparent = see; m.needsUpdate = true; }
      }
    }
    // the chip region of the current chapter breathes
    for (const c of chips) c.emissive!.emissiveIntensity = (chapter === c.id ? 2.2 + Math.sin(time * 2.4) * 0.6 : 1.2) * focusAmt.get(c.id)!;
    antenna.opacity = cur.ring;

    // camera (mobile: centre the phone in the upper half, a little further back)
    if (mobile) {
      camera.position.set(cur.cam[0] * 0.4, cur.cam[1] + 0.2, cur.cam[2] * 1.45);
      look.set(0.28, cur.look[1] - 1.0, cur.look[2]);
    } else {
      camera.position.set(cur.cam[0], cur.cam[1], cur.cam[2]);
      look.set(cur.look[0], cur.look[1], cur.look[2]);
    }
    camera.lookAt(look);

    // the loop
    ring.visible = cur.ring > 0.01;
    ringMats.forEach((m, i) => { m.opacity = cur.ring * (i === 1 ? 0.7 : 0.4 * cur.tiers) + (pk.active && pk.tier === i ? 0.5 : 0); });
    pMat.uniforms.uTime.value = time;
    pMat.uniforms.uRing.value = cur.ring;
    pMat.uniforms.uTiers.value = cur.tiers;
    nodeMat.opacity = cur.ring;
    ring.rotation.z = time * 0.04;
    board.localToWorld(ant.set(0, PHONE_H / 2, 0));
    nodes[0].getWorldPosition(n0);
    beamGeo.attributes.position.setXYZ(0, ant.x, ant.y, ant.z);
    beamGeo.attributes.position.setXYZ(1, n0.x, n0.y, n0.z);
    beamGeo.attributes.position.needsUpdate = true;
    beamMat.opacity = cur.ring * 0.55;
    if (pk.active) {
      pk.t += dt / 2.2;
      const sm = packet.material as THREE.SpriteMaterial;
      sm.color.setHex(TIER_COLORS[pk.tier]);
      if (pk.t < 0.3) packet.position.lerpVectors(ant, n0, smooth(0, 1, pk.t / 0.3));
      else {
        // switch onto the chosen tier's lane and ride it round the loop (ring space, so it turns with the ring)
        const a = o.ringNodes[0].angle + smooth(0, 1, (pk.t - 0.3) / 0.7) * Math.PI * 1.25;
        packet.position.copy(ring.localToWorld(v.set(Math.cos(a) * TIER_R[pk.tier], Math.sin(a) * TIER_R[pk.tier], 0)));
      }
      sm.opacity = Math.min(1, Math.sin(Math.PI * Math.min(1, pk.t)) * 2);
      if (pk.t >= 1) { pk.active = false; sm.opacity = 0; }
    }
    dust.rotation.y = time * 0.01;

    // the live screen
    if (!still) screen.t += dt;
    screenTimer += dt;
    if (screen.id === 'qr') {
      screen.qrLeft -= still ? 0 : dt;
      if (screen.qrLeft < -0.8) { screen.qrSeed++; screen.qrLeft = 20; screenDirty = true; }
    }
    if (screenTimer > (still ? 1 : redrawEvery(screen))) screenDirty = true; // still: only the clock moves
    if (screenDirty) { drawScreen(sg, screen, false); screenTex.needsUpdate = true; screenDirty = false; screenTimer = 0; }

    // hover pick in the exploded overview
    if (fine && chapter === 'overview' && !spin.dragging) {
      ray.setFromCamera(new THREE.Vector2(pointer.tx, -pointer.ty), camera);
      const hit = ray.intersectObjects(parts.filter((p) => p.id !== 'battery').map((p) => p.group), true)[0];
      let found: PartId | null = null;
      if (hit) for (const p of parts) { let x: THREE.Object3D | null = hit.object; while (x) { if (x === p.group) found = p.id; x = x.parent; } }
      if (found !== hovered) { hovered = found; o.stage.classList.toggle('is-picking', !!found); }
    } else if (hovered) { hovered = null; o.stage.classList.remove('is-picking'); }

    renderer.render(scene, camera);

    // labels follow their anchors
    const w = o.stage.clientWidth, h = o.stage.clientHeight;
    for (const l of lbls) {
      const show = l.show(chapter) && !(mobile && (chapter === 'overview' || (chapter === 'loop' && l.slot !== undefined)));
      l.el.classList.toggle('is-on', show);
      l.line.style.opacity = l.dot.style.opacity = show ? '1' : '0';
      if (!show) continue;
      const p = l.world().project(camera);
      const x = (p.x * 0.5 + 0.5) * w, y = (-p.y * 0.5 + 0.5) * h;
      if (!l.w) l.w = l.el.offsetWidth || 150;
      let lx: number, ly: number, ex: number;
      if (l.slot !== undefined && !mobile) {
        // a column between the panel and the phone; in the overview every part gets its own row
        lx = w * 0.455;
        ly = chapter === 'overview' ? h * (0.2 + l.slot * 0.13) : Math.min(h - 70, Math.max(90, y - 22));
        ex = lx + l.w;
      } else {
        // on desktop the left half belongs to the text panel, so labels stay right of it
        lx = Math.min(w - l.w - 8, Math.max(mobile ? 8 : w * 0.5, x + l.dx));
        ly = Math.min(h - 40, Math.max(70, y + l.dy));
        ex = l.dx < 0 ? lx + l.w : lx;
      }
      l.el.style.transform = `translate(${lx.toFixed(1)}px, ${ly.toFixed(1)}px)`;
      l.line.setAttribute('x1', x.toFixed(1)); l.line.setAttribute('y1', y.toFixed(1));
      l.line.setAttribute('x2', ex.toFixed(1)); l.line.setAttribute('y2', (ly + 18).toFixed(1));
      l.dot.setAttribute('cx', x.toFixed(1)); l.dot.setAttribute('cy', y.toFixed(1));
    }

    if (!ready) { ready = true; o.onReady(); }
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const start = () => { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }).observe(o.stage.parentElement!);
  document.addEventListener('visibilitychange', start);
  renderer.compile(scene, camera);
  if (import.meta.env.DEV) Object.assign(window, { __xp: { scene, camera, parts, renderer, THREE } }); // QA hook, dev only
  start();

  return {
    route(tier: number, trace: string[]) {
      pk.active = true;
      pk.t = 0;
      pk.tier = tier;
      screen.trace = trace;
      screen.t = o.reduced ? 30 : 0;
      screenDirty = true;
      start();
    },
    remeasure: measure,
  };
}
