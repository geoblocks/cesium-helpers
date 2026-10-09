import {test} from "node:test";
import assert from "node:assert/strict";
import {Group} from "./mesh-builder.js";

test("a box's twelve triangles, a polygon's round its hole, the options passed on", () => {
  const group = new Group([1, 1, 1, 1], {collide: false, charts: true});
  group.box(0, 0, 0, 1, 1, 1);
  group.polygon([[0, 0], [4, 0], [4, 4], [0, 4]], [[[1, 1], [1, 3], [3, 3], [3, 1]]], () => 2);
  const {vertices, triangles, collide, charts} = group.walkGroup;
  assert.equal(triangles.length / 3, 12 + 8);
  assert.equal(vertices.length / 3, 24 + 8);
  assert.equal(collide, false);
  assert.equal(charts.length, 7);
  assert.deepEqual(charts.at(-1), {start: 24, count: 8, normal: [0, 0, 32]});
});
