// FIXME: make key bindings configurable, add arrow keys

export default class CesiumWalk {
  /**
   * @param {import('cesium').Viewer} viewer
   * @param {number} [speed=1.6] Walk speed in meters per second.
   * @param {number} [height=2.0] Height of the camera above the terrain.
   */
  constructor(viewer, speed = 1.6, height = 2.0) {
    /**
     * @type {import('cesium').Viewer}
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
    this.lastTick;

    /**
     * @type {{forward: boolean, left: boolean, backward: boolean, right: boolean}}
     */
    this.buttons = {
      forward: false,
      left: false,
      backward: false,
      right: false,
    };

    /**
     * @type {function(KeyboardEvent): void}
     */
    this.handleKeyUpDownFunction = this.handleKeyUpDown.bind(this);

    /**
     * @type {function(): void}
     */
    this.handleTickFunction = this.handleTick.bind(this);
  }

  get active() {
    return this.active_;
  }

  set active(active) {
    this.active_ = active;
    if (this.active_) {
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

      if (this.buttons.forward) {
        camera.moveForward(distance);
      }
      if (this.buttons.left) {
        camera.moveLeft(distance);
      }
      if (this.buttons.backward) {
        camera.moveBackward(distance);
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
    const cameraHeight = camera.positionCartographic.height;

    camera.moveDown(cameraHeight - terrainHeight - this.height);
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
