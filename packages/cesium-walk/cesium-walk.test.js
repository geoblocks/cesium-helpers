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
