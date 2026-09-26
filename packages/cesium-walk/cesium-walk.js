// FIXME: make key bindings configurable, add arrow keys

import {Cartesian3, Math as CesiumMath} from "@cesium/engine";

const normalScratch = new Cartesian3();
const forwardScratch = new Cartesian3();

export default class CesiumWalk {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   * @param {number} [speed=1.6] Walk speed in meters per second.
   * @param {number} [height=2.0] Height of the camera above the terrain.
   */
  constructor(viewer, speed = 1.6, height = 2.0) {
    /**
     * @type {import('@cesium/engine').CesiumWidget}
     */
    this.viewer = viewer;

    /**
     * @type {number}
     */
    this.speed = speed;

    /**
     * @type {number}
     */
    this.height = height;

    /**
     * @type {boolean}
     */
    this.active_ = false;

    /**
     * @type {number}
     */
    this.lastTick = 0;

    /**
     * @type {{forward: boolean, left: boolean, backward: boolean, right: boolean}}
     */
    this.buttons = {
      forward: false,
      left: false,
      backward: false,
      right: false,
    };

    this.handleKeyUpDownFunction = this.handleKeyUpDown.bind(this);

    this.handleTickFunction = this.handleTick.bind(this);
  }

  get active() {
    return this.active_;
  }

  set active(active) {
    if (active === this.active_) {
      return;
    }
    this.active_ = active;
    if (this.active_) {
      this.lastTick = performance.now();
      document.addEventListener("keydown", this.handleKeyUpDownFunction);
      document.addEventListener("keyup", this.handleKeyUpDownFunction);
      this.viewer.clock.onTick.addEventListener(this.handleTickFunction);
      this.clampCameraToTerrain();
    } else {
      document.removeEventListener("keydown", this.handleKeyUpDownFunction);
      document.removeEventListener("keyup", this.handleKeyUpDownFunction);
      this.viewer.clock.onTick.removeEventListener(this.handleTickFunction);
    }
    this.enableNavigation(!this.active_);
  }

  /**
   * @param {KeyboardEvent} event
   */
  handleKeyUpDown(event) {
    const pressed = event.type === "keydown";
    switch (event.key) {
      case "w":
        this.buttons.forward = pressed;
        break;
      case "a":
        this.buttons.left = pressed;
        break;
      case "s":
        this.buttons.backward = pressed;
        break;
      case "d":
        this.buttons.right = pressed;
        break;
    }
  }

  handleTick() {
    const timestamp = performance.now();
    if (this.needsTick()) {
      const camera = this.viewer.camera;
      const deltaTime = timestamp - this.lastTick;

      const distance = (this.speed * deltaTime) / 1000;

      if (this.buttons.forward !== this.buttons.backward) {
        // walk along the view direction projected onto the ground plane,
        // so that looking down does not push the camera into the terrain
        const normal = this.surfaceNormal();
        const forward = Cartesian3.multiplyByScalar(
          normal,
          Cartesian3.dot(camera.direction, normal),
          forwardScratch
        );
        Cartesian3.subtract(camera.direction, forward, forward);
        if (Cartesian3.magnitude(forward) > CesiumMath.EPSILON6) {
          Cartesian3.normalize(forward, forward);
          camera.move(forward, this.buttons.forward ? distance : -distance);
        }
      }
      if (this.buttons.left) {
        camera.moveLeft(distance);
      }
      if (this.buttons.right) {
        camera.moveRight(distance);
      }
      this.clampCameraToTerrain();
    }

    this.lastTick = timestamp;
  }

  clampCameraToTerrain() {
    const camera = this.viewer.camera;
    const terrainHeight = this.viewer.scene.globe.getHeight(
      camera.positionCartographic
    );
    if (terrainHeight === undefined) {
      // terrain not loaded yet at this position
      return;
    }
    const cameraHeight = camera.positionCartographic.height;

    // move along the surface normal, not the camera up vector, which is
    // tilted when the camera is pitched
    camera.move(this.surfaceNormal(), terrainHeight + this.height - cameraHeight);
  }

  /**
   * @return {import('@cesium/engine').Cartesian3} The ellipsoid surface normal at the camera position.
   */
  surfaceNormal() {
    const scene = this.viewer.scene;
    return scene.globe.ellipsoid.geodeticSurfaceNormal(scene.camera.position, normalScratch);
  }

  /**
   * @return {boolean}
   */
  needsTick() {
    return (
      this.buttons.forward ||
      this.buttons.left ||
      this.buttons.backward ||
      this.buttons.right
    );
  }

  /**
   * Enable or disable cesium navigation interactions.
   * @param {boolean} enable
   */
  enableNavigation(enable) {
    const controller = this.viewer.scene.screenSpaceCameraController;
    controller.enableTranslate = enable;
    controller.enableZoom = enable;
    controller.enableRotate = enable;
    controller.enableTilt = enable;
  }
}
