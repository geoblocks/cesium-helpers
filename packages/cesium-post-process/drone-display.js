import {Math as CesiumMath, PostProcessStage} from '@cesium/engine';
import Effect from './effect.js';
import DroneDisplayShader from './shaders/DroneDisplay.js';

// a 4S battery, full, empty, and the seconds it takes to drain between them
const FULL_VOLTS = 16.8;
const EMPTY_VOLTS = 14.0;
const DRAIN_SECONDS = 600;
// the reticles, as the shader numbers them
const RETICLES = ['ring', 'v', 'heart'];

/**
 * A Betaflight analog OSD: an artificial horizon of bars following the
 * camera's pitch and roll as Betaflight's does, sidebars with level markers, a
 * cross in the middle, and the altitude since the display turned on, the
 * battery voltage and the link quality (the last two made up), in the blocky
 * white style of the MAX7456 chip.
 */
export default class DroneDisplay extends Effect {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   * @param {{opacity?: number, reticle?: 'ring' | 'v' | 'heart'}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer);
    this.opacity_ = options.opacity ?? 1;
    this.reticle_ = options.reticle ?? 'v';
    // when the display turned on, and the camera's height then
    this.startTime_ = 0;
    this.startHeight_ = 0;
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} scene
   */
  createStage_(scene) {
    return new PostProcessStage({
      fragmentShader: DroneDisplayShader,
      uniforms: {
        opacity: () => this.opacity_,
        pitch: () => CesiumMath.toDegrees(scene.camera.pitch),
        roll: () => CesiumMath.toDegrees(CesiumMath.negativePiToPi(scene.camera.roll)),
        altitude: () => scene.camera.positionCartographic.height - this.startHeight_,
        voltage: () => this.voltage_(),
        linkQuality: () => this.linkQuality_(),
        reticle: () => Math.max(RETICLES.indexOf(this.reticle_), 0),
      },
    });
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} scene
   */
  activated_(scene) {
    this.startTime_ = performance.now() / 1000;
    this.startHeight_ = scene.camera.positionCartographic.height;
  }

  // the battery drains over the flight, and sags a little now and then
  voltage_() {
    const seconds = performance.now() / 1000 - this.startTime_;
    const drained = (FULL_VOLTS - EMPTY_VOLTS) * Math.min(seconds / DRAIN_SECONDS, 1);
    const sag = 0.1 * Math.max(0, Math.sin(seconds * 0.7) * Math.sin(seconds * 0.23));
    return FULL_VOLTS - drained - sag;
  }

  // the link hovers in the nineties, with a deep dip once in a while
  linkQuality_() {
    const seconds = performance.now() / 1000 - this.startTime_;
    const wander = 4 * Math.abs(Math.sin(seconds * 0.9) * Math.sin(seconds * 0.37));
    const dip = Math.sin(seconds * 0.11) > 0.97 ? 35 : 0;
    return Math.round(99 - wander - dip);
  }

  /**
   * Opacity of the display, 0 to 1.
   */
  get opacity() {
    return this.opacity_;
  }

  set opacity(value) {
    this.opacity_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The mark in the middle: a custom glyph as operators upload one, 'v' (the
   * default) or 'heart', or 'ring' for Betaflight's cross, a ring with ticks.
   */
  get reticle() {
    return this.reticle_;
  }

  set reticle(value) {
    this.reticle_ = value;
    this.viewer.scene.requestRender();
  }
}
