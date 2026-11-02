import {gltfTriangles as readGltf} from "@geoblocks/cesium-bvh/gltf";
import {Matrix4} from "@cesium/core";
import {Axis} from "@cesium/engine";

// The triangles of a glTF's meshes, in a triangle mesh's frame: glTF's y up turned z up by Cesium's own matrix
// (Axis.Y_UP_TO_Z_UP), its glTF (x, y, z) at (x, -z, y), as Cesium loads a model with forwardAxis X; with forwardAxis Z,
// Cesium's default, also turned by Axis.Z_UP_TO_X_UP, as Cesium's ModelUtility does. The reading is cesium-bvh's.

// in Cesium, not in its typings
const yUpToZUp = /** @type {Matrix4} */ (/** @type {any} */ (Axis).Y_UP_TO_Z_UP);
const zUpToXUp = /** @type {Matrix4} */ (/** @type {any} */ (Axis).Z_UP_TO_X_UP);

/** @typedef {import("@geoblocks/cesium-bvh/gltf").GltfTriangles} GltfTriangles */

/**
 * The triangles of every mesh primitive of a glTF's scene, in a triangle mesh's frame, z up: glTF's (x, y, z) at (x, -z, y). What is
 * read, and what throws, is cesium-bvh's `gltfTriangles`.
 * @param {ArrayBuffer | Uint8Array | object} gltf A binary glTF, or a glTF's JSON.
 * @param {ArrayBuffer | Uint8Array | (ArrayBuffer | Uint8Array)[]} [buffers] With a glTF's JSON, its binary
 *     buffer, or its buffers in order.
 * @param {Axis} [forwardAxis] The one a Model is loaded with: Axis.X, as here, or Cesium's default Axis.Z, which
 *     turns the triangles a quarter round z, (x, y, z) to (-y, x, z).
 * @return {GltfTriangles[]}
 */
export function gltfTriangles(gltf, buffers, forwardAxis = Axis.X) {
  const frame = forwardAxis === Axis.Z ? Matrix4.multiplyTransformation(yUpToZUp, zUpToXUp, new Matrix4()) : yUpToZUp;
  return readGltf(gltf, buffers, {frame: Matrix4.toArray(frame)});
}
