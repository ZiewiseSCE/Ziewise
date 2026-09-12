import * as THREE from './vendor/three.module.js';
import { LOGO_OUTLINE } from './logo3d-geometry.js';

/** Preserve every original contour in XY while giving those strokes a rounded volume. */
export function createLogoPatternGeometry() {
  const colors = ['#405157', '#0699b7', '#79868a', '#b5a375', '#bfc9cc', '#647076'];
  return LOGO_OUTLINE.shapes.map((source, index) => {
    const outline = { outer: smoothContour(source.outer), holes: source.holes.map(smoothContour) };
    const shape = new THREE.Shape(); trace(shape, outline.outer);
    for (const points of outline.holes) {
      const hole = new THREE.Path(); trace(hole, points); shape.holes.push(hole);
    }
    return { geometry: solidStroke(shape), color: colors[index] };
  });
}

const point = (x, y) => [(x + .5) / LOGO_OUTLINE.width * 2 - 1, 1 - (y + .5) / LOGO_OUTLINE.height * 2];
// Remove the source raster's one-pixel stair steps without replacing its curves.
function smoothContour(contour) {
  let points = [];
  for (let i = 0; i < contour.length; i += 2) {
    const j = (i + 2) % contour.length;
    const steps = Math.max(1, Math.ceil(Math.hypot(contour[j] - contour[i], contour[j + 1] - contour[i + 1]) / .7));
    for (let step = 0; step < steps; step++) {
      const t = step / steps;
      points.push([contour[i] * (1 - t) + contour[j] * t, contour[i + 1] * (1 - t) + contour[j + 1] * t]);
    }
  }
  for (let pass = 0; pass < 16; pass++) {
    points = points.map((p, i) => {
      const before = points[(i + points.length - 1) % points.length], after = points[(i + 1) % points.length];
      return [(before[0] + 2 * p[0] + after[0]) / 4, (before[1] + 2 * p[1] + after[1]) / 4];
    });
  }
  return simplify([...points, points[0]], .35).slice(0, -1).flat();
}

// Subpixel simplification keeps the mark faithful and avoids costly sliver
// triangles along what were hundreds of almost-collinear raster samples.
function simplify(points, tolerance) {
  const first = points[0], last = points.at(-1), dx = last[0] - first[0], dy = last[1] - first[1];
  const length = dx * dx + dy * dy;
  let farthest = -1, maximum = tolerance * tolerance;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const t = length ? Math.max(0, Math.min(1, ((p[0] - first[0]) * dx + (p[1] - first[1]) * dy) / length)) : 0;
    const distance = (p[0] - first[0] - t * dx) ** 2 + (p[1] - first[1] - t * dy) ** 2;
    if (distance > maximum) { maximum = distance; farthest = i; }
  }
  if (farthest < 0) return [first, last];
  return [...simplify(points.slice(0, farthest + 1), tolerance).slice(0, -1), ...simplify(points.slice(farthest), tolerance)];
}
function trace(path, points) {
  for (let i = 0; i < points.length; i += 2) {
    const [x, y] = point(points[i], points[i + 1]);
    if (!i) path.moveTo(x, y); else path.lineTo(x, y);
  }
  path.closePath();
}

// The source is an orthographic mark. Keep its projected blue stroke, grey and
// ivory curves, and every opening, instead of inventing a different ring pattern.
const depth = (x, y) => Math.sqrt(Math.max(.016, 1.035 ** 2 - x * x - y * y));

function solidStroke(shape) {
  const flat = new THREE.ShapeGeometry(shape);
  const attribute = flat.attributes.position;
  const vertices = Array.from({ length: attribute.count }, (_, i) => [attribute.getX(i), attribute.getY(i)]);
  let triangles = Array.from(flat.index.array);
  for (let pass = 0; pass < 10; pass++) {
    const next = [], mids = new Map(); let changed = false;
    const midpoint = (a, b) => {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (mids.has(key)) return mids.get(key);
      const i = vertices.length;
      vertices.push([(vertices[a][0] + vertices[b][0]) / 2, (vertices[a][1] + vertices[b][1]) / 2]);
      mids.set(key, i); return i;
    };
    for (let i = 0; i < triangles.length; i += 3) {
      let [a, b, c] = triangles.slice(i, i + 3);
      const split = [squared(vertices[a], vertices[b]), squared(vertices[b], vertices[c]), squared(vertices[c], vertices[a])].map(length => length > .065 ** 2);
      const count = split.filter(Boolean).length;
      if (!count) { next.push(a, b, c); continue; }
      changed = true;
      // Both faces sharing an edge split it together, avoiding cracks when the
      // plane is bent into a hemisphere. No hanging vertices on curved edges.
      if (count === 3) {
        const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
        next.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
      } else {
        while (count === 1 ? !split[0] : split[2]) {
          [a, b, c] = [b, c, a]; split.push(split.shift());
        }
        const ab = midpoint(a, b);
        if (count === 1) next.push(a, ab, c, ab, b, c);
        else {
          const bc = midpoint(b, c);
          next.push(b, bc, ab, a, ab, c, ab, bc, c);
        }
      }
    }
    triangles = next;
    if (!changed) break;
  }
  flat.dispose();
  const positions = [], uvs = [], indices = [];
  // Thin front and rear shells give the source strokes spherical depth while
  // keeping their openings clear; they never become a solid extruded disc.
  const shells = [[1, 0], [1, .065], [-1, 0], [-1, .065]];
  for (const [sign, inset] of shells) for (const [x, y] of vertices) {
    positions.push(x, y, sign * (depth(x, y) - inset)); uvs.push((x + 1) / 2, (y + 1) / 2);
  }
  for (let i = 0; i < triangles.length; i += 3) {
    const [a, b, c] = triangles.slice(i, i + 3);
    for (let shell = 0; shell < 4; shell++) {
      const offset = shell * vertices.length;
      if (shell === 0 || shell === 3) indices.push(a + offset, b + offset, c + offset);
      else indices.push(c + offset, b + offset, a + offset);
    }
  }
  const capCount = indices.length;
  const edges = new Map();
  for (let i = 0; i < triangles.length; i += 3) {
    const [a, b, c] = triangles.slice(i, i + 3);
    for (const [u, v] of [[a, b], [b, c], [c, a]]) {
      const key = u < v ? `${u}:${v}` : `${v}:${u}`;
      if (edges.has(key)) edges.get(key).count++;
      else edges.set(key, { u, v, count: 1 });
    }
  }
  for (const sign of [1, -1]) {
    const wallVertices = new Map();
    const wallPair = id => {
      if (wallVertices.has(id)) return wallVertices.get(id);
      const [x, y] = vertices[id], index = positions.length / 3;
      for (const inset of [0, .065]) {
        positions.push(x, y, sign * (depth(x, y) - inset)); uvs.push((x + 1) / 2, (y + 1) / 2);
      }
      wallVertices.set(id, index); return index;
    };
    for (const { u, v, count } of edges.values()) if (count === 1) {
      const a = wallPair(u), b = wallPair(v);
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.addGroup(0, capCount, 0);
  geometry.addGroup(capCount, indices.length - capCount, 1);
  geometry.computeVertexNormals();
  const normals = geometry.attributes.normal;
  for (let shell = 0; shell < shells.length; shell++) {
    const [sign] = shells[shell], facing = shell % 2 ? -1 : 1;
    vertices.forEach(([x, y], i) => {
      const z = sign * depth(x, y), length = Math.hypot(x, y, z);
      normals.setXYZ(shell * vertices.length + i, facing * x / length, facing * y / length, facing * z / length);
    });
  }
  geometry.computeBoundingSphere();
  return geometry;
}

function squared(a, b) { return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2; }
