import {test, mock} from "node:test";
import assert from "node:assert/strict";
import {acquireFrames, releaseFrames} from "./frame-clock.js";

// a scene that counts its render requests, and throws once destroyed, as Cesium's objects do
const fakeScene = () => {
  const scene = {
    renders: 0,
    destroyed: false,
    requestRender() {
      if (this.destroyed) {
        throw new Error("This object was destroyed");
      }
      this.renders++;
    },
    isDestroyed() {
      return this.destroyed;
    },
  };
  return scene;
};

// render requests during one second
const rendersInASecond = (scene) => {
  const before = scene.renders;
  mock.timers.tick(1000);
  return scene.renders - before;
};

// within a request: a period of 1000 / 30 ms does not divide a second exactly
const assertRate = (actual, expected, message) => {
  assert.ok(Math.abs(actual - expected) <= 1, `${message ?? "renders per second"}: ${actual}, not ${expected}`);
};

test("the scene renders at the rate of its only effect", () => {
  mock.timers.enable({apis: ["setInterval"]});
  const scene = fakeScene();
  acquireFrames(scene, 25);
  assertRate(rendersInASecond(scene), 25);
  releaseFrames(scene, 25);
  mock.timers.reset();
});

test("several effects render once, at the highest rate", () => {
  mock.timers.enable({apis: ["setInterval"]});
  const scene = fakeScene();
  acquireFrames(scene, 18);
  acquireFrames(scene, 30);
  acquireFrames(scene, 25);
  assertRate(rendersInASecond(scene), 30);
  releaseFrames(scene, 30);
  assertRate(rendersInASecond(scene), 25, "the next highest once the fastest is released");
  releaseFrames(scene, 18);
  releaseFrames(scene, 25);
  mock.timers.reset();
});

test("two effects at the same rate keep it until both are released", () => {
  mock.timers.enable({apis: ["setInterval"]});
  const scene = fakeScene();
  acquireFrames(scene, 30);
  acquireFrames(scene, 30);
  releaseFrames(scene, 30);
  assertRate(rendersInASecond(scene), 30);
  releaseFrames(scene, 30);
  assert.equal(rendersInASecond(scene), 0);
  mock.timers.reset();
});

test("releasing a rate that was not acquired changes nothing", () => {
  mock.timers.enable({apis: ["setInterval"]});
  const scene = fakeScene();
  releaseFrames(scene, 30);
  acquireFrames(scene, 25);
  releaseFrames(scene, 30);
  assertRate(rendersInASecond(scene), 25);
  releaseFrames(scene, 25);
  mock.timers.reset();
});

test("the clock stops by itself once the scene is destroyed", () => {
  mock.timers.enable({apis: ["setInterval"]});
  const scene = fakeScene();
  // an effect left active when its viewer is destroyed
  acquireFrames(scene, 30);
  mock.timers.tick(100);
  scene.destroyed = true;
  assert.doesNotThrow(() => mock.timers.tick(1000));
  mock.timers.reset();
});
