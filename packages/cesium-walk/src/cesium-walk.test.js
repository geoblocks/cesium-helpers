import {test} from "node:test";
import assert from "node:assert/strict";
import {Cartesian3, Cartographic, Ellipsoid, Matrix4} from "@cesium/core";
import {Transforms} from "@cesium/engine";
import {createTriangleMesh} from "@geoblocks/cesium-obstacles";
import CesiumWalk, {rayHeights, walkOn} from "./cesium-walk.js";

// a camera on the equator at longitude 0, looking north: east is right; it records its moves
const fakeViewer = (/** @type {number | undefined} */ ground = undefined) => {
  const position = Ellipsoid.WGS84.cartographicToCartesian({longitude: 0, latitude: 0, height: 2});
  /** @type {{direction: Cartesian3, amount: number}[]} */
  const moves = [];
  const camera = {
    position,
    positionWC: position,
    positionCartographic: {longitude: 0, latitude: 0, height: 2},
    direction: new Cartesian3(0, 0, 1),
    right: new Cartesian3(0, 1, 0),
    move: (/** @type {Cartesian3} */ direction, /** @type {number} */ amount) =>
      moves.push({direction: Cartesian3.clone(direction), amount}),
  };
  const viewer = {
    camera,
    scene: {camera, ellipsoid: Ellipsoid.WGS84, globe: {getHeight: () => ground}},
  };
  return {viewer: /** @type {any} */ (viewer), moves};
};

test("turning the head bob off while walking lets the camera settle", () => {
  const {viewer, moves} = fakeViewer(0);
  const walk = new CesiumWalk(viewer);
  const intent = {move: {x: 0, y: 1}, sprint: false, jump: false};
  walk.input = {read: () => intent};
  const tick = () => {
    walk.lastTick_ = performance.now() - 100;
    walk.handleTick_();
  };
  walk.headBob = true;
  tick();
  intent.move = {x: 0, y: 0};
  walk.headBob = false;
  for (let i = 0; i < 30; i++) {
    tick();
  }
  moves.length = 0;
  tick();
  assert.equal(moves.length, 0);
});

test("without a globe, the walker waits for a ground height", () => {
  const {viewer, moves} = fakeViewer();
  delete viewer.scene.globe;
  const walk = new CesiumWalk(viewer, 1.6, 2);
  walk.input = {read: () => ({move: {x: 0, y: 0}, sprint: false, jump: false})};
  walk.lastTick_ = performance.now() - 100;
  walk.handleTick_();
  assert.equal(moves.length, 0);
});

test("the walker stands on the ground height it is given, not on the terrain", () => {
  const {viewer, moves} = fakeViewer(0);
  const walk = new CesiumWalk(viewer, 1.6, 2);
  walk.groundHeight = () => 5;
  walk.input = {read: () => ({move: {x: 0, y: 0}, sprint: false, jump: false})};
  walk.lastTick_ = performance.now() - 100;
  walk.handleTick_();
  // from 2 m up to 5 m of ground plus 2 m of eyes
  assert.equal(moves.length, 1);
  assert.ok(Math.abs(moves[0].amount - 5) < 1e-9);
});

// a walker on the fake viewer, its intent and ground set by the test, ticking 0.1 s at a time
const testWalker = () => {
  const {viewer, moves} = fakeViewer(0);
  const walk = new CesiumWalk(viewer, 4, 2);
  const state = {intent: {move: {x: 0, y: 0}, sprint: false, jump: false}, ground: 0};
  walk.input = {read: () => state.intent};
  walk.groundHeight = () => state.ground;
  const tick = () => {
    walk.lastTick_ = performance.now() - 100;
    walk.handleTick_();
  };
  return {walk, moves, state, tick};
};
// the length of the steps forward, along the fake camera's direction
const forwardSteps = (/** @type {{direction: Cartesian3, amount: number}[]} */ moves) =>
  moves.filter(({direction}) => direction.z !== 0).map(({amount}) => amount);

test("the gravity sets how long a jump lasts", () => {
  const airborneAfter = (/** @type {number | undefined} */ gravity) => {
    const {walk, state, tick} = testWalker();
    if (gravity !== undefined) {
      walk.gravity = gravity;
    }
    state.intent.jump = true;
    tick();
    state.intent.jump = false;
    for (let i = 0; i < 4; i++) {
      tick();
    }
    return walk.jumpOffset_ > 0;
  };
  // a jump at 4 m/s lasts 0.82 s on Earth, 0.4 s at 20 m/s²
  assert.equal(airborneAfter(undefined), true);
  assert.equal(airborneAfter(20), false);
});

test("the walker follows a drop of the ground at once by default", () => {
  const {moves, state, tick} = testWalker();
  tick();
  state.ground = -5;
  moves.length = 0;
  tick();
  assert.ok(moves.some(({amount}) => Math.abs(amount + 5) < 1e-9));
});

test("with a step height, the walker falls down a deeper drop", () => {
  const {walk, moves, state, tick} = testWalker();
  walk.stepHeight = 0.5;
  tick();
  state.ground = -5;
  moves.length = 0;
  tick();
  // a tenth of a second of falling, not the whole drop
  assert.ok(moves.every(({amount}) => amount > -1));
  assert.ok(walk.jumpOffset_ > 4);
});

test("with a step height, the walker follows a shallower drop", () => {
  const {moves, state, walk, tick} = testWalker();
  walk.stepHeight = 0.5;
  tick();
  state.ground = -0.3;
  moves.length = 0;
  tick();
  assert.ok(moves.some(({amount}) => Math.abs(amount + 0.3) < 1e-9));
  assert.equal(walk.jumpOffset_, 0);
});

test("in the air, the walker keeps its height when the ground drops under it", () => {
  const {walk, state, tick} = testWalker();
  state.intent.jump = true;
  tick();
  const offset = walk.jumpOffset_;
  state.ground = -1;
  tick();
  // a tenth of a second higher in the jump, and a meter higher above the ground
  assert.ok(walk.jumpOffset_ > offset + 0.9);
});

test("the walker is at its speed at once by default", () => {
  const {moves, state, tick} = testWalker();
  state.intent.move = {x: 0, y: 1};
  tick();
  assert.deepEqual(forwardSteps(moves).map(step => +step.toFixed(9)), [0.4]);
});

test("with an acceleration, the walker reaches its speed gradually and stops gradually", () => {
  const {walk, moves, state, tick} = testWalker();
  walk.acceleration = 10;
  state.intent.move = {x: 0, y: 1};
  for (let i = 0; i < 5; i++) {
    tick();
  }
  state.intent.move = {x: 0, y: 0};
  for (let i = 0; i < 5; i++) {
    tick();
  }
  // 1, 2, 3, 4 m/s then 4 m/s, for 0.1 s each; then 3, 2, 1 m/s and stopped
  assert.deepEqual(forwardSteps(moves).map(step => +step.toFixed(9)), [0.1, 0.2, 0.3, 0.4, 0.4, 0.3, 0.2, 0.1]);
});

test("with collision, the walker stops at the obstacles it is given", () => {
  const {walk, moves, state, tick} = testWalker();
  walk.collision = true;
  /** @type {Cartesian3[]} */
  const asked = [];
  // a wall 0.3 m ahead, along the fake camera's direction, facing back
  walk.obstacleAhead = toward => {
    asked.push(Cartesian3.clone(toward));
    return {point: new Cartesian3(6378137, 0, 0.3), normal: new Cartesian3(0, 0, -1)};
  };
  state.intent.move = {x: 0, y: 1};
  tick();
  assert.ok(asked.length > 0);
  assert.deepEqual(forwardSteps(moves), []);
});

test("the rays at the knees, the waist and the eyes, the eyes low", () => {
  const [knees, waist, eyes] = rayHeights(0.9, 0.2);
  assert.ok(knees < waist && waist < eyes && eyes <= 0.9);
});

// a 4 m square floor at z 0 and a low wall along x = 2, 0.5 m high
const floorAndLowWall = {
  vertices: new Float32Array([-2, -2, 0, 2, -2, 0, 2, 2, 0, -2, 2, 0, 2, -2, 0, 2, 2, 0, 2, 2, 0.5, 2, -2, 0.5]),
  triangles: new Uint32Array([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]),
};

test("on a mesh, the walker stands on its floors, in meters, else on the ground it had", () => {
  // the frame in half meters: the floor 8 m wide
  const modelMatrix = Matrix4.multiply(Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(0, 0)), Matrix4.fromUniformScale(2), new Matrix4());
  const mesh = createTriangleMesh([floorAndLowWall], modelMatrix);
  const walk = /** @type {any} */ ({viewer: {scene: {camera: {}}}, groundHeight: () => -1});
  walkOn(walk, mesh, {eye: 1.6, step: 0.3, reach: 1});
  // the eyes 2 m above the floor, which lies on the ellipsoid
  assert.ok(Math.abs(walk.groundHeight(Cartographic.fromCartesian(mesh.position(0, 0, 1)))) < 1e-6);
  // the knees under the floor
  assert.equal(walk.groundHeight(Cartographic.fromCartesian(mesh.position(0, 0, 0.5))), -1);
  assert.equal(walk.groundHeight(Cartographic.fromCartesian(mesh.position(5, 5, 1))), -1);
});

test("on a mesh, a wall at the knees stops the walker, the floor does not", () => {
  const mesh = createTriangleMesh([floorAndLowWall], Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(0, 0)));
  const eyes = mesh.position(1.5, 0, 1.6);
  const walk = /** @type {any} */ ({viewer: {scene: {camera: {positionWC: eyes}}}, groundHeight: () => undefined});
  walkOn(walk, mesh, {eye: 1.6, step: 0.3, reach: 1});
  const east = Cartesian3.normalize(Cartesian3.subtract(mesh.position(2, 0, 1.6), eyes, new Cartesian3()), new Cartesian3());
  const obstacle = walk.obstacleAhead(east, "forward");
  assert.ok(Cartesian3.distance(obstacle.point, mesh.position(2, 0, 0.35)) < 1e-6);
  const down = Cartesian3.normalize(Cartesian3.subtract(mesh.position(1.5, 0, 0), eyes, new Cartesian3()), new Cartesian3());
  assert.equal(walk.obstacleAhead(down, "down"), undefined);
});

// a camera that walks: its position moves with camera.move, on the equator at longitude 0, on a mesh laid out in
// the east-north-up frame there
const walkingViewer = () => {
  const frame = Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(0, 0, 0));
  const camera = {
    position: new Cartesian3(),
    direction: new Cartesian3(),
    right: new Cartesian3(),
    get positionWC() {
      return this.position;
    },
    move: (/** @type {Cartesian3} */ direction, /** @type {number} */ amount) =>
      Cartesian3.add(camera.position, Cartesian3.multiplyByScalar(direction, amount, new Cartesian3()), camera.position),
  };
  const viewer = {
    camera,
    scene: {camera, ellipsoid: Ellipsoid.WGS84, globe: undefined, canvas: {}},
    clock: {onTick: {addEventListener: () => {}, removeEventListener: () => {}}},
  };
  return {viewer: /** @type {any} */ (viewer), frame};
};

// a 10 m square room: four walls 3 m high, and its floor; a 1 m square column in it at (4, 4) if asked
const squareRoom = (column = false) => {
  /** @type {{vertices: Float32Array, triangles: Uint32Array}[]} */
  const groups = [];
  const wall = (/** @type {number} */ x0, /** @type {number} */ y0, /** @type {number} */ x1, /** @type {number} */ y1, height = 3) =>
    groups.push({vertices: new Float32Array([x0, y0, 0, x1, y1, 0, x1, y1, height, x0, y0, height]), triangles: new Uint32Array([0, 1, 2, 0, 2, 3])});
  wall(0, 0, 10, 0);
  wall(10, 0, 10, 10);
  wall(10, 10, 0, 10);
  wall(0, 10, 0, 0);
  if (column) {
    wall(4, 4, 5, 4);
    wall(5, 4, 5, 5);
    wall(5, 5, 4, 5);
    wall(4, 5, 4, 4);
  }
  groups.push({vertices: new Float32Array([0, 0, 0, 10, 0, 0, 10, 10, 0, 0, 10, 0]), triangles: new Uint32Array([0, 1, 2, 0, 2, 3])});
  return {groups, wall};
};

test("at a concave corner the slide along one wall does not go through the other", () => {
  const {viewer, frame} = walkingViewer();
  const mesh = createTriangleMesh(squareRoom().groups, frame);
  const walk = new CesiumWalk(viewer, 2.5, 1.65);
  walk.collision = true;
  walkOn(walk, mesh, {eye: 1.65, step: 0.25, reach: 1});
  // from (8, 7.9) at eye height, walking diagonally into the corner at (10, 10), 60 steps a second for 20 seconds: a
  // little off the diagonal, the walker meets one wall first (aimed at the corner's edge itself, its rays would pass
  // between the two walls' triangles)
  mesh.position(8, 7.9, 1.65, viewer.camera.position);
  const toward = Matrix4.multiplyByPointAsVector(frame, new Cartesian3(Math.SQRT1_2, Math.SQRT1_2, 0), new Cartesian3());
  for (let tick = 0; tick < 1200; tick++) {
    walk.step_(toward, 2.5 / 60, "forward");
  }
  const {x, y} = mesh.local(viewer.camera.position);
  assert.ok(x < 9.7 && y < 9.7, `through a wall: (${x.toFixed(3)}, ${y.toFixed(3)})`);
  assert.ok(x > 9.3 && y > 9.3, `stopped short of the corner: (${x.toFixed(3)}, ${y.toFixed(3)})`);
});

test("the walker's body keeps it off the side and the corner of a column it walks past", () => {
  const {viewer, frame} = walkingViewer();
  const mesh = createTriangleMesh(squareRoom(true).groups, frame);
  const walk = new CesiumWalk(viewer, 2.5, 1.65);
  walk.collision = true;
  walkOn(walk, mesh, {eye: 1.65, step: 0.25, reach: 1, radius: 0.4});
  // north along x 5.2, a hair's breadth past the column's east side and corners, which no ray ahead meets
  mesh.position(5.2, 2, 1.65, viewer.camera.position);
  const north = Matrix4.multiplyByPointAsVector(frame, Cartesian3.UNIT_Y, new Cartesian3());
  let nearest = Infinity;
  for (let tick = 0; tick < 300; tick++) {
    walk.step_(north, 2.5 / 60, "forward");
    const {x, y} = mesh.local(viewer.camera.position);
    nearest = Math.min(nearest, Math.hypot(Math.max(4 - x, 0, x - 5), Math.max(4 - y, 0, y - 5)));
  }
  const {y} = mesh.local(viewer.camera.position);
  assert.ok(y > 8, `stuck at y ${y.toFixed(3)}`);
  assert.ok(nearest > 0.4 - 1e-3, `the body ${nearest.toFixed(3)} m from the column`);
});

test("the walker's body keeps it off a wall it walks along", () => {
  const {viewer, frame} = walkingViewer();
  const mesh = createTriangleMesh(squareRoom().groups, frame);
  const walk = new CesiumWalk(viewer, 2.5, 1.65);
  walk.collision = true;
  walkOn(walk, mesh, {eye: 1.65, step: 0.25, reach: 1, radius: 0.4});
  mesh.position(9.9, 2, 1.65, viewer.camera.position);
  const north = Matrix4.multiplyByPointAsVector(frame, Cartesian3.UNIT_Y, new Cartesian3());
  walk.step_(north, 2.5 / 60, "forward");
  const {x, y} = mesh.local(viewer.camera.position);
  assert.ok(Math.abs(x - 9.6) < 1e-6, `at x ${x.toFixed(3)}`);
  assert.ok(y > 2, "the step taken");
});

test("a step's riser under the knees does not push the walker back", () => {
  const {viewer, frame} = walkingViewer();
  const {groups, wall} = squareRoom();
  // a step 0.2 m high across the room at x 5, its tread the floor behind it
  wall(5, 0, 5, 10, 0.2);
  groups.push({vertices: new Float32Array([5, 0, 0.2, 10, 0, 0.2, 10, 10, 0.2, 5, 10, 0.2]), triangles: new Uint32Array([0, 1, 2, 0, 2, 3])});
  const mesh = createTriangleMesh(groups, frame);
  const walk = new CesiumWalk(viewer, 2.5, 1.65);
  walk.collision = true;
  walkOn(walk, mesh, {eye: 1.65, step: 0.25, reach: 1, radius: 0.4});
  mesh.position(4.7, 5, 1.65, viewer.camera.position);
  const east = Matrix4.multiplyByPointAsVector(frame, Cartesian3.UNIT_X, new Cartesian3());
  for (let tick = 0; tick < 30; tick++) {
    walk.step_(east, 2.5 / 60, "forward");
  }
  const {x} = mesh.local(viewer.camera.position);
  assert.ok(x > 5.5, `held back at x ${x.toFixed(3)}`);
});
