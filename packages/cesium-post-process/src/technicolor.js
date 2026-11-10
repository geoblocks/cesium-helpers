import {PostProcessStage} from '@cesium/engine';
import Effect from './effect.js';
import Frame from './shaders/Frame.js';
import TechnicolorShader from './shaders/Technicolor.js';

/** @import {CesiumWidget} from '@cesium/engine' */

/**
 * Three-strip Technicolor: dense, saturated primaries, as the films of the
 * 1930s to 1950s.
 */
export default class Technicolor extends Effect {
  #strength;
  #aspectRatio;

  /**
   * @param {CesiumWidget} viewer
   * @param {{name?: string, strength?: number, aspectRatio?: number}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer, options);
    this.#strength = options.strength ?? 1;
    this.#aspectRatio = options.aspectRatio ?? 0;
  }

  /**
   * @override
   * @protected
   */
  createStage_() {
    return new PostProcessStage({
      ...this.named_,
      fragmentShader: Frame + TechnicolorShader,
      uniforms: {
        strength: () => this.#strength,
        aspectRatio: () => this.#aspectRatio,
      },
    });
  }

  /**
   * How far from the original colors, 0 to 1.
   */
  get strength() {
    return this.#strength;
  }

  set strength(value) {
    this.#strength = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Width over height of the visible frame, black bars around it; 0 for the
   * whole canvas. 1.37 is the Academy ratio of the era.
   */
  get aspectRatio() {
    return this.#aspectRatio;
  }

  set aspectRatio(value) {
    this.#aspectRatio = value;
    this.viewer.scene.requestRender();
  }
}
