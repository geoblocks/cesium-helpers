import {Cartesian3, Cartographic, Ellipsoid, Matrix3, Matrix4} from "@cesium/core";
import {Axis} from "@cesium/engine";
import {gltfTriangles} from "./gltf-mesh.js";

/** @typedef {import("./gltf-mesh.js").GltfTriangles} GltfTriangles */
/** @typedef {import("./cesium-obstacles.js").Obstacle} Obstacle */

// Triangles known on the CPU, in meters, z up, in the frame of a model matrix: the floors under a mover and the
// walls ahead of it, in any direction, without reading the depth, which waits for the GPU.

// the ground's cells, in meters
const CELL = 2;
// the faces flatter than this, of the cosine of their slope, are floors, stairs and ramps
const FLOOR = 0.5;

const originScratch = new Cartesian3();
const directionScratch = new Cartesian3();
const rayScratch = new Cartesian3();
const upScratch = new Cartesian3();
const eastScratch = new Cartesian3();
const northScratch = new Cartesian3();
const rayOriginScratch = new Cartesian3();
const offsetScratch = new Cartesian3();
const belowScratch = new Cartographic();
const floorScratch = new Cartesian3();
const floorCartographicScratch = new Cartographic();

/**
 * @typedef {object} TriangleMesh The floors and walls of triangles, in the frame of a model matrix.
 * @property {(x: number, y: number, z: number) => number | undefined} floorBelow The highest floor's height at
 *     a position of the frame, not above it.
 * @property {(origin: Cartesian3, direction: Cartesian3, maxDistance: number, options?: {walls?: boolean}) =>
 *     {position: Cartesian3, normal: Cartesian3, distance: number} | undefined} raycast The first surface along a
 *     ray on the globe.
 * @property {(x: number, y: number, z: number, result?: Cartesian3) => Cartesian3} position A position of the
 *     frame on the globe.
 * @property {(position: Cartesian3, result?: Cartesian3) => Cartesian3} local A position on the globe in the frame.
 */

/**
 * The floors and walls of groups of triangles; a group with `collide: false` is left out.
 * @param {{vertices: Float32Array, triangles: Uint32Array, collide?: boolean}[]} groups x, y, z, in meters, z up.
 * @param {Matrix4} modelMatrix From the triangles' frame to the globe.
 * @return {TriangleMesh}
 */
export function createTriangleMesh(groups, modelMatrix) {
  return collisionMesh(groups.filter(group => group.collide !== false), modelMatrix);
}

/**
 * The floors and walls of a glTF's triangles, drawn elsewhere or not at all: its meshes in its default scene
 * (`gltfTriangles`), its y up turned z up.
 * @param {ArrayBuffer | Uint8Array | object} gltf A binary glTF, or a glTF's JSON.
 * @param {Matrix4} modelMatrix The model's, from the glTF's frame, z up, to the globe.
 * @param {{buffers?: ArrayBuffer | Uint8Array | (ArrayBuffer | Uint8Array)[], collide?: (primitive: GltfTriangles) => boolean,
 *     forwardAxis?: Axis}} [options] buffers: with a glTF's JSON, its binary buffer or buffers; collide: whether a
 *     primitive is an obstacle, all by default; forwardAxis: the one the Model is loaded with, Cesium's default
 *     Axis.Z, which turns the model a quarter round its up axis, or Axis.X.
 * @return {TriangleMesh}
 */
export function createTriangleMeshFromGltf(gltf, modelMatrix, {buffers, collide = () => true, forwardAxis = Axis.Z} = {}) {
  const primitives = gltfTriangles(gltf, buffers).filter(primitive => collide(primitive));
  // Cesium turns a z forward model's +z to +x before its y up to z up: in the triangles' frame, z up, a quarter
  // turn round z, (x, y, z) to (-y, x, z)
  const matrix = forwardAxis === Axis.Z ?
    Matrix4.multiply(modelMatrix, Matrix4.fromRotation(new Matrix3(0, -1, 0, 1, 0, 0, 0, 0, 1)), new Matrix4()) :
    modelMatrix;
  return collisionMesh(primitives, matrix);
}

/**
 * The floors and walls of triangles.
 * @param {{vertices: Float32Array, triangles: Uint32Array}[]} colliding
 * @param {Matrix4} modelMatrix From the triangles' frame to the globe.
 * @return {TriangleMesh}
 */
function collisionMesh(colliding, modelMatrix) {
  // the groups walked on as one: their vertices one after the other, their triangles renumbered
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
    floorBelow,
    /**
     * The first surface along a ray on the globe.
     * @param {Cartesian3} origin
     * @param {Cartesian3} direction A unit vector.
     * @param {number} maxDistance In meters.
     * @param {{walls?: boolean}} [options] walls: skip the floors, stairs and ramps, which a mover stands on.
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
 * The obstacle ahead of a mover in a mesh, for a walker's or a drone's obstacleAhead: rays cast from the mover's
 * position, and from points about it, in the direction of its steps, the nearest surface hit within the reach,
 * in every direction, as ObstacleProbe's ahead would return it.
 * @param {TriangleMesh} mesh
 * @param {() => Cartesian3} from Where the mover is, on the globe.
 * @param {{offsets?: Cartesian3[], reach: number, walls?: boolean}} options offsets: where the rays start, in
 *     meters east, north and up of the mover, the mover alone by default; reach: how far ahead, in meters;
 *     walls: whether the floors, stairs and ramps are left to the ground, true by default.
 * @return {(toward: Cartesian3, key?: string) => Obstacle | undefined}
 */
export function meshObstacleAhead(mesh, from, {offsets = [Cartesian3.ZERO], reach, walls = true}) {
  const options = {walls};
  return toward => {
    const position = from();
    const up = Ellipsoid.WGS84.geodeticSurfaceNormal(position, upScratch);
    // east and north, but at the poles
    const east = Cartesian3.fromElements(-up.y, up.x, 0, eastScratch);
    if (Cartesian3.equals(east, Cartesian3.ZERO)) {
      Cartesian3.clone(Cartesian3.UNIT_Y, east);
    }
    Cartesian3.normalize(east, east);
    const north = Cartesian3.cross(up, east, northScratch);
    let nearest;
    for (const offset of offsets) {
      const origin = Cartesian3.add(position, Cartesian3.multiplyByScalar(up, offset.z, rayOriginScratch), rayOriginScratch);
      if (offset.x !== 0 || offset.y !== 0) {
        Cartesian3.add(origin, Cartesian3.multiplyByScalar(east, offset.x, offsetScratch), origin);
        Cartesian3.add(origin, Cartesian3.multiplyByScalar(north, offset.y, offsetScratch), origin);
      }
      const hit = mesh.raycast(origin, toward, reach, options);
      if (hit && (!nearest || hit.distance < nearest.distance)) {
        nearest = hit;
      }
    }
    return nearest && {point: nearest.position, normal: nearest.normal};
  };
}

/**
 * The ground of a mover in a mesh, for a walker's or a drone's groundHeight: the highest floor below a point
 * under the mover.
 * @param {TriangleMesh} mesh
 * @param {{below?: number}} [options] below: how far under the mover, in meters, the floor is looked for from: a
 *     walker's knees, the highest step it climbs; 0 by default.
 * @return {(position: Cartographic) => number | undefined} The floor's height above the ellipsoid, in meters,
 *     undefined off the mesh's floors.
 */
export function meshGroundHeight(mesh, {below = 0} = {}) {
  return position => {
    const point = Cartographic.clone(position, belowScratch);
    point.height -= below;
    const {x, y, z} = mesh.local(Cartographic.toCartesian(point, Ellipsoid.WGS84, floorScratch), floorScratch);
    const floor = mesh.floorBelow(x, y, z);
    return floor === undefined ? undefined :
      Cartographic.fromCartesian(mesh.position(x, y, floor, floorScratch), Ellipsoid.WGS84, floorCartographicScratch).height;
  };
}
