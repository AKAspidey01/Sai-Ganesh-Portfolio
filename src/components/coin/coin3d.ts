import {
  CanvasTexture,
  CircleGeometry,
  DirectionalLight,
  Group,
  LatheGeometry,
  LinearFilter,
  Mesh,
  MeshStandardMaterial,
  NoToneMapping,
  PerspectiveCamera,
  PMREMGenerator,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  WebGLRenderer,
  type Texture,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gsap } from '../../lib/gsap';

/**
 * Real 3D coin (three.js), lazy-loaded by <PictureCoin>.
 *
 * GSAP keeps animating the DOM layers exactly as before (.coin__spin for
 * entrances, .coin__body for flips). Those layers are hidden while this
 * renderer is active and act as the source of truth: every tick we read their
 * rotateX / rotateY / y / scale / opacity and pose the mesh to match. So the
 * scroll, hover and intro choreography didn't change, and if WebGL is missing
 * or the context is lost the original CSS coin is simply shown again.
 *
 * The travel layer (.coin) and the stage lift (.coin__stage) are plain 2D
 * moves, so they still apply to the canvas through CSS.
 */

export interface Coin3DOptions {
  /** The .coin element (gets the `is-3d` class once the first frame is drawn). */
  root: HTMLElement;
  front: string;
  back: string;
  /** Brand-gradient rim (footer) instead of polished silver. */
  ring?: boolean;
}

/* Geometry, in coin radii (the coin's CSS box = diameter 2). */
const PHOTO_R = 0.9; // photo disc radius; the metal rim fills 0.9 → 1
const FACE_Z = 0.05; // photo plane (recessed below the rim lip)
const LIP_Z = 0.075; // top of the raised rim
const EDGE_Z = 0.05; // where the outer bevel meets the reeded edge
/* Canvas is larger than the coin box so tilted edges and the lift never clip. */
const MARGIN = 1.3;
/* Camera distance in radii; ~8 matches the old CSS perspective feel, a bit deeper. */
const CAM_DIST = 8;

const DEG = Math.PI / 180;

/*
 * Photo face lighting. Most of the photo comes from `emissive`, so facing the
 * camera it matches the original image (measured: same mean, contrast and
 * black level). The key light adds soft shading as it turns and, with the low
 * roughness, a glint that sweeps across mid-flip. No environment reflection on
 * the faces: even a faint one lifts the photo's blacks into grey.
 */
const FACE = { color: 0xbcbcbc, emissive: 0.83, roughness: 0.18 };

/**
 * Profile of the rim + edge as (r, z) points, ordered back lip → edge → front
 * lip. LatheGeometry needs this order (height increasing along the outer edge)
 * for its normals to face outward.
 */
function rimProfile(): Vector2[] {
  const top: Vector2[] = []; // front half, inner → outer
  // inner wall rising out of the photo plane with a soft fillet
  top.push(new Vector2(PHOTO_R, FACE_Z));
  for (let i = 1; i <= 4; i++) {
    const t = (i / 4) * (Math.PI / 2);
    top.push(new Vector2(PHOTO_R + 0.035 * (1 - Math.cos(t)), FACE_Z + (LIP_Z - FACE_Z) * Math.sin(t)));
  }
  top.push(new Vector2(0.955, LIP_Z));
  // rounded outer bevel down to the edge
  const bevelR = 1 - 0.975;
  for (let i = 0; i <= 6; i++) {
    const t = Math.PI / 2 - (i / 6) * (Math.PI / 2);
    top.push(new Vector2(0.975 + bevelR * Math.cos(t), EDGE_Z + (LIP_Z - EDGE_Z) * Math.sin(t)));
  }
  const bottom = top.map((p) => new Vector2(p.x, -p.y)); // back half, inner → outer
  return [...bottom, ...top.reverse()];
}

/** Bump map for the lathe: fine vertical ridges only on the outer edge band. */
function reedingTexture(edgeV0: number, edgeV1: number): CanvasTexture {
  const w = 2048;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = '#808080';
  g.fillRect(0, 0, w, h);
  const ridges = 180;
  const y0 = Math.floor((1 - edgeV1) * h);
  const y1 = Math.ceil((1 - edgeV0) * h);
  for (let i = 0; i < ridges; i++) {
    const x = (i / ridges) * w;
    const grad = g.createLinearGradient(x, 0, x + w / ridges, 0);
    grad.addColorStop(0, '#404040');
    grad.addColorStop(0.5, '#ffffff');
    grad.addColorStop(1, '#404040');
    g.fillStyle = grad;
    g.fillRect(x, y0, w / ridges + 1, y1 - y0);
  }
  const tex = new CanvasTexture(c);
  tex.wrapS = RepeatWrapping;
  return tex;
}

/** Rim colour map for the footer: the brand ring gradient running round the coin. */
function ringTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 4;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 512, 0);
  // --g-ring, looped so the seam is invisible
  grad.addColorStop(0, '#f0626a');
  grad.addColorStop(0.25, '#9a7be6');
  grad.addColorStop(0.5, '#3b8bff');
  grad.addColorStop(0.75, '#9a7be6');
  grad.addColorStop(1, '#f0626a');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 4);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = RepeatWrapping;
  return tex;
}

/** Mounts the 3D coin. Returns a disposer, or null when WebGL isn't available. */
export function mountCoin3D({ root, front, back, ring = false }: Coin3DOptions): (() => void) | null {
  const stage = root.querySelector<HTMLElement>('.coin__stage');
  const spin = root.querySelector<HTMLElement>('.coin__spin');
  const body = root.querySelector<HTMLElement>('.coin__body');
  if (!stage || !spin || !body) return null;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;

  const wrap = document.createElement('div');
  wrap.className = 'coin__gl';
  wrap.setAttribute('aria-hidden', 'true');
  const canvas = renderer.domElement;
  wrap.appendChild(canvas);
  stage.appendChild(wrap);

  /* ---------- scene ---------- */
  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  // Reflections for the metal rim only. Assigned on the rim material rather
  // than scene.environment, which would also light (and grey out) the photos.
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const key = new DirectionalLight(0xffffff, 1.4);
  // Side-front key (same distance/angle as before, so the rest exposure is
  // unchanged): the face and rim glint as the coin turns left ↔ right.
  key.position.set(-2.6, 1.2, 3.4);
  scene.add(key);

  const camera = new PerspectiveCamera(2 * Math.atan(MARGIN / CAM_DIST) / DEG, 1, 0.1, 50);
  camera.position.set(0, 0, CAM_DIST + FACE_Z);

  const spinGroup = new Group(); // mirrors .coin__spin
  const bodyGroup = new Group(); // mirrors .coin__body
  // CSS writes rotateY(…) rotateX(…), i.e. X applied first.
  spinGroup.rotation.order = 'YXZ';
  bodyGroup.rotation.order = 'YXZ';
  spinGroup.add(bodyGroup);
  scene.add(spinGroup);

  // Rim + edge (lathe around Y, turned so the faces point along Z).
  const profile = rimProfile();
  const rimGeo = new LatheGeometry(profile, 160);
  rimGeo.rotateX(Math.PI / 2);
  // v of the reeded band = indices of the two (1, ±EDGE_Z) points.
  const edgeIdx = profile.map((p, i) => (Math.abs(p.x - 1) < 1e-6 ? i : -1)).filter((i) => i >= 0);
  const vOf = (i: number) => i / (profile.length - 1);
  const bump = reedingTexture(vOf(Math.min(...edgeIdx)), vOf(Math.max(...edgeIdx)));
  const ringMap = ring ? ringTexture() : null;
  const rimMat = new MeshStandardMaterial({
    color: ring ? 0xffffff : 0xb4b5bf,
    map: ringMap,
    envMap: envTex,
    metalness: ring ? 0.75 : 1,
    roughness: ring ? 0.32 : 0.3,
    bumpMap: bump,
    bumpScale: 1.2,
  });
  const rim = new Mesh(rimGeo, rimMat);
  bodyGroup.add(rim);

  // Photo faces. Emissive keeps the photo true to the original when facing
  // the camera; the lit part adds shading and a soft glare as it turns.
  const loader = new TextureLoader();
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const textures: Texture[] = [];
  const faceMat = () =>
    new MeshStandardMaterial({
      color: FACE.color,
      emissive: 0xffffff,
      emissiveIntensity: FACE.emissive,
      roughness: FACE.roughness,
      metalness: 0,
    });
  const frontMat = faceMat();
  const backMat = faceMat();
  const faceGeo = new CircleGeometry(PHOTO_R, 128);
  const frontFace = new Mesh(faceGeo, frontMat);
  frontFace.position.z = FACE_Z;
  const backFace = new Mesh(faceGeo, backMat);
  backFace.rotation.y = Math.PI; // upright, unmirrored once the coin turns 180° left ↔ right
  backFace.position.z = -FACE_Z;
  bodyGroup.add(frontFace, backFace);

  let pending = 2;
  let ready = false;
  let dirty = true;
  const onTexture = (mat: MeshStandardMaterial) => (tex: Texture) => {
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = anisotropy;
    tex.minFilter = LinearFilter;
    tex.generateMipmaps = false;
    // Sample just inside the photo's circle so its anti-aliased edge never shows.
    tex.repeat.set(0.97, 0.97);
    tex.offset.set(0.015, 0.015);
    mat.map = tex;
    mat.emissiveMap = tex;
    mat.needsUpdate = true;
    textures.push(tex);
    if (--pending === 0) {
      ready = true;
      dirty = true;
    }
  };
  loader.load(front, onTexture(frontMat));
  loader.load(back, onTexture(backMat));

  /* ---------- sizing ---------- */
  let unitsPerPx = 0;
  const resize = () => {
    const size = stage.offsetWidth; // layout size, unaffected by transforms
    if (!size) return;
    const css = size * MARGIN;
    // A little oversampling: the travel layer can scale the coin up ~1.3×.
    renderer.setPixelRatio(Math.min((window.devicePixelRatio || 1) * 1.3, 2.6));
    renderer.setSize(css, css, false);
    unitsPerPx = 2 / size;
    dirty = true;
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(stage);

  /* ---------- render on demand ---------- */
  let visible = true;
  const io = new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      if (visible) dirty = true;
    },
    { rootMargin: '200px' },
  );
  io.observe(root);

  const num = (el: HTMLElement, p: string) => Number(gsap.getProperty(el, p)) || 0;
  const alpha = (el: HTMLElement) => (el.style.visibility === 'hidden' ? 0 : el.style.opacity === '' ? 1 : Number(el.style.opacity));
  let last = '';
  let shown = false;

  const tick = () => {
    if (!ready || !visible || !unitsPerPx) return;
    const sRx = num(spin, 'rotateX');
    const sRy = num(spin, 'rotateY');
    const sY = num(spin, 'y');
    const sS = num(spin, 'scale') || 1;
    const sA = alpha(spin);
    const bRx = num(body, 'rotateX');
    const bRy = num(body, 'rotateY');
    const sig = `${sRx}|${sRy}|${sY}|${sS}|${sA}|${bRx}|${bRy}`;
    if (sig === last && !dirty) return;
    last = sig;
    dirty = false;

    // CSS (y down) → three (y up): rotateX flips sign, rotateY doesn't.
    spinGroup.rotation.set(-sRx * DEG, sRy * DEG, 0);
    spinGroup.position.y = -sY * unitsPerPx;
    spinGroup.scale.setScalar(sS);
    bodyGroup.rotation.set(-bRx * DEG, bRy * DEG, 0);
    canvas.style.opacity = String(sA);
    renderer.render(scene, camera);

    if (!shown) {
      shown = true;
      root.classList.add('is-3d');
    }
  };
  gsap.ticker.add(tick);

  const onLost = (e: Event) => {
    e.preventDefault();
    root.classList.remove('is-3d'); // fall back to the CSS coin
    ready = false;
  };
  canvas.addEventListener('webglcontextlost', onLost);

  return () => {
    gsap.ticker.remove(tick);
    ro.disconnect();
    io.disconnect();
    canvas.removeEventListener('webglcontextlost', onLost);
    root.classList.remove('is-3d');
    textures.forEach((t) => t.dispose());
    [bump, ringMap, envTex].forEach((t) => t?.dispose());
    [rimGeo, faceGeo].forEach((g) => g.dispose());
    [rimMat, frontMat, backMat].forEach((m) => m.dispose());
    pmrem.dispose();
    renderer.dispose();
    wrap.remove();
  };
}
