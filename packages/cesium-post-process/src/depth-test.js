/** @import {Globe, Scene} from '@cesium/engine' */

// The post-process stages only get the depth of the terrain when it is depth tested, and primitives drawn
// without it show through the terrain. Several users may need it at once (effects, a lens, a trail): the
// first one turns depth testing on, the last one restores it.

/** @type {WeakMap<Globe, {count: number, previous: boolean}>} */
const users = new WeakMap();

/**
 * @param {Scene} scene
 */
export function acquireTerrainDepth(scene) {
  const globe = scene.globe;
  if (!globe) {
    return;
  }
  const user = users.get(globe);
  if (user) {
    user.count++;
    return;
  }
  users.set(globe, {count: 1, previous: globe.depthTestAgainstTerrain});
  globe.depthTestAgainstTerrain = true;
}

/**
 * @param {Scene} scene
 */
export function releaseTerrainDepth(scene) {
  const globe = scene.globe;
  const user = globe && users.get(globe);
  if (!globe || !user) {
    return;
  }
  if (--user.count === 0) {
    globe.depthTestAgainstTerrain = user.previous;
    users.delete(globe);
  }
}
