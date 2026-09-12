import * as THREE from './vendor/three.module.js';

/**
 * Ziewise — small, self-contained, procedural WebGL product illustrations.
 * No remote textures, models, telemetry, or live-data assumptions.
 * mountScene(host, { kind, onReady }) -> { setKind, setPaused, dispose }
 */
export function mountScene(element, { kind = 'core', onReady } = {}) {
  if (!element) return { setKind() {}, setPaused() {}, dispose() {} };

  const labels = {
    core: 'Connected intelligence: a layered computing core linked to specialist modules',
    vision: 'Machine vision: products passing through a camera inspection station',
    energy: 'Renewable energy: wind and solar generation connected to storage',
    commerce: 'Immersive commerce: a product displayed inside a spatial shopping interface',
    office: 'Document intelligence: pages moving through a verification pipeline',
    print: 'Secure printing: a protected printer releasing verified documents',
    observer: 'Network observability: connected infrastructure and moving signal paths',
  };
  let currentKind = labels[kind] ? kind : 'core';
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  } catch (error) {
    const fallback = document.createElement('div');
    fallback.className = 'webgl-fallback';
    fallback.setAttribute('role', 'img');
    fallback.style.cssText = 'display:grid;place-content:center;text-align:center;gap:12px;width:100%;height:100%;min-height:220px;padding:32px;box-sizing:border-box;color:#30415c;background:#f2f5fa;font:14px/1.6 system-ui,sans-serif;';
    const title = document.createElement('strong');
    title.textContent = 'ZIEWISE · CONNECTED INTELLIGENCE';
    title.style.cssText = 'font-size:11px;letter-spacing:.14em;color:#2763df';
    const detail = document.createElement('span');
    detail.textContent = labels[currentKind];
    const note = document.createElement('small');
    note.textContent = 'The 3D preview is unavailable on this device.';
    fallback.append(title, detail, note);
    element.appendChild(fallback);
    onReady?.({ webgl: false, kind: currentKind });
    return {
      setKind(next) { currentKind = labels[next] ? next : 'core'; detail.textContent = labels[currentKind]; },
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
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f2f5fa');
  scene.fog = new THREE.Fog('#f2f5fa', 17, 29);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  const target = new THREE.Vector3(0, 1.05, 0);
  const orbit = { azimuth: 0.77, elevation: 0.44, distance: 11.4 };
  const desiredOrbit = { ...orbit };
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

  // A tiny procedural studio gives metal genuine reflected light, without downloads.
  const studio = new THREE.Scene();
  studio.background = new THREE.Color('#bbc5d5');
  const studioObjects = [];
  function reflector(w, h, position, intensity) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: intensity, side: THREE.DoubleSide }));
    panel.position.set(...position);
    panel.lookAt(0, 0, 0);
    studio.add(panel);
    studioObjects.push(panel);
  }
  reflector(10, 8, [0, 7, 0], '#ffffff');
  reflector(5, 7, [-6, 2, 2], '#ffffff');
  reflector(3, 8, [6, 1, -3], '#5773a5');
  reflector(5, 3, [0, 1, -7], '#eef6ff');
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, 0.025);
  scene.environment = environment.texture;
  pmrem.dispose();
  studioObjects.forEach(object => { object.geometry.dispose(); object.material.dispose(); });

  const hemisphere = new THREE.HemisphereLight('#e9f3ff', '#acb9ce', 1.5);
  scene.add(hemisphere);
  const key = new THREE.DirectionalLight('#ffffff', 3.2);
  key.position.set(-3.5, 8, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 20;
  key.shadow.normalBias = 0.035;
  key.shadow.bias = -0.0003;
  key.shadow.radius = 4;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#97b9ff', 1.4);
  rim.position.set(5, 4, -5);
  scene.add(rim);
  const fill = new THREE.DirectionalLight('#ffffff', 0.7);
  fill.position.set(-5, 2, -3);
  scene.add(fill);

  const mats = {
    white: new THREE.MeshStandardMaterial({ color: '#f3f6fa', roughness: 0.26, metalness: 0.13 }),
    porcelain: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.19, metalness: 0.16 }),
    navy: new THREE.MeshStandardMaterial({ color: '#10213a', roughness: 0.26, metalness: 0.52 }),
    ink: new THREE.MeshStandardMaterial({ color: '#081626', roughness: 0.32, metalness: 0.3 }),
    slate: new THREE.MeshStandardMaterial({ color: '#a8b7cb', roughness: 0.36, metalness: 0.5 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#d4e0ee', roughness: 0.15, metalness: 0.92 }),
    blue: new THREE.MeshStandardMaterial({ color: '#2763df', roughness: 0.27, metalness: 0.34 }),
    electric: new THREE.MeshStandardMaterial({ color: '#4887ff', emissive: '#2763df', emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.12 }),
    line: new THREE.MeshStandardMaterial({ color: '#8fa8cd', roughness: 0.45, metalness: 0.4 }),
    green: new THREE.MeshStandardMaterial({ color: '#4cafa2', roughness: 0.33, metalness: 0.25 }),
    paper: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.64, metalness: 0 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#adcaff', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.17, depthWrite: false, side: THREE.DoubleSide }),
    beam: new THREE.MeshBasicMaterial({ color: '#3a79f4', transparent: true, opacity: 0.075, depthWrite: false, side: THREE.DoubleSide }),
  };
  const sharedMaterials = new Set(Object.values(mats));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#f2f5fa', roughness: 0.85, metalness: 0 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.075;
  floor.receiveShadow = true;
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

  function box(parent, w, h, d, position, material = mats.white, radius = 0.05) {
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
    box(parent, w, 0.19, d, [0, 0.05, 0], mats.porcelain, 0.17);
    box(parent, w - 0.2, 0.085, d - 0.2, [0, -0.012, 0], mats.slate, 0.08);
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

  function coreScene(parent) {
    platform(parent, 6.55, 4.55);
    const core = new THREE.Group();
    core.position.y = 0.25;
    parent.add(core);
    // A machined frame, white ceramic lid, and four suspended compute layers.
    box(core, 2.25, 0.18, 2.25, [0, 0.13, 0], mats.navy, 0.12);
    box(core, 2.31, 0.09, 2.31, [0, 0.23, 0], mats.chrome, 0.09);
    const layers = [];
    for (let i = 0; i < 4; i++) {
      const layer = new THREE.Group();
      const y = 0.52 + i * 0.43;
      layer.position.y = y;
      core.add(layer);
      box(layer, 1.98, 0.27, 1.98, [0, 0, 0], i % 2 ? mats.navy : mats.ink, 0.1);
      box(layer, 2.02, 0.042, 2.02, [0, 0.145, 0], mats.chrome, 0.035);
      for (let j = 0; j < 6; j++) led(layer, [-0.7 + j * 0.125, -0.02, 1.009], j === 0 ? 0.09 : 0.045, j < 2 ? mats.electric : mats.slate);
      for (let j = 0; j < 5; j++) box(layer, 0.024, 0.1, 0.42, [1.005, 0.015, -0.55 + j * 0.24], mats.slate, 0.006);
      layers.push(layer);
    }
    box(core, 2.32, 0.18, 2.32, [0, 2.1, 0], mats.porcelain, 0.12);
    box(core, 1.53, 0.035, 1.53, [0, 2.207, 0], mats.navy, 0.07);
    chip(core, [0, 2.29, 0], 0.8);
    // Slender corner standoffs preserve the open, dimensional silhouette.
    for (const x of [-1.06, 1.06]) for (const z of [-1.06, 1.06]) {
      cylinder(core, 0.045, 1.85, [x, 1.15, z], mats.chrome);
      cylinder(core, 0.09, 0.07, [x, 2.219, z], mats.chrome);
    }
    // Three distinct peripheral nodes with cable routes and moving data packets.
    const nodes = [[-2.34, 0.38, 0.78], [2.32, 0.38, 0.7], [0.15, 0.35, -1.79]];
    nodes.forEach((p, i) => {
      const node = new THREE.Group();
      node.position.set(...p);
      parent.add(node);
      box(node, 0.95, 0.34, 0.91, [0, 0, 0], mats.white, 0.095);
      box(node, 0.78, 0.07, 0.74, [0, 0.21, 0], mats.navy, 0.05);
      if (i === 0) {
        const lens = cylinder(node, 0.2, 0.13, [0, 0.32, 0], mats.chrome);
        cylinder(node, 0.135, 0.14, [0, 0.35, 0], mats.blue);
        ring(node, 0.23, 0.012, [0, 0.37, 0], mats.electric);
      } else if (i === 1) {
        for (let j = 0; j < 3; j++) box(node, 0.14, 0.09 + j * 0.08, 0.38, [-0.22 + j * 0.22, 0.3 + j * 0.04, 0], j === 2 ? mats.blue : mats.chrome, 0.025);
      } else chip(node, [0, 0.31, 0], 0.4);
      led(node, [0.23, 0, 0.464], 0.13);
      const near = i === 0 ? [-1.08, 0.34, 0.78] : i === 1 ? [1.08, 0.34, 0.7] : [0.15, 0.34, -1.08];
      path(parent, [near, [(near[0] + p[0]) / 2, 0.24, (near[2] + p[2]) / 2], [p[0], 0.28, p[2]]], { radius: 0.027, speed: 0.17, phase: i / 3 });
    });
    // Topographic circuit traces remain below the object, with no decorative swarm.
    path(parent, [[-2.35, 0.161, -1.62], [-1.55, 0.161, -1.62], [-1.42, 0.161, -0.72]], { pulse: false, radius: 0.012 });
    path(parent, [[2.35, 0.161, -1.42], [1.62, 0.161, -1.42], [1.42, 0.161, -0.55]], { pulse: false, radius: 0.012 });
    for (const x of [-2.35, 2.35]) ring(parent, 0.067, 0.012, [x, 0.166, -1.52], mats.blue);
    animations.push(t => {
      core.position.y = 0.25 + Math.sin(t * 0.55) * 0.028;
      layers.forEach((layer, i) => { layer.position.y = 0.52 + i * 0.43 + Math.sin(t * 0.8 - i * 0.7) * 0.014; });
    });
  }

  function cameraUnit(parent, position, angle = 0) {
    const group = new THREE.Group();
    group.position.set(...position);
    group.rotation.y = angle;
    parent.add(group);
    box(group, 0.56, 0.4, 0.74, [0, 0, 0], mats.white, 0.065);
    box(group, 0.48, 0.31, 0.11, [0, 0, 0.37], mats.navy, 0.055);
    const barrel = cylinder(group, 0.145, 0.16, [0, 0, 0.5], mats.chrome);
    barrel.rotation.x = Math.PI / 2;
    const lens = cylinder(group, 0.107, 0.018, [0, 0, 0.59], mats.ink);
    lens.rotation.x = Math.PI / 2;
    const inner = cylinder(group, 0.064, 0.02, [0, 0, 0.603], mats.blue);
    inner.rotation.x = Math.PI / 2;
    led(group, [0.17, 0.12, 0.434], 0.055);
    return group;
  }

  function visionScene(parent) {
    platform(parent, 6.7, 4.4);
    box(parent, 5.65, 0.35, 1.65, [0, 0.63, 0], mats.chrome, 0.14);
    box(parent, 5.5, 0.07, 1.4, [0, 0.843, 0], mats.ink, 0.06);
    for (const x of [-2.2, 2.2]) for (const z of [-0.64, 0.64]) box(parent, 0.14, 0.45, 0.14, [x, 0.36, z], mats.slate, 0.03);
    for (let i = 0; i < 21; i++) box(parent, 0.023, 0.014, 1.32, [-2.5 + i * 0.25, 0.89, 0], mats.slate, 0.004);
    for (const z of [-0.83, 0.83]) box(parent, 5.55, 0.075, 0.06, [0, 0.94, z], mats.white, 0.025);
    const portal = new THREE.Group();
    portal.position.x = 0.3;
    parent.add(portal);
    for (const z of [-1.02, 1.02]) {
      box(portal, 0.3, 1.82, 0.28, [0, 1.12, z], mats.white, 0.06);
      box(portal, 0.105, 1.43, 0.025, [0, 1.18, z + (z > 0 ? -0.15 : 0.15)], mats.electric, 0.02);
    }
    box(portal, 0.45, 0.26, 2.37, [0, 2.1, 0], mats.white, 0.06);
    box(portal, 0.47, 0.12, 0.7, [0, 2.31, 0], mats.navy, 0.04);
    const beam = box(portal, 0.014, 1.2, 1.78, [0, 1.46, 0], mats.beam, 0);
    const scanning = box(portal, 0.021, 0.018, 1.7, [0, 1.5, 0], mats.electric, 0);
    cylinder(parent, 0.07, 1.64, [-1.24, 1, -1.39], mats.chrome);
    cameraUnit(parent, [-1.24, 1.96, -1.39], 0.26).rotation.x = 0.3;
    const parcels = [];
    for (let i = 0; i < 3; i++) {
      const parcel = new THREE.Group();
      parent.add(parcel);
      const height = i === 1 ? 0.68 : 0.49;
      box(parcel, 0.68, height, 0.66, [0, height / 2, 0], i === 1 ? mats.navy : mats.white, 0.055);
      box(parcel, 0.1, height + 0.01, 0.67, [0.11, height / 2 + 0.004, 0], mats.blue, 0.018);
      box(parcel, 0.26, 0.15, 0.015, [-0.13, height * 0.58, 0.338], mats.paper, 0.008);
      for (let j = 0; j < 5; j++) box(parcel, 0.009 + (j % 2) * 0.005, 0.08, 0.008, [-0.21 + j * 0.035, height * 0.58, 0.35], mats.navy, 0);
      parcel.position.set(-2.3 + i * 1.78, 0.91, 0);
      parcels.push(parcel);
    }
    box(parent, 0.09, 0.74, 0.09, [2.28, 0.63, -1.45], mats.chrome, 0.02);
    const screen = new THREE.Group();
    screen.position.set(2.28, 1.24, -1.4);
    screen.rotation.y = -0.28;
    parent.add(screen);
    box(screen, 1, 0.64, 0.1, [0, 0, 0], mats.navy, 0.055);
    checkmark(screen, [-0.21, 0.035, 0.069], 0.65, mats.green);
    for (let i = 0; i < 3; i++) box(screen, 0.32 - i * 0.035, 0.025, 0.013, [0.2, 0.12 - i * 0.1, 0.067], mats.slate, 0.005);
    animations.push(t => {
      parcels.forEach((parcel, i) => { parcel.position.x = ((t * 0.42 + i * 1.78) % 5.34) - 2.67; });
      scanning.position.y = 0.98 + (Math.sin(t * 1.5) * 0.5 + 0.5) * 0.95;
      beam.material.opacity = 0.055 + Math.sin(t * 1.5) * 0.018;
    });
  }

  function energyScene(parent) {
    platform(parent, 6.6, 4.5);
    const turbineRotors = [];
    function turbine(x, z, scale) {
      const group = new THREE.Group();
      group.position.set(x, 0.2, z);
      group.scale.setScalar(scale);
      parent.add(group);
      cylinder(group, 0.32, 0.12, [0, 0.04, 0], mats.white);
      cylinder(group, 0.085, 1.82, [0, 1, 0], mats.white, 0.052);
      box(group, 0.22, 0.21, 0.49, [0, 1.96, -0.03], mats.white, 0.07);
      const rotor = new THREE.Group();
      rotor.position.set(0, 1.98, 0.27);
      group.add(rotor);
      sphere(rotor, 0.095, [0, 0, 0], mats.chrome);
      for (let i = 0; i < 3; i++) {
        const bladeGroup = new THREE.Group();
        bladeGroup.rotation.z = i * Math.PI * 2 / 3;
        rotor.add(bladeGroup);
        const shape = new THREE.Shape();
        shape.moveTo(-0.025, 0.08); shape.lineTo(-0.09, 0.25); shape.lineTo(-0.075, 0.68); shape.lineTo(0.025, 1.02); shape.lineTo(0.06, 0.95); shape.lineTo(0.075, 0.3); shape.closePath();
        const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.032, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.009, bevelSegments: 1, steps: 1 }), mats.white);
        blade.castShadow = true;
        bladeGroup.add(blade);
      }
      turbineRotors.push(rotor);
    }
    turbine(-1.95, -0.67, 1);
    turbine(-0.54, -1.04, 0.8);
    // Solar array, racked and individually divided into photovoltaic cells.
    for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) {
      const panel = new THREE.Group();
      panel.position.set(-1.87 + col * 1.02, 0.52, 0.76 + row * 0.71);
      panel.rotation.x = -0.32;
      parent.add(panel);
      box(panel, 0.91, 0.055, 0.62, [0, 0, 0], mats.chrome, 0.025);
      box(panel, 0.84, 0.015, 0.55, [0, 0.037, 0], mats.navy, 0.009);
      for (let i = 0; i < 3; i++) box(panel, 0.011, 0.011, 0.55, [-0.21 + i * 0.21, 0.052, 0], mats.blue, 0);
      for (const z of [-0.09, 0.09]) box(panel, 0.83, 0.011, 0.008, [0, 0.052, z], mats.slate, 0);
      rod(parent, [panel.position.x - 0.28, 0.19, panel.position.z], [panel.position.x - 0.28, 0.48, panel.position.z], 0.025);
      rod(parent, [panel.position.x + 0.28, 0.19, panel.position.z], [panel.position.x + 0.28, 0.48, panel.position.z], 0.025);
    }
    const battery = new THREE.Group();
    battery.position.set(1.72, 0.22, 0.28);
    parent.add(battery);
    box(battery, 1.32, 1.78, 0.95, [0, 0.89, 0], mats.white, 0.095);
    box(battery, 1.09, 1.4, 0.055, [0, 0.96, 0.488], mats.navy, 0.065);
    box(battery, 0.61, 0.93, 0.033, [0, 1.02, 0.53], mats.slate, 0.04);
    box(battery, 0.49, 0.81, 0.026, [0, 1.02, 0.556], mats.ink, 0.025);
    box(battery, 0.2, 0.065, 0.03, [0, 1.51, 0.537], mats.chrome, 0.014);
    const charge = [];
    for (let i = 0; i < 4; i++) charge.push(box(battery, 0.37, 0.135, 0.02, [0, 0.735 + i * 0.19, 0.58], i === 3 ? mats.blue : mats.green, 0.016));
    led(battery, [0.36, 0.33, 0.53], 0.2, mats.green);
    vent(battery, [-0.25, 0.28, 0.512], 5, 0.09, 0.12);
    path(parent, [[-1.95, 0.22, -0.67], [-1.22, 0.2, -1.62], [1.72, 0.2, -1.62], [1.72, 0.3, -0.2]], { speed: 0.13, color: mats.line });
    path(parent, [[-0.9, 0.22, 1.5], [0, 0.22, 1.5], [0.66, 0.22, 0.66], [1.1, 0.27, 0.66]], { speed: 0.16, phase: 0.4 });
    animations.push(t => { turbineRotors.forEach((rotor, i) => { rotor.rotation.z = -t * (0.35 + i * 0.08); }); charge[3].scale.x = 0.9 + Math.sin(t * 1.25) * 0.1; });
  }

  function commerceScene(parent) {
    platform(parent, 6.5, 4.5);
    const pedestal = new THREE.Group();
    parent.add(pedestal);
    cylinder(pedestal, 1.3, 0.24, [0, 0.33, 0], mats.navy);
    cylinder(pedestal, 1.22, 0.12, [0, 0.52, 0], mats.white);
    ring(pedestal, 1.27, 0.019, [0, 0.48, 0], mats.electric);
    // A real dimensional headphone product, suspended over a turntable.
    const product = new THREE.Group();
    product.position.y = 1.63;
    parent.add(product);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.092, 12, 48, Math.PI), mats.navy);
    product.add(band);
    const bandHighlight = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.024, 8, 48, Math.PI), mats.chrome);
    bandHighlight.position.z = 0.087;
    product.add(bandHighlight);
    for (const x of [-0.73, 0.73]) {
      box(product, 0.11, 0.45, 0.12, [x, -0.12, 0], mats.chrome, 0.03);
      const cup = box(product, 0.34, 0.72, 0.51, [x, -0.48, 0.01], mats.white, 0.14);
      cup.rotation.z = x > 0 ? -0.12 : 0.12;
      box(product, 0.105, 0.55, 0.42, [x + (x > 0 ? -0.17 : 0.17), -0.48, 0.01], mats.ink, 0.1);
      led(product, [x + (x > 0 ? 0.04 : -0.04), -0.61, 0.274], 0.11);
    }
    // Open spatial crop corners outline the product volume.
    for (const x of [-1.12, 1.12]) for (const y of [0.66, 2.73]) {
      const signX = x > 0 ? -1 : 1;
      const signY = y > 1 ? -1 : 1;
      rod(parent, [x, y, 0.78], [x + signX * 0.24, y, 0.78], 0.016, mats.electric);
      rod(parent, [x, y, 0.78], [x, y + signY * 0.24, 0.78], 0.016, mats.electric);
    }
    const cards = [];
    for (let i = 0; i < 2; i++) {
      const card = new THREE.Group();
      card.position.set(i ? 2.01 : -2.05, i ? 1.45 : 1.61, i ? -0.12 : 0.13);
      card.rotation.y = i ? -0.38 : 0.38;
      parent.add(card);
      box(card, 1.23, i ? 1.54 : 1.08, 0.085, [0, 0, 0], mats.white, 0.085);
      box(card, 1.09, 0.055, 0.018, [0, i ? 0.59 : 0.37, 0.059], mats.navy, 0.013);
      if (i) {
        for (let j = 0; j < 3; j++) {
          sphere(card, 0.07, [-0.39, 0.31 - j * 0.28, 0.08], j === 2 ? mats.chrome : j ? mats.blue : mats.navy);
          box(card, 0.58 - j * 0.08, 0.033, 0.02, [0.11, 0.31 - j * 0.28, 0.06], mats.slate, 0.012);
        }
        box(card, 0.93, 0.2, 0.035, [0, -0.52, 0.068], mats.blue, 0.035);
        checkmark(card, [0, -0.52, 0.097], 0.4, mats.white);
      } else {
        box(card, 0.58, 0.07, 0.02, [-0.17, 0.09, 0.06], mats.navy, 0.02);
        box(card, 0.82, 0.033, 0.02, [-0.04, -0.07, 0.06], mats.slate, 0.01);
        for (let j = 0; j < 4; j++) sphere(card, 0.045, [-0.39 + j * 0.16, -0.28, 0.08], mats.blue);
      }
      cards.push(card);
    }
    ring(parent, 1.66, 0.012, [0, 0.19, 0], mats.line);
    animations.push(t => { product.rotation.y = Math.sin(t * 0.4) * 0.45; product.position.y = 1.63 + Math.sin(t * 0.7) * 0.045; cards.forEach((card, i) => { card.position.y = (i ? 1.45 : 1.61) + Math.sin(t * 0.6 + i) * 0.025; }); });
  }

  function documentPage(parent, position, scale = 1) {
    const page = new THREE.Group();
    page.position.set(...position);
    page.scale.setScalar(scale);
    parent.add(page);
    box(page, 0.92, 1.23, 0.037, [0, 0, 0], mats.paper, 0.032);
    box(page, 0.18, 0.18, 0.012, [-0.24, 0.36, 0.027], mats.blue, 0.025);
    box(page, 0.37, 0.047, 0.012, [0.11, 0.4, 0.027], mats.navy, 0.012);
    box(page, 0.28, 0.029, 0.012, [0.065, 0.3, 0.027], mats.slate, 0.009);
    for (let i = 0; i < 5; i++) box(page, i === 4 ? 0.43 : 0.63, 0.026, 0.01, [i === 4 ? -0.1 : 0, 0.05 - i * 0.116, 0.028], mats.slate, 0.007);
    return page;
  }

  function officeScene(parent) {
    platform(parent, 6.6, 4.35);
    box(parent, 5.47, 0.15, 1.67, [0, 0.27, 0], mats.navy, 0.09);
    for (const x of [-2.3, 0, 2.3]) {
      cylinder(parent, 0.71, 0.14, [x, 0.42, 0], mats.white);
      ring(parent, 0.64, 0.016, [x, 0.5, 0], x === 2.3 ? mats.green : mats.blue);
    }
    // Input files retain different depths so the stack is legible in perspective.
    for (let i = 0; i < 3; i++) {
      const page = documentPage(parent, [-2.14 + i * 0.07, 1.18 + i * 0.025, -0.12 - i * 0.13], 0.84);
      page.rotation.y = 0.2;
      page.rotation.z = (i - 1) * -0.065;
    }
    for (const x of [-0.63, 0.63]) box(parent, 0.16, 1.72, 0.63, [x, 1.16, 0], mats.white, 0.045);
    box(parent, 1.45, 0.2, 0.69, [0, 2.07, 0], mats.white, 0.06);
    box(parent, 1.05, 0.06, 0.31, [0, 2.2, 0], mats.navy, 0.03);
    for (const x of [-0.52, 0.52]) box(parent, 0.025, 1.29, 0.03, [x, 1.22, 0.36], mats.electric, 0.006);
    const processed = documentPage(parent, [0, 1.22, 0.04], 0.88);
    const scanner = box(parent, 0.99, 0.036, 0.075, [0, 1.25, 0.15], mats.electric, 0.012);
    const verified = documentPage(parent, [2.11, 1.3, 0.03], 0.95);
    verified.rotation.y = -0.23;
    const badge = cylinder(verified, 0.21, 0.055, [0.31, -0.39, 0.09], mats.blue);
    badge.rotation.x = Math.PI / 2;
    checkmark(verified, [0.31, -0.39, 0.126], 0.73, mats.white);
    path(parent, [[-1.75, 0.6, 0.83], [-1.18, 0.63, 0.83], [-0.74, 0.6, 0.83]], { speed: 0.27, radius: 0.021 });
    path(parent, [[0.76, 0.6, 0.83], [1.23, 0.63, 0.83], [1.7, 0.6, 0.83]], { speed: 0.27, radius: 0.021, phase: 0.5 });
    // A small output tray ties the floating documents back to a physical workflow.
    box(parent, 1.38, 0.12, 0.83, [2.11, 0.55, 0.05], mats.chrome, 0.045);
    animations.push(t => { scanner.position.y = 0.76 + (Math.sin(t * 1.15) * 0.5 + 0.5) * 0.95; processed.position.y = 1.22 + Math.sin(t * 0.6) * 0.025; verified.position.y = 1.3 + Math.sin(t * 0.6 + 1) * 0.045; });
  }

  function printScene(parent) {
    platform(parent, 6.3, 4.35);
    const printer = new THREE.Group();
    printer.position.set(-0.3, 0.22, 0.02);
    parent.add(printer);
    box(printer, 2.75, 1.43, 1.91, [0, 0.79, 0], mats.white, 0.15);
    box(printer, 2.73, 0.36, 1.92, [0, 0.22, 0], mats.navy, 0.1);
    box(printer, 2.41, 0.16, 1.64, [0, 1.57, -0.09], mats.chrome, 0.06);
    box(printer, 2.22, 0.105, 1.47, [0, 1.69, -0.1], mats.navy, 0.06);
    box(printer, 1.9, 0.035, 1.15, [0, 1.757, -0.1], mats.glass, 0.025);
    box(printer, 1.86, 0.26, 0.07, [0, 1.04, 0.97], mats.ink, 0.045);
    box(printer, 1.94, 0.07, 0.76, [0, 0.84, 1.28], mats.slate, 0.045);
    box(printer, 1.81, 0.045, 0.71, [0, 0.895, 1.3], mats.navy, 0.03);
    const paper = new THREE.Group();
    paper.position.set(0, 0.956, 1.12);
    printer.add(paper);
    const sheet = documentPage(paper, [0, 0, 0], 1.12);
    sheet.rotation.x = -Math.PI / 2;
    sheet.rotation.z = Math.PI;
    const control = new THREE.Group();
    control.position.set(0.71, 1.44, 0.87);
    control.rotation.x = -0.26;
    printer.add(control);
    box(control, 0.81, 0.38, 0.12, [0, 0, 0], mats.navy, 0.04);
    box(control, 0.43, 0.24, 0.017, [-0.1, 0, 0.073], mats.blue, 0.025);
    checkmark(control, [-0.1, 0, 0.091], 0.47, mats.white);
    sphere(control, 0.043, [0.28, 0, 0.079], mats.electric);
    vent(printer, [-0.73, 0.51, 0.97], 7, 0.11, 0.24);
    led(printer, [0.97, 0.52, 0.98], 0.14, mats.green);
    // Secure-release token with a physically modeled lock.
    const token = new THREE.Group();
    token.position.set(2.02, 1.49, 0.09);
    token.rotation.y = -0.32;
    parent.add(token);
    box(token, 0.98, 1.22, 0.16, [0, 0, 0], mats.blue, 0.12);
    box(token, 0.52, 0.43, 0.14, [0, -0.1, 0.13], mats.white, 0.07);
    const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.041, 10, 28, Math.PI), mats.chrome);
    shackle.position.set(0, 0.2, 0.17);
    token.add(shackle);
    for (const x of [-0.17, 0.17]) rod(token, [x, 0.1, 0.17], [x, 0.22, 0.17], 0.041, mats.chrome);
    sphere(token, 0.045, [0, -0.065, 0.217], mats.navy);
    box(token, 0.027, 0.1, 0.02, [0, -0.123, 0.225], mats.navy, 0.006);
    path(parent, [[1.18, 0.45, 0.13], [1.8, 0.45, 0.13], [2.02, 0.68, 0.13]], { speed: 0.18, radius: 0.025 });
    animations.push(t => { paper.position.z = 1.15 + (Math.sin(t * 0.56) * 0.5 + 0.5) * 0.28; token.position.y = 1.49 + Math.sin(t * 0.62) * 0.05; });
  }

  function observerScene(parent) {
    platform(parent, 6.6, 4.65);
    const hub = new THREE.Group();
    hub.position.set(0, 0.24, 0);
    parent.add(hub);
    cylinder(hub, 0.86, 0.2, [0, 0.06, 0], mats.chrome);
    cylinder(hub, 0.79, 0.16, [0, 0.23, 0], mats.navy);
    sphere(hub, 0.59, [0, 1.03, 0], mats.navy);
    ring(hub, 0.68, 0.027, [0, 1.03, 0], mats.electric, [0.37, 0.2, 0.2]);
    const ring2 = ring(hub, 0.77, 0.017, [0, 1.03, 0], mats.chrome, [1.05, 0.4, -0.5]);
    cylinder(hub, 0.14, 0.45, [0, 0.54, 0], mats.chrome);
    const locations = [[-2.12, 0.22, -1.13], [1.91, 0.22, -1.23], [2.1, 0.22, 1.1], [-1.98, 0.22, 1.2]];
    const satellites = [];
    locations.forEach((p, i) => {
      const node = new THREE.Group();
      node.position.set(...p);
      parent.add(node);
      box(node, 1.01, 0.13, 0.89, [0, 0.04, 0], mats.white, 0.07);
      if (i < 2) {
        box(node, 0.73, 1.07, 0.62, [0, 0.64, 0], mats.navy, 0.06);
        box(node, 0.69, 0.065, 0.57, [0, 1.21, 0], mats.chrome, 0.025);
        for (let j = 0; j < 4; j++) {
          box(node, 0.58, 0.14, 0.037, [0, 0.3 + j * 0.235, 0.334], mats.slate, 0.02);
          led(node, [-0.17, 0.3 + j * 0.235, 0.365], 0.068, j === 3 ? mats.green : mats.electric);
        }
      } else if (i === 2) {
        box(node, 1.03, 0.67, 0.09, [0, 0.86, -0.09], mats.navy, 0.045);
        box(node, 0.91, 0.53, 0.02, [0, 0.86, -0.028], mats.ink, 0.025);
        rod(node, [0, 0.17, -0.1], [0, 0.54, -0.1], 0.039);
        box(node, 0.98, 0.045, 0.5, [0, 0.17, 0.23], mats.chrome, 0.03);
        path(node, [[-0.35, 0.85, -0.01], [-0.2, 0.85, -0.01], [-0.1, 1.01, -0.01], [0.03, 0.7, -0.01], [0.16, 0.91, -0.01], [0.35, 0.91, -0.01]], { pulse: false, radius: 0.012, color: mats.electric });
      } else {
        box(node, 0.81, 0.25, 0.63, [0, 0.3, 0], mats.navy, 0.06);
        for (const x of [-0.29, 0.29]) rod(node, [x, 0.38, -0.2], [x * 1.15, 0.91, -0.2], 0.025, mats.chrome);
        for (let j = 0; j < 4; j++) led(node, [-0.25 + j * 0.13, 0.31, 0.335], 0.054, j === 0 ? mats.green : mats.electric);
      }
      path(parent, [[p[0], 0.29, p[2]], [p[0] * 0.7, 0.49, p[2] * 0.72], [p[0] * 0.3, 0.83, p[2] * 0.3], [0, 1.27, 0]], { radius: 0.018, phase: i * 0.25, speed: 0.115 });
      satellites.push(node);
    });
    path(parent, [[-2.12, 0.175, -1.13], [-2.68, 0.175, 0], [-1.98, 0.175, 1.2]], { pulse: false, radius: 0.014 });
    path(parent, [[1.91, 0.175, -1.23], [2.68, 0.175, -0.1], [2.1, 0.175, 1.1]], { pulse: false, radius: 0.014 });
    animations.push(t => { ring2.rotation.z = -0.5 + t * 0.07; hub.children[2].rotation.y = t * 0.1; });
  }

  const builders = { core: coreScene, vision: visionScene, energy: energyScene, commerce: commerceScene, office: officeScene, print: printScene, observer: observerScene };

  function releaseGroup(group) {
    if (!group) return;
    const geometries = new Set();
    const materials = new Set();
    group.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => { if (!sharedMaterials.has(material)) materials.add(material); });
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    scene.remove(group);
  }

  function updateCamera(snap = false) {
    const factor = snap || reducedMotion ? 1 : 0.08;
    orbit.azimuth += (desiredOrbit.azimuth - orbit.azimuth) * factor;
    orbit.elevation += (desiredOrbit.elevation - orbit.elevation) * factor;
    const distance = desiredOrbit.distance * Math.max(1, 1.12 / aspect);
    orbit.distance += (distance - orbit.distance) * factor;
    camera.position.set(
      Math.sin(orbit.azimuth) * Math.cos(orbit.elevation) * orbit.distance,
      Math.sin(orbit.elevation) * orbit.distance + target.y,
      Math.cos(orbit.azimuth) * Math.cos(orbit.elevation) * orbit.distance,
    );
    camera.lookAt(target);
  }

  function renderOnce() {
    if (disposed) return;
    updateCamera(true);
    renderer.render(scene, camera);
    if (!readySent) { readySent = true; onReady?.({ webgl: true, kind: currentKind }); }
  }

  function active() { return !disposed && !graphicsLost && !userPaused && !reducedMotion && intersecting && pageVisible; }
  function tick(now) {
    frame = 0;
    if (!active()) return;
    const delta = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 0;
    previousTime = now;
    elapsed += delta;
    animations.forEach(animate => animate(elapsed));
    updateCamera();
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  }
  function syncAnimation() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    if (active()) frame = requestAnimationFrame(tick);
  }
  function setKind(next) {
    if (disposed) return;
    next = labels[next] ? next : 'core';
    if (root && next === currentKind) return;
    currentKind = next;
    releaseGroup(root);
    animations = [];
    root = new THREE.Group();
    scene.add(root);
    elapsed = 0;
    mats.beam.opacity = 0.075;
    builders[currentKind](root);
    // Start with complete, legible geometry even when animation is disabled.
    animations.forEach(animate => animate(0));
    target.set(0, currentKind === 'energy' ? 0.94 : 0.72, 0);
    desiredOrbit.azimuth = currentKind === 'core' ? 0.77 : 0.63;
    desiredOrbit.elevation = currentKind === 'core' ? 0.49 : 0.4;
    desiredOrbit.distance = currentKind === 'core' ? 11.4 : 11.8;
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

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  function pointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
  }
  function pointerMove(event) {
    if (!dragging) return;
    desiredOrbit.azimuth -= (event.clientX - lastX) * 0.006;
    desiredOrbit.elevation = THREE.MathUtils.clamp(desiredOrbit.elevation + (event.clientY - lastY) * 0.004, 0.18, 0.83);
    lastX = event.clientX;
    lastY = event.clientY;
    if (!active()) renderOnce();
  }
  function pointerUp() { dragging = false; canvas.style.cursor = 'grab'; }
  function keyDown(event) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') desiredOrbit.azimuth -= 0.12;
    if (event.key === 'ArrowRight') desiredOrbit.azimuth += 0.12;
    if (event.key === 'ArrowUp') desiredOrbit.elevation = Math.min(0.83, desiredOrbit.elevation + 0.08);
    if (event.key === 'ArrowDown') desiredOrbit.elevation = Math.max(0.18, desiredOrbit.elevation - 0.08);
    if (!active()) renderOnce();
  }
  function visibilityChange() { pageVisible = !document.hidden; syncAnimation(); }
  function motionChange(event) { reducedMotion = event.matches; syncAnimation(); renderOnce(); }
  function contextLost(event) { event.preventDefault(); graphicsLost = true; syncAnimation(); canvas.setAttribute('aria-label', 'The 3D preview is paused because the graphics context was interrupted.'); }
  function contextRestored() { graphicsLost = false; renderOnce(); syncAnimation(); }
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
    setPaused(value) { userPaused = Boolean(value); if (!userPaused) reducedMotion = false; syncAnimation(); },
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
      floor.geometry.dispose();
      floor.material.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
