import {Cartesian3, Math as CesiumMath} from '@cesium/core';
import {PostProcessStage} from '@cesium/engine';
import Effect from './effect.js';
import DroneDisplayShader from './shaders/DroneDisplay.js';

/** @import {CesiumWidget, Scene} from '@cesium/engine' */

// a 3S battery, full, empty, the seconds it takes to drain between them at the cruise throttle,
// and how far its voltage sags at full throttle
const FULL_VOLTS = 12.6;
const EMPTY_VOLTS = 10.5;
const DRAIN_SECONDS = 2400;
const SAG_VOLTS = 0.4;
// the throttle in percent at cruise, and more of it per m/s of climb
const CRUISE_THROTTLE = 70;
const CLIMB_THROTTLE = 5;
// seconds for the speeds to get two thirds of the way to the camera's; after a pause longer than
// the gap, as in requestRenderMode, the motion is not measured across it
const SMOOTHING = 0.5;
const GAP = 0.5;

/** @typedef {{time: number, height: number, drained: number}} Takeoff When a display turned on, the camera's height then, and the share of the battery drained since. */

/**
 * A fixed-wing plane's OSD as ArduPilot draws it on an HD video system, in the
 * blocky white glyphs of an analog chip with some in color: an artificial
 * horizon of dots following the camera's pitch and roll as ArduPilot's does,
 * the flight mode, the heading, the altitude since the display turned on, the
 * vertical speed and the air speed of the camera, the throttle following its
 * climb, the battery voltage draining with the throttle, and a made-up link
 * quality; and in failsafe while the control link is lost, the RTL mode and the
 * FAILSAFE warning.
 */
export default class DroneDisplay extends Effect {
  #opacity;
  #rxLoss = false;
  // when the display turned on, and the camera's height then
  #startTime = 0;
  #startHeight = 0;
  // the camera's speed and vertical speed in m/s, smoothed, from its position and height at the
  // previous frame
  #speed = 0;
  #verticalSpeed = 0;
  #previousPosition = new Cartesian3();
  #previousHeight = 0;
  #previousTime = 0;
  // the share of the battery drained
  #drained = 0;
  #onPostRender;

  /**
   * @param {CesiumWidget} viewer
   * @param {{opacity?: number}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer);
    this.#opacity = options.opacity ?? 1;
    this.#onPostRender = () => this.#measure(false);
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  createStage_(scene) {
    return new PostProcessStage({
      fragmentShader: DroneDisplayShader,
      uniforms: {
        opacity: () => this.#opacity,
        pitch: () => CesiumMath.toDegrees(scene.camera.pitch),
        roll: () => CesiumMath.toDegrees(CesiumMath.negativePiToPi(scene.camera.roll)),
        heading: () => CesiumMath.toDegrees(scene.camera.heading),
        altitude: () => scene.camera.positionCartographic.height - this.#startHeight,
        verticalSpeed: () => this.#verticalSpeed,
        speed: () => this.#speed * 3.6,
        voltage: () => this.#voltage(),
        linkQuality: () => this.#linkQuality(),
        throttle: () => this.#throttle(),
        failsafe: () => (this.#rxLoss ? 1 : 0),
        // twice per second, as ArduPilot's blinking
        blink: () => (Math.floor(performance.now() / 250) % 2 === 0 ? 1 : 0),
      },
    });
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  activated_(scene) {
    this.#startTime = performance.now() / 1000;
    this.#startHeight = scene.camera.positionCartographic.height;
    this.#speed = 0;
    this.#verticalSpeed = 0;
    this.#drained = 0;
    this.#measure(true);
    scene.postRender.addEventListener(this.#onPostRender);
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  deactivating_(scene) {
    scene.postRender.removeEventListener(this.#onPostRender);
  }

  /**
   * Eases the speeds toward the camera's motion since the previous frame, and
   * drains the battery at the throttle.
   * @param {boolean} first whether there is no previous frame
   */
  #measure(first) {
    const camera = this.viewer.scene.camera;
    const time = performance.now() / 1000;
    const height = camera.positionCartographic.height;
    const dt = time - this.#previousTime;
    if (!first && dt > 0 && dt < GAP) {
      const ease = 1 - Math.exp(-dt / SMOOTHING);
      this.#speed += (Cartesian3.distance(camera.positionWC, this.#previousPosition) / dt - this.#speed) * ease;
      this.#verticalSpeed += ((height - this.#previousHeight) / dt - this.#verticalSpeed) * ease;
    }
    if (!first) {
      this.#drained += (dt / DRAIN_SECONDS) * (this.#throttle() / CRUISE_THROTTLE);
    }
    Cartesian3.clone(camera.positionWC, this.#previousPosition);
    this.#previousHeight = height;
    this.#previousTime = time;
  }

  // the battery drains over the flight, and sags under the throttle's load
  #voltage() {
    const drained = (FULL_VOLTS - EMPTY_VOLTS) * Math.min(this.#drained, 1);
    return FULL_VOLTS - drained - (SAG_VOLTS * this.#throttle()) / 100;
  }

  // the link hovers in the nineties, with a deep dip once in a while
  #linkQuality() {
    const seconds = performance.now() / 1000 - this.#startTime;
    const wander = 4 * Math.abs(Math.sin(seconds * 0.9) * Math.sin(seconds * 0.37));
    const dip = Math.sin(seconds * 0.11) > 0.97 ? 35 : 0;
    return Math.round(99 - wander - dip);
  }

  // the throttle holds the cruise, more of it climbing and less diving, wandering a little
  #throttle() {
    const seconds = performance.now() / 1000 - this.#startTime;
    const wander = 2 * Math.sin(seconds * 0.3) * Math.sin(seconds * 0.13 + 1);
    return Math.round(CesiumMath.clamp(CRUISE_THROTTLE + CLIMB_THROTTLE * this.#verticalSpeed + wander, 0, 100));
  }

  /**
   * Opacity of the display, 0 to 1.
   */
  get opacity() {
    return this.#opacity;
  }

  set opacity(value) {
    this.#opacity = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Whether the control link is lost: the mode turns to RTL, the link bar to
   * red, and the FAILSAFE warning blinks below the middle. It blinks only while
   * the scene renders.
   */
  get rxLoss() {
    return this.#rxLoss;
  }

  set rxLoss(value) {
    this.#rxLoss = value;
    this.viewer.scene.requestRender();
  }

  /**
   * When the display turned on, in performance.now()'s seconds, the camera's height then, in meters,
   * and the share of the battery drained since, 0 to 1: what the altitude and the battery count
   * from. Activating the display sets it; a display removed and added again to put a stage before it
   * keeps its flight by setting it back.
   * @type {Takeoff}
   */
  get takeoff() {
    return {time: this.#startTime, height: this.#startHeight, drained: this.#drained};
  }

  set takeoff({time, height, drained}) {
    this.#startTime = time;
    this.#startHeight = height;
    this.#drained = drained;
    this.viewer.scene.requestRender();
  }
}
