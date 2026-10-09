import {Cartesian3, Cartographic, Ellipsoid, Matrix4} from "@cesium/core";
import {Axis, Model, PrimitiveCollection, ShadowMode} from "@cesium/engine";

// Triangles to walk on, in meters, z up, in the frame of a model matrix: their models, and the floors and
// walls a walker meets, without reading the depth, which waits for the GPU.

// the ground's cells, in meters
const CELL = 2;
// the faces flatter than this, of the cosine of their slope, are floors, stairs and ramps
const FLOOR = 0.5;

const originScratch = new Cartesian3();
const directionScratch = new Cartesian3();
const upScratch = new Cartesian3();
const rayScratch = new Cartesian3();
const rayOriginScratch = new Cartesian3();
const kneesScratch = new Cartographic();
const floorScratch = new Cartesian3();
const floorCartographicScratch = new Cartographic();

/**
 * @typedef {object} WalkGroup Triangles of one color.
 * @property {number[]} color The base color, linear, and its alpha: translucent below 1.
 * @property {Float32Array} vertices x, y, z, in meters, z up.
 * @property {Uint32Array} triangles
 * @property {boolean} [show] false: walked on, not seen (an invisible edge).
 * @property {boolean} [collide] false: seen, not walked on (the battens, the water).
 * @property {boolean} [shadows] false: casts no shadow (the glass, the water).
 * @property {number} [emissive] The share of its color it gives off: the light indoors, which Cesium does not
 *     bounce off the walls.
 * @property {boolean} [uv] Whether its vertices carry their x and y as texture coordinates, in meters, for a
 *     shader drawing on the floors.
 * @property {Float32Array} [lightmap] Its vertices' coordinates in a baked light's atlas, u and v each, written as
 *     the second texture coordinates.
 * @property {import("@cesium/engine").CustomShader} [customShader]
 */

/**
 * The flat shaded model of the triangles, untextured, in glTF's y up, quantized (KHR_mesh_quantization):
 * the positions in 16 bits, scaled back to meters by the node; the normals in 8 bits; each vertex padded to
 * 4 bytes, 12 in all, as against 24 in floats. Exported for the tests.
 * @param {Float32Array} vertices
 * @param {Uint32Array} triangles
 * @param {number[]} color
 * @param {number} emissive
 * @param {boolean} uv Whether to give the vertices their x and y as texture coordinates, in floats.
 * @param {Float32Array | undefined} lightmap The vertices' second texture coordinates, in floats, if any.
 * @return {ArrayBuffer} The binary glTF.
 */
export function toGlb(vertices, triangles, color, emissive, uv, lightmap) {
  const count = triangles.length;
  // the extent of the map, in glTF's axes
  const toGltf = (/** @type {number} */ v) => [vertices[v], vertices[v + 2], -vertices[v + 1]];
  const low = [Infinity, Infinity, Infinity];
  const high = [-Infinity, -Infinity, -Infinity];
  for (let v = 0; v < vertices.length; v += 3) {
    toGltf(v).forEach((value, axis) => {
      low[axis] = Math.min(low[axis], value);
      high[axis] = Math.max(high[axis], value);
    });
  }
  // the node maps -32767..32767 back to the widest extent, the same on every axis, which leaves the
  // normals as they are
  const translation = low.map((value, axis) => (value + high[axis]) / 2);
  // a single point: any step keeps it at the node's translation
  const step = Math.max(...low.map((value, axis) => high[axis] - value)) / 65534 || 1;
  const scale = [step, step, step];
  const positions = new Int16Array(count * 4);
  const normals = new Int8Array(count * 4);
  const texCoords = new Float32Array(uv ? count * 2 : 0);
  const lightmapCoords = new Float32Array(lightmap ? count * 2 : 0);
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < count; i += 3) {
    const corners = [0, 1, 2].map(k => toGltf(triangles[i + k] * 3));
    const [a, b, c] = corners.map(([x, y, z]) => new Cartesian3(x, y, z));
    const normal = Cartesian3.cross(Cartesian3.subtract(b, a, new Cartesian3()), Cartesian3.subtract(c, a, new Cartesian3()), new Cartesian3());
    if (Cartesian3.magnitudeSquared(normal) > 0) {
      Cartesian3.normalize(normal, normal);
    }
    corners.forEach((corner, k) => {
      const quantized = corner.map((value, axis) => Math.round((value - translation[axis]) / step));
      positions.set(quantized, (i + k) * 4);
      normals.set([normal.x, normal.y, normal.z].map(n => Math.round(n * 127)), (i + k) * 4);
      for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis], quantized[axis]);
        max[axis] = Math.max(max[axis], quantized[axis]);
      }
      if (uv) {
        const v = triangles[i + k] * 3;
        texCoords.set([vertices[v], vertices[v + 1]], (i + k) * 2);
      }
      if (lightmap) {
        const v = triangles[i + k];
        lightmapCoords.set([lightmap[v * 2], lightmap[v * 2 + 1]], (i + k) * 2);
      }
    });
  }
  // the float attributes after the positions and normals, each its own buffer view
  const floats = /** @type {[string, Float32Array][]} */ ([...(uv ? [['TEXCOORD_0', texCoords]] : []), ...(lightmap ? [['TEXCOORD_1', lightmapCoords]] : [])]);
  const floatsLength = floats.reduce((n, [, array]) => n + array.byteLength, 0);
  let floatOffset = positions.byteLength + normals.byteLength;
  const json = new TextEncoder().encode(JSON.stringify({
    asset: {version: '2.0'},
    extensionsUsed: ['KHR_mesh_quantization', ...(emissive > 1 ? ['KHR_materials_emissive_strength'] : [])],
    extensionsRequired: ['KHR_mesh_quantization'],
    scene: 0,
    scenes: [{nodes: [0]}],
    nodes: [{mesh: 0, translation, scale}],
    meshes: [{primitives: [{attributes: {POSITION: 0, NORMAL: 1, ...Object.fromEntries(floats.map(([name], k) => [name, 2 + k]))}, material: 0}]}],
    materials: [{
      pbrMetallicRoughness: {baseColorFactor: color, metallicFactor: 0, roughnessFactor: 1},
      // glTF caps the factor at 1, the strength carries the rest
      emissiveFactor: color.slice(0, 3).map(c => Math.min(Math.max(c * Math.min(emissive, 1), 0), 1)),
      ...(emissive > 1 ? {extensions: {KHR_materials_emissive_strength: {emissiveStrength: emissive}}} : {}),
      doubleSided: true,
      ...(color[3] < 1 ? {alphaMode: 'BLEND'} : {}),
    }],
    buffers: [{byteLength: positions.byteLength + normals.byteLength + floatsLength}],
    bufferViews: [
      {buffer: 0, byteOffset: 0, byteLength: positions.byteLength, byteStride: 8, target: 34962},
      {buffer: 0, byteOffset: positions.byteLength, byteLength: normals.byteLength, byteStride: 4, target: 34962},
      ...floats.map(([, array]) => {
        const view = {buffer: 0, byteOffset: floatOffset, byteLength: array.byteLength, target: 34962};
        floatOffset += array.byteLength;
        return view;
      }),
    ],
    accessors: [
      {bufferView: 0, componentType: 5122, count, type: 'VEC3', min, max},
      {bufferView: 1, componentType: 5120, normalized: true, count, type: 'VEC3'},
      ...floats.map((_, k) => ({bufferView: 2 + k, componentType: 5126, count, type: 'VEC2'})),
    ],
  }));
  const jsonLength = Math.ceil(json.length / 4) * 4;
  const binLength = positions.byteLength + normals.byteLength + floatsLength;
  const glb = new ArrayBuffer(12 + 8 + jsonLength + 8 + binLength);
  const view = new DataView(glb);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, glb.byteLength, true);
  view.setUint32(12, jsonLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(glb, 20, jsonLength).fill(0x20).set(json);
  view.setUint32(20 + jsonLength, binLength, true);
  view.setUint32(24 + jsonLength, 0x004e4942, true);
  new Int16Array(glb, 28 + jsonLength, count * 4).set(positions);
  new Int8Array(glb, 28 + jsonLength + positions.byteLength, count * 4).set(normals);
  let offset = 28 + jsonLength + positions.byteLength + normals.byteLength;
  for (const [, array] of floats) {
    new Float32Array(glb, offset, array.length).set(array);
    offset += array.byteLength;
  }
  return glb;
}

/**
 * @param {WalkGroup[]} groups
 * @param {Matrix4} modelMatrix From the triangles' frame to the globe.
 */
export async function createWalkMesh(groups, modelMatrix) {
  // a single point, or nothing, has nothing to draw
  const visible = groups.filter(group => group.show !== false && group.triangles.length > 0 &&
    group.vertices.some((value, k) => value !== group.vertices[k % 3]));
  const urls = visible.map(group => URL.createObjectURL(new Blob([toGlb(group.vertices, group.triangles, group.color, group.emissive ?? 0, group.uv ?? false, group.lightmap)], {type: 'model/gltf-binary'})));
  const loaded = await Promise.allSettled(visible.map(async (group, k) => {
    // with glTF's y up only: Cesium would also turn the model's +z to +x, a quarter turn off the frame's axes
    const model = await Model.fromGltfAsync({
      url: urls[k],
      modelMatrix,
      forwardAxis: Axis.X,
      shadows: group.shadows === false ? ShadowMode.RECEIVE_ONLY : ShadowMode.ENABLED,
      ...(group.customShader ? {customShader: group.customShader} : {}),
    });
    model.readyEvent.addEventListener(() => URL.revokeObjectURL(urls[k]));
    model.errorEvent.addEventListener(() => URL.revokeObjectURL(urls[k]));
    return model;
  }));
  // in the groups' order
  const primitive = new PrimitiveCollection();
  for (const result of loaded) {
    if (result.status === 'fulfilled') {
      primitive.add(result.value);
    }
  }
  const failed = loaded.find(result => result.status === 'rejected');
  if (failed) {
    primitive.destroy();
    urls.forEach(url => URL.revokeObjectURL(url));
    throw failed.reason;
  }

  // the groups walked on as one: their vertices one after the other, their triangles renumbered
  const colliding = groups.filter(group => group.collide !== false);
  const vertices = new Float32Array(colliding.reduce((n, group) => n + group.vertices.length, 0));
  const triangles = new Uint32Array(colliding.reduce((n, group) => n + group.triangles.length, 0));
  let vertexOffset = 0;
  let triangleOffset = 0;
  for (const group of colliding) {
    vertices.set(group.vertices, vertexOffset);
    for (let k = 0; k < group.triangles.length; k++) {
      triangles[triangleOffset + k] = group.triangles[k] + vertexOffset / 3;
    }
    vertexOffset += group.vertices.length;
    triangleOffset += group.triangles.length;
  }
  const toLocal = Matrix4.inverse(modelMatrix, new Matrix4());
  // the normals' matrix, the inverse transpose
  const toNormal = Matrix4.transpose(toLocal, new Matrix4());

  // the triangles, and the floors among them, by the cells they overlap
  /** @type {Map<string, number[]>} */
  const cells = new Map();
  /** @type {Map<string, number[]>} */
  const allCells = new Map();
  const isFloor = new Uint8Array(triangles.length / 3);
  const vertex = (/** @type {number} */ index) => vertices.subarray(index * 3, index * 3 + 3);
  const add = (/** @type {Map<string, number[]>} */ map, /** @type {string} */ key, /** @type {number} */ i) => {
    const list = map.get(key);
    if (list) {
      list.push(i);
    } else {
      map.set(key, [i]);
    }
  };
  for (let i = 0; i < triangles.length; i += 3) {
    const [a, b, c] = [vertex(triangles[i]), vertex(triangles[i + 1]), vertex(triangles[i + 2])];
    const nx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]);
    const ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]);
    const nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    isFloor[i / 3] = Math.abs(nz) >= FLOOR * Math.hypot(nx, ny, nz) ? 1 : 0;
    for (let x = Math.floor(Math.min(a[0], b[0], c[0]) / CELL); x <= Math.floor(Math.max(a[0], b[0], c[0]) / CELL); x++) {
      for (let y = Math.floor(Math.min(a[1], b[1], c[1]) / CELL); y <= Math.floor(Math.max(a[1], b[1], c[1]) / CELL); y++) {
        const key = `${x},${y}`;
        add(allCells, key, i);
        if (isFloor[i / 3]) {
          add(cells, key, i);
        }
      }
    }
  }

  /**
   * The highest floor at a position of the frame, not above it.
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @return {number | undefined} Its height, in meters.
   */
  const floorBelow = (x, y, z) => {
    let highest;
    for (const i of cells.get(`${Math.floor(x / CELL)},${Math.floor(y / CELL)}`) ?? []) {
      const a = triangles[i] * 3, b = triangles[i + 1] * 3, c = triangles[i + 2] * 3;
      const ux = vertices[b] - vertices[a], uy = vertices[b + 1] - vertices[a + 1];
      const vx = vertices[c] - vertices[a], vy = vertices[c + 1] - vertices[a + 1];
      const d = ux * vy - vx * uy;
      if (d === 0) {
        continue;
      }
      const s = ((x - vertices[a]) * vy - vx * (y - vertices[a + 1])) / d;
      const t = (ux * (y - vertices[a + 1]) - (x - vertices[a]) * uy) / d;
      if (s < 0 || t < 0 || s + t > 1) {
        continue;
      }
      const height = vertices[a + 2] + s * (vertices[b + 2] - vertices[a + 2]) + t * (vertices[c + 2] - vertices[a + 2]);
      if (height <= z && (highest === undefined || height > highest)) {
        highest = height;
      }
    }
    return highest;
  };

  // the ray each triangle was last tested against, so that a triangle over several cells is tested once
  const tested = new Uint32Array(triangles.length / 3);
  let ray = 0;
  /**
   * The nearest triangle along a ray, in meters, by Möller and Trumbore's test, through the cells the
   * ray crosses, nearest first.
   * @param {Cartesian3} o The origin.
   * @param {Cartesian3} d The unit direction.
   * @param {number} far The longest distance.
   * @param {boolean} walls Whether to skip the floors.
   * @return {{distance: number, triangle: number} | undefined}
   */
  const nearestHit = (o, d, far, walls) => {
    ray++;
    let best;
    let x = Math.floor(o.x / CELL);
    let y = Math.floor(o.y / CELL);
    const stepX = Math.sign(d.x);
    const stepY = Math.sign(d.y);
    // the distances along the ray to the next cell borders, and between borders
    let nextX = stepX === 0 ? Infinity : ((x + (stepX > 0 ? 1 : 0)) * CELL - o.x) / d.x;
    let nextY = stepY === 0 ? Infinity : ((y + (stepY > 0 ? 1 : 0)) * CELL - o.y) / d.y;
    const deltaX = stepX === 0 ? Infinity : CELL / Math.abs(d.x);
    const deltaY = stepY === 0 ? Infinity : CELL / Math.abs(d.y);
    let entry = 0;
    while (entry <= far) {
      const exit = Math.min(nextX, nextY, far);
      for (const i of allCells.get(`${x},${y}`) ?? []) {
        if (tested[i / 3] === ray || (walls && isFloor[i / 3])) {
          continue;
        }
        tested[i / 3] = ray;
        const a = triangles[i] * 3, b = triangles[i + 1] * 3, c = triangles[i + 2] * 3;
        const e1x = vertices[b] - vertices[a], e1y = vertices[b + 1] - vertices[a + 1], e1z = vertices[b + 2] - vertices[a + 2];
        const e2x = vertices[c] - vertices[a], e2y = vertices[c + 1] - vertices[a + 1], e2z = vertices[c + 2] - vertices[a + 2];
        const px = d.y * e2z - d.z * e2y, py = d.z * e2x - d.x * e2z, pz = d.x * e2y - d.y * e2x;
        const det = e1x * px + e1y * py + e1z * pz;
        if (Math.abs(det) < 1e-9) {
          continue;
        }
        const sx = o.x - vertices[a], sy = o.y - vertices[a + 1], sz = o.z - vertices[a + 2];
        const u = (sx * px + sy * py + sz * pz) / det;
        if (u < 0 || u > 1) {
          continue;
        }
        const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x;
        const v = (d.x * qx + d.y * qy + d.z * qz) / det;
        if (v < 0 || u + v > 1) {
          continue;
        }
        const t = (e2x * qx + e2y * qy + e2z * qz) / det;
        if (t >= 0 && t <= far && (!best || t < best.distance)) {
          best = {distance: t, triangle: i};
        }
      }
      // a hit within this cell is the nearest; one beyond it may still be beaten in the next cells
      if (best && best.distance <= exit) {
        return best;
      }
      if (exit >= far) {
        return best;
      }
      entry = exit;
      if (nextX < nextY) {
        x += stepX;
        nextX += deltaX;
      } else {
        y += stepY;
        nextY += deltaY;
      }
    }
    return best;
  };

  return {
    primitive,
    floorBelow,
    /**
     * The first surface along a ray on the globe.
     * @param {Cartesian3} origin
     * @param {Cartesian3} direction A unit vector.
     * @param {number} maxDistance In meters.
     * @param {{walls?: boolean}} [options] walls: skip the floors, stairs and ramps, which the walker climbs.
     * @return {{position: Cartesian3, normal: Cartesian3, distance: number} | undefined} Where the
     *     ray stops, the surface's normal toward the ray's origin, and the distance in meters.
     */
    raycast: (origin, direction, maxDistance, {walls = false} = {}) => {
      const o = Matrix4.multiplyByPoint(toLocal, origin, originScratch);
      const d = Matrix4.multiplyByPointAsVector(toLocal, direction, directionScratch);
      // the frame's units in a meter along the ray, should the matrix scale
      const perMeter = Cartesian3.magnitude(d);
      Cartesian3.divideByScalar(d, perMeter, d);
      const hit = nearestHit(o, d, maxDistance * perMeter, walls);
      if (!hit) {
        return undefined;
      }
      const position = Matrix4.multiplyByPoint(modelMatrix, Cartesian3.add(o, Cartesian3.multiplyByScalar(d, hit.distance, rayScratch), rayScratch), new Cartesian3());
      const i = hit.triangle;
      const [a, b, c] = [vertex(triangles[i]), vertex(triangles[i + 1]), vertex(triangles[i + 2])];
      const e1 = new Cartesian3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const e2 = new Cartesian3(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
      const normal = Matrix4.multiplyByPointAsVector(toNormal, Cartesian3.cross(e1, e2, e1), new Cartesian3());
      Cartesian3.normalize(normal, normal);
      if (Cartesian3.dot(normal, direction) > 0) {
        Cartesian3.negate(normal, normal);
      }
      return {position, normal, distance: Cartesian3.distance(origin, position)};
    },
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {Cartesian3} [result]
     * @return {Cartesian3} A position of the frame on the globe.
     */
    position: (x, y, z, result = new Cartesian3()) => Matrix4.multiplyByPoint(modelMatrix, Cartesian3.fromElements(x, y, z, result), result),
    /**
     * @param {Cartesian3} position
     * @param {Cartesian3} [result]
     * @return {Cartesian3} A position on the globe in the frame.
     */
    local: (/** @type {Cartesian3} */ position, result = new Cartesian3()) => Matrix4.multiplyByPoint(toLocal, position, result),
  };
}

/**
 * The heights above the floor the walls are looked for at: the knees, the waist and the eyes.
 * @param {number} eye
 * @param {number} step
 * @return {number[]} In meters, from the lowest.
 */
export function rayHeights(eye, step) {
  return [step + 0.05, (step + eye) / 2, eye];
}

/**
 * Walks a CesiumWalk on a mesh: it stands on the highest floor below its knees, up the stairs, under the
 * arches, else on what it stood on before (the terrain); the walls ahead stop it, from rays cast at the knees,
 * the waist and the eyes, the floors and stairs left to the ground below, in every direction.
 * @param {import('./cesium-walk.js').default} walk
 * @param {Awaited<ReturnType<typeof createWalkMesh>>} mesh
 * @param {{eye: number, step: number, reach: number}} options In meters: the eyes above the floor, the
 *     highest step, how far ahead the walls are looked for.
 */
export function walkOn(walk, mesh, {eye, step, reach}) {
  const camera = walk.viewer.scene.camera;
  const fallback = walk.groundHeight;
  const heights = rayHeights(eye, step);
  const walls = {walls: true};
  walk.obstacleAhead = toward => {
    const eyes = camera.positionWC;
    const up = Ellipsoid.WGS84.geodeticSurfaceNormal(eyes, upScratch);
    let nearest;
    for (const height of heights) {
      const origin = Cartesian3.add(eyes, Cartesian3.multiplyByScalar(up, height - eye, rayOriginScratch), rayOriginScratch);
      const hit = mesh.raycast(origin, toward, reach, walls);
      if (hit && (!nearest || hit.distance < nearest.distance)) {
        nearest = hit;
      }
    }
    return nearest && {point: nearest.position, normal: nearest.normal};
  };
  walk.groundHeight = cartographic => {
    const knees = Cartographic.clone(cartographic, kneesScratch);
    knees.height -= eye - step;
    const {x, y, z} = mesh.local(Cartographic.toCartesian(knees, Ellipsoid.WGS84, floorScratch), floorScratch);
    const floor = mesh.floorBelow(x, y, z);
    return floor === undefined ? fallback(cartographic) :
      Cartographic.fromCartesian(mesh.position(x, y, floor, floorScratch), Ellipsoid.WGS84, floorCartographicScratch).height;
  };
}
