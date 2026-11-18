import {BoxGeometry, Cartesian3, Color, ColorGeometryInstanceAttribute, GeometryInstance, Matrix4, Ray} from '@cesium/core';
import {PerInstanceColorAppearance, Primitive} from '@cesium/engine';
/** @import {Globe, Scene} from '@cesium/engine' */

// The post-process stages only get the depth of the terrain when it is depth tested, and primitives drawn
// without it show through the terrain. Several users may need it at once (effects, a lens, a trail): the
// first one turns depth testing on, the last one restores it.
//
// Cesium clears the depth once for each frustum it draws in: a view of the sky alone has none, and the stages
// would read the depth of the last frame with something in it, the terrain of an earlier view. While a stage
// reads the depth, a box that writes neither color nor depth follows the camera ahead of it, so that there is
// always a frustum: this far, or as far as the camera is high, as the terrain under it, so that the box does not
// bring the near plane in front of the terrain, which would leave it out of the first frustum, the one whose depth
// the stages read, without a logarithmic depth buffer. A Primitive, moved by its model matrix, keeps a bounding sphere around the box; a
// point collection's grows to take in every place the point has been, and the frustums with it.
const AHEAD = 1000;

/**
 * Per scene, the users and the globe whose setting they changed, with the setting it had: the scene's globe may be
 * replaced, or added, in the meantime.
 * @type {WeakMap<Scene, {count: number, globe: Globe | undefined, previous: boolean}>}
 */
const users = new WeakMap();

/**
 * Per scene, the stages that read the depth, and the box that keeps a frustum, with what moves it.
 * @type {WeakMap<Scene, {count: number, box: Primitive, follow: () => void}>}
 */
const readers = new WeakMap();

const ray = new Ray();
const ahead = new Cartesian3();

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

/**
 * For a post-process stage that reads the depth: the terrain's depth, and a depth cleared in every view, of the
 * sky alone too.
 * @param {Scene} scene
 */
export function acquireDepthTexture(scene) {
  acquireTerrainDepth(scene);
  const reader = readers.get(scene);
  if (reader) {
    reader.count++;
    return;
  }
  const box = scene.primitives.add(
    new Primitive({
      geometryInstances: new GeometryInstance({
        geometry: BoxGeometry.fromDimensions({dimensions: new Cartesian3(1, 1, 1), vertexFormat: PerInstanceColorAppearance.FLAT_VERTEX_FORMAT}),
        attributes: {color: ColorGeometryInstanceAttribute.fromColor(Color.TRANSPARENT)},
      }),
      appearance: new PerInstanceColorAppearance({
        flat: true,
        translucent: false,
        renderState: {colorMask: {red: false, green: false, blue: false, alpha: false}, depthMask: false, depthTest: {enabled: false}},
      }),
      allowPicking: false,
      asynchronous: false,
    }),
  );
  const follow = () => {
    const camera = scene.camera;
    Cartesian3.clone(camera.positionWC, ray.origin);
    Cartesian3.clone(camera.directionWC, ray.direction);
    Matrix4.fromTranslation(Ray.getPoint(ray, Math.max(AHEAD, camera.positionCartographic.height), ahead), box.modelMatrix);
  };
  scene.preRender.addEventListener(follow);
  readers.set(scene, {count: 1, box, follow});
}

/**
 * @param {Scene} scene
 */
export function releaseDepthTexture(scene) {
  const reader = readers.get(scene);
  if (!reader) {
    return;
  }
  if (--reader.count === 0) {
    scene.preRender.removeEventListener(reader.follow);
    scene.primitives.remove(reader.box);
    readers.delete(scene);
  }
  releaseTerrainDepth(scene);
}
