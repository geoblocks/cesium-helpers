import {PostProcessStage} from '@cesium/engine';
import ColorIsolationShader from './shaders/ColorIsolation.js';
import Hsl from './shaders/Hsl.js';

/**
 * Color isolation: one hue keeps its color, the rest of the scene turns gray.
 */
export default class ColorIsolation {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   * @param {{hue?: number, range?: number, strength?: number}} [options]
   */
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.hue_ = options.hue ?? 0;
    this.range_ = options.range ?? 60;
    this.strength_ = options.strength ?? 1;
    /** @type {PostProcessStage | undefined} */
    this.stage_ = undefined;
  }

  get active() {
    return this.stage_ !== undefined;
  }

  set active(active) {
    if (active === this.active) {
      return;
    }
    const scene = this.viewer.scene;
    if (active) {
      this.stage_ = new PostProcessStage({
        fragmentShader: Hsl + ColorIsolationShader,
        uniforms: {
          hue: () => this.hue_ / 360,
          range: () => this.range_ / 360,
          strength: () => this.strength_,
        },
      });
      scene.postProcessStages.add(this.stage_);
    } else {
      // removing a stage also destroys it
      scene.postProcessStages.remove(/** @type {PostProcessStage} */ (this.stage_));
      this.stage_ = undefined;
    }
    scene.requestRender();
  }

  /**
   * Hue kept in color, in degrees: 0 red, 60 yellow, 120 green, 180 cyan,
   * 240 blue, 300 magenta.
   */
  get hue() {
    return this.hue_;
  }

  set hue(value) {
    this.hue_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Half width of the hues kept, in degrees.
   */
  get range() {
    return this.range_;
  }

  set range(value) {
    this.range_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * How gray the rest turns, 0 to 1.
   */
  get strength() {
    return this.strength_;
  }

  set strength(value) {
    this.strength_ = value;
    this.viewer.scene.requestRender();
  }

  destroy() {
    this.active = false;
  }
}
