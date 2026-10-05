import {PostProcessStage} from '@cesium/engine';
import {acquireTerrainDepth, releaseTerrainDepth} from './depth-test.js';
import Effect from './effect.js';
import {heightUniforms} from './height.js';
import AlpenglowShader from './shaders/Alpenglow.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import Height from './shaders/Height.js';
import Normal from './shaders/Normal.js';

/**
 * The red light of the low sun on the peaks, above an altitude, while the
 * valleys below are in shadow.
 */
export default class Alpenglow extends Effect {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   * @param {{altitude?: number, transition?: number, strength?: number}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer);
    this.altitude_ = options.altitude ?? 2500;
    this.transition_ = options.transition ?? 500;
    this.strength_ = options.strength ?? 1;
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} scene
   */
  createStage_(scene) {
    const stage = new PostProcessStage({
      fragmentShader: EyeFromDepth + Height + Normal + AlpenglowShader,
      uniforms: {
        ...heightUniforms(scene),
        altitude: () => this.altitude_,
        transition: () => this.transition_,
        strength: () => this.strength_,
      },
    });
    stage.enabled = this.strength_ > 0;
    return stage;
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} scene
   */
  activated_(scene) {
    acquireTerrainDepth(scene);
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} scene
   */
  deactivating_(scene) {
    releaseTerrainDepth(scene);
  }

  /**
   * Altitude above which the peaks glow, in meters above the ellipsoid.
   */
  get altitude() {
    return this.altitude_;
  }

  set altitude(value) {
    this.altitude_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Height of the band around the altitude over which the glow fades into the shadow, in meters.
   */
  get transition() {
    return this.transition_;
  }

  set transition(value) {
    this.transition_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Strength of the effect, 0 to 1.
   */
  get strength() {
    return this.strength_;
  }

  set strength(value) {
    this.strength_ = value;
    if (this.stage_) {
      this.stage_.enabled = value > 0;
    }
    this.viewer.scene.requestRender();
  }
}
