import {PostProcessStage} from '@cesium/engine';
import Effect from './effect.js';
import LensDistortionShader from './shaders/LensDistortion.js';

/** @import {CesiumWidget} from '@cesium/engine' */

/**
 * The barrel distortion and dark corners of a wide-angle lens, like those of
 * FPV cameras.
 */
export default class LensDistortion extends Effect {
  #distortion;
  #vignette;

  /**
   * @param {CesiumWidget} viewer
   * @param {{distortion?: number, vignette?: number}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer);
    this.#distortion = options.distortion ?? 0.5;
    this.#vignette = options.vignette ?? 0.5;
  }

  /**
   * @override
   * @protected
   */
  createStage_() {
    const stage = new PostProcessStage({
      fragmentShader: LensDistortionShader,
      uniforms: {
        distortion: () => this.#distortion,
        vignette: () => this.#vignette,
      },
    });
    // no pass at all without distortion or vignette
    stage.enabled = this.#enabled();
    return stage;
  }

  #enabled() {
    return this.#distortion > 0 || this.#vignette > 0;
  }

  /**
   * Bending of straight lines toward the edges, 0 to 1.
   */
  get distortion() {
    return this.#distortion;
  }

  set distortion(value) {
    this.#distortion = value;
    this.#update();
  }

  /**
   * Darkening of the corners, 0 to 1.
   */
  get vignette() {
    return this.#vignette;
  }

  set vignette(value) {
    this.#vignette = value;
    this.#update();
  }

  #update() {
    if (this.stage_) {
      this.stage_.enabled = this.#enabled();
    }
    this.viewer.scene.requestRender();
  }
}
