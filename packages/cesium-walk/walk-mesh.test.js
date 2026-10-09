import {test} from "node:test";
import assert from "node:assert/strict";
import {Cartesian3, Cartographic, Matrix4} from "@cesium/core";
import {Transforms} from "@cesium/engine";
import {createWalkMesh, rayHeights, toGlb, walkOn} from "./walk-mesh.js";

// a 4 m square floor at z 0 and a wall along x = 2, walked on only: no model is made, no GPU needed
const floorAndWall = {
  color: [1, 1, 1, 1],
  show: false,
  vertices: new Float32Array([-2, -2, 0, 2, -2, 0, 2, 2, 0, -2, 2, 0, 2, -2, 0, 2, 2, 0, 2, 2, 3, 2, -2, 3]),
  triangles: new Uint32Array([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]),
};

test("a mesh's floor below a point, and none off it", async () => {
  const mesh = await createWalkMesh([floorAndWall], Matrix4.IDENTITY);
  assert.equal(mesh.floorBelow(0, 0, 1), 0);
  assert.equal(mesh.floorBelow(5, 5, 1), undefined);
});

test("a ray stops at the wall, the walls only skipping the floor", async () => {
  const mesh = await createWalkMesh([floorAndWall], Matrix4.IDENTITY);
  const hit = mesh.raycast(new Cartesian3(0, 0, 1), new Cartesian3(1, 0, 0), 10, {walls: true});
  assert.ok(Math.abs(hit.distance - 2) < 1e-6);
  assert.ok(Math.abs(hit.normal.x + 1) < 1e-6);
  assert.equal(mesh.raycast(new Cartesian3(0, 0, 1), new Cartesian3(0, 0, -1), 10, {walls: true}), undefined);
});

test("a scaled frame's rays and floors, in meters", async () => {
  // the frame in half meters: the floor 8 m wide, the wall 4 m east
  const modelMatrix = Matrix4.multiply(Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(0, 0)), Matrix4.fromUniformScale(2), new Matrix4());
  const mesh = await createWalkMesh([floorAndWall], modelMatrix);
  const origin = mesh.position(0, 0, 0.5);
  const east = Cartesian3.normalize(Cartesian3.subtract(mesh.position(1, 0, 0.5), origin, new Cartesian3()), new Cartesian3());
  const hit = mesh.raycast(origin, east, 10, {walls: true});
  assert.ok(Math.abs(hit.distance - 4) < 1e-6);
  assert.ok(Cartesian3.distance(hit.position, mesh.position(2, 0, 0.5)) < 1e-6);
  assert.ok(Math.abs(Cartesian3.dot(hit.normal, east) + 1) < 1e-6);
  assert.equal(mesh.raycast(origin, east, 3, {walls: true}), undefined);

  const walk = /** @type {any} */ ({viewer: {scene: {camera: {}}}, groundHeight: () => -1});
  walkOn(walk, mesh, {eye: 1.6, step: 0.3, reach: 1});
  // the eyes 2 m above the floor, which lies on the ellipsoid
  assert.ok(Math.abs(walk.groundHeight(Cartographic.fromCartesian(mesh.position(0, 0, 1)))) < 1e-6);
});

test("a single point makes a valid model", () => {
  const glb = toGlb(new Float32Array([1, 2, 3]), new Uint32Array([0, 0, 0]), [1, 1, 1, 1], 0, false, undefined);
  const view = new DataView(glb);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(glb, 20, view.getUint32(12, true))));
  const {min, max} = json.accessors[0];
  assert.ok([...min, ...max, ...json.nodes[0].scale, ...json.nodes[0].translation].every(Number.isFinite));
});

test("the rays at the knees, the waist and the eyes, the eyes low", () => {
  const [knees, waist, eyes] = rayHeights(0.9, 0.2);
  assert.ok(knees < waist && waist < eyes && eyes <= 0.9);
});
