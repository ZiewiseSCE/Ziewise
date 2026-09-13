import * as THREE from './vendor/three.module.js';

/** A dimensional neural-brain concept: folded hemispheres, fibers, and six domains. */
export function mountNeuralBrain(element, { onReady, onError, onContextLost, onPhase, label = 'ZiewCore neural brain and six specialist AIs' } = {}) {
  const empty = { setPaused() {}, setLabel() {}, resetView() {}, dispose() {} };
  if (!element) return empty;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' }); }
  catch (error) { queueMicrotask(() => onError?.(error)); return empty; }
  const canvas = renderer.domElement;
  canvas.className = 'ziewise-webgl neural-webgl';
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab';
  canvas.tabIndex = 0; canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', label);
  element.append(canvas);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0d171e');
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 70);
  const brain = new THREE.Group(); scene.add(brain);
  const resources = new Set();
  const keep = item => { resources.add(item); return item; };
  scene.add(new THREE.HemisphereLight('#c8e6ec', '#0d1828', 2.0));
  for (const [color, power, position] of [['#e5f4f7', 3, [-3, 4, 5]], ['#78b5c8', 2.6, [4, 2, -2]], ['#e2cc99', 1.1, [-4, -1, -2]]]) {
    const light = new THREE.DirectionalLight(color, power); light.position.set(...position); scene.add(light);
  }
  function corticalPoint(theta, phi, side, folded = true) {
    const fold = folded ? .045 * Math.sin(phi * 15 + Math.sin(theta * 5) * 2.6) * Math.sin(theta * 13 + Math.sin(phi * 3) * 1.8) * Math.sin(theta) : 0;
    const radius = 1 + fold;
    return new THREE.Vector3(side * (.022 + 1.18 * Math.sin(theta) * Math.cos(phi) * radius), Math.cos(theta) * 1.05 * radius + .10 * Math.sin(phi) * Math.sin(theta), Math.sin(theta) * Math.sin(phi) * 1.43 * radius);
  }
  // Continuous folds create depth and highlights across each closed hemisphere.
  for (const side of [-1, 1]) {
    const geo = keep(new THREE.SphereGeometry(1, 100, 72));
    const p = geo.attributes.position, uv = geo.attributes.uv, colors = [];
    for (let i = 0; i < p.count; i++) {
      const theta = (1 - uv.getY(i)) * Math.PI, phi = uv.getX(i) * Math.PI - Math.PI / 2;
      const point = corticalPoint(theta, phi, side); p.setXYZ(i, ...point);
      const groove = Math.sin(phi * 15 + Math.sin(theta * 5) * 2.6) * Math.sin(theta * 13 + Math.sin(phi * 3) * 1.8);
      const tone = .44 + groove * .10;
      colors.push(tone * .84, tone * 1.05, tone * 1.15);
    }
    if (side === 1) { const index = geo.index;for(let i=0;i<index.count;i+=3){const v=index.getX(i+1);index.setX(i+1,index.getX(i+2));index.setX(i+2,v);} }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geo.computeVertexNormals();
    brain.add(new THREE.Mesh(geo, keep(new THREE.MeshPhysicalMaterial({ vertexColors: true, metalness: .26, roughness: .48, transparent: true, opacity: .68, depthWrite: false, clearcoat: .45, clearcoatRoughness: .4, side: THREE.DoubleSide }))));
  }
  let seed = 47;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const nodes = [], positions = [], phases = [];
  for (let i = 0; i < 980; i++) {
    const theta = Math.acos(2 * random() - 1), phi = random() * Math.PI - Math.PI / 2;
    const point = corticalPoint(theta, phi, i % 2 ? -1 : 1, false);
    if (i % 3 === 0) point.multiplyScalar(.5 + random() * .4);
    nodes.push(point); positions.push(...point); phases.push(random() * Math.PI * 2);
  }
  const neuralGeometry = keep(new THREE.BufferGeometry());
  neuralGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  neuralGeometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));
  const pulseMaterial = keep(new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, pixelRatio: { value: renderer.getPixelRatio() } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute float phase;varying float vPhase;uniform float pixelRatio;void main(){vPhase=phase;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(26.*pixelRatio/-p.z,1.5,6.);}',
    fragmentShader: 'uniform float time;varying float vPhase;void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;float pulse=.22+.78*pow(max(0.,sin(time*1.3+vPhase)),7.);gl_FragColor=vec4(mix(vec3(.3,.58,.69),vec3(.81,.98,1.),pulse),smoothstep(.5,.0,r)*pulse);}'
  }));
  brain.add(new THREE.Points(neuralGeometry, pulseMaterial));
  const lines = [];
  nodes.forEach((point, i) => {
    const nearest = nodes.map((p, j) => ({ j, d: point.distanceToSquared(p) })).filter(n => n.j > i && n.d < .23).sort((a, b) => a.d - b.d).slice(0, 3);
    nearest.forEach(({ j }) => lines.push(...point, ...nodes[j]));
  });
  const fiberGeometry = keep(new THREE.BufferGeometry()); fiberGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
  brain.add(new THREE.LineSegments(fiberGeometry, keep(new THREE.LineBasicMaterial({ color: '#80c6d5', transparent: true, opacity: .12, depthWrite: false, blending: THREE.AdditiveBlending }))));
  const stem = new THREE.Mesh(keep(new THREE.CylinderGeometry(.15,.085,.65,20)),keep(new THREE.MeshStandardMaterial({color:'#5a899a',metalness:.3,roughness:.45})));
  stem.position.set(0,-1.13,-.45);stem.rotation.x=-.32;brain.add(stem);
  const cerebellum = new THREE.Mesh(keep(new THREE.SphereGeometry(.53,40,28)),keep(new THREE.MeshStandardMaterial({color:'#406574',metalness:.3,roughness:.55,wireframe:true,transparent:true,opacity:.22})));
  cerebellum.scale.set(1.2,.56,.8);cerebellum.position.set(0,-.79,-.74);brain.add(cerebellum);
  // A compact corpus-callosum bundle bridges the two hemispheres.
  for (let i = 0; i < 18; i++) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-.65, -.18, (i - 9) * .075), new THREE.Vector3(0, .27, (i - 9) * .064), new THREE.Vector3(.65, -.18, (i - 9) * .075)]);
    brain.add(new THREE.Line(keep(new THREE.BufferGeometry().setFromPoints(curve.getPoints(24))), keep(new THREE.LineBasicMaterial({ color: '#c0d6e1', transparent: true, opacity: .3 }))));
  }
  const names = ['VISION AI', 'NEURO-VPP', 'M-PULSE', 'SIGMING', 'ZIEWPRINT', 'OBSERVER'];
  const domains = [], dotGeometry = keep(new THREE.SphereGeometry(.055, 16, 12));
  names.forEach((name, i) => {
    const left = i < 3, x = left ? -2.0 : 2.0, y = 1.45 - (i % 3) * 1.45;
    const target = new THREE.Vector3(x, y, 0);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(left ? -.7 : .7, y * .34, 0), new THREE.Vector3(x * .74, y * .8, .25), target]);
    const mat = keep(new THREE.LineBasicMaterial({ color: '#87bdc9', transparent: true, opacity: .24 }));
    scene.add(new THREE.Line(keep(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40))), mat));
    const dot = new THREE.Mesh(dotGeometry, keep(new THREE.MeshStandardMaterial({ color: '#b5d1da', emissive: '#447987', emissiveIntensity: 1, metalness: .5, roughness: .3 })));
    dot.position.copy(target); scene.add(dot);
    const signal = new THREE.Mesh(keep(new THREE.SphereGeometry(.025, 10, 8)), keep(new THREE.MeshBasicMaterial({ color: '#e4f5f4' }))); scene.add(signal);
    const labelCanvas = document.createElement('canvas'); labelCanvas.width = 384; labelCanvas.height = 72;
    const ctx = labelCanvas.getContext('2d');ctx.font = '600 38px Inter, Arial, sans-serif';ctx.textAlign = 'center';ctx.fillStyle = '#c6dce4';ctx.fillText(name, 192, 48);
    const map = keep(new THREE.CanvasTexture(labelCanvas)); map.colorSpace = THREE.SRGBColorSpace;
    const text = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map, transparent: true, depthTest: false })));
    text.position.set(x, y - .22, .03); text.scale.set(1.20, .225, 1); scene.add(text);
    domains.push({ curve, signal, dot, mat, text });
  });
  let paused = false, override = false, visible = false, disposed = false, lost = false, frame = 0, previous = 0, time = 0, dragging = false, lastX = 0, lastY = 0, azimuth = -.3, tilt = .12, desiredAzimuth = -.3, desiredTilt = .12, lastInteraction = -Infinity, lostTimer = 0, lastPhase = -1;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const moving = () => !disposed && !lost && visible && !document.hidden && !paused && (!media.matches || override);
  function render(snap = false) {
    if (disposed || lost) return;
    azimuth += (desiredAzimuth - azimuth) * (snap ? 1 : .08); tilt += (desiredTilt - tilt) * (snap ? 1 : .08);
    brain.rotation.set(tilt, azimuth, -.045); pulseMaterial.uniforms.time.value = time;
    const phase = Math.floor(time / 7) % 4;
    if (phase !== lastPhase) { lastPhase = phase;onPhase?.(phase); }
    domains.forEach((domain, i) => { const active = phase !== 1 && (phase === 2 || Math.floor(time / 2) % 6 === i);domain.signal.visible = active;const t=(time*.35+i*.14)%1;domain.signal.position.copy(domain.curve.getPoint(phase===0||phase===3?1-t:t));domain.mat.opacity = active ? .7 : .17;domain.dot.material.emissiveIntensity = active ? 2.6 : .5; });
    renderer.render(scene, camera);
  }
  function tick(now) {
    frame = 0;if (!moving()) return;
    if (previous && now - previous < 32) { frame = requestAnimationFrame(tick);return; }
    time += previous ? Math.min(now - previous, 60) / 1000 : 0;previous = now;
    if (!dragging && now - lastInteraction > 3000) { desiredAzimuth += .004; desiredTilt = .12 + Math.sin(time * .22) * .06; }
    render();frame = requestAnimationFrame(tick);
  }
  function sync() { if (frame) cancelAnimationFrame(frame);frame = 0;previous = 0;if (moving()) frame = requestAnimationFrame(tick); }
  function resize() {
    const width = Math.max(1, element.clientWidth), height = Math.max(1, element.clientHeight);
    renderer.setSize(width, height, false);camera.aspect = width / height;
    const tanY = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.set(0, .15, Math.max(3.2 / (tanY * camera.aspect), 2.25 / tanY));camera.lookAt(0, 0, 0);camera.updateProjectionMatrix();
    const unit=2*camera.position.z*tanY/height, textHeight=width<500?18:23;
    domains.forEach(({text})=>text.scale.set(textHeight*384/72*unit,textHeight*unit,1));render(true);
  }
  const down = e => { if (e.pointerType === 'mouse' && e.button !== 0) return;dragging = true;lastX = e.clientX;lastY = e.clientY;lastInteraction = performance.now();canvas.setPointerCapture(e.pointerId); };
  const move = e => { if (!dragging) return;desiredAzimuth += (e.clientX - lastX) * .008;desiredTilt = THREE.MathUtils.clamp(desiredTilt + (e.clientY - lastY) * .005, -.5, .7);lastX = e.clientX;lastY = e.clientY;lastInteraction = performance.now();if (!moving()) render(true); };
  const up = () => { dragging = false;lastInteraction = performance.now(); };
  const resetView = () => { desiredAzimuth = -.3;desiredTilt = .12;lastInteraction = performance.now();render(true); };
  const key = e => { if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key)) return;e.preventDefault();lastInteraction = performance.now();if(e.key==='Home')resetView();else { desiredAzimuth += e.key==='ArrowLeft'?-.15:e.key==='ArrowRight'?.15:0;desiredTilt = THREE.MathUtils.clamp(desiredTilt + (e.key==='ArrowUp'?-.1:e.key==='ArrowDown'?.1:0),-.5,.7);render(true); } };
  const motion = () => { override = false;sync(); };
  const contextLost = e => { e.preventDefault();lost = true;sync();onContextLost?.();lostTimer = setTimeout(() => { if (lost && !disposed) onError?.(new Error('Neural graphics unavailable')); }, 4000); };
  const restored = () => { clearTimeout(lostTimer);lost = false;resize();sync();onReady?.(); };
  const events = [['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up],['lostpointercapture',up],['keydown',key],['webglcontextlost',contextLost],['webglcontextrestored',restored]];
  events.forEach(([name, fn]) => canvas.addEventListener(name, fn));
  const observer = new IntersectionObserver(entries => { visible = entries.some(e=>e.isIntersecting);sync(); });observer.observe(element);
  const resizer = new ResizeObserver(resize);resizer.observe(element);
  document.addEventListener('visibilitychange',sync);media.addEventListener('change',motion);
  resize();queueMicrotask(() => { if (!disposed) onReady?.(); });
  return {
    setPaused(value, {manual = false} = {}) { paused = Boolean(value);if(manual && !paused)override = true;sync(); },
    setLabel(value) { canvas.setAttribute('aria-label',value); },resetView,
    setPhase(phase) { time=THREE.MathUtils.clamp(Math.trunc(phase),0,3)*7;lastPhase=-1;render(true); },
    dispose() { if(disposed)return;disposed=true;if(frame)cancelAnimationFrame(frame);clearTimeout(lostTimer);observer.disconnect();resizer.disconnect();events.forEach(([name,fn])=>canvas.removeEventListener(name,fn));document.removeEventListener('visibilitychange',sync);media.removeEventListener('change',motion);resources.forEach(resource=>resource.dispose());renderer.dispose();renderer.forceContextLoss();canvas.remove(); }
  };
}
