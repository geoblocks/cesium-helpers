import {test} from "node:test";
import assert from "node:assert/strict";
import FirstPersonCameraMode from "./FirstPersonCameraMode.js";

globalThis.document = /** @type {any} */ ({addEventListener: () => {}, removeEventListener: () => {}});

// a camera looking north, level; it records the views it is set to
const fakeViewer = () => {
  /** @type {{heading: number, pitch: number}[]} */
  const views = [];
  const camera = {
    heading: 0,
    pitch: 0,
    frustum: {fov: 1},
    setView: (/** @type {{orientation: {heading: number, pitch: number}}} */ {orientation}) => views.push(orientation),
  };
  const viewer = {scene: {camera, requestRender: () => {}}};
  return {viewer: /** @type {any} */ (viewer), views};
};

test("a look up and a little to the side turns the view up and a little to the side", () => {
  const {viewer, views} = fakeViewer();
  const mode = new FirstPersonCameraMode(viewer);
  mode.input = {read: () => ({look: {x: 0.1, y: 0.9}, zoom: false})};
  mode.lastTick_ = performance.now() - 50;
  mode.onTick_();
  assert.equal(views.length, 1);
  assert.ok(views[0].heading > 0);
  assert.ok(views[0].pitch > 0);
});

test("the mouse turns the view on the tick, before the frame renders", () => {
  const {viewer, views} = fakeViewer();
  const mode = new FirstPersonCameraMode(viewer);
  mode.input = {read: () => ({look: {x: 0, y: 0}, zoom: false})};
  mode.onMouseMove_(/** @type {MouseEvent} */ ({movementX: 100, movementY: 0}));
  mode.onTick_();
  assert.equal(views.length, 1);
  assert.ok(views[0].heading > 0);
});

// a viewer whose camera controller's inputs an app turned off before the mode, and whose widget handler is not the
// mode's to touch
const lockedViewer = () => {
  const camera = {heading: 0, pitch: 0, frustum: {fov: 1}, setView: () => {}};
  const refused = () => {
    throw new Error("the widget's handler is not the mode's");
  };
  const viewer = {
    scene: {
      camera,
      requestRender: () => {},
      canvas: {addEventListener: () => {}, removeEventListener: () => {}},
      screenSpaceCameraController: {enableInputs: false},
    },
    clock: {onTick: {addEventListener: () => {}, removeEventListener: () => {}}},
    screenSpaceEventHandler: {setInputAction: refused, removeInputAction: refused},
  };
  return /** @type {any} */ (viewer);
};

test("entered and left, the camera controller's inputs are as they were, off included, and the widget's handler untouched", () => {
  globalThis.window = /** @type {any} */ ({addEventListener: () => {}, removeEventListener: () => {}});
  const viewer = lockedViewer();
  const mode = new FirstPersonCameraMode(viewer);
  mode.enter_();
  assert.equal(viewer.scene.screenSpaceCameraController.enableInputs, false);
  mode.leave_();
  assert.equal(viewer.scene.screenSpaceCameraController.enableInputs, false);
});
