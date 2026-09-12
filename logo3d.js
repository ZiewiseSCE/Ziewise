import * as THREE from './vendor/three.module.js';
import { createLogoPatternGeometry, createLogoBodyGeometry } from './logo-pattern-geometry.js?v=20260912-connected1';

/** Rounded original contours, with the source logo supplying the surface colors. */
export function mountLogo(host, { imageUrl = 'logo-symbol.png', onReady } = {}) {
  const noop = { setPaused() {}, dispose() {} };
  if (!host || host.tagName === 'IMG') return noop;
  const fallbackImages = Array.from(host.querySelectorAll('img'));
  const originalImageOpacity = fallbackImages.map(img => img.style.opacity);
  const previousPosition = host.style.position;
  const positionedHost = getComputedStyle(host).position === 'static';
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power', premultipliedAlpha: true }); }
  catch { queueMicrotask(() => onReady?.({ webgl: false })); return noop; }

  const canvas = renderer.domElement;
  canvas.className = 'ziewise-logo-webgl';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;display:block;width:100%;height:100%;pointer-events:none;opacity:0;';
  if (positionedHost) host.style.position = 'relative';
  host.appendChild(canvas);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.8));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.24;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1.15, 1.15, 1.15, -1.15, .1, 12);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight('#ecf4f8', '#24384a', 1.7));
  const key = new THREE.DirectionalLight('#ffffff', 3.4);
  key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight('#b9d9e8', 1.5);
  rim.position.set(4, 1, -3); scene.add(rim);

  const studio = new THREE.Scene();
  studio.background = new THREE.Color('#49525b');
  const studioObjects = [];
  for (const [w, h, position, intensity] of [[3, 5, [-3, 4, 3], 3.2], [2, 5, [4, 1, 2], 1.7], [4, 2, [0, 4, -4], 2.4]]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(intensity), side: THREE.DoubleSide }));
    panel.position.set(...position); panel.lookAt(0, 0, 0); studio.add(panel); studioObjects.push(panel);
  }
  let environment;
  function rebuildEnvironment() {
    environment?.dispose();
    const generator = new THREE.PMREMGenerator(renderer);
    environment = generator.fromScene(studio, .06, .1, 20);
    scene.environment = environment.texture;
    scene.environmentIntensity = 1.1;
    generator.dispose();
  }
  rebuildEnvironment();

  const group = new THREE.Group();
  const sculpture = new THREE.Group();
  sculpture.rotation.set(0, 0, 0);
  group.add(sculpture); scene.add(group);
  const strokes = createLogoPatternGeometry();
  const faceMaterial = new THREE.MeshPhysicalMaterial({ color: '#ffffff', side: THREE.DoubleSide, metalness: .35, roughness: .36, clearcoat: .3, envMapIntensity: .5 });
  const sideMaterials = strokes.map(stroke => new THREE.MeshPhysicalMaterial({ color: stroke.color, metalness: .5, roughness: .35, clearcoat: .25, clearcoatRoughness: .3, side: THREE.DoubleSide }));
  strokes.forEach((stroke, i) => sculpture.add(new THREE.Mesh(stroke.geometry, [faceMaterial, sideMaterials[i]])));
  const bodyGeometry = createLogoBodyGeometry();
  const bodyMaterial = new THREE.MeshPhysicalMaterial({ color: '#26343c', metalness: .72, roughness: .38, clearcoat: .4, clearcoatRoughness: .3 });
  sculpture.add(new THREE.Mesh(bodyGeometry, bodyMaterial));

  let disposed = false;
  let loaded = false;
  let texture;
  let ready = false;
  let contextAvailable = true;
  let paused = false;
  let visible = !document.hidden;
  let intersecting = true;
  let frame = 0;
  let elapsed = 0;
  let lastTime = 0;
  let lastPaint = 0;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motion.matches;
  let manualMotionOverride = false;
  const duration = 28;

  function reveal() {
    if (disposed || !loaded || !contextAvailable) return;
    canvas.style.opacity = '1';
    fallbackImages.forEach(img => { img.style.opacity = '0'; });
    if (!ready) { ready = true; onReady?.({ webgl: true, sourceContours: true }); }
  }
  function restoreFallback() {
    canvas.style.opacity = '0';
    fallbackImages.forEach((img, i) => { img.style.opacity = originalImageOpacity[i]; });
  }
  function draw() {
    if (disposed || !loaded || !contextAvailable) return;
    renderer.render(scene, camera); reveal();
  }
  const active = () => !disposed && ready && contextAvailable && !paused && (!reducedMotion || manualMotionOverride) && visible && intersecting;
  function animate(now) {
    frame = 0;
    if (!active()) return;
    if (lastTime) elapsed += Math.min((now - lastTime) / 1000, .08);
    lastTime = now;
    if (now - lastPaint >= 32) {
      lastPaint = now;
      group.rotation.y = elapsed / duration * Math.PI * 2;
      draw();
    }
    frame = requestAnimationFrame(animate);
  }
  function sync() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; lastTime = 0; lastPaint = 0;
    if (active()) frame = requestAnimationFrame(animate);
  }
  function resize() {
    if (disposed) return;
    const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
    const aspect = width / height;
    const halfHeight = 1.105 * Math.max(1, 1 / aspect);
    camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect;
    camera.top = halfHeight; camera.bottom = -halfHeight;
    camera.updateProjectionMatrix(); renderer.setSize(width, height, false); draw();
  }
  function visibilityChange() { visible = !document.hidden; sync(); }
  function motionChange(event) { reducedMotion = event.matches; manualMotionOverride = false; sync(); }
  function contextLost(event) { event.preventDefault(); contextAvailable = false; restoreFallback(); sync(); }
  function contextRestored() { if (disposed) return; contextAvailable = true; rebuildEnvironment(); resize(); sync(); }
  document.addEventListener('visibilitychange', visibilityChange);
  motion.addEventListener('change', motionChange);
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  const intersectionObserver = new IntersectionObserver(entries => { intersecting = entries[0]?.isIntersecting ?? true; sync(); }, { rootMargin: '40px' });
  intersectionObserver.observe(host);
  resize(); sync();
  new THREE.TextureLoader().load(imageUrl, map => {
    if (disposed) { map.dispose(); return; }
    texture = map; texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    faceMaterial.map = texture; faceMaterial.needsUpdate = true;
    loaded = true; draw(); sync();
  }, undefined, () => {
    if (!disposed) { restoreFallback(); onReady?.({ webgl: false }); }
  });

  return {
    setPaused(value, { manual = false } = {}) { paused = Boolean(value); if (manual && !paused) manualMotionOverride = true; sync(); },
    dispose() {
      if (disposed) return;
      restoreFallback(); disposed = true;
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect(); intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', visibilityChange); motion.removeEventListener('change', motionChange);
      canvas.removeEventListener('webglcontextlost', contextLost); canvas.removeEventListener('webglcontextrestored', contextRestored);
      strokes.forEach(stroke => stroke.geometry.dispose()); sideMaterials.forEach(material => material.dispose());
      bodyGeometry.dispose(); bodyMaterial.dispose();
      faceMaterial.dispose(); texture?.dispose();
      studioObjects.forEach(object => { object.geometry.dispose(); object.material.dispose(); }); environment?.dispose();
      renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
      if (positionedHost) host.style.position = previousPosition;
    },
  };
}
