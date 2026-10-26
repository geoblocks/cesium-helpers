import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Cartesian3, Cartographic, Matrix4} from '@cesium/core';
import {Transforms} from '@cesium/engine';
import {createTriangleMesh} from '@geoblocks/cesium-obstacles';
import CesiumDrone, {flyOn} from './cesium-drone.js';

// in a frame east, north and up on the equator at longitude 0
const modelMatrix = Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(0, 0));

/**
 * A horizontal square, 40 m wide, at a height.
 * @param {number} z
 */
const level = z => ({
  vertices: new Float32Array([-20, -20, z, 20, -20, z, 20, 20, z, -20, 20, z]),
  triangles: new Uint32Array([0, 1, 2, 0, 2, 3]),
});
// a wall along x = 2, 30 m high
const wall = {
  vertices: new Float32Array([2, -20, 0, 2, 20, 0, 2, 20, 30, 2, -20, 30]),
  triangles: new Uint32Array([0, 1, 2, 0, 2, 3]),
};

/**
 * A drone in a fake viewer, the sticks held by the test, ticking 0.1 s at a time.
 * @param {number | undefined} [terrain] The globe's height.
 */
const testDrone = (terrain = undefined) => {
  const scene = {camera: {setView: () => {}}, requestRender: () => {}, globe: {getHeight: () => terrain}, screenSpaceCameraController: {}};
  const drone = new CesiumDrone(/** @type {any} */ ({scene, camera: scene.camera, clock: {}}), {speed: 10});
  const sticks = {move: {x: 0, y: 0}, climb: 0, turn: 0, tilt: 0, boost: false};
  drone.input = {read: () => sticks};
  /** @type {number[]} */
  const crashes = [];
  drone.crashed.addEventListener((_, impact) => crashes.push(impact));
  const tick = () => {
    drone.lastTick_ = performance.now() - 100;
    drone.handleTick_();
  };
  return {drone, sticks, crashes, tick};
};

/**
 * @param {CesiumDrone} drone
 * @param {import('@geoblocks/cesium-obstacles').TriangleMesh} mesh
 */
const local = (drone, mesh) => mesh.local(drone.position_);

/**
 * A drone at a position of the mesh's frame.
 * @param {import('@geoblocks/cesium-obstacles').TriangleMesh} mesh
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
const placed = (mesh, x, y, z) => {
  const {drone, ...rest} = testDrone();
  mesh.position(x, y, z, drone.position_);
  return {drone, ...rest};
};

test('without a globe, the ground is the mesh\'s floor, and unknown off it, not an error', () => {
  const scene = {camera: {setView: () => {}}, requestRender: () => {}, screenSpaceCameraController: {}};
  const drone = new CesiumDrone(/** @type {any} */ ({scene, camera: scene.camera, clock: {}}), {speed: 10});
  flyOn(drone, createTriangleMesh([level(3)], modelMatrix));
  const above = (x, y) => Cartographic.fromCartesian(Matrix4.multiplyByPoint(modelMatrix, new Cartesian3(x, y, 8), new Cartesian3()));
  const floor = Cartographic.fromCartesian(Matrix4.multiplyByPoint(modelMatrix, new Cartesian3(0, 0, 3), new Cartesian3())).height;
  assert.ok(Math.abs(drone.groundHeight(above(0, 0)) - floor) < 1e-3);
  assert.equal(drone.groundHeight(above(500, 500)), undefined);
});

test('by default, the ground is the terrain', () => {
  const {drone} = testDrone(12);
  assert.equal(drone.groundHeight(new Cartographic(0, 0, 100)), 12);
});

test('among a mesh, the drone flying at a wall crashes before it', () => {
  const mesh = createTriangleMesh([level(0), wall], modelMatrix);
  const {drone, sticks, crashes, tick} = placed(mesh, -1, 0, 10);
  flyOn(drone, mesh);
  // east, at full speed, a meter a tick
  sticks.move = {x: 1, y: 0};
  drone.velocity_ = new Cartesian3(10, 0, 0);
  for (let i = 0; i < 5; i++) {
    tick();
  }
  assert.equal(crashes.length, 1);
  assert.ok(local(drone, mesh).x < 2 - 0.4 + 1e-6);
});

test('among a mesh, the drone flies on in the open air', () => {
  const mesh = createTriangleMesh([level(0), wall], modelMatrix);
  const {drone, sticks, crashes, tick} = placed(mesh, 0, 0, 10);
  flyOn(drone, mesh);
  // north, along the wall
  sticks.move = {x: 0, y: 1};
  drone.velocity_ = new Cartesian3(0, 10, 0);
  for (let i = 0; i < 5; i++) {
    tick();
  }
  assert.deepEqual(crashes, []);
  assert.ok(Math.abs(local(drone, mesh).y - 5) < 1e-3);
});

test('among a mesh, the drone keeps its clearance above a roof, and climbing, crashes into a ceiling', () => {
  const mesh = createTriangleMesh([level(0), level(12)], modelMatrix);
  const {drone, sticks, crashes, tick} = placed(mesh, 0, 0, 1);
  flyOn(drone, mesh);
  tick();
  assert.ok(Math.abs(/** @type {number} */ (drone.heightNow) - 2) < 1e-6);
  assert.ok(Math.abs(local(drone, mesh).z - 2) < 1e-3);
  assert.deepEqual(crashes, []);
  sticks.climb = 1;
  drone.velocity_ = new Cartesian3(0, 0, 6);
  for (let i = 0; i < 30; i++) {
    tick();
  }
  assert.equal(crashes.length, 1);
  assert.ok(local(drone, mesh).z < 12);
});
