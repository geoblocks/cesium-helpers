import {Cartesian2} from '@cesium/core';
import Toy from './toy.js';
import WhiteModelShader from './shaders/WhiteModel.js';

/** @import {Color} from '@cesium/core' */
/** @import {CesiumWidget} from '@cesium/engine' */

const valuesScratch = new Cartesian2();

/**
 * A white model's look, as an architect's plaster model or clay render: every color turned to its
 * value, the values pressed into a narrow range of whites (the darkest left black: a section's
 * poché), darker where surfaces meet, the edges lit and shaded and finely outlined as the toy's,
 * the sky a pale gradient if asked. A `Toy` with another grading: its options and properties,
 * `saturation` 0 (an accent's hue kept above it), `warm` the plaster's tint.
 */
export default class WhiteModel extends Toy {
  #values;
  #poche;
  #occlusion;
  #radius;

  /**
   * @param {CesiumWidget} viewer
   * @param {{name?: string, light?: number, shade?: number, bevel?: number, outline?: number, jump?: number, saturation?: number, warm?: [number, number, number], values?: [number, number], poche?: number, occlusion?: number, radius?: number, sky?: [Color, Color]}} [options]
   */
  constructor(viewer, options = {}) {
    // the toy's options, each the white model's default when not given, or given as undefined
    super(viewer, {
      ...options,
      light: options.light ?? 0.08,
      shade: options.shade ?? 0.12,
      outline: options.outline ?? 0.25,
      saturation: options.saturation ?? 0,
      warm: options.warm ?? [1, 0.995, 0.985],
    });
    this.#values = options.values ?? [0.35, 0.97];
    this.#poche = options.poche ?? 0.1;
    this.#occlusion = options.occlusion ?? 0.35;
    this.#radius = options.radius ?? 1.5;
  }

  /**
   * @override
   * @protected
   */
  shader_() {
    return WhiteModelShader;
  }

  /**
   * @override
   * @protected
   */
  uniforms_() {
    return {
      ...super.uniforms_(),
      values: () => Cartesian2.fromArray(this.#values, 0, valuesScratch),
      poche: () => this.#poche,
      occlusion: () => this.#occlusion,
      radius: () => this.#radius,
    };
  }

  /**
   * The darkest and the lightest values, from 0 to 1: the scene's black and its white.
   */
  get values() {
    return this.#values;
  }

  set values(value) {
    this.#values = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The value under which a color keeps it rather than being pressed into the whites, fading into
   * them about it: a section's poché, solid black; 0 to press every color.
   */
  get poche() {
    return this.#poche;
  }

  set poche(value) {
    this.#poche = value;
    this.viewer.scene.requestRender();
  }

  /**
   * How much darker the surfaces get where they meet, in a corner or at a wall's foot, 0 for none.
   */
  get occlusion() {
    return this.#occlusion;
  }

  set occlusion(value) {
    this.#occlusion = value;
    this.viewer.scene.requestRender();
  }

  /**
   * How wide the corners' shadow is, in meters, 48 pixels at the most.
   */
  get radius() {
    return this.#radius;
  }

  set radius(value) {
    this.#radius = value;
    this.viewer.scene.requestRender();
  }
}
