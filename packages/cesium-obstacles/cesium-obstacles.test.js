import {test} from "node:test";
import assert from "node:assert/strict";
import {Cartesian2, Cartesian3, Cartographic, Ellipsoid, Math as CesiumMath} from "@cesium/core";
import {ObstacleProbe, blockedStep, tilesetObstacle} from "./cesium-obstacles.js";

// an obstacle 10 m east of the origin, facing west, toward the walker
const obstacle = {point: new Cartesian3(10, 0, 0), normal: new Cartesian3(-1, 0, 0)};
const east = new Cartesian3(1, 0, 0);

/**
 * @param {Cartesian3} actual
 * @param {Cartesian3} expected
 */
function assertDirection(actual, expected) {
  assert.ok(Cartesian3.equalsEpsilon(actual, expected, CesiumMath.EPSILON9), `${actual} is not ${expected}`);
}

test("without an obstacle, the step is taken in full", () => {
  const {direction, length} = blockedStep(east, 0.1, new Cartesian3(9.7, 0, 0), undefined, new Cartesian3());
  assertDirection(direction, east);
  assert.equal(length, 0.1);
});

test("a step away from the obstacle is taken in full, however close", () => {
  const west = new Cartesian3(-1, 0, 0);
  const {direction, length} = blockedStep(west, 0.1, new Cartesian3(9.9, 0, 0), obstacle, new Cartesian3());
  assertDirection(direction, west);
  assert.equal(length, 0.1);
});

test("a step toward the obstacle is taken in full while it ends farther than the reach", () => {
  const {direction, length} = blockedStep(east, 0.1, new Cartesian3(9, 0, 0), obstacle, new Cartesian3());
  assertDirection(direction, east);
  assert.equal(length, 0.1);
});

test("a step straight at the obstacle within the reach stops", () => {
  const {length} = blockedStep(east, 0.1, new Cartesian3(9.7, 0, 0), obstacle, new Cartesian3());
  assert.equal(length, 0);
});

test("a step at an angle within the reach slides along the obstacle, for the rest of the step", () => {
  const northEast = Cartesian3.normalize(new Cartesian3(1, 1, 0), new Cartesian3());
  const {direction, length} = blockedStep(northEast, 0.1, new Cartesian3(9.7, 0, 0), obstacle, new Cartesian3());
  assertDirection(direction, new Cartesian3(0, 1, 0));
  assert.ok(CesiumMath.equalsEpsilon(length, 0.1 * Math.SQRT1_2, CesiumMath.EPSILON9));
});

test("at an obstacle's edge, with the background beside it, the obstacle faces the walker", () => {
  // on the equator at longitude 0: up is x, east is y, north is z
  const eye = Ellipsoid.WGS84.cartographicToCartesian(new Cartographic(0, 0, 2));
  const north = new Cartesian3(0, 0, 1);
  const edge = Cartesian3.add(eye, north, new Cartesian3());
  const background = Cartesian3.add(eye, new Cartesian3(0, 0.2, 40), new Cartesian3());
  const scene = /** @type {any} */ ({
    camera: {positionWC: eye},
    canvas: {clientWidth: 1000, clientHeight: 600},
    pickPositionSupported: true,
    globe: {ellipsoid: Ellipsoid.WGS84},
    cartesianToCanvasCoordinates: (/** @type {Cartesian3} */ _, /** @type {Cartesian2} */ result) =>
      Cartesian2.fromElements(500, 300, result),
    pickPosition: (/** @type {Cartesian2} */ position) => Cartesian3.clone(position.x === 500 ? edge : background),
  });
  const obstacle = new ObstacleProbe(scene).ahead(north, "forward1");
  assertDirection(/** @type {Cartesian3} */ (obstacle.normal), new Cartesian3(0, 0, -1));
});

test("a roof seen from above faces up", () => {
  // on the equator at longitude 0: up is x, east is y, north is z; the eye 10 m above a flat roof
  const eye = Ellipsoid.WGS84.cartographicToCartesian(new Cartographic(0, 0, 20));
  const down = new Cartesian3(-1, 0, 0);
  const roof = Cartesian3.add(eye, new Cartesian3(-10, 0, 0), new Cartesian3());
  const scene = /** @type {any} */ ({
    camera: {positionWC: eye},
    canvas: {clientWidth: 1000, clientHeight: 600},
    pickPositionSupported: true,
    globe: {ellipsoid: Ellipsoid.WGS84},
    cartesianToCanvasCoordinates: (/** @type {Cartesian3} */ _, /** @type {Cartesian2} */ result) =>
      Cartesian2.fromElements(500, 300, result),
    // beside on the screen is east on the roof, and up on the screen is north
    pickPosition: (/** @type {Cartesian2} */ position) =>
      Cartesian3.add(roof, new Cartesian3(0, (position.x - 500) / 80, (300 - position.y) / 80), new Cartesian3()),
  });
  const obstacle = new ObstacleProbe(scene).ahead(down, "down");
  assertDirection(/** @type {Cartesian3} */ (obstacle.normal), new Cartesian3(1, 0, 0));
});

// a walker on the equator at longitude 0, 2 m up, stepping north; a tileset of one wall, through a point and
// facing along a normal, picked as Cesium3DTileset.pick does: the ray's first hit
const walker = new Cartesian3(Ellipsoid.WGS84.maximumRadius + 2, 0, 0);
const north = new Cartesian3(0, 0, 1);
const wallTileset = (/** @type {Cartesian3} */ point, /** @type {Cartesian3} */ normal, width = Infinity) => ({
  pick: (/** @type {{origin: Cartesian3, direction: Cartesian3}} */ ray) => {
    const facing = Cartesian3.dot(ray.direction, normal);
    if (Math.abs(facing) < CesiumMath.EPSILON9) {
      return undefined;
    }
    const t = Cartesian3.dot(Cartesian3.subtract(point, ray.origin, new Cartesian3()), normal) / facing;
    const hit = Cartesian3.add(ray.origin, Cartesian3.multiplyByScalar(ray.direction, t, new Cartesian3()), new Cartesian3());
    return t >= 0 && Cartesian3.distance(hit, point) <= width / 2 ? hit : undefined;
  },
});
const fakeScene = /** @type {any} */ ({frameState: {}, globe: {ellipsoid: Ellipsoid.WGS84}});

test("a wall of the tileset within the reach is the obstacle, upright and facing the walker", () => {
  // 0.8 m ahead, turned 45 degrees
  const normal = Cartesian3.normalize(new Cartesian3(0, -1, -1), new Cartesian3());
  const tileset = /** @type {any} */ (wallTileset(Cartesian3.add(walker, new Cartesian3(0, 0, 0.8), new Cartesian3()), normal));
  const found = tilesetObstacle(fakeScene, tileset, walker, north);
  assert.ok(found?.point && found.normal);
  assert.ok(Math.abs(Cartesian3.distance(found.point, walker) - 0.8) < 1e-6);
  assertDirection(found.normal, normal);
});

test("a wall of the tileset beyond the reach is no obstacle", () => {
  const tileset = /** @type {any} */ (wallTileset(Cartesian3.add(walker, new Cartesian3(0, 0, 5), new Cartesian3()), new Cartesian3(0, 0, -1)));
  assert.equal(tilesetObstacle(fakeScene, tileset, walker, north), undefined);
});

test("without a hit beside it, the wall of the tileset faces the steps", () => {
  // 0.8 m ahead, 5 cm wide: the ray beside it misses
  const tileset = /** @type {any} */ (wallTileset(Cartesian3.add(walker, new Cartesian3(0, 0, 0.8), new Cartesian3()), new Cartesian3(0, 0, -1), 0.05));
  const found = tilesetObstacle(fakeScene, tileset, walker, north);
  assert.ok(found?.normal);
  assertDirection(found.normal, new Cartesian3(0, 0, -1));
});
