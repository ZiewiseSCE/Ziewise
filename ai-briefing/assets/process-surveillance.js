/**
 * Conceptual industrial surveillance scenes. THREE is injected by the caller.
 * No DOM, imports, renderer, timers, or animation loop. Front is +Z; floor is Y=0.
 * update() is deterministic: phase is 0..3; time is seconds since that phase began.
 */
export function createSurveillanceModel(THREE, kind) {
  const validKinds = ['control-room', 'before-after', 'mobile-fixed', 'safety', 'operations'];
  if (!validKinds.includes(kind)) throw new RangeError(`Unsupported surveillance scene: ${kind}`);
  const PI = Math.PI;
  const root = new THREE.Group();
  root.name = `surveillance-${kind}`;
  const labels = [];
  const camera = { target: [0, 1.25, 0], distance: 14, yaw: 0.6, pitch: 0.6 };
  const M = {};
  const mat = (color, metalness = 0.35, roughness = 0.48, extra = {}) => new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  M.floor = mat(0x102438, 0.25, 0.61);
  M.tile = mat(0x1b344a, 0.32, 0.53);
  M.steel = mat(0x9badbb, 0.7, 0.36);
  M.dark = mat(0x31485c, 0.58, 0.43);
  M.black = mat(0x10212e, 0.3, 0.56);
  M.rubber = mat(0x17212b, 0.08, 0.69);
  M.wall = mat(0x536879, 0.4, 0.6);
  M.white = mat(0xc1ced7, 0.3, 0.43);
  M.skin = mat(0xc89473, 0.05, 0.58);
  M.cloth = mat(0x294c68, 0.08, 0.6);
  M.vest = mat(0xdda33e, 0.1, 0.51);
  M.cyan = mat(0x38d4e5, 0.25, 0.39, { emissive: 0x1089a5, emissiveIntensity: 0.56 });
  M.amber = mat(0xefae42, 0.25, 0.4, { emissive: 0xb76a14, emissiveIntensity: 0.43 });
  M.red = mat(0xe45b45, 0.18, 0.41, { emissive: 0xb42e1e, emissiveIntensity: 0.48 });
  M.green = mat(0x48d69d, 0.18, 0.4, { emissive: 0x15926b, emissiveIntensity: 0.44 });
  M.screen = mat(0x082331, 0.22, 0.44, { emissive: 0x063047, emissiveIntensity: 0.5 });
  M.water = mat(0x45a7bd, 0.15, 0.31, { transparent: true, opacity: 0.83 });
  M.flame = mat(0xf19633, 0, 0.55, { emissive: 0xd55b17, emissiveIntensity: 0.58 });
  M.flameCore = mat(0xffd27a, 0, 0.51, { emissive: 0xf59637, emissiveIntensity: 0.7 });
  const G = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 16),
    sphere: new THREE.SphereGeometry(1, 16, 10),
    cone: new THREE.ConeGeometry(1, 1, 12),
    torus: new THREE.TorusGeometry(1, 0.085, 6, 28),
    tinySphere: new THREE.SphereGeometry(1, 10, 6)
  };
  const unitY = new THREE.Vector3(0, 1, 0);
  function group(parent, name, x = 0, y = 0, z = 0) {
    const g = new THREE.Group(); g.name = name; g.position.set(x, y, z); parent.add(g); return g;
  }
  function mesh(parent, geometry, material, x, y, z, sx = 1, sy = 1, sz = 1, name = '') {
    const m = new THREE.Mesh(geometry, material);
    m.name = name; m.position.set(x, y, z); m.scale.set(sx, sy, sz);
    m.castShadow = !material.transparent; m.receiveShadow = true; parent.add(m); return m;
  }
  const box = (p, x, y, z, w, h, d, m = M.steel, name = '') => mesh(p, G.box, m, x, y, z, w, h, d, name);
  function cyl(p, x, y, z, r, h, m = M.steel, axis = 'y', name = '') {
    const c = mesh(p, G.cylinder, m, x, y, z, r, h, r, name);
    if (axis === 'x') c.rotation.z = PI / 2;
    if (axis === 'z') c.rotation.x = PI / 2;
    return c;
  }
  const ball = (p, x, y, z, r, m = M.steel) => mesh(p, G.sphere, m, x, y, z, r, r, r);
  function ring(p, x, y, z, r, m = M.steel, axis = 'z') {
    const t = mesh(p, G.torus, m, x, y, z, r, r, r);
    if (axis === 'y') t.rotation.x = PI / 2;
    if (axis === 'x') t.rotation.y = PI / 2;
    return t;
  }
  function rod(p, a, b, radius, m = M.steel) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const difference = end.clone().sub(start);
    const c = cyl(p, 0, 0, 0, radius, difference.length(), m);
    c.position.copy(start.add(end).multiplyScalar(0.5));
    c.quaternion.setFromUnitVectors(unitY, difference.normalize());
    return c;
  }
  function label(text, x, y, z) { labels.push({ text, position: new THREE.Vector3(x, y, z) }); }
  function platform(parent, x, z, w, d, name = 'factory-zone') {
    const g = group(parent, name, x, 0, z);
    box(g, 0, 0.09, 0, w, 0.18, d, M.tile);
    for (const side of [-1, 1]) box(g, side * (w / 2 - 0.06), 0.186, 0, 0.035, 0.014, d - 0.1, M.dark);
    return g;
  }
  box(root, 0, 0.025, 0, 11.7, 0.05, 6.8, M.floor, 'navy-ground');
  function person(parent, x, z, { scale = 1, helmet = true, seated = false, vest = true } = {}) {
    const p = group(parent, 'operator', x, 0.18, z); p.scale.setScalar(scale);
    const hip = seated ? 0.6 : 0.77;
    box(p, 0, hip + 0.25, 0, 0.43, 0.51, 0.26, vest ? M.vest : M.cloth, 'worker-torso');
    if (vest) {
      box(p, -0.12, hip + 0.27, 0.14, 0.04, 0.44, 0.015, M.white);
      box(p, 0.12, hip + 0.27, 0.14, 0.04, 0.44, 0.015, M.white);
      box(p, 0, hip + 0.1, 0.145, 0.4, 0.036, 0.015, M.white);
    }
    const head = group(p, 'head', 0, hip + 0.7, 0);
    ball(head, 0, 0, 0, 0.175, M.skin);
    box(head, 0, -0.015, 0.172, 0.055, 0.06, 0.045, M.skin, 'nose');
    const hardhat = group(head, 'hardhat');
    const dome = ball(hardhat, 0, 0.09, 0, 0.19, M.amber); dome.scale.y = 0.12;
    cyl(hardhat, 0, 0.06, 0, 0.218, 0.025, M.amber);
    hardhat.visible = helmet;
    if (!helmet) {
      const hair = ball(head, 0, 0.06, -0.01, 0.18, M.dark); hair.scale.y = 0.1;
    }
    const arms = [];
    for (const side of [-1, 1]) {
      const arm = group(p, side < 0 ? 'left-arm' : 'right-arm', side * 0.26, hip + 0.44, 0);
      cyl(arm, 0, -0.19, 0, 0.075, 0.37, M.cloth);
      ball(arm, 0, -0.42, 0, 0.079, M.skin);
      arm.rotation.z = side * 0.07; arms.push(arm);
      if (seated) {
        rod(p, [side * 0.12, 0.63, 0], [side * 0.12, 0.52, 0.33], 0.095, M.cloth);
        rod(p, [side * 0.12, 0.52, 0.33], [side * 0.12, 0.17, 0.33], 0.081, M.cloth);
        box(p, side * 0.12, 0.09, 0.39, 0.19, 0.15, 0.33, M.rubber);
      } else {
        cyl(p, side * 0.12, 0.43, 0, 0.09, 0.66, M.cloth);
        box(p, side * 0.12, 0.08, 0.06, 0.19, 0.16, 0.33, M.rubber);
      }
    }
    if (seated) {
      box(p, 0, 0.49, -0.02, 0.58, 0.1, 0.51, M.dark);
      box(p, 0, 0.85, -0.26, 0.57, 0.58, 0.11, M.black);
      cyl(p, 0, 0.23, 0, 0.065, 0.48, M.steel);
      for (let i = 0; i < 4; i++) {
        const a = i * PI / 2;
        rod(p, [0, 0.08, 0], [Math.cos(a) * 0.4, 0.08, Math.sin(a) * 0.4], 0.027, M.dark);
      }
    }
    return { root: p, head, arms, hardhat };
  }
  function cctv(parent, x, y, z, yaw = 0) {
    const base = group(parent, 'inspection-camera', x, y, z);
    box(base, 0, -0.09, -0.26, 0.2, 0.17, 0.28, M.dark, 'camera-mount');
    const pan = group(base, 'camera-pan'); pan.rotation.y = yaw;
    cyl(pan, 0, -0.015, 0, 0.095, 0.13, M.steel);
    const head = group(pan, 'camera-head', 0, 0.15, 0); head.rotation.x = 0.16;
    box(head, 0, 0, 0, 0.43, 0.26, 0.54, M.white, 'camera-body');
    box(head, 0, 0.153, 0.055, 0.5, 0.045, 0.67, M.steel, 'camera-sunshield');
    cyl(head, 0, 0, 0.305, 0.118, 0.13, M.black, 'z', 'camera-lens');
    cyl(head, 0, 0, 0.38, 0.077, 0.015, M.cyan, 'z');
    box(head, 0.218, 0, -0.16, 0.016, 0.043, 0.06, M.green);
    return { root: base, pan, head };
  }
  function monitor(parent, x, y, z, w = 0.93, h = 0.57) {
    const g = group(parent, 'monitor', x, y, z);
    box(g, 0, 0, 0, w, h, 0.12, M.black, 'monitor-housing');
    const screen = box(g, 0, 0, 0.067, w - 0.07, h - 0.07, 0.017, M.screen, 'monitor-screen');
    box(g, -w * 0.32, -h * 0.32, 0.08, w * 0.2, 0.014, 0.012, M.cyan);
    box(g, -w * 0.04, -h * 0.32, 0.08, w * 0.26, 0.014, 0.012, M.dark);
    const status = box(g, w * 0.37, -h * 0.37, 0.082, 0.036, 0.025, 0.014, M.green);
    // Small actual three-dimensional pipe/tank silhouettes provide scene thumbnails.
    box(g, -w * 0.16, -0.005, 0.083, w * 0.27, h * 0.27, 0.022, M.dark);
    box(g, w * 0.11, -h * 0.1, 0.09, w * 0.37, 0.025, 0.025, M.steel);
    box(g, w * 0.21, h * 0.04, 0.09, 0.034, h * 0.27, 0.028, M.steel);
    return { root: g, screen, status };
  }
  function desk(parent, x, z, scale = 1, screens = 2) {
    const d = group(parent, 'control-desk', x, 0, z); d.scale.setScalar(scale);
    box(d, 0, 0.99, 0, 2.45, 0.12, 0.93, M.dark, 'desk-top');
    for (const side of [-1, 1]) {
      box(d, side * 0.95, 0.5, 0, 0.14, 0.95, 0.64, M.steel);
      box(d, side * 0.95, 0.08, 0, 0.49, 0.12, 0.8, M.dark);
    }
    box(d, -0.25, 1.066, 0.24, 0.75, 0.045, 0.25, M.black, 'keyboard');
    box(d, 0.45, 1.069, 0.26, 0.1, 0.06, 0.13, M.steel, 'mouse');
    const displays = [];
    for (let i = 0; i < screens; i++) {
      const mx = (i - (screens - 1) / 2) * 1.04;
      cyl(d, mx, 1.16, -0.14, 0.038, 0.28, M.steel);
      box(d, mx, 1.073, -0.14, 0.35, 0.03, 0.23, M.black);
      displays.push(monitor(d, mx, 1.49, -0.17));
    }
    const button = cyl(d, 0.9, 1.067, 0.24, 0.07, 0.038, M.cyan);
    return { root: d, displays, button };
  }
  function beacon(parent, x, z, height = 1.8) {
    const g = group(parent, 'alarm-tower', x, 0, z);
    box(g, 0, 0.08, 0, 0.42, 0.16, 0.42, M.dark);
    cyl(g, 0, height * 0.48, 0, 0.038, height * 0.9, M.steel);
    const lamps = [M.green, M.amber, M.red].map((m, i) => cyl(g, 0, height - 0.34 + i * 0.17, 0, 0.115, 0.145, M.dark));
    cyl(g, 0, height + 0.07, 0, 0.128, 0.045, M.black);
    return { root: g, lamps, set(state) { lamps.forEach((lamp, i) => { lamp.material = state === i ? [M.green, M.amber, M.red][i] : M.dark; }); } };
  }
  function statusMarker(parent, x, y, z, size = 0.2) {
    const g = group(parent, 'verification-marker', x, y, z);
    const circle = ring(g, 0, 0, 0, size, M.amber);
    const clockHandA = box(g, 0, size * 0.25, 0.015, size * 0.1, size * 0.62, 0.025, M.amber);
    const clockHandB = box(g, size * 0.21, 0, 0.015, size * 0.44, size * 0.1, 0.025, M.amber);
    const check = group(g, 'verified-check');
    rod(check, [-size * 0.57, 0, 0.02], [-size * 0.13, -size * 0.42, 0.02], size * 0.075, M.green);
    rod(check, [-size * 0.13, -size * 0.42, 0.02], [size * 0.67, size * 0.49, 0.02], size * 0.075, M.green);
    return { root: g, set(active, verified = false) { g.visible = active; circle.material = verified ? M.green : M.amber; clockHandA.visible = clockHandB.visible = !verified; check.visible = verified; } };
  }
  function detectionFrame(parent, x, y, z, w, h, d) {
    const g = group(parent, 'three-dimensional-detection-frame', x, y, z);
    const bars = [];
    for (const sy of [-1, 1]) for (const sz of [-1, 1]) bars.push(box(g, 0, sy * h / 2, sz * d / 2, w, 0.027, 0.027, M.red));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bars.push(box(g, sx * w / 2, 0, sz * d / 2, 0.027, h, 0.027, M.red));
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) bars.push(box(g, sx * w / 2, sy * h / 2, 0, 0.027, 0.027, d, M.red));
    g.visible = false;
    return { root: g, set(amount, verified = false) { g.visible = amount > 0.01; g.scale.setScalar(0.92 + 0.08 * amount); bars.forEach(b => { b.material = verified ? M.amber : M.red; }); } };
  }
  function route(parent, points, material = M.cyan) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const tube = new THREE.TubeGeometry(curve, 24, 0.019, 5, false);
    const line = mesh(parent, tube, material, 0, 0, 0); line.castShadow = false;
    const packet = mesh(parent, G.tinySphere, M.cyan, 0, 0, 0, 0.09, 0.09, 0.09, 'network-message');
    packet.castShadow = false;
    return { line, packet, set(progress, active = true) { packet.visible = active && progress > 0 && progress < 1; packet.position.copy(curve.getPoint(Math.max(0, Math.min(1, progress)))); } };
  }
  function pump(parent, x = 0, z = 0, scale = 1) {
    const g = group(parent, 'industrial-pump', x, 0.18, z); g.scale.setScalar(scale);
    box(g, 0, 0.075, 0, 1.7, 0.15, 0.82, M.dark);
    cyl(g, -0.3, 0.49, 0, 0.33, 0.72, M.steel, 'x', 'electric-motor');
    for (let i = 0; i < 4; i++) ring(g, -0.57 + i * 0.17, 0.49, 0, 0.335, M.dark, 'x');
    cyl(g, 0.29, 0.49, 0, 0.37, 0.36, M.dark, 'x', 'pump-volute');
    cyl(g, 0.58, 0.49, 0, 0.115, 0.55, M.steel, 'x');
    cyl(g, 0.3, 0.88, 0, 0.12, 0.57, M.steel);
    ring(g, 0.3, 1.09, 0, 0.17, M.steel, 'y');
    cyl(g, 0.3, 1.29, 0, 0.035, 0.3, M.steel);
    const wheel = ring(g, 0.3, 1.47, 0, 0.19, M.amber, 'y');
    box(g, 0.3, 1.47, 0, 0.36, 0.03, 0.04, M.amber);
    box(g, -0.3, 0.91, 0.01, 0.26, 0.18, 0.24, M.black);
    return { root: g, wheel };
  }
  function machine(parent, x = 0, z = 0, scale = 1) {
    const g = group(parent, 'production-machine', x, 0.18, z); g.scale.setScalar(scale);
    box(g, 0, 0.16, 0, 1.4, 0.32, 1, M.dark);
    for (const side of [-1, 1]) box(g, side * 0.51, 1.03, -0.21, 0.13, 1.44, 0.15, M.steel);
    box(g, 0, 1.7, -0.21, 1.23, 0.19, 0.33, M.white);
    box(g, 0, 1.17, -0.21, 0.31, 0.74, 0.3, M.dark);
    box(g, 0, 0.62, 0.05, 1.29, 0.19, 0.75, M.steel);
    const tool = box(g, 0, 0.89, -0.12, 0.18, 0.21, 0.19, M.amber);
    box(g, 0.66, 1.34, 0.02, 0.34, 0.46, 0.15, M.black);
    box(g, 0.66, 1.39, 0.1, 0.24, 0.21, 0.016, M.cyan);
    return { root: g, tool };
  }
  function doorFrame(parent, x, z, width = 1.5) {
    const g = group(parent, 'building-door-frame', x, 0.18, z);
    for (const side of [-1, 1]) {
      box(g, side * (width / 2 + 0.12), 1.25, 0, 0.24, 2.5, 0.3, M.wall);
      box(g, side * (width / 2 + 0.4), 1.25, -0.045, 0.34, 2.5, 0.22, M.dark);
    }
    box(g, 0, 2.57, 0, width + 0.5, 0.2, 0.34, M.steel);
    box(g, 0, 0.025, 0, width, 0.05, 0.5, M.steel);
    const door = box(g, 0, 1.18, -0.065, width - 0.07, 2.34, 0.1, M.wall, 'sliding-door');
    box(door, 0.35, 0, 0.65, 0.06, 0.1, 0.35, M.steel);
    return { root: g, door };
  }
  function pallet(parent, x, z, scale = 1) {
    const g = group(parent, 'stacked-material', x, 0.18, z); g.scale.setScalar(scale);
    for (let i = 0; i < 3; i++) box(g, (i - 1) * 0.28, 0.08, 0, 0.23, 0.16, 0.8, M.dark);
    box(g, 0, 0.34, 0, 0.75, 0.45, 0.7, M.wall);
    box(g, 0, 0.68, 0, 0.64, 0.22, 0.64, M.white);
    box(g, 0, 0.47, 0.36, 0.055, 0.56, 0.02, M.dark);
    return g;
  }
  function hazard(parent, type, x, z, scale = 1) {
    const g = group(parent, `hazard-${type}`, x, 0, z); g.scale.setScalar(scale);
    const marker = statusMarker(g, 0.68, 2.27, 0.25, 0.17);
    let animate = () => {};
    let frame;
    if (type === 'ppe') {
      machine(g, 0.38, -0.35, 0.74);
      const worker = person(g, -0.56, 0.56, { scale: 0.82, helmet: false }); worker.root.rotation.y = -0.42;
      box(g, -0.61, 0.188, 0.12, 1.47, 0.018, 0.035, M.amber);
      const hardhatStand = group(g, 'unused-hardhat', -1.03, 0.67, -0.15);
      box(g, -1.03, 0.42, -0.15, 0.36, 0.49, 0.34, M.dark);
      const helmet = ball(hardhatStand, 0, 0, 0, 0.17, M.amber); helmet.scale.y = 0.1;
      cyl(hardhatStand, 0, -0.015, 0, 0.2, 0.025, M.amber);
      frame = detectionFrame(g, -0.35, 0.94, 0.31, 0.77, 1.68, 0.85);
      animate = (amount) => {
        worker.root.position.set(-0.77 + amount * 0.35, 0.18, 0.73 - amount * 0.44);
        worker.arms[0].rotation.x = amount * -0.23;
        worker.arms[1].rotation.x = amount * 0.2;
        frame.root.position.x = worker.root.position.x;
        frame.root.position.z = worker.root.position.z;
      };
    } else if (type === 'leak') {
      pump(g, 0, -0.15, 0.94);
      const puddle = mesh(g, G.sphere, M.water, 0.55, 0.211, 0.4, 0.04, 0.014, 0.04, 'leak-puddle');
      const drops = Array.from({ length: 5 }, (_, i) => mesh(g, G.tinySphere, M.water, 0.55, 0.66, 0.13, 0.027, 0.065, 0.027, 'leak-droplet'));
      frame = detectionFrame(g, 0.31, 0.67, 0.22, 1.49, 1.1, 1.12);
      animate = (amount) => {
        puddle.visible = amount > 0.02;
        puddle.scale.set(0.03 + amount * 0.64, 0.014, 0.03 + amount * 0.39);
        drops.forEach((drop, i) => {
          const p = Math.max(0, Math.min(1, amount * 1.8 - i * 0.15));
          drop.visible = amount > 0.02 && p < 1;
          drop.position.set(0.55 + 0.035 * i, 0.66 - p * 0.43, 0.13 + p * 0.27);
        });
      };
    } else {
      box(g, -0.18, 0.78, -0.24, 0.98, 1.2, 0.61, M.dark, 'electrical-cabinet');
      box(g, -0.18, 0.82, 0.077, 0.8, 0.94, 0.04, M.wall, 'cabinet-door');
      box(g, 0.12, 0.83, 0.106, 0.034, 0.24, 0.036, M.steel);
      for (let i = 0; i < 3; i++) box(g, -0.2, 1.04 + i * 0.08, 0.105, 0.4, 0.019, 0.02, M.black);
      const flames = group(g, 'stylized-fire', 0.18, 0.22, 0.36);
      for (let i = 0; i < 5; i++) {
        const a = i * 2.1;
        const flame = mesh(flames, G.cone, i % 2 ? M.flameCore : M.flame, Math.cos(a) * 0.18, 0.42 + i * 0.025, Math.sin(a) * 0.14, 0.17, 0.79 + i * 0.07, 0.16);
        flame.rotation.z = (i - 2) * 0.09;
      }
      frame = detectionFrame(g, 0.05, 0.91, 0.16, 1.4, 1.62, 1.1);
      animate = (amount) => { flames.visible = amount > 0.02; flames.scale.setScalar(0.18 + amount * 0.82); flames.rotation.y = amount * 0.27; };
    }
    return { root: g, frame, marker, animate };
  }

  let updateScene;
  const clamp = (n) => Math.max(0, Math.min(1, n));
  const ease = (n) => { const p = clamp(n); return p * p * (3 - 2 * p); };
  function progression(phase, time, reducedMotion) {
    return (step, delay = 0, duration = 1.3) => phase < step ? 0 : phase > step || reducedMotion ? 1 : ease((time - delay) / duration);
  }

  if (kind === 'control-room') {
    camera.target = [0, 1.3, 0]; camera.distance = 14.6; camera.yaw = 0.35;
    box(root, -2.9, 1.73, -0.18, 4.76, 3.1, 0.15, M.dark, 'twelve-monitor-wall');
    const displays = [];
    for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) displays.push(monitor(root, -4.61 + col * 1.14, 1.08 + row * 0.8, -0.05, 1.03, 0.66));
    const workstation = desk(root, -2.9, 0.89, 1.46, 0);
    const operator = person(root, -2.9, 2.13, { seated: true, helmet: false, vest: false, scale: 1.05 });
    operator.root.rotation.y = PI;
    const focused = detectionFrame(root, -3.47, 1.88, 0.032, 1.105, 0.73, 0.045);
    const zoneRisks = ['ppe', 'leak', 'fire'].map((type, i) => {
      const zone = platform(root, 3.48, -2.19 + i * 2.15, 3.45, 1.91, `simultaneous-zone-${i}`);
      const h = hazard(zone, type, 0, -0.06, 0.7);
      const cam = cctv(zone, 1.1, 1.84, -0.5, -0.39); cam.root.scale.setScalar(0.68);
      return h;
    });
    const selectedIndices = [5, 9, 2];
    const screenMarkers = selectedIndices.map(i => statusMarker(displays[i].root, 0.31, 0.12, 0.12, 0.085));
    label('관제 담당자', -3.25, 3.44, 0.1);
    label('동시 발생', 3.25, 2.78, -1.9);
    label('미확인', 3.7, 2.43, 2.11);
    updateScene = (phase, time, reduced) => {
      const p = progression(phase, time, reduced), risk = p(1), focus = p(2), ack = p(3);
      displays.forEach(display => { display.screen.material = M.screen; display.status.material = M.green; });
      zoneRisks.forEach((h, i) => {
        h.animate(risk); h.frame.set(0); h.marker.set(risk > 0.15, i === 0 && ack > 0.6);
        const display = displays[selectedIndices[i]];
        display.status.material = risk > 0.15 ? (i === 0 && ack > 0.6 ? M.green : M.amber) : M.green;
        display.screen.material = risk > 0.15 ? (i === 0 && ack > 0.6 ? M.screen : M.red) : M.screen;
        screenMarkers[i].set(risk > 0.15, i === 0 && ack > 0.6);
      });
      focused.set(focus, ack > 0.6);
      focused.root.children.forEach(bar => { bar.material = ack > 0.6 ? M.green : M.cyan; });
      operator.head.rotation.y = focus * 0.18;
      operator.head.rotation.x = focus * -0.06;
      operator.arms[1].rotation.x = -0.18 - ack * 0.75;
      workstation.button.position.y = 1.067 - ack * 0.017;
      workstation.button.material = ack > 0.6 ? M.green : M.cyan;
    };
  } else if (kind === 'before-after') {
    camera.yaw = 0.15; camera.pitch = 0.59; camera.distance = 14.5;
    box(root, 0, 0.08, 0, 0.06, 0.1, 6.2, M.cyan, 'comparison-divider');
    const twins = [-2.99, 2.99].map((center, index) => {
      const p = platform(root, center, 0, 5.39, 6.07, index ? 'ai-observed-site' : 'manually-observed-site');
      machine(p, 0.42, -1.68, 0.91);
      pallet(p, -1.6, -1.95, 0.75);
      for (const side of [-1, 1]) box(p, 0.16, 0.193, -0.25 + side * 0.41, 2.49, 0.025, 0.036, M.amber, 'restricted-floor-line');
      const worker = person(p, -1.38, 0.17, { scale: 0.75, helmet: false }); worker.root.rotation.y = -0.48;
      box(p, 1.79, 1.37, -2.42, 0.13, 2.38, 0.13, M.steel);
      const cam = cctv(p, 1.73, 2.65, -2.36, -0.37);
      const station = desk(p, 0.12, 1.82, 0.73, 2);
      const operator = person(p, 0.13, 2.74, { seated: true, helmet: false, vest: false, scale: 0.75 }); operator.root.rotation.y = PI;
      const alarm = beacon(p, 1.61, 1.78, 1.65);
      const frame = detectionFrame(p, -0.75, 0.89, -0.06, 0.69, 1.53, 0.73);
      const verified = statusMarker(p, 0.98, 1.68, 1.74, 0.19);
      const unseen = statusMarker(p, -0.78, 1.95, -0.08, 0.16);
      const message = route(p, [[-0.75, 0.26, 0.02], [-1.01, 0.27, 0.78], [-0.62, 0.29, 1.23], [0, 1.04, 1.63]]);
      return { worker, cam, station, operator, alarm, frame, verified, unseen, message };
    });
    label('수동 관제', -3.1, 3.26, -1.05);
    label('AI 관제', 3.07, 3.26, -1.05);
    label('담당 확인', 3.63, 1.89, 2.25);
    updateScene = (phase, time, reduced) => {
      const p = progression(phase, time, reduced), move = p(1, 0, 1.2), detection = p(1, 0.6, 0.75), notification = p(2, 0, 1.45), ack = p(3);
      twins.forEach((t, i) => {
        t.worker.root.position.set(-1.38 + move * 0.63, 0.18, 0.17 - move * 0.34);
        t.worker.arms[0].rotation.x = -move * 0.18; t.worker.arms[1].rotation.x = move * 0.18;
        t.frame.root.position.x = t.worker.root.position.x; t.frame.root.position.z = t.worker.root.position.z;
        t.frame.set(i === 1 ? detection : 0, ack > 0.6);
        t.cam.pan.rotation.y = -0.37 + (i === 1 ? detection * 0.13 : 0);
        t.unseen.set(move > 0.4 && i === 0, false);
        t.message.line.visible = i === 1;
        t.message.set(notification, i === 1 && phase === 2);
        t.alarm.set(i === 1 && phase >= 2 ? (ack > 0.6 ? 0 : 2) : -1);
        t.verified.set(i === 1 && phase >= 2, ack > 0.6);
        t.station.displays.forEach((display, j) => { display.status.material = i === 1 && detection > 0.4 && j === 0 ? (ack > 0.6 ? M.green : M.red) : M.green; display.screen.material = i === 1 && phase >= 2 && j === 0 && ack < 0.6 ? M.red : M.screen; });
        t.operator.head.rotation.y = i === 0 ? -0.39 * move : 0.25 * ack;
        t.operator.arms[1].rotation.x = i === 1 ? -ack * 0.91 : -0.14;
        t.station.button.position.y = 1.067 - (i === 1 ? ack : 0) * 0.017;
        t.station.button.material = i === 1 && ack > 0.6 ? M.green : M.cyan;
      });
    };
  } else if (kind === 'mobile-fixed') {
    camera.target = [0, 1.3, 0]; camera.distance = 14.8; camera.yaw = 0.28;
    platform(root, -3.77, -0.02, 3.4, 5.83, 'mobile-inspection-area');
    platform(root, 3.58, -0.02, 3.8, 5.83, 'existing-building-area');
    const mobile = group(root, 'mobile-camera-cart', -3.88, 0.19, 1.68);
    box(mobile, 0, 0.18, 0, 0.82, 0.21, 0.79, M.dark, 'mobile-cart-base');
    const wheels = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) wheels.push(cyl(mobile, sx * 0.47, 0.13, sz * 0.27, 0.15, 0.09, M.rubber, 'x', 'mobile-cart-wheel'));
    cyl(mobile, 0, 1.27, 0, 0.047, 2.05, M.steel, 'y', 'telescoping-mast');
    cyl(mobile, 0, 0.82, 0, 0.066, 0.23, M.dark);
    box(mobile, 0, 0.48, -0.17, 0.35, 0.43, 0.23, M.black, 'mobile-battery');
    const mobileCam = cctv(mobile, 0, 2.31, 0, -0.24);
    pallet(root, -3.7, -2.1, 1.11);
    const entrance = doorFrame(root, 3.82, -1.45, 1.35);
    const fixed = cctv(root, 2.65, 2.77, -1.13, 0.23);
    box(root, 2.59, 2.62, -1.39, 0.24, 0.36, 0.11, M.steel, 'existing-wall-camera-bracket');
    const entrant = person(root, 3.84, 1.47, { scale: 0.84 }); entrant.root.rotation.y = PI;
    const phone = box(entrant.arms[1], 0, -0.45, 0.06, 0.17, 0.28, 0.035, M.cyan, 'field-operator-notification');
    const server = group(root, 'single-integration-server', 0, 0.08, -0.08);
    box(server, 0, 1.19, 0, 1.18, 2.38, 1.0, M.black, 'server-rack');
    box(server, 0, 2.4, 0, 1.27, 0.1, 1.07, M.steel);
    const serverLeds = [];
    for (let i = 0; i < 7; i++) {
      box(server, 0, 0.29 + i * 0.29, 0.514, 0.99, 0.205, 0.055, M.dark, 'rack-compute-unit');
      box(server, -0.06, 0.29 + i * 0.29, 0.547, 0.58, 0.025, 0.025, M.black);
      serverLeds.push(box(server, 0.37, 0.29 + i * 0.29, 0.552, 0.055, 0.045, 0.025, M.cyan));
    }
    const leftMessage = route(root, [[-3.88, 0.3, 0.56], [-2.36, 0.32, 0.5], [-1.12, 0.42, 0.33], [-0.47, 1.05, 0.45]]);
    const rightMessage = route(root, [[2.63, 2.74, -1.1], [2.03, 1.72, -0.5], [1.16, 0.64, 0.34], [0.47, 1.36, 0.45]]);
    const leftAck = statusMarker(root, -0.4, 2.88, 0.49, 0.17);
    const rightAck = statusMarker(root, 0.4, 2.88, 0.49, 0.17);
    const notification = route(root, [[0.5, 1.6, 0.5], [1.8, 1.7, 0.4], [3.65, 1.25, -0.16]]);
    label('이동형 카메라', -3.84, 3.41, 0.09);
    label('고정형 카메라', 3.57, 3.58, -1.2);
    label('통합 서버', 0, 3.41, 0.4);
    label('현장 담당자 알림', 4.05, 2.1, 0.4);
    updateScene = (phase, time, reduced) => {
      const p = progression(phase, time, reduced), travel = p(1, 0, 1.8), leftPacket = p(2, 0, 1.45), rightPacket = p(2, 0.35, 1.45), ack = p(3);
      mobile.position.z = 1.68 - travel * 1.15;
      wheels.forEach(wheel => { wheel.rotation.x = -travel * 1.15 / 0.15; });
      mobileCam.pan.rotation.y = -0.24 + travel * 0.49;
      fixed.pan.rotation.y = 0.23 - travel * 0.18;
      entrant.root.position.z = 1.47 - travel * 1.63;
      entrant.arms[0].rotation.x = travel * 0.17; entrant.arms[1].rotation.x = -travel * 0.17 - ack * 1.1;
      entrant.head.rotation.y = ack * -0.35; phone.visible = phase === 3;
      notification.set(p(3, 0, 1), phase === 3);
      entrance.door.position.x = travel * 0.64;
      leftMessage.set(leftPacket, phase === 2); rightMessage.set(rightPacket, phase === 2);
      leftAck.set(phase >= 2, ack > 0.65);
      rightAck.set(phase >= 2, ack > 0.65);
      serverLeds.forEach((led, i) => { led.material = (i < 3 ? leftPacket : rightPacket) > 0.99 || ack > 0.2 ? M.green : M.cyan; });
    };
  } else if (kind === 'safety') {
    camera.yaw = 0.22; camera.pitch = 0.61; camera.distance = 14.4;
    const hazards = ['ppe', 'leak', 'fire'].map((type, i) => {
      const x = -3.88 + i * 3.88;
      const zone = platform(root, x, -0.82, 3.59, 3.86, `safety-zone-${type}`);
      const h = hazard(zone, type, 0, 0, 1.04);
      const cam = cctv(zone, 1.25, 2.36, -1.16, -0.43); cam.root.scale.setScalar(0.73);
      box(zone, 1.27, 1.2, -1.27, 0.08, 2.05, 0.08, M.steel);
      return h;
    });
    const alarm = beacon(root, -0.51, 2.0, 2.08);
    const cabinet = group(root, 'acknowledgement-console', 0.38, 0.13, 2.04);
    box(cabinet, 0, 0.62, 0, 0.56, 1.14, 0.47, M.dark);
    const consoleScreen = box(cabinet, 0, 1.19, 0.17, 0.42, 0.16, 0.05, M.screen); consoleScreen.rotation.x = -0.28;
    const ackButton = cyl(cabinet, 0.1, 1.185, 0.08, 0.055, 0.035, M.cyan);
    const operator = person(root, 1.18, 2.32, { scale: 0.88 }); operator.root.rotation.y = -0.83;
    const checked = statusMarker(root, 0.03, 2.71, 2.04, 0.2);
    const messages = [-3.88, 0, 3.88].map(x => route(root, [[x, 0.29, 0.66], [x * 0.81, 0.3, 1.35], [x * 0.33, 0.35, 1.65], [-0.3, 1.28, 2.0]]));
    label('보호구', -3.88, 3.22, -0.86);
    label('누액', 0, 2.79, -0.86);
    label('화재', 3.88, 2.87, -0.86);
    label('담당 확인', 0.2, 3.25, 2.05);
    updateScene = (phase, time, reduced) => {
      const p = progression(phase, time, reduced), risk = p(1, 0, 1.7), ack = p(3, 0.25, 1.3);
      hazards.forEach((h, i) => {
        h.animate(risk);
        h.frame.set(p(2, i * 0.19, 0.65), ack > 0.7);
        h.marker.set(phase >= 2, ack > 0.7);
        messages[i].set(p(2, 0.28 + i * 0.19, 1.2), phase === 2);
      });
      alarm.set(phase >= 2 ? (ack > 0.7 ? 0 : 2) : -1);
      consoleScreen.material = phase >= 2 && ack < 0.7 ? M.red : M.screen;
      checked.set(phase >= 2, ack > 0.7);
      operator.head.rotation.y = ack * -0.2;
      operator.arms[0].rotation.x = -ack * 0.78;
      operator.arms[0].rotation.z = -0.07 - ack * 0.21;
      ackButton.position.y = 1.185 - ack * 0.017;
      ackButton.material = ack > 0.7 ? M.green : M.cyan;
    };
  } else {
    camera.yaw = 0.15; camera.pitch = 0.66; camera.distance = 14.4;
    const xs = [-4.2, -1.4, 1.4, 4.2];
    const factories = xs.map((x, i) => {
      const p = platform(root, x, -1.53, 2.54, 2.97, `connected-factory-zone-${i}`);
      if (i === 0) machine(p, 0, -0.12, 0.73);
      else if (i === 1) pump(p, 0, -0.06, 0.91);
      else if (i === 2) {
        for (const offset of [-0.4, 0.4]) {
          cyl(p, offset, 0.93, -0.08, 0.31, 1.41, M.steel);
          const cap = ball(p, offset, 1.64, -0.08, 0.31, M.dark); cap.scale.y = 0.13;
          cyl(p, offset, 1.91, -0.08, 0.049, 0.44, M.steel);
        }
        rod(p, [-0.4, 0.68, 0.27], [0.4, 0.68, 0.27], 0.065, M.steel);
      } else {
        pallet(p, -0.42, -0.52, 0.91); pallet(p, 0.46, -0.06, 0.83);
        box(p, 0, 0.21, 0.9, 1.8, 0.027, 0.03, M.amber);
      }
      const cam = cctv(p, 0.82, 2.14, -0.99, -0.33); cam.root.scale.setScalar(0.67);
      box(p, 0.85, 1.18, -1.06, 0.08, 2.01, 0.08, M.dark);
      const marker = statusMarker(p, 0, 2.59, -0.07, 0.17);
      const frame = detectionFrame(p, 0, 1.02, -0.13, 1.67, 1.63, 1.19);
      return { root: p, cam, marker, frame };
    });
    const station = desk(root, 0, 1.04, 1.28, 2);
    const operator = person(root, 0, 2.38, { seated: true, helmet: false, vest: false, scale: 1.02 }); operator.root.rotation.y = PI;
    const alarm = beacon(root, 2.04, 1.12, 1.97);
    const server = box(root, -2.12, 0.74, 1.07, 0.61, 1.36, 0.8, M.black, 'desk-edge-server');
    for (let i = 0; i < 4; i++) box(root, -2.12, 0.36 + i * 0.25, 1.48, 0.46, 0.14, 0.024, M.dark);
    const messages = xs.map(x => route(root, [[x, 0.25, -0.02], [x * 0.72, 0.27, 0.18], [x * 0.31, 0.33, 0.42], [0, 1.12, 0.72]]));
    const quadIndicators = [];
    station.displays.forEach(display => { for (const side of [-1, 1]) quadIndicators.push(box(display.root, side * 0.21, 0.12, 0.11, 0.31, 0.11, 0.025, M.cyan)); });
    const confirmation = statusMarker(root, -0.73, 2.42, 1.27, 0.21);
    label('현장 구역', 0, 3.29, -1.5);
    label('통합 관제', -1.04, 2.89, 1.26);
    label('담당 확인', 1.3, 2.79, 2.3);
    updateScene = (phase, time, reduced) => {
      const p = progression(phase, time, reduced), ack = p(3, 0.1, 1.6);
      factories.forEach((f, i) => {
        const detect = p(1, i * 0.2, 0.7), checked = p(3, 0.15 + i * 0.2, 0.75);
        f.frame.set(detect, checked > 0.8);
        f.marker.set(detect > 0.3, checked > 0.8);
        f.cam.pan.rotation.y = -0.33 + detect * 0.15;
        messages[i].set(p(2, i * 0.2, 1.3), phase === 2);
        quadIndicators[i].material = phase >= 2 ? (checked > 0.8 ? M.green : M.red) : M.cyan;
      });
      station.displays.forEach(display => { display.status.material = phase >= 2 && ack < 0.8 ? M.amber : M.green; });
      alarm.set(phase >= 2 ? (ack > 0.8 ? 0 : 1) : -1);
      confirmation.set(phase >= 2, ack > 0.8);
      operator.head.rotation.y = ack * 0.22;
      operator.arms[1].rotation.x = -0.15 - ack * 0.81;
      station.button.position.y = 1.067 - ack * 0.017;
      station.button.material = ack > 0.8 ? M.green : M.cyan;
      server.material = M.black;
    };
  }

  function update({ phase = 0, time = 0, delta = 0, reducedMotion = false } = {}) {
    // No accumulated state: jumping backward or seeking yields the same pose.
    const currentPhase = Math.max(0, Math.min(3, Math.floor(Number.isFinite(phase) ? phase : 0)));
    const elapsed = Math.max(0, Number.isFinite(time) ? time : 0);
    updateScene(currentPhase, elapsed, Boolean(reducedMotion));
    root.userData.phase = currentPhase;
    root.userData.elapsed = elapsed;
    root.updateMatrixWorld(true);
    void delta;
  }
  root.userData.conceptual = true;
  root.userData.front = '+z';
  root.userData.acknowledgementIsNotHazardResolution = true;
  update();
  return { root, update, labels, camera };
}
