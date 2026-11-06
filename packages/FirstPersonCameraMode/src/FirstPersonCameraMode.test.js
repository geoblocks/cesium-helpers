import {test} from "node:test";
import assert from "node:assert/strict";
import FirstPersonCameraMode from "./FirstPersonCameraMode.js";

// a document and a window that record their listeners; the pointer locked or released fires pointerlockchange
const fakePage = () => {
  /** @type {Map<string, Function>} */
  const listeners = new Map();
  const document = {
    pointerLockElement: /** @type {object | null} */ (null),
    addEventListener: (/** @type {string} */ type, /** @type {Function} */ listener) => listeners.set(type, listener),
    removeEventListener: (/** @type {string} */ type) => listeners.delete(type),
  };
  globalThis.document = /** @type {any} */ (document);
  globalThis.window = /** @type {any} */ ({addEventListener: () => {}, removeEventListener: () => {}});
  return {
    listeners,
    /** @param {boolean} locked */
    lock(locked) {
      document.pointerLockElement = locked ? {} : null;
      listeners.get("pointerlockchange")?.();
    },
  };
};

// a camera looking north, level, under a clock that records its tick listeners; it records the views it is set to
const fakeViewer = () => {
  /** @type {{heading: number, pitch: number}[]} */
  const views = [];
  /** @type {Function[]} */
  const ticks = [];
  const camera = {
    heading: 0,
    pitch: 0,
    frustum: {fov: 1},
    setView: (/** @type {{orientation: {heading: number, pitch: number}}} */ {orientation}) => views.push(orientation),
  };
  const viewer = {
    scene: {
      camera,
      requestRender: () => {},
      canvas: {addEventListener: () => {}, removeEventListener: () => {}},
      screenSpaceCameraController: {enableInputs: true},
    },
    clock: {
      onTick: {addEventListener: (/** @type {Function} */ listener) => ticks.push(listener), removeEventListener: () => {}},
    },
  };
  return {viewer: /** @type {any} */ (viewer), views, tick: () => ticks.forEach(listener => listener())};
};

test("a look up and a little to the side turns the view up and a little to the side", t => {
  const page = fakePage();
  const {viewer, views, tick} = fakeViewer();
  const mode = new FirstPersonCameraMode(viewer);
  mode.input = {read: () => ({look: {x: 0.1, y: 0.9}, zoom: false})};
  let now = 0;
  t.mock.method(performance, "now", () => now);
  page.lock(true);
  now = 50;
  tick();
  assert.equal(views.length, 1);
  assert.ok(views[0].heading > 0);
  assert.ok(views[0].pitch > 0);
});

test("the mouse turns the view on the tick, before the frame renders", () => {
  const page = fakePage();
  const {viewer, views, tick} = fakeViewer();
  const mode = new FirstPersonCameraMode(viewer);
  mode.input = {read: () => ({look: {x: 0, y: 0}, zoom: false})};
  page.lock(true);
  page.listeners.get("mousemove")?.(/** @type {MouseEvent} */ ({movementX: 100, movementY: 0}));
  tick();
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
  const page = fakePage();
  const viewer = lockedViewer();
  new FirstPersonCameraMode(viewer);
  page.lock(true);
  assert.equal(viewer.scene.screenSpaceCameraController.enableInputs, false);
  page.lock(false);
  assert.equal(viewer.scene.screenSpaceCameraController.enableInputs, false);
});
