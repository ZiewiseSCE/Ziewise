/**
 * Native Three.js industrial process assets. The caller supplies THREE, lighting,
 * renderer and elapsed seconds within each phase. No DOM, timers or dependencies.
 * Every phase is seekable; reduced motion shows its completed causal state.
 * Bounds: X +/-6, Y 0..4, Z +/-3.5. The readable/front side faces +Z.
 */
export function createSystemsModel(THREE, kind = 'core') {
  const builders = { core, learning, custom, architecture, esg, roadmap, solutions, products };
  if (!Object.prototype.hasOwnProperty.call(builders, kind)) {
    throw new RangeError(`Unknown systems model: ${kind}`);
  }
  const c = context(THREE, kind);
  const scene = builders[kind](c);
  const update = ({ phase = 0, time = 0, reducedMotion = false } = {}) => {
    const p = Math.max(0, Math.min(3, Math.floor(Number(phase) || 0)));
    const t = Math.max(0, Number(time) || 0);
    const progress = reducedMotion ? 1 : Math.min(1, t / 3.4);
    scene.update(p, progress, reducedMotion ? 0 : t, reducedMotion);
    c.root.updateMatrixWorld(true);
  };
  update();
  return {
    root: c.root,
    update,
    labels: scene.labels.map(([text, x, y, z]) => ({ text, position: new THREE.Vector3(x, y, z) })),
    camera: { target: [0, 1, 0], distance: 14, yaw: 0.6, pitch: 0.6 }
  };
}

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = v => { const x = clamp(v); return x * x * (3 - 2 * x); };
const during = (p, a, b) => ease((p - a) / (b - a));

function context(T, kind) {
  const root = new T.Group();
  root.name = `process-system-${kind}`;
  const m = {};
  const palette = {
    navy: [0x15283f, 0.68, 0.38], dark: [0x081827, 0.5, 0.5],
    steel: [0x627d98, 0.76, 0.35], edge: [0x2f5068, 0.7, 0.35],
    pale: [0xc0d8e5, 0.3, 0.53], cyan: [0x41d9ef, 0.35, 0.32],
    amber: [0xffbb58, 0.28, 0.36], red: [0xf2676d, 0.2, 0.4],
    green: [0x62e7ad, 0.25, 0.36], glass: [0x63d4ed, 0.1, 0.2]
  };
  for (const [key, [color, metalness, roughness]] of Object.entries(palette)) {
    const glowing = ['cyan', 'amber', 'red', 'green'].includes(key);
    m[key] = new T.MeshStandardMaterial({
      color, metalness, roughness,
      emissive: glowing ? color : 0x000000,
      emissiveIntensity: glowing ? 0.35 : 0,
      transparent: key === 'glass', opacity: key === 'glass' ? 0.16 : 1,
      depthWrite: key !== 'glass'
    });
  }
  const geo = {
    box: new T.BoxGeometry(1, 1, 1), cylinder: new T.CylinderGeometry(1, 1, 1, 16),
    ball: new T.SphereGeometry(1, 12, 8), ring: new T.TorusGeometry(1, 0.1, 6, 24)
  };
  const group = (name, x = 0, y = 0, z = 0, parent = root) => {
    const g = new T.Group(); g.name = name; g.position.set(x, y, z); parent.add(g); return g;
  };
  function mesh(parent, geometry, mat, x, y, z, sx, sy, sz, name = '') {
    const o = new T.Mesh(geometry, typeof mat === 'string' ? m[mat] : mat);
    o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.name = name;
    o.castShadow = !o.material.transparent; o.receiveShadow = true;
    parent.add(o); return o;
  }
  const box = (g, x, y, z, w, h, d, mat = 'navy', name) => mesh(g, geo.box, mat, x, y, z, w, h, d, name);
  const ball = (g, x, y, z, r, mat = 'cyan') => mesh(g, geo.ball, mat, x, y, z, r, r, r);
  function cyl(g, x, y, z, r, h, mat = 'steel', axis = 'y') {
    const o = mesh(g, geo.cylinder, mat, x, y, z, r, h, r);
    if (axis === 'z') o.rotation.x = Math.PI / 2;
    if (axis === 'x') o.rotation.z = Math.PI / 2;
    return o;
  }
  function ring(g, x, y, z, r, mat = 'cyan', axis = 'z') {
    const o = mesh(g, geo.ring, mat, x, y, z, r, r, r);
    if (axis === 'y') o.rotation.x = Math.PI / 2;
    if (axis === 'x') o.rotation.y = Math.PI / 2;
    return o;
  }
  function segment(g, a, b, radius = 0.035, mat = 'edge') {
    const from = new T.Vector3(...a), to = new T.Vector3(...b);
    const direction = to.clone().sub(from);
    const o = cyl(g, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2,
      radius, direction.length(), mat);
    o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize());
    return o;
  }
  function channel(points, color = 'cyan', packetCount = 3, parent = root) {
    const path = points.map(p => new T.Vector3(...p));
    const lengths = [], total = path.slice(1).reduce((sum, p, i) => {
      segment(parent, points[i], points[i + 1], 0.045, 'edge');
      const length = p.distanceTo(path[i]); lengths.push(length); return sum + length;
    }, 0);
    const packets = Array.from({ length: packetCount }, () => ball(parent, 0, 0, 0, 0.085, color));
    function place(o, ratio) {
      let d = clamp(ratio) * total;
      for (let i = 0; i < lengths.length; i++) {
        if (d <= lengths[i] || i === lengths.length - 1) {
          o.position.copy(path[i]).lerp(path[i + 1], clamp(d / lengths[i])); break;
        }
        d -= lengths[i];
      }
    }
    return {
      packets,
      // One finite delivery wave makes source -> destination causality visible.
      update(progress, active = true, reduced = false) {
        packets.forEach((o, i) => {
          o.visible = active;
          place(o, reduced ? 0.65 + i * 0.1 : clamp(progress * 1.36 - i * 0.18));
        });
      }
    };
  }
  function platform(g, w = 1.7, d = 1.4) {
    box(g, 0, 0.2, 0, w, 0.18, d, 'steel');
    box(g, 0, 0.31, 0, w - 0.08, 0.06, d - 0.08, 'dark');
  }
  function indicator(g, x, y, z, color = 'amber') {
    const o = ball(g, x, y, z, 0.085, color); return o;
  }
  function screen(g, x, y, z, w = 0.9, h = 0.58) {
    box(g, x, y, z, w + 0.1, h + 0.1, 0.12, 'steel');
    box(g, x, y, z + 0.073, w, h, 0.025, 'dark');
    for (let i = 0; i < 3; i++) box(g, x - w * 0.12, y + h * (0.25 - i * 0.25), z + 0.091,
      w * (0.62 - i * 0.12), 0.035, 0.018, i === 2 ? 'amber' : 'cyan');
  }
  function rack(name, x, z, levels = 4, width = 1.35, height = 2.7) {
    const g = group(name, x, 0, z); platform(g, width + 0.24, 1.2);
    box(g, 0, height / 2 + 0.34, -0.1, width, height, 0.95, 'dark');
    for (const side of [-1, 1]) box(g, side * width * 0.49, height / 2 + 0.34, 0.44, 0.07, height, 0.12, 'steel');
    const trays = [], lamps = [];
    for (let i = 0; i < levels; i++) {
      const y = 0.6 + i * (height - 0.3) / levels;
      const tray = box(g, 0, y, 0.47, width - 0.16, 0.35, 0.14, 'navy'); trays.push(tray);
      for (let k = 0; k < 4; k++) box(g, -width * 0.29 + k * 0.14, y, 0.553, 0.045, 0.2, 0.025, 'edge');
      lamps.push(indicator(g, width * 0.33, y, 0.57, 'amber'));
    }
    box(g, 0, height + 0.35, -0.03, width + 0.08, 0.09, 1.1, 'steel');
    return { g, lamps, trays };
  }
  function camera(name, x, z, y = 2.15) {
    const g = group(name, x, 0, z); platform(g, 0.85, 0.85);
    cyl(g, 0, y / 2 + 0.2, -0.18, 0.06, y - 0.15);
    box(g, 0, y, -0.02, 0.55, 0.35, 0.52, 'pale');
    cyl(g, 0, y, 0.32, 0.15, 0.25, 'dark', 'z');
    cyl(g, 0, y, 0.465, 0.11, 0.025, 'cyan', 'z');
    const lamp = indicator(g, 0.23, y + 0.05, 0.25, 'cyan');
    const scan = box(g, 0, 0.52, 0.88, 0.73, 0.022, 0.06, 'cyan');
    return { g, lamp, scan };
  }
  function sensor(name, x, z) {
    const g = group(name, x, 0, z); platform(g, 0.95, 0.9);
    cyl(g, 0, 0.69, 0, 0.16, 0.65, 'steel');
    cyl(g, 0, 1.06, 0, 0.28, 0.2, 'navy');
    cyl(g, 0, 1.19, 0, 0.22, 0.06, 'cyan');
    const lamp = indicator(g, 0, 0.87, 0.18, 'cyan'); return { g, lamp };
  }
  function desk(name, x, z) {
    const g = group(name, x, 0, z); platform(g, 1.6, 1.4);
    for (const side of [-1, 1]) box(g, side * 0.59, 0.82, 0, 0.09, 1, 0.85, 'steel');
    box(g, 0, 1.34, 0, 1.55, 0.13, 1.05, 'navy');
    box(g, 0, 1.72, -0.29, 0.08, 0.6, 0.09, 'steel');
    screen(g, 0, 2.07, -0.25, 1.02, 0.65);
    box(g, 0, 1.42, 0.22, 0.8, 0.045, 0.3, 'edge');
    return { g, lamp: indicator(g, 0.62, 2.4, -0.16, 'amber') };
  }
  function crate(parent, x, y, z, size = 0.56, mat = 'steel') {
    const g = group('sample-or-product', x, y, z, parent);
    box(g, 0, 0, 0, size, size * 0.7, size, mat);
    for (const side of [-1, 1]) box(g, side * size * 0.31, 0, size * 0.508, size * 0.1, size * 0.72, 0.023, 'dark');
    box(g, 0, size * 0.36, 0, size * 0.9, 0.025, size * 0.9, 'edge');
    return g;
  }
  function belt(parent, x, z, length = 1.8) {
    const g = group('conveyor', x, 0, z, parent);
    box(g, 0, 0.68, 0, length, 0.18, 0.8, 'navy');
    for (const side of [-1, 1]) {
      box(g, 0, 0.81, side * 0.45, length + 0.1, 0.12, 0.075, 'steel');
      box(g, side * (length * 0.36), 0.43, 0, 0.085, 0.6, 0.64, 'steel');
    }
    for (let i = 0; i < 7; i++) cyl(g, -length * 0.43 + i * length * 0.143, 0.8, 0, 0.065, 0.8, 'edge', 'z');
    return g;
  }
  function machine(name, x, z, s = 1) {
    const g = group(name, x, 0, z); g.scale.setScalar(s); platform(g, 1.75, 1.6);
    box(g, 0, 0.76, -0.1, 1.36, 0.78, 1.12, 'navy');
    for (const side of [-1, 1]) box(g, side * 0.62, 1.6, -0.43, 0.14, 1.32, 0.17, 'steel');
    box(g, 0, 2.24, -0.43, 1.5, 0.18, 0.3, 'edge');
    const head = group('machine-moving-tool', 0, 1.86, -0.22, g);
    cyl(head, 0, 0, 0, 0.15, 0.53, 'steel');
    cyl(head, 0, -0.3, 0, 0.07, 0.19, 'cyan');
    const lamp = indicator(g, 0.61, 2.43, -0.4, 'amber');
    screen(g, 0.43, 0.78, 0.5, 0.38, 0.3);
    return { g, head, lamp };
  }
  function person(parent, x, z) {
    const g = group('worker', x, 0.3, z, parent);
    ball(g, 0, 1.18, 0, 0.15, 'pale');
    cyl(g, 0, 1.3, 0, 0.18, 0.12, 'amber');
    box(g, 0, 0.79, 0, 0.35, 0.49, 0.22, 'amber');
    for (const side of [-1, 1]) {
      box(g, side * 0.12, 0.35, 0, 0.1, 0.47, 0.13, 'navy');
      box(g, side * 0.25, 0.81, 0, 0.1, 0.46, 0.12, 'pale');
    }
    return g;
  }
  function gate(name, x, z, width = 1.35) {
    const g = group(name, x, 0, z);
    for (const side of [-1, 1]) box(g, side * width / 2, 1.14, 0, 0.11, 1.72, 0.16, 'steel');
    const hinge = group('barrier-hinge', -width / 2, 1.37, 0, g);
    const bar = box(hinge, width / 2, 0, 0, width, 0.09, 0.12, 'amber');
    const lamp = indicator(g, width / 2, 2.12, 0, 'amber');
    return { g, hinge, bar, lamp };
  }
  function status(object, color) { object.material = m[color]; }
  function mark(parent, x, y, z, color = 'green') {
    const g = group('validation-check', x, y, z, parent);
    segment(g, [-0.18, 0, 0], [-0.03, -0.13, 0], 0.045, color);
    segment(g, [-0.03, -0.13, 0], [0.24, 0.2, 0], 0.045, color);
    return g;
  }
  box(root, 0, 0.075, 0, 11.65, 0.15, 6.65, 'dark', 'digital-twin-plinth');
  for (let x = -5; x <= 5; x++) box(root, x, 0.157, 0, 0.013, 0.008, 6.3, 'edge');
  for (let z = -3; z <= 3; z++) box(root, 0, 0.157, z, 11.3, 0.008, 0.013, 'edge');
  for (const x of [-5.77, 5.77]) box(root, x, 0.19, 0, 0.026, 0.05, 6.3, 'cyan');
  return { T, root, m, group, box, ball, cyl, ring, segment, channel, platform, indicator,
    screen, rack, camera, sensor, desk, crate, belt, machine, person, gate, status, mark };
}

function core(c) {
  const { root, group, box, camera, sensor, rack, screen, channel, status, mark } = c;
  const cam = camera('existing-camera-input', -4.45, -1.75, 2.05);
  const sen = sensor('machine-sensor-input', -4.45, 0.15);
  const dcs = rack('existing-DCS-controller', -4.45, 2, 2, 1, 1.7);
  const inference = group('layered-inference-hardware', -0.55, 0, 0);
  c.platform(inference, 2.15, 2.25);
  for (const x of [-0.85, 0.85]) for (const z of [-0.82, 0.82]) box(inference, x, 1.72, z, 0.08, 2.7, 0.08, 'steel');
  const boards = [], chips = [];
  for (let i = 0; i < 4; i++) {
    const layer = group(`inference-layer-${i}`, 0, 0.68 + i * 0.59, 0, inference);
    box(layer, 0, 0, 0, 1.78, 0.09, 1.74, 'edge');
    box(layer, 0, 0.14, 0, 0.69, 0.21, 0.68, 'dark');
    chips.push(box(layer, 0, 0.26, 0, 0.47, 0.04, 0.46, 'cyan'));
    for (let k = 0; k < 4; k++) box(layer, -0.62 + k * 0.41, 0.08, 0.65, 0.22, 0.09, 0.23, 'navy');
    boards.push(layer);
  }
  box(inference, 0, 3.03, 0, 1.99, 0.12, 1.98, 'navy');
  const inputPaths = [-1.75, 0.15, 2].map(z => channel([[-3.9, 0.57, z], [-2.6, 0.57, z], [-2.6, 0.57, 0], [-1.45, 0.57, 0]]));
  const vertical = channel([[-0.55, 0.7, 0.88], [-0.55, 2.72, 0.88]], 'cyan', 4);
  const outputs = [], checks = [], outputPaths = [];
  for (let i = 0; i < 3; i++) {
    const z = -2.1 + i * 2.1;
    const g = group(['inspection-result', 'safety-result', 'operations-result'][i], 3.65, 0, z);
    c.platform(g, 1.95, 1.6); box(g, 0, 0.99, 0, 1.34, 1.27, 0.76, 'navy');
    screen(g, 0, 1.27, 0.44, 0.95, 0.59);
    checks.push(mark(g, 0, 0.68, 0.46));
    outputs.push(c.indicator(g, 0.72, 1.81, 0, 'amber'));
    outputPaths.push(channel([[0.52, 0.55, 0], [1.85, 0.55, 0], [1.85, 0.55, z], [2.65, 0.55, z]], 'green'));
  }
  return {
    labels: [['현장 입력', -4.4, 3.3, 0], ['다층 AI 추론', -0.55, 3.6, 0], ['검사·안전·운영', 3.65, 2.6, 0]],
    update(p, u, t, reduced) {
      const input = p === 0 ? u : p > 0 ? 1 : 0;
      cam.scan.position.z = lerp(0.5, 1.2, input);
      status(cam.lamp, p > 0 || u > 0.6 ? 'green' : 'cyan');
      status(sen.lamp, p > 0 || u > 0.4 ? 'green' : 'cyan');
      dcs.lamps.forEach(l => status(l, p > 0 ? 'green' : 'cyan'));
      inputPaths.forEach((flow, i) => flow.update(during(u, i * 0.12, 0.8 + i * 0.08), p === 1, reduced));
      vertical.update(u, p === 2, reduced);
      boards.forEach((board, i) => {
        const done = p > 2 || (p === 2 && u > (i + 1) / 5);
        status(chips[i], done ? 'green' : p === 2 ? 'amber' : 'cyan');
        board.position.z = p === 2 ? 0.14 * Math.sin(during(u, i * 0.15, i * 0.15 + 0.45) * Math.PI) : 0;
      });
      outputs.forEach((lamp, i) => {
        const step = during(u, i * 0.18, i * 0.18 + 0.56);
        outputPaths[i].update(step, p === 3, reduced);
        checks[i].visible = p === 3 && step > 0.75;
        status(lamp, checks[i].visible ? 'green' : 'amber');
      });
    }
  };
}

function learning(c) {
  const { root, group, box, rack, channel, status } = c;
  const table = group('sample-collection-and-labeling', -4.35, 0, 0);
  c.platform(table, 1.9, 2.55); box(table, 0, 0.74, 0, 1.73, 0.18, 2.3, 'navy');
  const tiles = [], tags = [];
  for (let i = 0; i < 6; i++) {
    const x = -0.48 + (i % 2) * 0.96, z = -0.71 + Math.floor(i / 2) * 0.72;
    const tile = group(`collected-sample-${i}`, x, 0.98, z, table);
    box(tile, 0, 0, 0, 0.67, 0.18, 0.5, 'steel');
    c.cyl(tile, 0, 0.15, 0, 0.16, 0.13, i === 4 ? 'amber' : 'navy');
    tags.push(box(tile, 0.25, 0.16, 0.21, 0.22, 0.045, 0.1, 'green')); tiles.push(tile);
  }
  const server = rack('model-training-server', -1.75, -0.1, 4, 1.28, 2.55);
  const gate = c.gate('model-validation-gate', 1.16, 0.5, 1.52);
  c.belt(root, 1.16, 0.6, 1.72);
  const module = group('candidate-trained-model', -1.75, 2.1, 0.88);
  box(module, 0, 0, 0, 0.66, 0.36, 0.62, 'navy');
  box(module, 0, 0.2, 0, 0.42, 0.04, 0.39, 'cyan');
  const validationCheck = c.mark(root, 1.15, 2.54, 0.55);
  const deploy = rack('production-deployment-server', 4.05, 0, 3, 1.5, 2.45);
  const old = box(deploy.g, 0, 1.2, 0.59, 1.17, 0.36, 0.3, 'amber', 'previous-model-cartridge');
  const deployed = box(deploy.g, 0, 1.78, 1.12, 1.17, 0.36, 0.62, 'cyan', 'new-model-cartridge');
  const oldTray = group('previous-model-parking-slot', 4.05, 0, 2.15);
  c.platform(oldTray, 1.5, 0.9);
  const samples = channel([[-3.42, 0.91, 0], [-2.72, 0.91, 0], [-2.45, 1.75, 0.5]], 'cyan', 4);
  const delivery = channel([[1.95, 0.47, 0.65], [2.85, 0.47, 0.65], [3.28, 0.47, 0]], 'green', 3);
  return {
    labels: [['표본·라벨', -4.35, 2.15, 0], ['모델 학습', -1.75, 3.42, 0], ['검증 통과', 1.16, 3.05, 0.55], ['현장 배포', 4.05, 3.25, 0]],
    update(p, u, t, reduced) {
      tiles.forEach((tile, i) => {
        const acquired = p > 0 ? 1 : during(u, i * 0.085, i * 0.085 + 0.35);
        tile.position.y = lerp(1.65, 0.98, acquired); tile.visible = p > 0 || u > i * 0.085;
        tags[i].visible = p > 0 || u > 0.45 + i * 0.08;
      });
      samples.update(u, p === 1, reduced);
      server.lamps.forEach((lamp, i) => status(lamp,
        p > 1 || (p === 1 && u > i * 0.18 + 0.25) ? 'green' : 'amber'));
      module.visible = p === 1 ? u > 0.76 : p === 2;
      if (p <= 1) module.position.set(-1.75, 2.1, 0.88);
      else module.position.set(lerp(-1.15, 1.25, during(u, 0, 0.52)), lerp(1.7, 1.05, during(u, 0, 0.5)), 0.72);
      const approved = p > 2 || (p === 2 && u > 0.64);
      const opened = p > 2 ? 1 : p === 2 ? during(u, 0.64, 0.86) : 0;
      gate.hinge.rotation.z = opened * Math.PI * 0.46;
      status(gate.lamp, approved ? 'green' : p === 2 ? 'amber' : 'red');
      status(gate.bar, approved ? 'green' : 'amber'); validationCheck.visible = approved;
      delivery.update(during(u, 0.1, 0.6), p === 3, reduced);
      const swapped = p === 3 ? during(u, 0.12, 0.66) : 0;
      old.position.set(0, lerp(1.2, 0.52, swapped), lerp(0.59, 2.15, swapped));
      deployed.visible = p === 3;
      deployed.position.set(0, 1.78, lerp(1.8, 0.59, during(u, 0.55, 1)));
      deploy.lamps.forEach(lamp => status(lamp, p === 3 && u > 0.9 ? 'green' : 'amber'));
    }
  };
}

function custom(c) {
  const { root, group, box, channel, status } = c;
  const source = c.machine('customer-specific-machine', -4.3, 0.25, 0.86);
  const sample = c.crate(root, -4.3, 1.09, 0.3, 0.53, 'pale');
  const desk = c.desk('engineer-configuration-workstation', -1.52, -0.35);
  c.person(root, -1.62, 1.36);
  const profiles = [];
  for (let i = 0; i < 3; i++) {
    const profile = group(`configuration-profile-${i}`, -1.99 + i * 0.47, 1.62, 0.24);
    box(profile, 0, 0, 0, 0.34, 0.05, 0.49, i === 1 ? 'cyan' : 'steel');
    for (let j = 0; j < 3; j++) box(profile, -0.1 + j * 0.1, 0.04, (j - 1) * 0.09, 0.025, 0.03, 0.28, 'edge');
    profiles.push(profile);
  }
  const trial = c.machine('configured-trial-cell', 1.25, 0.08, 0.92);
  const clampLeft = box(trial.g, -0.5, 1.29, 0.21, 0.2, 0.23, 0.42, 'steel');
  const clampRight = box(trial.g, 0.5, 1.29, 0.21, 0.2, 0.23, 0.42, 'steel');
  c.crate(trial.g, 0, 1.25, 0.18, 0.43, 'pale');
  const trialCheck = c.mark(trial.g, 0, 2.55, 0.25);
  const system = c.rack('factory-integration-controller', 4.05, -0.1, 3, 1.5, 2.5);
  const plug = box(root, 3.05, 0.71, 0.66, 0.32, 0.27, 0.43, 'cyan', 'integration-connector');
  const paths = [
    channel([[-3.52, 0.58, 0.25], [-2.67, 0.58, 0.25], [-2.3, 1.38, 0.18]]),
    channel([[-0.72, 0.5, -0.35], [0.05, 0.5, -0.35], [0.4, 0.5, 0.08]]),
    channel([[2.1, 0.49, 0.08], [2.8, 0.49, 0.08], [3.3, 0.71, 0.5]], 'green')
  ];
  return {
    labels: [['현장별 표본', -4.3, 2.8, 0.2], ['엔지니어 설정', -1.52, 3.12, -0.35], ['시험 셀', 1.25, 3.1, 0.1], ['시스템 연동', 4.05, 3.4, 0]],
    update(p, u, t, reduced) {
      source.head.position.y = p === 0 ? 1.86 - Math.sin(u * Math.PI) * 0.34 : 1.86;
      sample.position.x = p === 0 ? lerp(-4.3, -3.42, during(u, 0.55, 1)) : -3.42;
      status(source.lamp, p > 0 || u > 0.7 ? 'green' : 'amber');
      paths[0].update(u, p === 0, reduced);
      profiles.forEach((g, i) => {
        g.position.y = 1.62 + (p === 1 && i === 1 ? during(u, 0, 0.4) * 0.37 : 0);
        g.rotation.x = p === 1 && i === 1 ? -during(u, 0.25, 0.6) * 0.45 : 0;
      });
      status(desk.lamp, p > 1 || (p === 1 && u > 0.7) ? 'green' : 'amber');
      paths[1].update(during(u, 0.4, 1), p === 1, reduced);
      const grip = p === 2 ? Math.sin(u * Math.PI) : 0;
      clampLeft.position.x = -0.5 + 0.23 * grip; clampRight.position.x = 0.5 - 0.23 * grip;
      trial.head.position.y = 1.86 - 0.3 * grip;
      const passed = p > 2 || (p === 2 && u > 0.84);
      status(trial.lamp, passed ? 'green' : 'amber'); trialCheck.visible = passed;
      paths[2].update(during(u, 0.35, 1), p === 3, reduced);
      plug.position.x = p === 3 ? lerp(3.05, 3.4, during(u, 0, 0.35)) : 3.05;
      system.lamps.forEach(lamp => status(lamp, p === 3 && u > 0.7 ? 'green' : 'amber'));
    }
  };
}

function architecture(c) {
  const { root, group, box, channel, status } = c;
  const cam = c.camera('existing-industrial-camera', -4.5, -1.5, 2.35);
  const sen = c.sensor('existing-sensor-io', -4.5, 1.1);
  const edge = c.rack('local-edge-computing-rack', -1.85, 0, 3, 1.24, 2.1);
  // A physical local buffer, accelerator and existing system cabinets.
  const buffer = [];
  for (let i = 0; i < 4; i++) buffer.push(box(edge.g, -0.41 + i * 0.27, 2.58, 0.16, 0.17, 0.2, 0.45, 'edge'));
  const ai = c.rack('AI-inference-server', 1.13, 0, 5, 1.5, 2.9);
  const mes = c.rack('existing-MES-cabinet', 4.23, -1.7, 3, 1.28, 2.05);
  const erp = c.rack('existing-ERP-cabinet', 4.23, 1.6, 3, 1.28, 2.05);
  c.screen(mes.g, 0, 2.1, 0.58, 0.76, 0.37);
  c.screen(erp.g, 0, 2.1, 0.58, 0.76, 0.37);
  const channels = [
    channel([[-4.5, 0.35, -1.5], [-3.25, 0.35, -1.5], [-3.25, 0.35, 0], [-2.52, 0.35, 0]], 'cyan', 3),
    channel([[-4.5, 0.35, 1.1], [-3.25, 0.35, 1.1], [-3.25, 0.35, 0], [-2.52, 0.35, 0]], 'cyan', 3),
    channel([[-1.13, 0.44, 0.15], [-0.6, 0.44, 0.15], [-0.6, 1.35, 0.15], [0.34, 1.35, 0.15]], 'cyan', 4),
    channel([[1.96, 0.47, 0], [2.81, 0.47, 0], [2.81, 0.47, -1.7], [3.53, 0.47, -1.7]], 'green', 3),
    channel([[1.96, 0.47, 0], [2.81, 0.47, 0], [2.81, 0.47, 1.6], [3.53, 0.47, 1.6]], 'green', 3)
  ];
  const routeTray = group('protected-cable-tray', 0, 0, -2.75);
  box(routeTray, 0, 0.33, 0, 9.25, 0.08, 0.43, 'navy');
  for (let i = 0; i < 15; i++) box(routeTray, -4.4 + i * 0.63, 0.36, 0, 0.08, 0.09, 0.43, 'steel');
  c.segment(root, [-4.5, 0.42, -2.75], [4.23, 0.42, -2.75], 0.036, 'cyan');
  const acknowledgment = channel([[4.23, 0.48, -2.75], [1.13, 0.48, -2.75], [1.13, 0.48, -0.61]], 'green', 2);
  return {
    labels: [['기존 카메라·센서', -4.5, 3.38, 0], ['로컬 엣지', -1.85, 3.1, 0], ['AI 서버', 1.13, 3.8, 0], ['MES·ERP 연동', 4.23, 3.1, 0]],
    update(p, u, t, reduced) {
      cam.scan.position.z = lerp(0.5, 1.2, p === 0 ? u : 1);
      status(cam.lamp, p === 0 ? 'cyan' : 'green'); status(sen.lamp, p === 0 ? 'cyan' : 'green');
      channels[0].update(u, p === 0, reduced); channels[1].update(during(u, 0.1, 1), p === 0, reduced);
      buffer.forEach((o, i) => {
        const accepted = p > 1 || (p === 1 && u > i * 0.18);
        status(o, accepted ? 'cyan' : 'edge');
        o.position.y = p === 1 ? 2.58 + Math.sin(during(u, i * 0.12, 0.64 + i * 0.12) * Math.PI) * 0.15 : 2.58;
      });
      edge.lamps.forEach(l => status(l, p > 1 || (p === 1 && u > 0.55) ? 'green' : 'amber'));
      channels[2].update(during(u, 0.1, 0.92), p === 2, reduced);
      ai.lamps.forEach((l, i) => status(l, p > 2 || (p === 2 && u > 0.26 + i * 0.13) ? 'green' : 'amber'));
      channels[3].update(during(u, 0, 0.7), p === 3, reduced);
      channels[4].update(during(u, 0.12, 0.82), p === 3, reduced);
      acknowledgment.update(during(u, 0.7, 1), p === 3 && u > 0.7, reduced);
      [mes, erp].forEach((cabinet, i) => cabinet.lamps.forEach(l => status(l, p === 3 && u > 0.63 + i * 0.12 ? 'green' : 'amber')));
    }
  };
}

function esg(c) {
  const { root, group, box, channel, status } = c;
  const factory = c.machine('energy-monitored-factory-machine', -4.35, 0.74, 0.88);
  const solar = group('rooftop-solar-array', -4.2, 0, -1.84);
  c.platform(solar, 2, 1.3);
  for (const x of [-0.69, 0.69]) box(solar, x, 0.93, 0, 0.07, 1.25, 0.075, 'steel');
  const panel = group('solar-panel', 0, 1.58, 0, solar); panel.rotation.x = -0.24;
  box(panel, 0, 0, 0, 1.85, 0.08, 1.03, 'steel');
  for (let i = 0; i < 8; i++) box(panel, -0.69 + (i % 4) * 0.46, 0.06, -0.25 + Math.floor(i / 4) * 0.5, 0.41, 0.035, 0.44, 'navy');
  const meter = c.desk('energy-data-collection-meter', -1.65, -1.1);
  const worker = c.person(root, -1.65, 1.7);
  const guard = c.gate('safety-exception-barrier', -1.65, 0.9, 1.45);
  const stop = c.indicator(root, -1.65, 2.82, 0.98, 'red');
  const audit = c.rack('audit-record-aggregation', 1.13, -0.23, 4, 1.28, 2.35);
  const records = [];
  for (let i = 0; i < 4; i++) {
    const card = group(`traceable-event-record-${i}`, 1.13, 0.66 + i * 0.45, 1.24);
    box(card, 0, 0, 0, 0.82, 0.08, 0.61, 'pale');
    box(card, -0.25, 0.055, 0, 0.12, 0.02, 0.43, i === 1 ? 'amber' : 'cyan');
    records.push(card);
  }
  const report = group('ESG-report-assembly', 4.03, 0, 0.1); c.platform(report, 1.9, 1.85);
  box(report, 0, 0.88, 0, 1.62, 0.16, 1.5, 'navy');
  const pages = [];
  for (let i = 0; i < 4; i++) {
    const page = group(`report-evidence-page-${i}`, 0, 1.01 + i * 0.05, 0, report);
    box(page, 0, 0, 0, 1.15, 0.035, 1.28, 'pale');
    for (let row = 0; row < 3; row++) box(page, 0, 0.026, -0.32 + row * 0.29, 0.78 - row * 0.11, 0.018, 0.035, 'edge');
    pages.push(page);
  }
  const cover = group('closed-evidence-report-cover', 0, 1.28, 0, report);
  box(cover, 0, 0, 0, 1.25, 0.07, 1.36, 'navy');
  c.mark(cover, 0, 0.08, 0.05).rotation.x = -Math.PI / 2;
  const approval = c.mark(report, 0, 2.01, 0.1);
  const inputs = [
    channel([[-3.31, 0.44, -1.84], [-2.65, 0.44, -1.84], [-2.43, 0.69, -1.1]]),
    channel([[-3.57, 0.44, 0.74], [-2.69, 0.44, 0.74], [-2.69, 0.44, -1.1], [-2.43, 0.69, -1.1]])
  ];
  const event = channel([[-1.65, 0.42, 1.7], [0, 0.42, 1.7], [0.45, 0.66, 0.4]], 'amber', 2);
  const aggregation = channel([[-0.82, 0.51, -1.1], [-0.14, 0.51, -1.1], [0.45, 0.66, 0.4]], 'cyan', 3);
  const reporting = channel([[1.87, 0.47, 0], [2.5, 0.47, 0], [3.13, 0.9, 0]], 'green', 4);
  return {
    labels: [['에너지 수집', -4.25, 2.96, 0], ['안전 예외', -1.65, 3.28, 0.6], ['이력 집계', 1.13, 3.2, 0], ['ESG 보고', 4.03, 2.75, 0.1]],
    update(p, u, t, reduced) {
      inputs.forEach((f, i) => f.update(during(u, i * 0.1, 1), p === 0, reduced));
      status(meter.lamp, p > 0 || u > 0.76 ? 'green' : 'cyan');
      const exception = p === 1 && u > 0.38;
      worker.position.z = p === 1 ? lerp(2.43, 1.28, during(u, 0, 0.4)) : p > 1 ? 1.72 : 2.43;
      // A fixed safety boundary and warning only: this is not an automatic machine interlock.
      guard.hinge.rotation.z = 0;
      status(guard.lamp, exception ? 'red' : 'amber');
      status(guard.bar, 'amber'); stop.visible = exception;
      factory.head.position.y = p === 0 ? 1.86 - Math.sin(u * Math.PI) * 0.25 : 1.86;
      status(factory.lamp, 'green');
      event.update(during(u, 0.43, 1), p === 1 && exception, reduced);
      aggregation.update(u, p === 2, reduced);
      records.forEach((record, i) => {
        const inserted = p > 2 ? 1 : p === 2 ? during(u, i * 0.16, i * 0.16 + 0.46) : 0;
        record.visible = p >= 2; record.position.z = lerp(1.74, 0.38, inserted);
        status(audit.lamps[i], inserted > 0.9 ? 'green' : 'amber');
      });
      reporting.update(during(u, 0, 0.7), p === 3, reduced);
      pages.forEach((page, i) => {
        const assembled = during(u, i * 0.13, i * 0.13 + 0.39);
        page.visible = p === 3 && u >= i * 0.13;
        page.position.set(lerp(-1.2, 0, assembled), lerp(1.7, 1.01 + i * 0.05, assembled), 0);
      });
      cover.visible = p === 3 && u > 0.8;
      cover.position.y = lerp(1.78, 1.28, during(u, 0.8, 1));
      approval.visible = p === 3 && u > 0.97;
    }
  };
}

function roadmap(c) {
  const { root, group, box, channel, status } = c;
  const coordinates = [[-3.6, 0.1], [-0.95, 0.1], [2, -1.65], [2, 1.65]];
  const cells = coordinates.map(([x, z], i) => {
    const cell = c.machine(`validated-production-zone-${i + 1}`, x, z, 0.82);
    c.belt(cell.g, 0, 0.62, 1.72);
    const product = c.crate(cell.g, -0.55, 1.03, 0.61, 0.39, 'pale');
    const badge = c.mark(cell.g, 0, 2.72, 0.28);
    const foot = group(`zone-${i + 1}-footprint`, x, 0, z);
    for (const side of [-1, 1]) {
      box(foot, side * 0.97, 0.18, 0, 0.035, 0.028, 1.91, i ? 'edge' : 'cyan');
      box(foot, 0, 0.18, side * 0.955, 1.97, 0.028, 0.035, i ? 'edge' : 'cyan');
    }
    return { ...cell, product, badge };
  });
  const approval = c.desk('rollout-validation-console', -0.63, -2.19); approval.g.scale.setScalar(0.72);
  const progressBars = [];
  for (let i = 0; i < 4; i++) progressBars.push(box(root, 4.53, 0.72 + i * 0.4, -0.05, 0.86, 0.19, 0.75, 'edge'));
  const cabinet = group('deployment-orchestration-hub', 4.53, 0, 0);
  c.platform(cabinet, 1.35, 1.4); box(cabinet, 0, 1.22, -0.43, 1.18, 1.79, 0.24, 'navy');
  const links = [
    channel([[-2.8, 0.4, 0.1], [-2.22, 0.4, 0.1], [-1.72, 0.4, 0.1]], 'green'),
    channel([[-0.18, 0.4, 0.1], [0.52, 0.4, 0.1], [0.52, 0.4, -1.65], [1.24, 0.4, -1.65]], 'green'),
    channel([[-0.18, 0.4, 0.1], [0.52, 0.4, 0.1], [0.52, 0.4, 1.65], [1.24, 0.4, 1.65]], 'green')
  ];
  const validate = channel([[-3.6, 0.43, -0.66], [-3.6, 0.43, -2.19], [-1.27, 0.8, -2.19]], 'amber', 3);
  const approveCheck = c.mark(root, -0.63, 2.33, -1.87);
  return {
    labels: [['소규모 PoC', -3.6, 3.05, 0.1], ['검증·승인', -0.63, 2.8, -2.1], ['단계별 확장', 2, 3.07, 0], ['운영 통합', 4.53, 2.76, 0]],
    update(p, u, t, reduced) {
      const firstApproval = p > 1 || (p === 1 && u > 0.7);
      const secondApproval = p > 2 || (p === 2 && u > 0.9);
      status(approval.lamp, p === 1 && !firstApproval || p === 2 && !secondApproval ? 'amber' : p > 0 ? 'green' : 'amber');
      approveCheck.visible = firstApproval;
      validate.update(u, p === 1, reduced);
      cells.forEach((cell, i) => {
        let growth = 1;
        if (i === 1) growth = p > 2 ? 1 : p === 2 ? during(u, 0.03, 0.5) : 0;
        if (i >= 2) growth = p === 3 ? during(u, 0.04 + (i - 2) * 0.14, 0.63 + (i - 2) * 0.13) : 0;
        cell.g.visible = growth > 0; cell.g.scale.set(0.82, Math.max(0.01, growth) * 0.82, 0.82);
        const validated = i === 0 ? firstApproval : i === 1 ? secondApproval : p === 3 && growth > 0.98;
        cell.badge.visible = validated;
        status(cell.lamp, validated ? 'green' : 'amber');
        const working = (i === 0 && p === 0) || (i <= 1 && p === 2 && growth >= 1) || (p === 3 && growth >= 1);
        cell.product.position.x = working ? lerp(-0.55, 0.55, u) : validated ? 0.55 : -0.55;
        cell.head.position.y = working ? 1.86 - Math.sin(u * Math.PI) * 0.28 : 1.86;
        status(progressBars[i], validated ? 'green' : growth > 0 ? 'amber' : 'edge');
      });
      links[0].update(during(u, 0, 0.54), p === 2, reduced);
      links[1].update(during(u, 0, 0.66), p === 3, reduced);
      links[2].update(during(u, 0.14, 0.8), p === 3, reduced);
    }
  };
}

function solutions(c) {
  const { root, group, box, channel, status } = c;
  const positions = [[-4.1, -1.66], [-1.55, -1.66], [1.05, -1.66], [3.86, -1.66]];
  const stations = positions.map(([x, z], i) => {
    const g = group(['inspection-station', 'worker-safety-station', 'motor-diagnostics-station', 'inventory-station'][i], x, 0, z);
    c.platform(g, 2.14, 1.96);
    const edge = box(g, 0, 0.38, 0.92, 1.89, 0.075, 0.05, 'edge');
    return { g, edge, lamp: c.indicator(g, 0.88, 2.5, -0.75, 'amber') };
  });
  const inspection = stations[0].g;
  c.belt(inspection, 0, 0.25, 1.79);
  for (const side of [-1, 1]) box(inspection, side * 0.68, 1.68, -0.25, 0.09, 1.72, 0.1, 'steel');
  box(inspection, 0, 2.52, -0.25, 1.51, 0.13, 0.2, 'navy');
  c.box(inspection, 0, 2.3, -0.1, 0.45, 0.25, 0.43, 'pale');
  c.cyl(inspection, 0, 2.13, -0.1, 0.13, 0.19, 'cyan');
  const inspected = c.crate(inspection, -0.7, 1.05, 0.24, 0.45, 'pale');
  const scan = box(inspection, 0, 1.05, 0.24, 0.035, 0.41, 0.58, 'glass');
  const safety = stations[1].g;
  box(safety, -0.54, 0.92, -0.35, 0.65, 1.1, 0.64, 'navy');
  const localWorker = c.person(safety, 0.5, 0.76);
  const safetyGate = c.gate('safety-output-gate', 0, 0, 1.23);
  root.remove(safetyGate.g); safety.add(safetyGate.g); safetyGate.g.position.set(0.04, 0, 0.08);
  const safetyPass = c.mark(safety, -0.03, 2.35, 0.48);
  const motor = stations[2].g;
  box(motor, 0, 0.59, 0, 1.77, 0.36, 1.01, 'steel');
  const housing = group('electric-motor-housing', 0, 1.03, 0, motor);
  c.cyl(housing, 0, 0, 0, 0.4, 1.1, 'navy', 'x');
  for (let i = 0; i < 5; i++) c.ring(housing, -0.4 + i * 0.2, 0, 0, 0.42, 'edge', 'x');
  c.cyl(housing, 0.69, 0, 0, 0.095, 0.4, 'steel', 'x');
  const shaft = group('measured-motor-shaft', 0.76, 0, 0, housing);
  c.box(shaft, 0, 0.15, 0, 0.06, 0.31, 0.07, 'amber');
  c.box(housing, 0, 0.46, 0, 0.28, 0.16, 0.28, 'cyan');
  c.screen(motor, 0, 1.99, -0.35, 1.14, 0.47);
  const inventory = stations[3].g;
  for (const side of [-1, 1]) box(inventory, side * 0.76, 1.4, -0.31, 0.075, 2.15, 0.075, 'steel');
  for (let i = 0; i < 3; i++) box(inventory, 0, 0.51 + i * 0.74, -0.34, 1.67, 0.08, 0.68, 'edge');
  c.crate(inventory, -0.4, 0.76, -0.34, 0.48, 'steel');
  c.crate(inventory, 0.36, 1.5, -0.34, 0.48, 'steel');
  const stored = c.crate(inventory, 0.24, 0.72, 0.75, 0.5, 'pale');
  const fork = group('inventory-lift-fork', 0.24, 0.48, 0.77, inventory);
  for (const side of [-1, 1]) box(fork, side * 0.15, 0, 0, 0.07, 0.06, 0.62, 'amber');
  const inventoryScan = box(inventory, 0.15, 1.9, 0.18, 1.01, 0.025, 0.055, 'cyan');
  const hub = c.desk('unified-operations-hub', 0, 1.91);
  const outputLamps = [];
  for (let i = 0; i < 4; i++) outputLamps.push(box(hub.g, -0.51 + i * 0.34, 1.6, 0.54, 0.23, 0.15, 0.12, 'edge'));
  const paths = positions.map(([x, z], i) => channel([[x, 0.43, z + 1], [x, 0.43, 0.8], [-0.51 + i * 0.34, 0.43, 0.8], [-0.51 + i * 0.34, 1.42, 2.38]], 'green', 2));
  return {
    labels: [['품질 검사', -4.1, 3.22, -1.66], ['작업자 안전', -1.55, 3.22, -1.66], ['모터 진단', 1.05, 3.22, -1.66], ['재고 파악', 3.86, 3.22, -1.66]],
    update(p, u, t, reduced) {
      stations.forEach((station, i) => {
        status(station.edge, i === p ? 'cyan' : i < p ? 'green' : 'edge');
        status(station.lamp, i < p || (i === p && u > 0.78) ? 'green' : 'amber');
        paths[i].update(during(u, 0.63, 1), p === i && u > 0.63, reduced);
        status(outputLamps[i], i < p || i === p && u > 0.96 ? 'green' : i === p ? 'cyan' : 'edge');
      });
      inspected.position.x = p === 0 ? lerp(-0.7, 0.7, u) : 0.7;
      scan.visible = p === 0 && u > 0.18 && u < 0.8;
      scan.position.x = lerp(-0.38, 0.4, during(u, 0.18, 0.8));
      localWorker.position.z = p === 1 ? lerp(0.85, 0.45, during(u, 0.05, 0.36)) : 0.85;
      const hold = p === 1 && u > 0.28 && u < 0.68;
      safetyGate.hinge.rotation.z = p === 1 ? (1 - during(u, 0.23, 0.43)) * Math.PI * 0.43 : 0;
      status(safetyGate.lamp, hold ? 'red' : p > 1 || p === 1 && u >= 0.68 ? 'green' : 'amber');
      status(safetyGate.bar, hold ? 'red' : 'amber');
      safetyPass.visible = p > 1 || p === 1 && u > 0.7;
      const unsettled = p === 2 ? 1 - during(u, 0.35, 0.76) : 0;
      housing.position.z = p === 2 && !reduced ? Math.sin(t * 18) * 0.06 * unsettled : 0;
      shaft.rotation.x = p === 2 && !reduced ? t * 4 : 0;
      const lift = p > 3 ? 1 : p === 3 ? during(u, 0.05, 0.58) : 0;
      const slide = p === 3 ? during(u, 0.56, 0.83) : 0;
      stored.position.set(0.24, lerp(0.72, 2.22, lift), lerp(0.75, -0.34, slide));
      fork.position.set(0.24, lerp(0.48, 1.98, lift), lerp(0.77, -0.32, slide));
      inventoryScan.position.y = lerp(2.5, 1.86, p === 3 ? u : 0);
      status(hub.lamp, u > 0.96 ? 'green' : 'cyan');
    }
  };
}

function products(c) {
  const { root, group, box, channel, status } = c;
  // Conceptual work products, deliberately free of product-UI or numeric claims.
  const positions = [[-4.05, -2], [0, -2], [4.05, -2], [-4.05, 2], [0, 2], [4.05, 2]];
  const names = ['ZiewCreative', 'ZiewStage', 'ZiewCraft', 'AlphaCore', 'ZiewDocs Pro', 'Ktrace OS Academy'];
  const stations = positions.map(([x, z], i) => {
    const g = group(`${names[i]}-concept-platform`, x, 0, z);
    c.platform(g, 2.3, 1.94);
    box(g, 0, 0.62, 0, 1.98, 0.52, 1.62, 'navy');
    box(g, 0, 0.91, 0, 2.05, 0.08, 1.68, 'steel');
    const result = group(`${names[i]}-generated-artifact`, 0, 0.98, 0, g);
    const lamp = c.indicator(g, 0.91, 0.74, 0.84, 'amber');
    const check = c.mark(g, 0.71, 1.13, 0.82);
    const brief = group(`${names[i]}-input-brief`, -0.55, 1.12, 0.62, g);
    box(brief, 0, 0, 0, 0.46, 0.04, 0.44, 'pale');
    for (let row = 0; row < 3; row++) box(brief, 0, 0.031, -0.12 + row * 0.12, 0.32, 0.015, 0.027, 'edge');
    return { g, result, lamp, check, brief };
  });
  const generator = c.rack('shared-concept-generation-server', 0, 0, 3, 1.21, 2.34);
  // Presentation pages unfold into a small slide deck.
  const slides = [];
  for (let i = 0; i < 3; i++) {
    const slide = group(`presentation-slide-${i}`, (i - 1) * 0.13, 0.69 + i * 0.07, -i * 0.12, stations[0].result);
    box(slide, 0, 0, 0, 1.45, 0.9, 0.05, i === 2 ? 'navy' : 'steel');
    box(slide, -0.3, 0.17, 0.04, 0.59, 0.1, 0.025, 'cyan');
    for (let row = 0; row < 3; row++) box(slide, 0.08, -0.05 - row * 0.15, 0.041, 0.86, 0.04, 0.02, 'pale');
    slides.push(slide);
  }
  // Microphone and a physical sound waveform.
  const stage = stations[1].result;
  c.cyl(stage, -0.57, 0.04, 0, 0.29, 0.09, 'dark');
  c.cyl(stage, -0.57, 0.45, 0, 0.048, 0.82, 'steel');
  c.cyl(stage, -0.57, 1.07, 0, 0.18, 0.54, 'steel');
  for (let i = 0; i < 5; i++) c.ring(stage, -0.57, 0.89 + i * 0.085, 0, 0.18, 'edge', 'y');
  const waveform = [];
  for (let i = 0; i < 7; i++) waveform.push(box(stage, -0.04 + i * 0.145, 0.4, 0.33, 0.068, 0.15, 0.09, 'cyan'));
  // Image and film frames contain simple geometric composition guides.
  const craftFrames = [];
  for (let i = 0; i < 3; i++) {
    const frame = group(`image-film-frame-${i}`, (i - 1) * 0.4, 0.67, -i * 0.18, stations[2].result);
    for (const side of [-1, 1]) {
      box(frame, side * 0.45, 0, 0, 0.08, 1.05, 0.09, 'steel');
      box(frame, 0, side * 0.5, 0, 0.94, 0.08, 0.09, 'steel');
      for (let k = 0; k < 4; k++) box(frame, side * 0.45, -0.31 + k * 0.2, 0.06, 0.04, 0.063, 0.015, 'dark');
    }
    c.ball(frame, 0.14, 0.18, 0, 0.1, 'amber');
    c.segment(frame, [-0.34, -0.27, 0], [-0.06, 0.02, 0], 0.026, 'cyan');
    c.segment(frame, [-0.06, 0.02, 0], [0.3, -0.27, 0], 0.026, 'cyan');
    craftFrames.push(frame);
  }
  // Trading-workflow terminal, with a neutral nonnumeric data trace.
  const trading = stations[3].result;
  box(trading, 0, 0.55, -0.13, 0.09, 1, 0.13, 'steel');
  box(trading, 0, 0.91, 0, 1.55, 1.03, 0.12, 'navy');
  box(trading, 0, 0.91, 0.074, 1.38, 0.87, 0.026, 'dark');
  const trace = [[-0.57, 0.94, 0.1], [-0.35, 0.72, 0.1], [-0.14, 1.12, 0.1], [0.1, 1.02, 0.1], [0.34, 0.78, 0.1], [0.57, 0.96, 0.1]];
  const traceSegments = trace.slice(1).map((point, i) => c.segment(trading, trace[i], point, 0.018, 'cyan'));
  box(trading, 0, 0.09, 0.55, 1.21, 0.06, 0.35, 'edge');
  // Document printer produces actual extruding sheets.
  const docs = stations[4].result;
  box(docs, 0, 0.29, -0.2, 1.29, 0.55, 0.85, 'navy');
  box(docs, 0, 0.58, -0.2, 1.12, 0.05, 0.65, 'steel');
  box(docs, 0, 0.39, 0.24, 0.94, 0.1, 0.045, 'dark');
  const printed = [];
  for (let i = 0; i < 3; i++) {
    const page = group(`printed-document-page-${i}`, 0, 0.18 + i * 0.025, 0.3, docs);
    box(page, 0, 0, 0, 0.81, 0.018, 0.71, 'pale');
    for (let row = 0; row < 4; row++) box(page, -0.04, 0.018, -0.2 + row * 0.12, 0.57 - (row % 2) * 0.12, 0.012, 0.018, 'edge');
    printed.push(page);
  }
  // Books and a learning staircase describe progressive study, without scores.
  const academy = stations[5].result;
  const steps = [];
  for (let i = 0; i < 3; i++) {
    const step = group(`learning-stage-${i}`, -0.56 + i * 0.53, 0, 0, academy);
    box(step, 0, (i + 1) * 0.14, 0, 0.5, (i + 1) * 0.28, 0.86, 'edge');
    box(step, 0, (i + 1) * 0.28 + 0.05, 0, 0.42, 0.08, 0.57, 'pale');
    box(step, -0.2, (i + 1) * 0.28 + 0.055, 0, 0.045, 0.12, 0.6, 'cyan');
    steps.push(step);
  }
  const paths = positions.map(([x, z], i) => {
    const bendX = x === 0 ? (i === 1 ? -1.07 : 1.07) : x;
    return channel([[x, 0.39, z], [bendX, 0.39, z > 0 ? 0.86 : -0.86], [0, 0.39, z > 0 ? 0.86 : -0.86], [0, 1.16, 0.57]], 'cyan', 2);
  });
  return {
    labels: [['기획·입력', -4, 3.2, -1.9], ['콘텐츠 생성', 0, 3.3, -1.9], ['문서·분석·학습', 3.6, 3.1, 1.8], ['담당자 확인·활용', -3.6, 2.97, 1.8]],
    update(p, u, t, reduced) {
      generator.lamps.forEach((lamp, i) => status(lamp,
        p > 1 || p === 1 && u > 0.22 + i * 0.2 ? 'green' : 'amber'));
      generator.trays.forEach((tray, i) => {
        tray.position.z = 0.47 + (p === 1 ? Math.sin(during(u, i * 0.15, i * 0.15 + 0.6) * Math.PI) * 0.15 : 0);
      });
      stations.forEach((station, i) => {
        const planned = p > 0 ? 1 : during(u, i * 0.09, i * 0.09 + 0.36);
        station.brief.visible = p < 2 && planned > 0;
        station.brief.position.y = lerp(1.57, 1.12, planned);
        const formed = p > 2 ? 1 : p === 2 ? during(u, i * 0.075, i * 0.075 + 0.53) : 0;
        station.result.visible = formed > 0;
        station.result.scale.y = Math.max(0.01, formed);
        const handoff = p === 3 ? during(u, i * 0.08, i * 0.08 + 0.38) : 0;
        station.result.position.z = handoff * 0.12;
        station.check.visible = p === 3 && handoff > 0.9;
        status(station.lamp, station.check.visible ? 'green' : p === 2 && formed > 0.95 ? 'cyan' : 'amber');
        paths[i].update(during(u, i * 0.06, 0.65 + i * 0.06), p === 1, reduced);
      });
      const outputProgress = p > 2 ? 1 : p === 2 ? u : 0;
      slides.forEach((slide, i) => { slide.rotation.x = -(1 - during(outputProgress, 0, 0.5)) * 1.15; slide.position.x = (i - 1) * lerp(0.08, 0.22, outputProgress); });
      waveform.forEach((bar, i) => {
        const h = (0.18 + Math.abs(Math.sin(i * 1.7)) * 0.65) * during(outputProgress, 0.07, 0.7);
        bar.scale.y = Math.max(0.02, h); bar.position.y = 0.1 + h / 2;
      });
      craftFrames.forEach((frame, i) => { frame.position.x = (i - 1) * lerp(0.07, 0.4, during(outputProgress, 0.15, 0.8)); });
      traceSegments.forEach((segment, i) => { segment.visible = outputProgress > 0.22 + i * 0.1; });
      printed.forEach((page, i) => { page.position.z = lerp(-0.1, 0.42 + i * 0.03, during(outputProgress, 0.3 + i * 0.12, 0.66 + i * 0.15)); });
      steps.forEach((step, i) => { step.scale.y = Math.max(0.03, during(outputProgress, 0.38 + i * 0.09, 0.65 + i * 0.14)); });
    }
  };
}
