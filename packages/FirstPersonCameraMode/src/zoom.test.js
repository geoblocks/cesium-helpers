import {test} from "node:test";
import assert from "node:assert/strict";
import {Math as CesiumMath} from "@cesium/core";
import HoldZoom from "./zoom.js";

const BASE = CesiumMath.toRadians(60);

test("held, the zoom eases in over 0.2 s, and back out once released", () => {
  const zoom = new HoldZoom();
  zoom.update(true, 0.1);
  assert.ok(CesiumMath.equalsEpsilon(zoom.zoom, 0.5, CesiumMath.EPSILON9));
  zoom.update(true, 0.2);
  assert.equal(zoom.zoom, 1);
  assert.ok(CesiumMath.equalsEpsilon(zoom.fov(BASE), zoom.zoomFov, CesiumMath.EPSILON9));
  zoom.update(false, 0.2);
  assert.equal(zoom.zoom, 0);
  assert.equal(zoom.fov(BASE), BASE);
});

test("the zoom never widens the view past its base", () => {
  const zoom = new HoldZoom();
  const narrow = CesiumMath.toRadians(10);
  zoom.update(true, 0.1);
  assert.equal(zoom.fov(narrow), narrow);
});

test("the look slows down by the zoom", () => {
  const zoom = new HoldZoom();
  assert.equal(zoom.lookScale(BASE), 1);
  zoom.update(true, 0.2);
  assert.ok(CesiumMath.equalsEpsilon(zoom.lookScale(BASE), zoom.zoomFov / BASE, CesiumMath.EPSILON9));
});
