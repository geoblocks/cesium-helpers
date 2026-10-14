import {test} from "node:test";
import assert from "node:assert/strict";
import {gltfTriangles} from "./gltf-mesh.js";

/**
 * A binary glTF of a JSON and a binary buffer, each padded to 4 bytes.
 * @param {any} json
 * @param {Uint8Array} bin
 * @return {ArrayBuffer}
 */
function glb(json, bin) {
  const text = new TextEncoder().encode(JSON.stringify({asset: {version: '2.0'}, ...json, buffers: [{byteLength: bin.byteLength}]}));
  const jsonLength = Math.ceil(text.length / 4) * 4;
  const binLength = Math.ceil(bin.byteLength / 4) * 4;
  const buffer = new ArrayBuffer(12 + 8 + jsonLength + 8 + binLength);
  const view = new DataView(buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, buffer.byteLength, true);
  view.setUint32(12, jsonLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(buffer, 20, jsonLength).fill(0x20).set(text);
  view.setUint32(20 + jsonLength, binLength, true);
  view.setUint32(24 + jsonLength, 0x004e4942, true);
  new Uint8Array(buffer, 28 + jsonLength, bin.byteLength).set(bin);
  return buffer;
}

/**
 * Typed arrays one after the other, each at a multiple of 4 bytes.
 * @param {...ArrayBufferView} arrays
 * @return {{bin: Uint8Array, offsets: number[]}}
 */
function concat(...arrays) {
  const offsets = [];
  let length = 0;
  for (const array of arrays) {
    offsets.push(length);
    length += Math.ceil(array.byteLength / 4) * 4;
  }
  const bin = new Uint8Array(length);
  arrays.forEach((array, k) => bin.set(new Uint8Array(array.buffer, array.byteOffset, array.byteLength), offsets[k]));
  return {bin, offsets};
}

/**
 * A glb of one mesh of positions, indexed or not, its nodes given.
 * @param {number[]} positions In glTF's y up.
 * @param {Uint8Array | Uint16Array | Uint32Array | undefined} indices
 * @param {any[]} [nodes]
 * @param {number} [mode]
 */
function meshGlb(positions, indices, nodes = [{mesh: 0}], mode = 4) {
  const {bin, offsets} = concat(new Float32Array(positions), ...(indices ? [indices] : []));
  const componentType = indices instanceof Uint8Array ? 5121 : indices instanceof Uint16Array ? 5123 : 5125;
  return glb({
    scene: 0,
    scenes: [{nodes: nodes.map((_, i) => i).filter(i => !nodes.some(node => node.children?.includes(i)))}],
    nodes,
    meshes: [{name: 'mesh', primitives: [{attributes: {POSITION: 0}, mode, ...(indices ? {indices: 1} : {})}]}],
    bufferViews: [
      {buffer: 0, byteOffset: 0, byteLength: positions.length * 4},
      ...(indices ? [{buffer: 0, byteOffset: offsets[1], byteLength: indices.byteLength}] : []),
    ],
    accessors: [
      {bufferView: 0, componentType: 5126, count: positions.length / 3, type: 'VEC3'},
      ...(indices ? [{bufferView: 1, componentType, count: indices.length, type: 'SCALAR'}] : []),
    ],
  }, bin);
}

// a 4 m square floor at glTF y 0 and a wall along x = 2, 3 m high, in glTF's y up
const floorAndWall = [-2, 0, 2, 2, 0, 2, 2, 0, -2, -2, 0, -2, 2, 0, 2, 2, 0, -2, 2, 3, -2, 2, 3, 2];
const floorAndWallIndices = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7];

/**
 * @param {Float32Array} vertices
 * @param {number} i
 */
const vertex = (vertices, i) => Array.from(vertices.subarray(i * 3, i * 3 + 3));

test("a floor and a wall, indexed in 8, 16 and 32 bits, turned z up", () => {
  for (const Indices of [Uint8Array, Uint16Array, Uint32Array]) {
    const [primitive] = gltfTriangles(meshGlb(floorAndWall, new Indices(floorAndWallIndices)));
    assert.deepEqual(Array.from(primitive.triangles), floorAndWallIndices);
    assert.deepEqual(vertex(primitive.vertices, 0), [-2, -2, 0]);
    assert.deepEqual(vertex(primitive.vertices, 6), [2, 2, 3]);
    // the floor at z 0
    for (const i of [0, 1, 2, 3]) {
      assert.equal(primitive.vertices[i * 3 + 2], 0);
    }
    assert.deepEqual({name: primitive.name, node: primitive.node, mesh: primitive.mesh, primitive: primitive.primitive},
      {name: 'mesh', node: 0, mesh: 0, primitive: 0});
  }
});

test("glTF's (1, 2, 3) at (1, -3, 2)", () => {
  const [primitive] = gltfTriangles(meshGlb([1, 2, 3, 0, 0, 0, 1, 0, 0], undefined));
  assert.deepEqual(vertex(primitive.vertices, 0), [1, -3, 2]);
});

test("unindexed, its vertices in order", () => {
  const [primitive] = gltfTriangles(meshGlb(floorAndWall.slice(0, 9), undefined));
  assert.deepEqual(Array.from(primitive.triangles), [0, 1, 2]);
});

test("strips and fans made triangles", () => {
  const square = [0, 0, 0, 1, 0, 0, 0, 0, -1, 1, 0, -1];
  assert.deepEqual(Array.from(gltfTriangles(meshGlb(square, undefined, [{mesh: 0}], 5))[0].triangles), [0, 1, 2, 1, 3, 2]);
  assert.deepEqual(Array.from(gltfTriangles(meshGlb(square, undefined, [{mesh: 0}], 6))[0].triangles), [1, 2, 0, 2, 3, 0]);
  // points and lines skipped
  assert.equal(gltfTriangles(meshGlb(square, undefined, [{mesh: 0}], 1)).length, 0);
});

test("a node translated and turned", () => {
  // a quarter turn round glTF's y, +x to -z, then 10 m along x
  const s = Math.SQRT1_2;
  const [primitive] = gltfTriangles(meshGlb([1, 0, 0, 0, 0, 0, 0, 1, 0], undefined, [{mesh: 0, translation: [10, 0, 0], rotation: [0, s, 0, s]}]));
  const [x, y, z] = vertex(primitive.vertices, 0);
  assert.ok(Math.abs(x - 10) < 1e-6 && Math.abs(y - 1) < 1e-6 && Math.abs(z) < 1e-6);
});

test("nested nodes, by a matrix and a scale", () => {
  // the parent 5 m up by its matrix, column major, the child twice the size
  const nodes = [{children: [1], matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 5, 0, 1]}, {mesh: 0, scale: [2, 2, 2], name: 'child'}];
  const [primitive] = gltfTriangles(meshGlb([1, 0, 0, 0, 0, 0, 0, 1, 0], undefined, nodes));
  assert.deepEqual(vertex(primitive.vertices, 0), [2, 0, 5]);
  assert.equal(primitive.name, 'child');
  assert.equal(primitive.node, 1);
});

test("a mesh used by two nodes, twice", () => {
  const primitives = gltfTriangles(meshGlb([1, 0, 0, 0, 0, 0, 0, 1, 0], undefined, [{mesh: 0}, {mesh: 0, translation: [0, 0, -4]}]));
  assert.deepEqual(primitives.map(primitive => primitive.node), [0, 1]);
  assert.deepEqual(vertex(primitives[0].vertices, 0), [1, 0, 0]);
  assert.deepEqual(vertex(primitives[1].vertices, 0), [1, 4, 0]);
});

test("positions interleaved with normals, by a byte stride", () => {
  const interleaved = new Float32Array([1, 2, 3, 0, 1, 0, 4, 5, 6, 0, 1, 0, 7, 8, 9, 0, 1, 0]);
  const [primitive] = gltfTriangles(glb({
    nodes: [{mesh: 0}],
    meshes: [{primitives: [{attributes: {POSITION: 0, NORMAL: 1}}]}],
    bufferViews: [{buffer: 0, byteLength: interleaved.byteLength, byteStride: 24}],
    accessors: [
      {bufferView: 0, componentType: 5126, count: 3, type: 'VEC3'},
      {bufferView: 0, byteOffset: 12, componentType: 5126, count: 3, type: 'VEC3'},
    ],
  }, new Uint8Array(interleaved.buffer)));
  assert.deepEqual(Array.from(primitive.vertices), [1, -3, 2, 4, -6, 5, 7, -9, 8]);
});

test("quantized positions, normalized shorts scaled by their node", () => {
  // KHR_mesh_quantization: shorts padded to 8 bytes a vertex
  const shorts = new Int16Array([32767, 0, -32767, 0, 0, 0, 0, 0, 0, 32767, 0, 0]);
  const [primitive] = gltfTriangles(glb({
    extensionsUsed: ['KHR_mesh_quantization'],
    extensionsRequired: ['KHR_mesh_quantization'],
    nodes: [{mesh: 0, scale: [4, 4, 4]}],
    meshes: [{primitives: [{attributes: {POSITION: 0}}]}],
    bufferViews: [{buffer: 0, byteLength: shorts.byteLength, byteStride: 8}],
    accessors: [{bufferView: 0, componentType: 5122, normalized: true, count: 3, type: 'VEC3'}],
  }, new Uint8Array(shorts.buffer)));
  assert.deepEqual(Array.from(primitive.vertices), [4, 4, 0, 0, 0, 0, 0, 0, 4]);
});

test("a glTF's JSON and its buffer", () => {
  const positions = new Float32Array([1, 2, 3, 0, 0, 0, 1, 0, 0]);
  const [primitive] = gltfTriangles({
    asset: {version: '2.0'},
    nodes: [{mesh: 0}],
    meshes: [{primitives: [{attributes: {POSITION: 0}}]}],
    buffers: [{byteLength: positions.byteLength, uri: 'positions.bin'}],
    bufferViews: [{buffer: 0, byteLength: positions.byteLength}],
    accessors: [{bufferView: 0, componentType: 5126, count: 3, type: 'VEC3'}],
  }, positions.buffer);
  assert.deepEqual(vertex(primitive.vertices, 0), [1, -3, 2]);
});

test("Draco and sparse accessors refused", () => {
  assert.throws(() => gltfTriangles(glb({extensionsRequired: ['KHR_draco_mesh_compression'], nodes: []}, new Uint8Array(0))),
    /KHR_draco_mesh_compression/);
  assert.throws(() => gltfTriangles(glb({
    nodes: [{mesh: 0}],
    meshes: [{primitives: [{attributes: {POSITION: 0}}]}],
    accessors: [{componentType: 5126, count: 3, type: 'VEC3', sparse: {count: 1}}],
  }, new Uint8Array(0))), /sparse/);
});
