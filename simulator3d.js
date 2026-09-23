import * as THREE from './vendor/three.module.js';

/** A representative edge rack: its status reflects the demo, not live hardware measurements. */
export function mountSimulation(host, { industry = null, systems = [], phase = 0, reducedMotion = false } = {}) {
  if (!host) return { update() {}, setPaused() {}, dispose() {} };
  const NODES = [
    { id: 'erp', en: 'ERP', ko: 'ERP' }, { id: 'mes', en: 'MES', ko: 'MES' },
    { id: 'scada', en: 'SCADA', ko: 'SCADA' }, { id: 'cctv', en: 'CCTV', ko: 'CCTV' },
    { id: 'iot', en: 'IoT', ko: 'IoT 센서' }, { id: 'crm', en: 'CRM', ko: 'CRM' },
    { id: 'wms', en: 'WMS', ko: 'WMS' }, { id: 'pos', en: 'POS', ko: 'POS' },
    { id: 'hrm', en: 'HRM', ko: 'HRM' }
  ];
  const doc = host.ownerDocument;
  const english = () => (doc.documentElement.lang || 'ko').startsWith('en');
  let state = { industry, systems, phase };
  const motionPreference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let manualMotionOverride = false;
  const reduce = () => !manualMotionOverride && (motionPreference ? motionPreference.matches : reducedMotion);
  let contextLost = false, disposed = false, paused = false, visible = true;
  let raf = 0, lastFrame = 0, elapsed = 0, width = 330, height = 440;
  let dragging = false, dragPointer = null, dragX = 0, dragAngle = 0;
  const pointer = new THREE.Vector2(), smoothPointer = new THREE.Vector2();
  const projected = new THREE.Vector3();
  const owned = new Set();
  const own = (resource) => { owned.add(resource); return resource; };
  const wrap = doc.createElement('div');
  wrap.className = 'sim-three-view';
  Object.assign(wrap.style, { position: 'relative', width: '100%', height: '100%', minHeight: '180px', overflow: 'hidden', background: '#edf3f7', borderRadius: 'inherit' });
  wrap.setAttribute('role', 'img');
  host.appendChild(wrap);
  const labelLayer = doc.createElement('div');
  Object.assign(labelLayer.style, { position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'hidden' });
  labelLayer.setAttribute('aria-hidden', 'true');
  const fallback = doc.createElement('div');
  Object.assign(fallback.style, { position: 'absolute', inset: '0', display: 'none', alignItems: 'center', justifyContent: 'center', padding: '28px', color: '#335b72', background: '#edf3f7', font: '14px/1.65 Arial,sans-serif', textAlign: 'center', whiteSpace: 'pre-line' });
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setClearColor(0xedf3f7, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', touchAction: 'pan-y', cursor: 'grab' });
    renderer.domElement.setAttribute('aria-hidden', 'true');
    wrap.appendChild(renderer.domElement);
  } catch (_) {
    wrap.appendChild(fallback);
    fallback.style.display = 'flex';
    const describe = () => {
      const list = state.systems.map((system) => english() ? system.en : system.ko).join(' · ');
      fallback.textContent = `ZiewCore\n${list || NODES.map((node) => node.en).join(' · ')}`;
      wrap.setAttribute('aria-label', fallback.textContent);
    };
    describe();
    return { update(next = {}) { state = { ...state, ...next }; describe(); }, setPaused() {}, dispose() { wrap.remove(); } };
  }
  wrap.append(labelLayer, fallback);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xedf3f7, 13, 28);
  const camera = new THREE.PerspectiveCamera(29, 1, 0.1, 80);
  const graph = new THREE.Group();
  graph.rotation.y = -0.25;
  scene.add(graph);

  let environmentTarget = null;
  // Broad photographic softboxes give the metal controlled, local reflections.
  function environment() {
    const canvas = doc.createElement('canvas'); canvas.width = 1024; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#c5c8cd'); gradient.addColorStop(0.4, '#697179');
    gradient.addColorStop(0.53, '#292d32'); gradient.addColorStop(1, '#101215');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1024, 512);
    ctx.filter = 'blur(16px)';
    ctx.fillStyle = '#ffffff'; ctx.fillRect(105, 90, 95, 240);
    ctx.fillStyle = '#d9e1e8'; ctx.fillRect(660, 135, 170, 105);
    ctx.filter = 'blur(7px)'; ctx.fillStyle = '#ffffff'; ctx.fillRect(415, 55, 15, 180);
    ctx.filter = 'blur(10px)'; ctx.fillStyle = '#e9eef1'; ctx.fillRect(839, 165, 20, 170);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const target = own(pmrem.fromEquirectangular(texture));
    texture.dispose(); pmrem.dispose();
    if (environmentTarget) { owned.delete(environmentTarget); environmentTarget.dispose(); }
    environmentTarget = target;
    return target.texture;
  }
  scene.environment = environment();
  scene.environmentIntensity = 1.2;
  scene.add(new THREE.HemisphereLight(0xd6dce3, 0x202226, 1.0));
  const key = new THREE.DirectionalLight(0xfff9f1, 4.7);
  key.position.set(-3.5, 6, 6); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -4; key.shadow.camera.right = 4;
  key.shadow.camera.top = 5; key.shadow.camera.bottom = -4;
  key.shadow.normalBias = 0.025; key.shadow.bias = -0.00012;
  key.shadow.radius = 3; scene.add(key);
  const fill = new THREE.DirectionalLight(0xd7e3e9, 2.4); fill.position.set(1, 2, 7); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xeaf0f7, 2.7); rim.position.set(3, 4, -4); scene.add(rim);

  function textureCanvas(w, h, draw) {
    const canvas = doc.createElement('canvas'); canvas.width = w; canvas.height = h;
    draw(canvas.getContext('2d'), w, h);
    const texture = own(new THREE.CanvasTexture(canvas)); texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return texture;
  }
  let seed = 97;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const brushed = textureCanvas(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#999999'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1200; i++) {
      const tone = 128 + Math.round(random() * 55);
      ctx.strokeStyle = `rgba(${tone},${tone},${tone},.24)`;
      ctx.beginPath(); const x = random() * w, y = random() * h;
      ctx.moveTo(x, y); ctx.lineTo(x + 50 + random() * 180, y); ctx.stroke();
    }
  });
  brushed.colorSpace = THREE.NoColorSpace;
  const ventTexture = textureCanvas(256, 64, (ctx, w, h) => {
    ctx.fillStyle = '#292e32'; ctx.fillRect(0, 0, w, h);
    for (let row = 0; row < 6; row++) for (let col = 0; col < 29; col++) {
      const x = 5 + col * 9 + (row % 2) * 4, y = 6 + row * 10;
      ctx.fillStyle = '#434a50'; ctx.beginPath(); ctx.arc(x, y + 0.5, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#080b0d'; ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
    }
  });
  const graphite = own(new THREE.MeshStandardMaterial({ color: 0x495761, metalness: 0.64, roughness: 0.4, roughnessMap: brushed, bumpMap: brushed, bumpScale: 0.002 }));
  const titanium = own(new THREE.MeshStandardMaterial({ color: 0xa4b0b7, metalness: 0.82, roughness: 0.3, roughnessMap: brushed, bumpMap: brushed, bumpScale: 0.001 }));
  const panel = own(new THREE.MeshStandardMaterial({ color: 0x647783, metalness: 0.7, roughness: 0.4, roughnessMap: brushed }));
  const black = own(new THREE.MeshStandardMaterial({ color: 0x090d10, metalness: 0.1, roughness: 0.66 }));
  const rubber = own(new THREE.MeshStandardMaterial({ color: 0x141719, metalness: 0.0, roughness: 0.82 }));
  const vent = own(new THREE.MeshStandardMaterial({ map: ventTexture, color: 0xc0c4c6, metalness: 0.61, roughness: 0.6 }));
  const glass = own(new THREE.MeshPhysicalMaterial({ color: 0x0e171c, metalness: 0.35, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.12 }));
  const unitBox = own(new THREE.BoxGeometry(1, 1, 1));
  const cylinder = own(new THREE.CylinderGeometry(1, 1, 1, 12));
  const batches = new Map();
  const matrixObject = new THREE.Object3D();
  function batch(geometry, material, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) {
    const key = `${geometry.uuid}:${material.uuid}`;
    if (!batches.has(key)) batches.set(key, { geometry, material, matrices: [] });
    matrixObject.position.set(x, y, z); matrixObject.rotation.set(rx, ry, rz); matrixObject.scale.set(w, h, d); matrixObject.updateMatrix();
    batches.get(key).matrices.push(matrixObject.matrix.clone());
  }
  function box(w, h, d, material, x, y, z, rx = 0, ry = 0, rz = 0) { batch(unitBox, material, w, h, d, x, y, z, rx, ry, rz); }
  function screw(x, y, z) {
    batch(cylinder, titanium, 0.021, 0.008, 0.021, x, y, z, Math.PI / 2);
    box(0.022, 0.004, 0.009, black, x, y, z + 0.006);
    box(0.004, 0.022, 0.009, black, x, y, z + 0.006);
  }
  function facePlate(texture, w, h, x, y, z) {
    const material = own(new THREE.MeshStandardMaterial({ map: texture, color: 0xcdd2d4, metalness: 0.45, roughness: 0.43 }));
    const mesh = new THREE.Mesh(own(new THREE.PlaneGeometry(w, h)), material);
    mesh.position.set(x, y, z); graph.add(mesh); return mesh;
  }

  // Folded sheet-metal cabinet, inset electronics, machined rails and rubber feet.
  box(2.04, 3.72, 0.045, graphite, 0, -0.015, -0.76);
  box(0.075, 3.74, 1.56, graphite, -1.01, -0.015, 0);
  box(0.075, 3.74, 1.56, graphite, 1.01, -0.015, 0);
  box(1.97, 0.07, 1.57, panel, 0, 1.87, 0);
  box(1.97, 0.11, 1.57, graphite, 0, -1.87, 0);
  box(1.83, 3.48, 1.36, black, 0, -0.015, -0.035);
  [-0.94, 0.94].forEach((x) => {
    box(0.065, 3.55, 0.085, titanium, x, 0, 0.775);
    for (let i = 0; i < 32; i++) box(0.024, 0.033, 0.09, black, x, 1.68 - i * 0.108, 0.789);
  });
  [-0.82, 0.82].forEach((x) => [-0.56, 0.56].forEach((z) => {
    box(0.23, 0.11, 0.24, rubber, x, -1.97, z);
    box(0.25, 0.028, 0.26, titanium, x, -1.9, z);
  }));
  box(0.018, 2.94, 1.1, panel, 1.052, -0.02, -0.04);
  for (let i = 0; i < 21; i++) box(0.021, 0.022, 0.51, black, 1.063, 0.85 - i * 0.073, 0.04);
  // Real port proportions and a smoked status window replace the floating chip.
  box(1.8, 0.29, 0.16, titanium, 0, 1.55, 0.74);
  box(0.65, 0.1, 0.018, glass, -0.42, 1.55, 0.835);
  const wordplate = textureCanvas(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#394045'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d3d8d9'; ctx.font = '500 43px Arial'; ctx.textBaseline = 'middle'; ctx.fillText('ziewise', 25, 56);
    ctx.fillStyle = '#8b989f'; ctx.font = '19px Arial'; ctx.fillText('EDGE INTELLIGENCE', 250, 57);
    ctx.fillStyle = '#728189'; ctx.fillRect(25, 102, 460, 2);
  });
  facePlate(wordplate, 1.78, 0.32, 0, -1.60, 0.827);
  for (let i = 0; i < 4; i++) {
    const x = 0.18 + i * 0.16;
    box(0.126, 0.105, 0.021, black, x, 1.55, 0.839);
    box(0.098, 0.069, 0.025, titanium, x, 1.54, 0.835);
    box(0.079, 0.045, 0.029, black, x, 1.547, 0.842);
  }
  [-0.85, 0.85].forEach((x) => screw(x, 1.55, 0.838));
  const coreLight = own(new THREE.MeshBasicMaterial({ color: 0xc8dedb }));
  box(0.07, 0.009, 0.011, coreLight, -0.6, 1.55, 0.851);
  box(0.23, 0.009, 0.011, coreLight, -0.43, 1.55, 0.851);

  function makeLabel(text, central = false) {
    const label = doc.createElement('span'); label.textContent = text;
    Object.assign(label.style, { position: 'absolute', top: '0', left: '0', whiteSpace: 'nowrap', color: '#567489', font: `${central ? '500 11px' : '500 11px'}/1.3 Arial,"Noto Sans KR",sans-serif`, letterSpacing: central ? '.07em' : '.035em', padding: central ? '4px 7px' : '3px 5px', background: 'rgba(247,251,253,.92)', border: '1px solid transparent', borderRadius: '2px', transform: 'translate(-50%,-50%)' });
    labelLayer.appendChild(label); return label;
  }
  const centralLabel = makeLabel('ZiewCore', true);
  const packetGeometry = own(new THREE.SphereGeometry(0.021, 8, 6));
  const packetMaterial = own(new THREE.MeshBasicMaterial({ color: 0xc6e6df }));
  const nodes = NODES.map((data, index) => {
    const y = 1.18 - index * 0.31;
    const material = own(new THREE.MeshBasicMaterial({ color: 0x455356 }));
    box(1.8, 0.267, 0.085, panel, 0, y, 0.755);
    box(1.64, 0.016, 0.092, black, 0, y - 0.132, 0.756);
    const driveCount = index % 3 === 0 ? 4 : 2;
    for (let j = 0; j < driveCount; j++) {
      const x = -0.52 + j * 0.22;
      box(0.189, 0.17, 0.029, black, x, y, 0.817);
      box(0.176, 0.151, 0.025, graphite, x, y, 0.834);
      box(0.126, 0.014, 0.03, titanium, x, y - 0.042, 0.85);
      box(0.016, 0.033, 0.025, material, x - 0.064, y + 0.047, 0.851);
    }
    const meshWidth = driveCount === 4 ? 0.38 : 0.8;
    box(meshWidth, 0.185, 0.015, vent, driveCount === 4 ? 0.54 : 0.32, y, 0.811);
    box(0.095, 0.12, 0.011, glass, 0.77, y, 0.825);
    box(0.017, 0.017, 0.012, material, 0.771, y + 0.024, 0.834);
    box(0.017, 0.017, 0.012, material, 0.771, y - 0.024, 0.834);
    [-0.853, 0.853].forEach((x) => screw(x, y, 0.818));
    // Patch leads follow a side service channel instead of an orbital diagram.
    const cableX = 1.09 + (index % 3) * 0.018;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.84, y, 0.76), new THREE.Vector3(cableX, y, 0.64),
      new THREE.Vector3(cableX + 0.024, 1.41, 0.53), new THREE.Vector3(0.65, 1.49, 0.73)
    ]);
    const cableMaterial = own(new THREE.MeshStandardMaterial({ color: 0x303c40, emissive: 0x000000, metalness: 0.3, roughness: 0.54 }));
    const link = new THREE.Mesh(own(new THREE.TubeGeometry(curve, 32, 0.009, 5, false)), cableMaterial); graph.add(link);
    const packet = new THREE.Mesh(packetGeometry, packetMaterial); graph.add(packet); packet.visible = false;
    const label = makeLabel(english() ? data.en : data.ko);
    const leader = doc.createElement('i');
    Object.assign(leader.style, { position: 'absolute', height: '1px', background: '#5d696f', transformOrigin: '0 50%', opacity: '.23' });
    labelLayer.prepend(leader);
    return { ...data, index, y, material, curve, link, packet, label, leader, selected: false, labelPosition: new THREE.Vector3(index % 2 ? 0.82 : -0.82, y, 0.83) };
  });
  // Static detail shares instances; only status lights and data packets animate.
  for (const { geometry, material, matrices } of batches.values()) {
    const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
    matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
    mesh.castShadow = material !== black && material !== rubber;
    mesh.receiveShadow = true; graph.add(mesh);
  }
  batches.clear();
  const floor = new THREE.Mesh(own(new THREE.PlaneGeometry(60, 60)), own(new THREE.MeshBasicMaterial({ color: 0xe5eef3, toneMapped: false })));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -2.026; scene.add(floor);
  const contact = textureCanvas(256, 256, (ctx) => {
    const gradient = ctx.createRadialGradient(128, 128, 28, 128, 128, 122);
    gradient.addColorStop(0, 'rgba(0,0,0,.73)'); gradient.addColorStop(0.42, 'rgba(0,0,0,.6)'); gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 256);
  });
  const shadow = new THREE.Mesh(own(new THREE.PlaneGeometry(4.25, 3.4)), own(new THREE.MeshBasicMaterial({ map: contact, transparent: true, depthWrite: false, toneMapped: false })));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -2.019; scene.add(shadow);

  function layout() {
    if (disposed) return;
    width = Math.max(1, wrap.clientWidth || 330); height = Math.max(1, wrap.clientHeight || 440);
    camera.aspect = width / height;
    const fov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const distance = Math.max(2.57 / fov, 2.05 / (fov * camera.aspect));
    camera.position.set(0, distance * 0.16, distance);
    camera.lookAt(0, -0.13, 0); camera.updateProjectionMatrix();
    renderer.setSize(width, height, false); render();
  }
  function refresh() {
    const selectedIds = new Set((state.systems || []).map((system) => system.id));
    nodes.forEach((node) => {
      node.selected = selectedIds.has(node.id);
      node.material.color.setHex(node.selected ? (state.phase === 3 ? 0xc2d5c4 : 0xadcfd0) : 0x3a484b);
      node.link.material.color.setHex(node.selected ? 0x617e80 : 0x303c40);
      node.link.material.emissive.setHex(node.selected ? 0x1b292b : 0x000000);
      node.link.material.emissiveIntensity = node.selected ? 0.25 : 0;
      node.label.textContent = english() ? node.en : node.ko;
      node.label.style.color = node.selected ? '#235f77' : state.phase === 0 ? '#4f6f83' : '#657e8f';
      node.label.style.borderColor = node.selected ? '#61777b' : 'transparent';
      node.label.style.background = node.selected ? 'rgba(218,238,242,.96)' : 'rgba(247,251,253,.92)';
      node.leader.style.opacity = node.selected ? '.75' : '.23';
      node.leader.style.background = node.selected ? '#829b9f' : '#5d696f';
      node.packet.visible = state.phase === 2 && node.selected;
      if (node.packet.visible) node.packet.position.copy(node.curve.getPoint(0.3 + (node.index % 3) * 0.2));
    });
    const names = (state.systems || []).map((system) => english() ? system.en : system.ko).join(', ');
    const phaseNames = english() ? ['System architecture', 'Select systems to connect', 'Training simulation', 'Simulation complete'] : ['시스템 아키텍처', '연결할 시스템 선택', 'AI 학습 시뮬레이션', '시뮬레이션 완료'];
    const industryName = state.industry ? (english() ? state.industry.en : state.industry.ko) : '';
    const status = `${industryName ? industryName + ' · ' : ''}${phaseNames[state.phase] || phaseNames[0]}`;
    wrap.setAttribute('aria-label', `ZiewCore. ${status}. ${names || (english() ? 'ERP, MES, SCADA, CCTV, IoT, CRM, WMS, POS, HRM' : 'ERP, MES, SCADA, CCTV, IoT 센서, CRM, WMS, POS, HRM')}`);
    fallback.textContent = `ZiewCore\n${status}\n${names}`;
    render();
  }
  function projectPoint(point) {
    projected.copy(point); graph.localToWorld(projected); projected.project(camera);
    return { x: (projected.x * 0.5 + 0.5) * width, y: (-projected.y * 0.5 + 0.5) * height };
  }
  function positionLabels() {
    const narrow = height < 300;
    nodes.forEach((node) => {
      const anchor = projectPoint(node.labelPosition);
      const left = node.index % 2 === 0;
      const labelX = left ? Math.max(33, width * 0.13) : width - Math.max(33, width * 0.13);
      const labelY = Math.min(height - 23, Math.max(16, anchor.y));
      node.label.style.left = `${labelX}px`; node.label.style.top = `${labelY}px`;
      node.label.style.fontSize = narrow ? '10px' : '11px';
      const labelWidth = node.label.offsetWidth;
      const startX = left ? labelX + labelWidth / 2 + 3 : labelX - labelWidth / 2 - 3;
      const endX = anchor.x + (left ? -3 : 3);
      const deltaX = endX - startX, deltaY = anchor.y - labelY;
      node.leader.style.left = `${startX}px`; node.leader.style.top = `${labelY}px`;
      node.leader.style.width = `${Math.sqrt(deltaX * deltaX + deltaY * deltaY)}px`;
      node.leader.style.transform = `rotate(${Math.atan2(deltaY, deltaX)}rad)`;
    });
    const core = projectPoint(new THREE.Vector3(0, -2.11, 0.8));
    centralLabel.style.left = `${width / 2}px`;
    centralLabel.style.top = `${Math.min(height - 13, core.y + 8)}px`;
  }
  function render() {
    if (disposed || !renderer || contextLost) return;
    graph.updateMatrixWorld(true); renderer.render(scene, camera); positionLabels();
  }
  function animate(time) {
    raf = 0;
    if (disposed || paused || !visible || doc.hidden || reduce() || contextLost) return;
    raf = requestAnimationFrame(animate);
    if (time - lastFrame < 1000 / 30) return;
    const delta = Math.min(0.07, (time - lastFrame) / 1000 || 0);
    lastFrame = time; elapsed += delta;
    smoothPointer.lerp(pointer, 0.08);
    graph.rotation.y = -0.25 + dragAngle + smoothPointer.x * 0.035;
    nodes.forEach((node) => {
      if (node.packet.visible) node.packet.position.copy(node.curve.getPoint((elapsed * 0.22 + node.index * 0.17) % 1));
    });
    render();
  }
  function resume() {
    cancelAnimationFrame(raf); raf = 0; lastFrame = performance.now();
    if (!disposed && !paused && visible && !doc.hidden && !reduce() && !contextLost) raf = requestAnimationFrame(animate);
    else render();
  }
  function onPointer(event) {
    const rect = wrap.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width - 0.5) * 2, ((event.clientY - rect.top) / rect.height - 0.5) * 2);
    if (dragging && event.pointerId === dragPointer) {
      dragAngle = THREE.MathUtils.clamp(dragAngle + (event.clientX - dragX) * 0.003, -0.24, 0.24);
      dragX = event.clientX; graph.rotation.y = -0.25 + dragAngle; render();
    }
  }
  function onDown(event) {
    if (event.button !== 0) return;
    dragging = true; dragPointer = event.pointerId; dragX = event.clientX;
    renderer.domElement.style.cursor = 'grabbing'; wrap.setPointerCapture?.(event.pointerId);
  }
  function onUp() { dragging = false; dragPointer = null; renderer.domElement.style.cursor = 'grab'; }
  function onLeave() { pointer.set(0, 0); if (!dragging) onUp(); }
  function onVisibility() { resume(); }
  function onLost(event) { contextLost = true; event.preventDefault(); cancelAnimationFrame(raf); raf = 0; fallback.style.display = 'flex'; labelLayer.style.display = 'none'; }
  function onRestored() {
    contextLost = false;
    // Render-target pixels are not retained through context loss. Re-create the
    // studio reflections before the first restored frame can sample them.
    scene.environment = environment();
    renderer.setClearColor(0xedf3f7, 1);
    fallback.style.display = 'none'; labelLayer.style.display = 'block';
    layout(); refresh(); resume();
  }
  wrap.addEventListener('pointermove', onPointer, { passive: true });
  wrap.addEventListener('pointerdown', onDown); wrap.addEventListener('pointerup', onUp); wrap.addEventListener('pointercancel', onUp);
  wrap.addEventListener('pointerleave', onLeave);
  doc.addEventListener('visibilitychange', onVisibility); motionPreference?.addEventListener('change', onVisibility);
  renderer.domElement.addEventListener('webglcontextlost', onLost); renderer.domElement.addEventListener('webglcontextrestored', onRestored);
  const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(layout) : null;
  if (resize) resize.observe(host); else window.addEventListener('resize', layout);
  const intersection = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); }) : null;
  if (intersection) intersection.observe(host);
  layout(); refresh(); resume();
  return {
    update(next = {}) { if (disposed) return; state = { ...state, ...next }; refresh(); },
    setPaused(value, { manual = true } = {}) { paused = Boolean(value); if (!paused && manual) manualMotionOverride = true; resume(); },
    dispose() {
      if (disposed) return;
      disposed = true; cancelAnimationFrame(raf); resize?.disconnect(); intersection?.disconnect();
      window.removeEventListener('resize', layout);
      wrap.removeEventListener('pointermove', onPointer); wrap.removeEventListener('pointerdown', onDown);
      wrap.removeEventListener('pointerup', onUp); wrap.removeEventListener('pointercancel', onUp); wrap.removeEventListener('pointerleave', onLeave);
      doc.removeEventListener('visibilitychange', onVisibility); motionPreference?.removeEventListener('change', onVisibility);
      renderer.domElement.removeEventListener('webglcontextlost', onLost); renderer.domElement.removeEventListener('webglcontextrestored', onRestored);
      key.shadow.map?.dispose(); owned.forEach((resource) => resource.dispose()); owned.clear();
      renderer.dispose(); renderer.forceContextLoss(); wrap.remove();
    }
  };
}
