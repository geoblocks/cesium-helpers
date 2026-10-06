// Seen from above, Clouds draws the clouds over the rain under them, which Precipitation then
// leaves to them: the scenes where clouds are drawn, by as many active Clouds as there are.

/** @type {WeakMap<import('@cesium/engine').Scene, number>} */
const covers = new WeakMap();

/**
 * @param {import('@cesium/engine').Scene} scene
 */
export function acquireCloudCover(scene) {
  covers.set(scene, (covers.get(scene) ?? 0) + 1);
}

/**
 * @param {import('@cesium/engine').Scene} scene
 */
export function releaseCloudCover(scene) {
  const count = (covers.get(scene) ?? 0) - 1;
  if (count > 0) {
    covers.set(scene, count);
  } else {
    covers.delete(scene);
  }
}

/**
 * Whether clouds are drawn in the scene.
 * @param {import('@cesium/engine').Scene} scene
 */
export function hasCloudCover(scene) {
  return covers.has(scene);
}
