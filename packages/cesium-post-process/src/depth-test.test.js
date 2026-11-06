import {test} from "node:test";
import assert from "node:assert/strict";
import {acquireTerrainDepth, releaseTerrainDepth} from "./depth-test.js";

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
