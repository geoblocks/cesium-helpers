import {test} from "node:test";
import assert from "node:assert/strict";
import {Cartesian3, Ellipsoid} from "@cesium/core";
import CesiumWalk from "./cesium-walk.js";

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
    scene: {camera, globe: {ellipsoid: Ellipsoid.WGS84, getHeight: () => ground}},
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
