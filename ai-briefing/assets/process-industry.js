/**
 * Five independent industrial explanation models. Scene units, conceptual data.
 * No DOM, renderer, external imports, animation loop, or automatic machine control.
 * All geometry stays near X ±6, Y 0..4, Z ±3.5; the preferred front is +Z.
 */
export function createIndustryModel(THREE, kind) {
  const supported = ['inspection', 'maintenance', 'inventory', 'solar', 'security'];
  if (!supported.includes(kind)) throw new Error(`Unknown industrial model: ${kind}`);
  const root = new THREE.Group();
  root.name = `industry-${kind}`;
  root.userData.conceptual = true;
  const cache = new Map();
  const palette = {
    navy: 0x183247, dark: 0x0d202f, steel: 0xa5b9c7, cyan: 0x60d9f4,
    amber: 0xf3bc5e, red: 0xed6b69, green: 0x78dfb4, ceramic: 0xded9c9,
    carton: 0xa88355, paper: 0xe1edf1, blue: 0x173e62
  };
  const mats = {};
  for (const [name, color] of Object.entries(palette)) {
    const signal = ['cyan', 'amber', 'red', 'green'].includes(name);
    mats[name] = new THREE.MeshStandardMaterial({
      color, metalness: name === 'steel' ? .67 : signal ? .3 : .18,
      roughness: name === 'steel' ? .34 : .56,
      emissive: signal ? color : 0x000000, emissiveIntensity: signal ? .16 : 0
    });
  }
  mats.beam = new THREE.MeshBasicMaterial({ color: palette.cyan, transparent: true, opacity: .09, depthWrite: false, side: THREE.DoubleSide });
  mats.glass = new THREE.MeshStandardMaterial({ color: 0x74b6cf, transparent: true, opacity: .2, roughness: .3, depthWrite: false, side: THREE.DoubleSide });
  const lineMats = {};
  for (const name of ['cyan', 'amber', 'red', 'green', 'dark', 'steel']) lineMats[name] = new THREE.LineBasicMaterial({ color: palette[name] });
  const vec = (x, y, z) => new THREE.Vector3(x, y, z);
  const geometry = (key, make) => { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); };
  function mesh(shape, mat, x, y, z, parent = root) {
    const m = new THREE.Mesh(shape, typeof mat === 'string' ? mats[mat] : mat);
    m.position.set(x, y, z); m.castShadow = !m.material.transparent; m.receiveShadow = true; parent.add(m); return m;
  }
  function box(w, h, d, mat, x, y, z, parent = root) {
    return mesh(geometry(`b:${w}:${h}:${d}`, () => new THREE.BoxGeometry(w, h, d)), mat, x, y, z, parent);
  }
  function cylinder(r, len, mat, x, y, z, axis = 'y', parent = root, sides = 20) {
    const m = mesh(geometry(`c:${r}:${len}:${sides}`, () => new THREE.CylinderGeometry(r, r, len, sides)), mat, x, y, z, parent);
    if (axis === 'x') m.rotation.z = Math.PI / 2;
    if (axis === 'z') m.rotation.x = Math.PI / 2;
    return m;
  }
  function sphere(r, mat, x, y, z, parent = root) {
    return mesh(geometry(`s:${r}`, () => new THREE.SphereGeometry(r, 12, 8)), mat, x, y, z, parent);
  }
  function torus(r, tube, mat, x, y, z, axis = 'z', parent = root) {
    const m = mesh(geometry(`t:${r}:${tube}`, () => new THREE.TorusGeometry(r, tube, 8, 32)), mat, x, y, z, parent);
    if (axis === 'x') m.rotation.y = Math.PI / 2;
    if (axis === 'y') m.rotation.x = Math.PI / 2;
    return m;
  }
  function group(x = 0, y = 0, z = 0, parent = root) {
    const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g;
  }
  function line(points, color = 'cyan', parent = root) {
    const shape = new THREE.BufferGeometry().setFromPoints(points.map(p => vec(...p)));
    const l = new THREE.Line(shape, lineMats[color]); parent.add(l); return l;
  }
  function outline(w, h, d, color, x, y, z, parent = root) {
    const key = `edge:${w}:${h}:${d}`;
    const shape = geometry(key, () => new THREE.EdgesGeometry(geometry(`b:${w}:${h}:${d}`, () => new THREE.BoxGeometry(w, h, d))));
    const edges = new THREE.LineSegments(shape, lineMats[color]); edges.position.set(x, y, z); parent.add(edges); return edges;
  }
  const clamp = n => Math.min(1, Math.max(0, n));
  const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const progress = (time, seconds = 3) => ease(time / seconds);
  function check(x, y, z, size = .3, parent = root, color = 'green') {
    return line([[x - size, y, z], [x - size * .25, y - size * .7, z], [x + size, y + size, z]], color, parent);
  }
  function person(x, z, parent = root) {
    const g = group(x, 0, z, parent);
    box(.48, .65, .27, 'amber', 0, 1.1, 0, g);
    sphere(.19, 'ceramic', 0, 1.7, 0, g);
    const helmet = mesh(geometry('helmet', () => new THREE.SphereGeometry(.225, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)), 'amber', 0, 1.77, 0, g);
    helmet.name = 'safety-helmet';
    cylinder(.24, .04, 'amber', 0, 1.77, 0, 'y', g);
    for (const side of [-1, 1]) {
      cylinder(.095, .68, 'navy', side * .14, .4, 0, 'y', g);
      box(.2, .12, .35, 'dark', side * .14, .1, .07, g);
      const arm = cylinder(.07, .58, 'ceramic', side * .33, 1.06, .05, 'y', g); arm.rotation.z = side * .15;
    }
    box(.37, .46, .045, 'navy', .32, 1.17, .26, g);
    box(.28, .35, .015, 'paper', .32, 1.17, .29, g);
    return g;
  }
  function camera(x, y, z, parent = root) {
    const g = group(x, y, z, parent);
    box(.52, .38, .64, 'steel', 0, 0, 0, g);
    box(.54, .05, .7, 'navy', 0, .2, 0, g);
    cylinder(.19, .24, 'dark', 0, -.27, 0, 'y', g);
    cylinder(.16, .025, 'cyan', 0, -.405, 0, 'y', g);
    box(.1, .07, .1, 'green', .3, .04, 0, g);
    return g;
  }
  function base() { box(11.8, .08, 6.3, 'dark', 0, .04, 0); }
  function conveyor() {
    for (const z of [-.92, .92]) {
      box(11.4, .23, .18, 'navy', 0, 1, z);
      for (const x of [-4.8, -1.6, 1.6, 4.8]) box(.14, .87, .14, 'steel', x, .48, z);
    }
    const rollers = [];
    for (let i = 0; i < 28; i++) rollers.push(cylinder(.095, 1.78, 'steel', -5.4 + i * .4, 1.06, 0, 'z'));
    return rollers;
  }
  const label = (text, x, y, z) => ({ text, position: vec(x, y, z) });
  const cameraSettings = { target: [0, 1.5, 0], distance: 14, yaw: .6, pitch: .6 };
  let updater, labels;
  base();

  if (kind === 'inspection') {
    const rollers = conveyor();
    for (const z of [-1.34, 1.34]) box(.14, 2.6, .14, 'steel', 0, 1.4, z);
    box(.28, .18, 2.86, 'navy', 0, 2.75, 0);
    camera(0, 2.53, 0);
    const beam = box(1.55, 1.05, 1.45, mats.beam, 0, 1.67, 0);
    const scan = box(.025, .016, 1.43, 'cyan', -.65, 1.36, 0);
    const items = [];
    for (let i = 0; i < 5; i++) {
      const product = group(); product.name = i === 2 ? 'cracked-ceramic-product' : 'good-ceramic-product';
      box(1.25, .14, 1.22, 'ceramic', 0, 0, 0, product);
      for (const z of [-.57, .57]) box(1.2, .09, .07, 'ceramic', 0, .095, z, product);
      for (const x of [-.57, .57]) box(.07, .09, 1.08, 'ceramic', x, .095, 0, product);
      items.push(product);
    }
    const crack = line([[-.5, .083, -.31], [-.23, .083, -.13], [-.11, .083, .1], [.09, .083, .16], [.3, .083, .48]], 'red', items[2]);
    const detection = outline(1.42, .32, 1.4, 'red', 0, .07, 0, items[2]);
    box(.66, .35, .85, 'navy', 2.1, 1.18, -1.55);
    const piston = cylinder(.085, 1, 'steel', 2.1, 1.19, -.75, 'z');
    const pusher = box(.75, .28, .13, 'amber', 2.1, 1.2, -.69);
    box(1.8, .18, 1.6, 'navy', 2.1, .94, 2.15);
    for (const x of [1.2, 3]) box(.08, .3, 1.6, 'steel', x, 1.1, 2.15);
    box(1.85, .3, .08, 'steel', 2.1, 1.1, 2.98);
    const ngLamp = sphere(.1, 'red', 2.1, 1.38, 3.03);
    const goodMark = check(4.6, 1.65, .6, .2);
    labels = [label('다중 촬영·검사', 0, 3.1, 0), label('크랙 위치 확인', .25, 1.7, .85), label('불량 측면 분리', 2.1, 1.55, 2.75), label('양품 직진', 4.55, 1.5, 0)];
    updater = (phase, time) => {
      const p = progress(time, 2.6);
      const specialX = phase === 0 ? -3.9 + 1.9 * p : phase === 1 ? -2 + 2 * p : phase === 2 ? 0 : 2.1 * progress(time, 1.3);
      items.forEach((item, i) => { const x = specialX + (i - 2) * 1.85; item.position.set(Math.max(-5.2, Math.min(5.2, x)), 1.23, 0); item.visible = Math.abs(x) < 5.25; });
      if (phase === 3) {
        const ejection = progress(Math.max(0, time - 1.35), 1.2);
        items[2].position.z = ejection * 2.13;
        items[2].position.y = 1.23 - .1 * ejection;
        // The reject actuator is explicitly the lateral sorting mechanism, not the AI itself.
        const stroke = ejection * 2.42;
        piston.scale.y = .35 + stroke; piston.position.z = -1.25 + (.35 + stroke) / 2;
        pusher.position.z = -1.25 + .35 + stroke;
      } else { piston.scale.y = .35; piston.position.z = -1.075; pusher.position.z = -.9; }
      crack.visible = phase >= 2; detection.visible = phase >= 2;
      beam.visible = phase === 1 || phase === 2; scan.visible = phase === 1;
      scan.position.x = -.64 + 1.28 * ((time * .48) % 1);
      ngLamp.visible = phase === 3; goodMark.visible = phase === 3;
      rollers.forEach(r => { r.rotation.y = phase === 0 || phase === 1 || phase === 3 ? time * 1.7 : 0; });
    };
  }

  if (kind === 'maintenance') {
    box(8.4, .2, 2.4, 'navy', -.45, .25, -.2);
    const machine = group(0, 0, -.25);
    cylinder(.78, 2.1, 'steel', -2.55, 1.28, 0, 'x', machine);
    for (let i = 0; i < 8; i++) torus(.79, .045, 'navy', -3.47 + i * .26, 1.28, 0, 'x', machine);
    cylinder(.73, .2, 'dark', -3.72, 1.28, 0, 'x', machine);
    for (const x of [-3.2, -1.9]) box(.38, .46, 1.22, 'navy', x, .5, 0, machine);
    box(.8, .3, .6, 'navy', -2.6, 2.15, 0, machine);
    const rotor = group(0, 1.28, 0, machine);
    cylinder(.14, 4.3, 'steel', -.4, 0, 0, 'x', rotor);
    cylinder(.36, .4, 'navy', -1.05, 0, 0, 'x', rotor);
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; box(.42, .07, .07, 'cyan', -1.05, .31 * Math.cos(a), .31 * Math.sin(a), rotor); }
    const bearing = group(1, 1.28, 0, machine);
    torus(.57, .115, 'steel', 0, 0, 0, 'x', bearing);
    torus(.27, .075, 'steel', .07, 0, 0, 'x', bearing);
    const balls = [];
    for (let i = 0; i < 9; i++) { const a = i * Math.PI * 2 / 9; balls.push(sphere(.095, 'steel', .07, .405 * Math.cos(a), .405 * Math.sin(a), bearing)); }
    box(.8, .2, 1.3, 'navy', 1, .4, 0, machine);
    for (const z of [-.46, .46]) box(.7, .32, .16, 'steel', 1, .63, z, machine);
    const hotSpot = torus(.56, .027, 'amber', .18, 0, 0, 'x', bearing);
    box(.35, .3, .35, 'navy', 1, 2.18, 0, machine);
    const sensorLamp = sphere(.075, 'cyan', 1, 2.19, .21, machine);
    line([[1, 2.33, -.1], [1.2, 2.55, -.35], [2.45, 2.55, -.65], [3.1, 2.38, -.65]], 'cyan', machine);
    const vibration = group(1, 1.28, -.25);
    for (const side of [-1, 1]) line([[side * .76, -.25, .62], [side * .9, -.1, .62], [side * .75, .03, .62], [side * .91, .16, .62], [side * .77, .29, .62]], 'amber', vibration);
    box(1.65, 1.32, .11, 'navy', 3.6, 2.23, -.95);
    box(1.48, 1.11, .02, 'dark', 3.6, 2.23, -.88);
    const waveform = line([[2.93, 2.2, -.85], [3.07, 2.22, -.85], [3.18, 2.52, -.85], [3.31, 1.89, -.85], [3.44, 2.28, -.85], [3.58, 2.2, -.85], [3.73, 2.44, -.85], [3.85, 2.05, -.85], [4.13, 2.2, -.85]], 'amber');
    const calendar = group(3.6, 2.23, -.81);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) box(.23, .22, .025, 'steel', -.38 + c * .38, .19 - r * .37, 0, calendar);
    check(.39, -.19, .025, .12, calendar);
    const worker = person(3.3, 1.65); worker.rotation.y = -.55;
    const path = line([[3.2, .1, 1.75], [2.05, .1, 1.75], [1.2, .1, 1]], 'green');
    labels = [label('모터·베어링 단면', -1.7, 2.5, .5), label('진동 센서', 1, 2.65, 0), label('이상 추이 확인', 3.6, 3.15, -.8), label('담당자 계획점검', 3.15, 2.3, 1.75)];
    updater = (phase, time) => {
      const abnormal = phase === 1 || phase === 2;
      machine.position.y = abnormal ? Math.sin(time * 30) * .032 : 0;
      rotor.rotation.x = time * (abnormal ? 7 : 5);
      balls.forEach((b, i) => { const a = i * Math.PI * 2 / 9 + time * 1.8; b.position.y = .405 * Math.cos(a); b.position.z = .405 * Math.sin(a); });
      sensorLamp.material = phase >= 2 ? mats.amber : mats.cyan;
      hotSpot.visible = phase >= 1; vibration.visible = abnormal;
      waveform.visible = phase === 1 || phase === 2; calendar.visible = phase === 3;
      worker.visible = phase === 3; path.visible = phase === 3;
      // A scheduled inspection does not erase the unresolved warning or repair the bearing.
      worker.position.x = 4.2 - .9 * progress(time, 2.4);
    };
  }

  if (kind === 'inventory') {
    const packages = [];
    for (const z of [-2.4, 2.4]) {
      for (const x of [-4.4, -1.48, 1.48, 4.4]) box(.09, 2.55, .09, 'steel', x, 1.35, z);
      for (const y of [.72, 1.79]) {
        box(9, .1, 1.15, 'navy', 0, y, z);
        for (const x of [-2.9, 0, 2.9]) {
          const pack = box(.92, .77, .83, 'carton', x, y + .435, z);
          box(.14, .015, .84, 'ceramic', x, y + .827, z);
          const front = z < 0 ? z + .43 : z - .43;
          box(.33, .2, .018, 'paper', x - .17, y + .43, front);
          const frame = outline(1.02, .87, .93, 'green', x, y + .435, z);
          packages.push({ pack, frame });
        }
      }
    }
    packages.sort((a, b) => a.pack.position.x - b.pack.position.x || a.pack.position.z - b.pack.position.z || a.pack.position.y - b.pack.position.y);
    root.userData.inventoryCount = packages.length;
    const forklift = group(-4.6, 0, 0); forklift.name = 'camera-equipped-forklift';
    box(1.44, .62, 1.08, 'amber', -.1, .62, 0, forklift);
    box(.68, .48, 1.04, 'navy', -.59, .99, 0, forklift);
    box(.42, .22, .64, 'dark', -.14, 1.1, 0, forklift);
    box(.15, .55, .67, 'dark', -.42, 1.36, 0, forklift);
    for (const x of [-.63, .48]) for (const z of [-.48, .48]) box(.075, 1.13, .075, 'steel', x, 1.59, z, forklift);
    box(1.35, .12, 1.16, 'navy', -.08, 2.2, 0, forklift);
    box(.025, .63, .94, mats.glass, .5, 1.7, 0, forklift);
    for (const x of [-.52, .49]) for (const z of [-.57, .57]) {
      cylinder(.28, .16, 'dark', x, .36, z, 'z', forklift);
      cylinder(.13, .175, 'steel', x, .36, z, 'z', forklift);
    }
    for (const z of [-.41, .41]) {
      box(.12, 2.02, .12, 'steel', .8, 1.12, z, forklift);
      box(1.04, .08, .15, 'steel', 1.24, .29, z, forklift);
    }
    const cameraModule = camera(-.08, 2.39, -.35, forklift); cameraModule.rotation.x = -Math.PI / 2;
    const oppositeCamera = camera(-.08, 2.39, .35, forklift); oppositeCamera.rotation.x = Math.PI / 2;
    const scanBack = box(.035, 1.7, 1.24, mats.beam, 0, 1.54, -1.23, forklift);
    const scanFront = box(.035, 1.7, 1.24, mats.beam, 0, 1.54, 1.23, forklift);
    const dataBoard = group(4.65, 2.23, -1.13);
    box(1.08, 1.2, .13, 'navy', 0, 0, 0, dataBoard);
    box(.88, .98, .025, 'dark', 0, 0, .08, dataBoard);
    for (let i = 0; i < 4; i++) box(.55, .055, .02, 'cyan', -.1, .32 - i * .19, .1, dataBoard);
    const synced = check(.24, -.25, .13, .19, dataBoard);
    const packets = [];
    for (let i = 0; i < 4; i++) packets.push(sphere(.055, 'green', 0, 0, 0));
    labels = [label('랙별 박스 인식', -2.8, 3, -2.35), label('카메라 탑재 지게차', -.1, 2.8, .2), label('모델 재고 12개', .7, 3, 2.35), label('재고 시스템 동기화', 4.6, 3.02, -1.08)];
    updater = (phase, time) => {
      const p = progress(time, 4);
      forklift.position.x = phase === 0 ? -4.8 + 1.6 * p : phase === 1 ? -3.2 + 6.4 * p : 3.2;
      const count = phase === 0 ? 0 : phase === 1 ? packages.filter(({ pack }) => pack.position.x <= forklift.position.x + .25).length : packages.length;
      // Exactly twelve modeled boxes. Every box contributes once, including on repeated updates.
      packages.forEach(({ pack, frame }, i) => { frame.visible = i < count; pack.material = i < count ? mats.green : mats.carton; });
      scanBack.visible = phase === 1; scanFront.visible = phase === 1;
      synced.visible = phase === 3;
      packets.forEach((packet, i) => { const t = (time * .45 + i * .25) % 1; packet.visible = phase === 3; packet.position.set(3.15 + 1.5 * t, 2.32 + .25 * Math.sin(t * Math.PI), -.4 - .7 * t); });
    };
  }

  if (kind === 'solar') {
    const panels = [];
    for (let row = 0; row < 2; row++) for (let column = 0; column < 4; column++) {
      const x = -3.65 + column * 2.32, z = -1.5 + row * 2.35;
      const panel = group(x, .95, z); panel.rotation.x = -.23;
      box(1.9, .1, 1.74, 'steel', 0, 0, 0, panel);
      box(1.78, .015, 1.62, 'blue', 0, .064, 0, panel);
      for (let c = 1; c < 4; c++) box(.017, .018, 1.62, 'steel', -.89 + c * .445, .077, 0, panel);
      for (let r = 1; r < 4; r++) box(1.78, .018, .017, 'steel', 0, .077, -.81 + r * .405, panel);
      for (const xx of [-.64, .64]) box(.08, .77, .08, 'navy', x + xx, .43, z);
      panels.push(panel);
    }
    const affected = panels[5];
    const hotspot = box(.37, .033, .36, 'red', .22, .1, .17, affected);
    const pinpoint = outline(1.99, .18, 1.83, 'amber', 0, .06, 0, affected);
    const drone = group(-3.7, 3.2, -1.2);
    box(.56, .2, .5, 'steel', 0, 0, 0, drone);
    box(.36, .08, .37, 'navy', 0, .14, 0, drone);
    const rotors = [];
    for (const x of [-.6, .6]) for (const z of [-.58, .58]) {
      line([[0, 0, 0], [x, 0, z]], 'steel', drone);
      cylinder(.09, .17, 'dark', x, .02, z, 'y', drone);
      const rotor = group(x, .13, z, drone);
      box(.61, .018, .064, 'navy', 0, 0, 0, rotor);
      box(.064, .018, .61, 'navy', 0, 0, 0, rotor); rotors.push(rotor);
      cylinder(.025, .31, 'steel', x * .6, -.24, z * .6, 'y', drone);
    }
    sphere(.115, 'dark', 0, -.18, .15, drone);
    cylinder(.071, .025, 'cyan', 0, -.2, .25, 'z', drone);
    const beam = box(.72, 1.65, .7, mats.beam, 0, -1.03, 0, drone);
    const worker = person(4.95, 2.36); worker.rotation.y = -1;
    const route = line([[4.9, .115, 2.4], [2, .115, 2.4], [-1.2, .115, 2.4], [-1.2, .115, 1.8]], 'green');
    const routeDots = [];
    for (let i = 0; i < 7; i++) routeDots.push(cylinder(.055, .018, 'green', 4.6 - i * .91, .13, 2.4));
    labels = [label('태양광 모듈', -3.6, 1.6, -1.4), label('점검 드론', 1, 3.72, -.9), label('국부 이상 위치', -1.33, 1.8, .84), label('담당자 점검 경로', 2.4, .55, 2.45)];
    updater = (phase, time) => {
      const p = progress(time, 4);
      drone.position.set(phase === 0 ? -3.7 + 4.6 * p : -1.33, 3.2, phase === 0 ? -1.2 : .85);
      rotors.forEach((r, i) => { r.rotation.y = time * (i % 2 ? -32 : 32); });
      hotspot.visible = phase >= 1; pinpoint.visible = phase >= 2;
      // Dim surrounding modules to isolate the inspection target without moving or disconnecting it.
      panels.forEach((pnl, i) => { pnl.children[1].material = phase === 2 && i !== 5 ? mats.dark : mats.blue; });
      beam.visible = phase === 0 || phase === 1;
      worker.visible = phase === 3; route.visible = phase === 3;
      worker.position.x = 4.95 - 2.6 * progress(time, 3.2);
      routeDots.forEach(d => { d.visible = phase === 3; });
    };
  }

  if (kind === 'security') {
    // A topology model: explicit OT / authorization / office-output zones.
    for (const [x, w] of [[-3.8, 3], [0, 1.7], [3.6, 3.5]]) box(w, .055, 4.7, 'navy', x, .1, -.1);
    const server = group(-4.05, 0, -.6);
    box(1.5, 2.57, 1.1, 'navy', 0, 1.42, 0, server);
    box(1.3, 2.32, .06, 'dark', 0, 1.43, .59, server);
    for (let row = 0; row < 6; row++) {
      box(1.13, .26, .11, 'steel', 0, .5 + row * .36, .63, server);
      for (let col = 0; col < 5; col++) box(.055, .035, .02, col === 4 ? 'green' : 'navy', -.42 + col * .18, .51 + row * .36, .7, server);
    }
    box(1.65, .15, 1.4, 'dark', -4.05, .14, -.6);
    const monitor = group(3.56, 0, -1.38);
    box(2, .11, 1.08, 'steel', 0, 1.12, 0, monitor);
    for (const x of [-.72, .72]) box(.09, 1, .09, 'navy', x, .59, 0, monitor);
    box(1.5, .99, .12, 'navy', 0, 1.92, -.18, monitor);
    box(1.29, .77, .02, 'blue', 0, 1.92, -.104, monitor);
    cylinder(.07, .37, 'steel', 0, 1.31, -.18, 'y', monitor);
    box(.9, .035, .33, 'dark', 0, 1.22, .23, monitor);
    for (let i = 0; i < 3; i++) box(.7, .03, .02, 'cyan', -.17, 2.14 - i * .17, -.085, monitor);
    const printer = group(3.65, 0, 1.43);
    box(1.45, .87, 1.21, 'steel', 0, .63, 0, printer);
    box(1.53, .19, 1.24, 'navy', 0, 1.14, 0, printer);
    box(.92, .12, .58, 'dark', 0, 1.28, -.1, printer);
    box(.96, .055, .73, 'dark', 0, .38, .68, printer);
    box(.43, .14, .035, 'cyan', -.35, .88, .64, printer);
    const output = box(.69, .015, .71, 'paper', 0, .51, .58, printer);
    for (let i = 0; i < 3; i++) box(.43, .005, .025, 'navy', 0, .011, -.19 + i * .11, output);
    const boundary = group(0, 0, 0);
    for (const z of [-1.38, 1.38]) box(.1, 2.35, .1, 'steel', 0, 1.29, z, boundary);
    box(.14, .11, 2.86, 'steel', 0, 2.47, 0, boundary);
    const barrier = box(.06, 2.21, 2.5, mats.glass, 0, 1.27, 0, boundary);
    const stopSymbol = group(.08, 1.5, .68);
    const slash1 = box(.045, .65, .08, 'red', 0, 0, 0, stopSymbol); slash1.rotation.x = Math.PI / 4;
    const slash2 = box(.045, .65, .08, 'red', 0, 0, 0, stopSymbol); slash2.rotation.x = -Math.PI / 4;
    const credential = group(.48, 1.46, 1.63);
    box(.83, 1.07, .08, 'paper', 0, 0, 0, credential);
    sphere(.105, 'navy', -.16, .18, .08, credential);
    box(.29, .17, .03, 'navy', -.16, -.03, .07, credential);
    check(.13, -.24, .09, .17, credential);
    const papers = [];
    for (let i = 0; i < 3; i++) {
      const doc = group();
      box(.025, .52, .4, 'paper', 0, 0, 0, doc);
      for (let row = 0; row < 3; row++) box(.03, .025, .25, 'cyan', .019, .12 - row * .11, 0, doc);
      papers.push(doc);
    }
    line([[-3.24, .2, -.43], [-.06, .2, -.43], [1.36, .2, -.43], [3.58, .2, 1.43]], 'cyan');
    const audit = group(1.45, 0, -2.4);
    box(1.08, 1.73, .11, 'navy', 0, 1.36, 0, audit);
    for (let row = 0; row < 4; row++) {
      box(.49, .03, .025, 'steel', .08, 1.89 - row * .31, .09, audit);
      check(-.32, 1.87 - row * .31, .1, .065, audit);
    }
    const authorizedUser = person(4.93, -.05); authorizedUser.scale.setScalar(.86);
    labels = [label('공장 OT 서버', -4.05, 3.02, -.5), label('권한 확인·차단', 0, 2.83, 0), label('승인 사용자·출력', 3.62, 2.83, .18), label('출력 감사 이력', 1.45, 2.52, -2.4)];
    updater = (phase, time) => {
      const p = progress(time, 3);
      stopSymbol.visible = phase === 1; credential.visible = phase === 2 || phase === 3;
      barrier.material = phase >= 2 ? mats.beam : mats.glass;
      audit.visible = phase === 3; output.visible = phase === 3; authorizedUser.visible = phase >= 2;
      output.position.z = .58 + .42 * p;
      papers.forEach((doc, i) => {
        doc.visible = phase !== 2;
        if (phase === 0) doc.position.set(-3.22 + ((time * .48 + i * .85) % 2.6), 1.43, -.42);
        else if (phase === 1) doc.position.set(-2.2 + Math.min(1.82, p * 1.82 + i * .3), 1.43 + i * .07, -.42);
        else { const t = (time * .3 + i / 3) % 1; doc.position.set(.2 + 3.43 * t, 1.43 - .36 * t, -.42 + 1.82 * t); }
      });
    };
  }

  function update({ phase = 0, time = 0, delta = 0, reducedMotion = false } = {}) {
    phase = Math.max(0, Math.min(3, Math.trunc(Number(phase) || 0)));
    time = reducedMotion ? 6 : Math.max(0, Number(time) || 0);
    // delta belongs to the consumer's clock; the model uses absolute phase time for reproducibility.
    void delta;
    updater(phase, time);
    root.userData.phase = phase;
  }
  update();
  return { root, update, labels, camera: cameraSettings };
}
