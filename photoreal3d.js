import * as THREE from './vendor/three.module.js';

/** Exact perspective fit for bounds expressed relative to the camera's orbit target. */
export function fitRackDistance(corners, azimuth, elevation, aspect, verticalFov = 39) {
  const tanY = Math.tan(verticalFov * Math.PI / 360);
  const tanX = tanY * Math.max(.1, aspect);
  const sinA = Math.sin(azimuth), cosA = Math.cos(azimuth);
  const sinE = Math.sin(elevation), cosE = Math.cos(elevation);
  let distance = .1;
  for (const point of corners) {
    const depth = point.x * sinA * cosE + point.y * sinE + point.z * cosA * cosE;
    const horizontal = point.x * cosA - point.z * sinA;
    const vertical = -point.x * sinA * sinE + point.y * cosE - point.z * cosA * sinE;
    // Leave space for the fixed heading and enough air below the rack feet.
    distance = Math.max(distance, depth + .08, depth + Math.abs(horizontal) / (tanX * .90), depth + Math.abs(vertical) / (tanY * .78));
  }
  return distance + .04;
}

/** A full-volume, photo-textured data-centre installation. No camera-facing image planes. */
export function mountPhotoreal(element, { onReady, onError, onContextLost, label = 'Photographic 3D infrastructure. Drag or use the arrow keys to explore all sides.' } = {}) {
  if (!element) return { setPaused() {}, setScrollProgress() {}, setLabel() {}, resetView() {}, dispose() {} };
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  } catch (error) {
    queueMicrotask(() => onError?.(error));
    return { setPaused() {}, setScrollProgress() {}, setLabel() {}, resetView() {}, dispose() {} };
  }

  const canvas = renderer.domElement;
  canvas.className = 'ziewise-webgl photoreal-webgl';
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab;outline-offset:-5px;visibility:hidden;';
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', label);
  element.append(canvas);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#10171b');
  scene.fog = new THREE.Fog('#10171b', 10, 21);
  const camera = new THREE.PerspectiveCamera(39, 1, .06, 80);
  const target = new THREE.Vector3(0, 2.15, 0);
  const defaultOrbit = { azimuth: -.49, elevation: .09 };
  const desired = { ...defaultOrbit, distance: 10 };
  const orbit = { ...desired };
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = media.matches;
  let manualMotionOverride = false;
  let paused = false;
  let visible = true;
  let ready = false;
  let disposed = false;
  let graphicsLost = false;
  let contextTimer = 0;
  let previous = 0;
  let frame = 0;
  let aspect = 1;
  let dirtyShadows = true;
  let pointerActive = false;
  let lastInteraction = -Infinity;
  let lastX = 0;
  let lastY = 0;

  const geometry = value => { geometries.add(value); return value; };
  const material = value => { materials.add(value); return value; };
  const texture = value => { textures.add(value); return value; };
  const steel = material(new THREE.MeshStandardMaterial({ color: '#20272a', roughness: .43, metalness: .78 }));
  const black = material(new THREE.MeshStandardMaterial({ color: '#101719', roughness: .68, metalness: .28 }));
  const recess = material(new THREE.MeshStandardMaterial({ color: '#060b0d', roughness: .95, metalness: .04 }));
  const aluminium = material(new THREE.MeshStandardMaterial({ color: '#6c7679', roughness: .34, metalness: .92 }));
  const cableMaterial = material(new THREE.MeshStandardMaterial({ color: '#2b555a', roughness: .66, metalness: .06 }));
  const blackCable = material(new THREE.MeshStandardMaterial({ color: '#0c1113', roughness: .8, metalness: .01 }));
  const frontMaterial = material(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .7, metalness: .08, emissive: '#ffffff', emissiveIntensity: .12 }));
  const sideMaterial = material(new THREE.MeshStandardMaterial({ color: '#e9eef0', roughness: .72, metalness: .14, emissive: '#ffffff', emissiveIntensity: .085 }));
  const rearMaterial = material(new THREE.MeshStandardMaterial({ color: '#f4f5f5', roughness: .69, metalness: .12, emissive: '#ffffff', emissiveIntensity: .075 }));

  function box(parent, w, h, d, x, y, z, mat = black) {
    const mesh = new THREE.Mesh(geometry(new THREE.BoxGeometry(w, h, d)), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function imagePanel(parent, width, height, position, rotation, mat, crop = [0, 0, 1, 1]) {
    const geo = geometry(new THREE.PlaneGeometry(width, height));
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      const u = uv.getX(i), v = uv.getY(i);
      uv.setXY(i, crop[0] + u * (crop[2] - crop[0]), crop[1] + v * (crop[3] - crop[1]));
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...position);
    mesh.rotation.y = rotation;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function tube(parent, points, radius, mat) {
    const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
    const mesh = new THREE.Mesh(geometry(new THREE.TubeGeometry(curve, 28, radius, 7, false)), mat);
    mesh.castShadow = true;
    parent.add(mesh);
  }

  // The broad luminous ceiling panels form reflections, not a flat grey ambient wash.
  const environmentScene = new THREE.Scene();
  environmentScene.background = new THREE.Color('#22282c');
  for (const [width, height, xyz, strength] of [
    [7, 3, [-3, 6, 3], 3.8], [1.3, 6, [4, 3, 1], 2.2], [5, 2, [0, 5, -5], 2.7], [3, 1, [-4, 1, -2], .65],
  ]) {
    const mesh = new THREE.Mesh(geometry(new THREE.PlaneGeometry(width, height)), material(new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(strength), side: THREE.DoubleSide })));
    mesh.position.set(...xyz);
    mesh.lookAt(0, 1, 0);
    environmentScene.add(mesh);
  }
  let environment;
  function buildEnvironment() {
    environment?.dispose();
    const generator = new THREE.PMREMGenerator(renderer);
    environment = generator.fromScene(environmentScene, .1, .1, 50);
    scene.environment = environment.texture;
    scene.environmentIntensity = .85;
    generator.dispose();
  }
  buildEnvironment();
  scene.add(new THREE.HemisphereLight('#cfdae0', '#0d1215', 1.1));
  const key = new THREE.DirectionalLight('#eef3f5', 2.65);
  key.position.set(-3, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -6; key.shadow.camera.right = 6;
  key.shadow.camera.top = 7; key.shadow.camera.bottom = -5;
  key.shadow.camera.near = .5; key.shadow.camera.far = 22;
  key.shadow.normalBias = .012;
  key.shadow.bias = -.0001;
  key.shadow.radius = 3;
  scene.add(key);
  const edge = new THREE.DirectionalLight('#c5dce3', 1.05);
  edge.position.set(4, 4, -4);
  scene.add(edge);
  const serviceLight = new THREE.DirectionalLight('#d5dddf', 1.65);
  serviceLight.position.set(-2, 5, -6);
  scene.add(serviceLight);

  // Life-size racks in a continuous room: no turntable, floating stage or display plinth.
  const installation = new THREE.Group();
  scene.add(installation);
  const allScrews = [];
  const rackHeight = 4.18;
  const rackWidth = 1.39;
  const rackDepth = 1.92;
  const frontZ = rackDepth / 2;
  const rowX = [-1.44, 0, 1.44];
  // Atlas seams measured from the 887 × 1774 front photograph (top to bottom).
  const serverBands = [0, 72, 148, 247, 356, 468, 549, 608, 746, 884, 956, 1109, 1172, 1250, 1385, 1521, 1661, 1774].map(value => value / 1774);
  rowX.forEach((rackX, rackIndex) => {
    const rack = new THREE.Group();
    rack.position.set(rackX, 0, rackIndex === 2 ? -.055 : 0);
    installation.add(rack);
    // Enclosures remain opaque and dimensional from the sides, top and rear.
    for (const side of [-1, 1]) box(rack, .035, rackHeight, rackDepth, side * (rackWidth / 2 - .0175), rackHeight / 2 + .06, 0, black);
    box(rack, rackWidth - .07, rackHeight, .035, 0, rackHeight / 2 + .06, -frontZ + .0175, black);
    box(rack, rackWidth + .04, .055, rackDepth + .02, 0, rackHeight + .087, 0, steel);
    box(rack, rackWidth, .07, rackDepth, 0, .095, 0, steel);
    imagePanel(rack, rackDepth - .035, rackHeight - .045, [rackWidth / 2 + .001, rackHeight / 2 + .06, 0], Math.PI / 2, sideMaterial);
    imagePanel(rack, rackDepth - .035, rackHeight - .045, [-rackWidth / 2 - .001, rackHeight / 2 + .06, 0], -Math.PI / 2, sideMaterial);
    // The full front photograph is cut at rack-unit boundaries, then mapped onto
    // separate closed trays. Their physically different recesses are visible on orbit.
    const faceWidth = rackWidth - .102;
    const faceHeight = rackHeight - .135;
    const faceBottom = .137;
    const bandOrder = rackIndex === 0 ? [0, 2, 5, 3, 4, 1, 6, 10, 7, 8, 9, 11, 12, 14, 13, 15, 16] : rackIndex === 2 ? [0, 3, 4, 1, 5, 2, 6, 7, 10, 11, 8, 9, 12, 13, 15, 14, 16] : Array.from({ length: 17 }, (_, i) => i);
    let layoutTop = 0;
    for (const band of bandOrder) {
      const start = serverBands[band], end = serverBands[band + 1];
      const h = (end - start) * faceHeight;
      const y = faceBottom + faceHeight * (1 - layoutTop) - h / 2;
      const inset = [.011, .021, .006, .014, .04, .02, .009][band % 7];
      const z = frontZ + .016 - inset;
      box(rack, faceWidth, h - .01, .25, 0, y, z - .132, recess);
      imagePanel(rack, faceWidth, h - .009, [0, y, z], 0, frontMaterial, [.036, 1 - end, .964, 1 - start]);
      // Slim tray lips reveal true highlights along the unit's top edge.
      box(rack, faceWidth, .009, .014, 0, y + h / 2 - .006, z - .008, steel);
      // Patch leads follow the photographed ports, rising from the face in actual 3D.
      if (band === 1 || band === 5) {
        const photoPoint = (px, py, depth) => [((px / 887 - .036) / .928 - .5) * faceWidth, y + h / 2 - (py / 1774 - start) * faceHeight, z + depth];
        const cords = band === 1 ? [
          [[540, 89, .007], [591, 96, .034], [662, 111, .045], [744, 112, .036], [779, 89, .007]],
          [[538, 109, .007], [592, 117, .038], [665, 132, .046], [745, 130, .037], [780, 109, .007]],
        ] : [
          [[494, 482, .007], [552, 492, .035], [635, 518, .046], [732, 513, .034], [778, 485, .007]],
          [[493, 505, .007], [550, 513, .032], [640, 538, .048], [734, 530, .034], [779, 507, .007]],
        ];
        for (const points of cords) tube(rack, points.map(point => photoPoint(...point)), .0065, cableMaterial);
      }
      layoutTop += end - start;
    }
    for (const side of [-1, 1]) {
      box(rack, .049, rackHeight, .093, side * (rackWidth / 2 - .014), rackHeight / 2 + .06, frontZ + .014, steel);
      box(rack, .018, rackHeight - .12, .018, side * (rackWidth / 2 - .066), rackHeight / 2 + .06, frontZ + .025, recess);
      for (let s = 0; s < 22; s++) allScrews.push([rackX + side * (rackWidth / 2 - .022), .22 + s * .177, rack.position.z + frontZ + .063]);
    }
    // A proper service rear with vent grilles, power units and hanging patch leads.
    const rear = -frontZ - .018;
    const rearBands = [0, 183, 312, 461, 591, 745, 899, 1053, 1207, 1377, 1529, 1657, 1774].map(value => value / 1774);
    for (let band = 0; band < rearBands.length - 1; band++) {
      const start = rearBands[band], end = rearBands[band + 1];
      const h = (end - start) * faceHeight;
      const y = faceBottom + faceHeight * (1 - (start + end) / 2);
      const z = rear - .048 - (band % 3) * .006;
      box(rack, faceWidth, h - .008, .18, 0, y, z + .096, recess);
      imagePanel(rack, faceWidth, h - .008, [0, y, z], Math.PI, rearMaterial, [.036, 1 - end, .964, 1 - start]);
      box(rack, faceWidth, .008, .014, 0, y + h / 2 - .005, z + .008, steel);
    }
    for (const side of [-1, 1]) box(rack, .044, rackHeight, .074, side * (rackWidth / 2 - .015), rackHeight / 2 + .06, rear - .035, steel);
    for (let cable = 0; cable < 3; cable++) {
      const x = .52 + cable * .012;
      tube(rack, [[x, 3.98 - cable * .035, rear - .06], [.62 + cable * .012, 3.85, rear - .10], [.665 + cable * .01, 3.55, rear - .13], [.66 + cable * .009, 2.86, rear - .12], [.53, 2.79 - cable * .03, rear - .063]], .009, blackCable);
    }
    for (const x of [-.49, .49]) for (const z of [-.69, .69]) box(rack, .10, .065, .12, x, .033, z, recess);
  });

  // Tiny repeated pieces share one draw call each.
  function instances(points, geo, mat, rotation = 0) {
    const mesh = new THREE.InstancedMesh(geometry(geo), mat, points.length);
    const transform = new THREE.Object3D();
    points.forEach((point, i) => { transform.position.set(...point); transform.rotation.x = rotation; transform.updateMatrix(); mesh.setMatrixAt(i, transform.matrix); });
    mesh.castShadow = false;
    scene.add(mesh);
  }
  instances(allScrews, new THREE.CylinderGeometry(.012, .012, .008, 8), aluminium, Math.PI / 2);

  installation.updateMatrixWorld(true);
  const installationBounds = new THREE.Box3().setFromObject(installation).expandByScalar(.035);
  installationBounds.getCenter(target);
  const framingCorners = [];
  for (const x of [installationBounds.min.x, installationBounds.max.x]) {
    for (const y of [installationBounds.min.y, installationBounds.max.y]) {
      for (const z of [installationBounds.min.z, installationBounds.max.z]) {
        framingCorners.push(new THREE.Vector3(x, y, z).sub(target));
      }
    }
  }

  const floorMaterial = material(new THREE.MeshStandardMaterial({ color: '#0b1114', roughness: .96, metalness: .03 }));
  const floor = new THREE.Mesh(geometry(new THREE.PlaneGeometry(100, 100)), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  function cameraUpdate(snap = false) {
    const ease = snap ? 1 : .115;
    orbit.azimuth += (desired.azimuth - orbit.azimuth) * ease;
    orbit.elevation += (desired.elevation - orbit.elevation) * ease;
    const fit = fitRackDistance(framingCorners, orbit.azimuth, orbit.elevation, aspect, camera.fov);
    // Ease inward when space allows; pull outward immediately to avoid cropping.
    orbit.distance = Math.max(fit, orbit.distance + (fit - orbit.distance) * ease);
    camera.position.set(
      target.x + Math.sin(orbit.azimuth) * Math.cos(orbit.elevation) * orbit.distance,
      target.y + Math.sin(orbit.elevation) * orbit.distance,
      target.z + Math.cos(orbit.azimuth) * Math.cos(orbit.elevation) * orbit.distance,
    );
    camera.lookAt(target);
    scene.fog.near = orbit.distance + 5;
    scene.fog.far = orbit.distance + 24;
  }
  function render(snap = false) {
    if (disposed || graphicsLost) return;
    cameraUpdate(snap);
    if (dirtyShadows) { renderer.shadowMap.needsUpdate = true; dirtyShadows = false; }
    renderer.render(scene, camera);
  }
  const canMove = () => ready && !disposed && !graphicsLost && !paused && (!reducedMotion || manualMotionOverride) && visible && !document.hidden;
  function tick(now) {
    frame = 0;
    if (!canMove()) return;
    if (previous && now - previous < 32) { frame = requestAnimationFrame(tick); return; }
    const delta = previous ? Math.min(now - previous, 60) / 1000 : 0;
    previous = now;
    if (!pointerActive && now - lastInteraction >= 3000) desired.azimuth += delta * Math.PI * 2 / 60;
    render();
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    if (canMove()) frame = requestAnimationFrame(tick);
  }
  function resize() {
    if (disposed) return;
    const width = Math.max(1, element.clientWidth), height = Math.max(1, element.clientHeight);
    aspect = width / height;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    render(true);
  }
  function pointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerActive = true;
    lastInteraction = performance.now();
    desired.azimuth = orbit.azimuth;
    desired.elevation = orbit.elevation;
    lastX = event.clientX; lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
  }
  function pointerMove(event) {
    if (!pointerActive) return;
    const dx = event.clientX - lastX, dy = event.clientY - lastY;
    lastInteraction = performance.now();
    desired.azimuth -= dx * .007;
    desired.elevation = THREE.MathUtils.clamp(desired.elevation + dy * .004, .02, .52);
    lastX = event.clientX; lastY = event.clientY;
    if (!canMove()) render(true);
  }
  function pointerUp() { if (pointerActive) lastInteraction = performance.now(); pointerActive = false; canvas.style.cursor = 'grab'; }
  function resetView() {
    desired.azimuth = defaultOrbit.azimuth;
    desired.elevation = defaultOrbit.elevation;
    lastInteraction = performance.now();
    render(true);
  }
  function keyDown(event) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
    event.preventDefault();
    lastInteraction = performance.now();
    if (event.key === 'ArrowLeft') desired.azimuth -= .16;
    if (event.key === 'ArrowRight') desired.azimuth += .16;
    if (event.key === 'ArrowUp') desired.elevation = Math.min(.52, desired.elevation + .06);
    if (event.key === 'ArrowDown') desired.elevation = Math.max(.02, desired.elevation - .06);
    if (event.key === 'Home') { resetView(); return; }
    if (!canMove()) render(true);
  }
  function onMotion() { reducedMotion = media.matches; manualMotionOverride = false; sync(); render(true); }
  function contextLost(event) {
    event.preventDefault(); graphicsLost = true; sync();
    onContextLost?.();
    clearTimeout(contextTimer);
    contextTimer = setTimeout(() => { if (!disposed && graphicsLost) onError?.(new Error('The graphics context could not be restored.')); }, 5000);
  }
  function contextRestored() {
    if (disposed) return;
    clearTimeout(contextTimer); contextTimer = 0;
    graphicsLost = false; buildEnvironment(); dirtyShadows = true; render(true); sync();
    if (ready) {
      canvas.style.visibility = 'visible';
      onReady?.({ webgl: true, photographic: true, kind: 'infrastructure' });
    }
  }
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerUp);
  canvas.addEventListener('lostpointercapture', pointerUp);
  canvas.addEventListener('keydown', keyDown);
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);
  document.addEventListener('visibilitychange', sync);
  media.addEventListener('change', onMotion);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(element);
  const intersection = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); sync(); }, { rootMargin: '80px' });
  intersection.observe(element);

  const loader = new THREE.TextureLoader();
  function loadTexture(url) {
    return new Promise(resolve => loader.load(url, map => {
      if (disposed) { map.dispose(); resolve(null); return; }
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      texture(map);
      resolve(map);
    }, undefined, () => resolve(null)));
  }
  Promise.all([loadTexture('assets/rack-front-photo-v1.webp'), loadTexture('assets/rack-side-photo-v1.webp'), loadTexture('assets/rack-rear-photo-v1.webp')]).then(([frontMap, sideMap, rearMap]) => {
    if (disposed) return;
    if (!frontMap || !sideMap || !rearMap) {
      canvas.remove();
      onError?.(new Error('The photographic 3D textures could not be loaded.'));
      return;
    }
    frontMaterial.map = frontMap; frontMaterial.emissiveMap = frontMap; frontMaterial.needsUpdate = true;
    sideMaterial.map = sideMap; sideMaterial.emissiveMap = sideMap; sideMaterial.needsUpdate = true;
    rearMaterial.map = rearMap; rearMaterial.emissiveMap = rearMap; rearMaterial.needsUpdate = true;
    ready = true;
    if (graphicsLost) return;
    dirtyShadows = true;
    render(true);
    canvas.style.visibility = 'visible';
    sync();
    onReady?.({ webgl: true, photographic: Boolean(frontMap), kind: 'infrastructure' });
  });
  resize();

  return {
    setPaused(value, { manual = false } = {}) { paused = Boolean(value); if (manual && !paused) manualMotionOverride = true; sync(); },
    // The installation has its own orbit; scrolling does not interrupt its framing.
    setScrollProgress() {},
    resetView,
    setLabel(value) { label = value || ''; canvas.setAttribute('aria-label', label); },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      clearTimeout(contextTimer);
      resizeObserver.disconnect(); intersection.disconnect();
      document.removeEventListener('visibilitychange', sync);
      media.removeEventListener('change', onMotion);
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', pointerUp);
      canvas.removeEventListener('lostpointercapture', pointerUp);
      canvas.removeEventListener('keydown', keyDown);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose()); textures.forEach(item => item.dispose());
      environment?.dispose();
      renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    },
  };
}
