import {ScreenSpaceEventType, Math as CesiumMath} from '@cesium/engine';

export default class FirstPersonCameraMode {

  /**
   * @param {import('cesium').Viewer} viewer
   * @param {number} [zoomFactor=Math.PI / 36]
   * @param {number} [movementFactor=0.003]
   */
  constructor(viewer, zoomFactor = Math.PI / 36, movementFactor = 0.003) {
    this.viewer_ = viewer;
    this.scene_ = viewer.scene;

    this.movementFactor_ = movementFactor;

    this.zoomFactor_ = zoomFactor;

    this.originalFov_;

    this.movementX_ = 0;

    this.movementY_ = 0;

    const onMouseMoveCallback = this.onMouseMove_.bind(this);
    const onPostRenderCallback = this.onPostRender_.bind(this);
    const onMouseWheelCallback = this.onMouseWheel_.bind(this);

    document.addEventListener('pointerlockchange', event => {
      this.scene_.screenSpaceCameraController.enableInputs = !this.active;
      const frustum = /** @type {import('cesium').PerspectiveFrustum} */ (this.scene_.camera.frustum);
      if (this.active) {
        // enter
        this.originalFov_ = frustum.fov;
        document.addEventListener('mousemove', onMouseMoveCallback);
        this.scene_.postRender.addEventListener(onPostRenderCallback);
        this.viewer_.screenSpaceEventHandler.setInputAction(onMouseWheelCallback, ScreenSpaceEventType.WHEEL);
      } else {
        // leave
        frustum.fov = this.originalFov_;
        document.removeEventListener('mousemove', onMouseMoveCallback);
        this.scene_.postRender.removeEventListener(onPostRenderCallback);
        this.viewer_.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.WHEEL);
      }
    });

    document.addEventListener('pointerlockerror', event => {
      console.error(event);
    });
  }

  get active() {
    return document.pointerLockElement !== null;
  }

  set active(active) {
    if (active) {
      this.scene_.canvas.requestPointerLock();
    }
  }

  /**
   * @param {number} movement
   */
  onMouseWheel_(movement) {
    const frustum = /** @type {import('cesium').PerspectiveFrustum} */ (this.scene_.camera.frustum);
    const fov = frustum.fov + (movement > 0 ? -this.zoomFactor_ : this.zoomFactor_);
    frustum.fov = CesiumMath.clamp(fov, CesiumMath.toRadians(1), CesiumMath.toRadians(60));
  }

  /**
   * @param {MouseEvent} event
   */
  onMouseMove_(event) {
    if (event.movementX && event.movementY) {
      // the condition workarounds https://bugzilla.mozilla.org/show_bug.cgi?id=1417702
      // in Firefox, event.movementX is -2 even though there is no movement
      this.movementX_ += event.movementX;
      this.movementY_ += event.movementY;
      this.scene_.requestRender();
    }
  }

  onPostRender_() {
    const camera = this.scene_.camera;

    // update camera orientation
    const heading = camera.heading + (this.movementX_ * this.movementFactor_);
    this.movementX_ = 0;

    const pitch = camera.pitch - (this.movementY_ * this.movementFactor_);
    this.movementY_ = 0;

    camera.setView({
      orientation: {
        heading: heading,
        pitch: pitch
      }
    });
  }
}
