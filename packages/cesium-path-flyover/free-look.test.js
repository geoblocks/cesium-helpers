// packages/cesium-path-flyover/free-look.test.js
import {test} from "node:test";
import assert from "node:assert/strict";
import {Math as CesiumMath} from "@cesium/engine";
import FreeLook from "./free-look.js";

const deg = CesiumMath.toDegrees;
const pitch = CesiumMath.toRadians(-25);
// runs the clock in 0.05 s steps from `from` to `to`, returns the last view
const settle = (look, from, to) => {
  let view = look.view;
  for (let t = from; t <= to + 1e-9; t += 0.05) {
    view = look.update(t);
  }
  return view;
};

test("a drag right turns the heading 0.3 degrees per pixel once settled", () => {
  const look = new FreeLook({pitch, recenterDelay: false});
  look.update(0);
  look.dragStart(0);
  look.drag(100, 0, 0);
  look.dragEnd(0);
  const view = settle(look, 0.05, 3);
  assert.ok(Math.abs(deg(view.headingDelta) - 30) < 0.1, `heading ${deg(view.headingDelta)}`);
  assert.ok(Math.abs(view.pitchDelta) < 1e-9);
  assert.equal(view.zoom, 1);
});

test("a long drag keeps turning, several times around", () => {
  const look = new FreeLook({pitch, recenterDelay: false});
  look.update(0);
  look.dragStart(0);
  look.drag(2400, 0, 0);
  look.dragEnd(0);
  const view = settle(look, 0.05, 3);
  assert.ok(Math.abs(deg(view.headingDelta) - 720) < 0.5, `heading ${deg(view.headingDelta)}`);
});

test("a drag down looks more from above, both ends of the pitch are clamped", () => {
  const look = new FreeLook({pitch, recenterDelay: false});
  look.update(0);
  look.dragStart(0);
  look.drag(0, 50, 0);
  look.dragEnd(0);
  let view = settle(look, 0.05, 3);
  assert.ok(Math.abs(deg(view.pitchDelta) + 15) < 0.1, `pitch delta ${deg(view.pitchDelta)}`);
  look.dragStart(3);
  look.drag(0, 1000, 3);
  look.dragEnd(3);
  view = settle(look, 3.05, 6);
  assert.ok(Math.abs(deg(pitch + view.pitchDelta) + 85) < 0.1, `floor ${deg(pitch + view.pitchDelta)}`);
  look.dragStart(6);
  look.drag(0, -2000, 6);
  look.dragEnd(6);
  view = settle(look, 6.05, 9);
  assert.ok(Math.abs(deg(pitch + view.pitchDelta) + 5) < 0.1, `ceiling ${deg(pitch + view.pitchDelta)}`);
});

test("the wheel zooms 10% per notch and clamps at 0.5 and 3", () => {
  const look = new FreeLook({pitch, recenterDelay: false});
  look.update(0);
  look.wheel(1, 0);
  let view = settle(look, 0.05, 3);
  assert.ok(Math.abs(view.zoom - 1 / 1.1) < 1e-3, `one notch in ${view.zoom}`);
  for (let i = 0; i < 30; i++) look.wheel(1, 3);
  view = settle(look, 3.05, 6);
  assert.ok(Math.abs(view.zoom - 0.5) < 1e-3, `floor ${view.zoom}`);
  for (let i = 0; i < 60; i++) look.wheel(-1, 6);
  view = settle(look, 6.05, 9);
  assert.ok(Math.abs(view.zoom - 3) < 1e-3, `ceiling ${view.zoom}`);
});

test("the offsets are damped with a 0.15 s time constant", () => {
  const look = new FreeLook({pitch, recenterDelay: false});
  look.update(0);
  look.dragStart(0);
  look.drag(100, 0, 0);
  const view = look.update(0.15);
  assert.ok(Math.abs(deg(view.headingDelta) - 30 * (1 - Math.exp(-1))) < 0.1, `after one tau ${deg(view.headingDelta)}`);
});

test("the view returns to the plan after the delay, along a smoothstep", () => {
  const look = new FreeLook({pitch, recenterDelay: 2});
  look.update(0);
  look.dragStart(0);
  look.drag(100, 0, 0);
  look.dragEnd(0);
  let view = settle(look, 0.05, 1.9);
  assert.ok(Math.abs(deg(view.headingDelta) - 30) < 0.1, "held before the delay");
  view = look.update(2.75);
  assert.ok(deg(view.headingDelta) > 10 && deg(view.headingDelta) < 20, `halfway ${deg(view.headingDelta)}`);
  view = look.update(3.5);
  assert.equal(view.headingDelta, 0);
  assert.equal(view.pitchDelta, 0);
  assert.equal(view.zoom, 1);
  assert.equal(look.active, false);
});

test("a new input cancels the return and holds the view", () => {
  const look = new FreeLook({pitch, recenterDelay: 2});
  look.update(0);
  look.dragStart(0);
  look.drag(100, 0, 0);
  look.dragEnd(0);
  settle(look, 0.05, 2.5);
  const held = look.update(2.5).headingDelta;
  assert.ok(held > 0 && held < CesiumMath.toRadians(30), "mid return");
  look.wheel(1, 2.5);
  const view = settle(look, 2.55, 4);
  assert.ok(Math.abs(view.headingDelta - held) < 1e-6, `held ${deg(view.headingDelta)} vs ${deg(held)}`);
});

test("recenterDelay false never returns, recenter() does; delay 0 returns as soon as the drag ends", () => {
  const never = new FreeLook({pitch, recenterDelay: false});
  never.update(0);
  never.dragStart(0);
  never.drag(100, 0, 0);
  never.dragEnd(0);
  assert.ok(Math.abs(deg(settle(never, 0.05, 10).headingDelta) - 30) < 0.1);
  never.recenter(10);
  assert.equal(settle(never, 10.05, 12).headingDelta, 0);

  const eager = new FreeLook({pitch, recenterDelay: 0});
  eager.update(0);
  eager.dragStart(0);
  eager.drag(100, 0, 0);
  const dragging = settle(eager, 0.05, 1);
  assert.ok(Math.abs(deg(dragging.headingDelta) - 30) < 0.1, "no return while dragging");
  eager.dragEnd(1);
  assert.equal(settle(eager, 1.05, 3).headingDelta, 0);
});

test("active reflects offsets, drags and returns", () => {
  const look = new FreeLook({pitch, recenterDelay: false});
  assert.equal(look.active, false);
  look.dragStart(0);
  assert.equal(look.active, true);
  look.dragEnd(0);
  assert.equal(look.active, false);
  look.wheel(1, 0);
  settle(look, 0.05, 1);
  assert.equal(look.active, true);
});

test("the return after a long drag takes the short way, not back through every turn", () => {
  const look = new FreeLook({pitch, recenterDelay: false});
  look.update(0);
  look.dragStart(0);
  look.drag(2500, 0, 0); // 750 degrees: two turns and 30 more
  look.dragEnd(0);
  settle(look, 0.05, 3);
  look.recenter(3);
  let travelled = 0;
  let previous = look.view.headingDelta;
  for (let t = 3.05; t <= 5; t += 0.05) {
    const heading = look.update(t).headingDelta;
    travelled += Math.abs(heading - previous);
    previous = heading;
  }
  assert.ok(deg(travelled) < 35, `turned ${deg(travelled)} degrees on the way back`);
  assert.equal(look.view.headingDelta, 0);
});
