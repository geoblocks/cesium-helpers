import assert from 'node:assert/strict';
import test from 'node:test';
import CesiumSphereCamera from './cesium-sphere-camera.js';

/**
 * A viewer that records the controllers added to it, its camera controller's inputs as given.
 * @param {boolean} enableInputs
 */
const fakeViewer = enableInputs => {
  /** @type {Set<unknown>} */
  const controllers = new Set();
  return {
    controllers,
    scene: {screenSpaceCameraController: {enableInputs}},
    addController: (/** @type {unknown} */ controller) => controllers.add(controller),
    removeController: (/** @type {unknown} */ controller) => controllers.delete(controller),
  };
};

test("active, it is a controller of the widget and the camera controller's inputs are off; inactive, both as they were", () => {
  for (const enableInputs of [true, false]) {
    const viewer = fakeViewer(enableInputs);
    const sphere = new CesiumSphereCamera(/** @type {any} */ (viewer));
    sphere.active = true;
    assert.ok(viewer.controllers.has(sphere));
    assert.equal(viewer.scene.screenSpaceCameraController.enableInputs, false);
    sphere.active = false;
    assert.equal(viewer.controllers.size, 0);
    assert.equal(viewer.scene.screenSpaceCameraController.enableInputs, enableInputs);
  }
});
