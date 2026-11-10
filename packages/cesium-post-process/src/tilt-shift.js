import {Cartesian4} from '@cesium/core';
import {PostProcessStage, PostProcessStageComposite} from '@cesium/engine';
import createBlur from './blur.js';
import Effect from './effect.js';
import {eyeFocus} from './focus.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import TiltShiftShader from './shaders/TiltShift.js';

/** @import {Focus} from './focus.js' */
/** @import {CesiumWidget, Scene} from '@cesium/engine' */

const focusScratch = new Cartesian4();
// the blur's passes at half resolution, a quarter of their cost: the blurred image is soft anyway, read back
// bilinearly; its sigma counts the passes' pixels, twice the screen's
const BLUR_SCALE = 0.5;

/**
 * Tilt-shift: a narrow depth of field around the focus, which makes the scene
 * look like a scale model.
 */
export default class TiltShift extends Effect {
  #focus;
  #range;
  #blur;
  #saturation;

  /**
   * @param {CesiumWidget} viewer
   * @param {{name?: string, focus?: Focus, range?: number, blur?: number, saturation?: number}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer, options);
    this.terrainDepth_ = true;
    this.#focus = options.focus;
    this.#range = options.range ?? 0.3;
    this.#blur = options.blur ?? 4;
    this.#saturation = options.saturation ?? 0.3;
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  createStage_(scene) {
    const blur = createBlur('czm_tilt_shift_blur', BLUR_SCALE);
    const stage = new PostProcessStageComposite({
      ...this.named_,
      stages: [
        blur,
        new PostProcessStage({
          fragmentShader: EyeFromDepth + TiltShiftShader,
          uniforms: {
            blurTexture: blur.name,
            focus: () => eyeFocus(scene, this.#focus, focusScratch),
            range: () => this.#range,
            saturation: () => this.#saturation,
          },
        }),
      ],
      // both read the scene
      inputPreviousStageTexture: false,
      uniforms: blur.uniforms,
    });
    stage.uniforms.sigma = this.#blur * BLUR_SCALE;
    return stage;
  }

  /**
   * What to focus on: a position, a function returning one, or undefined for
   * what is in the middle of the screen.
   */
  get focus() {
    return this.#focus;
  }

  set focus(value) {
    this.#focus = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Width of the sharp band, in factors of two of the focal distance; with an orthographic camera,
   * in shares of the view's height.
   */
  get range() {
    return this.#range;
  }

  set range(value) {
    this.#range = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Blur away from the focus, the sigma of Cesium's blur stage in the screen's pixels.
   */
  get blur() {
    return this.#blur;
  }

  set blur(value) {
    this.#blur = value;
    if (this.stage_) {
      this.stage_.uniforms.sigma = value * BLUR_SCALE;
    }
    this.viewer.scene.requestRender();
  }

  /**
   * Color and contrast boost, 0 to 1.
   */
  get saturation() {
    return this.#saturation;
  }

  set saturation(value) {
    this.#saturation = value;
    this.viewer.scene.requestRender();
  }
}
