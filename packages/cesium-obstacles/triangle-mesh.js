import {Cartesian3, Cartographic, Ellipsoid, IntersectionTests, Math as CesiumMath, Matrix3, Matrix4, Ray} from "@cesium/core";
import {Axis, Transforms} from "@cesium/engine";
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
const rayOriginScratch = new Cartesian3();
const frameScratch = new Matrix4();
const cornerScratch = [new Cartesian3(), new Cartesian3(), new Cartesian3()];
const edgeScratch = [new Cartesian3(), new Cartesian3()];
const normalScratch = new Cartesian3();
const triangleRay = new Ray();
const downRay = new Ray(Cartesian3.ZERO, Cartesian3.negate(Cartesian3.UNIT_Z, new Cartesian3()));
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
    Matrix4.multiply(modelMatrix, Matrix4.fromRotation(Matrix3.fromRotationZ(CesiumMath.PI_OVER_TWO)), new Matrix4()) :
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
  // a triangle's corners as Cartesian3, in scratch
  const corners = (/** @type {number} */ i) => cornerScratch.map((corner, k) => Cartesian3.unpack(/** @type {any} */ (vertices), triangles[i + k] * 3, corner));
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
    const [p0, p1, p2] = corners(i);
    const normal = Cartesian3.cross(Cartesian3.subtract(p1, p0, edgeScratch[0]), Cartesian3.subtract(p2, p0, edgeScratch[1]), normalScratch);
    isFloor[i / 3] = Math.abs(normal.z) >= FLOOR * Cartesian3.magnitude(normal) ? 1 : 0;
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
    Cartesian3.fromElements(x, y, z, downRay.origin);
    let highest;
    for (const i of cells.get(`${Math.floor(x / CELL)},${Math.floor(y / CELL)}`) ?? []) {
      const [p0, p1, p2] = corners(i);
      // a ray straight down meets the highest floor first
      const t = IntersectionTests.rayTriangleParametric(downRay, p0, p1, p2);
      if (t !== undefined && t >= 0 && (highest === undefined || z - t > highest)) {
        highest = z - t;
      }
    }
    return highest;
  };

  // the ray each triangle was last tested against, so that a triangle over several cells is tested once
  const tested = new Uint32Array(triangles.length / 3);
  let ray = 0;
  /**
   * The nearest triangle along a ray, in meters, by Cesium's ray and triangle test, through the cells the
   * ray crosses, nearest first.
   * @param {Cartesian3} o The origin.
   * @param {Cartesian3} d The unit direction.
   * @param {number} far The longest distance.
   * @param {boolean} walls Whether to skip the floors.
   * @return {{distance: number, triangle: number} | undefined}
   */
  const nearestHit = (o, d, far, walls) => {
    ray++;
    Cartesian3.clone(o, triangleRay.origin);
    Cartesian3.clone(d, triangleRay.direction);
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
        const [p0, p1, p2] = corners(i);
        const t = IntersectionTests.rayTriangleParametric(triangleRay, p0, p1, p2);
        if (t !== undefined && t >= 0 && t <= far && (!best || t < best.distance)) {
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
      const [p0, p1, p2] = corners(i);
      const cross = Cartesian3.cross(Cartesian3.subtract(p1, p0, edgeScratch[0]), Cartesian3.subtract(p2, p0, edgeScratch[1]), normalScratch);
      const normal = Matrix4.multiplyByPointAsVector(toNormal, cross, new Cartesian3());
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
    // @ts-expect-error Transforms.eastNorthUpToFixedFrame is missing from the @cesium/engine 26.4.0 typings
    const frame = Transforms.eastNorthUpToFixedFrame(position, Ellipsoid.WGS84, frameScratch);
    let nearest;
    for (const offset of offsets) {
      const origin = Matrix4.multiplyByPoint(frame, offset, rayOriginScratch);
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
