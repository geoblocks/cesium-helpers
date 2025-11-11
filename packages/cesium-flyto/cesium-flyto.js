import { ScreenSpaceEventType } from "@cesium/engine";

export default class CesiumFlyTo {

  /**
   * @param {import('@cesium/engine').Viewer} viewer
   * @param {ScreenSpaceEventType} [modifier=ScreenSpaceEventType.LEFT_DOUBLE_CLICK]
   * @param {number} [height=300]
   * @param {number} [duration]
   */
  constructor(viewer, modifier = ScreenSpaceEventType.LEFT_DOUBLE_CLICK, height = 300, duration = undefined) {
    this.viewer = viewer;
    this.height = height;
    this.duration = duration;
    this.viewer.screenSpaceEventHandler.setInputAction(this.onInputAction.bind(this), modifier);
  }

  onInputAction(movement) {
    const scene = this.viewer.scene;
    const ray = scene.camera.getPickRay(movement.position);
    const intersection = scene.globe.pick(ray, scene);
    if (intersection) {
      const cartographic = scene.globe.ellipsoid.cartesianToCartographic(intersection);
      // FIXME: instead of adding a fixed height, follow the ray to the intersection minus the height
      cartographic.height += this.height;
      const destination = scene.globe.ellipsoid.cartographicToCartesian(cartographic);
      scene.camera.flyTo({
        destination: destination,
        duration: this.duration,
        orientation: {
          // FIXME: use ray heading ?
          heading: scene.camera.heading,
          pitch: scene.camera.pitch,
          roll: scene.camera.roll,
        }
      });
    }
  }
}
