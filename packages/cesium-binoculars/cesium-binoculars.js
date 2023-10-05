import { ScreenSpaceEventType, Math as CesiumMath } from "cesium";

export default class CesiumBinoculars {
  /**
   * @param {import('cesium').Viewer} viewer
   * @param {number} [zoomFactor]
   */
  constructor(viewer, zoomFactor = Math.PI / 36) {
    this.viewer = viewer;
    this.zoomFactor_ = zoomFactor;
    this.originalFov_ = undefined;
    this.active_ = false;

    this.onMouseWheel_ = this.onMouseWheel.bind(this);
  }

  get active() {
    return this.active_;
  }

  set active(active) {
    if (active === this.active_) {
      return;
    }
    this.active_ = active;
    this.viewer.scene.screenSpaceCameraController.enableZoom = !active;
    const frustum = /** @type {import('cesium').PerspectiveFrustum} */ (this.viewer.scene.camera.frustum);
    if (active) {
      this.originalFov_ = frustum.fov;
      this.viewer.screenSpaceEventHandler.setInputAction(this.onMouseWheel_, ScreenSpaceEventType.WHEEL);
    } else {
      frustum.fov = this.originalFov_;
      this.viewer.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.WHEEL);
    }
  }

  /**
   * @param {number} movement
   */
  onMouseWheel(movement) {
    const frustum = /** @type {import('cesium').PerspectiveFrustum} */ (
      this.viewer.scene.camera.frustum
    );
    const fov =
      frustum.fov + (movement > 0 ? -this.zoomFactor_ : this.zoomFactor_);
    frustum.fov = CesiumMath.clamp(
      fov,
      CesiumMath.toRadians(1),
      CesiumMath.toRadians(60)
    );
  }
}
