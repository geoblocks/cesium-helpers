import {test} from "node:test";
import assert from "node:assert/strict";
import {Cartesian3, Cartographic, Matrix4} from "@cesium/core";
import {Axis, Transforms} from "@cesium/engine";
import {createTriangleMesh, createTriangleMeshFromGltf, meshGroundHeight, meshObstacleAhead} from "./triangle-mesh.js";

// a 4 m square floor at z 0 and a wall along x = 2, 3 m high
const floorAndWall = {
  vertices: new Float32Array([-2, -2, 0, 2, -2, 0, 2, 2, 0, -2, 2, 0, 2, -2, 0, 2, 2, 0, 2, 2, 3, 2, -2, 3]),
  triangles: new Uint32Array([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]),
};

/**
 * The floor and wall as a glTF's JSON and its buffer, in glTF's y up: the frame's (x, y, z) at glTF's (x, z, -y).
 * @return {{json: any, buffer: Uint8Array}}
 */
function floorAndWallGltf() {
  const v = floorAndWall.vertices;
  const positions = new Float32Array(v.length);
  for (let i = 0; i < v.length; i += 3) {
    positions.set([v[i], v[i + 2], -v[i + 1]], i);
  }
  const buffer = new Uint8Array(positions.byteLength + floorAndWall.triangles.byteLength);
  buffer.set(new Uint8Array(positions.buffer), 0);
  buffer.set(new Uint8Array(floorAndWall.triangles.buffer), positions.byteLength);
  const json = {
    asset: {version: "2.0"},
    scene: 0,
    scenes: [{nodes: [0]}],
    nodes: [{mesh: 0}],
    meshes: [{primitives: [{attributes: {POSITION: 0}, indices: 1}]}],
    buffers: [{byteLength: buffer.byteLength}],
    bufferViews: [
      {buffer: 0, byteOffset: 0, byteLength: positions.byteLength},
      {buffer: 0, byteOffset: positions.byteLength, byteLength: floorAndWall.triangles.byteLength},
    ],
    accessors: [
      {bufferView: 0, componentType: 5126, count: positions.length / 3, type: "VEC3"},
      {bufferView: 1, componentType: 5125, count: floorAndWall.triangles.length, type: "SCALAR"},
    ],
  };
  return {json, buffer};
}

test("a mesh's floor below a point, and none off it", () => {
  const mesh = createTriangleMesh([floorAndWall], Matrix4.IDENTITY);
  assert.equal(mesh.floorBelow(0, 0, 1), 0);
  assert.equal(mesh.floorBelow(5, 5, 1), undefined);
});

test("a group that does not collide is left out", () => {
  const mesh = createTriangleMesh([{...floorAndWall, collide: false}], Matrix4.IDENTITY);
  assert.equal(mesh.floorBelow(0, 0, 1), undefined);
});

test("a ray stops at the wall, the walls only skipping the floor", () => {
  const mesh = createTriangleMesh([floorAndWall], Matrix4.IDENTITY);
  const hit = mesh.raycast(new Cartesian3(0, 0, 1), new Cartesian3(1, 0, 0), 10, {walls: true});
  assert.ok(hit && Math.abs(hit.distance - 2) < 1e-6);
  assert.ok(Math.abs(hit.normal.x + 1) < 1e-6);
  assert.equal(mesh.raycast(new Cartesian3(0, 0, 1), new Cartesian3(0, 0, -1), 10, {walls: true}), undefined);
});

test("a scaled frame's rays, in meters", () => {
  // the frame in half meters: the floor 8 m wide, the wall 4 m east
  const modelMatrix = Matrix4.multiply(Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(0, 0)), Matrix4.fromUniformScale(2), new Matrix4());
  const mesh = createTriangleMesh([floorAndWall], modelMatrix);
  const origin = mesh.position(0, 0, 0.5);
  const east = Cartesian3.normalize(Cartesian3.subtract(mesh.position(1, 0, 0.5), origin, new Cartesian3()), new Cartesian3());
  const hit = mesh.raycast(origin, east, 10, {walls: true});
  assert.ok(hit && Math.abs(hit.distance - 4) < 1e-6);
  assert.ok(Cartesian3.distance(hit.position, mesh.position(2, 0, 0.5)) < 1e-6);
  assert.ok(Math.abs(Cartesian3.dot(hit.normal, east) + 1) < 1e-6);
  assert.equal(mesh.raycast(origin, east, 3, {walls: true}), undefined);
});

test("a glTF's floor and wall, as the groups they were written from", () => {
  const modelMatrix = Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(6, 46));
  const groups = createTriangleMesh([floorAndWall], modelMatrix);
  const {json, buffer} = floorAndWallGltf();
  const gltf = createTriangleMeshFromGltf(json, modelMatrix, {buffers: buffer, forwardAxis: Axis.X});
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
      assert.ok(!expected || (actual && Cartesian3.equalsEpsilon(actual.normal, expected.normal, 1e-9)));
    }
  }
});

test("a glTF's primitives left out, and its model turned by Cesium's default forward axis", () => {
  const {json, buffer} = floorAndWallGltf();
  assert.equal(createTriangleMeshFromGltf(json, Matrix4.IDENTITY, {buffers: buffer, collide: () => false}).floorBelow(0, 0, 1), undefined);
  // where Cesium draws the wall's glTF (2, 1, -1), at 1 m by the floor's middle
  const mesh = createTriangleMeshFromGltf(json, Matrix4.IDENTITY, {buffers: buffer});
  const correction = Matrix4.multiplyTransformation(Axis.Y_UP_TO_Z_UP, Axis.Z_UP_TO_X_UP, new Matrix4());
  const drawn = Matrix4.multiplyByPoint(correction, new Cartesian3(2, 1, -1), new Cartesian3());
  const origin = new Cartesian3(0, 0, 1);
  const hit = mesh.raycast(origin, Cartesian3.normalize(Cartesian3.subtract(drawn, origin, new Cartesian3()), new Cartesian3()), 10, {walls: true});
  assert.ok(hit && Cartesian3.distance(hit.position, drawn) < 1e-6);
});

// the floor and wall at longitude 0 on the equator, east of the frame east; a mover 1 m above the floor's middle
const modelMatrix = Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(0, 0));
const mesh = createTriangleMesh([floorAndWall], modelMatrix);
const mover = mesh.position(0, 0, 1);
const east = Cartesian3.normalize(Cartesian3.subtract(mesh.position(1, 0, 1), mover, new Cartesian3()), new Cartesian3());
const north = Cartesian3.normalize(Cartesian3.subtract(mesh.position(0, 1, 1), mover, new Cartesian3()), new Cartesian3());

test("the wall ahead within the reach is the obstacle, facing the mover", () => {
  const obstacle = meshObstacleAhead(mesh, () => mover, {reach: 3})(east);
  assert.ok(obstacle?.point && obstacle.normal);
  assert.ok(Cartesian3.distance(obstacle.point, mesh.position(2, 0, 1)) < 1e-6);
  assert.ok(Math.abs(Cartesian3.dot(obstacle.normal, east) + 1) < 1e-6);
  assert.equal(meshObstacleAhead(mesh, () => mover, {reach: 1.5})(east), undefined);
  assert.equal(meshObstacleAhead(mesh, () => mover, {reach: 3})(north), undefined);
});

test("the nearest of the rays from about the mover, the floors left out but asked for", () => {
  // over the wall's top, the mover's own ray misses; one 2.5 m lower hits it
  const above = mesh.position(0, 0, 4);
  assert.equal(meshObstacleAhead(mesh, () => above, {reach: 3})(east), undefined);
  const lower = meshObstacleAhead(mesh, () => above, {offsets: [Cartesian3.ZERO, new Cartesian3(0, 0, -2.5)], reach: 3})(east);
  assert.ok(lower?.point && Cartesian3.distance(lower.point, mesh.position(2, 0, 1.5)) < 1e-6);
  // north of the wall's end, a ray 3 m south of the mover hits it
  const past = mesh.position(0, 3, 1);
  const beside = meshObstacleAhead(mesh, () => past, {offsets: [new Cartesian3(0, -3, 0)], reach: 3})(east);
  // the up at the mover 3 m north turned from the frame's by the Earth's curve
  assert.ok(beside?.point && Cartesian3.distance(beside.point, mesh.position(2, 0, 1)) < 1e-5);
  const down = Cartesian3.negate(Cartesian3.normalize(mover, new Cartesian3()), new Cartesian3());
  assert.equal(meshObstacleAhead(mesh, () => mover, {reach: 3})(down), undefined);
  const floor = meshObstacleAhead(mesh, () => mover, {reach: 3, walls: false})(down);
  assert.ok(floor?.point && Cartesian3.distance(floor.point, mesh.position(0, 0, 0)) < 1e-3);
});

test("the ground is the highest floor below a point under the mover", () => {
  const position = Cartographic.fromCartesian(mover);
  assert.ok(Math.abs(/** @type {number} */ (meshGroundHeight(mesh)(position))) < 1e-6);
  // looked for from 2 m under the mover, under the floor
  assert.equal(meshGroundHeight(mesh, {below: 2})(position), undefined);
  assert.equal(meshGroundHeight(mesh)(Cartographic.fromCartesian(mesh.position(5, 5, 1))), undefined);
});

test("the nearest surface within a radius of a point, the walls only skipping the floor", () => {
  const mesh = createTriangleMesh([floorAndWall], Matrix4.IDENTITY);
  const near = mesh.nearest(new Cartesian3(1.7, 0.5, 1), 0.5, {walls: true});
  assert.ok(near && Math.abs(near.distance - 0.3) < 1e-6);
  assert.ok(Cartesian3.distance(near.position, new Cartesian3(2, 0.5, 1)) < 1e-6);
  assert.ok(Math.abs(near.normal.x + 1) < 1e-6);
  assert.equal(mesh.nearest(new Cartesian3(1.4, 0.5, 1), 0.5, {walls: true}), undefined);
  // the floor, 0.2 m under the point, nearer than the wall
  const floor = mesh.nearest(new Cartesian3(1.7, 0.5, 0.2), 0.5);
  assert.ok(floor && Math.abs(floor.distance - 0.2) < 1e-6 && Math.abs(floor.normal.z - 1) < 1e-6);
});

test("the nearest surface past a wall's edge is on the edge", () => {
  const mesh = createTriangleMesh([floorAndWall], Matrix4.IDENTITY);
  // beyond the wall's north end, y 2, by 0.3, and 0.4 east of it
  const near = mesh.nearest(new Cartesian3(1.6, 2.3, 1), 1, {walls: true});
  assert.ok(near && Math.abs(near.distance - 0.5) < 1e-6);
  assert.ok(Cartesian3.distance(near.position, new Cartesian3(2, 2, 1)) < 1e-6);
});

test("a scaled frame's nearest surface, in meters", () => {
  const modelMatrix = Matrix4.multiply(Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(0, 0)), Matrix4.fromUniformScale(2), new Matrix4());
  const mesh = createTriangleMesh([floorAndWall], modelMatrix);
  // the wall 4 m east; the point 0.6 m from it
  const near = mesh.nearest(mesh.position(1.7, 0, 0.5), 1, {walls: true});
  assert.ok(near && Math.abs(near.distance - 0.6) < 1e-6);
  assert.ok(Cartesian3.distance(near.position, mesh.position(2, 0, 0.5)) < 1e-6);
  assert.equal(mesh.nearest(mesh.position(1.7, 0, 0.5), 0.5, {walls: true}), undefined);
});

test("a refitted mesh follows its groups' vertices moved in place: the wall's new place, the floor's new height", () => {
  const group = {vertices: Float32Array.from(floorAndWall.vertices), triangles: floorAndWall.triangles};
  const mesh = createTriangleMesh([group], Matrix4.IDENTITY);
  const ahead = () => mesh.raycast(new Cartesian3(0, 0, 1), new Cartesian3(1, 0, 0), 10, {walls: true});
  assert.ok(Math.abs(ahead().distance - 2) < 1e-6);
  assert.ok(Math.abs(mesh.floorBelow(0, 0, 5) - 0) < 1e-6);
  // the wall (the last two triangles' vertices, 8 to 23) a meter on, the floor (vertices 0 to 11) a meter up
  for (let i = 12; i < 24; i += 3) {
    group.vertices[i] += 1;
  }
  for (let i = 2; i < 12; i += 3) {
    group.vertices[i] += 1;
  }
  mesh.refit();
  assert.ok(Math.abs(ahead().distance - 3) < 1e-6);
  assert.ok(Math.abs(ahead().normal.x + 1) < 1e-6);
  assert.ok(Math.abs(mesh.floorBelow(0, 0, 5) - 1) < 1e-6);
  const near = mesh.nearest(new Cartesian3(2.8, 0.5, 1.5), 0.5, {walls: true});
  assert.ok(near && Math.abs(near.distance - 0.2) < 1e-6);
});

test("a surface at the start counts: the floor under a mover standing on it, the wall a ray starts on", () => {
  const mesh = createTriangleMesh([floorAndWall], Matrix4.IDENTITY);
  assert.equal(mesh.floorBelow(0, 0, 0), 0);
  const hit = mesh.raycast(new Cartesian3(2, 0, 1), new Cartesian3(1, 0, 0), 5, {walls: true});
  assert.ok(hit && hit.distance < 1e-9);
});
