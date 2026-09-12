import * as THREE from './vendor/three.module.js';

const modules = [
  { title: 'VISION AI', detail: 'CV · Detection', color: '#88d4dc', x: -1.44, y: 3.24 },
  { title: 'NLP', detail: 'LLM · Intent', color: '#b8c7e9', x: 0, y: 3.24 },
  { title: 'RPA', detail: 'Auto · Workflow', color: '#d4c39e', x: -1.44, y: 1.65 },
  { title: 'DATA PLUGIN', detail: 'Stream · ETL', color: '#a0c5b8', x: 1.44, y: .79 },
];

/** Readable 3D plaques, connected to the actual server units by animated paths. */
export function createRackModules(scene) {
  const resources = [], root = new THREE.Group();
  root.name = 'ZiewCore capability connections'; scene.add(root);
  const own = item => { resources.push(item); return item; };
  const makeTexture = (item, active) => {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 228;
    const context = canvas.getContext('2d');
    const fill = context.createLinearGradient(0, 0, 640, 228);
    fill.addColorStop(0, active ? '#25343d' : '#1a272f'); fill.addColorStop(1, '#101a20');
    context.fillStyle = fill; context.beginPath(); context.roundRect(3, 3, 634, 222, 16); context.fill();
    context.strokeStyle = active ? item.color : '#53636d'; context.lineWidth = active ? 3 : 2; context.stroke();
    context.fillStyle = item.color; context.fillRect(28, 40, 5, 143);
    context.font = '600 47px Arial, sans-serif'; context.fillStyle = '#edf4f7'; context.fillText(item.title, 58, 97);
    context.font = '38px Arial, sans-serif'; context.fillStyle = '#b1c3cd'; context.fillText(item.detail, 58, 158);
    context.beginPath(); context.arc(593, 44, 6, 0, Math.PI * 2); context.fillStyle = item.color; context.fill();
    const map = own(new THREE.CanvasTexture(canvas)); map.colorSpace = THREE.SRGBColorSpace;
    return map;
  };
  const entries = modules.map((item, index) => {
    const maps = [makeTexture(item, false), makeTexture(item, true)];
    const plateMaterial = own(new THREE.MeshBasicMaterial({ map: maps[0], transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false }));
    const plate = new THREE.Mesh(own(new THREE.PlaneGeometry(1, 1)), plateMaterial);
    plate.name = `${item.title} / ${item.detail}`; plate.renderOrder = 10; root.add(plate);
    const positions = new Float32Array(33 * 3), lineGeometry = own(new THREE.BufferGeometry());
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const lineMaterial = own(new THREE.LineBasicMaterial({ color: item.color, transparent: true, opacity: .42, toneMapped: false, depthTest: false, depthWrite: false }));
    const line = new THREE.Line(lineGeometry, lineMaterial); line.frustumCulled = false; root.add(line);
    const lightMaterial = own(new THREE.MeshBasicMaterial({ color: item.color, toneMapped: false, depthTest: false }));
    const dotGeometry = own(new THREE.SphereGeometry(.023, 10, 8));
    const dots = Array.from({ length: 3 }, () => { const dot = new THREE.Mesh(dotGeometry, lightMaterial); root.add(dot); return dot; });
    const port = new THREE.Mesh(own(new THREE.TorusGeometry(.078, .008, 7, 28)), lightMaterial); root.add(port);
    const frameGeometry = own(new THREE.EdgesGeometry(own(new THREE.BoxGeometry(1.23, .44, .04))));
    const frame = new THREE.LineSegments(frameGeometry, own(new THREE.LineBasicMaterial({ color: item.color, transparent: true, opacity: .55, toneMapped: false })));
    root.add(frame);
    return { item, index, maps, plate, plateMaterial, line, lineMaterial, positions, dots, port, frame };
  });
  let lastActive = -1;
  const world = (x, y, width, height, camera, distance) => {
    const halfHeight = Math.tan(camera.fov * Math.PI / 360) * distance;
    return new THREE.Vector3((x / width * 2 - 1) * halfHeight * camera.aspect, (1 - y / height * 2) * halfHeight, -distance).applyMatrix4(camera.matrixWorld);
  };
  function layout(width, height) {
    const wide = width >= 640;
    const plateWidth = Math.min(wide ? 172 : 158, (width - 46) / 2);
    const plateHeight = plateWidth * 228 / 640;
    const margin = wide ? 24 : 16;
    const top = wide ? height * .32 : Math.max(58, plateHeight / 2 + 42);
    const bottom = wide ? height * .69 : height - plateHeight / 2 - 14;
    return { wide, plateWidth, plateHeight, locations: [[margin + plateWidth / 2, top], [width - margin - plateWidth / 2, top], [margin + plateWidth / 2, bottom], [width - margin - plateWidth / 2, bottom]] };
  }
  return {
    fit(width, height) {
      const { wide, plateWidth, plateHeight } = layout(width, height);
      return wide ? { x: Math.max(.35, (width - 2 * plateWidth - 55) / width), y: 1 } : { x: 1, y: Math.max(.42, (height - 2 * plateHeight - 90) / height / .78) };
    },
    update(camera, time, width, height, distance) {
      const { wide, plateWidth, plateHeight, locations } = layout(width, height);
      const active = Math.floor(time / 3.2) % entries.length;
      camera.updateMatrixWorld(true);
      const planeDistance = distance * .84;
      const unit = 2 * Math.tan(camera.fov * Math.PI / 360) * planeDistance / height;
      const front = camera.position.z >= 0 ? 1 : -1;
      entries.forEach(entry => {
        const { item, index, plate, frame, port, positions, dots } = entry;
        const [x, y] = locations[index];
        plate.position.copy(world(x, y, width, height, camera, planeDistance));
        plate.quaternion.copy(camera.quaternion); plate.scale.set(plateWidth * unit, plateHeight * unit, 1);
        const anchor = new THREE.Vector3(item.x, item.y, front * 1.035);
        frame.position.copy(anchor); frame.rotation.y = front < 0 ? Math.PI : 0;
        port.position.copy(anchor).add(new THREE.Vector3(index % 2 ? .44 : -.44, 0, front * .04)); port.rotation.y = frame.rotation.y;
        const exitX = wide ? x + (index % 2 ? -1 : 1) * plateWidth / 2 : x;
        const exitY = wide ? y : y + (index < 2 ? 1 : -1) * plateHeight / 2;
        const start = world(exitX, exitY, width, height, camera, planeDistance);
        const elbow = start.clone().lerp(port.position, .42);
        elbow.addScaledVector(new THREE.Vector3(0, 0, .18).applyQuaternion(camera.quaternion), 1);
        const path = new THREE.CatmullRomCurve3([start, elbow, port.position]);
        for (let i = 0; i <= 32; i++) path.getPoint(i / 32).toArray(positions, i * 3);
        entry.line.geometry.attributes.position.needsUpdate = true;
        const selected = index === active;
        entry.lineMaterial.opacity = selected ? .76 : .27;
        frame.material.opacity = selected ? .82 : .18;
        port.scale.setScalar(selected ? 1 + Math.sin(time * 3) * .12 : .75);
        dots.forEach((dot, i) => { dot.visible = selected; dot.position.copy(path.getPoint((time * .27 + i / 3) % 1)); });
        if (active !== lastActive) entry.plateMaterial.map = entry.maps[selected ? 1 : 0];
      });
      lastActive = active;
    },
    dispose() { root.removeFromParent(); resources.forEach(resource => resource.dispose()); },
  };
}
