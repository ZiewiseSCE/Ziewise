import * as THREE from './vendor/three.module.js';

/** Rounded metal ribbons follow the surface of a sphere, including its rear. */
export function createLogoSphereGeometry() {
  const bands = [
    { latitude: -1.12, width: .13, color: '#53616b', start: -.10, length: 6.12 },
    { latitude: -.81, width: .17, color: '#c2c9ca', start: .12, length: 6.14 },
    { latitude: -.49, width: .19, color: '#647078', start: -.19, length: 6.10 },
    { latitude: -.17, width: .19, color: '#129cb6', start: .05, length: 6.16 },
    { latitude: .15, width: .19, color: '#acb7bb', start: -.08, length: 6.14 },
    { latitude: .47, width: .18, color: '#c7b993', start: .17, length: 6.10 },
    { latitude: .79, width: .16, color: '#b6c0c3', start: -.13, length: 6.16 },
    { latitude: 1.10, width: .13, color: '#49555e', start: .09, length: 6.10 },
  ];
  return bands.map(band => ({ ...band, geometry: ribbon(band) }));
}

function ribbon({ latitude, width, start, length }) {
  const segments = 104;
  const halfWidth = width / 2;
  const outer = 1.018, inner = .959;
  const bevel = .011;
  const section = [
    [-halfWidth + bevel, outer], [halfWidth - bevel, outer],
    [halfWidth, outer - bevel], [halfWidth, inner + bevel],
    [halfWidth - bevel, inner], [-halfWidth + bevel, inner],
    [-halfWidth, inner + bevel], [-halfWidth, outer - bevel],
  ];
  const positions = [], indices = [];
  for (let i = 0; i <= segments; i++) {
    const longitude = start + i / segments * length;
    const sweep = Math.sin(longitude) * .08;
    for (const [offset, radius] of section) {
      const phi = latitude + offset + sweep;
      positions.push(Math.sin(longitude) * Math.cos(phi) * radius, Math.sin(phi) * radius, Math.cos(longitude) * Math.cos(phi) * radius);
    }
  }
  const sides = section.length;
  for (let i = 0; i < segments; i++) for (let j = 0; j < sides; j++) {
    const a = i * sides + j, b = i * sides + (j + 1) % sides;
    const c = (i + 1) * sides + (j + 1) % sides, d = (i + 1) * sides + j;
    indices.push(a, d, b, b, d, c);
  }
  for (let j = 1; j < sides - 1; j++) {
    indices.push(0, j, j + 1);
    const last = segments * sides;
    indices.push(last, last + j + 1, last + j);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
