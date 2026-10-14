import {test} from "node:test";
import assert from "node:assert/strict";
import {Cartesian3, Cartographic, Matrix4} from "@cesium/core";
import {Axis, Transforms} from "@cesium/engine";
import {createWalkMesh, createWalkMeshFromGltf, rayHeights, toGlb, walkOn} from "./walk-mesh.js";

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

test("a glTF's floor and wall walked on as the groups they were written from", async () => {
  const modelMatrix = Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(6, 46));
  const groups = await createWalkMesh([floorAndWall], modelMatrix);
  const gltf = createWalkMeshFromGltf(toGlb(floorAndWall.vertices, floorAndWall.triangles, floorAndWall.color, 0, false, undefined), modelMatrix);
  for (const [x, y, z] of [[0, 0, 1], [1.5, -1.5, 0.2], [5, 5, 1], [0, 0, -1]]) {
    assert.equal(gltf.floorBelow(x, y, z), groups.floorBelow(x, y, z));
  }
  const origin = groups.position(0, 0, 1);
  for (const [x, y, z] of [[1, 0, 0], [1, 0.5, 0.2], [0, 0, -1], [-1, 0, 0]]) {
    const direction = Cartesian3.normalize(Cartesian3.subtract(groups.position(x, y, 1 + z), origin, new Cartesian3()), new Cartesian3());
    for (const walls of [false, true]) {
      const expected = groups.raycast(origin, direction, 10, {walls});
      const actual = gltf.raycast(origin, direction, 10, {walls});
      assert.equal(actual?.distance, expected?.distance);
      assert.ok(!expected || Cartesian3.equalsEpsilon(actual?.normal, expected.normal, 1e-9));
    }
  }
});

test("a glTF's primitives left out, and its model turned by Cesium's default forward axis", () => {
  const glb = toGlb(floorAndWall.vertices, floorAndWall.triangles, floorAndWall.color, 0, false, undefined);
  assert.equal(createWalkMeshFromGltf(glb, Matrix4.IDENTITY, {collide: () => false}).floorBelow(0, 0, 1), undefined);
  // where Cesium draws the wall's glTF (2, 1, -1), at 1 m by the floor's middle
  const mesh = createWalkMeshFromGltf(glb, Matrix4.IDENTITY, {forwardAxis: Axis.Z});
  const correction = Matrix4.multiplyTransformation(Axis.Y_UP_TO_Z_UP, Axis.Z_UP_TO_X_UP, new Matrix4());
  const drawn = Matrix4.multiplyByPoint(correction, new Cartesian3(2, 1, -1), new Cartesian3());
  const origin = new Cartesian3(0, 0, 1);
  const hit = mesh.raycast(origin, Cartesian3.normalize(Cartesian3.subtract(drawn, origin, new Cartesian3()), new Cartesian3()), 10, {walls: true});
  assert.ok(Cartesian3.distance(hit.position, drawn) < 1e-6);
});

test("a single point makes a valid model", () => {
  const glb = toGlb(new Float32Array([1, 2, 3]), new Uint32Array([0, 0, 0]), [1, 1, 1, 1], 0, false, undefined);
  const view = new DataView(glb);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(glb, 20, view.getUint32(12, true))));
  const {min, max} = json.accessors[0];
  assert.deepEqual([min, max], [[1, 3, -2], [1, 3, -2]]);
});

test("the rays at the knees, the waist and the eyes, the eyes low", () => {
  const [knees, waist, eyes] = rayHeights(0.9, 0.2);
  assert.ok(knees < waist && waist < eyes && eyes <= 0.9);
});
