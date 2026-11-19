import {Cartesian3} from '@cesium/core';
/** @import {Scene} from '@cesium/engine' */

// Seen from above, Clouds draws the clouds over the rain under them, which Precipitation then
// leaves to them: the scenes where clouds are drawn, by the active Clouds, with their shadow maps,
// through which Precipitation lights its haze.

/**
 * A shadow map of the clouds: its texture, undefined until it is drawn, the ground point it is
 * centered on, its side, and the base and the top of the slab it covers.
 * @typedef {{texture: () => any, center: Cartesian3, extent: () => number, base: () => number, top: () => number}} CloudShadow
 */

/** @type {WeakMap<Scene, CloudShadow[]>} */
const covers = new WeakMap();

/**
 * @param {Scene} scene
 * @param {CloudShadow} shadow
 */
export function acquireCloudCover(scene, shadow) {
  covers.set(scene, [...(covers.get(scene) ?? []), shadow]);
}

/**
 * @param {Scene} scene
 * @param {CloudShadow} shadow
 */
export function releaseCloudCover(scene, shadow) {
  const shadows = (covers.get(scene) ?? []).filter((other) => other !== shadow);
  if (shadows.length > 0) {
    covers.set(scene, shadows);
  } else {
    covers.delete(scene);
  }
}

/**
 * Whether clouds are drawn in the scene.
 * @param {Scene} scene
 */
export function hasCloudCover(scene) {
  return covers.has(scene);
}

/**
 * The shadow map of the clouds drawn in the scene, the last activated's, or undefined without.
 * @param {Scene} scene
 */
export function cloudShadow(scene) {
  return covers.get(scene)?.at(-1);
}

/**
 * The uniforms of CloudsShadow.glsl for an effect lit through the clouds of its scene, and
 * `shadowed`, 1 while there are clouds: their shadow map, or the default texture without.
 * @param {Scene} scene
 */
export function cloudShadowUniforms(scene) {
  return {
    shadowed: () => (cloudShadow(scene) ? 1 : 0),
    // @ts-expect-error the scene's context is not typed
    shadowMap: () => cloudShadow(scene)?.texture() ?? scene.context.defaultTexture,
    shadowCenter: () => cloudShadow(scene)?.center ?? Cartesian3.ZERO,
    shadowExtent: () => cloudShadow(scene)?.extent() ?? 1,
    shadowBase: () => cloudShadow(scene)?.base() ?? 0,
    shadowTop: () => cloudShadow(scene)?.top() ?? 0,
  };
}
