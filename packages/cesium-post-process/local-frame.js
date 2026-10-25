import {Matrix4} from '@cesium/core';

/**
 * The local frame's coordinates from the eye's, for a shader that wants a pixel's place in a small frame (east-north-up about a point) to
 * lay a pattern over the ground that stays where it is as the camera moves. Made in double precision on the CPU: the globe's offset
 * (about 6.4 million meters) cancels in the product, so the matrix a shader gets is small and a place comes out to the millimeter. In world
 * coordinates, a single precision float steps by half a meter.
 * @param {Matrix4} frame The local frame in the world, such as `FixedFrameTransforms.eastNorthUpToFixedFrame(origin)`.
 * @param {Matrix4} viewMatrix The camera's view matrix.
 * @param {Matrix4} [result]
 * @return {Matrix4}
 */
export function localFromEye(frame, viewMatrix, result = new Matrix4()) {
  return Matrix4.inverseTransformation(Matrix4.multiply(viewMatrix, frame, result), result);
}
