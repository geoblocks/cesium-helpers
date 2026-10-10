import {Cartesian3, Cartesian4} from '@cesium/core';
import {PostProcessStage} from '@cesium/engine';
import {acquireTerrainDepth, releaseTerrainDepth} from './depth-test.js';
import Effect from './effect.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import ToyShader from './shaders/Toy.js';

const NO_SKY = new Cartesian4(0, 0, 0, 0);
const warmScratch = new Cartesian3();
const skyTopScratch = new Cartesian4();
const skyBottomScratch = new Cartesian4();

/**
 * A toy's look, as an isometric game's: the edges lit where the surface bends
 * outward and shaded where it bends inward, the colors a little richer and
 * warmer, the sky a soft gradient if asked.
 */
export default class Toy extends Effect {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   * @param {{light?: number, shade?: number, saturation?: number, warm?: [number, number, number], sky?: [import('@cesium/core').Color, import('@cesium/core').Color]}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer);
    this.light_ = options.light ?? 0.22;
    this.shade_ = options.shade ?? 0.18;
    this.saturation_ = options.saturation ?? 1.04;
    this.warm_ = options.warm ?? [1.03, 1, 0.95];
    this.sky_ = options.sky;
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} _scene
   */
  createStage_(_scene) {
    const color = (/** @type {import('@cesium/core').Color} */ c, /** @type {Cartesian4} */ result) => Cartesian4.fromElements(c.red, c.green, c.blue, 1, result);
    return new PostProcessStage({
      fragmentShader: EyeFromDepth + ToyShader,
      uniforms: {
        light: () => this.light_,
        shade: () => this.shade_,
        saturation: () => this.saturation_,
        warm: () => Cartesian3.fromArray(this.warm_, 0, warmScratch),
        skyTop: () => this.sky_ ? color(this.sky_[0], skyTopScratch) : NO_SKY,
        skyBottom: () => this.sky_ ? color(this.sky_[1], skyBottomScratch) : NO_SKY,
      },
    });
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
   * How much brighter a convex edge gets, 0 for none.
   */
  get light() {
    return this.light_;
  }

  set light(value) {
    this.light_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * How much darker a concave edge gets, 0 for none.
   */
  get shade() {
    return this.shade_;
  }

  set shade(value) {
    this.shade_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The colors' saturation, 1 to keep it.
   */
  get saturation() {
    return this.saturation_;
  }

  set saturation(value) {
    this.saturation_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * A factor each of red, green and blue; [1, 1, 1] to keep the colors.
   */
  get warm() {
    return this.warm_;
  }

  set warm(value) {
    this.warm_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The sky's gradient, its color at the top of the screen and at its bottom;
   * undefined to keep the sky.
   */
  get sky() {
    return this.sky_;
  }

  set sky(value) {
    this.sky_ = value;
    this.viewer.scene.requestRender();
  }
}
