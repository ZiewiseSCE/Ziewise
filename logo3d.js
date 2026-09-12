import * as THREE from './vendor/three.module.js';
import { LOGO_OUTLINE } from './logo3d-geometry.js';

/**
 * An actual extrusion of the existing Ziewise mark, with its original PNG on
 * both faces. The supplied image is never modified. The host's existing image
 * remains the fallback and is hidden only after the first successful render.
 */
export function mountLogo(host, { imageUrl = 'logo-symbol.png' } = {}) {
  const noop = { setPaused() {}, dispose() {} };
  if (!host || host.tagName === 'IMG') return noop;
  const fallbackImages = Array.from(host.querySelectorAll('img'));
  const originalImageOpacity = fallbackImages.map(img => img.style.opacity);
  const previousPosition = host.style.position;
  const positionedHost = getComputedStyle(host).position === 'static';
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power', premultipliedAlpha: true });
  } catch {
    return noop;
  }

  const canvas = renderer.domElement;
  canvas.className = 'ziewise-logo-webgl';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;display:block;width:100%;height:100%;pointer-events:none;opacity:0;';
  if (positionedHost) host.style.position = 'relative';
  host.appendChild(canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1.15, 1.15, 1.15, -1.15, 0.1, 12);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight('#e6edf5', '#355374', 1.9));
  const key = new THREE.DirectionalLight('#ffffff', 2.5);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#aac7e5', 2.1);
  rim.position.set(4, 1, -3);
  scene.add(rim);

  const group = new THREE.Group();
  group.scale.x = LOGO_OUTLINE.width / LOGO_OUTLINE.height;
  group.rotation.x = -0.055;
  scene.add(group);
  const shapes = [];
  const normalisePoint = (x, y) => [x / LOGO_OUTLINE.width * 2 - 1, 1 - y / LOGO_OUTLINE.height * 2];
  function trace(path, points) {
    for (let i = 0; i < points.length; i += 2) {
      const [x, y] = normalisePoint(points[i], points[i + 1]);
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    }
    path.closePath();
  }
  for (const outline of LOGO_OUTLINE.shapes) {
    const shape = new THREE.Shape();
    trace(shape, outline.outer);
    for (const points of outline.holes) {
      const hole = new THREE.Path();
      trace(hole, points);
      shape.holes.push(hole);
    }
    shapes.push(shape);
  }

  // The UVs use the complete original image coordinates on both end caps.
  // This keeps every source color and curved highlight registered to its shape.
  const uvGenerator = {
    generateTopUV(geometry, vertices, a, b, c) {
      return [a, b, c].map(index => new THREE.Vector2((vertices[index * 3] + 1) / 2, (vertices[index * 3 + 1] + 1) / 2));
    },
    generateSideWallUV(geometry, vertices, a, b, c, d) {
      return [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1, 1), new THREE.Vector2(0, 1)];
    },
  };
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: 0.21,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelThickness: 0.004,
    bevelSize: 0.003,
    bevelOffset: -0.003,
    curveSegments: 1,
    material: 0,
    extrudeMaterial: 1,
    UVGenerator: uvGenerator,
  });
  geometry.translate(0, 0, -0.105);
  const face = new THREE.MeshBasicMaterial({ color: '#ffffff', alphaTest: 0.018, toneMapped: false });
  const edge = new THREE.MeshStandardMaterial({ color: '#8196aa', metalness: 0.52, roughness: 0.3 });
  const mesh = new THREE.Mesh(geometry, [face, edge]);
  group.add(mesh);

  let texture;
  let disposed = false;
  let loaded = false;
  let contextAvailable = true;
  let paused = false;
  let visible = !document.hidden;
  let intersecting = true;
  let frame = 0;
  let elapsed = 0;
  let lastTime = 0;
  let lastPaint = 0;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motion.matches;
  const duration = 22;

  function reveal() {
    if (!loaded || disposed || !contextAvailable) return;
    canvas.style.opacity = '1';
    // Opacity preserves the original image's accessible alternative text.
    fallbackImages.forEach(img => { img.style.opacity = '0'; });
  }
  function restoreFallback() {
    canvas.style.opacity = '0';
    fallbackImages.forEach((img, index) => { img.style.opacity = originalImageOpacity[index]; });
  }
  function draw() {
    if (!loaded || disposed || !contextAvailable) return;
    renderer.render(scene, camera);
    reveal();
  }
  function active() {
    return !disposed && loaded && contextAvailable && !paused && !reducedMotion && visible && intersecting;
  }
  function updateRotation() {
    const phase = elapsed / duration * Math.PI * 2;
    // Spend more of each complete turn facing the viewer; pass edges briskly.
    group.rotation.y = reducedMotion ? 0 : phase - 0.34 * Math.sin(phase * 2);
  }
  function animate(now) {
    frame = 0;
    if (!active()) return;
    if (lastTime) elapsed += Math.min((now - lastTime) / 1000, 0.08);
    lastTime = now;
    // RequestAnimationFrame keeps lifecycle handling simple, while actual WebGL
    // work is limited to roughly 30 draws per second on high-refresh displays.
    if (now - lastPaint >= 32) {
      lastPaint = now;
      updateRotation();
      draw();
    }
    frame = requestAnimationFrame(animate);
  }
  function sync() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    lastPaint = 0;
    if (active()) frame = requestAnimationFrame(animate);
  }
  function resize() {
    if (disposed) return;
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    const aspect = width / height;
    const halfHeight = 1.08 * Math.max(1, 1 / aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    draw();
  }
  function visibilityChange() { visible = !document.hidden; sync(); }
  function motionChange(event) {
    reducedMotion = event.matches;
    updateRotation();
    draw();
    sync();
  }
  function contextLost(event) {
    event.preventDefault();
    contextAvailable = false;
    restoreFallback();
    sync();
  }
  function contextRestored() {
    contextAvailable = true;
    resize();
    sync();
  }
  document.addEventListener('visibilitychange', visibilityChange);
  motion.addEventListener?.('change', motionChange);
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(host);
  if (!resizeObserver) window.addEventListener('resize', resize);
  const intersectionObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    intersecting = entries[0]?.isIntersecting ?? true;
    sync();
  }, { rootMargin: '40px' }) : null;
  intersectionObserver?.observe(host);

  resize();
  new THREE.TextureLoader().load(imageUrl, loadedTexture => {
    if (disposed) { loadedTexture.dispose(); return; }
    texture = loadedTexture;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
    face.map = texture;
    face.needsUpdate = true;
    loaded = true;
    updateRotation();
    draw();
    sync();
  }, undefined, () => {
    // The existing <img> continues to be the visible logo on any load failure.
    restoreFallback();
  });

  return {
    setPaused(value) { paused = Boolean(value); if (!paused) reducedMotion = false; sync(); },
    dispose() {
      if (disposed) return;
      restoreFallback();
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', visibilityChange);
      motion.removeEventListener?.('change', motionChange);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      geometry.dispose();
      face.dispose();
      edge.dispose();
      texture?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      if (positionedHost) host.style.position = previousPosition;
    },
  };
}
