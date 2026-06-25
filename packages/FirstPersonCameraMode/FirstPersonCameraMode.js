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
    this.originalFov_ = undefined;
    this.movementX_ = 0;
    this.movementY_ = 0;

    this.onMouseMoveCallback_ = this.onMouseMove_.bind(this);
    this.onPostRenderCallback_ = this.onPostRender_.bind(this);
    this.onMouseWheelCallback_ = this.onMouseWheel_.bind(this);
    this.onPointerLockChangeCallback_ = this.onPointerLockChange_.bind(this);
    this.onPointerLockErrorCallback_ = (/** @type {Event} */ event) => console.error(event);

    document.addEventListener('pointerlockchange', this.onPointerLockChangeCallback_);
    document.addEventListener('pointerlockerror', this.onPointerLockErrorCallback_);
  }

  onPointerLockChange_() {
    this.scene_.screenSpaceCameraController.enableInputs = !this.active;
    const frustum = /** @type {import('cesium').PerspectiveFrustum} */ (this.scene_.camera.frustum);
    if (this.active) {
      // enter
      this.originalFov_ = frustum.fov;
      document.addEventListener('mousemove', this.onMouseMoveCallback_);
      this.scene_.postRender.addEventListener(this.onPostRenderCallback_);
      this.viewer_.screenSpaceEventHandler.setInputAction(this.onMouseWheelCallback_, ScreenSpaceEventType.WHEEL);
    } else {
      // leave
      frustum.fov = this.originalFov_;
      document.removeEventListener('mousemove', this.onMouseMoveCallback_);
      this.scene_.postRender.removeEventListener(this.onPostRenderCallback_);
      this.viewer_.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.WHEEL);
    }
  }

  get active() {
    return document.pointerLockElement !== null;
  }

  set active(active) {
    if (active) {
      this.scene_.canvas.requestPointerLock();
    } else if (this.active) {
      document.exitPointerLock();
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
    // Firefox bug: first pointerlock event fires movementX=-2, movementY=0 spuriously
    if (event.movementX !== 0 || event.movementY !== 0) {
      this.movementX_ += event.movementX;
      this.movementY_ += event.movementY;
      this.scene_.requestRender();
    }
  }

  onPostRender_() {
    const camera = this.scene_.camera;

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

  destroy() {
    if (this.active) {
      document.exitPointerLock();
    }
    document.removeEventListener('pointerlockchange', this.onPointerLockChangeCallback_);
    document.removeEventListener('pointerlockerror', this.onPointerLockErrorCallback_);
  }
}
