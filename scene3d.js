import * as THREE from './vendor/three.module.js';
import {createSolutionMiniature} from './solution-miniatures3d.js?v=20260913-d2c1';

/**
 * Ziewise — small, self-contained, procedural WebGL product illustrations.
 * No remote textures, models, telemetry, or live-data assumptions.
 * mountScene(host, { kind, onReady }) -> { setKind, setPaused, dispose }
 */
export function mountScene(element, { kind = 'core', onReady, modelFactory = null, onPhase } = {}) {
  if (!element) return { setKind() {}, setProcess() {}, setPhase() {}, playSteps() {}, setPaused() {}, dispose() {} };
  const sceneBackground = getComputedStyle(element).getPropertyValue('--scene-background').trim() || '#131a21';

  const labels = {
    core: 'Connected intelligence: precision rack servers, edge computing hardware and physical network connections',
    vision: 'Machine vision: products passing through a camera inspection station',
    energy: 'Renewable energy: wind and solar generation connected to storage',
    commerce: 'M-Pulse D2C Commerce AI: a brand storefront, customer behaviour signals, personalised recommendations and campaigns',
    office: 'Document intelligence: a professional document scanner and a verification workstation',
    print: 'Secure printing: a protected printer releasing verified documents',
    observer: 'Network observability: connected infrastructure and moving signal paths',
  };
  let currentKind = labels[kind] ? kind : 'core';
  let processFactory = modelFactory, processModel = null, fixedPhase = null, phaseStart = 0, lastPhase = -1;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  } catch (error) {
    const fallback = document.createElement('div');
    fallback.className = 'webgl-fallback';
    fallback.setAttribute('role', 'img');
    fallback.style.cssText = `display:grid;place-content:center;text-align:center;gap:12px;width:100%;height:100%;min-height:220px;padding:32px;box-sizing:border-box;color:inherit;background:${sceneBackground};font:14px/1.6 system-ui,sans-serif;`;
    const title = document.createElement('strong');
    title.textContent = 'ZIEWISE · CONNECTED INTELLIGENCE';
    title.style.cssText = 'font-size:11px;letter-spacing:.14em;color:inherit';
    const detail = document.createElement('span');
    detail.textContent = labels[currentKind];
    const note = document.createElement('small');
    note.textContent = 'The 3D preview is unavailable on this device.';
    fallback.append(title, detail, note);
    element.appendChild(fallback);
    onReady?.({ webgl: false, kind: currentKind });
    return {
      setKind(next) { currentKind = labels[next] ? next : 'core'; detail.textContent = labels[currentKind]; },
      setProcess() { onPhase?.(0); },
      setPhase(phase) { onPhase?.(Math.max(0, Math.min(3, Number(phase) || 0))); },
      playSteps() { onPhase?.(0); },
      setPaused() {},
      dispose() { fallback.remove(); },
    };
  }

  const canvas = renderer.domElement;
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;outline-offset:-5px;';
  canvas.className = 'ziewise-webgl';
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  element.appendChild(canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(sceneBackground);
  scene.fog = new THREE.Fog(sceneBackground, 17, 29);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  const target = new THREE.Vector3(0, 1.05, 0);
  const orbit = { azimuth: 0.77, elevation: 0.44, distance: 11.4 };
  const desiredOrbit = { ...orbit };
  let scrollProgress = 0;
  let aspect = 1;
  let root;
  let animations = [];
  let elapsed = 0;
  let previousTime = 0;
  let frame = 0;
  let disposed = false;
  let graphicsLost = false;
  let userPaused = false;
  let intersecting = true;
  let pageVisible = !document.hidden;
  let readySent = false;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = media.matches;
  let manualMotionOverride = false;
  let dragging = false;
  let dragPointer = null;
  let orbitResumeAt = 0;
  const orbitSpeed = Math.PI * 2 / 60;
  const fitBounds = { radius: 0, minY: 0, maxY: 0 };
  const motionReduced = () => reducedMotion && !manualMotionOverride;

  // An HDR-style softbox environment is generated locally, so polished metal
  // reflects a real studio arrangement without downloading environment assets.
  const studio = new THREE.Scene();
  studio.background = new THREE.Color('#39444d');
  const studioObjects = [];
  function reflector(w, h, position, intensity) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(intensity).multiplyScalar(2.2), side: THREE.DoubleSide }));
    panel.position.set(...position);
    panel.lookAt(0, 0, 0);
    studio.add(panel);
    studioObjects.push(panel);
  }
  reflector(7, 9, [-4, 6, 3], '#ffffff');
  reflector(1.4, 8, [5, 3, 2], '#d2e0e9');
  reflector(8, 1.8, [1, 4, -6], '#b9cbd7');
  reflector(4, 2, [-1, 1, 7], '#545e66');
  let environment;
  function rebuildEnvironment() {
    // Render-target textures do not survive WebGL context restoration. Keep the
    // tiny source studio until disposal and rebuild its PMREM when needed.
    const generator = new THREE.PMREMGenerator(renderer);
    const nextEnvironment = generator.fromScene(studio, 0.035);
    generator.dispose();
    environment?.dispose();
    environment = nextEnvironment;
    scene.environment = environment.texture;
  }
  rebuildEnvironment();
  scene.environmentIntensity = 1.2;

  const hemisphere = new THREE.HemisphereLight('#dce6ed', '#13171b', 0.95);
  scene.add(hemisphere);
  const key = new THREE.DirectionalLight('#fffaf1', 4.4);
  key.position.set(-3.5, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 20;
  key.shadow.normalBias = 0.02;
  key.shadow.bias = -0.0003;
  key.shadow.radius = 5;
  key.shadow.blurSamples = 8;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#bbd9eb', 3.2);
  rim.position.set(5, 5, -4);
  scene.add(rim);
  const fill = new THREE.DirectionalLight('#e8edf0', 1.1);
  fill.position.set(1, 2, 6);
  scene.add(fill);
  const sideFill = new THREE.DirectionalLight('#d9e1e5', 2.2);
  sideFill.position.set(5, 3, 4);
  scene.add(sideFill);

  const sharedTextures = new Set();
  function surfaceTexture(kind) {
    const surface = document.createElement('canvas');
    surface.width = surface.height = 512;
    const ctx = surface.getContext('2d');
    ctx.fillStyle = kind === 'mesh' ? '#68717a' : kind === 'rubber' ? '#999999' : '#c7c7c7';
    ctx.fillRect(0, 0, 512, 512);
    if (kind === 'mesh') {
      for (let y = 7; y < 512; y += 14) for (let x = 7; x < 512; x += 14) {
        ctx.beginPath(); ctx.arc(x + (y % 28 ? 0 : 7), y, 4.8, 0, Math.PI * 2);
        ctx.fillStyle = '#080b0e'; ctx.fill();
      }
    } else {
      const pixels = ctx.getImageData(0, 0, 512, 512);
      for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
        const offset = (y * 512 + x) * 4;
        const grain = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        const n = ((grain - Math.floor(grain)) - 0.5) * (kind === 'rubber' ? 20 : 7);
        const line = kind === 'rubber' ? 0 : Math.sin(y * 2.3) * 7;
        for (let c = 0; c < 3; c++) pixels.data[offset + c] += n + line;
      }
      ctx.putImageData(pixels, 0, 0);
    }
    const texture = new THREE.CanvasTexture(surface);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    sharedTextures.add(texture);
    return texture;
  }
  const brushed = surfaceTexture('metal');
  const perforated = surfaceTexture('mesh');
  const rubber = surfaceTexture('rubber');
  const mats = {
    platform: new THREE.MeshStandardMaterial({ color: '#20282f', roughness: 0.5, metalness: 0.45 }),
    white: new THREE.MeshStandardMaterial({ color: '#aeb8be', roughness: 0.4, metalness: 0.65, map: brushed }),
    porcelain: new THREE.MeshStandardMaterial({ color: '#a5acac', roughness: 0.42, metalness: 0.12 }),
    navy: new THREE.MeshStandardMaterial({ color: '#39444c', roughness: 0.35, metalness: 0.68, map: brushed }),
    ink: new THREE.MeshStandardMaterial({ color: '#101417', roughness: 0.58, metalness: 0.12, map: rubber }),
    slate: new THREE.MeshStandardMaterial({ color: '#737f87', roughness: 0.4, metalness: 0.8, map: brushed }),
    chrome: new THREE.MeshStandardMaterial({ color: '#b9c3c9', roughness: 0.22, metalness: 0.97, map: brushed }),
    blue: new THREE.MeshStandardMaterial({ color: '#224455', roughness: 0.28, metalness: 0.6 }),
    electric: new THREE.MeshStandardMaterial({ color: '#c5f4f4', emissive: '#7dc4c8', emissiveIntensity: 0.5, roughness: 0.32, metalness: 0.1 }),
    line: new THREE.MeshStandardMaterial({ color: '#354148', roughness: 0.55, metalness: 0.2 }),
    green: new THREE.MeshStandardMaterial({ color: '#7ba99a', emissive: '#548377', emissiveIntensity: 0.3, roughness: 0.33, metalness: 0.25 }),
    paper: new THREE.MeshStandardMaterial({ color: '#d5d5cd', roughness: 0.8, metalness: 0 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#17272e', roughness: 0.12, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.09, transparent: true, opacity: 0.77, depthWrite: false, side: THREE.DoubleSide }),
    beam: new THREE.MeshBasicMaterial({ color: '#8bd8d9', transparent: true, opacity: 0.032, depthWrite: false, side: THREE.DoubleSide }),
    mesh: new THREE.MeshStandardMaterial({ color: '#7d8990', map: perforated, roughness: 0.5, metalness: 0.75 }),
    leather: new THREE.MeshStandardMaterial({ color: '#14191b', map: rubber, roughness: 0.8, metalness: 0 }),
    photovoltaic: new THREE.MeshPhysicalMaterial({ color: '#14222e', metalness: 0.65, roughness: 0.21, clearcoat: 0.9 }),
  };
  const sharedMaterials = new Set(Object.values(mats));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#090d12', roughness: 0.84, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.075;
  floor.receiveShadow = false;
  scene.add(floor);

  function roundedGeometry(w, h, d, radius = 0.07) {
    const r = Math.min(radius, w / 2.1, h / 2.1, d / 2.1);
    const x = -w / 2 + r;
    const y = -h / 2 + r;
    const sx = w - r * 2;
    const sy = h - r * 2;
    const shape = new THREE.Shape();
    shape.moveTo(x, y - r);
    shape.lineTo(x + sx, y - r);
    shape.quadraticCurveTo(x + sx + r, y - r, x + sx + r, y);
    shape.lineTo(x + sx + r, y + sy);
    shape.quadraticCurveTo(x + sx + r, y + sy + r, x + sx, y + sy + r);
    shape.lineTo(x, y + sy + r);
    shape.quadraticCurveTo(x - r, y + sy + r, x - r, y + sy);
    shape.lineTo(x - r, y);
    shape.quadraticCurveTo(x - r, y - r, x, y - r);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: d - 2 * r, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: r * 0.46, bevelThickness: r, curveSegments: 4 });
    geometry.translate(0, 0, -d / 2 + r);
    return geometry;
  }

  function box(parent, w, h, d, position, material = mats.white, radius = 0.012) {
    const object = new THREE.Mesh(radius > 0 ? roundedGeometry(w, h, d, radius) : new THREE.BoxGeometry(w, h, d), material);
    object.position.set(...position);
    object.castShadow = material !== mats.glass && material !== mats.beam;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  function sphere(parent, radius, position, material = mats.chrome) {
    const object = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), material);
    object.position.set(...position);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  function cylinder(parent, radius, length, position, material = mats.chrome, topRadius = radius) {
    const object = new THREE.Mesh(new THREE.CylinderGeometry(topRadius, radius, length, 24), material);
    object.position.set(...position);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  function rod(parent, start, end, radius = 0.035, material = mats.chrome) {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const object = cylinder(parent, radius, a.distanceTo(b), a.clone().add(b).multiplyScalar(0.5).toArray(), material);
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
    return object;
  }

  function ring(parent, radius, tube, position, material = mats.chrome, rotation = [-Math.PI / 2, 0, 0]) {
    const object = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 64), material);
    object.position.set(...position);
    object.rotation.set(...rotation);
    object.castShadow = true;
    parent.add(object);
    return object;
  }

  function path(parent, points, { radius = 0.023, color = mats.line, speed = 0.11, phase = 0, pulse = true } = {}) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'centripetal');
    const object = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, radius, 6, false), color);
    parent.add(object);
    if (pulse) {
      const dot = sphere(parent, radius * 2.35, points[0], mats.electric);
      animations.push(t => dot.position.copy(curve.getPointAt((t * speed + phase) % 1)));
    }
    return object;
  }

  function platform(parent, w = 6.5, d = 4.5) {
    // Objects stand directly on the studio floor. A subtle contact shadow anchors
    // the equipment, without a miniature display-board or decorative platform.
    const surface = document.createElement('canvas');
    surface.width = surface.height = 128;
    const ctx = surface.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 5, 64, 64, 62);
    gradient.addColorStop(0, 'rgba(0,0,0,.55)');
    gradient.addColorStop(0.55, 'rgba(0,0,0,.25)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(surface);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.1, d * 1.2), new THREE.MeshBasicMaterial({map: texture, transparent: true, depthWrite: false}));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.07;
    shadow.userData.excludeFromFit = true;
    parent.add(shadow);
  }

  function led(parent, position, w = 0.13, material = mats.electric) {
    return box(parent, w, 0.032, 0.027, position, material, 0.008);
  }

  function vent(parent, position, count = 5, spacing = 0.09, length = 0.3) {
    for (let i = 0; i < count; i++) box(parent, 0.025, length, 0.012, [position[0] + (i - (count - 1) / 2) * spacing, position[1], position[2]], mats.ink, 0.005);
  }

  function checkmark(parent, position, scale = 1, material = mats.electric) {
    const mark = new THREE.Group();
    mark.position.set(...position);
    mark.scale.setScalar(scale);
    rod(mark, [-0.14, 0.01, 0], [-0.025, -0.1, 0], 0.027, material);
    rod(mark, [-0.025, -0.1, 0], [0.21, 0.16, 0], 0.027, material);
    parent.add(mark);
    return mark;
  }

  function chip(parent, position, size = 0.62) {
    const group = new THREE.Group();
    group.position.set(...position);
    parent.add(group);
    box(group, size, 0.16, size, [0, 0, 0], mats.navy, 0.06);
    box(group, size * 0.68, 0.035, size * 0.68, [0, 0.095, 0], mats.blue, 0.035);
    for (let i = 0; i < 5; i++) {
      const q = (i - 2) * size * 0.15;
      box(group, 0.035, 0.04, 0.14, [q, -0.01, size / 2 + 0.025], mats.chrome, 0.01);
      box(group, 0.035, 0.04, 0.14, [q, -0.01, -size / 2 - 0.025], mats.chrome, 0.01);
      box(group, 0.14, 0.04, 0.035, [size / 2 + 0.025, -0.01, q], mats.chrome, 0.01);
      box(group, 0.14, 0.04, 0.035, [-size / 2 - 0.025, -0.01, q], mats.chrome, 0.01);
    }
    return group;
  }

  function label(parent, text, position, w = 0.8, h = 0.12, color = '#b7c7cd', background = null) {
    const canvas = document.createElement('canvas');
    canvas.width = 768; canvas.height = Math.max(48, Math.round(768 * h / w));
    const ctx = canvas.getContext('2d');
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    ctx.fillStyle = color; ctx.font = `500 ${canvas.height * 0.57}px Arial, sans-serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 12, canvas.height / 2, canvas.width - 24);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map: texture, transparent: true, depthWrite: false, toneMapped: false}));
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }

  function screw(parent, position, size = 0.025) {
    const object = new THREE.Mesh(new THREE.CylinderGeometry(size, size, 0.012, 10), mats.chrome);
    object.rotation.x = Math.PI / 2;
    object.position.set(...position);
    parent.add(object);
    box(parent, size * 0.95, size * 0.17, 0.013, [position[0], position[1], position[2] + 0.006], mats.ink, 0);
    return object;
  }

  function grille(parent, w, h, position) {
    box(parent, w + 0.035, h + 0.035, 0.022, position, mats.ink, 0.007);
    return box(parent, w, h, 0.009, [position[0], position[1], position[2] + 0.016], mats.mesh, 0.001);
  }

  function socket(parent, position, size = 0.12) {
    box(parent, size * 1.3, size, 0.018, position, mats.chrome, 0.006);
    box(parent, size * 1.04, size * 0.72, 0.022, [position[0], position[1], position[2] + 0.012], mats.ink, 0.003);
    led(parent, [position[0] - size * 0.37, position[1] + size * 0.32, position[2] + 0.026], 0.018, mats.green);
  }

  function rackUnit(parent, y, w = 3.45, d = 2.2, index = 0, h = 0.42) {
    const group = new THREE.Group(); group.position.y = y; parent.add(group);
    box(group, w, h, d, [0, 0, 0], mats.navy, 0.012);
    box(group, w - 0.02, h - 0.025, 0.04, [0, 0, d / 2 + 0.018], mats.slate, 0.008);
    grille(group, w * 0.39, h * 0.62, [-w * 0.13, 0, d / 2 + 0.045]);
    for (let j = 0; j < 2; j++) {
      const x = w * 0.25 + j * w * 0.135;
      box(group, w * 0.11, h * 0.61, 0.025, [x, 0, d / 2 + 0.052], mats.ink, 0.005);
      box(group, w * 0.1, h * 0.13, 0.024, [x, -h * 0.19, d / 2 + 0.068], mats.slate, 0.003);
      led(group, [x - w * 0.029, h * 0.17, d / 2 + 0.069], 0.032, j ? mats.green : mats.electric);
    }
    for (const x of [-w / 2 + 0.10, w / 2 - 0.10]) {
      rod(group, [x, -h * 0.29, d / 2 + 0.14], [x, h * 0.29, d / 2 + 0.14], 0.025, mats.chrome);
      for (const yy of [-h * 0.29, h * 0.29]) rod(group, [x, yy, d / 2 + 0.04], [x, yy, d / 2 + 0.14], 0.025, mats.chrome);
    }
    label(group, `ZIEWISE  /  ${String(index + 1).padStart(2, '0')}`, [-w * 0.30, h * 0.29, d / 2 + 0.074], 0.54, 0.044);
    screw(group, [-w / 2 + 0.03, 0, d / 2 + 0.073], 0.018);
    screw(group, [w / 2 - 0.03, 0, d / 2 + 0.073], 0.018);
    return group;
  }

  function screen(parent, position, w = 2.2, h = 1.35, title = 'SYSTEM OVERVIEW', chart = true) {
    const group = new THREE.Group(); group.position.set(...position); parent.add(group);
    box(group, w + 0.10, h + 0.1, 0.065, [0, 0, 0], mats.navy, 0.028);
    const surface = document.createElement('canvas'); surface.width = 1024; surface.height = 640;
    const ctx = surface.getContext('2d');
    ctx.fillStyle = '#0d161c'; ctx.fillRect(0, 0, 1024, 640);
    ctx.fillStyle = '#d3dfe5'; ctx.font = '500 27px Arial'; ctx.fillText(title, 40, 63);
    ctx.fillStyle = '#8ab4b7'; ctx.font = '16px monospace'; ctx.fillText('ZIEWISE   /   CONNECTED INTELLIGENCE', 40, 99);
    ctx.strokeStyle = '#25343d'; ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(40, 165 + i * 73); ctx.lineTo(984, 165 + i * 73); ctx.stroke(); }
    if (chart) {
      ctx.strokeStyle = '#9ed9dc'; ctx.lineWidth = 4; ctx.beginPath();
      for (let i = 0; i < 60; i++) { const x = 40 + i * 16; const y = 350 - Math.sin(i * 0.21) * 57 - Math.sin(i * 1.3) * 20 - i * 1.1; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      ctx.font = '500 47px Arial'; ctx.fillStyle = '#d3dfe5'; ctx.fillText('99.9%', 45, 550); ctx.fillText('ACTIVE', 408, 550); ctx.fillText('45 ms', 763, 550);
      ctx.fillStyle = '#8da1ad'; ctx.font = '19px Arial'; ctx.fillText('AVAILABILITY', 46, 588); ctx.fillText('SYSTEM STATUS', 409, 588); ctx.fillText('EDGE RESPONSE', 764, 588);
    } else if (title.includes('COMMERCE')) {
      ctx.fillStyle='#d3dfe5';ctx.font='36px Arial';ctx.fillText('BRAND STORE / D2C',40,195);
      for(let i=0;i<3;i++){const x=40+i*320;ctx.fillStyle='#203944';ctx.fillRect(x,240,288,265);ctx.fillStyle='#a6bfc8';ctx.fillRect(x+82,292,124,155);ctx.fillStyle='#75a5ae';ctx.fillRect(x,532,288,40);}
    } else {
      ctx.fillStyle = '#263a45'; ctx.fillRect(56, 146, 283, 394);
      ctx.fillStyle = '#b5c2c5'; ctx.fillRect(86, 168, 217, 345);
      ctx.fillStyle = '#586970'; for (let i = 0; i < 9; i++) ctx.fillRect(104, 200 + i * 27, i % 3 === 0 ? 153 : 173, 5);
      ctx.fillStyle = '#cbdce0'; ctx.font = '36px Arial'; ctx.fillText('DOCUMENT VERIFIED', 398, 218);
      ctx.fillStyle = '#9cbbb7'; ctx.font = '22px Arial'; ctx.fillText('Identity · integrity · access', 400, 261);
      ctx.fillStyle = '#536a76'; for (let i = 0; i < 5; i++) ctx.fillRect(400, 309 + i * 42, 500 - (i % 2) * 120, 9);
      ctx.fillStyle = '#74a69b'; ctx.fillRect(400, 552, 156, 5);
    }
    const texture = new THREE.CanvasTexture(surface); texture.colorSpace = THREE.SRGBColorSpace;
    const display = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map: texture, toneMapped: false}));
    display.position.z = 0.036; group.add(display);
    return group;
  }

  function coreScene(parent) {
    platform(parent, 6, 4.2);
    const cabinet = new THREE.Group(); cabinet.position.set(-0.23, 0, -0.15); parent.add(cabinet);
    // Four commercial rack servers with continuous chassis, rack ears and latches.
    // Nothing floats: load-bearing sidewalls, rails and feet explain the assembly.
    for (const x of [-1.93, 1.93]) {
      box(cabinet, 0.095, 2.60, 2.65, [x, 1.3, -0.1], mats.navy, 0.016);
      box(cabinet, 0.12, 2.41, 0.08, [x - Math.sign(x) * 0.11, 1.30, 1.25], mats.chrome, 0.006);
      for (const y of [0.20, 2.39]) screw(cabinet, [x, y, 1.24], 0.035);
      for (const z of [-1.09, 1.04]) cylinder(cabinet, 0.105, 0.12, [x * 0.94, 0.015, z], mats.ink);
    }
    box(cabinet, 3.95, 0.09, 2.64, [0, 2.58, -0.10], mats.navy, 0.016);
    box(cabinet, 3.95, 0.10, 2.64, [0, 0.10, -0.10], mats.ink, 0.008);
    const side = new THREE.Group(); side.position.set(1.988, 1.36, -0.13); side.rotation.y = Math.PI / 2; cabinet.add(side);
    box(side, 2.16, 1.95, 0.012, [0, 0, 0], mats.navy, 0.005);
    grille(side, 1.61, 0.65, [0, -0.25, 0.012]);
    for (const x of [-1.0, 1.0]) for (const y of [-0.88, 0.88]) screw(side, [x, y, 0.025], 0.022);
    label(side, 'PRECISION COMPUTE  /  ZIEWISE', [0, 0.65, 0.026], 1.43, 0.061, '#8b9ca7');
    for (let i = 0; i < 4; i++) rackUnit(cabinet, 0.46 + i * 0.50, 3.56, 2.27, i, 0.43);
    // A genuine network appliance occupies the top half-rack unit.
    box(cabinet, 3.56, 0.34, 2.27, [0, 2.29, 0], mats.slate, 0.009);
    for (let i = 0; i < 10; i++) socket(cabinet, [-1.2 + i * 0.21, 2.29, 1.145], 0.105);
    label(cabinet, 'EDGE  /  10 GbE', [1.06, 2.29, 1.18], 0.66, 0.07);
    const topVent = grille(cabinet, 2.55, 1.47, [0, 0, 0]);
    topVent.rotation.x = -Math.PI / 2; topVent.position.set(0, 2.631, -0.15);
    // Remove the grille backing from its helper's default location by keeping
    // the top surface itself at the correct height; the chassis stays opaque.
    label(cabinet, 'ZIEWISE', [-0.90, 2.50, 1.255], 1.14, 0.075, '#d2dbdf');
    // Fanless edge gateway, milled cooling fins, antenna sockets and patch leads.
    const edge = new THREE.Group(); edge.position.set(2.08, 0.20, 0.83); edge.rotation.y = -0.16; parent.add(edge);
    box(edge, 1.01, 0.38, 1.00, [0, 0, 0], mats.slate, 0.02);
    for (let i = 0; i < 12; i++) box(edge, 0.024, 0.14, 0.9, [-0.43 + i * 0.078, 0.25, 0], mats.chrome, 0.003);
    box(edge, 0.96, 0.32, 0.025, [0, 0, 0.51], mats.navy, 0.007);
    for (let i = 0; i < 3; i++) socket(edge, [-0.24 + i * 0.22, -0.015, 0.53], 0.13);
    label(edge, 'EDGE COMPUTE', [0, 0.12, 0.546], 0.64, 0.053);
    for (const x of [-0.44, 0.44]) screw(edge, [x, 0, 0.548], 0.025);
    path(parent, [[1.6, 2.24, -1.2], [2.25, 1.55, -1.62], [2.58, 0.17, -1.05], [2.44, 0.10, 0.11], [2.10, 0.17, 0.45]], {radius: 0.045, pulse: false, color: mats.ink});
    path(parent, [[-0.57, 2.29, 1.02], [-0.67, 2.15, 1.64], [0.72, 2.03, 1.70], [0.94, 2.29, 1.04]], {radius: 0.021, pulse: false, color: mats.slate});
    animations.push(t => { mats.electric.emissiveIntensity = 0.46 + Math.sin(t * 1.5) * 0.055; });
  }

  function cameraUnit(parent, position, angle = 0) {
    const group = new THREE.Group(); group.position.set(...position); group.rotation.y = angle; parent.add(group);
    box(group, 0.37, 0.37, 0.51, [0, 0, 0], mats.slate, 0.012);
    for (let i = 0; i < 7; i++) box(group, 0.41, 0.012, 0.035, [0, 0.19, -0.21 + i * 0.065], mats.chrome, 0.002);
    box(group, 0.38, 0.38, 0.036, [0, 0, 0.26], mats.navy, 0.007);
    for (const [radius, length, z, material] of [[0.145, 0.20, 0.37, mats.ink], [0.16, 0.036, 0.45, mats.chrome], [0.125, 0.028, 0.478, mats.ink], [0.105, 0.017, 0.495, mats.glass]]) {
      const component = cylinder(group, radius, length, [0, 0, z], material); component.rotation.x = Math.PI / 2;
    }
    for (const x of [-0.15, 0.15]) for (const y of [-0.15, 0.15]) screw(group, [x, y, 0.285], 0.014);
    label(group, 'VISION / 01', [0, 0.105, 0.29], 0.23, 0.04);
    return group;
  }

  function extrusion(parent, h, position, width = 0.105) {
    box(parent, width, h, width, position, mats.chrome, 0.006);
    box(parent, width * 0.24, h - 0.025, 0.007, [position[0], position[1], position[2] + width / 2 + 0.003], mats.ink, 0.001);
  }

  function visionScene(parent) {
    platform(parent, 6.7, 4.1);
    // A machine-vision conveyor with steel sideframes, bearings and rubber belt.
    box(parent, 5.35, 0.29, 1.27, [0, 0.84, 0], mats.navy, 0.04);
    box(parent, 5.18, 0.025, 1.14, [0, 1.004, 0], mats.ink, 0.008);
    for (const z of [-0.68, 0.68]) {
      box(parent, 5.45, 0.16, 0.065, [0, 0.97, z], mats.chrome, 0.008);
      for (const x of [-2.30, 2.30]) {
        extrusion(parent, 0.83, [x, 0.41, z]);
        box(parent, 0.23, 0.055, 0.23, [x, 0.01, z], mats.ink, 0.01);
        screw(parent, [x, 0.94, z + 0.05], 0.036);
      }
    }
    for (const x of [-2.55, 2.55]) {
      const roller = cylinder(parent, 0.13, 1.35, [x, 0.855, 0], mats.chrome); roller.rotation.x = Math.PI / 2;
    }
    for (let i = 0; i < 24; i++) box(parent, 0.009, 0.006, 1.13, [-2.45 + i * 0.215, 1.023, 0], mats.line, 0);
    for (const z of [-0.91, 0.91]) {
      extrusion(parent, 2.29, [0.35, 1.13, z], 0.15);
      box(parent, 0.42, 0.075, 0.37, [0.35, 0.006, z], mats.navy, 0.01);
      screw(parent, [0.35, 1.95, z + 0.086], 0.032);
    }
    box(parent, 0.16, 0.15, 2.01, [0.35, 2.30, 0], mats.chrome, 0.006);
    const overhead = cameraUnit(parent, [0.35, 2.06, 0]); overhead.rotation.x = Math.PI / 2;
    for (const z of [-0.55, 0.55]) {
      box(parent, 0.60, 0.085, 0.16, [0.35, 1.98, z], mats.ink, 0.008);
      box(parent, 0.51, 0.013, 0.10, [0.35, 1.932, z], mats.electric, 0.003);
    }
    path(parent, [[0.35, 2.07, -0.23], [0.35, 2.38, -0.47], [0.35, 2.39, -0.92], [0.36, 0.21, -0.98], [1.94, 0.07, -1.3]], {radius: 0.021, pulse: false, color: mats.ink});
    // Machined enclosures move beneath the inspection lens at conveyor speed.
    const parts = [];
    for (let i = 0; i < 3; i++) {
      const part = new THREE.Group(); part.position.set(-2.15 + i * 1.68, 1.075, 0); part.userData.moving = true; parent.add(part);
      box(part, 0.58, 0.23, 0.68, [0, 0.115, 0], mats.slate, 0.025);
      box(part, 0.55, 0.031, 0.65, [0, 0.245, 0], mats.chrome, 0.012);
      for (let j = 0; j < 5; j++) box(part, 0.018, 0.018, 0.46, [-0.18 + j * 0.09, 0.27, 0], mats.navy, 0.002);
      label(part, `QC / ${String(i + 1).padStart(4, '0')}`, [0, 0.13, 0.349], 0.43, 0.07, '#b9c9ce');
      parts.push(part);
    }
    extrusion(parent, 1.19, [2.23, 0.59, -1.25], 0.10);
    box(parent, 0.64, 0.06, 0.53, [2.23, 0, -1.25], mats.navy, 0.02);
    const monitor = screen(parent, [2.20, 1.61, -1.24], 1.07, 0.67, 'VISION INSPECTION'); monitor.rotation.y = -0.22;
    label(parent, 'MACHINE VISION  /  EDGE INSPECTION', [-0.7, 0.96, 0.717], 2.13, 0.058);
    animations.push(t => { parts.forEach((part, i) => { part.position.x = ((t * 0.28 + i * 1.68) % 5.04) - 2.52; }); });
  }

  function energyScene(parent) {
    platform(parent, 6.7, 5.0);
    // Small-site hybrid generation, represented by actual equipment housings.
    const turbine = new THREE.Group(); turbine.position.set(-1.85, 0, -1.09); parent.add(turbine);
    cylinder(turbine, 0.24, 0.07, [0, 0, 0], mats.slate);
    cylinder(turbine, 0.078, 2.58, [0, 1.31, 0], mats.porcelain, 0.045);
    box(turbine, 0.24, 0.23, 0.58, [0, 2.65, -0.11], mats.porcelain, 0.06);
    const rotor = new THREE.Group(); rotor.position.set(0, 2.64, 0.24); rotor.userData.moving = true; turbine.add(rotor);
    const hub = cylinder(rotor, 0.105, 0.22, [0, 0, 0.035], mats.chrome, 0.06); hub.rotation.x = Math.PI / 2;
    for (let i = 0; i < 3; i++) {
      const arm = new THREE.Group(); arm.rotation.z = i * Math.PI * 2 / 3; rotor.add(arm);
      const shape = new THREE.Shape(); shape.moveTo(-0.022, 0.05); shape.bezierCurveTo(-0.07, 0.21, -0.035, 0.76, 0.065, 1.04); shape.lineTo(0.095, 1.08); shape.bezierCurveTo(0.11, 0.81, 0.12, 0.36, 0.055, 0.15); shape.closePath();
      const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {depth: 0.017, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.005, bevelSegments: 2, steps: 1, curveSegments: 8}), mats.porcelain); arm.add(blade);
    }
    for (let j = 0; j < 3; j++) {
      const module = new THREE.Group(); module.position.set(-1.84 + j * 1.05, 0.53, 0.79); module.rotation.x = 0.37; parent.add(module);
      box(module, 1.0, 0.057, 1.60, [0, 0, 0], mats.chrome, 0.009);
      box(module, 0.943, 0.020, 1.544, [0, 0.042, 0], mats.ink, 0.003);
      for (let x = 0; x < 4; x++) for (let z = 0; z < 6; z++) {
        box(module, 0.218, 0.007, 0.238, [-0.348 + x * 0.232, 0.057, -0.638 + z * 0.255], mats.photovoltaic, 0.011);
      }
      for (let x = 0; x < 8; x++) box(module, 0.003, 0.007, 1.49, [-0.405 + x * 0.115, 0.065, 0], mats.slate, 0);
      for (const x of [-0.36, 0.36]) {
        extrusion(parent, 0.74, [-1.84 + j * 1.05 + x, 0.34, 0.36], 0.055);
        extrusion(parent, 0.45, [-1.84 + j * 1.05 + x, 0.2, 1.30], 0.055);
        rod(parent, [-1.84 + j * 1.05 + x, 0.72, 0.35], [-1.84 + j * 1.05 + x, 0.06, 1.3], 0.018, mats.chrome);
      }
    }
    const cabinet = new THREE.Group(); cabinet.position.set(1.82, 0, -0.49); parent.add(cabinet);
    box(cabinet, 1.20, 2.13, 1.0, [0, 1.05, 0], mats.slate, 0.03);
    box(cabinet, 1.14, 2.02, 0.035, [0, 1.07, 0.515], mats.navy, 0.016);
    box(cabinet, 1.20, 0.095, 1.01, [0, 0.01, 0], mats.ink, 0.014);
    for (let i = 0; i < 5; i++) {
      box(cabinet, 0.86, 0.215, 0.04, [0, 0.43 + i * 0.263, 0.55], mats.slate, 0.01);
      led(cabinet, [-0.32, 0.43 + i * 0.263, 0.58], 0.04, mats.green);
      label(cabinet, `BATTERY MODULE  0${i + 1}`, [0.03, 0.43 + i * 0.263, 0.578], 0.55, 0.042);
    }
    label(cabinet, 'ENERGY STORAGE', [0, 1.95, 0.54], 0.79, 0.079);
    const display = screen(cabinet, [0, 1.77, 0.541], 0.61, 0.18, 'ENERGY');
    grille(cabinet, 0.81, 0.12, [0, 0.18, 0.556]);
    for (const x of [-0.52, 0.52]) screw(cabinet, [x, 1.03, 0.55], 0.027);
    path(parent, [[-1.85, 0.09, -1.1], [-1.2, 0.04, -1.63], [1.85, 0.04, -1.52], [1.85, 0.21, -0.96]], {radius: 0.026, pulse: false, color: mats.ink});
    animations.push(t => { rotor.rotation.z = -t * 0.21; });
  }

  function commerceScene(parent) {
    platform(parent, 6, 4.5);
    const commerce=createSolutionMiniature('commerce');
    commerce.root.scale.setScalar(2.8);commerce.root.userData.moving=true;parent.add(commerce.root);
    label(parent,'M-PULSE / D2C COMMERCE AI',[0,.04,1.64],2.2,.09,'#b4cdd7');
    animations.push(t=>commerce.update(t));
  }

  function documentPage(parent, position, scale = 1) {
    const page = new THREE.Group(); page.position.set(...position); page.scale.setScalar(scale); parent.add(page);
    box(page, 0.92, 1.23, 0.007, [0, 0, 0], mats.paper, 0.001);
    label(page, 'ZIEWISE', [-0.09, 0.43, 0.007], 0.52, 0.067, '#28363c');
    for (let i = 0; i < 10; i++) box(page, i % 4 === 0 ? 0.43 : 0.68, 0.009, 0.003, [i % 4 === 0 ? -0.125 : 0, 0.22 - i * 0.064, 0.007], mats.slate, 0);
    return page;
  }

  function officeScene(parent) {
    platform(parent, 6.5, 4.3);
    // A real document digitisation workstation: glass scanner, paper and monitor.
    box(parent, 5.35, 0.075, 2.62, [0, 0.79, 0], mats.navy, 0.025);
    for (const x of [-2.27, 2.27]) for (const z of [-0.95, 0.95]) box(parent, 0.065, 0.84, 0.065, [x, 0.33, z], mats.chrome, 0.008);
    const scanner = new THREE.Group(); scanner.position.set(-1.15, 0.94, 0.24); scanner.rotation.y = 0.05; parent.add(scanner);
    box(scanner, 1.70, 0.22, 1.99, [0, 0, 0], mats.slate, 0.035);
    box(scanner, 1.53, 0.027, 1.75, [0, 0.125, 0], mats.ink, 0.007);
    box(scanner, 1.31, 0.017, 1.57, [0, 0.147, 0], mats.glass, 0.004);
    const sheet = documentPage(scanner, [-0.06, 0.169, 0.07], 1.03); sheet.rotation.x = -Math.PI / 2;
    const lid = new THREE.Group(); lid.position.set(0, 0.13, -0.94); lid.rotation.x = -1.12; scanner.add(lid);
    box(lid, 1.70, 0.09, 1.96, [0, 0, 0.97], mats.navy, 0.025);
    box(lid, 1.50, 0.03, 1.70, [0, -0.061, 0.97], mats.porcelain, 0.01);
    for (const x of [-0.56, 0.56]) box(scanner, 0.14, 0.10, 0.17, [x, 0.16, -0.88], mats.chrome, 0.016);
    label(scanner, 'DOCUMENT INTELLIGENCE', [-0.13, 0.015, 1.01], 1.15, 0.065);
    led(scanner, [0.66, 0.013, 1.012], 0.049, mats.green);
    box(parent, 0.58, 0.047, 0.49, [1.45, 0.859, -0.61], mats.slate, 0.014);
    box(parent, 0.08, 0.48, 0.07, [1.45, 1.1, -0.76], mats.chrome, 0.008);
    const monitor = screen(parent, [1.45, 1.88, -0.73], 2.0, 1.26, 'DOCUMENT INTELLIGENCE', false); monitor.rotation.y = -0.12;
    box(parent, 1.39, 0.035, 0.47, [1.38, 0.852, 0.58], mats.ink, 0.009);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 12; col++) box(parent, 0.088, 0.019, 0.069, [0.78 + col * 0.103, 0.875, 0.43 + row * 0.087], mats.navy, 0.004);
    box(parent, 0.19, 0.078, 0.32, [2.34, 0.88, 0.60], mats.slate, 0.043);
    path(parent, [[1.45, 1.1, -0.81], [1.6, 0.94, -1.1], [0.2, 0.84, -1.05], [-0.55, 0.87, -0.54]], {radius: 0.022, pulse: false, color: mats.ink});
    const light = box(scanner, 1.22, 0.008, 0.027, [0, 0.158, 0], mats.electric, 0.003);
    light.userData.moving = true;
    animations.push(t => { light.position.z = Math.sin(t * 0.48) * 0.72; });
  }

  function printScene(parent) {
    platform(parent, 5.8, 4.1);
    const printer = new THREE.Group(); printer.position.set(-0.32, 0, 0); parent.add(printer);
    box(printer, 2.75, 1.57, 2.17, [0, 0.83, 0], mats.porcelain, 0.055);
    box(printer, 2.77, 0.18, 2.19, [0, 0.13, 0], mats.navy, 0.032);
    box(printer, 2.77, 0.17, 2.19, [0, 1.54, 0], mats.slate, 0.032);
    // An automatic document feeder, glass platen and separate paper drawer.
    box(printer, 2.68, 0.14, 2.07, [0, 1.72, -0.025], mats.navy, 0.036);
    box(printer, 2.40, 0.19, 1.57, [0.08, 1.89, -0.16], mats.porcelain, 0.055);
    box(printer, 1.34, 0.09, 1.12, [-0.22, 2.04, -0.12], mats.ink, 0.024);
    box(printer, 1.29, 0.045, 0.89, [-0.22, 2.065, 0.02], mats.slate, 0.01);
    for (let i = 0; i < 5; i++) box(printer, 1.10, 0.005, 0.67, [-0.22, 2.096 + i * 0.006, 0.05], mats.paper, 0.001);
    box(printer, 2.43, 0.39, 0.025, [0, 0.49, 1.101], mats.slate, 0.021);
    box(printer, 0.72, 0.087, 0.039, [0, 0.59, 1.12], mats.ink, 0.017);
    box(printer, 2.42, 0.013, 0.012, [0, 0.29, 1.12], mats.ink, 0.001);
    box(printer, 1.68, 0.28, 0.095, [-0.15, 1.16, 1.06], mats.ink, 0.018);
    box(printer, 1.76, 0.06, 0.73, [-0.15, 0.996, 1.29], mats.navy, 0.02);
    const output = new THREE.Group(); output.position.set(-0.15, 1.035, 1.20); output.userData.moving = true; printer.add(output);
    const page = documentPage(output, [0, 0, 0], 1.03); page.rotation.x = -Math.PI / 2; page.rotation.z = Math.PI;
    const control = screen(printer, [0.87, 1.50, 1.15], 0.69, 0.34, 'SECURE RELEASE', false); control.rotation.x = -0.3;
    label(printer, 'ZIEWISE', [-0.89, 1.52, 1.101], 0.52, 0.09, '#33444c');
    label(printer, 'SECURE PRINT SYSTEM', [-0.16, 0.83, 1.10], 1.11, 0.060, '#3d4c55');
    led(printer, [1.11, 0.82, 1.102], 0.066, mats.green);
    for (let i = 0; i < 12; i++) box(printer, 0.010, 0.28, 0.026, [-1.14 + i * 0.051, 0.83, 1.10], mats.ink, 0.002);
    // NFC release reader on a real desk pedestal, with a thin access card.
    const reader = new THREE.Group(); reader.position.set(1.84, 0.96, 0.40); reader.rotation.y = -0.22; parent.add(reader);
    box(reader, 0.08, 0.94, 0.08, [0, -0.49, -0.08], mats.chrome, 0.008);
    box(reader, 0.67, 0.055, 0.64, [0, -0.96, -0.04], mats.navy, 0.026);
    box(reader, 0.56, 0.76, 0.12, [0, 0, 0], mats.ink, 0.037);
    box(reader, 0.44, 0.28, 0.012, [0, 0.13, 0.067], mats.glass, 0.012);
    label(reader, 'NFC', [0, -0.16, 0.069], 0.21, 0.086, '#b7cfd1');
    led(reader, [0, -0.29, 0.071], 0.115, mats.green);
    path(parent, [[1.0, 0.19, -0.55], [1.65, 0.025, -0.7], [1.95, 0.08, 0.07], [1.86, 0.83, 0.32]], {radius: 0.022, pulse: false, color: mats.ink});
    animations.push(t => { output.position.z = 1.07 + (Math.sin(t * 0.4) * 0.5 + 0.5) * 0.35; });
  }

  function observerScene(parent) {
    platform(parent, 6.6, 4.6);
    // Three network cabinets with distinct compute, switching and storage bays.
    for (let c = 0; c < 3; c++) {
      const rack = new THREE.Group(); rack.position.set(-1.90 + c * 1.91, 0, c === 1 ? -0.13 : 0.04); parent.add(rack);
      for (const x of [-0.86, 0.86]) box(rack, 0.06, 2.99, 1.95, [x, 1.51, 0], mats.navy, 0.014);
      box(rack, 1.76, 0.065, 1.96, [0, 3.01, 0], mats.slate, 0.013);
      box(rack, 1.76, 0.12, 1.96, [0, 0.06, 0], mats.ink, 0.013);
      for (const x of [-0.76, 0.76]) box(rack, 0.032, 2.86, 0.045, [x, 1.49, 0.99], mats.chrome, 0.003);
      for (let r = 0; r < 6; r++) {
        if (c !== 1) rackUnit(rack, 0.39 + r * 0.41, 1.49, 1.75, r, 0.34);
        else {
          box(rack, 1.49, 0.335, 1.75, [0, 0.39 + r * 0.41, 0], mats.slate, 0.006);
          for (let j = 0; j < 8; j++) socket(rack, [-0.59 + j * 0.169, 0.39 + r * 0.41, 0.89], 0.087);
        }
      }
      label(rack, c === 0 ? 'COMPUTE' : c === 1 ? 'NETWORK' : 'STORAGE', [0, 2.83, 1.004], 1.13, 0.107);
      if (c !== 1) {
        box(rack, 1.48, 2.5, 0.013, [0, 1.51, 1.053], mats.glass, 0.008);
        rod(rack, [0.64, 1.18, 1.10], [0.64, 1.64, 1.10], 0.023, mats.chrome);
      } else {
        for (let r = 0; r < 3; r++) path(rack, [[-0.5, 2.44 - r * 0.41, 0.95], [-0.58, 2.20 - r * 0.41, 1.23], [0.46, 2.03 - r * 0.41, 1.25], [0.51, 2.03 - r * 0.41, 0.95]], {radius: 0.014, pulse: false, color: r === 1 ? mats.slate : mats.line});
      }
      for (const x of [-0.73, 0.73]) for (const z of [-0.77, 0.77]) cylinder(rack, 0.078, 0.11, [x, 0.0, z], mats.ink);
    }
    path(parent, [[-1.95, 0.03, -1], [-1.15, 0.015, -1.50], [1.17, 0.015, -1.50], [1.9, 0.03, -1]], {radius: 0.06, pulse: false, color: mats.ink});
    animations.push(t => { mats.green.emissiveIntensity = 0.28 + Math.sin(t * 1.2) * 0.045; });
  }

  const builders = { core: coreScene, vision: visionScene, energy: energyScene, commerce: commerceScene, office: officeScene, print: printScene, observer: observerScene };

  function optimiseStatic(group) {
    // Merge the many machined details into one static draw per shared material.
    // Moving machinery and transparent glass retain their independent objects.
    group.updateMatrixWorld(true);
    const buckets = new Map();
    group.traverse(object => {
      if (!object.isMesh || !sharedMaterials.has(object.material) || object.material.transparent) return;
      for (let ancestor = object; ancestor && ancestor !== group; ancestor = ancestor.parent) if (ancestor.userData.moving) return;
      const key = `${object.material.id}/${object.castShadow}/${object.receiveShadow}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(object);
    });
    const inverse = group.matrixWorld.clone().invert();
    for (const meshes of buckets.values()) {
      if (meshes.length < 2) continue;
      const geometries = meshes.map(object => {
        const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
        geometry.applyMatrix4(inverse.clone().multiply(object.matrixWorld));
        return geometry;
      });
      const total = geometries.reduce((sum, geometry) => sum + geometry.attributes.position.count, 0);
      const merged = new THREE.BufferGeometry();
      for (const [attribute, size] of [['position', 3], ['normal', 3], ['uv', 2]]) {
        const values = new Float32Array(total * size);
        let offset = 0;
        geometries.forEach(geometry => {
          const source = geometry.getAttribute(attribute);
          if (source) values.set(source.array, offset);
          offset += geometry.attributes.position.count * size;
        });
        merged.setAttribute(attribute, new THREE.BufferAttribute(values, size));
      }
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, meshes[0].material);
      mesh.castShadow = meshes[0].castShadow;
      mesh.receiveShadow = meshes[0].receiveShadow;
      meshes.forEach(object => { object.parent.remove(object); object.geometry.dispose(); });
      geometries.forEach(geometry => geometry.dispose());
      group.add(mesh);
    }
  }

  function releaseGroup(group) {
    if (!group) return;
    const geometries = new Set();
    const materials = new Set();
    group.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => { if (!sharedMaterials.has(material)) materials.add(material); });
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => {
      for (const key of ['map', 'bumpMap', 'roughnessMap', 'alphaMap']) {
        if (material[key] && !sharedTextures.has(material[key])) material[key].dispose();
      }
      material.dispose();
    });
    scene.remove(group);
  }

  function measureFit() {
    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3();
    const meshBounds = new THREE.Box3();
    root.traverse(object => {
      if (!object.isMesh || object.userData.excludeFromFit) return;
      object.geometry.computeBoundingBox();
      meshBounds.copy(object.geometry.boundingBox).applyMatrix4(object.matrixWorld);
      bounds.union(meshBounds);
    });
    // Leave room for the conveyor parts and turbine blades as they move.
    const margin = 0.18;
    fitBounds.radius = Math.hypot(Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x)), Math.max(Math.abs(bounds.min.z), Math.abs(bounds.max.z))) + margin;
    fitBounds.minY = bounds.min.y - target.y - margin;
    fitBounds.maxY = bounds.max.y - target.y + margin;
  }

  function fittedDistance(elevation) {
    // Fit a cylinder around the equipment for every azimuth, including its rear.
    // The existing preferred distance remains the minimum visual framing.
    const vertical = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 0.9;
    const horizontal = vertical * aspect;
    const sin = Math.sin(elevation), cos = Math.cos(elevation);
    const { radius, minY, maxY } = fitBounds;
    const horizontalFit = radius * Math.hypot(cos, 1 / horizontal) + Math.max(minY * sin, maxY * sin);
    const top = sin + cos / vertical;
    const bottom = sin - cos / vertical;
    const topFit = Math.max(minY * top, maxY * top) + radius * Math.abs(cos - sin / vertical);
    const bottomFit = Math.max(minY * bottom, maxY * bottom) + radius * Math.abs(cos + sin / vertical);
    return Math.max(horizontalFit, topFit, bottomFit);
  }

  function updateCamera(snap = false) {
    const factor = snap || motionReduced() ? 1 : 0.08;
    orbit.azimuth += (desiredOrbit.azimuth + scrollProgress * 0.48 - orbit.azimuth) * factor;
    orbit.elevation += (desiredOrbit.elevation + scrollProgress * 0.07 - orbit.elevation) * factor;
    const preferredDistance = (desiredOrbit.distance - scrollProgress * 0.65) * Math.max(1, 1.12 / aspect);
    const distance = Math.max(preferredDistance, fittedDistance(orbit.elevation));
    orbit.distance += (distance - orbit.distance) * factor;
    camera.position.set(
      Math.sin(orbit.azimuth) * Math.cos(orbit.elevation) * orbit.distance,
      Math.sin(orbit.elevation) * orbit.distance + target.y,
      Math.cos(orbit.azimuth) * Math.cos(orbit.elevation) * orbit.distance,
    );
    camera.lookAt(target);
  }

  function renderOnce() {
    if (disposed || graphicsLost) return;
    updateCamera(true);
    renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    if (!readySent) { readySent = true; onReady?.({ webgl: true, kind: currentKind }); }
  }

  function active() { return !disposed && !graphicsLost && !userPaused && !motionReduced() && intersecting && pageVisible; }
  function tick(now) {
    frame = 0;
    if (!active()) return;
    if (previousTime && now - previousTime < 32) { frame = requestAnimationFrame(tick); return; }
    const delta = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 0;
    previousTime = now;
    elapsed += delta;
    if ((currentKind !== 'core' || processModel) && !dragging && now >= orbitResumeAt) desiredOrbit.azimuth += orbitSpeed * delta;
    animations.forEach(animate => animate(elapsed));
    updateCamera(dragging);
    if (processModel || (currentKind !== 'core' && currentKind !== 'observer')) renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  }
  function syncAnimation() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    if (active()) frame = requestAnimationFrame(tick);
  }
  function setKind(next, force = false) {
    if (disposed) return;
    next = labels[next] ? next : 'core';
    if (root && next === currentKind && !force) return;
    currentKind = next;
    releaseGroup(root);
    animations = [];
    root = new THREE.Group();
    scene.add(root);
    elapsed = 0;
    mats.beam.opacity = 0.075;
    processModel = processFactory?.(THREE) || null;
    fixedPhase = null; phaseStart = 0; lastPhase = -1;
    if (processModel) {
      root.add(processModel.root);
      animations.push(time => {
        const phase = fixedPhase ?? Math.floor(time / 6) % 4;
        processModel.update({ phase, time: fixedPhase === null ? time % 6 : time - phaseStart, reducedMotion: motionReduced() });
        if (phase !== lastPhase) { lastPhase = phase; onPhase?.(phase); }
      });
      scene.fog.near = 35; scene.fog.far = 65;
    } else {
      builders[currentKind](root);
      optimiseStatic(root);
    }
    // Start with complete, legible geometry even when animation is disabled.
    animations.forEach(animate => animate(0));
    target.set(0, currentKind === 'energy' ? 1.3 : currentKind === 'observer' ? 1.18 : 1.0, 0);
    desiredOrbit.azimuth = currentKind === 'core' ? 0.55 : 0.51;
    desiredOrbit.elevation = currentKind === 'core' ? 0.28 : 0.32;
    desiredOrbit.distance = currentKind === 'core' ? 10.0 : currentKind === 'energy' ? 11.7 : currentKind === 'observer' ? 12.4 : currentKind === 'commerce' ? 9.3 : 10.9;
    if (processModel?.camera) {
      target.set(...processModel.camera.target);
      desiredOrbit.azimuth = processModel.camera.yaw;
      desiredOrbit.elevation = processModel.camera.pitch;
      desiredOrbit.distance = processModel.camera.distance;
    }
    dragging = false;
    dragPointer = null;
    orbitResumeAt = 0;
    canvas.style.cursor = 'grab';
    measureFit();
    canvas.setAttribute('aria-label', `Illustrative 3D scene. ${labels[currentKind]}. Drag with a mouse or use the arrow keys to rotate.`);
    renderOnce();
    syncAnimation();
  }
  function resize() {
    if (disposed) return;
    const width = Math.max(1, element.clientWidth);
    const height = Math.max(1, element.clientHeight);
    aspect = width / height;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderOnce();
  }

  let lastX = 0;
  let lastY = 0;
  function pointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (dragging) return;
    desiredOrbit.azimuth = orbit.azimuth - scrollProgress * 0.48;
    desiredOrbit.elevation = orbit.elevation - scrollProgress * 0.07;
    dragging = true;
    dragPointer = event.pointerId;
    orbitResumeAt = performance.now() + 3000;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
  }
  function pointerMove(event) {
    if (!dragging || event.pointerId !== dragPointer) return;
    desiredOrbit.azimuth -= (event.clientX - lastX) * 0.006;
    desiredOrbit.elevation = THREE.MathUtils.clamp(desiredOrbit.elevation + (event.clientY - lastY) * 0.004, 0.18, 0.83);
    lastX = event.clientX;
    lastY = event.clientY;
    orbitResumeAt = performance.now() + 3000;
    if (!active()) renderOnce();
  }
  function pointerUp(event) {
    if (!dragging || event.pointerId !== dragPointer) return;
    dragging = false;
    dragPointer = null;
    orbitResumeAt = performance.now() + 3000;
    canvas.style.cursor = 'grab';
  }
  function keyDown(event) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    orbitResumeAt = performance.now() + 3000;
    if (event.key === 'ArrowLeft') desiredOrbit.azimuth -= 0.12;
    if (event.key === 'ArrowRight') desiredOrbit.azimuth += 0.12;
    if (event.key === 'ArrowUp') desiredOrbit.elevation = Math.min(0.83, desiredOrbit.elevation + 0.08);
    if (event.key === 'ArrowDown') desiredOrbit.elevation = Math.max(0.18, desiredOrbit.elevation - 0.08);
    if (!active()) renderOnce();
  }
  function visibilityChange() { pageVisible = !document.hidden; syncAnimation(); }
  function motionChange(event) { reducedMotion = event.matches; manualMotionOverride = false; syncAnimation(); renderOnce(); }
  function contextLost(event) { event.preventDefault(); graphicsLost = true; syncAnimation(); canvas.setAttribute('aria-label', 'The 3D preview is paused because the graphics context was interrupted.'); }
  function contextRestored() {
    if (disposed) return;
    rebuildEnvironment();
    graphicsLost = false;
    canvas.setAttribute('aria-label', `Illustrative 3D scene. ${labels[currentKind]}. Drag with a mouse or use the arrow keys to rotate.`);
    renderOnce();
    syncAnimation();
  }
  canvas.style.cursor = 'grab';
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerUp);
  canvas.addEventListener('lostpointercapture', pointerUp);
  canvas.addEventListener('keydown', keyDown);
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);
  document.addEventListener('visibilitychange', visibilityChange);
  media.addEventListener?.('change', motionChange);
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(element);
  if (!resizeObserver) window.addEventListener('resize', resize);
  const intersectionObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => { intersecting = entries[0]?.isIntersecting ?? true; syncAnimation(); }, { rootMargin: '120px' }) : null;
  intersectionObserver?.observe(element);

  setKind(currentKind);
  resize();

  return {
    setKind,
    setProcess(factory) { processFactory = factory; setKind('core', true); },
    setPhase(phase) {
      fixedPhase = Math.max(0, Math.min(3, Number(phase) || 0)); phaseStart = elapsed;
      processModel?.update({ phase: fixedPhase, time: active() ? 0 : 3.4, reducedMotion: !active() });
      lastPhase = fixedPhase; onPhase?.(fixedPhase); renderOnce();
    },
    playSteps() { fixedPhase = null; elapsed = 0; lastPhase = -1; animations.forEach(fn => fn(0)); renderOnce(); },
    setScrollProgress(value) {
      if(disposed || userPaused || motionReduced())return;
      scrollProgress=THREE.MathUtils.clamp(Number(value)||0,-1,1);
      if(!active())renderOnce();
    },
    setPaused(value, { manual = false } = {}) { userPaused = Boolean(value); if (manual && !userPaused) manualMotionOverride = true; syncAnimation(); },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', visibilityChange);
      media.removeEventListener?.('change', motionChange);
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', pointerUp);
      canvas.removeEventListener('lostpointercapture', pointerUp);
      canvas.removeEventListener('keydown', keyDown);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      releaseGroup(root);
      Object.values(mats).forEach(material => material.dispose());
      sharedTextures.forEach(texture => texture.dispose());
      floor.geometry.dispose();
      floor.material.dispose();
      environment.dispose();
      studioObjects.forEach(object => { object.geometry.dispose(); object.material.dispose(); });
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
