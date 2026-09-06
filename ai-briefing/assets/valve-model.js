/**
 * Procedural, conceptual gate-valve assembly. All measurements are scene units.
 * THREE is supplied by the consumer; this module owns no renderer or animation.
 * Front/cutaway side is +Z; the main process line runs on X at Y = 1.5.
 */
export function createValveModel(THREE) {
  const root = new THREE.Group();
  root.name = 'industrial-gate-valve';
  const sensors = [];
  const flow = [];
  const PI = Math.PI;
  const materials = {
    steel: new THREE.MeshStandardMaterial({ color: 0xb5c1cb, metalness: 0.72, roughness: 0.33 }),
    brushed: new THREE.MeshStandardMaterial({ color: 0x667d90, metalness: 0.67, roughness: 0.43 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x253849, metalness: 0.62, roughness: 0.48 }),
    graphite: new THREE.MeshStandardMaterial({ color: 0x102738, metalness: 0.35, roughness: 0.57 }),
    bolt: new THREE.MeshStandardMaterial({ color: 0xd5dee3, metalness: 0.73, roughness: 0.3 }),
    amber: new THREE.MeshStandardMaterial({ color: 0xe4a448, emissive: 0xa4510b, emissiveIntensity: 0.23, metalness: 0.54, roughness: 0.38 }),
    wheel: new THREE.MeshStandardMaterial({ color: 0xa9402c, metalness: 0.4, roughness: 0.4 }),
    cyan: new THREE.MeshStandardMaterial({ color: 0x55daf1, emissive: 0x11b8e3, emissiveIntensity: 0.8, metalness: 0.25, roughness: 0.35 }),
    face: new THREE.MeshStandardMaterial({ color: 0xdbe8e8, metalness: 0.15, roughness: 0.55 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x81c8de, metalness: 0.15, roughness: 0.34, transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide }),
    shell: new THREE.MeshStandardMaterial({ color: 0xa2b7c8, metalness: 0.65, roughness: 0.36, side: THREE.DoubleSide }),
    highlight: new THREE.MeshStandardMaterial({ color: 0xffbc61, emissive: 0xf29222, emissiveIntensity: 0.62, metalness: 0.25, roughness: 0.35, transparent: true, opacity: 0.82, depthWrite: false })
  };
  const geometries = new Map();
  function geometry(key, make) {
    if (!geometries.has(key)) geometries.set(key, make());
    return geometries.get(key);
  }
  function add(parent, shape, material, x = 0, y = 0, z = 0, name = '') {
    const mesh = new THREE.Mesh(shape, material);
    mesh.position.set(x, y, z);
    mesh.name = name;
    mesh.castShadow = !material.transparent;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function cylinder(parent, radius, length, material, x, y, z, axis = 'y', name = '') {
    const shape = geometry(`c:${radius}:${length}`, () => new THREE.CylinderGeometry(radius, radius, length, 32));
    const mesh = add(parent, shape, material, x, y, z, name);
    if (axis === 'x') mesh.rotation.z = PI / 2;
    if (axis === 'z') mesh.rotation.x = PI / 2;
    return mesh;
  }
  function box(parent, width, height, depth, material, x, y, z, name = '') {
    return add(parent, geometry(`b:${width}:${height}:${depth}`, () => new THREE.BoxGeometry(width, height, depth)), material, x, y, z, name);
  }
  function torus(parent, radius, tube, material, x, y, z, axis = 'z', name = '') {
    const mesh = add(parent, geometry(`t:${radius}:${tube}`, () => new THREE.TorusGeometry(radius, tube, 8, 48)), material, x, y, z, name);
    if (axis === 'x') mesh.rotation.y = PI / 2;
    if (axis === 'y') mesh.rotation.x = PI / 2;
    return mesh;
  }
  const boltTransforms = [];
  function bolt(x, y, z, axis = 'x') {
    const transform = new THREE.Object3D();
    transform.position.set(x, y, z);
    if (axis === 'x') transform.rotation.z = PI / 2;
    if (axis === 'z') transform.rotation.x = PI / 2;
    transform.updateMatrix();
    boltTransforms.push(transform.matrix.clone());
  }
  function flange(parent, x, y, z, radius = 0.85) {
    // An annular flange leaves the process bore open for the cutaway view.
    torus(parent, radius - 0.105, 0.105, materials.steel, x, y, z, 'x', 'bolted-flange');
    torus(parent, radius - 0.107, 0.064, materials.dark, x + 0.095, y, z, 'x', 'flange-gasket');
    for (let i = 0; i < 10; i++) {
      const a = i * 2 * PI / 10;
      bolt(x + 0.13, y + (radius - 0.11) * Math.cos(a), z + (radius - 0.11) * Math.sin(a));
    }
  }

  // Solid rear semicylinders with translucent front shells reveal the flow bore.
  for (const side of [-1, 1]) {
    const segment = new THREE.Group();
    segment.position.set(side * 3.22, 1.5, 0);
    root.add(segment);
    const rear = add(segment, geometry('pipe-rear', () => new THREE.CylinderGeometry(0.65, 0.65, 4.28, 40, 1, true, PI / 2, PI)), materials.shell, 0, 0, 0, 'steel-pipe-rear');
    rear.rotation.z = PI / 2;
    const front = add(segment, geometry('pipe-front', () => new THREE.CylinderGeometry(0.65, 0.65, 4.28, 40, 1, true, -PI / 2, PI)), materials.glass, 0, 0, 0, 'cutaway-pipe-front');
    front.rotation.z = PI / 2;
    front.renderOrder = 3;
    for (const end of [-1, 1]) torus(segment, 0.65, 0.035, materials.steel, end * 2.14, 0, 0, 'x');
    flange(root, side * 1.09, 1.5, 0);
    flange(root, side * 5.25, 1.5, 0, 0.8);
  }

  // Split pressure chamber, with continuous metallic lips around the cut face.
  const back = add(root, geometry('chamber-back', () => new THREE.SphereGeometry(1, 40, 24, PI, PI)), materials.shell, 0, 1.5, 0, 'pressure-chamber-rear');
  back.scale.set(1.1, 0.92, 0.86);
  const front = add(root, geometry('chamber-front', () => new THREE.SphereGeometry(1, 40, 24, 0, PI)), materials.glass, 0, 1.5, 0, 'pressure-chamber-transparent-front');
  front.scale.copy(back.scale);
  front.renderOrder = 4;
  const chamberLip = torus(root, 1, 0.035, materials.steel, 0, 1.5, 0, 'z', 'chamber-cutaway-lip');
  chamberLip.scale.set(1.1, 0.92, 1);
  for (const x of [-0.96, 0.96]) torus(root, 0.59, 0.07, materials.brushed, x, 1.5, 0, 'x', 'valve-port-seat');

  // Movable gate is a plate across the X flow axis. Its highlight moves with it.
  const disc = new THREE.Group();
  disc.name = 'movable-gate';
  disc.position.set(0, 1.5, 0);
  root.add(disc);
  cylinder(disc, 0.61, 0.14, materials.amber, 0, 0, 0, 'x', 'amber-gate-disc');
  cylinder(disc, 0.33, 0.18, materials.brushed, 0, 0, 0, 'x', 'gate-reinforcing-hub');
  box(disc, 0.18, 1.25, 0.15, materials.steel, 0, 0.8, 0, 'gate-lift-link');
  const highlight = torus(disc, 0.625, 0.024, materials.highlight, 0.085, 0, 0, 'x', 'gate-status-highlight');

  // Bonnet, seals and yoke carry a visible rising spindle.
  cylinder(root, 0.43, 0.61, materials.steel, 0, 2.52, 0, 'y', 'valve-bonnet');
  cylinder(root, 0.56, 0.14, materials.brushed, 0, 2.76, 0, 'y', 'bonnet-flange');
  torus(root, 0.46, 0.035, materials.dark, 0, 2.85, 0, 'y', 'bonnet-seal');
  cylinder(root, 0.23, 0.22, materials.dark, 0, 2.96, 0, 'y', 'stem-packing');
  for (let i = 0; i < 8; i++) {
    const a = i * PI / 4;
    bolt(0.44 * Math.sin(a), 2.87, 0.44 * Math.cos(a), 'y');
  }
  for (const side of [-1, 1]) {
    box(root, 0.14, 0.94, 0.2, materials.brushed, side * 0.38, 3.43, 0, 'yoke-support');
    cylinder(root, 0.12, 0.12, materials.bolt, side * 0.38, 3.03, 0.15, 'z');
  }
  box(root, 0.96, 0.14, 0.3, materials.steel, 0, 3.88, 0, 'yoke-crossbar');
  cylinder(root, 0.24, 0.18, materials.dark, 0, 3.98, 0, 'y', 'spindle-bearing');
  const stem = new THREE.Group();
  stem.name = 'movable-spindle';
  stem.position.set(0, 3.37, 0);
  root.add(stem);
  cylinder(stem, 0.085, 1.35, materials.bolt, 0, 0, 0, 'y', 'rising-stem');
  // Shared torus geometry gives the exposed stem a readable thread profile.
  for (let i = 0; i < 10; i++) torus(stem, 0.088, 0.011, materials.brushed, 0, 0.18 + i * 0.035, 0, 'y');

  const wheel = new THREE.Group();
  wheel.name = 'rotating-handwheel';
  wheel.position.set(0, 4.19, 0);
  root.add(wheel);
  torus(wheel, 0.86, 0.078, materials.wheel, 0, 0, 0, 'y', 'handwheel-rim');
  cylinder(wheel, 0.19, 0.17, materials.amber, 0, 0, 0, 'y', 'wheel-hub');
  cylinder(wheel, 0.1, 0.06, materials.bolt, 0, 0.12, 0, 'y', 'wheel-locknut');
  for (let i = 0; i < 6; i++) {
    const a = i * PI / 3;
    const spoke = box(wheel, 0.69, 0.065, 0.075, materials.wheel, 0.46 * Math.cos(a), 0, 0.46 * Math.sin(a), 'wheel-spoke');
    spoke.rotation.y = -a;
  }
  cylinder(wheel, 0.068, 0.28, materials.dark, 0.77, 0.17, 0, 'y', 'wheel-grip');

  // Feet and pipe cradles make the machine sit on the supplied ground plane.
  for (const x of [-3.72, 3.72]) {
    box(root, 0.98, 0.14, 1.48, materials.graphite, x, 0.07, 0, 'support-foot');
    box(root, 0.37, 0.63, 0.62, materials.brushed, x, 0.45, 0, 'support-column');
    const saddle = torus(root, 0.695, 0.055, materials.dark, x, 1.5, 0, 'x', 'pipe-cradle');
    saddle.scale.set(1, 1, 1);
    for (const z of [-0.53, 0.53]) bolt(x, 0.2, z, 'y');
  }

  function gauge(x, y, z) {
    const sensor = new THREE.Group();
    sensor.name = 'pressure-gauge';
    sensor.position.set(x, y, z);
    root.add(sensor);
    cylinder(sensor, 0.058, 0.46, materials.steel, 0, -0.32, 0, 'y', 'gauge-tapping');
    cylinder(sensor, 0.27, 0.15, materials.brushed, 0, 0, 0, 'z', 'gauge-case');
    cylinder(sensor, 0.225, 0.012, materials.face, 0, 0, 0.083, 'z', 'gauge-face');
    torus(sensor, 0.236, 0.019, materials.bolt, 0, 0, 0.095);
    const needle = box(sensor, 0.018, 0.18, 0.015, materials.wheel, 0.042, 0.048, 0.11, 'gauge-needle');
    needle.rotation.z = -0.72;
    cylinder(sensor, 0.029, 0.025, materials.dark, 0, 0, 0.112, 'z');
    sensor.userData.kind = 'pressure';
    sensors.push(sensor);
  }
  gauge(-1.88, 2.56, 0.18);
  gauge(2.1, 2.56, 0.18);
  for (const x of [-0.84, 1.73]) {
    const sensor = new THREE.Group();
    sensor.name = 'condition-sensor';
    sensor.position.set(x, 1.68, 0.66);
    root.add(sensor);
    box(sensor, 0.26, 0.31, 0.16, materials.graphite, 0, 0, 0, 'sensor-enclosure');
    box(sensor, 0.19, 0.21, 0.025, materials.brushed, 0, 0, 0.09);
    const led = cylinder(sensor, 0.036, 0.018, materials.cyan, 0.045, 0.043, 0.113, 'z', 'sensor-status-led');
    cylinder(sensor, 0.06, 0.14, materials.dark, 0, -0.21, 0, 'y', 'sensor-cable-gland');
    sensor.userData.kind = 'vibration';
    sensor.userData.indicator = led;
    sensors.push(sensor);
    const points = [new THREE.Vector3(x, 1.46, 0.66), new THREE.Vector3(x, 1.12, 0.75), new THREE.Vector3(x + 0.35, 0.97, 0.68), new THREE.Vector3(x + 0.65, 1.02, 0.2)];
    add(root, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 16, 0.018, 6, false), materials.graphite, 0, 0, 0, 'instrument-cable');
  }

  // Two understated parallel lines establish plant scale without a large mesh count.
  for (let i = 0; i < 2; i++) {
    const x = i === 0 ? -2.8 : 2.8;
    const z = -1.83;
    cylinder(root, 0.26, 5.15, materials.dark, x, 1.08, z, 'x', 'background-process-line');
    cylinder(root, 0.43, 0.57, materials.brushed, x, 1.08, z, 'x', 'background-valve-body');
    for (const side of [-1, 1]) torus(root, 0.37, 0.066, materials.steel, x + side * 0.37, 1.08, z, 'x');
    cylinder(root, 0.18, 0.5, materials.brushed, x, 1.54, z, 'y', 'background-bonnet');
    cylinder(root, 0.04, 0.4, materials.steel, x, 1.95, z);
    torus(root, 0.35, 0.042, materials.dark, x, 2.17, z, 'y', 'background-handwheel');
    box(root, 0.67, 0.043, 0.05, materials.brushed, x, 2.17, z);
    box(root, 0.36, 0.8, 0.47, materials.graphite, x, 0.4, z);
  }

  const boltGeometry = new THREE.CylinderGeometry(0.058, 0.058, 0.1, 6);
  const bolts = new THREE.InstancedMesh(boltGeometry, materials.bolt, boltTransforms.length);
  bolts.name = 'flange-and-foundation-fasteners';
  bolts.castShadow = true;
  bolts.receiveShadow = true;
  boltTransforms.forEach((matrix, index) => bolts.setMatrixAt(index, matrix));
  bolts.instanceMatrix.needsUpdate = true;
  root.add(bolts);

  const flowGeometry = new THREE.SphereGeometry(0.065, 10, 8);
  for (let i = 0; i < 18; i++) {
    const x = -5.15 + (10.3 * i) / 18;
    const particle = add(root, flowGeometry, materials.cyan, x, 1.5 + 0.15 * Math.sin(i * 2.1), 0.22 * Math.cos(i * 1.5), 'flow-particle');
    particle.castShadow = false;
    particle.userData.initialX = x;
    particle.userData.phase = i / 18;
    particle.userData.range = [-5.15, 5.15];
    flow.push(particle);
  }

  root.userData.animation = {
    wheelAxis: 'y',
    wheelY: 4.19,
    stemY: 3.37,
    discY: 1.5,
    suggestedGateTravel: 0.48,
    flowMinX: -5.15,
    flowMaxX: 5.15,
    flowY: 1.5,
    frontAxis: '+z'
  };
  root.userData.conceptual = true;
  root.userData.materials = materials;
  root.updateMatrixWorld(true);
  return { root, wheel, stem, disc, highlight, sensors, flow };
}
