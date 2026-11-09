/** @import {Globe, Scene} from '@cesium/engine' */

// The post-process stages only get the depth of the terrain when it is depth tested, and primitives drawn
// without it show through the terrain. Several users may need it at once (effects, a lens, a trail): the
// first one turns depth testing on, the last one restores it.

/**
 * Per scene, the users and the globe whose setting they changed, with the setting it had: the scene's globe may be
 * replaced, or added, in the meantime.
 * @type {WeakMap<Scene, {count: number, globe: Globe | undefined, previous: boolean}>}
 */
const users = new WeakMap();

/**
 * @param {Scene} scene
 */
export function acquireTerrainDepth(scene) {
  const user = users.get(scene);
  if (user) {
    user.count++;
    return;
  }
  const globe = scene.globe;
  users.set(scene, {count: 1, globe, previous: globe?.depthTestAgainstTerrain ?? false});
  if (globe) {
    globe.depthTestAgainstTerrain = true;
  }
}

/**
 * @param {Scene} scene
 */
export function releaseTerrainDepth(scene) {
  const user = users.get(scene);
  if (!user) {
    return;
  }
  if (--user.count === 0) {
    if (user.globe) {
      user.globe.depthTestAgainstTerrain = user.previous;
    }
    users.delete(scene);
  }
}
