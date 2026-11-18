import {test} from "node:test";
import assert from "node:assert/strict";
import {Cartesian3, Event, Matrix4} from "@cesium/core";
import {acquireDepthTexture, acquireTerrainDepth, releaseDepthTexture, releaseTerrainDepth} from "./depth-test.js";

test("the terrain's depth is tested from the first acquire to the last release, then as the scene had it", () => {
  const scene = /** @type {any} */ ({globe: {depthTestAgainstTerrain: false}});
  acquireTerrainDepth(scene);
  acquireTerrainDepth(scene);
  assert.equal(scene.globe.depthTestAgainstTerrain, true);
  releaseTerrainDepth(scene);
  assert.equal(scene.globe.depthTestAgainstTerrain, true);
  releaseTerrainDepth(scene);
  assert.equal(scene.globe.depthTestAgainstTerrain, false);
  // a release too many changes nothing
  releaseTerrainDepth(scene);
  assert.equal(scene.globe.depthTestAgainstTerrain, false);
});

test("the last release puts back the setting of the globe the first acquire changed, the scene's globe replaced since", () => {
  const first = {depthTestAgainstTerrain: false};
  const scene = /** @type {any} */ ({globe: first});
  acquireTerrainDepth(scene);
  const replaced = {depthTestAgainstTerrain: false};
  scene.globe = replaced;
  acquireTerrainDepth(scene);
  releaseTerrainDepth(scene);
  releaseTerrainDepth(scene);
  assert.equal(first.depthTestAgainstTerrain, false);
  assert.equal(replaced.depthTestAgainstTerrain, false);
  // the next acquire is on the scene's globe now
  acquireTerrainDepth(scene);
  assert.equal(replaced.depthTestAgainstTerrain, true);
  releaseTerrainDepth(scene);
});

test("a user that acquired on a scene without a globe counts too", () => {
  const scene = /** @type {any} */ ({globe: undefined});
  acquireTerrainDepth(scene);
  releaseTerrainDepth(scene);
  scene.globe = {depthTestAgainstTerrain: false};
  acquireTerrainDepth(scene);
  assert.equal(scene.globe.depthTestAgainstTerrain, true);
  releaseTerrainDepth(scene);
  assert.equal(scene.globe.depthTestAgainstTerrain, false);
});

test("a stage reading the depth also gets a box ahead of the camera, so that a view of the sky alone still has its depth cleared", () => {
  /** @type {any[]} */
  const primitives = [];
  const scene = /** @type {any} */ ({
    globe: {depthTestAgainstTerrain: false},
    primitives: {
      add: (/** @type {any} */ primitive) => (primitives.push(primitive), primitive),
      remove: (/** @type {any} */ primitive) => primitives.splice(primitives.indexOf(primitive), 1),
    },
    preRender: new Event(),
    camera: {positionWC: new Cartesian3(1, 2, 3), directionWC: Cartesian3.UNIT_X, positionCartographic: {height: 500}},
  });
  acquireDepthTexture(scene);
  acquireDepthTexture(scene);
  assert.equal(scene.globe.depthTestAgainstTerrain, true);
  assert.equal(primitives.length, 1);
  scene.preRender.raiseEvent();
  assert.ok(Cartesian3.equals(Matrix4.getTranslation(primitives[0].modelMatrix, new Cartesian3()), new Cartesian3(1001, 2, 3)));
  // higher up, as far as the camera is high, not in front of the terrain
  scene.camera.positionCartographic.height = 5000;
  scene.preRender.raiseEvent();
  assert.ok(Cartesian3.equals(Matrix4.getTranslation(primitives[0].modelMatrix, new Cartesian3()), new Cartesian3(5001, 2, 3)));
  releaseDepthTexture(scene);
  assert.equal(primitives.length, 1);
  releaseDepthTexture(scene);
  assert.equal(primitives.length, 0);
  assert.equal(scene.preRender.numberOfListeners, 0);
  assert.equal(scene.globe.depthTestAgainstTerrain, false);
});
