import {Math as CesiumMath} from '@cesium/core';

/**
 * GLSL's smoothstep (CesiumMath has none).
 * @param {number} edge0
 * @param {number} edge1
 * @param {number} x
 */
export function smoothstep(edge0, edge1, x) {
  const t = CesiumMath.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
