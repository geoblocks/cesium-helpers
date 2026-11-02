import {test} from "node:test";
import assert from "node:assert/strict";
import {Math as CesiumMath} from "@cesium/core";
import {curved, eased, orbitElevation, zoomDistance} from "./cesium-gamepad-navigation.js";

const still = {pan: {x: 0, y: 0}, orbit: {x: 0, y: 0}, zoom: 0, climb: 0, north: false};

test("the motion starts eased, and reaches the sticks", () => {
  const full = {pan: {x: 0, y: 1}, orbit: {x: 0, y: 0}, zoom: 1, climb: -1, north: true};
  let intent = eased(still, full, 1 / 60);
  assert.ok(intent.pan.y > 0 && intent.pan.y < 0.2);
  assert.ok(intent.zoom > 0 && intent.zoom < 0.2);
  assert.ok(intent.climb < 0 && intent.climb > -0.2);
  assert.equal(intent.north, true);
  for (let i = 0; i < 120; i++) {
    intent = eased(intent, full, 1 / 60);
  }
  assert.deepEqual(intent, full);
});

test("the motion stops eased, and then for good", () => {
  let intent = eased({pan: {x: 1, y: 0}, orbit: {x: 0, y: -1}, zoom: 0, climb: 1, north: false}, still, 1 / 60);
  assert.ok(intent.pan.x > 0.8);
  assert.ok(intent.orbit.y < -0.8);
  assert.ok(intent.climb > 0.8);
  for (let i = 0; i < 120; i++) {
    intent = eased(intent, still, 1 / 60);
  }
  assert.deepEqual(intent, still);
});

test("a slight push is gentle, a full one as fast, along the stick's direction", () => {
  const {pan, orbit, zoom, climb, north} =
    curved({pan: {x: 0.3, y: 0.4}, orbit: {x: 0, y: -1}, zoom: -0.5, climb: 0.5, north: true});
  assert.ok(CesiumMath.equalsEpsilon(pan.x, 0.15, CesiumMath.EPSILON12));
  assert.ok(CesiumMath.equalsEpsilon(pan.y, 0.2, CesiumMath.EPSILON12));
  assert.deepEqual(orbit, {x: 0, y: -1});
  assert.equal(zoom, -0.25);
  assert.equal(climb, 0.25);
  assert.equal(north, true);
});

test("the zoom's speed follows how far the trigger is pressed", () => {
  const half = 1000 - zoomDistance(1000, 0.5, 1, 0.1, 1, Infinity);
  const full = 1000 - zoomDistance(1000, 1, 1, 0.1, 1, Infinity);
  assert.ok(half > 0);
  assert.ok(full > 1.9 * half);
});

test("the zoom is relative to the distance, as fast close up as far away", () => {
  assert.ok(CesiumMath.equalsEpsilon(zoomDistance(100, 1, 1, 0.1, 1, Infinity) / 100,
    zoomDistance(100000, 1, 1, 0.1, 1, Infinity) / 100000, CesiumMath.EPSILON12));
});

test("the left trigger zooms out", () => {
  assert.ok(zoomDistance(1000, -1, 1, 0.1, 1, Infinity) > 1000);
});

test("the zoom stops at the controller's distances, without jumping to them from beyond", () => {
  assert.equal(zoomDistance(10, 1, 100, 1, 5, 1000), 5);
  assert.equal(zoomDistance(990, -1, 100, 1, 5, 1000), 1000);
  assert.equal(zoomDistance(2, 1, 1, 0.1, 5, 1000), 2);
  assert.ok(zoomDistance(2, -1, 1, 0.1, 5, 1000) > 2);
});

test("the orbit stays above the horizon and short of straight down", () => {
  assert.ok(orbitElevation(0.2, -1) > 0);
  assert.ok(orbitElevation(1.5, 1) < CesiumMath.PI_OVER_TWO);
  assert.equal(orbitElevation(0.5, 0.1), 0.6);
});

test("the orbit leaves a camera below its lowest alone, and lets it rise", () => {
  assert.equal(orbitElevation(0.01, -0.1), 0.01);
  assert.equal(orbitElevation(0.01, 0.1), 0.11);
});
