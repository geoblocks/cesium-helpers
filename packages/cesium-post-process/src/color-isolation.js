import {PostProcessStage} from '@cesium/engine';
import Effect from './effect.js';
import ColorIsolationShader from './shaders/ColorIsolation.js';

/** @import {CesiumWidget} from '@cesium/engine' */

/**
 * Color isolation: one hue keeps its color, the rest of the scene turns gray.
 */
export default class ColorIsolation extends Effect {
  #hue;
  #range;
  #strength;

  /**
   * @param {CesiumWidget} viewer
   * @param {{name?: string, hue?: number, range?: number, strength?: number}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer, options);
    this.#hue = options.hue ?? 0;
    this.#range = options.range ?? 60;
    this.#strength = options.strength ?? 1;
  }

  /**
   * @override
   * @protected
   */
  createStage_() {
    return new PostProcessStage({
      ...this.named_,
      fragmentShader: ColorIsolationShader,
      uniforms: {
        hue: () => this.#hue / 360,
        range: () => this.#range / 360,
        strength: () => this.#strength,
      },
    });
  }

  /**
   * Hue kept in color, in degrees: 0 red, 60 yellow, 120 green, 180 cyan,
   * 240 blue, 300 magenta.
   */
  get hue() {
    return this.#hue;
  }

  set hue(value) {
    this.#hue = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Half width of the hues kept, in degrees.
   */
  get range() {
    return this.#range;
  }

  set range(value) {
    this.#range = value;
    this.viewer.scene.requestRender();
  }

  /**
   * How gray the rest turns, 0 to 1.
   */
  get strength() {
    return this.#strength;
  }

  set strength(value) {
    this.#strength = value;
    this.viewer.scene.requestRender();
  }
}
