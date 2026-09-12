import * as THREE from './vendor/three.module.js';

/** Actual 3D geometry for the experience popup. No live measurements are shown. */
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
  let manualMotionOverride=false;
  const reduce = () => !manualMotionOverride && (reducedMotion || Boolean(motionPreference?.matches));
  let contextLost = false;
  let disposed = false, paused = false, visible = true, raf = 0, lastFrame = 0, elapsed = 0;
  let width = 330, height = 440, compact = false;
  const pointer = new THREE.Vector2();
  const smoothPointer = new THREE.Vector2();
  const projected = new THREE.Vector3();
  const owned = new Set();
  const own = (resource) => { owned.add(resource); return resource; };
  const wrap = doc.createElement('div');
  wrap.className = 'sim-three-view';
  Object.assign(wrap.style, { position: 'relative', width: '100%', height: '100%', minHeight: '180px', overflow: 'hidden', background: '#20344d', borderRadius: 'inherit' });
  wrap.setAttribute('role', 'img');
  host.appendChild(wrap);
  const labelLayer = doc.createElement('div');
  Object.assign(labelLayer.style, { position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'hidden' });
  labelLayer.setAttribute('aria-hidden', 'true');
  const fallback = doc.createElement('div');
  Object.assign(fallback.style, { position: 'absolute', inset: '0', display: 'none', alignItems: 'center', justifyContent: 'center', padding: '28px', color: '#dce9f7', font: '14px/1.65 Arial,sans-serif', textAlign: 'center', whiteSpace: 'pre-line' });
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setClearColor(0x20344d, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', touchAction: 'pan-y' });
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
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
  camera.position.set(0, 0, 14);
  const graph = new THREE.Group();
  scene.add(graph);
  scene.add(new THREE.HemisphereLight(0xe0eeff, 0x263648, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 3.4); key.position.set(3, 5, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0x65a5f8, 2.3); rim.position.set(-5, 0, 3); scene.add(rim);
  const chrome = own(new THREE.MeshStandardMaterial({ color: 0x8dabc7, metalness: 0.76, roughness: 0.31 }));
  const shell = own(new THREE.MeshStandardMaterial({ color: 0x294769, metalness: 0.65, roughness: 0.36 }));
  const face = own(new THREE.MeshStandardMaterial({ color: 0x183657, metalness: 0.4, roughness: 0.36 }));
  const cobalt = own(new THREE.MeshStandardMaterial({ color: 0x377ff0, emissive: 0x1a4f9c, emissiveIntensity: 0.16, metalness: 0.42, roughness: 0.34 }));
  const cyan = own(new THREE.MeshBasicMaterial({ color: 0x8cdbed }));
  const core = new THREE.Group();
  core.rotation.set(0.12, -0.21, -0.03);
  graph.add(core);
  function box(w, h, d, material, target, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(own(new THREE.BoxGeometry(w, h, d)), material);
    mesh.position.set(x, y, z); target.add(mesh); return mesh;
  }
  box(1.42, 1.42, 0.48, chrome, core);
  box(1.29, 1.29, 0.08, shell, core, 0, 0, 0.28);
  box(1.08, 1.08, 0.08, face, core, 0, 0, 0.35);
  box(0.64, 0.64, 0.1, cobalt, core, 0, 0, 0.43);
  for (let i = 0; i < 7; i++) {
    const p = -0.48 + i * 0.16;
    box(0.08, 0.2, 0.12, chrome, core, p, 0.79, 0.01);
    box(0.08, 0.2, 0.12, chrome, core, p, -0.79, 0.01);
    box(0.2, 0.08, 0.12, chrome, core, 0.79, p, 0.01);
    box(0.2, 0.08, 0.12, chrome, core, -0.79, p, 0.01);
  }
  const board = box(2.05, 2.05, 0.05, own(new THREE.MeshStandardMaterial({ color: 0x253e59, metalness: 0.48, roughness: 0.6 })), core, 0, 0, -0.32);
  const boardEdges = new THREE.LineSegments(own(new THREE.EdgesGeometry(board.geometry)), own(new THREE.LineBasicMaterial({ color: 0x527396, transparent: true, opacity: 0.65 })));
  boardEdges.position.copy(board.position); core.add(boardEdges);
  const layers = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(own(new THREE.TorusGeometry(1.06 + i * 0.13, 0.012, 5, 60)), own(new THREE.MeshBasicMaterial({ color: i === 1 ? 0x87cde4 : 0x548bd9, transparent: true, opacity: 0.32 })));
    ring.position.z = -0.36 - i * 0.16;
    core.add(ring); layers.push(ring);
  }
  const centralLabel = makeLabel('ZiewCore', true);
  const status = doc.createElement('div');
  Object.assign(status.style, { position: 'absolute', left: '14px', right: '14px', bottom: '11px', color: '#b7cbe0', font: '11px/1.4 Arial,sans-serif', textAlign: 'center', letterSpacing: '.025em' });
  status.style.display='none'; // The dialog stepper and industry heading already show this context.
  wrap.appendChild(status);
  function makeLabel(text, central = false) {
    const label = doc.createElement('span');
    label.textContent = text;
    Object.assign(label.style, { position: 'absolute', top: '0', left: '0', whiteSpace: 'nowrap', color: '#b5c7dc', font: `${central ? '600 14px' : '500 12px'}/1.3 Arial,"Noto Sans KR",sans-serif`, padding: central ? '5px 9px' : '3px 6px', background: central ? 'rgba(24,43,65,.93)' : 'rgba(29,49,73,.9)', border: `1px solid ${central ? '#52749b' : 'transparent'}`, borderRadius: '3px', transform: 'translate(-50%,-50%)' });
    labelLayer.appendChild(label); return label;
  }
  const unitBox = own(new THREE.BoxGeometry(0.46, 0.46, 0.28));
  const unitPlate = own(new THREE.BoxGeometry(0.32, 0.32, 0.04));
  const nodes = NODES.map((data, index) => {
    const group = new THREE.Group();
    const material = own(new THREE.MeshStandardMaterial({ color: 0x426183, metalness: 0.55, roughness: 0.38 }));
    const plateMaterial = own(new THREE.MeshStandardMaterial({ color: 0x50779c, metalness: 0.4, roughness: 0.42, emissive: 0x24476c, emissiveIntensity: 0.12 }));
    const housing = new THREE.Mesh(unitBox, material);
    const plate = new THREE.Mesh(unitPlate, plateMaterial); plate.position.z = 0.16;
    group.add(housing, plate); graph.add(group);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
    const geometry = own(new THREE.BufferGeometry());
    const lineMaterial = own(new THREE.LineBasicMaterial({ color: 0x58799d, transparent: true, opacity: 0.23 }));
    const link = new THREE.Line(geometry, lineMaterial); graph.add(link);
    const packet = new THREE.Mesh(own(new THREE.SphereGeometry(0.042, 8, 6)), cyan); graph.add(packet); packet.visible = false;
    const verified = new THREE.Mesh(own(new THREE.TorusGeometry(0.29, 0.011, 4, 32)), own(new THREE.MeshBasicMaterial({ color: 0x88cbdd, transparent: true, opacity: 0.8 })));
    verified.position.z = 0.19; group.add(verified); verified.visible = false;
    return { ...data, index, group, material, plateMaterial, curve, link, packet, verified, label: makeLabel(english() ? data.en : data.ko), selected: false, labelPosition: new THREE.Vector3() };
  });
  function layout() {
    if (disposed) return;
    width = Math.max(1, wrap.clientWidth || 330); height = Math.max(1, wrap.clientHeight || 440);
    compact = width / height > 1.15;
    camera.aspect = width / height;
    const rx = compact ? 3.8 : 2.32, ry = compact ? 1.49 : 2.98;
    const boundX = rx + 0.77, boundY = ry + 0.65;
    const fov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.z = Math.max(boundY / fov, boundX / (fov * camera.aspect)) + 0.48;
    camera.updateProjectionMatrix(); renderer.setSize(width, height, false);
    core.scale.setScalar(compact ? 0.83 : 1);
    nodes.forEach((node, index) => {
      const angle = Math.PI / 2 - index / nodes.length * Math.PI * 2;
      node.group.position.set(Math.cos(angle) * rx, Math.sin(angle) * ry, -0.03 + Math.cos(angle * 2) * 0.18);
      node.group.rotation.set(0.1, -0.16, 0);
      node.labelPosition.copy(node.group.position).add(new THREE.Vector3(0, -0.41, 0.1));
      node.curve.points = [node.group.position.clone(), node.group.position.clone().multiplyScalar(0.55).add(new THREE.Vector3(0, 0, -0.38)), new THREE.Vector3(0, 0, -0.26)];
      const previous = node.link.geometry;
      owned.delete(previous); previous.dispose();
      node.link.geometry = own(new THREE.BufferGeometry().setFromPoints(node.curve.getPoints(28)));
    });
    render();
  }
  function refresh() {
    const selectedIds = new Set((state.systems || []).map((system) => system.id));
    nodes.forEach((node) => {
      node.selected = selectedIds.has(node.id);
      const illuminated = node.selected || state.phase === 0;
      node.material.color.setHex(node.selected ? 0x8ba8c4 : 0x395572);
      node.plateMaterial.color.setHex(node.selected ? 0x3d86ed : 0x4b6987);
      node.plateMaterial.emissiveIntensity = node.selected ? 0.24 : 0.03;
      node.link.material.color.setHex(node.selected ? 0x72b1ea : 0x6584a5);
      node.link.material.opacity = node.selected ? 0.8 : state.phase === 0 ? 0.3 : 0.12;
      node.label.textContent = english() ? node.en : node.ko;
      node.label.style.color = node.selected ? '#f0f7ff' : illuminated ? '#c0d1e3' : '#8198b1';
      node.label.style.borderColor = node.selected ? '#5c96d5' : 'transparent';
      node.label.style.background = node.selected ? 'rgba(36,69,105,.97)' : 'rgba(29,49,73,.88)';
      node.verified.visible = state.phase === 3 && node.selected;
      node.packet.visible = state.phase === 2 && node.selected;
      if (node.packet.visible) node.packet.position.copy(node.curve.getPoint(0.3 + (node.index % 3) * 0.2));
    });
    const names = (state.systems || []).map((system) => english() ? system.en : system.ko).join(', ');
    const phaseNames = english() ? ['System architecture', 'Select systems to connect', 'Training simulation', 'Simulation complete'] : ['시스템 아키텍처', '연결할 시스템 선택', 'AI 학습 시뮬레이션', '시뮬레이션 완료'];
    const industryName = state.industry ? (english() ? state.industry.en : state.industry.ko) : '';
    status.textContent = `${industryName ? industryName + ' · ' : ''}${phaseNames[state.phase] || phaseNames[0]}`;
    wrap.setAttribute('aria-label', `ZiewCore. ${status.textContent}. ${names || (english() ? 'ERP, MES, SCADA, CCTV, IoT, CRM, WMS, POS, HRM' : 'ERP, MES, SCADA, CCTV, IoT 센서, CRM, WMS, POS, HRM')}`);
    fallback.textContent = `ZiewCore\n${status.textContent}\n${names}`;
    render();
  }
  function projectLabel(label, point) {
    projected.copy(point); graph.localToWorld(projected); projected.project(camera);
    label.style.left = `${(projected.x * 0.5 + 0.5) * width}px`;
    label.style.top = `${(-projected.y * 0.5 + 0.5) * height}px`;
  }
  function render() {
    if (disposed || !renderer || contextLost) return;
    graph.updateMatrixWorld(true);
    renderer.render(scene, camera);
    nodes.forEach((node) => projectLabel(node.label, node.labelPosition));
    projectLabel(centralLabel, new THREE.Vector3(0, compact ? -0.28 : -0.39, 0.68));
  }
  function animate(time) {
    raf = 0;
    if (disposed || paused || !visible || doc.hidden || reduce() || contextLost) return;
    raf = requestAnimationFrame(animate);
    if (time - lastFrame < 1000 / 30) return;
    const delta = Math.min(0.07, (time - lastFrame) / 1000 || 0);
    lastFrame = time; elapsed += delta;
    smoothPointer.lerp(pointer, 0.08);
    graph.rotation.x = smoothPointer.y * 0.055;
    graph.rotation.y = smoothPointer.x * 0.075 + Math.sin(elapsed * 0.18) * 0.024;
    core.rotation.y = -0.21 + Math.sin(elapsed * 0.31) * 0.08;
    layers.forEach((ring, index) => {
      const training = state.phase === 2;
      ring.rotation.x = training ? Math.sin(elapsed * 0.65 + index) * 0.14 : 0;
      ring.position.z = -0.36 - index * 0.16 + (training ? Math.sin(elapsed * 1.3 + index * 1.7) * 0.16 : 0);
      ring.material.opacity = training ? 0.42 + Math.sin(elapsed * 1.7 + index) * 0.12 : 0.2;
    });
    nodes.forEach((node) => {
      if (node.packet.visible) node.packet.position.copy(node.curve.getPoint((elapsed * 0.28 + node.index * 0.17) % 1));
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
  }
  function onLeave() { pointer.set(0, 0); }
  function onVisibility() { resume(); }
  function onLost(event) { contextLost = true; event.preventDefault(); cancelAnimationFrame(raf); raf = 0; fallback.style.display = 'flex'; labelLayer.style.display = 'none'; }
  function onRestored() { contextLost = false; fallback.style.display = 'none'; labelLayer.style.display = 'block'; layout(); refresh(); resume(); }
  wrap.addEventListener('pointermove', onPointer, { passive: true });
  wrap.addEventListener('pointerleave', onLeave);
  doc.addEventListener('visibilitychange', onVisibility);
  motionPreference?.addEventListener('change', onVisibility);
  renderer.domElement.addEventListener('webglcontextlost', onLost);
  renderer.domElement.addEventListener('webglcontextrestored', onRestored);
  const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(layout) : null;
  if (resize) resize.observe(host); else window.addEventListener('resize', layout);
  const intersection = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); }) : null;
  if (intersection) intersection.observe(host);
  layout(); refresh(); resume();
  return {
    update(next = {}) { if (disposed) return; state = { ...state, ...next }; refresh(); },
    setPaused(value) { paused = Boolean(value); if(!paused)manualMotionOverride=true; resume(); },
    dispose() {
      if (disposed) return;
      disposed = true; cancelAnimationFrame(raf);
      resize?.disconnect(); intersection?.disconnect(); window.removeEventListener('resize', layout);
      wrap.removeEventListener('pointermove', onPointer); wrap.removeEventListener('pointerleave', onLeave);
      doc.removeEventListener('visibilitychange', onVisibility);
      motionPreference?.removeEventListener('change', onVisibility);
      renderer.domElement.removeEventListener('webglcontextlost', onLost); renderer.domElement.removeEventListener('webglcontextrestored', onRestored);
      owned.forEach((resource) => resource.dispose()); owned.clear(); renderer.dispose(); renderer.forceContextLoss(); wrap.remove();
    }
  };
}
